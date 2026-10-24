import React, { useState } from 'react';
import { SshProfile } from '../types/vpn';
import { Eye, EyeOff, Key, Server, ShieldCheck, X, Check, Loader2 } from 'lucide-react';

interface ProfileDialogProps {
  initial: SshProfile | null;
  onDismiss: () => Unit;
  onSave: (profile: SshProfile) => void;
  onTestConnection?: (profile: SshProfile) => Promise<boolean>;
}

type Unit = void;

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  initial,
  onDismiss,
  onSave,
  onTestConnection,
}) => {
  const [name, setName] = useState(initial?.name || '');
  const [host, setHost] = useState(initial?.host || '');
  const [port, setPort] = useState(initial ? String(initial.port) : '22');
  const [username, setUsername] = useState(initial?.username || '');
  const [password, setPassword] = useState(initial?.password || '');
  const [privateKey, setPrivateKey] = useState(initial?.privateKey || '');
  const [passphrase, setPassphrase] = useState(initial?.passphrase || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState<'password' | 'key'>(
    initial?.privateKey ? 'key' : 'password'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const parsedPort = parseInt(port, 10);
  const isValid = host.trim().length > 0 && username.trim().length > 0 && !isNaN(parsedPort) && parsedPort >= 1 && parsedPort <= 65535;

  const handleSave = () => {
    if (!isValid) return;
    const finalProfile: SshProfile = {
      id: initial?.id || 'prof-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim() || host.trim(),
      host: host.trim(),
      port: parsedPort,
      username: username.trim(),
      password: activeAuthTab === 'password' ? password : '',
      privateKey: activeAuthTab === 'key' ? privateKey : '',
      passphrase: activeAuthTab === 'key' ? passphrase : '',
    };
    onSave(finalProfile);
  };

  const handleTest = async () => {
    if (!isValid) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ssh/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: parsedPort,
          username: username.trim(),
          password: activeAuthTab === 'password' ? password : '',
          privateKey: activeAuthTab === 'key' ? privateKey : '',
          passphrase: activeAuthTab === 'key' ? passphrase : '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: 'Connected & Authenticated successfully!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network test error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {initial ? 'Edit SSH Profile' : 'Add SSH Profile'}
              </h2>
              <p className="text-xs text-slate-400">Configure remote SSH host credentials</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Profile Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Profile Display Name <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. My Fast Tunnel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Host / IP Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.100 or vpn.server.com"
                value={host}
                onChange={(e) => setHost(e.target.value.trim())}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Port <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                placeholder="22"
                value={port}
                onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              SSH Username <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. root, ubuntu, vpnuser"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
            />
          </div>

          {/* Authentication Mode Tabs */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Authentication Method
            </label>
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveAuthTab('password')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeAuthTab === 'password'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Password Authentication
              </button>
              <button
                type="button"
                onClick={() => setActiveAuthTab('key')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeAuthTab === 'key'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Private Key (PEM)
              </button>
            </div>
          </div>

          {/* Password Field */}
          {activeAuthTab === 'password' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                SSH Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter SSH password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Key Fields */}
          {activeAuthTab === 'key' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Private Key (OpenSSH / RSA / Ed25519 in PEM format)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full p-3 bg-slate-950/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Key Passphrase <span className="text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Passphrase if key is encrypted"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-950/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test connection alert result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            disabled={!isValid || isTesting}
            onClick={handleTest}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 border border-indigo-800/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            {isTesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>{isTesting ? 'Testing SSH...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isValid}
              onClick={handleSave}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
