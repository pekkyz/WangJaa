import QRCode from 'qrcode';

export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export function formatDuration(entryTimeStr: string, exitTimeStr?: string): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  rawMinutes: number;
} {
  const start = new Date(entryTimeStr).getTime();
  const end = exitTimeStr ? new Date(exitTimeStr).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let formatted = '';
  if (hours > 0) {
    formatted += `${hours} ชม. `;
  }
  formatted += `${minutes} นาที`;

  return {
    hours,
    minutes,
    seconds,
    formatted: formatted.trim() || `${seconds} วินาที`,
    rawMinutes: totalMinutes,
  };
}

export function formatThaiDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatRemainingTime(deadlineIsoString: string): {
  isExpired: boolean;
  totalSeconds: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const deadline = new Date(deadlineIsoString).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return {
      isExpired: true,
      totalSeconds: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'หมดเวลาแล้ว',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    isExpired: false,
    totalSeconds,
    minutes,
    seconds,
    formatted: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
  };
}
