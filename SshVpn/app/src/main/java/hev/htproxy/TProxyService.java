package hev.htproxy;

/** JNI binding for libhev-socks5-tunnel.so. Package/class name must match hev-jni.c. */
public final class TProxyService {
    private TProxyService() {}

    static {
        System.loadLibrary("hev-socks5-tunnel");
    }

    public static native boolean TProxyStartService(String config_path, int fd);
    public static native boolean TProxyStopService();
    public static native boolean TProxyIsRunning();
    public static native long[] TProxyGetStats();
}
