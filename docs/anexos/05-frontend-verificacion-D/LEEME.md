# 05-frontend — verificación de la Parte D y de los cambios [R3]

Entorno: Node 24.22, Next.js 16.4.1 (Turbopack, `next build` + `next start`), React 19.3.1, `@serwist/turbopack` y `serwist` 9.5.13,
esbuild 0.25, Playwright con Chromium 141 (`channel: 'chromium'` para las notificaciones). La app de prueba no tiene base de datos.

| Verificación | Archivo | Salida |
|---|---|---|
| V5-18 (cobertura del mapa sobre el documento completo) | pruebas/cobertura.py, pruebas/control_negativo.py | pruebas/v5_18.salida.txt |
| V5-23 [R3] contraste con los tokens de gráficos y marca | prototipos/tokens.py (`python3 tokens.py tokens.css`) | prototipos/tokens.salida.txt |
| V5-29 a V5-33 service worker, sin conexión, instalabilidad, push y actualización | pruebas/v5_29.py (compila dos versiones) | pruebas/v5_29.salida.txt |
| V5-30c enlace sin conexión | pruebas/v5_30c.py | pruebas/v5_30c.salida.txt |
| V5-34 peso del registro del service worker | pruebas/v5_34.py | pruebas/v5_34.salida.txt |
| V5-35 [R3] separación compartido / biblioteca de formularios / propio (PC-1) | pruebas/v5_35.py | pruebas/v5_35.salida.txt |
| V5-36 trazabilidad generada y su control negativo | pruebas/trazabilidad.py, pruebas/control_negativo_15.py | pruebas/v5_36.salida.txt |

Archivos del service worker en la app de prueba: `sw/sw.ts`, `app/serwist/[path]/route.ts`, `cliente/registro-sw.tsx`,
`componentes/navegacion/destinos.ts`, `componentes/enlace-finn.tsx`, `app/manifest.ts`, `app/sin-conexion/page.tsx`.
Son prototipos para verificar, no la implementación de la Fase 8. Los íconos de `public/marca/` son cuadrados provisionales.
Los scripts usan rutas absolutas del contenedor de trabajo (`/home/claude/v5/...`); hay que ajustarlas para otra máquina.

## Cierre de la fase

`cierre/aplicar_cp.py` aplica CP-1 a CP-18 a `04-backend.md` (marca [F5]); cada reemplazo comprueba que su texto de origen aparezca exactamente una vez.
