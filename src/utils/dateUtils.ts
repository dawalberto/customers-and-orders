/**
 * Date and calculation utilities for Mis Pedidos
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateSpanish(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Calculates number of days elapsed between two dates.
 * Returns formatted string like "3 días" or "1 día" or "0 días"
 */
export function calculateDaysBetween(startDateStr?: string, endDateStr?: string): { days: number; label: string } | null {
  if (!startDateStr || !endDateStr) return null;
  
  try {
    const d1 = new Date(startDateStr.split('T')[0]);
    const d2 = new Date(endDateStr.split('T')[0]);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    
    // Difference in milliseconds
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const absDays = Math.max(0, diffDays);
    const label = absDays === 1 ? '1 día' : `${absDays} días`;
    
    return { days: absDays, label };
  } catch {
    return null;
  }
}

/**
 * Normalizes text for accent-insensitive and case-insensitive search
 */
export function normalizeSearch(str?: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Formats euros currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
