import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ParkingSpot, ParkingTicket, VehicleType } from '../types';
import { Car, MapPin, Check, Clock, ShieldOff, Zap, Timer, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedSpot: ParkingSpot | null;
  availableSpots: ParkingSpot[];
  onCompleteCheckIn: (ticket: ParkingTicket) => void;
}

export const CheckInModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedSpot,
  availableSpots,
  onCompleteCheckIn,
}) => {
  const [spotId, setSpotId] = useState<string>('');
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [arrivalMinutes, setArrivalMinutes] = useState<number>(15);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [mode, setMode] = useState<'reserve' | 'park_now'>('reserve');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedSpot && selectedSpot.status === 'available') {
        setSpotId(selectedSpot.id);
        if (selectedSpot.zone === 'EV') {
          setVehicleType('ev');
        }
      } else if (availableSpots.length > 0 && !spotId) {
        setSpotId(availableSpots[0].id);
      }
    }
  }, [isOpen, selectedSpot, availableSpots, spotId]);

  if (!isOpen) return null;

  const currentSpotObj = availableSpots.find((s) => s.id === spotId) || selectedSpot;

  const effectiveMinutes = arrivalMinutes === -1 ? Math.max(1, parseInt(customMinutes, 10) || 15) : arrivalMinutes;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!spotId) {
      alert('กรุณาเลือกช่องจอดรถที่ต้องการ');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const isParkingNow = mode === 'park_now';
    const expectedArrival = !isParkingNow
      ? new Date(now.getTime() + effectiveMinutes * 60 * 1000).toISOString()
      : undefined;

    const ticketId = `RES-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTicket: ParkingTicket = {
      ticketId,
      spotId,
      plateNumber: plateNumber.trim() ? plateNumber.trim().toUpperCase() : 'จองทั่วไป',
      vehicleType,
      entryTime: now.toISOString(),
      expectedArrivalTime: expectedArrival,
      parkedTime: isParkingNow ? now.toISOString() : undefined,
      status: isParkingNow ? 'parked' : 'reserved',
      note: note.trim() || undefined,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // fallback
      }
      onCompleteCheckIn(newTicket);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="parking-checkin-dialog"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">บันทึกจอง / เข้าจอดรถ</h2>
              <p className="text-xs text-slate-400">ระบุเวลาเข้าจอดเพื่อรักษาสิทธิ์ของท่าน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Highlight Banner */}
        <div className="bg-emerald-950/30 border-b border-emerald-500/20 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldOff className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ไม่ต้องยืนยันตัวตน</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>กำหนดเวลาเข้าจอดได้เอง</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Action Mode Toggle: จองล่วงหน้า vs จอดทันที */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              เลือกรูปแบบการใช้งาน
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('reserve')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'reserve'
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-amber-400 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>จองล่วงหน้า</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  กำลังเดินทาง กำหนดเวลาเดินทางมาถึง
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('park_now')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'park_now'
                    ? 'bg-rose-500/15 border-rose-500/60 text-rose-200 shadow-sm ring-1 ring-rose-500/40'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-rose-400 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>จอดทันที</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  รถถึงช่องแล้ว เปลี่ยนสถานะเป็น "จอด"
                </p>
              </button>
            </div>
          </div>

          {/* Spot Selection Box */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> ช่องจอดที่เลือก
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                id="select-parking-spot"
                value={spotId}
                onChange={(e) => setSpotId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
              >
                {availableSpots.length === 0 ? (
                  <option value="">ไม่มีช่องว่าง</option>
                ) : (
                  availableSpots.map((s) => (
                    <option key={s.id} value={s.id}>
                      ช่อง {s.id} ({s.zone === 'EV' ? '⚡ EV' : `โซน ${s.zone}`})
                    </option>
                  ))
                )}
              </select>

              {currentSpotObj && (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">สถานะปัจจุบัน</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ว่าง
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                    {currentSpotObj.id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Arrival Time Selection (Only when mode === 'reserve') */}
          {mode === 'reserve' && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-amber-400" />
                  กำหนดเวลาที่ผู้จองจะเข้าจอด (นาที)
                </label>
                <span className="text-[11px] text-amber-400/90 font-mono font-semibold">
                  {effectiveMinutes} นาที
                </span>
              </div>

              <p className="text-[11px] text-slate-300">
                หากเกินเวลานี้ ระบบจะ<strong className="text-amber-300">แจ้งเตือนก่อน</strong> และหากยังไม่ยืนยันเข้าจอด ระบบจะ<strong className="text-rose-400">ตัดสิทธิ์การจองทันที</strong> เพื่อคืนช่องว่างให้ผู้อื่น
              </p>

              {/* Quick Select Minute Pills */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { mins: 10, label: '10 นาที' },
                  { mins: 15, label: '15 นาที' },
                  { mins: 30, label: '30 นาที' },
                  { mins: 60, label: '1 ชั่วโมง' },
                ].map((item) => (
                  <button
                    key={item.mins}
                    type="button"
                    onClick={() => {
                      setArrivalMinutes(item.mins);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      arrivalMinutes === item.mins
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-950'
                        : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input */}
              <div className="pt-1.5 flex items-center gap-2">
                <span className="text-[11px] text-slate-400">หรือระบุเอง:</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="เช่น 20"
                  value={arrivalMinutes === -1 ? customMinutes : ''}
                  onFocus={() => setArrivalMinutes(-1)}
                  onChange={(e) => {
                    setArrivalMinutes(-1);
                    setCustomMinutes(e.target.value);
                  }}
                  className="w-24 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-slate-400">นาที</span>
              </div>
            </div>
          )}

          {/* Vehicle Plate (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-slate-400" /> เลขทะเบียนรถ
              </label>
              <span className="text-[11px] text-slate-500">(ไม่บังคับ - ระบุหรือไม่ก็ได้)</span>
            </div>
            <input
              id="checkin-plate"
              type="text"
              placeholder="เช่น 1กข 4455 หรือเว้นว่างได้"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-semibold uppercase tracking-wider focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Vehicle Type Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              ประเภทยานพาหนะ
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'car', label: 'รถเก๋ง' },
                { id: 'suv', label: 'SUV' },
                { id: 'ev', label: '⚡ EV' },
                { id: 'motorcycle', label: 'มอเตอร์ไซค์' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVehicleType(item.id as VehicleType)}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    vehicleType === item.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-sm'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Policy Summary */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {mode === 'reserve'
                  ? `ป้ายกำกับจะเป็น "จอง" (รอนานสุด ${effectiveMinutes} นาที)`
                  : 'ป้ายกำกับจะเป็น "จอด" ทันที'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {mode === 'reserve'
                ? 'เมื่อผู้จองเดินทางมาถึงช่อง ให้กดปุ่ม "ยืนยันเข้าจอดแล้ว" เพื่อเปลี่ยนป้ายกำกับเป็น "จอด"'
                : 'รถเข้าจอดในช่องแล้ว สามารถคืนช่องจอดว่างได้ตลอดเวลาเมื่อต้องการออก'}
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
            >
              ยกเลิก
            </button>
            <button
              id="confirm-checkin-btn"
              type="submit"
              disabled={isSubmitting || !spotId}
              className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 ${
                mode === 'reserve'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
              }`}
            >
              {isSubmitting ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {mode === 'reserve'
                    ? `ยืนยันการจองช่อง ${spotId} (${effectiveMinutes} นาที)`
                    : `ยืนยันการเข้าจอดช่อง ${spotId}`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

