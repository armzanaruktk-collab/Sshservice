import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Folder,
  Download,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Terminal,
  Loader2,
  FileText,
  Boxes,
} from 'lucide-react';
import { SourceFileNode } from '../types/vpn';

export const SourceCodeViewer: React.FC = () => {
  const [files, setFiles] = useState<SourceFileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('app/src/main/java/com/sshvpn/app/ui/App.kt');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Key quick-access files
  const featuredFiles = [
    { name: 'App.kt', path: 'app/src/main/java/com/sshvpn/app/ui/App.kt', desc: 'Jetpack Compose UI' },
    { name: 'SshTunnelService.kt', path: 'app/src/main/java/com/sshvpn/app/vpn/SshTunnelService.kt', desc: 'Android VpnService & JSch' },
    { name: 'SocksServer.kt', path: 'app/src/main/java/com/sshvpn/app/vpn/SocksServer.kt', desc: 'Local SOCKS5 Server' },
    { name: 'TProxyService.java', path: 'app/src/main/java/hev/htproxy/TProxyService.java', desc: 'JNI Bridge for hev-socks5' },
    { name: 'Store.kt', path: 'app/src/main/java/com/sshvpn/app/data/Store.kt', desc: 'SharedPreferences Manager' },
    { name: 'AndroidManifest.xml', path: 'app/src/main/AndroidManifest.xml', desc: 'Permissions & Services' },
    { name: 'build.gradle.kts', path: 'app/build.gradle.kts', desc: 'Dependencies & AGP' },
    { name: 'build.yml', path: '.github/workflows/build.yml', desc: 'GitHub Actions APK Builder' },
    { name: 'README.md', path: 'README.md', desc: 'Architecture & Limitations' },
  ];

  useEffect(() => {
    fetch('/api/source-tree')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) setFiles(data.files);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    setLoadingFile(true);
    fetch(`/api/source-file?path=${encodeURIComponent(selectedFile)}`)
      .then((res) => res.text())
      .then((text) => {
        setFileContent(text);
      })
      .catch((err) => {
        setFileContent(`Error loading file: ${err.message}`);
      })
      .finally(() => {
        setLoadingFile(false);
      });
  }, [selectedFile]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">Android Source & APK Builder</h2>
          </div>
          <p className="text-xs text-slate-400">
            Original uploaded Kotlin & JNI Native Tunnel codebase
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/download/zip');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'SshVpn.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              } catch {
                window.location.href = '/download/zip';
              }
            }}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download SshVpn.zip</span>
          </button>
        </div>
      </div>

      {/* Quick Tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-thin">
        {featuredFiles.map((f) => (
          <button
            key={f.path}
            onClick={() => setSelectedFile(f.path)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono shrink-0 flex items-center space-x-1.5 transition-all ${
              selectedFile === f.path
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{f.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden min-h-0">
        {/* Left Side: File Explorer */}
        <div className="hidden lg:flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden p-3 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Project Files</span>
            <span className="text-[10px] text-slate-500 font-normal">SshVpn/</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-xs font-mono">
            {files
              .filter((f) => !f.isDir)
              .map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    selectedFile === file.path
                      ? 'bg-indigo-950/60 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{file.name}</span>
                  {file.size && (
                    <span className="text-[10px] text-slate-500 ml-2">
                      {(file.size / 1024).toFixed(0)}k
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Right Side: Code Viewer */}
        <div className="lg:col-span-3 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-0">
          {/* File Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-mono truncate">
              <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedFile}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Text */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-300">
            {loadingFile ? (
              <div className="h-full flex items-center justify-center space-x-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading source...</span>
              </div>
            ) : (
              <pre className="whitespace-pre">
                <code>{fileContent}</code>
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Build Info Card */}
      <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-semibold text-indigo-300 flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>How to compile SshVpn APK:</span>
          </div>
          <p className="text-slate-400">
            Push this project to a GitHub repository with GitHub Actions enabled. It automatically runs the NDK build for <code className="text-slate-300">libhev-socks5-tunnel.so</code> and outputs the signed debug APK!
          </p>
        </div>
        <a
          href="/SshVpn.zip"
          download="SshVpn.zip"
          className="shrink-0 text-indigo-400 hover:text-indigo-300 font-semibold underline"
        >
          Get Source Zip (.zip)
        </a>
      </div>
    </div>
  );
};
