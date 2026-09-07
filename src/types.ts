export type SpotStatus = 'available' | 'reserved' | 'parked';

export type SpotType = 'standard' | 'compact' | 'ev' | 'disabled' | 'vip';

export type VehicleType = 'car' | 'suv' | 'motorcycle' | 'ev';

export interface ParkingSpot {
  id: string; // e.g. "A-01", "B-05", "EV-02"
  zone: 'A' | 'B' | 'EV' | 'P';
  spotNumber: string;
  type: SpotType;
  status: SpotStatus; // 'available' (ว่าง) | 'reserved' (จอง) | 'parked' (จอดแล้ว)
  currentTicketId?: string;
  occupiedBy?: {
    plateNumber?: string;
    entryTime: string; // ISO string when booking or parking started
    expectedArrivalTime?: string; // ISO string deadline for user to arrive & park
    parkedTime?: string; // ISO string when car actually parked
    vehicleType?: VehicleType;
    note?: string;
  };
}

export interface ParkingTicket {
  ticketId: string; // e.g. "RES-92817"
  spotId: string;
  plateNumber?: string;
  vehicleType?: VehicleType;
  entryTime: string; // ISO (booking created time)
  expectedArrivalTime?: string; // ISO deadline for arrival
  parkedTime?: string; // ISO when confirmed parked
  exitTime?: string;
  status: 'reserved' | 'parked' | 'completed' | 'cancelled';
  note?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'reserve' | 'park' | 'release' | 'auto_cancel' | 'warning' | 'spot_status_change';
  title: string;
  description: string;
  spotId?: string;
  plateNumber?: string;
}
