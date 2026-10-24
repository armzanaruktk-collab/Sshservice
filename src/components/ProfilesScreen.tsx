import React, { useState } from 'react';
import { SshProfile } from '../types/vpn';
import {
  Plus,
  Edit2,
  Trash2,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Upload,
  Server,
  Zap,
  MoreVertical,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface ProfilesScreenProps {
  profiles: SshProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (profile: SshProfile) => void;
  onDelete: (profile: SshProfile) => void;
  onAdd: () => void;
  onImport: (profiles: SshProfile[]) => void;
}

export const ProfilesScreen: React.FC<ProfilesScreenProps> = ({
  profiles,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
  onImport,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');

  const handleCopyCommand = (p: SshProfile) => {
    const cmd = `ssh -D 1080 -C -N ${p.username}@${p.host} -p ${p.port}`;
    navigator.clipboard.writeText(cmd);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestConnection = async (p: SshProfile) => {
    setTestingId(p.id);
    setTestResult(null);
    try {
      const res = await fetch('/api/ssh/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: p.host,
          port: p.port,
          username: p.username,
          password: p.password,
          privateKey: p.privateKey,
          passphrase: p.passphrase,
        }),
      });
      const data = await res.json();
      setTestResult({
        id: p.id,
        ok: data.success,
        msg: data.success ? 'Handshake OK' : (data.error || 'Failed'),
      });
    } catch (e: any) {
      setTestResult({ id: p.id, ok: false, msg: e.message || 'Error' });
    } finally {
      setTestingId(null);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(profiles, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sshvpn_profiles_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of profiles');
      const sanitized: SshProfile[] = parsed.map((item, idx) => ({
        id: item.id || `imported-${Date.now()}-${idx}`,
        name: item.name || item.host || 'Imported Profile',
        host: item.host || '127.0.0.1',
        port: parseInt(item.port, 10) || 22,
        username: item.username || 'root',
        password: item.password || '',
        privateKey: item.privateKey || '',
        passphrase: item.passphrase || '',
      }));
      onImport(sanitized);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-5 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100">SSH Profiles</h2>
          <p className="text-xs text-slate-400">{profiles.length} configured server(s)</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            title="Import Profiles JSON"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportJson}
            title="Export Profiles JSON"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onAdd}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Profile</span>
          </button>
        </div>
      </div>

      {/* Profiles List */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 text-center space-y-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <Server className="w-10 h-10 text-slate-600" />
          <div className="text-sm font-semibold text-slate-300">No SSH Profiles</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Add an SSH server profile with credentials to establish your VPN tunnel.
          </p>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
          >
            Create First Profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => {
            const isSelected = p.id === selectedId;
            const hasKey = Boolean(p.privateKey && p.privateKey.trim());
            const thisTest = testResult?.id === p.id ? testResult : null;

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border transition-all p-4 ${
                  isSelected
                    ? 'bg-slate-900/95 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <button
                      type="button"
                      onClick={() => onSelect(p.id)}
                      className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'border-slate-700 hover:border-slate-500 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-100 text-sm">{p.name}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {p.username}@{p.host}:{p.port}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEdit(p)}
                      title="Edit Profile"
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      title="Delete Profile"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badges & Extra tools */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                      {hasKey ? (
                        <>
                          <Key className="w-3 h-3 text-amber-400" />
                          <span>Private Key</span>
                        </>
                      ) : (
                        <>
                          <Terminal className="w-3 h-3 text-blue-400" />
                          <span>Password Auth</span>
                        </>
                      )}
                    </span>

                    {thisTest && (
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] ${
                          thisTest.ok
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {thisTest.ok ? <Check className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        <span>{thisTest.msg}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestConnection(p)}
                      disabled={testingId === p.id}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
                    >
                      {testingId === p.id ? 'Testing...' : 'Test SSH'}
                    </button>
                    <button
                      onClick={() => handleCopyCommand(p)}
                      title="Copy CLI SSH Command"
                      className="inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
                    >
                      {copiedId === p.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === p.id ? 'Copied' : 'CLI cmd'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Import Profiles (JSON)</h3>
            <p className="text-xs text-slate-400">
              Paste JSON formatted profiles matching Android <code className="text-indigo-300">Store.kt</code>.
            </p>
            <textarea
              rows={6}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='[{"id":"1","name":"Server","host":"1.2.3.4","port":22,"username":"root","password":"..."}]'
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
            />
            {importError && <p className="text-xs text-rose-400">{importError}</p>}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
