import type { Calendar } from '../types.ts';

const AMPARO = 'Ley de Amparo, artículo 19';
const URL_AMPARO = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LAmp.pdf';

const LOPJF = 'Ley Orgánica del Poder Judicial de la Federación, artículo 229';
const URL_LOPJF = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LOPJF.pdf';

/**
 * El Acuerdo General del Pleno del CJF que reglamenta su organización y
 * funcionamiento fija en su artículo 6 los días de descanso del personal, y su
 * fracción III remite a los lunes del artículo 74 de la LFT. Sigue vigente por
 * el transitorio décimo noveno de la LOPJF (DOF 20-12-2024) hasta que el Órgano
 * de Administración Judicial emita los suyos.
 */
const ACUERDO_ORG = 'Acuerdo General del Pleno del CJF de organización y funcionamiento, artículo 6';

const CALENDARIO_OAJ = 'https://www.oaj.gob.mx/transparencia/paginas/diasinhabiles.htm';

/**
 * Días inhábiles para plazos ante órganos del Poder Judicial de la Federación.
 *
 * La fuente operativa aquí es la **Ley de Amparo art. 19**, no la LOPJF: el
 * amparo es el procedimiento más común ante el PJF y su lista es más amplia que
 * la del art. 229 de la LOPJF. En concreto, el art. 19 añade el 5 de mayo, el 12
 * de octubre y el 25 de diciembre, que el art. 229 no menciona.
 *
 * Divergencias frente a los otros calendarios:
 *   - El 5 de febrero, el 21 de marzo y el 20 de noviembre son fechas FIJAS,
 *     mientras que el CFF y la LFT las recorren al lunes.
 *   - Pero además el PJF descansa TAMBIÉN esos lunes recorridos, por el artículo
 *     6 fracción III del acuerdo de organización. O sea que en noviembre hay dos
 *     días inhábiles: el tercer lunes y el 20.
 *
 * Los periodos vacacionales y las suspensiones se publican cada año; ver
 * `annualDataYears` para saber qué años están cargados.
 */
export const mxJudicialFederal: Calendar = {
  id: 'mx-judicial-federal',
  name: 'México — días inhábiles del Poder Judicial de la Federación',
  jurisdiction: 'MX',
  description:
    'Días inhábiles para el cómputo de plazos ante órganos del PJF, con la Ley de Amparo art. 19 como fuente principal. Los periodos vacacionales y las suspensiones de labores se cargan por año.',
  source: AMPARO,
  url: URL_AMPARO,
  annualDataYears: [2026],
  rules: [
    {
      kind: 'weekday',
      id: 'mx-judicial:fin-de-semana',
      label: 'Sábado o domingo',
      weekdays: [0, 6],
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:01-01',
      label: '1 de enero',
      month: 1,
      day: 1,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:02-05',
      label: '5 de febrero (fecha fija; el CFF y la LFT lo recorren al primer lunes)',
      month: 2,
      day: 5,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-judicial:feb-primer-lunes',
      label: 'Primer lunes de febrero (día de descanso del personal del PJF)',
      month: 2,
      weekday: 1,
      n: 1,
      source: `${ACUERDO_ORG}, fracción III`,
      url: CALENDARIO_OAJ,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:03-21',
      label: '21 de marzo (fecha fija; el CFF y la LFT lo recorren al tercer lunes)',
      month: 3,
      day: 21,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-judicial:mar-tercer-lunes',
      label: 'Tercer lunes de marzo (día de descanso del personal del PJF)',
      month: 3,
      weekday: 1,
      n: 3,
      source: `${ACUERDO_ORG}, fracción III`,
      url: CALENDARIO_OAJ,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:05-01',
      label: '1 de mayo',
      month: 5,
      day: 1,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      // No está en el art. 229 de la LOPJF, pero sí en el art. 19 de la Ley de
      // Amparo y en el art. 6 fracc. VI del acuerdo de organización.
      kind: 'fixed',
      id: 'mx-judicial:05-05',
      label: '5 de mayo',
      month: 5,
      day: 5,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:09-14',
      label: '14 de septiembre',
      month: 9,
      day: 14,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:09-16',
      label: '16 de septiembre',
      month: 9,
      day: 16,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      // Tampoco está en el art. 229 de la LOPJF.
      kind: 'fixed',
      id: 'mx-judicial:10-12',
      label: '12 de octubre',
      month: 10,
      day: 12,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:11-20',
      label: '20 de noviembre (fecha fija; el CFF y la LFT lo recorren al tercer lunes)',
      month: 11,
      day: 20,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-judicial:nov-tercer-lunes',
      label: 'Tercer lunes de noviembre (día de descanso del personal del PJF)',
      month: 11,
      weekday: 1,
      n: 3,
      source: `${ACUERDO_ORG}, fracción III`,
      url: CALENDARIO_OAJ,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-judicial:12-25',
      label: '25 de diciembre',
      month: 12,
      day: 25,
      source: AMPARO,
      url: URL_AMPARO,
      verified: false,
    },
    {
      // Los dos periodos que marcan los artículos 76 y 225 de la LOPJF, según el
      // calendario oficial de días inhábiles del Órgano de Administración
      // Judicial. Se cargan por año: al añadir un año nuevo, actualiza también
      // `annualDataYears`.
      kind: 'ranges',
      id: 'mx-judicial:vacaciones-2026',
      label: 'Periodos vacacionales del PJF en 2026',
      ranges: [
        { from: '2026-07-16', to: '2026-07-31' },
        { from: '2026-12-16', to: '2026-12-31' },
      ],
      since: 2026,
      until: 2026,
      source:
        'Ley Orgánica del Poder Judicial de la Federación, artículos 76 y 225 — calendario de días inhábiles del Órgano de Administración Judicial',
      url: CALENDARIO_OAJ,
      verified: false,
    },
    {
      kind: 'dates',
      id: 'mx-judicial:suspension-2026',
      label: 'Días de suspensión de labores del PJF en 2026, por circular',
      dates: [
        '2026-04-01',
        '2026-04-02',
        '2026-04-03',
        '2026-05-04',
        '2026-09-15',
        '2026-11-02',
      ],
      since: 2026,
      until: 2026,
      source:
        'Circular 3/2026 de la Secretaría Ejecutiva del Pleno del Órgano de Administración Judicial (28 de enero de 2026)',
      url: CALENDARIO_OAJ,
      verified: false,
    },
  ],
};
