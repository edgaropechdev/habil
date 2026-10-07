#!/usr/bin/env node
/**
 * CLI de habil.
 *
 * Existe para que alguien pueda comprobar el valor con un solo comando y sin
 * instalar nada: `npx habil plazo 2026-03-13 15`.
 */

import {
  businessDaysBetween,
  compareCalendars,
  deadline,
  explainDay,
  listCalendars,
  nonBusinessDaysOfYear,
  today,
} from './index.ts';

const C = process.stdout.isTTY
  ? { dim: '\x1b[2m', bold: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' }
  : { dim: '', bold: '', red: '', green: '', yellow: '', reset: '' };

const USAGE = `
${C.bold}habil${C.reset} — días hábiles y plazos legales en México

  ${C.bold}habil dia${C.reset} [fecha]                  ¿Es hábil? En los tres calendarios.
  ${C.bold}habil plazo${C.reset} <desde> <días>         Fecha de vencimiento, con el detalle.
  ${C.bold}habil entre${C.reset} <desde> <hasta>        Días hábiles entre dos fechas.
  ${C.bold}habil año${C.reset} <año>                    Lista los días inhábiles del año.
  ${C.bold}habil calendarios${C.reset}                  Calendarios disponibles.

${C.bold}Opciones${C.reset}
  -c, --calendario <id>    mx-fiscal (predeterminado), mx-laboral, mx-judicial-federal
  -u, --unidad <u>         habiles (predeterminado) | naturales
  -t, --tramite <id>       Tipo de trámite, cuando el calendario lo distingue
      --json               Salida en JSON, para tuberías y scripts

${C.bold}Ejemplos${C.reset}
  ${C.dim}habil dia 2026-11-20${C.reset}
  ${C.dim}habil plazo 2026-03-13 15 -c mx-fiscal${C.reset}
  ${C.dim}habil plazo 2026-12-23 30 -u naturales --json${C.reset}
  ${C.dim}habil dia 2026-07-22 -t declaracion-pago${C.reset}
`;

interface Args {
  positional: string[];
  calendar: string;
  unit: 'habiles' | 'naturales';
  tramite?: string;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { positional: [], calendar: 'mx-fiscal', unit: 'habiles', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--json') out.json = true;
    else if (a === '-c' || a === '--calendario') out.calendar = argv[++i] ?? '';
    else if (a === '-t' || a === '--tramite') out.tramite = argv[++i] ?? '';
    else if (a === '-u' || a === '--unidad') {
      const u = argv[++i];
      if (u !== 'habiles' && u !== 'naturales') throw new Error(`Unidad inválida: ${u}`);
      out.unit = u;
    } else if (a.startsWith('-')) throw new Error(`Opción desconocida: ${a}`);
    else out.positional.push(a);
  }
  return out;
}

function mark(ok: boolean): string {
  return ok ? `${C.green}hábil${C.reset}` : `${C.red}inhábil${C.reset}`;
}

function printWarnings(warnings: string[]): void {
  if (warnings.length === 0) return;
  console.log(`\n${C.yellow}⚠ Advertencias:${C.reset}`);
  for (const w of warnings) console.log(`  ${C.dim}${w}${C.reset}`);
}

function cmdDia(args: Args): void {
  const fecha = args.positional[1] ?? today();
  const rows = compareCalendars(fecha);
  if (args.json) return void console.log(JSON.stringify({ fecha, calendarios: rows }, null, 2));

  console.log(`\n${C.bold}${fecha}${C.reset}\n`);
  for (const r of rows) {
    console.log(`  ${r.calendarId.padEnd(22)} ${mark(r.isBusinessDay)}`);
    for (const reason of r.reasons) {
      console.log(`  ${' '.repeat(22)} ${C.dim}└ ${reason.label}${C.reset}`);
      console.log(`  ${' '.repeat(22)}   ${C.dim}${reason.source}${C.reset}`);
    }
  }
  printWarnings([...new Set(rows.flatMap((r) => r.warnings))]);
}

function cmdPlazo(args: Args): void {
  const [, desde, dias] = args.positional;
  if (!desde || !dias) throw new Error('Uso: habil plazo <desde> <días>');
  const amount = Number(dias.replace(/^\+/, ''));
  const r = deadline({
    from: desde,
    amount,
    unit: args.unit,
    calendar: args.calendar,
    tramite: args.tramite,
  });
  if (args.json) return void console.log(JSON.stringify(r, null, 2));

  console.log(
    `\n  ${C.dim}Inicio${C.reset}      ${r.from}` +
      `\n  ${C.dim}Plazo${C.reset}       ${r.amount} días ${r.unit}` +
      `\n  ${C.dim}Calendario${C.reset}  ${r.calendarId}` +
      `\n  ${C.dim}Corre desde${C.reset} ${r.countingStartsOn}` +
      `\n\n  ${C.bold}Vence el ${r.date}${C.reset}  ${C.dim}(${r.calendarDays} días naturales después)${C.reset}`,
  );
  if (r.rolledForwardFrom) {
    // La prórroga puede venir de un día inhábil o de una regla por día de la
    // semana (art. 12, último párrafo), donde el día era perfectamente hábil.
    const motivo = r.extendedBy
      ? `${r.extendedBy.label}\n              ${r.extendedBy.source}`
      : 'que cayó en día inhábil';
    console.log(`  ${C.dim}Prorrogado desde ${r.rolledForwardFrom}: ${motivo}${C.reset}`);
  }
  if (r.skipped.length > 0) {
    console.log(`\n  ${C.dim}Días no contados:${C.reset}`);
    for (const s of r.skipped) {
      console.log(`    ${s.date}  ${C.dim}${s.reasons.map((x) => x.label).join('; ')}${C.reset}`);
    }
  }
  printWarnings(r.warnings);
}

function cmdEntre(args: Args): void {
  const [, desde, hasta] = args.positional;
  if (!desde || !hasta) throw new Error('Uso: habil entre <desde> <hasta>');
  const n = businessDaysBetween(desde, hasta, {
    calendar: args.calendar,
    tramite: args.tramite,
  });
  if (args.json) {
    return void console.log(JSON.stringify({ desde, hasta, calendario: args.calendar, diasHabiles: n }));
  }
  console.log(`\n  ${C.bold}${n}${C.reset} días hábiles entre ${desde} y ${hasta} ${C.dim}(${args.calendar})${C.reset}`);
  console.log(`  ${C.dim}Excluye el día inicial, incluye el final.${C.reset}`);
}

function cmdAno(args: Args): void {
  const year = Number(args.positional[1]);
  if (!Number.isInteger(year)) throw new Error('Uso: habil año <año>');
  const dias = nonBusinessDaysOfYear(year, {
    calendar: args.calendar,
    tramite: args.tramite,
  });
  if (args.json) return void console.log(JSON.stringify(dias, null, 2));

  // Los fines de semana son ruido; interesan los festivos.
  const festivos = dias.filter((d) => !d.reasons.every((r) => r.ruleId.includes('fin-de-semana')));
  console.log(`\n  ${C.bold}Días inhábiles ${year}${C.reset} ${C.dim}(${args.calendar})${C.reset}`);
  console.log(`  ${C.dim}${dias.length} en total, ${festivos.length} sin contar fines de semana${C.reset}\n`);
  for (const d of festivos) {
    console.log(`  ${d.date}  ${d.reasons.map((r) => r.label).join('; ')}`);
  }
}

function cmdCalendarios(args: Args): void {
  const cals = listCalendars();
  if (args.json) return void console.log(JSON.stringify(cals, null, 2));
  console.log('');
  for (const c of cals) {
    console.log(`  ${C.bold}${c.id}${C.reset} — ${c.name}`);
    console.log(`  ${C.dim}${c.description}${C.reset}`);
    console.log(`  ${C.dim}Fuente: ${c.source}${C.reset}`);
    if (c.tramites?.length) {
      console.log(`  ${C.dim}Trámites: ${c.tramites.map((t) => t.id).join(', ')}${C.reset}`);
    }
    if (c.annualDataYears) {
      const years = c.annualDataYears.length === 0 ? 'ninguno' : c.annualDataYears.join(', ');
      console.log(`  ${C.dim}Datos anuales cargados: ${years}${C.reset}`);
    }
    console.log('');
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    console.log(USAGE);
    return;
  }
  const args = parseArgs(argv);
  const cmd = args.positional[0];
  switch (cmd) {
    case 'dia':
    case 'día':
      return cmdDia(args);
    case 'plazo':
      return cmdPlazo(args);
    case 'entre':
      return cmdEntre(args);
    case 'ano':
    case 'año':
      return cmdAno(args);
    case 'calendarios':
      return cmdCalendarios(args);
    default:
      // Atajo: `habil 2026-11-20` equivale a `habil dia 2026-11-20`.
      if (cmd && /^\d{4}-\d{2}-\d{2}$/.test(cmd)) {
        args.positional.unshift('dia');
        return cmdDia(args);
      }
      throw new Error(`Comando desconocido: ${cmd}. Usa "habil --help".`);
  }
}

try {
  main();
} catch (err) {
  console.error(`\n${C.red}Error:${C.reset} ${(err as Error).message}`);
  process.exitCode = 1;
}
