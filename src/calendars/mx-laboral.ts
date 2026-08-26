import type { Calendar } from '../types.ts';

const LFT = 'Ley Federal del Trabajo, artículo 74';
const URL_LFT = 'https://www.diputados.gob.mx/LeyesBiblio/ref/lft.htm';

/**
 * Días de descanso obligatorio bajo la LFT.
 *
 * Deliberadamente NO incluye sábados ni domingos: el descanso semanal es otra
 * figura (art. 69) y depende de la jornada pactada en cada centro de trabajo.
 * Si tu caso excluye fines de semana, agrégalos con `extraNonBusiness` o
 * compón tu propio calendario.
 */
export const mxLaboral: Calendar = {
  id: 'mx-laboral',
  name: 'México — días de descanso obligatorio (LFT)',
  jurisdiction: 'MX',
  description:
    'Días de descanso obligatorio del artículo 74 de la LFT. No incluye el descanso semanal (art. 69) porque depende de la jornada de cada centro de trabajo.',
  source: LFT,
  url: URL_LFT,
  rules: [
    {
      kind: 'fixed',
      id: 'mx-laboral:01-01',
      label: '1 de enero',
      month: 1,
      day: 1,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-laboral:feb-primer-lunes',
      label: 'Primer lunes de febrero, en conmemoración del 5 de febrero',
      month: 2,
      weekday: 1,
      n: 1,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-laboral:mar-tercer-lunes',
      label: 'Tercer lunes de marzo, en conmemoración del 21 de marzo',
      month: 3,
      weekday: 1,
      n: 3,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-laboral:05-01',
      label: '1 de mayo',
      month: 5,
      day: 1,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-laboral:09-16',
      label: '16 de septiembre',
      month: 9,
      day: 16,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'nthWeekday',
      id: 'mx-laboral:nov-tercer-lunes',
      label: 'Tercer lunes de noviembre, en conmemoración del 20 de noviembre',
      month: 11,
      weekday: 1,
      n: 3,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'periodic',
      id: 'mx-laboral:12-01-sexenal',
      label: '1 de diciembre de cada 6 años, por transmisión del Poder Ejecutivo Federal',
      month: 12,
      day: 1,
      everyYears: 6,
      anchorYear: 2024,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'fixed',
      id: 'mx-laboral:12-25',
      label: '25 de diciembre',
      month: 12,
      day: 25,
      source: LFT,
      url: URL_LFT,
      verified: false,
    },
    {
      kind: 'dates',
      id: 'mx-laboral:jornada-electoral',
      label: 'Jornada electoral ordinaria (federal o local)',
      // Depende de la entidad y del calendario electoral vigente.
      dates: [],
      source: `${LFT}, fracción IX — determinado por las leyes electorales`,
      verified: false,
    },
  ],
};
