# habil

**Días hábiles y plazos legales en México — con el fundamento de cada día.**

[![npm](https://img.shields.io/npm/v/habil.svg)](https://www.npmjs.com/package/habil)
[![tests](https://img.shields.io/badge/tests-32%20passing-brightgreen)](#pruebas)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Cero dependencias · TypeScript · Node ≥ 20

---

## El problema

El 20 de noviembre de 2026 cae en viernes. ¿Es día hábil?

```
$ npx habil 2026-11-20

  mx-fiscal              hábil
  mx-laboral             hábil
  mx-judicial-federal    inhábil
                         └ 20 de noviembre
                           Ley Orgánica del Poder Judicial de la Federación, artículo 229
```

Y el lunes anterior, que no conmemora nada en particular, es exactamente al revés:

```
$ npx habil 2026-11-16

  mx-fiscal              inhábil
                         └ Tercer lunes de noviembre, en conmemoración del 20 de noviembre
                           Código Fiscal de la Federación, artículo 12
  mx-laboral             inhábil
                         └ Tercer lunes de noviembre, en conmemoración del 20 de noviembre
                           Ley Federal del Trabajo, artículo 74
  mx-judicial-federal    hábil
```

Depende de para qué preguntes. El CFF y la LFT **recorren** el 20 de noviembre al
tercer lunes; el Poder Judicial de la Federación usa la **fecha fija**. Son días
distintos, y esa diferencia mueve vencimientos reales.

Casos como este es lo que hace `habil`:

| Fecha | Fiscal (CFF) | Laboral (LFT) | Judicial (PJF) |
|---|---|---|---|
| 5 de mayo | **inhábil** | laborable | laborable |
| 20 de noviembre | hábil | laborable | **inhábil** |
| Tercer lunes de noviembre | **inhábil** | **descanso** | hábil |
| 5 de febrero (si no es lunes) | hábil | laborable | **inhábil** |
| 14 de septiembre | hábil | laborable | **inhábil** |
| 1 de octubre de cada 6 años | hábil | **descanso** | hábil |

Las librerías de festivos te dan un calendario plano. `habil` modela **la semántica**:
qué cuenta como hábil, para qué trámite, y bajo qué artículo.

---

## Instalación

```bash
npm install habil
```

O sin instalar nada:

```bash
npx habil plazo 2026-03-13 15
```

---

## Uso

```ts
import { deadline, isBusinessDay, businessDaysBetween } from 'habil';

// ¿Cuándo vence un plazo de 15 días hábiles fiscales?
const r = deadline({
  from: '2026-03-13',
  amount: 15,
  unit: 'habiles',
  calendar: 'mx-fiscal',
});

r.date;              // '2026-04-06'
r.countingStartsOn;  // '2026-03-14'  — el plazo corre desde el día siguiente
r.calendarDays;      // 24
r.skipped;           // los 9 días no contados, cada uno con su fundamento
```

Cada día saltado viene justificado:

```ts
r.skipped[2];
// {
//   date: '2026-03-16',
//   isBusinessDay: false,
//   reasons: [{
//     ruleId: 'mx-fiscal:mar-tercer-lunes',
//     label: 'Tercer lunes de marzo, en conmemoración del 21 de marzo',
//     source: 'Código Fiscal de la Federación, artículo 12',
//     url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf',
//     verified: false
//   }]
// }
```

Ese `reasons` es el punto entero de la librería. Un vencimiento sin fundamento no
sirve en un expediente; con él, cualquiera puede auditar el cálculo.

### Plazos en días naturales

Si el vencimiento cae en día inhábil, se prorroga al siguiente hábil:

```ts
deadline({ from: '2026-12-23', amount: 2, unit: 'naturales', calendar: 'mx-fiscal' });
// date: '2026-12-28'  (2026-12-25 es Navidad, luego sábado y domingo)
// rolledForwardFrom: '2026-12-25'
```

### El resto de la API

```ts
isBusinessDay('2026-11-20', { calendar: 'mx-judicial-federal' });  // false
explainDay('2026-11-16', { calendar: 'mx-fiscal' });           // con fundamento
nextBusinessDay('2026-03-20', { calendar: 'mx-fiscal' });      // '2026-03-23'
previousBusinessDay('2026-03-23', { calendar: 'mx-fiscal' });  // '2026-03-20'
rollForward('2026-03-21', { calendar: 'mx-fiscal' });          // '2026-03-23'
addBusinessDays('2026-03-13', 5, { calendar: 'mx-fiscal' });   // '2026-03-23'
addBusinessDays('2026-03-23', -5, { calendar: 'mx-fiscal' });  // '2026-03-13'

businessDaysBetween('2026-03-13', '2026-03-23', { calendar: 'mx-fiscal' });  // 5
// Por defecto excluye el día inicial e incluye el final, como corre un plazo
// desde su notificación. Configurable con `inclusive`.

nonBusinessDaysOfYear(2026, { calendar: 'mx-fiscal' });  // el año completo
compareCalendars('2026-11-20');                          // los tres calendarios a la vez
```

### Tu propio calendario

Los días de cierre no siempre están en la ley. Tu oficina cerró un puente, o tu
juzgado publicó una suspensión:

```ts
isBusinessDay('2026-03-17', {
  calendar: 'mx-fiscal',
  extraNonBusiness: ['2026-03-17'],  // cierre por acuerdo local
  extraBusiness: ['2026-03-21'],     // guardia de sábado
});
```

`extraBusiness` gana sobre cualquier regla: si dices que tu oficina abrió, el motor
no discute.

### Fechas sin zonas horarias

Todo son cadenas `YYYY-MM-DD`. Un plazo legal se cuenta sobre fechas de calendario,
no sobre instantes: usar `Date` con hora local es la causa número uno de errores de
un día en este dominio. `habil` nunca toca husos horarios, salvo en `today()`, donde
la zona es un parámetro explícito.

---

## CLI

```bash
habil dia 2026-11-20                  # ¿es hábil? en los tres calendarios
habil plazo 2026-03-13 15             # vencimiento con el detalle día por día
habil plazo 2026-12-23 30 -u naturales
habil entre 2026-03-13 2026-03-23     # cuántos días hábiles hay
habil año 2026 -c mx-laboral          # todos los inhábiles del año
habil calendarios                     # qué hay disponible
```

Añade `--json` a cualquier comando para encadenarlo con `jq`.

---

## API HTTP

```bash
npm run api    # http://localhost:8080
```

```
GET /v1/calendars
GET /v1/day?date=2026-11-20&calendar=mx-fiscal
GET /v1/compare?date=2026-11-20
GET /v1/add?date=2026-03-13&days=5&calendar=mx-fiscal
GET /v1/between?from=2026-03-13&to=2026-03-23&calendar=mx-fiscal
GET /v1/deadline?from=2026-03-13&days=15&unit=habiles&calendar=mx-fiscal
GET /v1/year?year=2026&calendar=mx-fiscal
```

Sin dependencias, sin base de datos, sin estado. Un solo archivo (`src/server.ts`)
que corre en cualquier VPS o plataforma.

---

## Calendarios

| id | Qué modela | Fuente |
|---|---|---|
| `mx-fiscal` | Plazos ante autoridades fiscales federales | CFF art. 12 |
| `mx-laboral` | Días de descanso obligatorio | LFT art. 74 |
| `mx-judicial-federal` | Plazos ante órganos del PJF | LOPJF art. 229 y acuerdos del CJF |

`mx-laboral` **no** excluye sábados y domingos: el descanso semanal es el artículo 69
y depende de la jornada de cada centro de trabajo. Si tu caso los excluye, agrégalos
con `extraNonBusiness`.

---

## ⚠️ Estado: v0.1.0 — reglas sin verificar

**Ninguna regla ha sido confirmada contra el texto vigente de su fuente todavía.**

Las reglas están codificadas de buena fe con su cita legal, pero cada una lleva
`verified: false` y todo resultado que dependa de ellas incluye un `warnings`:

```ts
r.warnings;
// ['Regla sin verificar contra fuente primaria: mx-fiscal:12-25 (Código Fiscal...)']
```

Faltan además datos que se publican cada año y que **no se inventaron a propósito**:
vacaciones generales del SAT, periodos vacacionales y suspensiones de labores del PJF,
y jornadas electorales.

Verificar las 32 reglas es un par de horas de trabajo con los textos a la mano.
El checklist está en [VERIFY.md](VERIFY.md) y es la mejor primera contribución
al proyecto.

**No uses esto para calcular un plazo real hasta que la regla que te importa esté
verificada.** Es software MIT sin garantía y no sustituye asesoría legal ni fiscal.

---

## Pruebas

```bash
npm test        # 32 pruebas, sin dependencias
npm run build   # compila a dist/
```

Las pruebas incluyen los casos de divergencia entre calendarios, aritmética a través
de años bisiestos y cambios de horario, y los extremos de conteo de plazos.

---

## Hoja de ruta

- [ ] Verificar las reglas existentes contra fuente primaria
- [ ] Cargar vacaciones del SAT y acuerdos del CJF por año
- [ ] Calendarios estatales (juzgados locales)
- [ ] Plazos con nombre: `deadline({ tipo: 'recurso-de-revocacion' })`
- [ ] Argentina y Colombia

¿Te falta un calendario o encontraste una regla mal codificada? Abre un issue —
especialmente si traes la cita de la fuente.

## Licencia

MIT
