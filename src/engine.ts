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
import type { Calendar, CalendarOptions, DayResult, Reason, Rule } from './types.ts';

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
): DayResult {
  if (extra.business.has(date)) {
    return { date, isBusinessDay: true, reasons: [], warnings: [] };
  }

  const reasons: Reason[] = [];
  for (const rule of calendar.rules) {
    if (ruleMatches(rule, date)) reasons.push(toReason(rule));
  }
  if (extra.nonBusiness.has(date)) {
    reasons.push({
      ruleId: 'user:extra-non-business',
      label: 'Día marcado como inhábil por quien consulta',
      source: 'Parámetro extraNonBusiness',
      verified: true,
    });
  }

  const warnings = reasons
    .filter((r) => !r.verified)
    .map((r) => `Regla sin verificar contra fuente primaria: ${r.ruleId} (${r.source})`);

  return { date, isBusinessDay: reasons.length === 0, reasons, warnings };
}

/** Contexto reutilizable, para no re-resolver el calendario en cada iteración. */
export interface Context {
  calendar: Calendar;
  extra: { nonBusiness: Set<CivilDate>; business: Set<CivilDate> };
}

export function buildContext(
  options: CalendarOptions,
  resolve: (id: string) => Calendar,
): Context {
  const calendar =
    typeof options.calendar === 'string' ? resolve(options.calendar) : options.calendar;
  return {
    calendar,
    extra: {
      nonBusiness: new Set((options.extraNonBusiness ?? []).map(parseDate)),
      business: new Set((options.extraBusiness ?? []).map(parseDate)),
    },
  };
}

export function isBusinessDayIn(date: CivilDate, ctx: Context): boolean {
  return evaluateDay(date, ctx.calendar, ctx.extra).isBusinessDay;
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
    const result = evaluateDay(cursor, ctx.calendar, ctx.extra);
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
