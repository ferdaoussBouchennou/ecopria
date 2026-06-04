import {
  formatNaiveDate,
  formatNaiveTimeRange,
} from '../../../core/utils/datetime-local.util';

export function formatActionDate(dateIso: string): string {
  return formatNaiveDate(dateIso);
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return formatNaiveTimeRange(startIso, endIso);
}

export function isActionFull(action: { availablePlaces: number }): boolean {
  return action.availablePlaces <= 0;
}

export function formatLieu(address?: string, city?: string): string {
  const parts = [address?.trim(), city?.trim()].filter(Boolean);
  return parts.join(', ') || '—';
}

export function formatPlacesLabel(available: number, max?: number): string {
  if (available <= 0) {
    return 'Complet';
  }
  if (max != null && max > 0) {
    return `${available} places`;
  }
  return `${available} place${available > 1 ? 's' : ''} disponible${available > 1 ? 's' : ''}`;
}

export function formatInscritsLabel(registered: number, max: number): string {
  return `${registered} / ${max} inscrits`;
}
