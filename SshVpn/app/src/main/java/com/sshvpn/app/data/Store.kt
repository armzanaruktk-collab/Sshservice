package com.sshvpn.app.data

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

data class SshProfile(
    val id: String,
    val name: String,
    val host: String,
    val port: Int = 22,
    val username: String,
    val password: String = "",
    val privateKey: String = "",
    val passphrase: String = ""
)

object Store {
    private lateinit var prefs: SharedPreferences

    fun init(c: Context) {
        if (!::prefs.isInitialized) {
            prefs = c.applicationContext.getSharedPreferences("sshvpn", Context.MODE_PRIVATE)
        }
    }

    fun profiles(): List<SshProfile> {
        val arr = JSONArray(prefs.getString("profiles", "[]"))
        return (0 until arr.length()).map {
            val o = arr.getJSONObject(it)
            SshProfile(
                id = o.getString("id"), name = o.getString("name"),
                host = o.getString("host"), port = o.optInt("port", 22),
                username = o.getString("username"), password = o.optString("password"),
                privateKey = o.optString("privateKey"), passphrase = o.optString("passphrase")
            )
        }
    }

    fun saveProfiles(list: List<SshProfile>) {
        val arr = JSONArray()
        list.forEach {
            arr.put(JSONObject().put("id", it.id).put("name", it.name).put("host", it.host)
                .put("port", it.port).put("username", it.username).put("password", it.password)
                .put("privateKey", it.privateKey).put("passphrase", it.passphrase))
        }
        prefs.edit().putString("profiles", arr.toString()).apply()
    }

    var selectedId: String?
        get() = prefs.getString("selected", null)
        set(v) { prefs.edit().putString("selected", v).apply() }

    var autoReconnect: Boolean
        get() = prefs.getBoolean("auto", true)
        set(v) { prefs.edit().putBoolean("auto", v).apply() }

    var keepAliveSec: Int
        get() = prefs.getInt("keepalive", 30)
        set(v) { prefs.edit().putInt("keepalive", v).apply() }

    var socksPort: Int
        get() = prefs.getInt("socks", 1080)
        set(v) { prefs.edit().putInt("socks", v).apply() }
}
