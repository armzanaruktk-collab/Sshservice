package com.sshvpn.app.ui

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sshvpn.app.data.SshProfile
import com.sshvpn.app.data.Store
import com.sshvpn.app.vpn.Status
import com.sshvpn.app.vpn.VpnState
import kotlinx.coroutines.delay
import java.util.UUID

@Composable
fun App(onConnect: (SshProfile) -> Unit, onDisconnect: () -> Unit) {
    val ctx = LocalContext.current
    var tab by remember { mutableIntStateOf(0) }
    val profiles = remember { mutableStateListOf<SshProfile>().also { it.addAll(Store.profiles()) } }
    var selectedId by remember { mutableStateOf(Store.selectedId ?: profiles.firstOrNull()?.id) }
    var editing by remember { mutableStateOf<SshProfile?>(null) }
    var showDialog by remember { mutableStateOf(false) }
    val status by VpnState.status.collectAsState()
    val connectedAt by VpnState.connectedAt.collectAsState()

    fun persist() { Store.saveProfiles(profiles.toList()); Store.selectedId = selectedId }

    val tabs = listOf(
        "Home" to Icons.Default.Home,
        "Profiles" to Icons.Default.Person,
        "Logs" to Icons.AutoMirrored.Filled.List,
        "Settings" to Icons.Default.Settings
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { i, (label, icon) ->
                    NavigationBarItem(
                        selected = tab == i, onClick = { tab = i },
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label) }
                    )
                }
            }
        },
        floatingActionButton = {
            if (tab == 1) FloatingActionButton(onClick = { editing = null; showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add")
            }
        }
    ) { pad ->
        Box(Modifier.padding(pad).fillMaxSize()) {
            when (tab) {
                0 -> HomeScreen(
                    profiles = profiles, selectedId = selectedId,
                    onSelect = { selectedId = it; persist() },
                    status = status, connectedAt = connectedAt,
                    onToggle = {
                        if (status == Status.DISCONNECTED || status == Status.ERROR) {
                            val p = profiles.find { it.id == selectedId }
                            if (p == null) Toast.makeText(ctx, "Add a profile first", Toast.LENGTH_SHORT).show()
                            else onConnect(p)
                        } else onDisconnect()
                    }
                )
                1 -> ProfilesScreen(
                    profiles = profiles,
                    onEdit = { editing = it; showDialog = true },
                    onDelete = { p ->
                        profiles.remove(p)
                        if (selectedId == p.id) selectedId = profiles.firstOrNull()?.id
                        persist()
                    }
                )
                2 -> LogsScreen()
                else -> SettingsScreen()
            }
        }
    }

    if (showDialog) {
        ProfileDialog(
            initial = editing,
            onDismiss = { showDialog = false },
            onSave = { p ->
                val i = profiles.indexOfFirst { it.id == p.id }
                if (i >= 0) profiles[i] = p else profiles.add(p)
                if (selectedId == null) selectedId = p.id
                persist()
                showDialog = false
            }
        )
    }
}

@Composable
fun HomeScreen(
    profiles: List<SshProfile>, selectedId: String?, onSelect: (String) -> Unit,
    status: Status, connectedAt: Long, onToggle: () -> Unit
) {
    val selected = profiles.find { it.id == selectedId }
    var expanded by remember { mutableStateOf(false) }
    val elapsed by produceState(0L, connectedAt, status) {
        while (true) {
            value = if (status == Status.CONNECTED && connectedAt > 0) (System.currentTimeMillis() - connectedAt) / 1000 else 0L
            delay(1000)
        }
    }
    val busy = status == Status.CONNECTING
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp, Alignment.CenterVertically)
    ) {
        Text("SSH Tunnel", style = MaterialTheme.typography.headlineMedium)
        Box(Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = { expanded = true }, modifier = Modifier.fillMaxWidth(),
                enabled = status == Status.DISCONNECTED || status == Status.ERROR
            ) { Text(selected?.let { "${it.name}  (${it.host})" } ?: "No profile - add one in Profiles") }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                profiles.forEach {
                    DropdownMenuItem(text = { Text(it.name) }, onClick = { onSelect(it.id); expanded = false })
                }
            }
        }
        val (label, color) = when (status) {
            Status.CONNECTED -> "Connected" to Color(0xFF4CAF50)
            Status.CONNECTING -> "Connecting..." to Color(0xFFFFC107)
            Status.ERROR -> "Error - see Logs" to Color(0xFFF44336)
            Status.DISCONNECTED -> "Disconnected" to Color.Gray
        }
        Text(label, color = color, style = MaterialTheme.typography.titleLarge)
        Text(
            "%02d:%02d:%02d".format(elapsed / 3600, (elapsed % 3600) / 60, elapsed % 60),
            fontFamily = FontFamily.Monospace, fontSize = 32.sp
        )
        Button(onClick = onToggle, enabled = !busy, modifier = Modifier.fillMaxWidth().height(56.dp)) {
            Text(if (status == Status.CONNECTED || busy) "Disconnect" else "Connect")
        }
        if (busy) {
            TextButton(onClick = onToggle) { Text("Cancel") }
        }
    }
}

@Composable
fun ProfilesScreen(profiles: List<SshProfile>, onEdit: (SshProfile) -> Unit, onDelete: (SshProfile) -> Unit) {
    if (profiles.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("No profiles. Tap + to add.") }
        return
    }
    LazyColumn(Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(profiles, key = { it.id }) { p ->
            Card(Modifier.fillMaxWidth()) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(p.name, style = MaterialTheme.typography.titleMedium)
                        Text("${p.username}@${p.host}:${p.port}", style = MaterialTheme.typography.bodySmall)
                    }
                    IconButton(onClick = { onEdit(p) }) { Icon(Icons.Default.Edit, "Edit") }
                    IconButton(onClick = { onDelete(p) }) { Icon(Icons.Default.Delete, "Delete") }
                }
            }
        }
    }
}

@Composable
fun ProfileDialog(initial: SshProfile?, onSave: (SshProfile) -> Unit, onDismiss: () -> Unit) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var host by remember { mutableStateOf(initial?.host ?: "") }
    var port by remember { mutableStateOf((initial?.port ?: 22).toString()) }
    var user by remember { mutableStateOf(initial?.username ?: "") }
    var pass by remember { mutableStateOf(initial?.password ?: "") }
    var key by remember { mutableStateOf(initial?.privateKey ?: "") }
    var phrase by remember { mutableStateOf(initial?.passphrase ?: "") }
    val valid = host.isNotBlank() && user.isNotBlank() && port.toIntOrNull() in 1..65535

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "Add SSH profile" else "Edit profile") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true)
                OutlinedTextField(host, { host = it.trim() }, label = { Text("Host") }, singleLine = true)
                OutlinedTextField(port, { port = it.filter(Char::isDigit) }, label = { Text("Port") }, singleLine = true)
                OutlinedTextField(user, { user = it.trim() }, label = { Text("Username") }, singleLine = true)
                OutlinedTextField(pass, { pass = it }, label = { Text("Password") }, singleLine = true,
                    visualTransformation = PasswordVisualTransformation())
                OutlinedTextField(key, { key = it }, label = { Text("Private key (PEM, optional)") }, minLines = 3, maxLines = 5)
                OutlinedTextField(phrase, { phrase = it }, label = { Text("Key passphrase") }, singleLine = true,
                    visualTransformation = PasswordVisualTransformation())
            }
        },
        confirmButton = {
            TextButton(enabled = valid, onClick = {
                onSave(SshProfile(
                    id = initial?.id ?: UUID.randomUUID().toString(),
                    name = name.ifBlank { host }, host = host, port = port.toInt(),
                    username = user, password = pass, privateKey = key, passphrase = phrase
                ))
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
fun LogsScreen() {
    val logs by VpnState.logs.collectAsState()
    Column(Modifier.fillMaxSize().padding(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Logs", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
            TextButton(onClick = { VpnState.logs.value = emptyList() }) { Text("Clear") }
        }
        LazyColumn(reverseLayout = true) {
            items(logs.reversed()) { Text(it, fontFamily = FontFamily.Monospace, fontSize = 12.sp) }
        }
    }
}

@Composable
fun SettingsScreen() {
    var auto by remember { mutableStateOf(Store.autoReconnect) }
    var keep by remember { mutableStateOf(Store.keepAliveSec.toString()) }
    var socks by remember { mutableStateOf(Store.socksPort.toString()) }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Settings", style = MaterialTheme.typography.titleLarge)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Auto reconnect")
                Text("Retry SSH when the session drops", style = MaterialTheme.typography.bodySmall)
            }
            Switch(checked = auto, onCheckedChange = { auto = it; Store.autoReconnect = it })
        }
        OutlinedTextField(keep, { v -> keep = v.filter(Char::isDigit); keep.toIntOrNull()?.takeIf { it > 0 }?.let { Store.keepAliveSec = it } },
            label = { Text("Keep-alive interval (seconds)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(socks, { v -> socks = v.filter(Char::isDigit); socks.toIntOrNull()?.takeIf { it in 1024..65535 }?.let { Store.socksPort = it } },
            label = { Text("Local SOCKS5 port (1024-65535)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Text("Changes apply on the next connection. DNS is resolved through the SSH server.",
            style = MaterialTheme.typography.bodySmall)
    }
}
