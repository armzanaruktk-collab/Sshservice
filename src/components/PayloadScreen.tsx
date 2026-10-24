import React, { useState } from 'react';
import { PayloadItem } from '../types/vpn';
import {
  ArrowLeft,
  Trash2,
  Plus,
  RotateCw,
  Search,
  Monitor,
  Edit3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface PayloadScreenProps {
  payloads: PayloadItem[];
  selectedPayloadId: string | null;
  onSelectPayload: (id: string) => void;
  onAddPayload: () => void;
  onEditPayload: (payload: PayloadItem) => void;
  onDeletePayload: (payload: PayloadItem) => void;
  onClearCustomPayloads: () => void;
  onBack: () => void;
}

export const PayloadScreen: React.FC<PayloadScreenProps> = ({
  payloads,
  selectedPayloadId,
  onSelectPayload,
  onAddPayload,
  onEditPayload,
  onDeletePayload,
  onClearCustomPayloads,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = payloads.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.protocol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#121620] text-slate-100 select-none overflow-hidden">
      {/* Top App Bar matching Screenshot 1 */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#151a26] border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-400" />
          </button>
          <h1 className="text-base font-bold text-emerald-400">
            ({payloads.length}) รายการเพย์โหลด
          </h1>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onClearCustomPayloads}
            title="ล้างเพย์โหลดที่สร้างเอง"
            className="p-2 text-emerald-400/80 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onAddPayload}
            title="เพิ่มเพย์โหลดใหม่"
            className="p-2 text-emerald-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSearchQuery('')}
            title="รีเฟรชรายการ"
            className="p-2 text-emerald-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar matching Screenshot 1 */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหา"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a2130] border border-slate-700/60 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Payload Cards List */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-3">
        {filtered.map((item) => {
          const isSelected = item.id === selectedPayloadId;

          let badgeBorderColor = 'border-emerald-500/60 text-emerald-400 bg-emerald-950/20';
          if (item.speedColor === 'blue') {
            badgeBorderColor = 'border-blue-500/60 text-blue-400 bg-blue-950/20';
          } else if (item.speedColor === 'red') {
            badgeBorderColor = 'border-rose-500/60 text-rose-400 bg-rose-950/20';
          }

          return (
            <div
              key={item.id}
              onClick={() => onSelectPayload(item.id)}
              className={`relative cursor-pointer rounded-2xl border transition-all p-3.5 ${
                isSelected
                  ? 'bg-[#182030] border-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-[#161c28] border-emerald-900/50 hover:border-emerald-500/60'
              }`}
            >
              {/* Header inside card: Monitor Icon + Title pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1e2738] border border-emerald-600/40 text-xs font-semibold text-slate-100">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>{item.name}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 font-medium">
                      กำลังเลือก
                    </span>
                  )}
                </div>

                {/* Edit & Delete Action icons on right */}
                <div
                  className="flex items-center space-x-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onEditPayload(item)}
                    title="แก้ไขเพย์โหลด"
                    className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeletePayload(item)}
                    title="ลบเพย์โหลด"
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges Row: speed good + เพย์โหลดระบบ */}
              <div className="flex items-center space-x-2 mt-2.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${badgeBorderColor}`}
                >
                  {item.speed}
                </span>

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-slate-700/80 bg-slate-800/40 text-[11px] font-medium text-slate-400">
                  {item.isSystem ? 'เพย์โหลดระบบ' : 'เพย์โหลดผู้ใช้'}
                </span>

                {item.isCloudflare && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                    CF
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
