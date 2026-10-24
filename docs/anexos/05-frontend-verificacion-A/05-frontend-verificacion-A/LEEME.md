# 05-frontend — verificaciones de la Parte A

Entorno: Node.js 24.22.0 (ICU 78.3), Next.js 16.4.1, React 19.3.1, Chromium 141 (Playwright 1.56, Python),
esbuild 0.25, ESLint 9.39.5 + typescript-eslint 8.71.2, React Hook Form 7.90.0, @hookform/resolvers 5.9.1, Zod 4.6.7.

La aplicación de `app/` no tiene base de datos: `lib/estado.ts` simula en memoria las respuestas de 04
(ResultadoAccion, huella, idempotencia por id, conflictos). Verifica el comportamiento de la interfaz y de Next.

| Verificación | Archivos | Cómo se ejecuta |
|---|---|---|
| V5-01, V5-02 | `proto/centavos.ts`, `proto/entrada-monto.ts`, `proto/formato.ts`, `proto/v5-01-02.test.ts` | `node proto/v5-01-02.test.ts` (Node 24); en Chromium: empaquetar el test con esbuild (`--bundle --format=iife`) y `python3 proto/v5_chromium.py <bundle>`. Salidas: `proto/v5-01-02.salida-*.txt` |
| V5-03 a V5-09 | `app/` (aplicación Next mínima), `pruebas/v5_03.py` | `cd app && npm i && npx next build`, después `python3 pruebas/v5_03.py` (arranca `next start` en el puerto 3100). Salida: `pruebas/v5_03.salida.txt`. V5-09 recompila la app con la acción renombrada y restaura los archivos al terminar |
| V5-10 | `proto/reloj.ts`, `proto/v5-10.test.ts` | `TZ=<zona> node proto/v5-10.test.ts`. Salida: `proto/v5-10.salida.txt` |
| V5-11 | `pruebas/v5_11.py` | Con la app compilada: `python3 pruebas/v5_11.py`. Salida: `pruebas/v5_11.salida.txt` |
| V5-12 | `lint/eslint.config.mjs`, `lint/apps/**` | `npx eslint 'apps/**/*.tsx'` dentro de `lint/`. Salida: `lint/v5-12.salida.txt` (2 errores esperados) |
| V5-13 | `medicion/*.ts` | `npx esbuild medicion/<f>.ts --bundle --minify --format=esm` (rhf con `--external:react --external:zod`) y `gzip -9c <salida> \| wc -c` |
| V5-14 | — | Documentación de Vercel, https://vercel.com/docs/skew-protection (actualizada el 16/09/2026) |
