import type { Calendar } from '../types.ts';

const CFF = 'Código Fiscal de la Federación, artículo 12';
const URL_CFF = 'https://www.diputados.gob.mx/LeyesBiblio/ref/cff.htm';

/**
 * Días inhábiles para plazos ante autoridades fiscales federales.
 *
 * Ojo con dos divergencias respecto al calendario laboral, que son la causa
 * habitual de plazos mal calculados:
 *   - El 5 de mayo NO es descanso obligatorio bajo la LFT, pero sí es inhábil
 *     para efectos fiscales.
 *   - El 20 de noviembre es fecha FIJA aquí, mientras que la LFT lo recorre
 *     al tercer lunes de noviembre.
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
      kind: 'fixed',
      id: 'mx-fiscal:11-20',
      label: '20 de noviembre (fecha fija; la LFT lo recorre al tercer lunes)',
      month: 11,
      day: 20,
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
      anchorYear: 2024,
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
