import React, { useState, useEffect } from 'react';
import { SshProfile, Status, VpnSettings, PayloadItem } from '../types/vpn';
import { previewParsedPayload } from '../services/payloadParser';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Power,
  ChevronDown,
  Activity,
  ArrowDownUp,
  Globe,
  Radio,
  CheckCircle2,
  Lock,
  Layers,
  FileCode,
  Sliders,
  Code2,
  Zap,
} from 'lucide-react';

interface HomeScreenProps {
  profiles: SshProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedPayload: PayloadItem | undefined;
  onOpenPayloadList: () => void;
  onOpenImportModal: () => void;
  status: Status;
  connectedAt: number;
  onToggle: () => void;
  settings: VpnSettings;
  onNavigateToLogs: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profiles,
  selectedId,
  onSelect,
  selectedPayload,
  onOpenPayloadList,
  onOpenImportModal,
  status,
  connectedAt,
  onToggle,
  settings,
  onNavigateToLogs,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [downloadBytes, setDownloadBytes] = useState(0);
  const [uploadBytes, setUploadBytes] = useState(0);
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);

  const selected = profiles.find((p) => p.id === selectedId);

  // Timer loop
  useEffect(() => {
    if (status !== 'CONNECTED' || connectedAt <= 0) {
      setElapsedSeconds(0);
      setDownloadBytes(0);
      setUploadBytes(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - connectedAt) / 1000));
      setElapsedSeconds(diff);

      setDownloadBytes((prev) => prev + Math.floor(Math.random() * 45000 + 15000));
      setUploadBytes((prev) => prev + Math.floor(Math.random() * 18000 + 5000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, connectedAt]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isBusy = status === 'CONNECTING';

  const expandedPayloadText = selectedPayload && selected
    ? previewParsedPayload(selectedPayload.rawPayload, {
        host: selected.host,
        port: selected.port,
      })
    : '';

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-5 space-y-4 text-slate-100 select-none bg-[#121620]">
      {/* Top Title Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-rose-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center space-x-1.5">
              <span>WORLD VPN</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">OpenVPN WS & SSH Injector</p>
          </div>
        </div>

        <button
          onClick={onOpenImportModal}
          className="px-2.5 py-1 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/60 text-blue-300 text-xs font-semibold flex items-center space-x-1 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>นำเข้า .ovpn</span>
        </button>
      </div>

      {/* Server Selector Card */}
      <div className="relative">
        <button
          type="button"
          disabled={status === 'CONNECTED' || isBusy}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl border transition-all text-left ${
            status === 'CONNECTED' || isBusy
              ? 'bg-[#161c28]/60 border-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-[#161c28] border-blue-900/60 hover:border-blue-500/80 text-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] text-slate-400 font-medium">เซิร์ฟเวอร์ VPN</div>
              <div className="text-xs font-bold truncate text-slate-100">
                {selected ? selected.name : 'เลือกเซิร์ฟเวอร์'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {selected?.pingMs && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/60">
                {selected.pingMs}ms
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#151a26] border border-blue-900/80 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p.id);
                  setDropdownOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                  p.id === selectedId
                    ? 'bg-blue-950/40 text-blue-300 font-semibold'
                    : 'text-slate-200'
                }`}
              >
                <div className="truncate">
                  <div className="font-semibold text-xs">{p.name}</div>
                  <div className="text-slate-400 font-mono text-[10px] truncate">
                    {p.host}:{p.port}
                  </div>
                </div>
                {p.pingMs && (
                  <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">
                    {p.pingMs}ms
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Payload Box (Clickable, matching Screenshot 1 style) */}
      <div
        onClick={onOpenPayloadList}
        className="p-3 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 hover:border-emerald-400 cursor-pointer transition-all space-y-1.5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base">🖥️</span>
            <span className="font-bold text-xs text-slate-100">
              {selectedPayload ? selectedPayload.name : 'เลือกเพย์โหลด'}
            </span>
          </div>
          <span className="text-[10px] text-blue-400 font-medium hover:underline">
            เปลี่ยนเพย์โหลด →
          </span>
        </div>

        <div className="flex items-center space-x-2 pt-0.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-950/20 text-emerald-400 text-[10px] font-semibold">
            {selectedPayload?.speed || '(speed good)'}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/40 text-slate-400 text-[10px]">
            {selectedPayload?.isSystem ? 'เพย์โหลดระบบ' : 'เพย์โหลดผู้ใช้'}
          </span>
          {selectedPayload?.isCloudflare && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
              CF
            </span>
          )}
        </div>
      </div>

      {/* Hero Connect Section with Subtle Red & Blue Accents */}
      <div className="flex flex-col items-center justify-center py-2 space-y-3">
        {/* Status Indicator */}
        <div className="flex flex-col items-center space-y-1">
          {status === 'CONNECTED' && (
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>เชื่อมต่อแล้ว (Connected)</span>
            </div>
          )}
          {status === 'CONNECTING' && (
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span>กำลังฉีดเพย์โหลด & เชื่อมต่อ...</span>
            </div>
          )}
          {status === 'ERROR' && (
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>เกิดข้อผิดพลาด - ดูบันทึก</span>
            </div>
          )}
          {status === 'DISCONNECTED' && (
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span>ตัดการเชื่อมต่อ (Disconnected)</span>
            </div>
          )}

          {/* Digital Timer */}
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-wider text-slate-100 select-none py-1">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Big Power Button (Red & Blue Gradient) */}
        <div className="relative group">
          {status === 'CONNECTED' ? (
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-600/30 via-emerald-500/30 to-rose-600/30 rounded-full blur-xl"></div>
          ) : status === 'CONNECTING' ? (
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/30 to-rose-500/30 rounded-full blur-xl animate-pulse"></div>
          ) : (
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-rose-600/20 rounded-full blur-md"></div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 border-2 ${
              status === 'CONNECTED'
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400/80 text-white shadow-emerald-500/30'
                : status === 'CONNECTING'
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-rose-600 border-rose-400/80 text-white animate-pulse'
                : 'bg-gradient-to-br from-blue-700 via-indigo-700 to-rose-700 border-rose-500/60 hover:border-blue-400 text-white shadow-rose-600/20'
            }`}
          >
            <Power className="w-9 h-9 mb-1" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {status === 'CONNECTED'
                ? 'หยุด VPN'
                : status === 'CONNECTING'
                ? 'ยกเลิก'
                : 'เริ่มเชื่อมต่อ'}
            </span>
          </button>
        </div>
      </div>

      {/* Data Counters (Download & Upload) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#161c28] border border-blue-900/40">
          <div className="flex items-center space-x-1.5 text-[10px] text-blue-400 mb-0.5">
            <ArrowDownUp className="w-3 h-3" />
            <span>ดาวน์โหลด (Download)</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-100">
            {status === 'CONNECTED' ? formatBytes(downloadBytes) : '0 B'}
          </div>
          <div className="text-[9px] text-slate-500">WS Channel 128k</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#161c28] border border-rose-900/40">
          <div className="flex items-center space-x-1.5 text-[10px] text-rose-400 mb-0.5">
            <Activity className="w-3 h-3" />
            <span>อัปโหลด (Upload)</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-100">
            {status === 'CONNECTED' ? formatBytes(uploadBytes) : '0 B'}
          </div>
          <div className="text-[9px] text-slate-500">Local SOCKS5 :{settings.socksPort}</div>
        </div>
      </div>

      {/* Live Macro Tags Inspector Accordion */}
      <div className="p-3 rounded-2xl bg-[#161c28] border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPayloadPreview(!showPayloadPreview)}
            className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5 hover:text-white"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>การแทนค่าแท็ก [crlf] [host] [ua]</span>
          </button>
          <button
            onClick={onNavigateToLogs}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
          >
            เปิดบันทึก →
          </button>
        </div>

        {showPayloadPreview && (
          <div className="pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
            <div className="text-slate-400">Header ที่ถูกแปลงเพื่อยิงออกไป:</div>
            <pre className="p-2 bg-[#121620] border border-slate-700/60 rounded-xl overflow-x-auto text-[10px] text-emerald-400 whitespace-pre">
              {expandedPayloadText || 'ไม่มีเพย์โหลด'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
