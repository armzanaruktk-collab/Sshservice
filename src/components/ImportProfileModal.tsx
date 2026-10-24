import React, { useState } from 'react';
import { SAMPLE_OVPN_CONFIG } from '../services/store';
import { SshProfile } from '../types/vpn';
import { FileText, X, CheckCircle } from 'lucide-react';

interface ImportProfileModalProps {
  onDismiss: () => void;
  onImport: (profile: SshProfile, rawConfig: string) => void;
}

export const ImportProfileModal: React.FC<ImportProfileModalProps> = ({
  onDismiss,
  onImport,
}) => {
  const [fileName, setFileName] = useState('Japan [public-vpn-217]');
  const [configText, setConfigText] = useState(SAMPLE_OVPN_CONFIG);
  const [error, setError] = useState('');

  const handleImport = () => {
    if (!fileName.trim()) {
      setError('กรุณาระบุชื่อไฟล์');
      return;
    }

    // Parse remote host and port from config
    let remoteHost = 'public-vpn-217.opengw.net';
    let remotePort = 443;
    const remoteMatch = configText.match(/^remote\s+([^\s]+)\s+(\d+)/m);
    if (remoteMatch) {
      remoteHost = remoteMatch[1];
      remotePort = parseInt(remoteMatch[2], 10);
    }

    const newProfile: SshProfile = {
      id: 'ovpn-' + Date.now().toString(36),
      name: fileName.trim(),
      host: remoteHost,
      port: remotePort,
      username: 'vpn',
      password: 'vpn',
      pingMs: Math.floor(Math.random() * 30 + 15),
      countryCode: 'JP',
    };

    onImport(newProfile, configText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-[#161c28] border-2 border-emerald-500/70 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top title matching Screenshot 6 */}
        <div className="space-y-3 pb-3 border-b border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ชื่อไฟล์:
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Japan [public-vpn-217]"
              className="w-full px-4 py-2.5 bg-[#121620] border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-hidden focus:border-emerald-400"
            />
          </div>

          <label className="block text-xs font-semibold text-slate-300">
            โปรไฟล์นำเข้า
          </label>
        </div>

        {/* Scrollable Config Textarea matching Screenshot 6 */}
        <div className="flex-1 overflow-hidden py-3">
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            rows={12}
            className="w-full h-full p-3.5 bg-[#121620] border border-slate-700/80 rounded-2xl text-slate-300 font-mono text-[11px] leading-relaxed resize-none focus:outline-hidden focus:border-emerald-400"
          />
        </div>

        {error && <div className="text-xs text-rose-400 pb-2">{error}</div>}

        {/* Action Buttons matching Screenshot 6 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="py-2.5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="py-2.5 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-white transition-all shadow-md"
          >
            นำเข้าไฟล์
          </button>
        </div>
      </div>
    </div>
  );
};
