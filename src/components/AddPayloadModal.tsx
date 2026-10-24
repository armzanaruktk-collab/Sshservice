import React, { useState } from 'react';
import { PayloadItem, ProtocolType } from '../types/vpn';
import { PlusCircle, X, Sparkles, Check } from 'lucide-react';

interface AddPayloadModalProps {
  initial: PayloadItem | null;
  onDismiss: () => void;
  onSave: (payload: PayloadItem) => void;
}

export const AddPayloadModal: React.FC<AddPayloadModalProps> = ({
  initial,
  onDismiss,
  onSave,
}) => {
  const [protocol, setProtocol] = useState<ProtocolType>(initial?.protocol || 'OVPN_WS');
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [isCloudflare, setIsCloudflare] = useState(initial?.isCloudflare ?? true);
  const [isSsl, setIsSsl] = useState(initial?.isSsl ?? false);
  const [rawPayload, setRawPayload] = useState(
    initial?.rawPayload ||
      'GET / HTTP/1.1[crlf]Host: [host_port][crlf]Upgrade: websocket[crlf]Connection: Upgrade[crlf]User-Agent: [ua][crlf][crlf]'
  );
  const [proxyHost, setProxyHost] = useState(initial?.proxyHost || '[host]');
  const [proxyPort, setProxyPort] = useState(String(initial?.proxyPort || '80'));

  const insertTag = (tag: string) => {
    setRawPayload((prev) => prev + tag);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const item: PayloadItem = {
      id: initial?.id || 'payload-' + Date.now().toString(36),
      name: name.trim(),
      description: description.trim(),
      protocol,
      speed: '(speed good)',
      speedColor: isSsl ? 'red' : 'green',
      isSystem: false,
      isCloudflare,
      isSsl,
      rawPayload,
      proxyHost: proxyHost.trim() || '[host]',
      proxyPort: parseInt(proxyPort, 10) || (isSsl ? 443 : 80),
    };
    onSave(item);
  };

  const protocols: { label: string; value: ProtocolType }[] = [
    { label: 'OVPN WS', value: 'OVPN_WS' },
    { label: 'OVPN HTTP', value: 'OVPN_HTTP' },
    { label: 'OVPN SSL', value: 'OVPN_SSL' },
    { label: 'OVPN DNSTT', value: 'OVPN_DNSTT' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-[#161c28] border-2 border-emerald-500/70 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header matching Screenshot 2 */}
        <div className="flex flex-col items-center justify-center pt-2 pb-3">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-2">
            <PlusCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-100">
            {initial ? 'แก้ไขเพย์โหลด' : 'เพิ่มเพย์โหลด'}
          </h2>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
          {/* Protocol Radios matching Screenshot 2 */}
          <div className="flex flex-wrap items-center justify-center gap-3 py-1">
            {protocols.map((p) => {
              const checked = protocol === p.value;
              return (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => {
                    setProtocol(p.value);
                    if (p.value === 'OVPN_SSL') {
                      setIsSsl(true);
                      setProxyPort('443');
                    } else if (p.value === 'OVPN_DNSTT') {
                      setProxyPort('53');
                    } else {
                      setIsSsl(false);
                      setProxyPort('80');
                    }
                  }}
                  className="flex items-center space-x-1.5 cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      checked
                        ? 'border-emerald-400 bg-emerald-500/20'
                        : 'border-slate-600 bg-transparent'
                    }`}
                  >
                    {checked && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                  <span className={`font-semibold ${checked ? 'text-slate-100' : 'text-slate-400'}`}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ชื่อเพย์โหลด */}
          <div>
            <input
              type="text"
              placeholder="ชื่อเพย์โหลด"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#121620] border border-slate-700 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 text-xs"
            />
          </div>

          {/* รายละเอียดเพย์โหลด */}
          <div>
            <input
              type="text"
              placeholder="รายละเอียดเพย์โหลด"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#121620] border border-slate-700 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 text-xs"
            />
          </div>

          {/* Switch เพย์โหลด CF */}
          <div className="flex items-center justify-between py-1 px-1">
            <span className="font-semibold text-slate-200 text-xs">เพย์โหลด</span>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-400">CF</span>
              <button
                type="button"
                onClick={() => setIsCloudflare(!isCloudflare)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  isCloudflare ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isCloudflare ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Textarea Header code */}
          <div className="space-y-1.5">
            <textarea
              rows={4}
              value={rawPayload}
              onChange={(e) => setRawPayload(e.target.value)}
              placeholder="GET / HTTP/1.1[crlf]Host: [host_port][crlf]Upgrade: websocket[crlf][crlf]"
              className="w-full p-3 bg-[#121620] border border-slate-700 rounded-2xl text-slate-300 font-mono text-[11px] leading-relaxed focus:outline-hidden focus:border-emerald-400"
            />

            {/* Quick Macro Buttons for [crlf], [host], [ua] etc. */}
            <div className="flex flex-wrap gap-1">
              {['[crlf]', '[host]', '[host_port]', '[port]', '[ua]', '[protocol]', '[split]'].map(
                (tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => insertTag(tag)}
                    className="px-2 py-0.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-700/60 text-blue-300 font-mono text-[10px] transition-colors"
                  >
                    +{tag}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Switch SSL/TLS */}
          <div className="flex items-center justify-between py-1 px-1">
            <span className="font-semibold text-slate-200 text-xs">SSL/TLS</span>
            <button
              type="button"
              onClick={() => setIsSsl(!isSsl)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                isSsl ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  isSsl ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ที่อยู่พร็อกซี่ */}
          <div>
            <input
              type="text"
              placeholder="ที่อยู่พร็อกซี่ (ค่าเริ่มต้นใส่ host หรือ [host])"
              value={proxyHost}
              onChange={(e) => setProxyHost(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#121620] border border-slate-700 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 text-xs font-mono"
            />
          </div>

          {/* พอร์ต */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              พอร์ต (WS 80, 2086 | SSL/TLS 443, 8443)
            </label>
            <input
              type="number"
              placeholder="80"
              value={proxyPort}
              onChange={(e) => setProxyPort(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-4 py-2.5 bg-[#121620] border border-slate-700 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 text-xs font-mono"
            />
          </div>
        </div>

        {/* Action Buttons matching Screenshot 2 */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onDismiss}
            className="py-2.5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={handleSave}
            className="py-2.5 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-white transition-all shadow-md disabled:opacity-40"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};
