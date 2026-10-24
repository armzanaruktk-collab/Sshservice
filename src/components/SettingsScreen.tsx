import React, { useState } from 'react';
import { VpnSettings } from '../types/vpn';
import {
  Settings,
  X,
  Check,
  RotateCcw,
  Bell,
  Activity,
  Zap,
  Volume2,
  FileText,
  Battery,
  Shield,
  RefreshCw,
  Sliders,
  Keyboard,
  Lock,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: VpnSettings;
  onSave: (settings: VpnSettings) => void;
  onClose?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [adv, setAdv] = useState(settings.advanced);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof adv) => {
    const updated = { ...adv, [key]: !adv[key] };
    setAdv(updated);
    onSave({ ...settings, advanced: updated });
    triggerSaved();
  };

  const triggerSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#121620] text-slate-100 select-none overflow-y-auto pb-12">
      {/* Top Header matching Screenshot 4 */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#151a26] border-b border-slate-800 sticky top-0 z-20">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Settings className="w-5 h-5" />
          <h1 className="text-base font-bold">การตั้งค่า</h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-colors"
          >
            ปิด
          </button>
        )}
      </div>

      <div className="p-4 space-y-3 text-xs">
        {/* Section title pill matching Screenshot 4 */}
        <div className="inline-block px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-300 font-semibold text-xs mb-1">
          OpenVPN Setting
        </div>

        {/* 1. ความเร็วของเครือข่าย */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">ความเร็วของเครือข่าย</div>
            <div className="text-[11px] text-slate-400">แสดงการแจ้งเตือนความเร็วของเครือข่าย</div>
          </div>
          <button
            type="button"
            onClick={() => toggle('showNetworkSpeed')}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              adv.showNetworkSpeed ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                adv.showNetworkSpeed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 2. การแจ้งเตือน */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">การแจ้งเตือน</div>
            <div className="text-[11px] text-slate-400">แสดงการแจ้งเตือนขณะเชื่อมต่อหรืออื่นๆ</div>
          </div>
          <button
            type="button"
            onClick={() => toggle('showNotification')}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              adv.showNotification ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                adv.showNotification ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 3. ตำแหน่งการแจ้งเตือน */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">ตำแหน่งการแจ้งเตือน</div>
            <div className="text-[11px] text-slate-400">ปรับตำแหน่งแสดงด้านบนหรือด้านล่าง</div>
          </div>
          <button
            onClick={() => {
              const updated = {
                ...adv,
                notificationPosition: (adv.notificationPosition === 'bottom' ? 'top' : 'bottom') as 'top' | 'bottom',
              };
              setAdv(updated);
              onSave({ ...settings, advanced: updated });
              triggerSaved();
            }}
            className="text-slate-400 font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-[11px]"
          >
            {adv.notificationPosition === 'bottom' ? 'ด้านล่าง' : 'ด้านบน'}
          </button>
        </div>

        {/* 4. เชื่อมต่ออัตโนมัติ */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">เชื่อมต่ออัตโนมัติ</div>
            <div className="text-[11px] text-slate-400">เชื่อมต่ออัตโนมัติเมื่อกดเลือกเซิร์ฟเวอร์</div>
          </div>
          <button
            type="button"
            onClick={() => toggle('autoConnectOnSelect')}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              adv.autoConnectOnSelect ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                adv.autoConnectOnSelect ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 5. เสียงและสั่น */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">เสียงและสั่น</div>
            <div className="text-[11px] text-slate-400">เสียงและสั่นทำงานในแอปเมื่อเชื่อมต่อสำเร็จหรืออื่นๆ</div>
          </div>
          <button
            type="button"
            onClick={() => toggle('soundAndVibration')}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              adv.soundAndVibration ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                adv.soundAndVibration ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 6. เปิดหน้าบันทึก */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">เปิดหน้าบันทึก</div>
            <div className="text-[11px] text-slate-400">เมื่อกดเชื่อมต่อ VPN ให้เปิดหน้าบันทึกทันที เพื่อดูรายละเอียด</div>
          </div>
          <button
            type="button"
            onClick={() => toggle('autoOpenLogsOnConnect')}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              adv.autoOpenLogsOnConnect ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                adv.autoOpenLogsOnConnect ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 7. ประหยัดแบตเตอรี่ */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">ประหยัดแบตเตอรี่</div>
            <div className="text-[11px] text-slate-400">หยุด VPN ชั่วคราวเมื่อล็อคหน้าจอ</div>
          </div>
          <button
            type="button"
            onClick={() => toggle('batterySaver')}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              adv.batterySaver ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                adv.batterySaver ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 8. อุโมงค์ไร้รอยต่อ (Kill Switch) */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">อุโมงค์ไร้รอยต่อ</div>
            <div className="text-[11px] text-slate-400">บล็อคอินเทอร์เน็ตในขณะที่ VPN หยุดชั่วคราวหรือเชื่อมต่อใหม่</div>
          </div>
          <button
            type="button"
            onClick={() => toggle('seamlessTunnel')}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              adv.seamlessTunnel ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                adv.seamlessTunnel ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 9. เวอร์ชั่น TLS ขั้นต่ำ */}
        <div className="p-3.5 rounded-2xl bg-[#161c28] border-2 border-emerald-500/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100">เวอร์ชั่น TLS ขั้นต่ำ</div>
            <div className="text-[11px] text-slate-400">เลือกรุ่น SSL / TLS ขั้นต่ำสำหรับสื่อสารกับเซิร์ฟเวอร์</div>
          </div>
          <button
            onClick={() => {
              const updated = {
                ...adv,
                minTlsVersion: (adv.minTlsVersion === 'TLS 1.2' ? 'TLS 1.3' : 'TLS 1.2') as 'TLS 1.2' | 'TLS 1.3',
              };
              setAdv(updated);
              onSave({ ...settings, advanced: updated });
              triggerSaved();
            }}
            className="text-emerald-400 font-mono font-bold px-3 py-1 rounded-lg bg-slate-800 text-xs border border-emerald-700/50"
          >
            {adv.minTlsVersion}
          </button>
        </div>
      </div>
    </div>
  );
};
