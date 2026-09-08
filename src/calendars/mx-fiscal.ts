import type { Calendar } from '../types.ts';

const CFF = 'Código Fiscal de la Federación, artículo 12';
const URL_CFF = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf';

/**
 * Días inhábiles para plazos ante autoridades fiscales federales.
 *
 * Divergencias reales respecto al calendario laboral, que son la causa habitual
 * de plazos mal calculados:
 *
 *   - El 5 de mayo NO es descanso obligatorio bajo la LFT, pero el CFF sí lo
 *     lista ("el 1o. y 5 de mayo").
 *
 *   - El día por transmisión del Ejecutivo divergió a partir de 2024. La LFT
 *     fracc. VII se reformó (DOF 30-09-2024) para decir "1o. de octubre"; el CFF
 *     conserva "1o. de diciembre de cada 6 años, cuando corresponda a la
 *     transmisión del Poder Ejecutivo". Como desde 2024 la transmisión ocurre en
 *     octubre, la condición del CFF ya no se cumple: leído a la letra, no hay día
 *     inhábil fiscal por este concepto, ni el 1 de octubre ni el 1 de diciembre.
 *     Aquí se codifica esa lectura literal (`until: 2023`), pero es justo el tipo
 *     de laguna que conviene que confirme alguien con criterio fiscal.
 *
 * En cambio el 20 de noviembre NO diverge: tanto el CFF como la LFT lo recorren
 * al tercer lunes de noviembre.
 */
export const mxFiscal: Calendar = {
  id: 'mx-fiscal',
  name: 'México — plazos fiscales federales',
  jurisdiction: 'MX',
  description:
    'Días que no se cuentan en plazos fijados en días ante autoridades fiscales federales. No aplica a plazos laborales ni judiciales.',
  source: CFF,
  url: URL_CFF,
  rules: [
    {
      kind: 'weekday',
      id: 'mx-fiscal:fin-de-semana',
      label: 'Sábado o domingo',
      weekdays: [0, 6],
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-fiscal:01-01',
      label: '1 de enero',
      month: 1,
      day: 1,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-fiscal:feb-primer-lunes',
      label: 'Primer lunes de febrero, en conmemoración del 5 de febrero',
      month: 2,
      weekday: 1,
      n: 1,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-fiscal:mar-tercer-lunes',
      label: 'Tercer lunes de marzo, en conmemoración del 21 de marzo',
      month: 3,
      weekday: 1,
      n: 3,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-fiscal:05-01',
      label: '1 de mayo',
      month: 5,
      day: 1,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-fiscal:05-05',
      label: '5 de mayo (inhábil fiscal, no es descanso obligatorio bajo la LFT)',
      month: 5,
      day: 5,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-fiscal:09-16',
      label: '16 de septiembre',
      month: 9,
      day: 16,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-fiscal:nov-tercer-lunes',
      label: 'Tercer lunes de noviembre, en conmemoración del 20 de noviembre',
      month: 11,
      weekday: 1,
      n: 3,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'periodic',
      id: 'mx-fiscal:12-01-sexenal',
      label: '1 de diciembre de cada 6 años, por transmisión del Poder Ejecutivo Federal',
      month: 12,
      day: 1,
      everyYears: 6,
      // El CFF condiciona el día a que "corresponda a la transmisión del Poder
      // Ejecutivo". La última transmisión en 1 de diciembre fue la de 2018; desde
      // 2024 el cambio de Ejecutivo ocurre el 1 de octubre, así que la condición
      // ya no se cumple en diciembre. Ver la nota sobre `until` en el encabezado.
      anchorYear: 2018,
      until: 2023,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-fiscal:12-25',
      label: '25 de diciembre',
      month: 12,
      day: 25,
      source: CFF,
      url: URL_CFF,
      verified: false,
    },
    {
      kind: 'dates',
      id: 'mx-fiscal:vacaciones-generales-sat',
      label: 'Vacaciones generales de las autoridades fiscales federales',
      // Se publican cada año. Sin datos hasta que alguien los verifique
      // contra la publicación oficial: inventarlos sería peor que no tenerlos.
      dates: [],
      source: `${CFF}, segundo párrafo — periodos publicados anualmente por el SAT`,
      url: 'https://www.sat.gob.mx',
      verified: false,
    },
  ],
};
