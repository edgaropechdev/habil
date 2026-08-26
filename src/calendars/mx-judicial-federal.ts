import type { Calendar } from '../types.ts';

const LOPJF = 'Ley Orgánica del Poder Judicial de la Federación';
const URL_LOPJF = 'https://www.diputados.gob.mx/LeyesBiblio/index.htm';

/**
 * Días inhábiles para plazos ante órganos del Poder Judicial de la Federación.
 *
 * Divergencia clave frente a la LFT: aquí el 5 de febrero y el 21 de marzo son
 * fechas FIJAS, no se recorren al lunes. Ese detalle mueve vencimientos.
 *
 * ADVERTENCIA: los periodos de vacaciones y las suspensiones de labores se
 * publican por acuerdo del CJF/SCJN y cambian cada año. Este calendario está
 * incompleto sin ellos — ver VERIFY.md.
 */
export const mxJudicialFederal: Calendar = {
  id: 'mx-judicial-federal',
  name: 'México — días inhábiles del Poder Judicial de la Federación',
  jurisdiction: 'MX',
  description:
    'Días inhábiles para el cómputo de plazos ante órganos del PJF. Incompleto sin los acuerdos anuales de suspensión de labores y periodos vacacionales.',
  source: LOPJF,
  url: URL_LOPJF,
  rules: [
    {
      kind: 'weekday',
      id: 'mx-judicial:fin-de-semana',
      label: 'Sábado o domingo',
      weekdays: [0, 6],
      source: LOPJF,
      url: URL_LOPJF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:01-01',
      label: '1 de enero',
      month: 1,
      day: 1,
      source: LOPJF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:02-05',
      label: '5 de febrero (fecha fija; la LFT lo recorre al primer lunes)',
      month: 2,
      day: 5,
      source: LOPJF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:03-21',
      label: '21 de marzo (fecha fija; la LFT lo recorre al tercer lunes)',
      month: 3,
      day: 21,
      source: LOPJF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:05-01',
      label: '1 de mayo',
      month: 5,
      day: 1,
      source: LOPJF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:09-16',
      label: '16 de septiembre',
      month: 9,
      day: 16,
      source: LOPJF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:11-20',
      label: '20 de noviembre',
      month: 11,
      day: 20,
      source: LOPJF,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:12-25',
      label: '25 de diciembre',
      month: 12,
      day: 25,
      source: LOPJF,
      verified: false,
    },
    {
      kind: 'ranges',
      id: 'mx-judicial:vacaciones',
      label: 'Periodos vacacionales del PJF',
      // Publicados por acuerdo cada año. Vacío a propósito.
      ranges: [],
      source: 'Acuerdos generales del CJF y de la SCJN',
      verified: false,
    },
    {
      kind: 'dates',
      id: 'mx-judicial:suspension-labores',
      label: 'Días de suspensión de labores por acuerdo',
      dates: [],
      source: 'Acuerdos generales del CJF y de la SCJN',
      verified: false,
    },
  ],
};
