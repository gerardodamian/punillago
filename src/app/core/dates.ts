export const fmtDate = (d: Date) => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtTime = (d: Date) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
export const monthShort = (d: Date) => d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase();
export const monthLong = (d: Date) => d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fecha local en formato AAAA-MM-DD, para los campos <input type="date">. */
export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const startOfDay = (dateStr: string) => new Date(`${dateStr}T00:00:00`);
export const endOfDay = (dateStr: string) => new Date(`${dateStr}T23:59:59`);
