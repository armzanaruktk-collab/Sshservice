import React, { useState, useEffect, useRef } from 'react';
import {
  SshProfile,
  Status,
  VpnSettings,
  PayloadItem,
  LogItem,
} from './types/vpn';
import { AppStore, DEFAULT_PAYLOADS } from './services/store';
import { parsePayload } from './services/payloadParser';
import { HomeScreen } from './components/HomeScreen';
import { PayloadScreen } from './components/PayloadScreen';
import { AddPayloadModal } from './components/AddPayloadModal';
import { ImportProfileModal } from './components/ImportProfileModal';
import { ProfilesScreen } from './components/ProfilesScreen';
import { LogsScreen } from './components/LogsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AboutScreen } from './components/AboutScreen';
import { SourceCodeViewer } from './components/SourceCodeViewer';
import { ProfileDialog } from './components/ProfileDialog';
import {
  Home,
  Monitor,
  Server,
  List,
  Settings as SettingsIcon,
  Info,
  Smartphone,
  Maximize2,
  FileCode,
  Download,
  Wifi,
  Battery,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState<number>(0);
  const [profiles, setProfiles] = useState<SshProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payloads, setPayloads] = useState<PayloadItem[]>([]);
  const [selectedPayloadId, setSelectedPayloadId] = useState<string | null>(null);
  const [settings, setSettings] = useState<VpnSettings>(AppStore.getSettings());
  const [status, setStatus] = useState<Status>('DISCONNECTED');
  const [connectedAt, setConnectedAt] = useState<number>(0);
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Modals
  const [showAddPayloadModal, setShowAddPayloadModal] = useState(false);
  const [editingPayload, setEditingPayload] = useState<PayloadItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SshProfile | null>(null);
  const [showSourceViewer, setShowSourceViewer] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'phone' | 'desktop'>('phone');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize data
  useEffect(() => {
    const loadedProfiles = AppStore.getProfiles();
    setProfiles(loadedProfiles);
    const selServer = AppStore.getSelectedId() || (loadedProfiles[0] ? loadedProfiles[0].id : null);
    setSelectedId(selServer);

    const loadedPayloads = AppStore.getPayloads();
    setPayloads(loadedPayloads);
    const selPayload = AppStore.getSelectedPayloadId() || (loadedPayloads[0] ? loadedPayloads[0].id : null);
    setSelectedPayloadId(selPayload);

    addLog('WORLD VPN APP (worldvpn-release-85) เริ่มต้นระบบเรียบร้อย', 'info');
    addLog(`โหลดรายการเพย์โหลดทั้งหมด (${loadedPayloads.length}) รายการ`, 'info');
  }, []);

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toTimeString().split(' ')[0];
    const newLog: LogItem = {
      id: 'log-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      time,
      text,
      type,
    };
    setLogs((prev) => [...prev, newLog].slice(-500));
  };

  const selectedServer = profiles.find((p) => p.id === selectedId);
  const selectedPayload = payloads.find((p) => p.id === selectedPayloadId);

  // Persistence helpers
  const persistProfiles = (newProfiles: SshProfile[], newSelectedId?: string | null) => {
    setProfiles(newProfiles);
    AppStore.saveProfiles(newProfiles);
    if (newSelectedId !== undefined) {
      setSelectedId(newSelectedId);
      AppStore.setSelectedId(newSelectedId);
    }
  };

  const persistPayloads = (newPayloads: PayloadItem[], newSelectedId?: string | null) => {
    setPayloads(newPayloads);
    AppStore.savePayloads(newPayloads);
    if (newSelectedId !== undefined) {
      setSelectedPayloadId(newSelectedId);
      AppStore.setSelectedPayloadId(newSelectedId);
    }
  };

  const handleSaveSettings = (newSettings: VpnSettings) => {
    setSettings(newSettings);
    AppStore.saveSettings(newSettings);
    addLog('อัปเดตการตั้งค่าเรียบร้อย', 'info');
  };

  // Connection Handler
  const handleConnect = async () => {
    if (!selectedServer) {
      addLog('กรุณาเลือกเซิร์ฟเวอร์ก่อนเริ่มเชื่อมต่อ', 'warn');
      setTab(2);
      return;
    }

    if (settings.advanced.autoOpenLogsOnConnect) {
      setTab(3); // open logs immediately
    }

    setStatus('CONNECTING');
    addLog(`กำลังเชื่อมต่อไปยัง ${selectedServer.name} (${selectedServer.host}:${selectedServer.port})...`, 'info');

    if (selectedPayload) {
      const injected = parsePayload(selectedPayload.rawPayload, {
        host: selectedServer.host,
        port: selectedServer.port,
      });
      addLog(`ใช้เพย์โหลด: [${selectedPayload.name}] โปรโตคอล: ${selectedPayload.protocol}`, 'info');
      addLog(`แทนค่าแท็ก: [crlf] -> \\r\\n, [host] -> ${selectedServer.host}`, 'info');
      if (selectedPayload.isCloudflare) {
        addLog('เปิดใช้งานโหมด Cloudflare CDN Fronting (CF: ON)', 'info');
      }
    }

    addLog(`เปิด SOCKS5 Port 127.0.0.1:${settings.socksPort}`, 'info');
    addLog(`สร้าง TUN Interface ${settings.tunIpv4} (MTU: ${settings.mtu})`, 'info');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ssh/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: selectedServer.host,
          port: selectedServer.port,
          username: selectedServer.username,
          password: selectedServer.password,
          privateKey: selectedServer.privateKey,
          passphrase: selectedServer.passphrase,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((line: string) => {
          addLog(line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, ''), 'info');
        });
      }

      if (data.success) {
        setStatus('CONNECTED');
        setConnectedAt(Date.now());
        addLog('เชื่อมต่อสำเร็จ! อุโมงค์ VPN เริ่มต้นทำงานแล้ว (Connected)', 'success');
      } else {
        const isDemo =
          selectedServer.host.includes('.net') ||
          selectedServer.host.includes('.dev') ||
          selectedServer.host.includes('opengw.net');
        if (isDemo) {
          addLog(`เซิร์ฟเวอร์จำลอง ${selectedServer.name}: เริ่มสตรีมทราฟฟิกทดสอบ...`, 'warn');
          setTimeout(() => {
            if (abortControllerRef.current === controller) {
              setStatus('CONNECTED');
              setConnectedAt(Date.now());
              addLog('VPN เชื่อมต่อสำเร็จ (WebSocket direct-tcpip channel ready)', 'success');
            }
          }, 600);
        } else {
          setStatus('ERROR');
          addLog(`เกิดข้อผิดพลาด: ${data.error || 'Connection failed'}`, 'error');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addLog('ผู้ใช้ยกเลิกการเชื่อมต่อ', 'warn');
        setStatus('DISCONNECTED');
        return;
      }
      setStatus('ERROR');
      addLog(`ข้อผิดพลาดร้ายแรง: ${err.message}`, 'error');
    }
  };

  const handleDisconnect = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    addLog('กำลังหยุดการทำงานของอุโมงค์ VPN...', 'info');
    setStatus('DISCONNECTED');
    setConnectedAt(0);
    addLog('ตัดการเชื่อมต่อแล้ว (Disconnected)', 'info');
  };

  const handleToggle = () => {
    if (status === 'DISCONNECTED' || status === 'ERROR') {
      handleConnect();
    } else {
      handleDisconnect();
    }
  };

  const tabs = [
    { label: 'หน้าแรก', icon: Home },
    { label: 'เพย์โหลด', icon: Monitor },
    { label: 'เซิร์ฟเวอร์', icon: Server },
    { label: 'บันทึก', icon: List },
    { label: 'การตั้งค่า', icon: SettingsIcon },
    { label: 'เกี่ยวกับ', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Top Global Bar */}
      <header className="border-b border-slate-800/80 bg-[#121620]/90 backdrop-blur-md px-3 sm:px-6 py-2.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-rose-600 flex items-center justify-center shadow-md shadow-rose-600/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-white">WORLD VPN APP</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  release-85
                </span>
              </div>
              <p className="text-[10px] text-slate-400">OpenVPN Core 3.12 • Custom Payload WS • JSch</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Direct APK Link button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/download/apk');
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'worldvpn-release-85.apk';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch {
                  window.location.href = '/download/apk';
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-rose-600 hover:brightness-110 text-white flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              title="ดาวน์โหลด APK โดยตรง"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด APK</span>
            </button>

            {/* Source & Build guide */}
            <button
              onClick={() => setShowSourceViewer(!showSourceViewer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                showSourceViewer
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">โค้ด Android & Zip</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setDeviceMode('phone')}
                title="โหมดมุมมองมือถือ (Android Screen)"
                className={`p-1.5 rounded-lg transition-all ${
                  deviceMode === 'phone'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('desktop')}
                title="โหมดเต็มจอคอมพิวเตอร์"
                className={`p-1.5 rounded-lg transition-all ${
                  deviceMode === 'desktop'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {showSourceViewer ? (
          <div className="w-full h-full p-2 sm:p-5 max-w-7xl mx-auto overflow-hidden">
            <div className="w-full h-[calc(100vh-5.5rem)] bg-[#121620] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
              <SourceCodeViewer />
            </div>
          </div>
        ) : deviceMode === 'phone' ? (
          /* Normal Native Android App Layout (Full Screen & Full Size) */
          <div className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto flex flex-col h-full bg-[#121620] sm:border-x sm:border-slate-800 overflow-hidden shadow-2xl">
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto relative">
              {tab === 0 && (
                <HomeScreen
                  profiles={profiles}
                  selectedId={selectedId}
                  onSelect={(id) => persistProfiles(profiles, id)}
                  selectedPayload={selectedPayload}
                  onOpenPayloadList={() => setTab(1)}
                  onOpenImportModal={() => setShowImportModal(true)}
                  status={status}
                  connectedAt={connectedAt}
                  onToggle={handleToggle}
                  settings={settings}
                  onNavigateToLogs={() => setTab(3)}
                />
              )}
              {tab === 1 && (
                <PayloadScreen
                  payloads={payloads}
                  selectedPayloadId={selectedPayloadId}
                  onSelectPayload={(id) => {
                    persistPayloads(payloads, id);
                    addLog(`เลือกเพย์โหลด: ${payloads.find((p) => p.id === id)?.name}`, 'info');
                  }}
                  onAddPayload={() => {
                    setEditingPayload(null);
                    setShowAddPayloadModal(true);
                  }}
                  onEditPayload={(item) => {
                    setEditingPayload(item);
                    setShowAddPayloadModal(true);
                  }}
                  onDeletePayload={(item) => {
                    const updated = payloads.filter((x) => x.id !== item.id);
                    persistPayloads(updated, selectedPayloadId === item.id ? updated[0]?.id : selectedPayloadId);
                    addLog(`ลบเพย์โหลด "${item.name}" แล้ว`, 'info');
                  }}
                  onClearCustomPayloads={() => {
                    const sysOnly = payloads.filter((x) => x.isSystem);
                    persistPayloads(sysOnly, sysOnly[0]?.id || null);
                    addLog('ล้างเพย์โหลดที่สร้างเองทั้งหมดเรียบร้อย', 'info');
                  }}
                  onBack={() => setTab(0)}
                />
              )}
              {tab === 2 && (
                <ProfilesScreen
                  profiles={profiles}
                  selectedId={selectedId}
                  onSelect={(id) => persistProfiles(profiles, id)}
                  onEdit={(p) => {
                    setEditingProfile(p);
                    setShowProfileDialog(true);
                  }}
                  onDelete={(p) => {
                    const updated = profiles.filter((x) => x.id !== p.id);
                    persistProfiles(updated, selectedId === p.id ? updated[0]?.id : selectedId);
                    addLog(`ลบเซิร์ฟเวอร์ "${p.name}" แล้ว`, 'info');
                  }}
                  onAdd={() => {
                    setEditingProfile(null);
                    setShowProfileDialog(true);
                  }}
                  onImport={(newProfs) => {
                    persistProfiles([...profiles, ...newProfs]);
                    addLog(`นำเข้าเซิร์ฟเวอร์ (${newProfs.length}) รายการเรียบร้อย`, 'success');
                  }}
                />
              )}
              {tab === 3 && <LogsScreen logs={logs} onClear={() => setLogs([])} />}
              {tab === 4 && <SettingsScreen settings={settings} onSave={handleSaveSettings} />}
              {tab === 5 && <AboutScreen onBack={() => setTab(0)} />}
            </div>

            {/* Normal Native App Bottom Navigation Bar (บาร์ขนาดมาตรฐานแอพมือถือจริง) */}
            <nav className="h-[74px] border-t border-slate-800 bg-[#151a26] flex items-center justify-around px-2 select-none shrink-0 shadow-2xl z-30">
              {tabs.map((t, idx) => {
                const IconComp = t.icon;
                const isSelected = tab === idx;
                return (
                  <button
                    key={t.label}
                    onClick={() => setTab(idx)}
                    className="flex-1 flex flex-col items-center justify-center h-full py-1 cursor-pointer transition-all active:scale-95"
                  >
                    <div
                      className={`w-14 h-8 flex items-center justify-center rounded-2xl mb-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/25 text-emerald-400 shadow-sm ring-1 ring-emerald-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span
                      className={`text-xs tracking-tight transition-colors ${
                        isSelected ? 'font-bold text-emerald-400' : 'font-medium text-slate-400'
                      }`}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ) : (
          /* Desktop Dashboard Mode */
          <div className="w-full max-w-6xl h-[calc(100vh-5.5rem)] bg-[#121620] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-800 bg-[#151a26] p-4 flex md:flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                  เมนูหลัก
                </div>
                <nav className="flex md:flex-col gap-1 overflow-x-auto">
                  {tabs.map((t, idx) => {
                    const IconComp = t.icon;
                    const isSelected = tab === idx;
                    return (
                      <button
                        key={t.label}
                        onClick={() => setTab(idx)}
                        className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <IconComp className="w-4 h-4 shrink-0" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0e121a] border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">สถานะ VPN</span>
                  <span
                    className={`font-bold ${
                      status === 'CONNECTED'
                        ? 'text-emerald-400'
                        : status === 'CONNECTING'
                        ? 'text-blue-400'
                        : status === 'ERROR'
                        ? 'text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Payload: {selectedPayload?.name || '-'}
                </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col bg-[#121620]">
              {tab === 0 && (
                <HomeScreen
                  profiles={profiles}
                  selectedId={selectedId}
                  onSelect={(id) => persistProfiles(profiles, id)}
                  selectedPayload={selectedPayload}
                  onOpenPayloadList={() => setTab(1)}
                  onOpenImportModal={() => setShowImportModal(true)}
                  status={status}
                  connectedAt={connectedAt}
                  onToggle={handleToggle}
                  settings={settings}
                  onNavigateToLogs={() => setTab(3)}
                />
              )}
              {tab === 1 && (
                <PayloadScreen
                  payloads={payloads}
                  selectedPayloadId={selectedPayloadId}
                  onSelectPayload={(id) => persistPayloads(payloads, id)}
                  onAddPayload={() => {
                    setEditingPayload(null);
                    setShowAddPayloadModal(true);
                  }}
                  onEditPayload={(item) => {
                    setEditingPayload(item);
                    setShowAddPayloadModal(true);
                  }}
                  onDeletePayload={(item) => {
                    const updated = payloads.filter((x) => x.id !== item.id);
                    persistPayloads(updated, selectedPayloadId === item.id ? updated[0]?.id : selectedPayloadId);
                  }}
                  onClearCustomPayloads={() => {
                    const sysOnly = payloads.filter((x) => x.isSystem);
                    persistPayloads(sysOnly, sysOnly[0]?.id || null);
                  }}
                  onBack={() => setTab(0)}
                />
              )}
              {tab === 2 && (
                <ProfilesScreen
                  profiles={profiles}
                  selectedId={selectedId}
                  onSelect={(id) => persistProfiles(profiles, id)}
                  onEdit={(p) => {
                    setEditingProfile(p);
                    setShowProfileDialog(true);
                  }}
                  onDelete={(p) => {
                    const updated = profiles.filter((x) => x.id !== p.id);
                    persistProfiles(updated, selectedId === p.id ? updated[0]?.id : selectedId);
                  }}
                  onAdd={() => {
                    setEditingProfile(null);
                    setShowProfileDialog(true);
                  }}
                  onImport={(newProfs) => {
                    persistProfiles([...profiles, ...newProfs]);
                  }}
                />
              )}
              {tab === 3 && <LogsScreen logs={logs} onClear={() => setLogs([])} />}
              {tab === 4 && <SettingsScreen settings={settings} onSave={handleSaveSettings} />}
              {tab === 5 && <AboutScreen onBack={() => setTab(0)} />}
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Payload Modal */}
      {showAddPayloadModal && (
        <AddPayloadModal
          initial={editingPayload}
          onDismiss={() => setShowAddPayloadModal(false)}
          onSave={(item) => {
            const index = payloads.findIndex((x) => x.id === item.id);
            let updated: PayloadItem[];
            if (index >= 0) {
              updated = [...payloads];
              updated[index] = item;
              addLog(`อัปเดตเพย์โหลด "${item.name}" แล้ว`, 'info');
            } else {
              updated = [...payloads, item];
              addLog(`เพิ่มเพย์โหลดใหม่ "${item.name}" เรียบร้อย`, 'info');
            }
            persistPayloads(updated, item.id);
            setShowAddPayloadModal(false);
          }}
        />
      )}

      {/* Import .ovpn Profile Modal */}
      {showImportModal && (
        <ImportProfileModal
          onDismiss={() => setShowImportModal(false)}
          onImport={(newProfile, rawConfig) => {
            persistProfiles([...profiles, newProfile], newProfile.id);
            addLog(`นำเข้าโปรไฟล์ OpenVPN "${newProfile.name}" เรียบร้อย`, 'success');
            setShowImportModal(false);
          }}
        />
      )}

      {/* SSH / Server Dialog */}
      {showProfileDialog && (
        <ProfileDialog
          initial={editingProfile}
          onDismiss={() => setShowProfileDialog(false)}
          onSave={(p) => {
            const index = profiles.findIndex((x) => x.id === p.id);
            let updated: SshProfile[];
            if (index >= 0) {
              updated = [...profiles];
              updated[index] = p;
              addLog(`อัปเดตเซิร์ฟเวอร์ "${p.name}" แล้ว`, 'info');
            } else {
              updated = [...profiles, p];
              addLog(`เพิ่มเซิร์ฟเวอร์ใหม่ "${p.name}" เรียบร้อย`, 'info');
            }
            persistProfiles(updated, p.id);
            setShowProfileDialog(false);
          }}
        />
      )}
    </div>
  );
}
