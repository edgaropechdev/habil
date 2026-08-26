import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  eachDay,
  fromEpochDay,
  InvalidDateError,
  nthWeekdayOfMonth,
  parseDate,
  toEpochDay,
  weekday,
} from '../src/date.ts';

test('parseDate acepta fechas válidas', () => {
  assert.equal(parseDate('2026-03-02'), '2026-03-02');
  assert.equal(parseDate('2024-02-29'), '2024-02-29');
});

test('parseDate rechaza formatos y fechas inexistentes', () => {
  for (const bad of ['2026-3-2', '02/03/2026', '2026-02-30', '2026-13-01', '', 20260302]) {
    assert.throws(() => parseDate(bad as never), InvalidDateError, `debió rechazar ${bad}`);
  }
});

test('epochDay va y vuelve sin perder días en 8 años', () => {
  let d = '2020-01-01';
  for (let i = 0; i < 365 * 8; i++) {
    assert.equal(fromEpochDay(toEpochDay(d)), d);
    d = addDays(d, 1);
  }
});

test('addDays cruza meses, años y bisiestos', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2025-02-28', 1), '2025-03-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('addDays no se desvía en el cambio de horario de verano', () => {
  // Con hora local en vez de UTC, este salto pierde o gana un día.
  assert.equal(addDays('2026-04-04', 1), '2026-04-05');
  assert.equal(addDays('2026-10-24', 1), '2026-10-25');
  assert.equal(toEpochDay('2026-04-06') - toEpochDay('2026-03-30'), 7);
});

test('weekday: 0 = domingo', () => {
  assert.equal(weekday('2026-01-01'), 4); // jueves
  assert.equal(weekday('2026-03-01'), 0); // domingo
  assert.equal(weekday('2026-11-20'), 5); // viernes
});

test('nthWeekdayOfMonth calcula desde el inicio y desde el final', () => {
  assert.equal(nthWeekdayOfMonth(2026, 2, 1, 1), '2026-02-02'); // primer lunes de febrero
  assert.equal(nthWeekdayOfMonth(2026, 3, 1, 3), '2026-03-16'); // tercer lunes de marzo
  assert.equal(nthWeekdayOfMonth(2026, 11, 1, 3), '2026-11-16'); // tercer lunes de noviembre
  assert.equal(nthWeekdayOfMonth(2026, 11, 1, -1), '2026-11-30'); // último lunes
  assert.throws(() => nthWeekdayOfMonth(2026, 1, 1, 0), RangeError);
});

test('eachDay recorre el rango inclusivo', () => {
  assert.deepEqual([...eachDay('2026-01-30', '2026-02-02')], [
    '2026-01-30',
    '2026-01-31',
    '2026-02-01',
    '2026-02-02',
  ]);
});
