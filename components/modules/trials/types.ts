export interface TrialPassItem {
  id: string | number;
  passId: string;
  gymName: string;
  gymAddress: string;
  distance?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  date: string;
  rawDate?: string;
  month: string;
  day: string;
  validUntil: string;
  statusNote: string;
  statusBadge: 'booked' | 'checked_in' | 'expired' | 'cancelled';
  statusBadgeLabel: string;
  guestName: string;
  qrCode?: string;
  isToday?: boolean;
}

export const parseDateParts = (rawDateStr?: string, formattedDateStr?: string) => {
  const target = rawDateStr || formattedDateStr || '';
  if (!target) {
    const now = new Date();
    return {
      month: now.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      day: String(now.getDate()).padStart(2, '0'),
    };
  }
  try {
    const d = new Date(target);
    if (!isNaN(d.getTime())) {
      return {
        month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: String(d.getDate()).padStart(2, '0'),
      };
    }
  } catch {}
  return { month: 'NOV', day: '18' };
};

export const formatPassDate = (rawDateStr?: string | null, fallbackDate?: string | null) => {
  const target = rawDateStr || fallbackDate || '';
  if (!target) return 'Upcoming';
  try {
    const d = new Date(target);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {}
  return fallbackDate || 'Upcoming';
};

export const formatExpiresIn = (validUntil?: string) => {
  try {
    const now = new Date();
    const target = new Date();
    target.setHours(22, 0, 0, 0); // 10:00 PM closing
    const diff = target.getTime() - now.getTime();
    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    }
  } catch {}
  return '4h 18m';
};

export interface RescheduleDayInfo {
  currentFormatted: string;
  tomorrowFormatted: string;
  tomorrowFull?: string;
  tomorrowWeekday: string;
  tomorrowMonth?: string;
  tomorrowDay?: string;
  tomorrowIso?: string;
}

export const getNextDayInfo = (baseDateStr?: string): RescheduleDayInfo => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const current = !isNaN(base.getTime()) ? base : new Date();

  const tomorrow = new Date(current);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const currentFormatted = `${current.toLocaleDateString('en-US', { weekday: 'short' })}, ${current.getDate()} ${current.toLocaleDateString('en-US', { month: 'short' })}`;
  const tomorrowFormatted = `${tomorrow.toLocaleDateString('en-US', { weekday: 'short' })}, ${tomorrow.getDate()} ${tomorrow.toLocaleDateString('en-US', { month: 'short' })}`;
  const tomorrowFull = `${tomorrow.toLocaleDateString('en-US', { weekday: 'short' })}, ${tomorrow.getDate()} ${tomorrow.toLocaleDateString('en-US', { month: 'short' })} ${tomorrow.getFullYear()}`;
  const tomorrowWeekday = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrowMonth = tomorrow.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');

  return {
    currentFormatted,
    tomorrowFormatted,
    tomorrowFull,
    tomorrowWeekday,
    tomorrowMonth,
    tomorrowDay,
  };
};
