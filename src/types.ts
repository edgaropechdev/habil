import type { CivilDate } from './date.ts';

/**
 * Toda regla de este paquete declara de dónde sale y si fue confirmada contra
 * la fuente primaria. No es burocracia: si un plazo mal calculado le cuesta un
 * caso a alguien, la pregunta inmediata es "¿de dónde salió este día?" y la
 * respuesta tiene que estar en la respuesta, no en el README.
 */
/**
 * Identificador de un tipo de trámite.
 *
 * Existe porque "¿es día hábil?" no siempre tiene una sola respuesta dentro del
 * mismo calendario. El CFF art. 12 es el caso claro: las vacaciones generales
 * del SAT suspenden los plazos en general, pero NO los de presentación de
 * declaraciones y pago de contribuciones, que siguen corriendo.
 */
export type TramiteId = string;

/** Trámite que un calendario distingue, con la norma que lo justifica. */
export interface Tramite {
  id: TramiteId;
  label: string;
  source: string;
  url?: string;
}

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
  /**
   * Trámites a los que esta regla NO aplica. Si se consulta uno de ellos, la
   * regla se descarta y el resultado lo reporta en `setAside` — el día sigue
   * teniendo explicación, solo que la explicación es por qué NO contó.
   */
  exceptFor?: TramiteId[];
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
  /** Trámites que este calendario distingue. Omitir si no distingue ninguno. */
  tramites?: Tramite[];
  /**
   * Prórrogas que no dependen de que el día sea inhábil, sino del día de la
   * semana en que cae el vencimiento y del trámite de que se trate.
   */
  extensions?: WeekdayExtension[];
}

/**
 * Prórroga por día de la semana, atada a un trámite.
 *
 * El caso que la motiva es el último párrafo del CFF art. 12: si el último día
 * del plazo para pagar contribuciones ante instituciones de crédito cae en
 * viernes, el plazo se prorroga al siguiente día hábil — aunque ese viernes sea
 * perfectamente hábil.
 */
export interface WeekdayExtension {
  id: string;
  label: string;
  source: string;
  url?: string;
  verified: boolean;
  /** Solo aplica a estos trámites. */
  onlyFor: TramiteId[];
  /** Días de la semana que disparan la prórroga. 0 = domingo ... 6 = sábado. */
  weekdays: number[];
}

export interface CalendarOptions {
  /** Id de un calendario incluido, o un objeto `Calendar` propio. */
  calendar: string | Calendar;
  /** Fechas adicionales a tratar como inhábiles (cierres de oficina, acuerdos locales). */
  extraNonBusiness?: CivilDate[];
  /** Fechas a forzar como hábiles, aunque alguna regla diga lo contrario. */
  extraBusiness?: CivilDate[];
  /**
   * Tipo de trámite, cuando el calendario distingue alguno. Sin él se aplica el
   * régimen general, que es el más restrictivo.
   */
  tramite?: TramiteId;
}

export interface DayResult {
  date: CivilDate;
  isBusinessDay: boolean;
  /** Vacío si el día es hábil. */
  reasons: Reason[];
  /**
   * Reglas que habrían hecho inhábil el día, pero que no aplican al trámite
   * consultado. Vacío cuando no se pidió un trámite.
   *
   * Sin esto, un día hábil no tendría explicación y el usuario no podría
   * distinguir "no había ninguna regla" de "la regla no aplica a tu caso".
   */
  setAside: Reason[];
  /** Reglas sin verificar que influyeron en este resultado. */
  warnings: string[];
}
