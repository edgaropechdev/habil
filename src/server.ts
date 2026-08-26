/**
 * API HTTP de habil.
 *
 * Sin dependencias a propósito: `node src/server.ts` y ya. Menos superficie que
 * mantener, y arranca en cualquier VPS o plataforma sin build.
 *
 * Toda respuesta lleva `warnings` cuando el resultado dependió de reglas que
 * nadie ha verificado todavía. Preferimos perder una venta a que alguien
 * pierda un plazo.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  addBusinessDays,
  businessDaysBetween,
  compareCalendars,
  deadline,
  explainDay,
  listCalendars,
  nonBusinessDaysOfYear,
  today,
} from './index.ts';

const PORT = Number(process.env.PORT ?? 8080);

/**
 * Contadores en memoria. Suficiente para responder la única pregunta que
 * importa al principio: ¿alguien está usando esto, y para qué?
 * Cuando haya tráfico real, esto se sustituye por almacenamiento persistente.
 */
const metrics = {
  startedAt: new Date().toISOString(),
  total: 0,
  byRoute: {} as Record<string, number>,
  byCalendar: {} as Record<string, number>,
  errors: 0,
};

function bump(bucket: Record<string, number>, key: string): void {
  bucket[key] = (bucket[key] ?? 0) + 1;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': status === 200 ? 'public, max-age=86400' : 'no-store',
  });
  res.end(json);
}

function required(params: URLSearchParams, name: string): string {
  const v = params.get(name);
  if (!v) throw new HttpError(400, `Falta el parámetro obligatorio "${name}".`);
  return v;
}

function intParam(params: URLSearchParams, name: string): number {
  const raw = required(params, name);
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new HttpError(400, `"${name}" debe ser un entero, se recibió "${raw}".`);
  return n;
}

function calendarOf(params: URLSearchParams): string {
  const id = params.get('calendar') ?? params.get('calendario') ?? 'mx-fiscal';
  bump(metrics.byCalendar, id);
  return id;
}

function unitOf(params: URLSearchParams): 'habiles' | 'naturales' {
  const u = params.get('unit') ?? params.get('unidad') ?? 'habiles';
  if (u !== 'habiles' && u !== 'naturales') {
    throw new HttpError(400, `"unit" debe ser "habiles" o "naturales", se recibió "${u}".`);
  }
  return u;
}

const ROUTES: Record<string, (p: URLSearchParams) => unknown> = {
  '/v1/calendars': () => ({ calendars: listCalendars() }),

  '/v1/day': (p) => explainDay(p.get('date') ?? today(), { calendar: calendarOf(p) }),

  '/v1/compare': (p) => ({
    date: p.get('date') ?? today(),
    calendars: compareCalendars(p.get('date') ?? today()),
  }),

  '/v1/add': (p) => {
    const date = required(p, 'date');
    const days = intParam(p, 'days');
    const calendar = calendarOf(p);
    return { date, days, calendar, result: addBusinessDays(date, days, { calendar }) };
  },

  '/v1/between': (p) => {
    const from = required(p, 'from');
    const to = required(p, 'to');
    const calendar = calendarOf(p);
    return { from, to, calendar, businessDays: businessDaysBetween(from, to, { calendar }) };
  },

  '/v1/deadline': (p) =>
    deadline({
      from: required(p, 'from'),
      amount: intParam(p, 'days'),
      unit: unitOf(p),
      calendar: calendarOf(p),
    }),

  '/v1/year': (p) => {
    const year = intParam(p, 'year');
    const calendar = calendarOf(p);
    return { year, calendar, nonBusinessDays: nonBusinessDaysOfYear(year, { calendar }) };
  },

  '/health': () => ({ ok: true, since: metrics.startedAt }),

  '/metrics': () => metrics,

  '/': () => ({
    name: 'habil',
    description: 'Días hábiles y plazos legales en México, con el fundamento de cada día.',
    repository: 'https://github.com/edgaropechdev/habil',
    npm: 'https://www.npmjs.com/package/habil',
    endpoints: {
      'GET /v1/calendars': 'Calendarios disponibles y sus reglas.',
      'GET /v1/day?date=&calendar=': '¿Es hábil? Con el fundamento.',
      'GET /v1/compare?date=': 'La misma fecha en todos los calendarios.',
      'GET /v1/add?date=&days=&calendar=': 'Suma días hábiles.',
      'GET /v1/between?from=&to=&calendar=': 'Cuenta días hábiles entre dos fechas.',
      'GET /v1/deadline?from=&days=&unit=&calendar=': 'Fecha de vencimiento de un plazo.',
      'GET /v1/year?year=&calendar=': 'Días inhábiles de un año.',
    },
    example: '/v1/deadline?from=2026-03-13&days=15&calendar=mx-fiscal',
    disclaimer:
      'Software libre bajo licencia MIT, sin garantía. No sustituye asesoría legal ni fiscal. Las reglas aún no han sido verificadas contra fuente primaria: ver VERIFY.md.',
  }),
};

function handle(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
    });
    return void res.end();
  }
  if (req.method !== 'GET') {
    metrics.errors++;
    return send(res, 405, { error: 'Solo se admite GET.' });
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const route = ROUTES[url.pathname.replace(/\/+$/, '') || '/'];

  metrics.total++;
  bump(metrics.byRoute, url.pathname);

  if (!route) {
    metrics.errors++;
    return send(res, 404, {
      error: `Ruta desconocida: ${url.pathname}`,
      hint: 'Consulta / para la lista de endpoints.',
    });
  }

  try {
    send(res, 200, route(url.searchParams));
  } catch (err) {
    metrics.errors++;
    const status = err instanceof HttpError ? err.status : 400;
    send(res, status, { error: (err as Error).message });
  }
}

createServer(handle).listen(PORT, () => {
  console.log(`habil API escuchando en http://localhost:${PORT}`);
});
