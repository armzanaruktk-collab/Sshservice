# SSH Tunnel (Android VpnService)

SSH-only VPN app (Kotlin + Jetpack Compose). No OpenVPN code.

Traffic path:

    apps -> TUN (VpnService) -> hev-socks5-tunnel (JNI) -> local SOCKS5 127.0.0.1:1080
         -> SSH direct-tcpip channels (JSch) -> your SSH server

* DNS is answered by hev "mapdns" and resolved on the server side (SSH has no UDP).
* UDP traffic other than DNS is not supported (SOCKS5 UDP ASSOCIATE is rejected).

## Build
**GitHub Actions (easiest):** push to `main`, open Actions -> "Build APK" -> download the artifact.
The workflow builds `libhev-socks5-tunnel.so` with the NDK, then the APK.

**Local:** build the .so yourself (see `.github/workflows/build.yml`), copy it to
`app/src/main/jniLibs/<abi>/`, then open the folder in Android Studio.

## Known limitations / TODO
* Host keys are not pinned (`StrictHostKeyChecking=no`); the fingerprint is written to the log.
* Profiles (incl. passwords) are stored in private SharedPreferences, not encrypted.
* Use only with servers you own or are authorised to use.
