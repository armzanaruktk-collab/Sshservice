export type Status = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type ProtocolType = 'OVPN_WS' | 'OVPN_HTTP' | 'OVPN_SSL' | 'OVPN_DNSTT';

export interface SshProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  pingMs?: number;
  countryCode?: string;
}

export interface PayloadItem {
  id: string;
  name: string;
  description: string;
  protocol: ProtocolType;
  speed: string; // e.g. '(speed good)', '(speed default 64k)', '(speed turbo 128k)'
  speedColor: 'green' | 'blue' | 'red';
  isSystem: boolean; // 'เพย์โหลดระบบ'
  isCloudflare: boolean;
  isSsl: boolean;
  rawPayload: string;
  proxyHost: string;
  proxyPort: number;
}

export interface AdvancedSettings {
  showNetworkSpeed: boolean; // ความเร็วของเครือข่าย
  showNotification: boolean; // การแจ้งเตือน
  notificationPosition: 'top' | 'bottom'; // ตำแหน่งการแจ้งเตือน
  autoConnectOnSelect: boolean; // เชื่อมต่ออัตโนมัติเมื่อกดเลือกเซิร์ฟเวอร์
  soundAndVibration: boolean; // เสียงและสั่น
  autoOpenLogsOnConnect: boolean; // เปิดหน้าบันทึกทันทีเมื่อกดเชื่อมต่อ
  batterySaver: boolean; // ประหยัดแบตเตอรี่ (หยุดชั่วคราวเมื่อล็อคหน้าจอ)
  seamlessTunnel: boolean; // อุโมงค์ไร้รอยต่อ (Kill Switch)
  reconnectOnReboot: boolean; // เชื่อมต่อใหม่เมื่อรีบูต
  autoKeyboard: boolean; // คีย์บอร์ดอัตโนมัติ
  minTlsVersion: 'TLS 1.2' | 'TLS 1.3'; // เวอร์ชั่น TLS ขั้นต่ำ
  vpnProtocol: string;
}

export interface VpnSettings {
  autoReconnect: boolean;
  keepAliveSec: number;
  socksPort: number;
  mtu: number;
  dnsServer: string;
  tunIpv4: string;
  tunIpv6: string;
  advanced: AdvancedSettings;
}

export interface LogItem {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface SourceFileNode {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
}

export interface OvpnProfile {
  id: string;
  fileName: string;
  configText: string;
  remoteHost: string;
  remotePort: number;
  proto: string;
  importedAt: string;
}
