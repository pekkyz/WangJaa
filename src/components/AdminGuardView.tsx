import React, { useState } from 'react';
import { ParkingSpot, ActivityLog } from '../types';
import {
  ShieldAlert,
  Car,
  Clock,
  LogOut,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Play,
  Pause,
  AlertTriangle,
  History,
  TrendingUp,
} from 'lucide-react';
import { formatDuration, formatThaiDateTime } from '../utils/parkingUtils';

interface Props {
  spots: ParkingSpot[];
  logs: ActivityLog[];
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onManualCheckout: (spotId: string) => void;
  onResetAll: () => void;
  onOpenScanner: () => void;
}

export const AdminGuardView: React.FC<Props> = ({
  spots,
  logs,
  isSimulating,
  onToggleSimulation,
  onManualCheckout,
  onResetAll,
  onOpenScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'occupied' | 'logs' | 'management'>('occupied');

  const reservedSpots = spots.filter((s) => s.status === 'reserved');
  const parkedSpots = spots.filter((s) => s.status === 'parked');
  const occupiedSpots = spots.filter((s) => s.status === 'reserved' || s.status === 'parked');
  const availableSpots = spots.filter((s) => s.status === 'available');

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                แผงควบคุมผู้ดูแลระบบและ รปภ. (Admin & Guard Console)
              </h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-mono">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ตรวจสอบสถานะ แยกป้าย "จอง" (รอเข้าจอด) และ "จอด" (รถอยู่ในช่อง) ชัดเจน
            </p>
          </div>
        </div>

        {/* Real-time simulator toggle & quick scan */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isSimulating
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'จำลองรถเข้า-ออก (ทำงานอยู่)' : 'เปิดจำลองรถเข้า-ออก Auto'}</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1 shadow transition-colors"
          >
            สแกนตั๋ว/ช่อง
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('occupied')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'occupied'
              ? 'border-emerald-400 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4" />
          ช่องไม่ว่าง (จอง {reservedSpots.length} / จอด {parkedSpots.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-emerald-400 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          ประวัติกิจกรรม ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('management')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'management'
              ? 'border-emerald-400 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          จัดการระบบ
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'occupied' && (
        <div className="space-y-3">
          {occupiedSpots.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              ขณะนี้ไม่มีช่องจอดที่ไม่ว่าง (ที่จอดว่างทั้งหมด 100%)
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">ช่องจอด</th>
                    <th className="p-3">ป้ายสถานะ</th>
                    <th className="p-3">ป้ายทะเบียน</th>
                    <th className="p-3">กำหนดเวลา / เวลาเริ่ม</th>
                    <th className="p-3">ระยะเวลา</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-normal">
                  {occupiedSpots.map((spot) => {
                    const occ = spot.occupiedBy;
                    const dur = occ ? formatDuration(occ.parkedTime || occ.entryTime) : null;
                    const isReserved = spot.status === 'reserved';

                    return (
                      <tr key={spot.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                            {spot.id}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                            Z-{spot.zone}
                          </span>
                        </td>
                        <td className="p-3">
                          {isReserved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              ป้าย: จอง (รอเข้าจอด)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              ป้าย: จอด (ในช่อง)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-white tracking-wider">
                            {occ?.plateNumber || 'ไม่ระบุ'}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {isReserved && occ?.expectedArrivalTime ? (
                            <span className="text-amber-300 font-medium">
                              กำหนดถึง: {new Date(occ.expectedArrivalTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                            </span>
                          ) : occ?.entryTime ? (
                            formatThaiDateTime(occ.entryTime)
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-medium">
                          {dur?.formatted || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onManualCheckout(spot.id)}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-medium transition-colors"
                          >
                            คืนช่องว่าง (Release)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              ยังไม่มีบันทึกกิจกรรม
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.type === 'reserve'
                        ? 'bg-amber-400'
                        : log.type === 'park'
                        ? 'bg-rose-400'
                        : log.type === 'release'
                        ? 'bg-emerald-400'
                        : log.type === 'auto_cancel' || log.type === 'warning'
                        ? 'bg-orange-400'
                        : 'bg-blue-400'
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-200">{log.title}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{log.description}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'management' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <h4 className="text-sm font-semibold text-white mb-1">สรุปข้อมูลลานจอด WangJaa</h4>
            <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">ช่องจอดว่าง (Available)</span>
                <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {availableSpots.length} ช่อง
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">ป้าย: จอง (รอเข้าจอด)</span>
                <p className="text-xl font-black text-amber-400 font-mono mt-1">
                  {reservedSpots.length} ช่อง
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">ป้าย: จอด (ในช่อง)</span>
                <p className="text-xl font-black text-rose-400 font-mono mt-1">
                  {parkedSpots.length} ช่อง
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-rose-300">รีเซ็ตสถานะช่องจอด</h4>
              <p className="text-[11px] text-slate-400">
                คืนค่าข้อมูลช่องจอดทั้งหมดเป็นค่าเริ่มต้นสำหรับการนำเสนอ
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('ต้องการรีเซ็ตข้อมูลลานจอดทั้งหมดใช่หรือไม่?')) {
                  onResetAll();
                }
              }}
              className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-medium transition-colors"
            >
              รีเซ็ตระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
