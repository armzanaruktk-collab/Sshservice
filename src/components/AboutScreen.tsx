import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  Server,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface AboutScreenProps {
  onBack: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const nodes = [
    { id: 0, name: 'Node 0 (Japan Direct)', ping: 38, status: 'Online' },
    { id: 1, name: 'Node 1 (Singapore Cloud)', ping: 24, status: 'Online' },
    { id: 2, name: 'Node 2 (Thailand BDIX)', ping: 9, status: 'Online' },
  ];

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateMsg('');
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateMsg('เวอร์ชันปัจจุบัน worldvpn-release-85 เป็นเวอร์ชันล่าสุดแล้ว');
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#121620] text-slate-100 select-none overflow-y-auto pb-10">
      {/* Header matching Screenshot 3 */}
      <div className="flex items-center space-x-3 px-4 py-3 bg-[#151a26] border-b border-slate-800 sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-emerald-400" />
        </button>
        <h1 className="text-base font-bold text-emerald-400">เกี่ยวกับ</h1>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Version Box matching Screenshot 3 */}
        <div className="p-4 rounded-3xl bg-[#161c28] border-2 border-emerald-500/70 space-y-2.5 shadow-md">
          <div className="font-bold text-slate-100 text-sm">
            WORLD VPN APP worldvpn-release-85 (build 85)
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
            OpenVPN core 3.12_git:master(worldvpnapp:RelWithDebInfo) android armv7a 32-bit
            <br />
            App Build: อัปเดตล่าสุด 12:24 06-10-2026
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-colors flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
              <span>{checkingUpdate ? 'กำลังตรวจ...' : 'อัปเดต'}</span>
            </button>
            <span className="text-[10px] text-slate-400">
              ปรับปรุงล่าสุด (04:15 01/10/2568)
            </span>
          </div>

          {updateMsg && (
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-400 text-[11px]">
              {updateMsg}
            </div>
          )}

          {/* Direct APK Download Link */}
          <div className="pt-2 space-y-2">
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
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:brightness-110 text-white font-bold flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ APK (worldvpn-release-85.apk)</span>
            </button>
            <div className="text-center text-[10px] text-slate-400">
              หรือเปิดลิงก์ตรงบนมือถือ: <span className="font-mono text-blue-400 select-all">/download/apk</span>
            </div>

            {/* Note about APK Parsing and PWA */}
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-[11px] text-amber-300 space-y-1.5 text-left">
              <div className="font-bold flex items-center space-x-1.5 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>หากมือถือขึ้น "พบปัญหาในการแยกวิเคราะห์แพ็กเกจ":</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                ไฟล์ขนาด 19.9 KB เป็นโครงสร้างซอร์สโค้ดเริ่มต้น หากต้องการเปิดใช้แบบแอพแท้ทันที:
              </p>
              <div className="bg-[#121620] p-2.5 rounded-xl border border-slate-700/60 space-y-1 text-[11px]">
                <div className="text-emerald-400 font-semibold">✅ วิธีที่ 1 (ใช้งานได้ทันที 100%):</div>
                <div className="text-slate-300">
                  กดปุ่มเมนู <strong>3 จุด (⋮)</strong> ของเบราว์เซอร์ Chrome หรือ Samsung Internet ด้านบน แล้วเลือก <strong>"เพิ่มไปยังหน้าจอหลัก (Add to Home screen)"</strong> จะได้ไอคอนแอปเปิดเต็มจอเหมือนแอปปกติทันที
                </div>
              </div>
              <div className="bg-[#121620] p-2.5 rounded-xl border border-slate-700/60 space-y-1 text-[11px]">
                <div className="text-blue-400 font-semibold">⚙️ วิธีที่ 2 (คอมไพล์ APK ไบนารีแท้ 15MB):</div>
                <div className="text-slate-300">
                  ดาวน์โหลดไฟล์ <strong>SshVpn.zip</strong> แล้วนำไปรันบน GitHub Actions ระบบจะคอมไพล์ไฟล์ .apk พร้อมใช้งานอัตโนมัติ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Notices Card matching Screenshot 3 */}
        <div className="p-4 rounded-3xl bg-[#161c28] border-2 border-emerald-500/70 space-y-3 shadow-md">
          <div className="text-center font-bold text-slate-100 text-sm">
            หน้าติดตามข่าวสารล่าสุด
          </div>

          <div className="p-2.5 rounded-2xl bg-[#121620] border border-slate-800 text-[11px] text-emerald-400 leading-relaxed text-center">
            โปรดทราบ แอพนี้คือแอพฟรีนะครับ ไม่มีการขายหรือจำหน่ายใดๆ ทั้งสิ้น และไม่แสวงหาผลประโยชน์ใดๆ
          </div>

          <div className="p-3.5 rounded-2xl bg-[#121620] border border-slate-800 space-y-2 text-[11px]">
            <div className="font-bold text-slate-200 text-center pb-1 border-b border-slate-800 text-xs">
              ประกาศจากแอดมิน: เรื่องต้องห้ามในเซิร์ฟเวอร์ WORLD VPN APP
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• ซอฟต์แวร์ใดๆ ที่เกี่ยวข้องกับอาชญากรรมไซเบอร์ ที่บุกรุกคอมพิวเตอร์ (แฮก) และการขโมยรหัสผ่าน</li>
              <li>• ปลอมแปลงเครื่องหมายลิขสิทธิ์การค้า</li>
              <li>• ใช้ภาพอนาจารเด็กเพื่อการแสวงหาผลประโยชน์</li>
              <li>• การแสวงหาผลประโยชน์จากเด็กหรืออินเทอร์เน็ต และการเชื่อมต่อที่ไม่ถูกต้อง</li>
              <li>• การหลอกลวงทางอินเทอร์เน็ต และสแปม</li>
              <li>• การล่วงละเมิดทางอินเทอร์เน็ต</li>
              <li>• ข่มขู่หรือแฮกอินเทอร์เน็ต</li>
              <li>• ก่อความไม่สงบกับผู้อื่น</li>
              <li>• ขโมยความลับทางการค้า</li>
              <li>• โจมตีบริการ (D / DoS)</li>
            </ul>
          </div>
        </div>

        {/* Server Nodes matching Screenshot 3 */}
        <div className="p-4 rounded-3xl bg-[#161c28] border-2 border-emerald-500/70 space-y-2.5 shadow-md">
          <div className="font-bold text-slate-200 text-xs">รายละเอียดการใช้งาน (Node Clusters)</div>

          <div className="space-y-2">
            {nodes.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#121620] border border-slate-700/80"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{n.name}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Latency: {n.ping} ms</span>
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800 text-[10px] font-mono">
                  {n.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
