# Verificación de reglas

<!-- Generado por scripts/gen-verify.ts — no editar la tabla a mano. -->

Cada regla de este repositorio lleva un campo `verified`. Es `true` solo cuando una
persona confirmó la regla contra el **texto vigente** de su fuente y anotó aquí la
fecha de revisión y quién la hizo.

Mientras una regla siga sin verificar, todo resultado que dependa de ella incluye un
`warning`. Eso es intencional: preferimos que la librería se vea incompleta a que
alguien pierda un plazo confiando en un dato que nadie revisó.

**Estado actual: 0 de 32 reglas verificadas.**

## Cómo verificar una regla

1. Abre la fuente citada y localiza el texto vigente.
2. Confirma que la regla codificada corresponde exactamente: fechas fijas vs. lunes
   recorridos, inclusión o exclusión de fines de semana, años de vigencia.
3. Si coincide, cambia `verified: false` a `true` en el archivo del calendario.
4. Anota abajo la fecha de revisión, tu nombre y la versión de la norma consultada.
5. Si NO coincide, corrige la regla y añade una prueba en `test/plazos.test.ts` que
   fije el caso.

> Presta atención especial a las reglas marcadas 🔍: son las que divergen entre
> calendarios o dependen de publicaciones anuales, y por lo tanto las más fáciles
> de codificar mal.

## `mx-fiscal` — México — plazos fiscales federales

Fuente: Código Fiscal de la Federación, artículo 12 — <https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf>

| ✔ | Regla | Qué codifica | Verificar que… |
|---|---|---|---|
| ☐ | `mx-fiscal:fin-de-semana` | Sábado o domingo | la fuente efectivamente excluye sábados y domingos |
| ☐ | `mx-fiscal:01-01` | 1 de enero | la fuente use la fecha FIJA 1/1 y no la recorra a un lunes |
| ☐ | 🔍 `mx-fiscal:feb-primer-lunes` | Primer lunes de febrero, en conmemoración del 5 de febrero | la fuente recorra el día al lunes número 1 del mes 2, y no use fecha fija |
| ☐ | 🔍 `mx-fiscal:mar-tercer-lunes` | Tercer lunes de marzo, en conmemoración del 21 de marzo | la fuente recorra el día al lunes número 3 del mes 3, y no use fecha fija |
| ☐ | `mx-fiscal:05-01` | 1 de mayo | la fuente use la fecha FIJA 1/5 y no la recorra a un lunes |
| ☐ | `mx-fiscal:05-05` | 5 de mayo (inhábil fiscal, no es descanso obligatorio bajo la LFT) | la fuente use la fecha FIJA 5/5 y no la recorra a un lunes |
| ☐ | `mx-fiscal:09-16` | 16 de septiembre | la fuente use la fecha FIJA 16/9 y no la recorra a un lunes |
| ☐ | 🔍 `mx-fiscal:nov-tercer-lunes` | Tercer lunes de noviembre, en conmemoración del 20 de noviembre | la fuente recorra el día al lunes número 3 del mes 11, y no use fecha fija |
| ☐ | 🔍 `mx-fiscal:12-01-sexenal` | 1 de diciembre de cada 6 años, por transmisión del Poder Ejecutivo Federal | el ciclo de 6 años y el año ancla 2018 sean correctos |
| ☐ | `mx-fiscal:12-25` | 25 de diciembre | la fuente use la fecha FIJA 25/12 y no la recorra a un lunes |
| ☐ | 🔍 `mx-fiscal:vacaciones-generales-sat` | Vacaciones generales de las autoridades fiscales federales | **faltan datos** — hay que cargar las fechas publicadas por año |

## `mx-laboral` — México — días de descanso obligatorio (LFT)

Fuente: Ley Federal del Trabajo, artículo 74 — <https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf>

| ✔ | Regla | Qué codifica | Verificar que… |
|---|---|---|---|
| ☐ | `mx-laboral:01-01` | 1 de enero | la fuente use la fecha FIJA 1/1 y no la recorra a un lunes |
| ☐ | 🔍 `mx-laboral:feb-primer-lunes` | Primer lunes de febrero, en conmemoración del 5 de febrero | la fuente recorra el día al lunes número 1 del mes 2, y no use fecha fija |
| ☐ | 🔍 `mx-laboral:mar-tercer-lunes` | Tercer lunes de marzo, en conmemoración del 21 de marzo | la fuente recorra el día al lunes número 3 del mes 3, y no use fecha fija |
| ☐ | `mx-laboral:05-01` | 1 de mayo | la fuente use la fecha FIJA 1/5 y no la recorra a un lunes |
| ☐ | `mx-laboral:09-16` | 16 de septiembre | la fuente use la fecha FIJA 16/9 y no la recorra a un lunes |
| ☐ | 🔍 `mx-laboral:nov-tercer-lunes` | Tercer lunes de noviembre, en conmemoración del 20 de noviembre | la fuente recorra el día al lunes número 3 del mes 11, y no use fecha fija |
| ☐ | 🔍 `mx-laboral:12-01-sexenal` | 1 de diciembre de cada 6 años, por transmisión del Poder Ejecutivo Federal | el ciclo de 6 años y el año ancla 2018 sean correctos |
| ☐ | 🔍 `mx-laboral:10-01-sexenal` | 1 de octubre de cada 6 años, por transmisión del Poder Ejecutivo Federal | el ciclo de 6 años y el año ancla 2024 sean correctos |
| ☐ | `mx-laboral:12-25` | 25 de diciembre | la fuente use la fecha FIJA 25/12 y no la recorra a un lunes |
| ☐ | 🔍 `mx-laboral:jornada-electoral` | Jornada electoral ordinaria (federal o local) | **faltan datos** — hay que cargar las fechas publicadas por año |

## `mx-judicial-federal` — México — días inhábiles del Poder Judicial de la Federación

Fuente: Ley Orgánica del Poder Judicial de la Federación, artículo 229 — <https://www.diputados.gob.mx/LeyesBiblio/pdf/LOPJF.pdf>

| ✔ | Regla | Qué codifica | Verificar que… |
|---|---|---|---|
| ☐ | `mx-judicial:fin-de-semana` | Sábado o domingo | la fuente efectivamente excluye sábados y domingos |
| ☐ | `mx-judicial:01-01` | 1 de enero | la fuente use la fecha FIJA 1/1 y no la recorra a un lunes |
| ☐ | `mx-judicial:02-05` | 5 de febrero (fecha fija; la LFT lo recorre al primer lunes) | la fuente use la fecha FIJA 5/2 y no la recorra a un lunes |
| ☐ | `mx-judicial:03-21` | 21 de marzo (fecha fija; la LFT lo recorre al tercer lunes) | la fuente use la fecha FIJA 21/3 y no la recorra a un lunes |
| ☐ | `mx-judicial:05-01` | 1 de mayo | la fuente use la fecha FIJA 1/5 y no la recorra a un lunes |
| ☐ | `mx-judicial:09-14` | 14 de septiembre | la fuente use la fecha FIJA 14/9 y no la recorra a un lunes |
| ☐ | `mx-judicial:09-16` | 16 de septiembre | la fuente use la fecha FIJA 16/9 y no la recorra a un lunes |
| ☐ | `mx-judicial:11-20` | 20 de noviembre | la fuente use la fecha FIJA 20/11 y no la recorra a un lunes |
| ☐ | `mx-judicial:12-25` | 25 de diciembre (no listado en el art. 229; cae en el periodo vacacional del CJF) | la fuente use la fecha FIJA 25/12 y no la recorra a un lunes |
| ☐ | 🔍 `mx-judicial:vacaciones` | Periodos vacacionales del PJF | **faltan datos** — hay que cargar los periodos publicados por año |
| ☐ | 🔍 `mx-judicial:suspension-labores` | Días de suspensión de labores por acuerdo | **faltan datos** — hay que cargar las fechas publicadas por año |

## Bitácora de verificación

| Fecha | Quién | Reglas revisadas | Versión de la norma consultada |
|---|---|---|---|
| — | — | — | — |

