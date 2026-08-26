import type { Calendar } from '../types.ts';
import { mxFiscal } from './mx-fiscal.ts';
import { mxLaboral } from './mx-laboral.ts';
import { mxJudicialFederal } from './mx-judicial-federal.ts';

export { mxFiscal, mxLaboral, mxJudicialFederal };

export const calendars: Record<string, Calendar> = {
  [mxFiscal.id]: mxFiscal,
  [mxLaboral.id]: mxLaboral,
  [mxJudicialFederal.id]: mxJudicialFederal,
};

export class UnknownCalendarError extends Error {
  constructor(id: string) {
    super(
      `Calendario desconocido: "${id}". Disponibles: ${Object.keys(calendars).join(', ')}.`,
    );
    this.name = 'UnknownCalendarError';
  }
}

export function getCalendar(id: string): Calendar {
  const found = calendars[id];
  if (!found) throw new UnknownCalendarError(id);
  return found;
}

export function listCalendars(): Calendar[] {
  return Object.values(calendars);
}
