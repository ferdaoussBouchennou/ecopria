/**
 * Dates/heures « naïves » renvoyées par le backend Java (LocalDateTime, sans fuseau).
 * Ne pas utiliser toISOString() ni new Date(iso) seul : cela décale l'heure affichée.
 */

const NAIVE_DT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

/** Parse une date/heure API comme heure locale (même valeur que saisie dans datetime-local). */
export function parseNaiveDateTime(iso: string): Date {
  if (!iso) {
    return new Date(NaN);
  }
  const m = iso.trim().match(NAIVE_DT);
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] ?? 0)
    );
  }
  return new Date(iso);
}

/** Valeur pour input type="datetime-local" (YYYY-MM-DDTHH:mm). */
export function toDatetimeLocalInput(iso: string): string {
  if (!iso) {
    return '';
  }
  const m = iso.trim().match(NAIVE_DT);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  }
  const d = parseNaiveDateTime(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local → chaîne LocalDateTime pour l'API (sans conversion UTC). */
export function datetimeLocalToApi(value: string): string {
  if (!value) {
    return value;
  }
  return value.length === 16 ? `${value}:00` : value;
}

/** Maintenant, format datetime-local (heure locale machine). */
export function nowDatetimeLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatNaiveTime(iso: string): string {
  const d = parseNaiveDateTime(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatNaiveTimeRange(startIso: string, endIso: string): string {
  return `${formatNaiveTime(startIso)} — ${formatNaiveTime(endIso)}`;
}

export function formatNaiveDate(iso: string): string {
  const d = parseNaiveDateTime(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
