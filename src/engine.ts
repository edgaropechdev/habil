import {
  addDays,
  compare,
  dayOfMonth,
  eachDay,
  month,
  nthWeekdayOfMonth,
  parseDate,
  toEpochDay,
  weekday,
  year,
  type CivilDate,
} from './date.ts';
import type {
  Calendar,
  CalendarOptions,
  DayResult,
  Reason,
  Rule,
  TramiteId,
} from './types.ts';

/** Guardia contra plazos absurdos que colgarían el proceso. */
const MAX_ITERATIONS = 20_000;

function ruleAppliesToYear(rule: Rule, y: number): boolean {
  if (rule.since !== undefined && y < rule.since) return false;
  if (rule.until !== undefined && y > rule.until) return false;
  return true;
}

function ruleMatches(rule: Rule, date: CivilDate): boolean {
  const y = year(date);
  if (!ruleAppliesToYear(rule, y)) return false;

  switch (rule.kind) {
    case 'weekday':
      return rule.weekdays.includes(weekday(date));
    case 'fixed':
      return month(date) === rule.month && dayOfMonth(date) === rule.day;
    case 'nthWeekday':
      return nthWeekdayOfMonth(y, rule.month, rule.weekday, rule.n) === date;
    case 'periodic': {
      if (month(date) !== rule.month || dayOfMonth(date) !== rule.day) return false;
      const delta = y - rule.anchorYear;
      return delta % rule.everyYears === 0;
    }
    case 'dates':
      return rule.dates.includes(date);
    case 'ranges':
      return rule.ranges.some((r) => compare(date, r.from) >= 0 && compare(date, r.to) <= 0);
  }
}

function toReason(rule: Rule): Reason {
  return {
    ruleId: rule.id,
    label: rule.label,
    source: rule.source,
    url: rule.url,
    verified: rule.verified,
  };
}

/**
 * Evalúa un día contra un calendario ya resuelto.
 *
 * `extraBusiness` gana sobre todo lo demás: si el usuario afirma que su oficina
 * abrió ese día, el motor no discute.
 */
export function evaluateDay(
  date: CivilDate,
  calendar: Calendar,
  extra: { nonBusiness: Set<CivilDate>; business: Set<CivilDate> },
  tramite?: TramiteId,
): DayResult {
  if (extra.business.has(date)) {
    return { date, isBusinessDay: true, reasons: [], setAside: [], warnings: [] };
  }

  const reasons: Reason[] = [];
  const setAside: Reason[] = [];
  for (const rule of calendar.rules) {
    if (!ruleMatches(rule, date)) continue;
    if (tramite !== undefined && rule.exceptFor?.includes(tramite)) {
      setAside.push(toReason(rule));
      continue;
    }
    reasons.push(toReason(rule));
  }
  if (extra.nonBusiness.has(date)) {
    reasons.push({
      ruleId: 'user:extra-non-business',
      label: 'Día marcado como inhábil por quien consulta',
      source: 'Parámetro extraNonBusiness',
      verified: true,
    });
  }

  const warnings = [...reasons, ...setAside]
    .filter((r) => !r.verified)
    .map((r) => `Regla sin verificar contra fuente primaria: ${r.ruleId} (${r.source})`);

  // Un "hábil" sobre un año sin datos cargados es más peligroso que un
  // "inhábil": significa que el plazo calculado puede salir corto.
  const cobertura = calendar.annualDataYears;
  if (cobertura && !cobertura.includes(year(date))) {
    warnings.push(
      `El calendario "${calendar.id}" no tiene cargados los datos que se publican cada año (vacaciones y acuerdos de suspensión) para ${year(date)}. Años disponibles: ${cobertura.join(', ')}. El resultado puede omitir días inhábiles.`,
    );
  }

  return { date, isBusinessDay: reasons.length === 0, reasons, setAside, warnings };
}

/** Contexto reutilizable, para no re-resolver el calendario en cada iteración. */
export interface Context {
  calendar: Calendar;
  extra: { nonBusiness: Set<CivilDate>; business: Set<CivilDate> };
  tramite?: TramiteId;
}

export class UnknownTramiteError extends Error {
  constructor(id: string, calendar: Calendar) {
    const known = (calendar.tramites ?? []).map((t) => t.id);
    super(
      known.length === 0
        ? `El calendario "${calendar.id}" no distingue trámites, pero se pidió "${id}".`
        : `Trámite desconocido: "${id}" en el calendario "${calendar.id}". Disponibles: ${known.join(', ')}.`,
    );
    this.name = 'UnknownTramiteError';
  }
}

export function buildContext(
  options: CalendarOptions,
  resolve: (id: string) => Calendar,
): Context {
  const calendar =
    typeof options.calendar === 'string' ? resolve(options.calendar) : options.calendar;
  const tramite = options.tramite;
  if (tramite !== undefined && !(calendar.tramites ?? []).some((t) => t.id === tramite)) {
    throw new UnknownTramiteError(tramite, calendar);
  }
  return {
    calendar,
    extra: {
      nonBusiness: new Set((options.extraNonBusiness ?? []).map(parseDate)),
      business: new Set((options.extraBusiness ?? []).map(parseDate)),
    },
    tramite,
  };
}

export function isBusinessDayIn(date: CivilDate, ctx: Context): boolean {
  return evaluateDay(date, ctx.calendar, ctx.extra, ctx.tramite).isBusinessDay;
}

/**
 * Avanza `step` días naturales hasta encontrar un día hábil.
 * Devuelve también los días saltados, que es lo que el usuario necesita ver
 * para confiar en el resultado.
 */
export function seekBusinessDay(
  date: CivilDate,
  step: 1 | -1,
  ctx: Context,
  includeStart: boolean,
): { date: CivilDate; skipped: DayResult[] } {
  const skipped: DayResult[] = [];
  let cursor = includeStart ? date : addDays(date, step);
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const result = evaluateDay(cursor, ctx.calendar, ctx.extra, ctx.tramite);
    if (result.isBusinessDay) return { date: cursor, skipped };
    skipped.push(result);
    cursor = addDays(cursor, step);
  }
  throw new Error(
    `No se encontró un día hábil en ${MAX_ITERATIONS} días desde ${date}. Revisa las reglas del calendario "${ctx.calendar.id}".`,
  );
}

export function countBusinessDays(from: CivilDate, to: CivilDate, ctx: Context): number {
  let count = 0;
  for (const day of eachDay(from, to)) {
    if (isBusinessDayIn(day, ctx)) count++;
  }
  return count;
}

export function spanInDays(from: CivilDate, to: CivilDate): number {
  return toEpochDay(to) - toEpochDay(from);
}
