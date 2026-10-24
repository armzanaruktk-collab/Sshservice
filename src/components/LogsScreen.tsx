import React, { useState, useRef, useEffect } from 'react';
import { LogItem } from '../types/vpn';
import { Trash2, Copy, Check, Filter, Terminal, ArrowDown, ArrowUp } from 'lucide-react';

interface LogsScreenProps {
  logs: LogItem[];
  onClear: () => void;
}

export const LogsScreen: React.FC<LogsScreenProps> = ({ logs, onClear }) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'ssh' | 'vpn'>('all');
  const [copied, setCopied] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((item) => {
    if (filter === 'error') return item.type === 'error' || item.text.toLowerCase().includes('error');
    if (filter === 'ssh') return item.text.toLowerCase().includes('ssh') || item.text.toLowerCase().includes('host');
    if (filter === 'vpn') return item.text.toLowerCase().includes('tunnel') || item.text.toLowerCase().includes('tproxy') || item.text.toLowerCase().includes('socks');
    return true;
  });

  const displayLogs = reverseOrder ? [...filteredLogs].reverse() : filteredLogs;

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.time}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full px-4 py-5 space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-slate-100">Live Logs</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
            {filteredLogs.length}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setReverseOrder(!reverseOrder)}
            title={reverseOrder ? 'Switch to oldest first' : 'Switch to newest first (Android default)'}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs flex items-center space-x-1"
          >
            {reverseOrder ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{reverseOrder ? 'Newest' : 'Oldest'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs flex items-center space-x-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={onClear}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg text-xs flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            filter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('ssh')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            filter === 'ssh' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          SSH
        </button>
        <button
          onClick={() => setFilter('vpn')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            filter === 'vpn' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          TUN/SOCKS5
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            filter === 'error' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Errors
        </button>
      </div>

      {/* Terminal View */}
      <div
        ref={scrollContainerRef}
        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto font-mono text-xs space-y-1.5 shadow-inner"
      >
        {displayLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-center">
            No log entries recorded.
          </div>
        ) : (
          displayLogs.map((log) => {
            const isError = log.type === 'error' || log.text.toLowerCase().includes('error') || log.text.toLowerCase().includes('fatal');
            const isSuccess = log.type === 'success' || log.text.toLowerCase().includes('connected') || log.text.toLowerCase().includes('started');
            const isWarn = log.type === 'warn' || log.text.toLowerCase().includes('reconnecting') || log.text.toLowerCase().includes('lost');

            let textColor = 'text-slate-300';
            if (isError) textColor = 'text-rose-400 font-semibold';
            else if (isSuccess) textColor = 'text-emerald-400';
            else if (isWarn) textColor = 'text-amber-400';

            return (
              <div key={log.id} className="leading-relaxed break-all flex items-start space-x-2">
                <span className="text-slate-500 select-none shrink-0">[{log.time}]</span>
                <span className={textColor}>{log.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
