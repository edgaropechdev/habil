import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addBusinessDays,
  businessDaysBetween,
  compareCalendars,
  deadline,
  explainDay,
  isBusinessDay,
  nextBusinessDay,
  nonBusinessDaysOfYear,
  previousBusinessDay,
  rollForward,
  UnknownCalendarError,
} from '../src/index.ts';

const fiscal = { calendar: 'mx-fiscal' } as const;
const laboral = { calendar: 'mx-laboral' } as const;
const judicial = { calendar: 'mx-judicial-federal' } as const;

test('fines de semana no son hábiles en el calendario fiscal', () => {
  assert.equal(isBusinessDay('2026-03-21', fiscal), false); // sábado
  assert.equal(isBusinessDay('2026-03-22', fiscal), false); // domingo
  assert.equal(isBusinessDay('2026-03-23', fiscal), true); // lunes
});

test('el calendario laboral no excluye fines de semana por sí mismo', () => {
  // El descanso semanal es el art. 69, no el 74. Documentado en el calendario.
  assert.equal(isBusinessDay('2026-03-21', laboral), true);
});

test('DIVERGENCIA: el 20 de noviembre se recorre al lunes salvo en el PJF', () => {
  // El CFF art. 12 y la LFT art. 74 fracc. VI dicen ambos "el tercer lunes de
  // noviembre en conmemoración del 20 de noviembre". Quien diverge es el PJF: el
  // art. 229 de la LOPJF sí usa la fecha fija.
  assert.equal(isBusinessDay('2026-11-20', fiscal), true); // viernes 20: hábil
  assert.equal(isBusinessDay('2026-11-20', laboral), true);
  assert.equal(isBusinessDay('2026-11-20', judicial), false); // fecha fija

  assert.equal(isBusinessDay('2026-11-16', fiscal), false); // tercer lunes
  assert.equal(isBusinessDay('2026-11-16', laboral), false);
  assert.equal(isBusinessDay('2026-11-16', judicial), true);
});

test('el PJF descansa el 14 de septiembre y los demás calendarios no', () => {
  // El art. 229 lista "14 y 16 de septiembre". El 14 no aparece ni en el CFF ni
  // en la LFT.
  assert.equal(isBusinessDay('2026-09-14', judicial), false); // lunes
  assert.equal(isBusinessDay('2026-09-14', fiscal), true);
  assert.equal(isBusinessDay('2026-09-14', laboral), true);
});

test('DIVERGENCIA: 5 de mayo es inhábil fiscal pero no descanso obligatorio', () => {
  assert.equal(isBusinessDay('2026-05-05', fiscal), false);
  assert.equal(isBusinessDay('2026-05-05', laboral), true);
});

test('DIVERGENCIA: el judicial usa fechas fijas, no lunes recorridos', () => {
  assert.equal(isBusinessDay('2026-02-05', judicial), false); // jueves 5 de febrero
  assert.equal(isBusinessDay('2026-02-05', laboral), true);
  assert.equal(isBusinessDay('2026-02-02', laboral), false); // primer lunes
  assert.equal(isBusinessDay('2026-02-02', judicial), true);
});

const tieneRegla = (r: { reasons: Array<{ ruleId: string }> }, frag: string) =>
  r.reasons.some((x) => x.ruleId.includes(frag));

test('la transmisión del Ejecutivo pasó de diciembre a octubre en la LFT', () => {
  // Fracción VII reformada DOF 30-09-2024.
  assert.equal(isBusinessDay('2024-10-01', laboral), false);
  assert.equal(isBusinessDay('2030-10-01', laboral), false);
  assert.equal(isBusinessDay('2027-10-01', laboral), true); // no toca sexenio

  // El texto anterior (1 de diciembre) sigue vigente para plazos históricos.
  // 2018-12-01 cayó en sábado y el calendario laboral no excluye fines de
  // semana, así que se comprueba por el fundamento y no por el veredicto —
  // de lo contrario la prueba pasaría por la razón equivocada.
  assert.ok(tieneRegla(explainDay('2018-12-01', laboral), 'sexenal'));
  assert.ok(!tieneRegla(explainDay('2030-12-01', laboral), 'sexenal'));
});

test('el CFF conserva el texto de diciembre, condicionado a una transmisión que ya no ocurre ahí', () => {
  // "el 1o. de diciembre de cada 6 años, cuando corresponda a la transmisión del
  // Poder Ejecutivo". Desde 2024 la transmisión es en octubre, así que la
  // condición no se cumple. Y el 1 de octubre no está en la lista del CFF.
  assert.ok(tieneRegla(explainDay('2018-12-01', fiscal), 'sexenal'));
  assert.ok(!tieneRegla(explainDay('2030-12-01', fiscal), 'sexenal'));
  assert.equal(isBusinessDay('2030-10-01', fiscal), true);
});

test('explainDay devuelve el fundamento, no solo el veredicto', () => {
  const r = explainDay('2026-03-16', fiscal);
  assert.equal(r.isBusinessDay, false);
  assert.equal(r.reasons.length, 1);
  assert.equal(r.reasons[0]?.ruleId, 'mx-fiscal:mar-tercer-lunes');
  assert.match(r.reasons[0]?.source ?? '', /artículo 12/);
});

test('un día puede ser inhábil por más de una razón', () => {
  // 1 de mayo de 2027 cae en sábado: fin de semana + festivo.
  const r = explainDay('2027-05-01', fiscal);
  assert.equal(r.reasons.length, 2);
});

test('addBusinessDays no cuenta el día de partida', () => {
  assert.equal(addBusinessDays('2026-03-17', 1, fiscal), '2026-03-18');
  assert.equal(addBusinessDays('2026-03-13', 1, fiscal), '2026-03-17'); // salta sáb, dom y el 16
  assert.equal(addBusinessDays('2026-03-13', 5, fiscal), '2026-03-23');
  assert.equal(addBusinessDays('2026-03-23', -5, fiscal), '2026-03-13');
  assert.equal(addBusinessDays('2026-03-13', 0, fiscal), '2026-03-13');
});

test('addBusinessDays rechaza valores no enteros', () => {
  assert.throws(() => addBusinessDays('2026-03-13', 1.5, fiscal), RangeError);
});

test('next / previous / rollForward', () => {
  assert.equal(nextBusinessDay('2026-03-20', fiscal), '2026-03-23');
  assert.equal(previousBusinessDay('2026-03-23', fiscal), '2026-03-20');
  assert.equal(rollForward('2026-03-21', fiscal), '2026-03-23');
  assert.equal(rollForward('2026-03-23', fiscal), '2026-03-23'); // ya es hábil
});

test('businessDaysBetween respeta los extremos', () => {
  assert.equal(businessDaysBetween('2026-03-13', '2026-03-23', fiscal), 5);
  assert.equal(
    businessDaysBetween('2026-03-13', '2026-03-23', { ...fiscal, inclusive: 'both' }),
    6,
  );
  assert.equal(
    businessDaysBetween('2026-03-13', '2026-03-23', { ...fiscal, inclusive: 'neither' }),
    4,
  );
  assert.equal(businessDaysBetween('2026-03-23', '2026-03-13', fiscal), -5); // invertido
});

test('deadline en días hábiles explica cada día saltado', () => {
  const r = deadline({ from: '2026-03-13', amount: 5, unit: 'habiles', calendar: 'mx-fiscal' });
  assert.equal(r.date, '2026-03-23');
  assert.equal(r.countingStartsOn, '2026-03-14');
  assert.equal(r.calendarDays, 10);
  assert.deepEqual(
    r.skipped.map((s) => s.date),
    ['2026-03-14', '2026-03-15', '2026-03-16', '2026-03-21', '2026-03-22'],
  );
});

test('deadline en días naturales prorroga al siguiente hábil', () => {
  const r = deadline({ from: '2026-12-23', amount: 2, unit: 'naturales', calendar: 'mx-fiscal' });
  assert.equal(r.rolledForwardFrom, '2026-12-25'); // navidad, viernes
  assert.equal(r.date, '2026-12-28'); // lunes
});

test('deadline en naturales puede no prorrogar si se pide', () => {
  const r = deadline({
    from: '2026-12-23',
    amount: 2,
    unit: 'naturales',
    calendar: 'mx-fiscal',
    rollForwardIfNonBusiness: false,
  });
  assert.equal(r.date, '2026-12-25');
  assert.equal(r.rolledForwardFrom, undefined);
});

test('deadline rechaza plazos negativos', () => {
  assert.throws(
    () => deadline({ from: '2026-03-13', amount: -1, unit: 'habiles', calendar: 'mx-fiscal' }),
    RangeError,
  );
});

test('los resultados advierten sobre reglas sin verificar', () => {
  const r = deadline({ from: '2026-03-13', amount: 5, unit: 'habiles', calendar: 'mx-fiscal' });
  assert.ok(r.warnings.length > 0, 'v0.1.0 aún no tiene reglas verificadas');
  assert.ok(r.warnings.every((w) => w.includes('sin verificar')));
});

test('extraNonBusiness y extraBusiness sobrescriben el calendario', () => {
  const conCierre = { calendar: 'mx-fiscal', extraNonBusiness: ['2026-03-17'] };
  assert.equal(isBusinessDay('2026-03-17', conCierre), false);
  assert.equal(addBusinessDays('2026-03-13', 1, conCierre), '2026-03-18');

  const abiertoEnSabado = { calendar: 'mx-fiscal', extraBusiness: ['2026-03-21'] };
  assert.equal(isBusinessDay('2026-03-21', abiertoEnSabado), true);
});

test('extraBusiness gana sobre extraNonBusiness', () => {
  const r = explainDay('2026-03-21', {
    calendar: 'mx-fiscal',
    extraNonBusiness: ['2026-03-21'],
    extraBusiness: ['2026-03-21'],
  });
  assert.equal(r.isBusinessDay, true);
});

test('compareCalendars muestra la misma fecha en los tres calendarios', () => {
  const r = compareCalendars('2026-11-20');
  const byId = Object.fromEntries(r.map((x) => [x.calendarId, x.isBusinessDay]));
  assert.deepEqual(byId, {
    'mx-fiscal': true,
    'mx-laboral': true,
    'mx-judicial-federal': false,
  });
});

test('nonBusinessDaysOfYear cubre el año completo', () => {
  const dias = nonBusinessDaysOfYear(2026, fiscal);
  assert.ok(dias.every((d) => d.date.startsWith('2026-')));
  assert.ok(dias.some((d) => d.date === '2026-12-25'));
  // 52 sábados + 52 domingos en 2026, más los festivos que no caen en fin de semana.
  assert.ok(dias.length > 104 && dias.length < 125, `inesperado: ${dias.length}`);
});

test('un calendario inexistente falla con un mensaje útil', () => {
  assert.throws(() => isBusinessDay('2026-01-01', { calendar: 'mx-inventado' }), (e: Error) => {
    assert.ok(e instanceof UnknownCalendarError);
    assert.match(e.message, /mx-fiscal/); // sugiere los disponibles
    return true;
  });
});
