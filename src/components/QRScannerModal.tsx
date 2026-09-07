import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, AlertTriangle, Upload, Sparkles, Check, RefreshCw } from 'lucide-react';
import { ParkingSpot } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (rawText: string) => void;
  availableSpots: ParkingSpot[];
  activeTicketId?: string;
}

export const QRScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onScanResult,
  availableSpots,
  activeTicketId,
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'simulate'>('camera');
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Stop scanner if closing
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .then(() => {
              html5QrCodeRef.current?.clear();
            })
            .catch((err) => console.log('Scanner stop err:', err));
        }
      }
      setScannerActive(false);
      return;
    }

    if (activeTab === 'camera') {
      let isMounted = true;
      const elementId = 'html5-qr-reader';

      const timer = setTimeout(() => {
        const el = document.getElementById(elementId);
        if (!el) return;

        try {
          const scanner = new Html5Qrcode(elementId);
          html5QrCodeRef.current = scanner;

          scanner
            .start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 220, height: 220 },
                aspectRatio: 1.0,
              },
              (decodedText) => {
                if (isMounted) {
                  onScanResult(decodedText);
                  onClose();
                }
              },
              () => {
                // ignore frame scan misses
              }
            )
            .then(() => {
              if (isMounted) {
                setScannerActive(true);
                setCameraError(null);
              }
            })
            .catch((err) => {
              console.warn('Camera start warning:', err);
              if (isMounted) {
                setCameraError('ไม่สามารถเปิดกล้องได้ (หรือเบราว์เซอร์ยังไม่อนุญาต) คุณสามารถเลือกแท็บ "ทดสอบสแกนด่วน" หรือ "อัปโหลดภาพ QR" แทนได้');
              }
            });
        } catch (e: any) {
          console.warn('Scanner init error:', e);
          if (isMounted) {
            setCameraError('อุปกรณ์ไม่รองรับการสแกนผ่านกล้องในเบราว์เซอร์นี้');
          }
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .then(() => {
              html5QrCodeRef.current?.clear();
            })
            .catch((err) => console.log('Scanner cleanup err:', err));
        }
      };
    }
  }, [isOpen, activeTab, onClose, onScanResult]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('qr-temp-file-reader');
      const result = await scanner.scanFile(file, true);
      setUploadResult(result);
      onScanResult(result);
      onClose();
    } catch (err) {
      alert('ไม่พบ QR code ในรูปภาพที่อัปโหลด กรุณาลองรูปใหม่อีกครั้ง');
    }
  };

  const handleSimulateScan = (text: string) => {
    onScanResult(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="qr-scanner-dialog"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">แสกน QR Code เพื่อบันทึกการจอง</h3>
              <p className="text-[11px] text-slate-400">สแกนป้ายช่องจอดเพื่อจอง หรือสแกนเพื่อยกเลิก</p>
            </div>
          </div>
          <button
            id="close-qr-scanner"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'camera'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> กล้องสแกนเนอร์
          </button>
          <button
            onClick={() => setActiveTab('simulate')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'simulate'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> ทดสอบสแกนด่วน
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> อัปโหลดรูป
          </button>
        </div>

        {/* Body content based on tab */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[260px] flex flex-col items-center justify-center">
                <div id="html5-qr-reader" className="w-full h-full min-h-[260px]" />
                
                {cameraError && (
                  <div className="absolute inset-0 p-4 bg-slate-900/95 flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('simulate')}
                      className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      เลือกป้าย QR ทดสอบแทน
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400">
                  ส่องกล้องไปยัง QR Code ประจำช่องจอด เพื่อบันทึกการจองทันที
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ตรวจจับอัตโนมัติ (ไม่ต้องยืนยันตัวตน)
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulate' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                แตะเลือก QR จำลองเพื่อทดสอบการจองช่องว่าง หรือยกเลิกการจองได้ทันที:
              </p>

              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  1. สแกน QR ช่องจอดที่ว่าง (เพื่อจองทันที)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {availableSpots.slice(0, 6).map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => handleSimulateScan(`PARK_SPOT:${spot.id}`)}
                      className="p-2.5 bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-emerald-400 group-hover:scale-105 transition-transform">
                          {spot.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          ว่าง
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">แตะเพื่อสแกนจองช่องนี้</p>
                    </button>
                  ))}
                </div>
              </div>

              {activeTicketId && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    2. สแกนตั๋วการจองปัจจุบันของคุณ (เพื่อยกเลิกการจอง)
                  </span>
                  <button
                    onClick={() => handleSimulateScan(`PARK_TICKET:${activeTicketId}`)}
                    className="w-full p-3 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/40 rounded-xl text-left flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-sm text-rose-300">
                        {activeTicketId}
                      </span>
                      <p className="text-[11px] text-slate-300">สแกนเพื่อยกเลิกและคืนช่องจอดว่าง</p>
                    </div>
                    <span className="text-xs text-rose-400 font-medium">ยกเลิกการจอง →</span>
                  </button>
                </div>
              )}

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  3. สแกนจุด Kiosk ทางเข้า
                </span>
                <button
                  onClick={() => handleSimulateScan('KIOSK:MAIN_GATE')}
                  className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left text-xs text-slate-300 flex items-center justify-between"
                >
                  <span>🚪 จุดทางเข้าหลัก (แนะนำช่องว่างอัตโนมัติ)</span>
                  <span className="text-emerald-400 font-medium">สแกน</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4 text-center py-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 cursor-pointer bg-slate-950/40 hover:bg-slate-900/60 transition-colors"
              >
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">คลิกเพื่อเลือกไฟล์รูป QR Code</p>
                <p className="text-xs text-slate-400 mt-1">รองรับ PNG, JPG, WEBP</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div id="qr-temp-file-reader" className="hidden" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>ไม่มีการเข้าถึงข้อมูลส่วนบุคคล</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
