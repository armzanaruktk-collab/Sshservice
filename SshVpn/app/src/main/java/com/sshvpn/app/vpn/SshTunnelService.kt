package com.sshvpn.app.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.jcraft.jsch.JSch
import com.jcraft.jsch.Session
import com.jcraft.jsch.SocketFactory
import com.sshvpn.app.data.SshProfile
import com.sshvpn.app.data.Store
import hev.htproxy.TProxyService
import java.io.File
import java.net.InetSocketAddress
import java.net.Socket

class SshTunnelService : VpnService() {

    companion object {
        const val ACTION_START = "com.sshvpn.app.START"
        const val ACTION_STOP = "com.sshvpn.app.STOP"
        const val EXTRA_PROFILE = "profile_id"
        private const val CHANNEL = "vpn"

        fun start(ctx: Context, profileId: String) {
            ContextCompat.startForegroundService(
                ctx,
                Intent(ctx, SshTunnelService::class.java).setAction(ACTION_START)
                    .putExtra(EXTRA_PROFILE, profileId)
            )
        }

        fun stop(ctx: Context) {
            ctx.startService(Intent(ctx, SshTunnelService::class.java).setAction(ACTION_STOP))
        }
    }

    private var worker: Thread? = null
    @Volatile private var stopping = false
    @Volatile private var session: Session? = null
    private var socks: SocksServer? = null
    private var tun: ParcelFileDescriptor? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Store.init(this)
        if (intent?.action == ACTION_STOP) {
            shutdown()
            return START_NOT_STICKY
        }
        val profile = Store.profiles().find { it.id == intent?.getStringExtra(EXTRA_PROFILE) }
        if (profile == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        startForegroundCompat(profile.name)
        if (worker?.isAlive != true) {
            stopping = false
            worker = Thread { runTunnel(profile) }.also { it.start() }
        }
        return START_NOT_STICKY
    }

    override fun onRevoke() { shutdown() }

    override fun onDestroy() {
        stopping = true
        cleanup()
        super.onDestroy()
    }

    private fun shutdown() {
        stopping = true
        if (worker?.isAlive == true) worker?.interrupt() else cleanup()
    }

    private fun runTunnel(profile: SshProfile) {
        VpnState.status.value = Status.CONNECTING
        VpnState.log("Connecting to ${profile.host}:${profile.port} as ${profile.username}")
        val port = Store.socksPort
        try {
            socks = SocksServer(port) { session }.also { it.start() }
            while (!stopping) {
                try {
                    val s = connectSsh(profile)
                    session = s
                    VpnState.log("SSH connected")
                    if (tun == null && !startTun(port)) {
                        VpnState.status.value = Status.ERROR
                        break
                    }
                    if (VpnState.status.value != Status.CONNECTED) {
                        VpnState.connectedAt.value = System.currentTimeMillis()
                    }
                    VpnState.status.value = Status.CONNECTED
                    while (!stopping && s.isConnected) Thread.sleep(1000)
                    if (stopping) break
                    VpnState.log("SSH session lost")
                } catch (e: InterruptedException) {
                    break
                } catch (e: Exception) {
                    VpnState.log("Error: ${e.message}")
                    if (tun == null) { VpnState.status.value = Status.ERROR; break }
                }
                try { session?.disconnect() } catch (_: Exception) {}
                session = null
                if (!Store.autoReconnect) break
                VpnState.status.value = Status.CONNECTING
                VpnState.log("Reconnecting in 3s...")
                try { Thread.sleep(3000) } catch (e: InterruptedException) { break }
            }
        } catch (e: Exception) {
            VpnState.log("Fatal: ${e.message}")
            VpnState.status.value = Status.ERROR
        } finally {
            cleanup()
        }
    }

    private fun connectSsh(p: SshProfile): Session {
        val jsch = JSch()
        if (p.privateKey.isNotBlank()) {
            jsch.addIdentity(
                "key", p.privateKey.toByteArray(), null,
                p.passphrase.takeIf { it.isNotBlank() }?.toByteArray()
            )
        }
        val s = jsch.getSession(p.username, p.host, p.port)
        if (p.password.isNotBlank()) s.setPassword(p.password)
        s.setConfig("StrictHostKeyChecking", "no") // TODO: pin host keys (see README)
        s.setConfig("PreferredAuthentications", "publickey,password,keyboard-interactive")
        s.setServerAliveInterval(Store.keepAliveSec * 1000)
        s.setServerAliveCountMax(3)
        s.setSocketFactory(object : SocketFactory {
            override fun createSocket(host: String, port: Int): Socket {
                val sock = Socket()
                protect(sock) // keep SSH traffic outside the tunnel
                sock.connect(InetSocketAddress(host, port), 15000)
                return sock
            }
            override fun getInputStream(socket: Socket) = socket.getInputStream()
            override fun getOutputStream(socket: Socket) = socket.getOutputStream()
        })
        s.connect(15000)
        try { VpnState.log("Host key fingerprint: ${s.hostKey.getFingerPrint(jsch)}") } catch (_: Exception) {}
        return s
    }

    private fun startTun(socksPort: Int): Boolean {
        val pfd = Builder()
            .setSession("SSH Tunnel")
            .setMtu(8500)
            .addAddress("198.18.0.1", 32)
            .addAddress("fc00::1", 128)
            .addRoute("0.0.0.0", 0)
            .addRoute("::", 0)
            .addDnsServer("198.18.0.2") // answered by hev mapdns, resolved via SSH
            .addDisallowedApplication(packageName)
            .establish()
        if (pfd == null) {
            VpnState.log("VPN permission missing or revoked")
            return false
        }
        tun = pfd
        val conf = File(filesDir, "tproxy.yml")
        conf.writeText(
            """
            tunnel:
              mtu: 8500
              ipv4: 198.18.0.1
              ipv6: 'fc00::1'
            socks5:
              port: $socksPort
              address: 127.0.0.1
              udp: 'udp'
            mapdns:
              address: 198.18.0.2
              port: 53
              network: 100.64.0.0
              netmask: 255.192.0.0
              cache-size: 10000
            misc:
              task-stack-size: 81920
              log-level: warn
            """.trimIndent()
        )
        return try {
            val ok = TProxyService.TProxyStartService(conf.absolutePath, pfd.fd)
            VpnState.log(if (ok) "Tunnel started" else "Tunnel failed to start")
            ok
        } catch (t: Throwable) {
            VpnState.log("Native lib error (libhev-socks5-tunnel.so missing?): ${t.message}")
            false
        }
    }

    private fun cleanup() {
        try { if (TProxyService.TProxyIsRunning()) TProxyService.TProxyStopService() } catch (_: Throwable) {}
        try { tun?.close() } catch (_: Exception) {}
        tun = null
        try { socks?.stop() } catch (_: Exception) {}
        socks = null
        try { session?.disconnect() } catch (_: Exception) {}
        session = null
        VpnState.connectedAt.value = 0L
        if (VpnState.status.value != Status.ERROR) VpnState.status.value = Status.DISCONNECTED
        VpnState.log("Disconnected")
        try { stopForeground(STOP_FOREGROUND_REMOVE) } catch (_: Exception) {}
        stopSelf()
    }

    private fun startForegroundCompat(name: String) {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "VPN status", NotificationManager.IMPORTANCE_LOW))
        val stopIntent = PendingIntent.getService(
            this, 0, Intent(this, SshTunnelService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val n = Notification.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentTitle("SSH Tunnel")
            .setContentText(name)
            .setOngoing(true)
            .addAction(Notification.Action.Builder(null, "Disconnect", stopIntent).build())
            .build()
        val type = if (Build.VERSION.SDK_INT >= 34) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
        ServiceCompat.startForeground(this, 1, n, type)
    }
}
