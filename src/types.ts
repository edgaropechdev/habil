import type { CivilDate } from './date.ts';

/**
 * Toda regla de este paquete declara de dónde sale y si fue confirmada contra
 * la fuente primaria. No es burocracia: si un plazo mal calculado le cuesta un
 * caso a alguien, la pregunta inmediata es "¿de dónde salió este día?" y la
 * respuesta tiene que estar en la respuesta, no en el README.
 */
export interface RuleBase {
  /** Identificador estable. Aparece en los resultados; no lo cambies a la ligera. */
  id: string;
  /** Descripción legible para humanos. */
  label: string;
  /** Cita de la fuente: artículo, acuerdo o publicación oficial. */
  source: string;
  /** URL de la fuente primaria, cuando existe. */
  url?: string;
  /**
   * `true` solo si un humano confirmó la regla contra el texto vigente de la
   * fuente y anotó la fecha de revisión en VERIFY.md.
   */
  verified: boolean;
  /** Año a partir del cual aplica (inclusive). */
  since?: number;
  /** Último año en que aplica (inclusive). */
  until?: number;
}

/** Días de la semana no laborables. 0 = domingo ... 6 = sábado. */
export interface WeekdayRule extends RuleBase {
  kind: 'weekday';
  weekdays: number[];
}

/** Fecha fija cada año. Ej. 25 de diciembre. */
export interface FixedRule extends RuleBase {
  kind: 'fixed';
  month: number;
  day: number;
}

/** N-ésimo día de semana de un mes. Ej. tercer lunes de marzo. */
export interface NthWeekdayRule extends RuleBase {
  kind: 'nthWeekday';
  month: number;
  weekday: number;
  /** Positivo desde el inicio del mes, negativo desde el final. */
  n: number;
}

/** Fecha fija que solo aplica cada N años. Ej. 1 de diciembre cada 6 (transmisión del Ejecutivo). */
export interface PeriodicRule extends RuleBase {
  kind: 'periodic';
  month: number;
  day: number;
  everyYears: number;
  /** Año conocido en que aplicó. */
  anchorYear: number;
}

/** Fechas sueltas publicadas por año. Ej. vacaciones generales del SAT. */
export interface DatesRule extends RuleBase {
  kind: 'dates';
  dates: CivilDate[];
}

/** Periodos continuos. Ej. vacaciones judiciales. */
export interface RangesRule extends RuleBase {
  kind: 'ranges';
  ranges: Array<{ from: CivilDate; to: CivilDate }>;
}

export type Rule =
  | WeekdayRule
  | FixedRule
  | NthWeekdayRule
  | PeriodicRule
  | DatesRule
  | RangesRule;

/** Por qué un día no es hábil. */
export interface Reason {
  ruleId: string;
  label: string;
  source: string;
  url?: string;
  verified: boolean;
}

export interface Calendar {
  /** Identificador estable, ej. `mx-fiscal`. */
  id: string;
  name: string;
  /** Código de jurisdicción, ej. `MX`. */
  jurisdiction: string;
  /** Para qué sirve y, sobre todo, para qué NO sirve. */
  description: string;
  /** Norma que define el calendario. */
  source: string;
  url?: string;
  rules: Rule[];
  /**
   * Años para los que ya se cargaron los datos que la autoridad publica cada
   * año (vacaciones generales, acuerdos de suspensión de labores).
   *
   * Fuera de estos años el calendario está incompleto y el motor lo advierte en
   * `warnings`, incluso cuando el veredicto sea "hábil" — que es justo el caso
   * peligroso: un día que en realidad era inhábil y acorta el plazo calculado.
   *
   * Si un calendario no depende de publicaciones anuales, omite el campo.
   */
  annualDataYears?: number[];
}

export interface CalendarOptions {
  /** Id de un calendario incluido, o un objeto `Calendar` propio. */
  calendar: string | Calendar;
  /** Fechas adicionales a tratar como inhábiles (cierres de oficina, acuerdos locales). */
  extraNonBusiness?: CivilDate[];
  /** Fechas a forzar como hábiles, aunque alguna regla diga lo contrario. */
  extraBusiness?: CivilDate[];
}

export interface DayResult {
  date: CivilDate;
  isBusinessDay: boolean;
  /** Vacío si el día es hábil. */
  reasons: Reason[];
  /** Reglas sin verificar que influyeron en este resultado. */
  warnings: string[];
}
