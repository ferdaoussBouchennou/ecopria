export function formatActionDate(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const start = new Date(startIso).toLocaleTimeString('fr-FR', opts);
  const end = new Date(endIso).toLocaleTimeString('fr-FR', opts);
  return `${start} — ${end}`;
}

export function isActionFull(action: { availablePlaces: number }): boolean {
  return action.availablePlaces <= 0;
}
