import React, { useState, useEffect } from 'react';
import {
  Car,
  QrCode,
  Search,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  availableCount: number;
  reservedCount: number;
  parkedCount: number;
  totalCount: number;
  onOpenScanner: () => void;
  onOpenFindCar: () => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onOpenCheckIn: () => void;
}

export const Navbar: React.FC<Props> = ({
  availableCount,
  reservedCount,
  parkedCount,
  totalCount,
  onOpenScanner,
  onOpenFindCar,
  isAdminView,
  onToggleAdminView,
  onOpenCheckIn,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-1 ring-white/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                WangJaa
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ว่างจ้า
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ระบบจองและจอดรถแบบออนไลน์
            </p>
          </div>
        </div>

        {/* Center Live availability chip (Shows ว่าง, จอง, จอด) */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-2xl text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-semibold">{timeStr}</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold text-emerald-400 font-mono" title="ที่จอดว่าง">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ว่าง: {availableCount}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 font-bold text-amber-400 font-mono" title="จองล่วงหน้า (รอเข้าจอด)">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              จอง: {reservedCount}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 font-bold text-rose-400 font-mono" title="จอดแล้ว">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              จอด: {parkedCount}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Scan QR Button */}
          <button
            id="nav-scan-qr-btn"
            onClick={onOpenScanner}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>สแกน QR</span>
          </button>

          {/* Quick Reserve Button */}
          <button
            id="nav-checkin-btn"
            onClick={onOpenCheckIn}
            className="hidden sm:flex px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            <span>จองที่จอด</span>
          </button>

          {/* Find Spot/Car Button */}
          <button
            id="nav-find-car-btn"
            onClick={onOpenFindCar}
            title="ค้นหาช่องจอดรถ"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Admin Toggle */}
          <button
            id="toggle-admin-view"
            onClick={onToggleAdminView}
            className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
              isAdminView
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="แผงควบคุมเจ้าหน้าที่ รปภ. / ผู้ดูแลระบบ"
          >
            {isAdminView ? 'โหมดผู้ดูแล (ON)' : 'โหมดผู้ดูแล'}
          </button>
        </div>
      </div>
    </header>
  );
};
