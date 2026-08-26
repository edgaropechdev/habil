# Contribuir

## La contribución más valiosa: verificar una regla

Ninguna regla del repositorio ha sido confirmada contra el texto vigente de su
fuente. Verificar una sola ya mejora el proyecto para todos.

1. Elige una fila sin marcar en [VERIFY.md](VERIFY.md).
2. Abre la fuente citada y compara.
3. Cambia `verified: false` a `true` en el archivo del calendario, o corrige la regla.
4. Regenera el checklist: `node scripts/gen-verify.ts > VERIFY.md`.
5. Anota la revisión en la bitácora al final de VERIFY.md.

Si corriges una regla, **añade una prueba** en `test/plazos.test.ts` con una fecha
concreta. Así el error no vuelve.

## Aportar datos anuales

Faltan las vacaciones generales del SAT, los periodos vacacionales y suspensiones
del PJF, y las jornadas electorales. Se cargan en las reglas `dates` y `ranges` de
cada calendario. **Incluye siempre el enlace a la publicación oficial en el PR** —
sin fuente no se acepta el dato.

## Añadir un calendario

Un archivo nuevo en `src/calendars/`, exportado desde `src/calendars/index.ts`.
Cada regla necesita `id`, `label`, `source` y `verified: false`. El campo
`description` del calendario debe decir explícitamente **para qué NO sirve**.

## Reglas de la casa

- **Cero dependencias en producción.** Es una librería de fechas; no necesita nada.
- **Nada de husos horarios en el núcleo.** Fechas civiles `YYYY-MM-DD` y aritmética
  en días enteros.
- **Ningún dato sin fuente.** Es preferible una regla vacía a una inventada.
- Las pruebas usan fechas reales y verificables a mano, no fechas generadas.

## Desarrollo

```bash
npm install
npm test          # node --test, sin runner externo
npm run typecheck
npm run build
npm run api       # levanta la API en :8080
```
