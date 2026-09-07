import React, { useState, useEffect } from 'react';
import { ParkingTicket, ParkingSpot } from '../types';
import {
  generateQRCodeDataURL,
  formatDuration,
  formatThaiDateTime,
  formatRemainingTime,
} from '../utils/parkingUtils';
import {
  Car,
  Clock,
  MapPin,
  QrCode,
  LogOut,
  CheckCircle2,
  BookmarkCheck,
  AlertTriangle,
  Timer,
  Check,
} from 'lucide-react';

interface Props {
  ticket: ParkingTicket;
  spot?: ParkingSpot;
  onCheckOut: (ticketId: string) => void;
  onConfirmParked?: (ticketId: string) => void;
  onNavigateToSpot?: (spotId: string) => void;
}

export const ActiveTicketCard: React.FC<Props> = ({
  ticket,
  spot,
  onCheckOut,
  onConfirmParked,
  onNavigateToSpot,
}) => {
  const [duration, setDuration] = useState(formatDuration(ticket.parkedTime || ticket.entryTime));
  const [remaining, setRemaining] = useState(
    ticket.expectedArrivalTime ? formatRemainingTime(ticket.expectedArrivalTime) : null
  );
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const isReservedOnly = ticket.status === 'reserved';
  const isParked = ticket.status === 'parked';

  // Live timer tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(formatDuration(ticket.parkedTime || ticket.entryTime));
      if (ticket.expectedArrivalTime) {
        setRemaining(formatRemainingTime(ticket.expectedArrivalTime));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ticket.entryTime, ticket.parkedTime, ticket.expectedArrivalTime]);

  // Generate QR Code for this ticket
  useEffect(() => {
    generateQRCodeDataURL(`PARK_TICKET:${ticket.ticketId}`).then((url) => {
      setQrUrl(url);
    });
  }, [ticket.ticketId]);

  const handleCheckoutClick = () => {
    const actionName = isReservedOnly ? 'ยกเลิกการจอง' : 'ออกจากช่องจอด';
    const confirmed = window.confirm(
      `ยืนยันการ${actionName} ช่อง ${ticket.spotId} เพื่อคืนสถานะให้เป็น "ว่าง" ?`
    );
    if (confirmed) {
      setIsCheckingOut(true);
      setTimeout(() => {
        onCheckOut(ticket.ticketId);
        setIsCheckingOut(false);
      }, 300);
    }
  };

  return (
    <div
      id="active-parking-pass"
      className={`relative overflow-hidden border rounded-3xl p-5 sm:p-6 shadow-2xl transition-all ${
        isReservedOnly
          ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 shadow-amber-950/30'
          : 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/50 shadow-rose-950/30'
      }`}
    >
      {/* Background decoration */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isReservedOnly ? 'bg-amber-500/10' : 'bg-rose-500/10'
        }`}
      />

      {/* Ticket Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
              isReservedOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {isReservedOnly ? <Timer className="w-6 h-6" /> : <Car className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isReservedOnly ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  ป้ายกำกับ: จอง (รอเข้าจอด)
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  ป้ายกำกับ: จอด (รถอยู่ในช่อง)
                </span>
              )}

              {ticket.expectedArrivalTime && isReservedOnly && remaining && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 ${
                    remaining.totalSeconds <= 180
                      ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {remaining.isExpired ? 'หมดเวลาที่กำหนด!' : `เหลือเวลาเข้าจอด: ${remaining.formatted}`}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mt-1">
              {isReservedOnly ? 'บัตรจองช่องจอดล่วงหน้า' : 'บัตรจอดรถเข้าจอดแล้ว'} #{ticket.ticketId}
            </h3>
          </div>
        </div>

        {/* Spot Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700 px-4 py-2 rounded-2xl">
          <MapPin className={`w-4 h-4 ${isReservedOnly ? 'text-amber-400' : 'text-rose-400'}`} />
          <div>
            <span className="text-[10px] text-slate-400 block leading-none">ช่องของคุณ</span>
            <span className="text-lg font-black font-mono text-white leading-tight">
              {ticket.spotId}
            </span>
          </div>
        </div>
      </div>

      {/* Warning Banner if remaining time is running low */}
      {isReservedOnly && remaining && remaining.totalSeconds <= 180 && !remaining.isExpired && (
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/60 flex items-center gap-3 text-xs text-amber-200 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <strong className="block font-bold text-amber-300">
              แจ้งเตือน: ใกล้ถึงเวลาที่ท่านกำหนดแล้ว (เหลือ {remaining.formatted})
            </strong>
            <span>
              กรุณากดปุ่ม <strong>"ยืนยันว่าเข้าจอดแล้ว"</strong> หากถึงช่องจอดแล้ว เพื่อป้องกันการถูกตัดสิทธิ์จองทันที
            </span>
          </div>
          {onConfirmParked && (
            <button
              onClick={() => onConfirmParked(ticket.ticketId)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shrink-0 shadow transition-colors"
            >
              ถึงช่องแล้ว
            </button>
          )}
        </div>
      )}

      {/* Ticket Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-5 items-center">
        {/* Col 1: Spot & Booking Info */}
        <div className="space-y-3">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">ข้อมูลรถ</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="px-3 py-1 bg-white text-slate-900 font-black font-mono text-base rounded-xl border-2 border-slate-300 tracking-wider shadow-sm">
                {ticket.plateNumber || 'จองทั่วไป'}
              </div>
              <span className="text-xs text-slate-300 font-medium">
                {ticket.vehicleType === 'ev' ? '⚡ รถไฟฟ้า EV' : 'ยานพาหนะ'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">
              {isReservedOnly ? 'เวลาที่บันทึกการจอง' : 'เวลาเริ่มเข้าจอด'}
            </span>
            <p className="text-xs font-mono text-slate-300">{formatThaiDateTime(ticket.entryTime)}</p>
          </div>

          {ticket.expectedArrivalTime && isReservedOnly && (
            <div>
              <span className="text-[11px] text-amber-400 font-medium">กำหนดเวลาต้องมาถึง</span>
              <p className="text-xs font-mono text-amber-200 font-bold">
                {formatThaiDateTime(ticket.expectedArrivalTime)}
              </p>
            </div>
          )}

          <div>
            <span className="text-[11px] text-slate-400 font-medium">สถานะสิทธิ์</span>
            <p className="text-xs text-emerald-400">
              {isReservedOnly
                ? 'รักษาสิทธิ์จองตามเวลาที่ผู้จองกำหนด'
                : 'รถเข้าจอดในช่องแล้ว ป้ายกำกับเปลี่ยนเป็น "จอด"'}
            </p>
          </div>
        </div>

        {/* Col 2: Live Duration / Countdown */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center text-center">
          {isReservedOnly && remaining ? (
            <>
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 mb-1 font-medium">
                <Timer className="w-4 h-4 text-amber-400" />
                <span>เวลานับถอยหลังก่อนตัดสิทธิ์</span>
              </div>

              <div
                className={`font-mono text-3xl sm:text-4xl font-black tracking-tight my-1 ${
                  remaining.totalSeconds <= 180 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                }`}
              >
                {remaining.formatted}
              </div>
              <p className="text-xs text-slate-400">
                {remaining.isExpired
                  ? 'เกินเวลาที่กำหนด ระบบจะตัดสิทธิ์ทันที'
                  : `เหลือเวลา ${remaining.minutes} นาที ${remaining.seconds} วินาที`}
              </p>

              {onConfirmParked && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onConfirmParked(ticket.ticketId)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    ยืนยันว่ารถเข้าจอดแล้ว (เปลี่ยนเป็น "จอด")
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mb-1 font-medium">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>ระยะเวลาที่จอดอยู่</span>
              </div>

              <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight my-1">
                {String(duration.hours).padStart(2, '0')}:
                {String(duration.minutes).padStart(2, '0')}:
                {String(duration.seconds).padStart(2, '0')}
              </div>
              <p className="text-xs text-slate-400">
                {duration.hours} ชม. {duration.minutes} นาที {duration.seconds} วินาที
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  สถานะ: รถจอดเรียบร้อยแล้ว
                </span>
              </div>
            </>
          )}
        </div>

        {/* Col 3: QR Code for quick check/release */}
        <div className="flex flex-col items-center justify-center p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-center">
          <span className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" /> QR ประจำบัตรจอง
          </span>

          {qrUrl ? (
            <div className="p-2 bg-white rounded-xl shadow-md inline-block">
              <img src={qrUrl} alt="Booking QR" className="w-28 h-28" />
            </div>
          ) : (
            <div className="w-28 h-28 bg-slate-800 rounded-xl animate-pulse" />
          )}

          <p className="text-[10px] text-slate-400 mt-2">
            สแกนเพื่อยืนยันเข้าจอด หรือคืนสถานะช่องจอด
          </p>
        </div>
      </div>

      {/* Ticket Footer Actions */}
      <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isReservedOnly ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
            }`}
          />
          <span>
            {isReservedOnly
              ? 'ระบบกำลังรอนำรถเข้าจอด หากเกินเวลาที่กำหนดจะถูกตัดสิทธิ์ทันที'
              : 'สถานะบนผังคือ "จอด" จนกว่าจะกดคืนช่อง'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToSpot && (
            <button
              onClick={() => onNavigateToSpot(ticket.spotId)}
              className="px-3.5 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
            >
              ดูช่อง {ticket.spotId} บนผัง
            </button>
          )}

          <button
            id="checkout-ticket-btn"
            onClick={handleCheckoutClick}
            disabled={isCheckingOut}
            className="px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            {isCheckingOut
              ? 'กำลังคืนช่อง...'
              : isReservedOnly
              ? 'ยกเลิกการจอง / คืนช่องว่าง'
              : 'ออกจากช่องจอด / คืนช่องว่าง'}
          </button>
        </div>
      </div>
    </div>
  );
};

