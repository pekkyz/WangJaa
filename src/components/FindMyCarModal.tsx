import React, { useState } from 'react';
import { ParkingSpot } from '../types';
import { Search, Car, MapPin, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDuration } from '../utils/parkingUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  spots: ParkingSpot[];
  onSelectSpot: (spot: ParkingSpot) => void;
}

export const FindMyCarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  spots,
  onSelectSpot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const reservedSpots = spots.filter((s) => s.status === 'reserved');

  const matchedSpots = searchTerm.trim()
    ? spots.filter((s) => {
        const term = searchTerm.trim().toLowerCase();
        const plate = (s.occupiedBy?.plateNumber || '').toLowerCase();
        const spotId = s.id.toLowerCase();
        return plate.includes(term) || spotId.includes(term);
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="find-my-car-dialog"
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">ค้นหาช่องจอดรถ</h3>
              <p className="text-[11px] text-slate-400">ค้นหาด้วยเลขทะเบียนรถ หรือรหัสช่องจอด (เช่น A-02)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="search-car-input"
              type="text"
              autoFocus
              placeholder="พิมพ์เลขทะเบียนรถ หรือรหัสช่อง เช่น A-01, 4821..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {searchTerm.trim() === '' ? (
            <div className="text-center py-8">
              <Car className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                กรอกเลขทะเบียนรถ หรือรหัสช่องเพื่อตรวจสอบสถานะ
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                <span className="text-[11px] text-slate-500 block w-full mb-1">
                  ตัวอย่างช่องจอดที่มีการจอง:
                </span>
                {reservedSpots.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSearchTerm(s.occupiedBy?.plateNumber || s.id)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
                  >
                    {s.id} {s.occupiedBy?.plateNumber ? `(${s.occupiedBy.plateNumber})` : ''}
                  </button>
                ))}
              </div>
            </div>
          ) : matchedSpots.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs">ไม่พบช่องจอดที่ตรงกับคำค้นหา "{searchTerm}"</p>
            </div>
          ) : (
            matchedSpots.map((spot) => {
              const isAvailable = spot.status === 'available';

              return (
                <div
                  key={spot.id}
                  onClick={() => {
                    onSelectSpot(spot);
                    onClose();
                  }}
                  className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">
                        ช่อง {spot.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({spot.zone === 'EV' ? 'โซน EV' : `โซน ${spot.zone}`})
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAvailable ? 'bg-emerald-400' : 'bg-rose-500'
                        }`}
                      />
                      {isAvailable ? 'ว่าง' : 'จองแล้ว'}
                    </span>
                  </div>

                  {!isAvailable && spot.occupiedBy && (
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/60 font-mono">
                      <span>ทะเบียน: {spot.occupiedBy.plateNumber || '-'}</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDuration(spot.occupiedBy.entryTime).formatted}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-emerald-400 font-medium flex items-center justify-end gap-1 group-hover:translate-x-1 transition-transform">
                    <span>ดูบนผังที่จอดรถ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
