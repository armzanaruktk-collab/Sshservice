package com.sshvpn.app.vpn

import com.jcraft.jsch.ChannelDirectTCPIP
import com.jcraft.jsch.Session
import java.io.DataInputStream
import java.io.InputStream
import java.io.OutputStream
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.Executors

/**
 * Minimal local SOCKS5 server (CONNECT only). Every connection is forwarded
 * through an SSH "direct-tcpip" channel, which gives us ssh -D behaviour.
 */
class SocksServer(private val port: Int, private val sessionProvider: () -> Session?) {
    private var server: ServerSocket? = null
    private val pool = Executors.newCachedThreadPool()
    @Volatile private var running = false
    @Volatile private var lastErrLog = 0L

    fun start() {
        val s = ServerSocket()
        s.reuseAddress = true
        s.bind(InetSocketAddress(InetAddress.getByName("127.0.0.1"), port), 128)
        server = s
        running = true
        pool.execute {
            while (running) {
                try {
                    val c = s.accept()
                    pool.execute { handle(c) }
                } catch (e: Exception) {
                    if (!running) break
                }
            }
        }
        VpnState.log("SOCKS5 listening on 127.0.0.1:$port")
    }

    fun stop() {
        running = false
        try { server?.close() } catch (_: Exception) {}
        pool.shutdownNow()
    }

    private fun handle(c: Socket) {
        var ch: ChannelDirectTCPIP? = null
        var replied = false
        try {
            c.soTimeout = 15000
            c.tcpNoDelay = true
            val inp = DataInputStream(c.getInputStream())
            val out = c.getOutputStream()
            if (inp.readUnsignedByte() != 5) return
            inp.readFully(ByteArray(inp.readUnsignedByte()))
            out.write(byteArrayOf(5, 0)); out.flush()
            if (inp.readUnsignedByte() != 5) return
            val cmd = inp.readUnsignedByte()
            inp.readUnsignedByte()
            val host = when (inp.readUnsignedByte()) {
                1 -> { val b = ByteArray(4); inp.readFully(b); InetAddress.getByAddress(b).hostAddress!! }
                3 -> { val b = ByteArray(inp.readUnsignedByte()); inp.readFully(b); String(b) }
                4 -> { val b = ByteArray(16); inp.readFully(b); InetAddress.getByAddress(b).hostAddress!! }
                else -> { reply(out, 8); return }
            }
            val dport = inp.readUnsignedShort()
            if (cmd != 1) { reply(out, 7); return } // UDP ASSOCIATE not supported over SSH
            val session = sessionProvider()
            if (session == null || !session.isConnected) { reply(out, 1); return }

            val channel = session.openChannel("direct-tcpip") as ChannelDirectTCPIP
            ch = channel
            channel.setHost(host)
            channel.setPort(dport)
            val remoteIn = channel.inputStream
            val remoteOut = channel.outputStream
            channel.connect(10000)
            reply(out, 0)
            replied = true
            c.soTimeout = 0

            val up = pool.submit { copy(inp, remoteOut) }
            copy(remoteIn, out)
            up.cancel(true)
        } catch (e: Exception) {
            val now = System.currentTimeMillis()
            if (now - lastErrLog > 5000) {
                lastErrLog = now
                VpnState.log("Forward error: ${e.message}")
            }
            if (!replied) try { reply(c.getOutputStream(), 5) } catch (_: Exception) {}
        } finally {
            try { ch?.disconnect() } catch (_: Exception) {}
            try { c.close() } catch (_: Exception) {}
        }
    }

    private fun reply(out: OutputStream, code: Int) {
        out.write(byteArrayOf(5, code.toByte(), 0, 1, 0, 0, 0, 0, 0, 0))
        out.flush()
    }

    // flush after every write: SSH channel pipes can otherwise delay data
    private fun copy(src: InputStream, dst: OutputStream) {
        val buf = ByteArray(16384)
        try {
            while (true) {
                val n = src.read(buf)
                if (n < 0) break
                dst.write(buf, 0, n)
                dst.flush()
            }
        } catch (_: Exception) {}
    }
}
