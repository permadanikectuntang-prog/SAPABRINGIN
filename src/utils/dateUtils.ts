/**
 * Date formatting utilities for SAPA BRINGIN
 * Standardizes display to format Tanggal, Bulan, Tahun (DD-MM-YYYY)
 */

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Format date string to Tanggal, Bulan dan Tahun: DD-MM-YYYY (e.g. 08-01-2026)
 */
export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const clean = String(dateStr).trim();

  // If already DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
    return clean.replace(/\//g, '-');
  }

  // If YYYY-MM-DD
  const match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${d}-${m}-${y}`; // Format: Tanggal, Bulan dan Tahun
  }

  return clean;
}

/**
 * Format date to full Indonesian text: Tanggal, Nama Bulan dan Tahun (e.g. 08 Januari 2026)
 */
export function formatFullIndonesianDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const clean = String(dateStr).trim();

  // If YYYY-MM-DD
  const match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const y = match[1];
    const mIdx = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    const mName = MONTH_NAMES_ID[mIdx] || match[2];
    return `${String(d).padStart(2, '0')} ${mName} ${y}`;
  }

  // If DD-MM-YYYY
  const matchDmy = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchDmy) {
    const d = parseInt(matchDmy[1], 10);
    const mIdx = parseInt(matchDmy[2], 10) - 1;
    const y = matchDmy[3];
    const mName = MONTH_NAMES_ID[mIdx] || matchDmy[2];
    return `${String(d).padStart(2, '0')} ${mName} ${y}`;
  }

  return clean;
}
