/**
 * habil — cómputo de días hábiles y plazos legales, con la razón de cada día.
 *
 * Toda función que decide sobre un día devuelve, o puede devolver, POR QUÉ lo
 * decidió. Un vencimiento sin justificación no es útil en un expediente.
 */

import {
  addDays,
  compare,
  eachDay,
  parseDate,
  today,
  weekday,
  type CivilDate,
} from './date.ts';
import {
  buildContext,
  countBusinessDays,
  evaluateDay,
  isBusinessDayIn,
  seekBusinessDay,
  spanInDays,
  type Context,
} from './engine.ts';
import { getCalendar, listCalendars } from './calendars/index.ts';
import type { CalendarOptions, DayResult, Reason } from './types.ts';

export * from './types.ts';
export {
  addDays,
  compare,
  eachDay,
  parseDate,
  today,
  type CivilDate,
} from './date.ts';
export {
  calendars,
  getCalendar,
  listCalendars,
  mxFiscal,
  mxJudicialFederal,
  mxLaboral,
  UnknownCalendarError,
} from './calendars/index.ts';
export { InvalidDateError } from './date.ts';
export { UnknownTramiteError } from './engine.ts';

function ctx(options: CalendarOptions): Context {
  return buildContext(options, getCalendar);
}

function dedupe(warnings: string[]): string[] {
  return [...new Set(warnings)];
}

/** ¿Es hábil este día en este calendario? */
export function isBusinessDay(date: CivilDate, options: CalendarOptions): boolean {
  return isBusinessDayIn(parseDate(date), ctx(options));
}

/** Igual que `isBusinessDay`, pero explicando qué reglas aplicaron. */
export function explainDay(date: CivilDate, options: CalendarOptions): DayResult {
  const c = ctx(options);
  return evaluateDay(parseDate(date), c.calendar, c.extra, c.tramite);
}

/** Siguiente día hábil estrictamente posterior a `date`. */
export function nextBusinessDay(date: CivilDate, options: CalendarOptions): CivilDate {
  return seekBusinessDay(parseDate(date), 1, ctx(options), false).date;
}

/** Día hábil anterior estrictamente a `date`. */
export function previousBusinessDay(date: CivilDate, options: CalendarOptions): CivilDate {
  return seekBusinessDay(parseDate(date), -1, ctx(options), false).date;
}

/** `date` si es hábil; si no, el siguiente día hábil. */
export function rollForward(date: CivilDate, options: CalendarOptions): CivilDate {
  return seekBusinessDay(parseDate(date), 1, ctx(options), true).date;
}

/** `date` si es hábil; si no, el día hábil anterior. */
export function rollBackward(date: CivilDate, options: CalendarOptions): CivilDate {
  return seekBusinessDay(parseDate(date), -1, ctx(options), true).date;
}

/**
 * Suma `n` días hábiles. `n` negativo resta.
 *
 * El día de partida nunca se cuenta: sumar 1 día hábil a un lunes hábil da
 * el martes, no el lunes. Es la convención de los plazos que empiezan a
 * correr al día siguiente.
 */
export function addBusinessDays(
  date: CivilDate,
  n: number,
  options: CalendarOptions,
): CivilDate {
  if (!Number.isInteger(n)) throw new RangeError(`n debe ser un entero, se recibió ${n}`);
  const c = ctx(options);
  let cursor = parseDate(date);
  const step = n >= 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(n); i++) {
    cursor = seekBusinessDay(cursor, step, c, false).date;
  }
  return cursor;
}

export interface BetweenOptions extends CalendarOptions {
  /**
   * Qué extremos se cuentan. Por defecto `'end'`: se excluye el día inicial y
   * se incluye el final, que es como corre un plazo desde su notificación.
   */
  inclusive?: 'end' | 'start' | 'both' | 'neither';
}

/** Cuenta días hábiles entre dos fechas. */
export function businessDaysBetween(
  from: CivilDate,
  to: CivilDate,
  options: BetweenOptions,
): number {
  const a = parseDate(from);
  const b = parseDate(to);
  if (compare(a, b) > 0) return -businessDaysBetween(b, a, options);

  const mode = options.inclusive ?? 'end';
  const start = mode === 'start' || mode === 'both' ? a : addDays(a, 1);
  const end = mode === 'end' || mode === 'both' ? b : addDays(b, -1);
  if (compare(start, end) > 0) return 0;
  return countBusinessDays(start, end, ctx(options));
}

export interface DeadlineInput extends CalendarOptions {
  /** Fecha de inicio: notificación, publicación, presentación. */
  from: CivilDate;
  /** Duración del plazo. */
  amount: number;
  /** `'habiles'` descuenta días inhábiles; `'naturales'` los cuenta todos. */
  unit: 'habiles' | 'naturales';
  /**
   * Solo para `'naturales'`: si el vencimiento cae en día inhábil, se prorroga
   * al siguiente hábil. Por defecto `true`.
   */
  rollForwardIfNonBusiness?: boolean;
}

export interface DeadlineResult {
  /** Fecha de vencimiento. */
  date: CivilDate;
  from: CivilDate;
  amount: number;
  unit: 'habiles' | 'naturales';
  calendarId: string;
  /** Primer día contado (el siguiente al de inicio). */
  countingStartsOn: CivilDate;
  /** Días inhábiles saltados durante el cómputo, con su razón. */
  skipped: DayResult[];
  /** Fecha antes de prorrogar, si hubo prórroga. */
  rolledForwardFrom?: CivilDate;
  /**
   * Prórroga que no vino de un día inhábil sino del día de la semana y el
   * trámite. Ver `WeekdayExtension`.
   */
  extendedBy?: Reason;
  /** Días naturales totales entre el inicio y el vencimiento. */
  calendarDays: number;
  /** Reglas sin verificar que influyeron en el resultado. */
  warnings: string[];
}

/**
 * Calcula la fecha de vencimiento de un plazo.
 *
 * El plazo corre a partir del día siguiente al de inicio, y el resultado
 * incluye cada día saltado con su fundamento.
 */
export function deadline(input: DeadlineInput): DeadlineResult {
  const from = parseDate(input.from);
  if (!Number.isInteger(input.amount) || input.amount < 0) {
    throw new RangeError(`amount debe ser un entero >= 0, se recibió ${input.amount}`);
  }
  const c = ctx(input);
  const skipped: DayResult[] = [];
  let date: CivilDate;
  let rolledForwardFrom: CivilDate | undefined;

  if (input.unit === 'habiles') {
    let cursor = from;
    for (let i = 0; i < input.amount; i++) {
      const hop = seekBusinessDay(cursor, 1, c, false);
      skipped.push(...hop.skipped);
      cursor = hop.date;
    }
    date = cursor;
  } else {
    const raw = addDays(from, input.amount);
    const shouldRoll = input.rollForwardIfNonBusiness ?? true;
    if (shouldRoll) {
      const hop = seekBusinessDay(raw, 1, c, true);
      if (hop.date !== raw) {
        rolledForwardFrom = raw;
        skipped.push(...hop.skipped);
      }
      date = hop.date;
    } else {
      date = raw;
    }
  }

  // Prórroga por día de la semana. No depende de que el día sea inhábil: un
  // viernes perfectamente hábil se prorroga si el trámite es un pago ante
  // instituciones de crédito (CFF art. 12, último párrafo).
  let extendedBy: Reason | undefined;
  const ext = (c.calendar.extensions ?? []).find(
    (e) =>
      c.tramite !== undefined &&
      e.onlyFor.includes(c.tramite) &&
      e.weekdays.includes(weekday(date)),
  );
  if (ext) {
    const hop = seekBusinessDay(date, 1, c, false);
    skipped.push(...hop.skipped);
    extendedBy = {
      ruleId: ext.id,
      label: ext.label,
      source: ext.source,
      url: ext.url,
      verified: ext.verified,
    };
    rolledForwardFrom ??= date;
    date = hop.date;
  }

  return {
    date,
    from,
    amount: input.amount,
    unit: input.unit,
    calendarId: c.calendar.id,
    countingStartsOn: addDays(from, 1),
    skipped,
    rolledForwardFrom,
    extendedBy,
    calendarDays: spanInDays(from, date),
    warnings: dedupe([
      ...skipped.flatMap((s) => s.warnings),
      ...evaluateDay(date, c.calendar, c.extra, c.tramite).warnings,
      ...(extendedBy && !extendedBy.verified
        ? [`Regla sin verificar contra fuente primaria: ${extendedBy.ruleId} (${extendedBy.source})`]
        : []),
    ]),
  };
}

/** Todos los días inhábiles de un año, con su razón. Útil para poblar un calendario. */
export function nonBusinessDaysOfYear(
  yearNumber: number,
  options: CalendarOptions,
): DayResult[] {
  const c = ctx(options);
  const out: DayResult[] = [];
  const y = String(yearNumber).padStart(4, '0');
  for (const day of eachDay(`${y}-01-01`, `${y}-12-31`)) {
    const result = evaluateDay(day, c.calendar, c.extra, c.tramite);
    if (!result.isBusinessDay) out.push(result);
  }
  return out;
}

/**
 * Compara la misma fecha en varios calendarios.
 *
 * Existe porque la pregunta real de mucha gente no es "¿es hábil?" sino
 * "¿es hábil para lo que estoy haciendo?", y la respuesta cambia entre el
 * calendario fiscal, el laboral y el judicial.
 */
export function compareCalendars(
  date: CivilDate,
  calendarIds: string[] = listCalendars().map((c) => c.id),
): Array<DayResult & { calendarId: string; calendarName: string }> {
  const d = parseDate(date);
  return calendarIds.map((id) => {
    const cal = getCalendar(id);
    const result = evaluateDay(d, cal, { nonBusiness: new Set(), business: new Set() });
    return { ...result, calendarId: cal.id, calendarName: cal.name };
  });
}
