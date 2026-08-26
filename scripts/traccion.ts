/**
 * Tablero de tracción.
 *
 *   node scripts/traccion.ts [usuario/repo]
 *   GITHUB_TOKEN=ghp_... node scripts/traccion.ts usuario/habil
 *
 * Responde la única pregunta que importa en las primeras semanas:
 * ¿alguien está usando esto, y por qué canal llegó?
 *
 * Sin token muestra descargas de npm y estrellas. Con un token que tenga acceso
 * al repo, añade visitas y clones — que son la señal temprana real, porque el
 * tráfico aparece semanas antes que las estrellas.
 */

const PKG = 'habil';
const REPO = process.argv[2] ?? process.env.GITHUB_REPO ?? '';
const TOKEN = process.env.GITHUB_TOKEN;

const C = process.stdout.isTTY
  ? { dim: '\x1b[2m', bold: '\x1b[1m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' }
  : { dim: '', bold: '', green: '', yellow: '', reset: '' };

async function json(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, { headers: { 'user-agent': 'habil-traccion', ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

function sparkline(values: number[]): string {
  const chars = '▁▂▃▄▅▆▇█';
  const max = Math.max(...values, 1);
  return values.map((v) => chars[Math.min(7, Math.floor((v / max) * 7))]).join('');
}

function row(label: string, value: string | number, note = ''): void {
  console.log(`  ${C.dim}${label.padEnd(24)}${C.reset}${C.bold}${value}${C.reset} ${C.dim}${note}${C.reset}`);
}

async function npmStats(): Promise<void> {
  console.log(`\n${C.bold}npm${C.reset} ${C.dim}— ${PKG}${C.reset}\n`);
  try {
    const week = await json(`https://api.npmjs.org/downloads/point/last-week/${PKG}`);
    const month = await json(`https://api.npmjs.org/downloads/point/last-month/${PKG}`);
    const range = await json(`https://api.npmjs.org/downloads/range/last-month/${PKG}`);
    const daily: number[] = range.downloads.map((d: any) => d.downloads);

    row('Descargas 7 días', week.downloads);
    row('Descargas 30 días', month.downloads);
    row('Últimos 30 días', sparkline(daily.slice(-30)));

    const first = daily.slice(0, 15).reduce((a, b) => a + b, 0);
    const second = daily.slice(-15).reduce((a, b) => a + b, 0);
    if (first > 0) {
      const pct = Math.round(((second - first) / first) * 100);
      row('Tendencia quincenal', `${pct >= 0 ? '+' : ''}${pct}%`, pct >= 0 ? '↑' : '↓');
    }
  } catch (err) {
    console.log(`  ${C.yellow}Sin datos todavía${C.reset} ${C.dim}(${(err as Error).message})${C.reset}`);
    console.log(`  ${C.dim}npm tarda ~24h en reportar tras la primera publicación.${C.reset}`);
  }
}

async function githubStats(): Promise<void> {
  if (!REPO) {
    console.log(`\n${C.dim}Pasa usuario/repo para ver métricas de GitHub.${C.reset}`);
    return;
  }
  const headers = TOKEN ? { authorization: `Bearer ${TOKEN}` } : {};
  console.log(`\n${C.bold}GitHub${C.reset} ${C.dim}— ${REPO}${C.reset}\n`);

  try {
    const repo = await json(`https://api.github.com/repos/${REPO}`, headers);
    row('Estrellas', repo.stargazers_count);
    row('Forks', repo.forks_count);
    row('Issues abiertos', repo.open_issues_count);
  } catch (err) {
    console.log(`  ${C.yellow}${(err as Error).message}${C.reset}`);
    return;
  }

  if (!TOKEN) {
    console.log(
      `\n  ${C.yellow}Sin GITHUB_TOKEN no hay visitas ni clones.${C.reset}` +
        `\n  ${C.dim}Son la señal más temprana: el tráfico sube semanas antes que las estrellas.${C.reset}`,
    );
    return;
  }

  for (const [label, path] of [
    ['Visitas 14 días', 'views'],
    ['Clones 14 días', 'clones'],
  ] as const) {
    try {
      const data = await json(`https://api.github.com/repos/${REPO}/traffic/${path}`, headers);
      const serie: number[] = (data[path] ?? []).map((d: any) => d.count);
      row(label, `${data.count} (${data.uniques} únicos)`, sparkline(serie));
    } catch (err) {
      console.log(`  ${C.yellow}${label}: ${(err as Error).message}${C.reset}`);
    }
  }

  try {
    const refs = await json(`https://api.github.com/repos/${REPO}/traffic/popular/referrers`, headers);
    if (refs.length > 0) {
      console.log(`\n  ${C.dim}De dónde llega la gente:${C.reset}`);
      for (const r of refs.slice(0, 8)) {
        console.log(`    ${String(r.count).padStart(5)}  ${r.referrer} ${C.dim}(${r.uniques} únicos)${C.reset}`);
      }
    }
  } catch {
    // Sin permisos suficientes; no es crítico.
  }
}

console.log(`${C.bold}Tracción de habil${C.reset}`);
await npmStats();
await githubStats();
console.log(
  `\n${C.dim}Umbral de decisión: si a las 8 semanas hay <50 descargas semanales` +
    `\ny <5 visitantes únicos al día, el canal no está funcionando — cambia el` +
    `\ncanal antes de cambiar el producto.${C.reset}\n`,
);
