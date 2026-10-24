package com.sshvpn.app

import android.Manifest
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import com.sshvpn.app.data.SshProfile
import com.sshvpn.app.data.Store
import com.sshvpn.app.ui.App
import com.sshvpn.app.ui.SshVpnTheme
import com.sshvpn.app.vpn.SshTunnelService

class MainActivity : ComponentActivity() {
    private var pending: SshProfile? = null

    private val vpnPermission = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        if (r.resultCode == RESULT_OK) pending?.let { SshTunnelService.start(this, it.id) }
        pending = null
    }
    private val notifPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Store.init(this)
        if (Build.VERSION.SDK_INT >= 33) notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        setContent {
            SshVpnTheme {
                App(onConnect = { connect(it) }, onDisconnect = { SshTunnelService.stop(this) })
            }
        }
    }

    private fun connect(p: SshProfile) {
        val intent = VpnService.prepare(this)
        if (intent != null) {
            pending = p
            vpnPermission.launch(intent)
        } else {
            SshTunnelService.start(this, p.id)
        }
    }
}
