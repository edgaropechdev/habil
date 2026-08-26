/**
 * Aritmética de fechas civiles.
 *
 * Un plazo legal se cuenta sobre fechas de calendario, no sobre instantes.
 * Usar `Date` con hora local es la fuente #1 de errores off-by-one en este
 * dominio (horario de verano, servidores en UTC, clientes en GMT-6...).
 * Aquí todo es una cadena `YYYY-MM-DD` y la aritmética ocurre en días enteros.
 */

/** Fecha civil en formato ISO `YYYY-MM-DD`. */
export type CivilDate = string;

const RE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export class InvalidDateError extends Error {
  constructor(value: unknown) {
    super(
      `Fecha inválida: ${JSON.stringify(value)}. Se espera el formato YYYY-MM-DD (por ejemplo "2026-03-02").`,
    );
    this.name = 'InvalidDateError';
  }
}

/** Valida y normaliza una fecha civil. Lanza `InvalidDateError` si no es válida. */
export function parseDate(value: unknown): CivilDate {
  if (typeof value !== 'string') throw new InvalidDateError(value);
  const m = RE_DATE.exec(value);
  if (!m) throw new InvalidDateError(value);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new InvalidDateError(value);
  // Rechaza fechas que no existen (30 de febrero, 31 de abril...).
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) {
    throw new InvalidDateError(value);
  }
  return value;
}

/** Días transcurridos desde 1970-01-01. Base de toda la aritmética. */
export function toEpochDay(date: CivilDate): number {
  const m = RE_DATE.exec(date)!;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY;
}

/** Inversa de `toEpochDay`. */
export function fromEpochDay(day: number): CivilDate {
  const d = new Date(day * MS_PER_DAY);
  const y = String(d.getUTCFullYear()).padStart(4, '0');
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Suma (o resta, con `n` negativo) días naturales. */
export function addDays(date: CivilDate, n: number): CivilDate {
  return fromEpochDay(toEpochDay(date) + n);
}

/** Día de la semana: 0 = domingo, 1 = lunes, ... 6 = sábado. */
export function weekday(date: CivilDate): number {
  const d = new Date(toEpochDay(date) * MS_PER_DAY);
  return d.getUTCDay();
}

export function year(date: CivilDate): number {
  return Number(date.slice(0, 4));
}

export function month(date: CivilDate): number {
  return Number(date.slice(5, 7));
}

export function dayOfMonth(date: CivilDate): number {
  return Number(date.slice(8, 10));
}

/** -1 si a < b, 0 si iguales, 1 si a > b. Las cadenas ISO ordenan lexicográficamente. */
export function compare(a: CivilDate, b: CivilDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Fecha de hoy en una zona horaria dada.
 *
 * Explícita a propósito: "hoy" depende de dónde estés parado, y en un plazo
 * legal esa diferencia puede ser un día de vencimiento.
 */
export function today(timeZone = 'America/Mexico_City'): CivilDate {
  // `en-CA` produce YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * N-ésimo día de semana de un mes. `n` positivo cuenta desde el inicio
 * (1 = primero); `n` negativo cuenta desde el final (-1 = último).
 *
 * Necesario porque varios festivos mexicanos son "el tercer lunes de marzo",
 * no una fecha fija.
 */
export function nthWeekdayOfMonth(
  y: number,
  m: number,
  targetWeekday: number,
  n: number,
): CivilDate {
  if (n === 0) throw new RangeError('n debe ser distinto de 0');
  if (n > 0) {
    const first = fromEpochDay(Date.UTC(y, m - 1, 1) / MS_PER_DAY);
    const offset = (targetWeekday - weekday(first) + 7) % 7;
    return addDays(first, offset + (n - 1) * 7);
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = fromEpochDay(Date.UTC(y, m - 1, lastDay) / MS_PER_DAY);
  const offset = (weekday(last) - targetWeekday + 7) % 7;
  return addDays(last, -offset + (n + 1) * 7);
}

/** Genera todas las fechas de un rango inclusivo. */
export function* eachDay(from: CivilDate, to: CivilDate): Generator<CivilDate> {
  const end = toEpochDay(to);
  for (let d = toEpochDay(from); d <= end; d++) yield fromEpochDay(d);
}
