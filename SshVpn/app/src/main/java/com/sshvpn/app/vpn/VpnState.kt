package com.sshvpn.app.vpn

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

enum class Status { DISCONNECTED, CONNECTING, CONNECTED, ERROR }

object VpnState {
    val status = MutableStateFlow(Status.DISCONNECTED)
    val connectedAt = MutableStateFlow(0L)
    val logs = MutableStateFlow<List<String>>(emptyList())

    fun log(msg: String) {
        val t = SimpleDateFormat("HH:mm:ss", Locale.US).format(Date())
        logs.update { (it + "[$t] $msg").takeLast(500) }
    }
}
