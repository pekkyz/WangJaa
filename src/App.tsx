/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_PARKING_SPOTS } from './data/initialSpots';
import { ParkingSpot, ParkingTicket, ActivityLog } from './types';
import { Navbar } from './components/Navbar';
import { ParkingMap } from './components/ParkingMap';
import { ActiveTicketCard } from './components/ActiveTicketCard';
import { QRScannerModal } from './components/QRScannerModal';
import { CheckInModal } from './components/CheckInModal';
import { SpotQRCodeModal } from './components/SpotQRCodeModal';
import { FindMyCarModal } from './components/FindMyCarModal';
import { AdminGuardView } from './components/AdminGuardView';
import {
  Car,
  QrCode,
  Sparkles,
  MapPin,
  Clock,
  ShieldOff,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

const STORAGE_KEY_SPOTS = 'smart_parking_spots_v2';
const STORAGE_KEY_TICKET = 'smart_parking_active_ticket_v2';
const STORAGE_KEY_LOGS = 'smart_parking_logs_v2';

export default function App() {
  // 1. Core State
  const [spots, setSpots] = useState<ParkingSpot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPOTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PARKING_SPOTS;
  });

  const [activeTicket, setActiveTicket] = useState<ParkingTicket | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TICKET);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'reserve',
        title: 'บันทึกการจองช่อง A-06',
        description: 'สแกน QR บันทึกการจอง (สถานะ: จองแล้ว)',
        spotId: 'A-06',
        plateNumber: '1กพ 2450',
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'reserve',
        title: 'บันทึกการจองจุดชาร์จ EV-01',
        description: 'จองจุดชาร์จไฟฟ้า EV 22kW เรียบร้อย',
        spotId: 'EV-01',
        plateNumber: '5กฮ 7799',
      },
    ];
  });

  // 2. Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isFindCarOpen, setIsFindCarOpen] = useState(false);
  const [isSpotQROpen, setIsSpotQROpen] = useState(false);
  const [selectedSpotForQR, setSelectedSpotForQR] = useState<ParkingSpot | null>(null);

  // 3. Selection & View state
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SPOTS, JSON.stringify(spots));
  }, [spots]);

  useEffect(() => {
    if (activeTicket) {
      localStorage.setItem(STORAGE_KEY_TICKET, JSON.stringify(activeTicket));
    } else {
      localStorage.removeItem(STORAGE_KEY_TICKET);
    }
  }, [activeTicket]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 30)));
  }, [logs]);

  // Toast Helper
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Add Log Helper
  const addLog = useCallback(
    (type: ActivityLog['type'], title: string, description: string, spotId?: string, plateNumber?: string) => {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        type,
        title,
        description,
        spotId,
        plateNumber,
      };
      setLogs((prev) => [newLog, ...prev]);
    },
    []
  );

  // Track warned spots to avoid spamming warning toast repeatedly
  const warnedSpotsRef = React.useRef<Set<string>>(new Set());

  // Reservation Arrival Deadline Watcher:
  // Monitors all 'reserved' spots with expectedArrivalTime.
  // 1. Warns 2 minutes before deadline.
  // 2. Automatically cuts/cancels reservation if time expires without parking.
  useEffect(() => {
    const checkDeadlines = () => {
      const nowMs = Date.now();

      setSpots((prevSpots) => {
        let hasChanges = false;
        const updatedSpots = prevSpots.map((spot) => {
          if (spot.status !== 'reserved' || !spot.occupiedBy?.expectedArrivalTime) {
            return spot;
          }

          const arrivalMs = new Date(spot.occupiedBy.expectedArrivalTime).getTime();
          const diffSeconds = Math.floor((arrivalMs - nowMs) / 1000);

          // 1. Warning when remaining time <= 120 seconds (2 minutes) and not yet expired
          if (diffSeconds > 0 && diffSeconds <= 120) {
            if (!warnedSpotsRef.current.has(spot.id)) {
              warnedSpotsRef.current.add(spot.id);
              const isUserSpot = activeTicket?.spotId === spot.id;
              showToast(
                `⚠️ แจ้งเตือน: ช่อง ${spot.id} เหลือเวลาอีกไม่ถึง 2 นาทีในการเข้าจอด หากเกินเวลาจะถูกตัดสิทธิ์ทันที!`,
                'warn'
              );
              addLog(
                'warning',
                `แจ้งเตือนใกล้หมดเวลาจองช่อง ${spot.id}`,
                `เหลือเวลาอีก ${Math.max(1, Math.ceil(diffSeconds / 60))} นาที หากเกินเวลาจะถูกตัดสิทธิ์`,
                spot.id,
                spot.occupiedBy.plateNumber
              );
            }
          }

          // 2. Expiration: Cut rights immediately when deadline is reached/passed (diffSeconds <= 0)
          if (diffSeconds <= 0) {
            hasChanges = true;
            warnedSpotsRef.current.delete(spot.id);

            const plate = spot.occupiedBy.plateNumber;
            const isUserSpot = activeTicket?.spotId === spot.id;

            addLog(
              'auto_cancel',
              `ตัดสิทธิ์การจองช่อง ${spot.id} ทันที (เกินเวลาที่กำหนด)`,
              `ผู้จองไม่ได้เข้าจอดภายในเวลาที่ระบุ ระบบตัดสิทธิ์และคืนช่องให้เป็น "ว่าง" พร้อมใช้งาน`,
              spot.id,
              plate
            );

            showToast(
              `ตัดสิทธิ์การจองช่อง ${spot.id} แล้ว เนื่องจากเกินเวลาที่กำหนด คืนสถานะเป็น "ว่าง" ทันที`,
              'warn'
            );

            if (isUserSpot) {
              setActiveTicket(null);
            }

            return {
              ...spot,
              status: 'available' as const,
              occupiedBy: undefined,
              currentTicketId: undefined,
            };
          }

          return spot;
        });

        return hasChanges ? updatedSpots : prevSpots;
      });
    };

    const deadlineInterval = setInterval(checkDeadlines, 2000);
    return () => clearInterval(deadlineInterval);
  }, [activeTicket, showToast, addLog]);

  // Real-time Traffic Simulator (Simulation mode)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSpots((prevSpots) => {
        // Exclude the spot the user is currently using with activeTicket
        const availablePool = prevSpots.filter(
          (s) => s.status === 'available' && s.id !== activeTicket?.spotId
        );
        const reservedPool = prevSpots.filter(
          (s) => s.status === 'reserved' && s.id !== activeTicket?.spotId
        );

        const shouldOccupy = Math.random() > 0.45 && availablePool.length > 0;

        if (shouldOccupy) {
          // Random booking happens
          const randomSpot = availablePool[Math.floor(Math.random() * availablePool.length)];
          const samplePlates = ['8กท 3341', '1ขจ 6652', '4กต 9012', 'ฮฮ 5511', '3ขข 1289'];
          const plate = samplePlates[Math.floor(Math.random() * samplePlates.length)];

          addLog(
            'reserve',
            `มีผู้จองช่อง ${randomSpot.id} (สแกน QR)`,
            `บันทึกสถานะเป็น "จอง" (ไม่มีการจำกัดเวลา)`,
            randomSpot.id,
            plate
          );

          return prevSpots.map((s) =>
            s.id === randomSpot.id
              ? {
                  ...s,
                  status: 'reserved',
                  occupiedBy: {
                    plateNumber: plate,
                    entryTime: new Date().toISOString(),
                    vehicleType: s.zone === 'EV' ? 'ev' : 'car',
                  },
                }
              : s
          );
        } else if (reservedPool.length > 0) {
          // Random release happens
          const randomSpot = reservedPool[Math.floor(Math.random() * reservedPool.length)];
          addLog(
            'release',
            `ปล่อยช่องจอด ${randomSpot.id} ให้เป็น "ว่าง"`,
            `คืนช่องจอดว่างเรียบร้อยแล้ว`,
            randomSpot.id,
            randomSpot.occupiedBy?.plateNumber
          );

          return prevSpots.map((s) =>
            s.id === randomSpot.id
              ? {
                  ...s,
                  status: 'available',
                  occupiedBy: undefined,
                  currentTicketId: undefined,
                }
              : s
          );
        }
        return prevSpots;
      });
    }, 18000);

    return () => clearInterval(interval);
  }, [isSimulating, activeTicket, addLog]);

  // Handle Check-In / Booking Completion
  const handleCompleteCheckIn = (ticket: ParkingTicket) => {
    setActiveTicket(ticket);
    const isParkingNow = ticket.status === 'parked';
    const finalStatus = isParkingNow ? 'parked' : 'reserved';

    setSpots((prev) =>
      prev.map((s) =>
        s.id === ticket.spotId
          ? {
              ...s,
              status: finalStatus,
              currentTicketId: ticket.ticketId,
              occupiedBy: {
                plateNumber: ticket.plateNumber,
                entryTime: ticket.entryTime,
                expectedArrivalTime: ticket.expectedArrivalTime,
                parkedTime: ticket.parkedTime,
                vehicleType: ticket.vehicleType,
                note: ticket.note,
              },
            }
          : s
      )
    );

    if (isParkingNow) {
      addLog(
        'park',
        `รถเข้าจอดช่อง ${ticket.spotId} สำเร็จ`,
        `บันทึกสถานะเป็น "จอด" (รถอยู่ในช่องจอดแล้ว)`,
        ticket.spotId,
        ticket.plateNumber
      );
      showToast(`รถเข้าจอดช่อง ${ticket.spotId} สำเร็จ! แสดงป้าย "จอด" เรียบร้อย`, 'success');
    } else {
      addLog(
        'reserve',
        `จองช่องจอด ${ticket.spotId} สำเร็จ`,
        `บันทึกสถานะเป็น "จอง" (กำหนดเวลาเดินทางมาถึง: ${ticket.expectedArrivalTime ? new Date(ticket.expectedArrivalTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} น.)`,
        ticket.spotId,
        ticket.plateNumber
      );
      showToast(`จองช่อง ${ticket.spotId} สำเร็จ! สถานะแสดงป้าย "จอง" (ระบบจะเตือนก่อนตัดสิทธิ์)`, 'success');
    }
  };

  // Transition from "reserved" to "parked" when user arrives at the parking spot
  const handleConfirmParked = (spotIdOrTicketId: string) => {
    const now = new Date().toISOString();

    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotIdOrTicketId || s.currentTicketId === spotIdOrTicketId) {
          return {
            ...s,
            status: 'parked' as const,
            occupiedBy: s.occupiedBy
              ? {
                  ...s.occupiedBy,
                  parkedTime: now,
                  expectedArrivalTime: undefined,
                }
              : undefined,
          };
        }
        return s;
      })
    );

    setActiveTicket((prev) => {
      if (prev && (prev.ticketId === spotIdOrTicketId || prev.spotId === spotIdOrTicketId)) {
        return {
          ...prev,
          status: 'parked',
          parkedTime: now,
          expectedArrivalTime: undefined,
        };
      }
      return prev;
    });

    const targetSpot = spots.find((s) => s.id === spotIdOrTicketId || s.currentTicketId === spotIdOrTicketId);
    const spotLabel = targetSpot ? targetSpot.id : spotIdOrTicketId;

    addLog(
      'park',
      `ผู้จองเดินทางถึงและเข้าจอดช่อง ${spotLabel}`,
      `เปลี่ยนป้ายกำกับจาก "จอง" เป็น "จอด" เรียบร้อยแล้ว`,
      spotLabel,
      targetSpot?.occupiedBy?.plateNumber || activeTicket?.plateNumber
    );

    showToast(`ยืนยันการเข้าจอดช่อง ${spotLabel} สำเร็จ! เปลี่ยนสถานะเป็นป้าย "จอด" เรียบร้อย`, 'success');
  };

  // Handle Check-out / Release
  const handleCheckOut = (ticketId: string) => {
    const spotToFree = spots.find((s) => s.currentTicketId === ticketId || s.id === activeTicket?.spotId);
    const spotId = spotToFree ? spotToFree.id : activeTicket?.spotId || '';
    const plate = activeTicket?.plateNumber || spotToFree?.occupiedBy?.plateNumber || '';

    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? {
              ...s,
              status: 'available',
              occupiedBy: undefined,
              currentTicketId: undefined,
            }
          : s
      )
    );

    if (activeTicket && (activeTicket.ticketId === ticketId || activeTicket.spotId === spotId)) {
      setActiveTicket(null);
    }

    addLog(
      'release',
      `ยกเลิก/ออกจากช่องจอด ${spotId} เรียบร้อย`,
      `คืนสถานะช่องจอดให้กลับเป็นป้าย "ว่าง" พร้อมให้ผู้อื่นใช้งาน`,
      spotId,
      plate
    );

    showToast(`คืนช่อง ${spotId} เรียบร้อย! สถานะกลับมาเป็น "ว่าง" แล้ว`, 'info');
  };

  // Handle QR Scan Result
  const handleScanResult = (rawText: string) => {
    const text = rawText.trim();

    // 1. If scanning a parking spot QR: e.g. "PARK_SPOT:A-04"
    if (text.startsWith('PARK_SPOT:') || text.includes('spot=')) {
      let scannedSpotId = '';
      if (text.startsWith('PARK_SPOT:')) {
        scannedSpotId = text.replace('PARK_SPOT:', '');
      } else {
        const match = text.match(/spot=([A-Za-z0-9-]+)/);
        if (match) scannedSpotId = match[1];
      }

      const targetSpot = spots.find((s) => s.id.toLowerCase() === scannedSpotId.toLowerCase());

      if (!targetSpot) {
        showToast(`ไม่พบข้อมูลช่องจอดรหัส "${scannedSpotId}" ในระบบ`, 'warn');
        return;
      }

      if (targetSpot.status === 'available') {
        setSelectedSpot(targetSpot);
        setIsCheckInOpen(true);
        showToast(`แสกน QR ช่อง ${targetSpot.id} สำเร็จ! กำลังเปิดหน้าต่างจองที่จอด`, 'success');
      } else if (targetSpot.status === 'reserved') {
        // If current user is the one who booked it
        if (activeTicket && activeTicket.spotId === targetSpot.id) {
          const confirmOut = window.confirm(
            `สแกน QR ช่อง ${targetSpot.id} พบว่าเป็นการจองของคุณ\nต้องการยกเลิกการจองเพื่อคืนสถานะเป็น "ว่าง" หรือไม่?`
          );
          if (confirmOut) {
            handleCheckOut(activeTicket.ticketId);
          }
        } else {
          showToast(
            `ช่อง ${targetSpot.id} มีผู้จองแล้ว (${targetSpot.occupiedBy?.plateNumber || 'สถานะ: จอง'})`,
            'warn'
          );
        }
      }
      return;
    }

    // 2. If scanning a ticket QR: e.g. "PARK_TICKET:RES-99123"
    if (text.startsWith('PARK_TICKET:')) {
      const ticketId = text.replace('PARK_TICKET:', '');
      const spotWithTicket = spots.find((s) => s.currentTicketId === ticketId || (activeTicket && activeTicket.ticketId === ticketId));

      if (spotWithTicket || (activeTicket && activeTicket.ticketId === ticketId)) {
        const confirmOut = window.confirm(`สแกนพบบัตรจอง #${ticketId}\nต้องการยกเลิกการจองเพื่อคืนสถานะช่องเป็น "ว่าง" หรือไม่?`);
        if (confirmOut) {
          handleCheckOut(ticketId);
        }
      } else {
        showToast(`ไม่พบข้อมูลบัตรจอง #${ticketId} ที่เปิดอยู่ในระบบ`, 'warn');
      }
      return;
    }

    // 3. If scanning Main Entrance Kiosk
    if (text.includes('KIOSK:MAIN_GATE') || text.includes('MAIN_GATE')) {
      const firstAvailable = spots.find((s) => s.status === 'available');
      if (firstAvailable) {
        setSelectedSpot(firstAvailable);
        setIsCheckInOpen(true);
        showToast(`สแกนทางเข้าหลักสำเร็จ แนะนำช่อง ${firstAvailable.id} ที่ว่างพร้อมจอด`, 'success');
      } else {
        showToast('ขณะนี้ที่จอดรถถูกจองเต็มทุกช่อง', 'warn');
      }
      return;
    }

    // Fallback: check if raw text is simply a spot ID e.g. "A-02"
    const directSpot = spots.find((s) => s.id.toLowerCase() === text.toLowerCase());
    if (directSpot) {
      if (directSpot.status === 'available') {
        setSelectedSpot(directSpot);
        setIsCheckInOpen(true);
        showToast(`สแกน QR ช่อง ${directSpot.id} สำเร็จ!`, 'success');
      } else {
        showToast(`ช่อง ${directSpot.id} ถูกจองแล้ว`, 'warn');
      }
      return;
    }

    showToast(`ข้อมูลสแกน: "${text}" ไม่ตรงกับรหัสช่องจอด`, 'info');
  };

  // Spot selection from map
  const handleSelectSpot = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
  };

  const handleOpenCheckInForSpot = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setIsCheckInOpen(true);
  };

  const handleOpenSpotQR = (spot: ParkingSpot) => {
    setSelectedSpotForQR(spot);
    setIsSpotQROpen(true);
  };

  // Admin Actions
  const handleManualCheckout = (spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    if (!spot || spot.status !== 'reserved') return;

    if (activeTicket && activeTicket.spotId === spotId) {
      setActiveTicket(null);
    }

    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? {
              ...s,
              status: 'available',
              occupiedBy: undefined,
              currentTicketId: undefined,
            }
          : s
      )
    );

    addLog(
      'release',
      `เจ้าหน้าที่คืนช่องจอด ${spotId} ให้ว่าง`,
      `เคลียร์สถานะช่องจอดให้กลับเป็น "ว่าง" เรียบร้อย`,
      spotId,
      spot.occupiedBy?.plateNumber
    );

    showToast(`เคลียร์ช่อง ${spotId} ให้กลับเป็น "ว่าง" เรียบร้อยแล้ว`, 'info');
  };

  const handleResetAll = () => {
    setSpots(INITIAL_PARKING_SPOTS);
    setActiveTicket(null);
    localStorage.removeItem(STORAGE_KEY_SPOTS);
    localStorage.removeItem(STORAGE_KEY_TICKET);
    showToast('รีเซ็ตข้อมูลสถานะช่องจอดเรียบร้อย', 'info');
  };

  const availableSpots = spots.filter((s) => s.status === 'available');
  const reservedSpots = spots.filter((s) => s.status === 'reserved');
  const parkedSpots = spots.filter((s) => s.status === 'parked');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Prompt','Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : toastMessage.type === 'warn'
                ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'warn' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        availableCount={availableSpots.length}
        reservedCount={reservedSpots.length}
        parkedCount={parkedSpots.length}
        totalCount={spots.length}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenFindCar={() => setIsFindCarOpen(true)}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView((v) => !v)}
        onOpenCheckIn={() => {
          setSelectedSpot(availableSpots[0] || null);
          setIsCheckInOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick Action Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                WangJaa (ว่างจ้า) ระบบจัดการลานจอดอัจฉริยะ
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                <ShieldOff className="w-3.5 h-3.5" /> ไม่ต้องยืนยันตัวตน
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">
                <Clock className="w-3.5 h-3.5" /> แยกป้าย "จอง" และ "จอด"
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
              แสกน QR Code เพื่อบันทึกการจอง หรือแตะเลือกช่องว่างบนผัง
            </h2>

          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="hero-scan-btn"
              onClick={() => setIsScannerOpen(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-950/80 transition-all hover:scale-[1.02] active:scale-98"
            >
              <QrCode className="w-5 h-5" />
              <span>แสกน QR Code เพื่อบันทึก</span>
            </button>

            <button
              id="hero-checkin-btn"
              onClick={() => {
                setSelectedSpot(availableSpots[0] || null);
                setIsCheckInOpen(true);
              }}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Car className="w-4 h-4 text-emerald-400" />
              <span>จองที่จอดทันที</span>
            </button>
          </div>
        </div>

        {/* Active Booking Pass (if user currently has an active reservation or parked) */}
        {activeTicket && (
          <ActiveTicketCard
            ticket={activeTicket}
            spot={spots.find((s) => s.id === activeTicket.spotId)}
            onCheckOut={handleCheckOut}
            onConfirmParked={handleConfirmParked}
            onNavigateToSpot={(spotId) => {
              const el = document.getElementById(`parking-spot-${spotId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setSelectedSpot(spots.find((s) => s.id === spotId) || null);
              }
            }}
          />
        )}

        {/* Admin/Guard Console (Toggled) */}
        {isAdminView && (
          <AdminGuardView
            spots={spots}
            logs={logs}
            isSimulating={isSimulating}
            onToggleSimulation={() => setIsSimulating((s) => !s)}
            onManualCheckout={handleManualCheckout}
            onResetAll={handleResetAll}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {/* Interactive Parking Map & Live Availability (Shows ว่าง, จอง, จอด) */}
        <ParkingMap
          spots={spots}
          selectedSpotId={selectedSpot?.id || null}
          onSelectSpot={handleSelectSpot}
          onOpenCheckIn={handleOpenCheckInForSpot}
          onOpenSpotQR={handleOpenSpotQR}
          activeSpotId={activeTicket?.spotId}
          onConfirmParkedSpot={handleConfirmParked}
          onReleaseSpot={(spotId) => {
            if (activeTicket && activeTicket.spotId === spotId) {
              handleCheckOut(activeTicket.ticketId);
            } else {
              handleManualCheckout(spotId);
            }
          }}
        />

        {/* System Features Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">แสกน QR เพื่อจองทันที</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                ส่องกล้องไปยังป้าย QR ประจำช่องจอด เพื่อบันทึกการจองได้รวดเร็วเพียง 1 แตะ
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">ไม่ต้องกรอกข้อมูลส่วนบุคคล</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                ไม่เก็บชื่อ เบอร์โทร หรือข้อมูลส่วนตัว ให้ความเป็นส่วนตัวแก่ผู้ใช้งานอย่างสมบูรณ์
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">ไม่มีการจำกัดเวลา</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                สามารถจอดได้ไม่จำกัดระยะเวลา และแสดงสถานะเพียง 2 แบบชัดเจน: "ว่าง" หรือ "จอง"
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© WangJaa (ว่างจ้า) • ระบบจองที่จอดรถและแสดงสถานะว่างหรือจองแบบเรียลไทม์</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsScannerOpen(true)} className="hover:text-white transition-colors">
              สแกน QR
            </button>
            <span>•</span>
            <button onClick={() => setIsFindCarOpen(true)} className="hover:text-white transition-colors">
              ค้นหาช่องจอด
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        availableSpots={availableSpots}
        activeTicketId={activeTicket?.ticketId}
      />

      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        selectedSpot={selectedSpot}
        availableSpots={availableSpots}
        onCompleteCheckIn={handleCompleteCheckIn}
      />

      <SpotQRCodeModal
        spot={selectedSpotForQR}
        isOpen={isSpotQROpen}
        onClose={() => {
          setIsSpotQROpen(false);
          setSelectedSpotForQR(null);
        }}
        onTestScan={(qrText) => {
          handleScanResult(qrText);
        }}
      />

      <FindMyCarModal
        isOpen={isFindCarOpen}
        onClose={() => setIsFindCarOpen(false)}
        spots={spots}
        onSelectSpot={(spot) => {
          setSelectedSpot(spot);
          const el = document.getElementById(`parking-spot-${spot.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      />
    </div>
  );
}
