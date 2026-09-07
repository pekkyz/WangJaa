import React, { useEffect, useState } from 'react';
import { QrCode, Download, Printer, Check, Copy, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { generateQRCodeDataURL } from '../utils/parkingUtils';
import { ParkingSpot } from '../types';

interface Props {
  spot: ParkingSpot | null;
  isOpen: boolean;
  onClose: () => void;
  onTestScan?: (qrText: string) => void;
}

export const SpotQRCodeModal: React.FC<Props> = ({
  spot,
  isOpen,
  onClose,
  onTestScan,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!spot || !isOpen) return;

    const payload = `PARK_SPOT:${spot.id}`;
    generateQRCodeDataURL(payload).then((url) => {
      setQrDataUrl(url);
    });
  }, [spot, isOpen]);

  if (!isOpen || !spot) return null;

  const payloadText = `PARK_SPOT:${spot.id}`;
  const isAvailable = spot.status === 'available';

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="spot-qr-dialog"
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-center"
      >
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">ป้าย QR Code ประจำช่องจอด</h3>
              <p className="text-[11px] text-slate-400">สำหรับติดประจำเสาช่องจอด {spot.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Printable Stand Card Preview */}
          <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200 mb-4 inline-block w-full max-w-[280px]">
            <div className="text-center mb-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase block">
                WANGJAA • ว่างจ้า
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight my-1">
                ช่องจอด {spot.id}
              </div>
              
              <div className="my-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isAvailable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  สถานะ: {isAvailable ? 'ว่าง (พร้อมจอด)' : 'จองแล้ว'}
                </span>
              </div>
            </div>

            {/* QR Image */}
            <div className="my-3 flex justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${spot.id}`}
                  className="w-48 h-48 rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 rounded-lg animate-pulse" />
              )}
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              สแกน QR Code เพื่อบันทึกการจองช่องนี้
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              ไม่มีการจำกัดเวลา • ไม่ต้องระบุข้อมูลส่วนบุคคล
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {onTestScan && (
              <button
                type="button"
                onClick={() => {
                  onTestScan(payloadText);
                  onClose();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                ทดลองสแกนรหัสนี้ (Instant Test)
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                พิมพ์ป้าย
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
