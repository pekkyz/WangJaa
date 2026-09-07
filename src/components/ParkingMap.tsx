import React, { useState } from 'react';
import { ParkingSpot, SpotType } from '../types';
import {
  Car,
  Zap,
  Accessibility,
  Crown,
  QrCode,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  ChevronRight,
  BookmarkCheck,
  Timer,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { formatDuration, formatRemainingTime } from '../utils/parkingUtils';

interface Props {
  spots: ParkingSpot[];
  selectedSpotId: string | null;
  onSelectSpot: (spot: ParkingSpot) => void;
  onOpenCheckIn: (spot: ParkingSpot) => void;
  onOpenSpotQR: (spot: ParkingSpot) => void;
  activeSpotId?: string;
  onReleaseSpot?: (spotId: string) => void;
  onConfirmParkedSpot?: (spotId: string) => void;
}

export const ParkingMap: React.FC<Props> = ({
  spots,
  selectedSpotId,
  onSelectSpot,
  onOpenCheckIn,
  onOpenSpotQR,
  activeSpotId,
  onReleaseSpot,
  onConfirmParkedSpot,
}) => {
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'A' | 'B' | 'EV' | 'P'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'available' | 'reserved' | 'parked'>('ALL');

  // Filter logic
  const filteredSpots = spots.filter((spot) => {
    if (zoneFilter !== 'ALL' && spot.zone !== zoneFilter) return false;
    if (statusFilter !== 'ALL' && spot.status !== statusFilter) return false;
    return true;
  });

  const totalSpots = spots.length;
  const availableCount = spots.filter((s) => s.status === 'available').length;
  const reservedCount = spots.filter((s) => s.status === 'reserved').length;
  const parkedCount = spots.filter((s) => s.status === 'parked').length;
  const evAvailableCount = spots.filter((s) => s.zone === 'EV' && s.status === 'available').length;

  const getSpotTypeBadge = (type: SpotType) => {
    switch (type) {
      case 'ev':
        return (
          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
            <Zap className="w-3 h-3" /> EV 22kW
          </span>
        );
      case 'disabled':
        return (
          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
            <Accessibility className="w-3 h-3" /> ผู้พิการ
          </span>
        );
      case 'vip':
        return (
          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
            <Crown className="w-3 h-3" /> VIP
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300">
            ทั่วไป
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 3 Clear Status Counter Cards: ว่าง, จอง (รอเข้าจอด), จอด (จอดอยู่) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Status: Available */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'ALL' : 'available')}
          className={`cursor-pointer transition-all bg-slate-900/90 border rounded-2xl p-4 flex items-center gap-3.5 shadow-lg ${
            statusFilter === 'available'
              ? 'border-emerald-400 ring-2 ring-emerald-500/30'
              : 'border-emerald-500/30 shadow-emerald-950/20 hover:border-emerald-500/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/40 shrink-0">
            🟢
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 block font-medium">ป้าย: ว่าง</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                พร้อมจอด
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {availableCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ {totalSpots} ช่อง</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-medium block">
              กดจอง หรือสแกนเพื่อเข้าจอดได้ทันที
            </span>
          </div>
        </div>

        {/* Status: Reserved (จอง - รอเข้าจอด) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'reserved' ? 'ALL' : 'reserved')}
          className={`cursor-pointer transition-all bg-slate-900/90 border rounded-2xl p-4 flex items-center gap-3.5 shadow-lg ${
            statusFilter === 'reserved'
              ? 'border-amber-400 ring-2 ring-amber-500/30'
              : 'border-amber-500/30 shadow-amber-950/20 hover:border-amber-500/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/40 shrink-0">
            🟡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 block font-medium">ป้าย: จอง</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold animate-pulse">
                รอเข้าจอด
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                {reservedCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ {totalSpots} ช่อง</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-medium block">
              นับถอยหลังตามเวลาผู้จอง (เตือนก่อนตัดสิทธิ์)
            </span>
          </div>
        </div>

        {/* Status: Parked (จอด - รถเข้าช่องแล้ว) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'parked' ? 'ALL' : 'parked')}
          className={`cursor-pointer transition-all bg-slate-900/90 border rounded-2xl p-4 flex items-center gap-3.5 shadow-lg ${
            statusFilter === 'parked'
              ? 'border-rose-400 ring-2 ring-rose-500/30'
              : 'border-rose-500/30 shadow-rose-950/20 hover:border-rose-500/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl border border-rose-500/40 shrink-0">
            🔴
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 block font-medium">ป้าย: จอด</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">
                รถอยู่ในช่อง
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
                {parkedCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ {totalSpots} ช่อง</span>
            </div>
            <span className="text-[10px] text-rose-400/80 font-medium block">
              รถเข้าจอดเรียบร้อยแล้ว
            </span>
          </div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Zone buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> โซน:
          </span>
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'A', label: 'โซน A' },
            { id: 'B', label: 'โซน B' },
            { id: 'EV', label: '⚡ โซน EV' },
            { id: 'P', label: 'โซนพิเศษ (P)' },
          ].map((z) => (
            <button
              key={z.id}
              onClick={() => setZoneFilter(z.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                zoneFilter === z.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* 3 Clear Status Filters: ทั้งหมด, ว่าง, จอง, จอด */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ทั้งหมด ({totalSpots})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
              statusFilter === 'available'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            เฉพาะว่าง ({availableCount})
          </button>
          <button
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
              statusFilter === 'reserved'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            เฉพาะจอง ({reservedCount})
          </button>
          <button
            onClick={() => setStatusFilter('parked')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
              statusFilter === 'parked'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            เฉพาะจอด ({parkedCount})
          </button>
        </div>
      </div>

      {/* Interactive Parking Layout Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative">
        {/* Driveway / Entrance Header Indicator */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-5 text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-semibold text-sm">
              ผังช่องจอดรถ (แยกป้ายกำกับชัดเจน: ว่าง / จอง / จอด)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
              ว่าง (พร้อมจอด)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30 animate-pulse" />
              จอง (กำลังเดินทาง)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
              จอด (รถอยู่ในช่อง)
            </span>
          </div>
        </div>

        {/* Spots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredSpots.map((spot) => {
            const isAvailable = spot.status === 'available';
            const isReserved = spot.status === 'reserved';
            const isParked = spot.status === 'parked';
            const isSelected = selectedSpotId === spot.id;
            const isMySpot = activeSpotId === spot.id;

            const remaining =
              isReserved && spot.occupiedBy?.expectedArrivalTime
                ? formatRemainingTime(spot.occupiedBy.expectedArrivalTime)
                : null;

            return (
              <div
                key={spot.id}
                id={`parking-spot-${spot.id}`}
                onClick={() => onSelectSpot(spot)}
                className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between min-h-[156px] ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 scale-[1.02] z-10 shadow-lg shadow-emerald-950'
                    : ''
                } ${
                  isAvailable
                    ? 'bg-slate-800/40 hover:bg-emerald-950/30 border-slate-700/80 hover:border-emerald-500/60'
                    : isReserved
                    ? 'bg-amber-950/25 border-amber-600/50 hover:border-amber-400/80 shadow-sm shadow-amber-950/40'
                    : 'bg-rose-950/25 border-rose-600/50 hover:border-rose-400/80'
                }`}
              >
                {/* Spot Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black font-mono tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                      {spot.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Z-{spot.zone}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      title="ดู QR Code ประจำช่องจอดนี้"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSpotQR(spot);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-300 hover:bg-slate-700/80 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                          : isReserved
                          ? 'bg-amber-400 animate-ping shadow-sm shadow-amber-400'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Spot Content (Shows distinct "ว่าง", "จอง", "จอด") */}
                <div className="my-2">
                  {isAvailable ? (
                    <div className="py-2 text-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Car className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400 block">
                        ว่าง
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        พร้อมจอด
                      </span>
                    </div>
                  ) : isReserved ? (
                    <div className="py-1 space-y-1 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ป้าย: จอง
                      </div>

                      {spot.occupiedBy?.plateNumber ? (
                        <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80">
                          <span className="text-[11px] font-mono font-bold text-white tracking-wider block truncate">
                            {spot.occupiedBy.plateNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-300/80 block font-medium">
                          รอเดินทางมาถึง
                        </span>
                      )}

                      {/* Remaining arrival countdown */}
                      {remaining && (
                        <div
                          className={`flex items-center justify-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                            remaining.totalSeconds <= 180
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 animate-pulse'
                              : 'text-amber-300 bg-amber-950/60'
                          }`}
                        >
                          <Timer className="w-3 h-3" />
                          <span>{remaining.formatted}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-1 space-y-1 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        ป้าย: จอด
                      </div>

                      {spot.occupiedBy?.plateNumber ? (
                        <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80">
                          <span className="text-[11px] font-mono font-bold text-white tracking-wider block truncate">
                            {spot.occupiedBy.plateNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 block font-medium">
                          จอดแล้ว
                        </span>
                      )}

                      {spot.occupiedBy?.entryTime && (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {formatDuration(spot.occupiedBy.parkedTime || spot.occupiedBy.entryTime).formatted}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Spot Footer & Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  {getSpotTypeBadge(spot.type)}

                  {isAvailable ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCheckIn(spot);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-sm"
                    >
                      จองช่องนี้
                    </button>
                  ) : isReserved && isMySpot && onConfirmParkedSpot ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirmParkedSpot(spot.id);
                      }}
                      className="text-[10px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow"
                    >
                      ถึงแล้ว (จอด)
                    </button>
                  ) : isMySpot && onReleaseSpot ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReleaseSpot(spot.id);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-600/50 font-medium transition-colors"
                    >
                      คืนช่องว่าง
                    </button>
                  ) : isReserved ? (
                    <span className="text-[10px] text-amber-400 font-semibold">ป้าย: จอง</span>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-semibold">ป้าย: จอด</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredSpots.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            ไม่พบช่องจอดรถตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>
    </div>
  );
};
