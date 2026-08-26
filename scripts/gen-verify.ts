/**
 * Genera VERIFY.md a partir de las reglas reales.
 * Un checklist escrito a mano se desincroniza en cuanto alguien añade una regla.
 *
 *   node scripts/gen-verify.ts > VERIFY.md
 */
import { listCalendars } from '../src/index.ts';

const cals = listCalendars();
const all = cals.flatMap((c) => c.rules);
const pending = all.filter((r) => !r.verified).length;

const out: string[] = [];
out.push('# Verificación de reglas');
out.push('');
out.push('<!-- Generado por scripts/gen-verify.ts — no editar la tabla a mano. -->');
out.push('');
out.push(
  'Cada regla de este repositorio lleva un campo `verified`. Es `true` solo cuando una',
  'persona confirmó la regla contra el **texto vigente** de su fuente y anotó aquí la',
  'fecha de revisión y quién la hizo.',
  '',
  'Mientras una regla siga sin verificar, todo resultado que dependa de ella incluye un',
  '`warning`. Eso es intencional: preferimos que la librería se vea incompleta a que',
  'alguien pierda un plazo confiando en un dato que nadie revisó.',
  '',
  `**Estado actual: ${all.length - pending} de ${all.length} reglas verificadas.**`,
  '',
  '## Cómo verificar una regla',
  '',
  '1. Abre la fuente citada y localiza el texto vigente.',
  '2. Confirma que la regla codificada corresponde exactamente: fechas fijas vs. lunes',
  '   recorridos, inclusión o exclusión de fines de semana, años de vigencia.',
  '3. Si coincide, cambia `verified: false` a `true` en el archivo del calendario.',
  '4. Anota abajo la fecha de revisión, tu nombre y la versión de la norma consultada.',
  '5. Si NO coincide, corrige la regla y añade una prueba en `test/plazos.test.ts` que',
  '   fije el caso.',
  '',
  '> Presta atención especial a las reglas marcadas 🔍: son las que divergen entre',
  '> calendarios o dependen de publicaciones anuales, y por lo tanto las más fáciles',
  '> de codificar mal.',
  '',
);

const RIESGO = /nthWeekday|periodic|dates|ranges/;

for (const cal of cals) {
  out.push(`## \`${cal.id}\` — ${cal.name}`);
  out.push('');
  out.push(`Fuente: ${cal.source}${cal.url ? ` — <${cal.url}>` : ''}`);
  out.push('');
  out.push('| ✔ | Regla | Qué codifica | Verificar que… |');
  out.push('|---|---|---|---|');
  for (const r of cal.rules) {
    const flag = RIESGO.test(r.kind) ? '🔍 ' : '';
    let check: string;
    switch (r.kind) {
      case 'weekday':
        check = 'la fuente efectivamente excluye sábados y domingos';
        break;
      case 'fixed':
        check = `la fuente use la fecha FIJA ${r.day}/${r.month} y no la recorra a un lunes`;
        break;
      case 'nthWeekday':
        check = `la fuente recorra el día al lunes número ${r.n} del mes ${r.month}, y no use fecha fija`;
        break;
      case 'periodic':
        check = `el ciclo de ${r.everyYears} años y el año ancla ${r.anchorYear} sean correctos`;
        break;
      case 'dates':
        check =
          r.dates.length === 0
            ? '**faltan datos** — hay que cargar las fechas publicadas por año'
            : `las ${r.dates.length} fechas correspondan a la publicación oficial`;
        break;
      case 'ranges':
        check =
          r.ranges.length === 0
            ? '**faltan datos** — hay que cargar los periodos publicados por año'
            : `los ${r.ranges.length} periodos correspondan al acuerdo publicado`;
        break;
    }
    out.push(`| ${r.verified ? '✅' : '☐'} | ${flag}\`${r.id}\` | ${r.label} | ${check} |`);
  }
  out.push('');
}

out.push('## Bitácora de verificación');
out.push('');
out.push('| Fecha | Quién | Reglas revisadas | Versión de la norma consultada |');
out.push('|---|---|---|---|');
out.push('| — | — | — | — |');
out.push('');

console.log(out.join('\n'));
