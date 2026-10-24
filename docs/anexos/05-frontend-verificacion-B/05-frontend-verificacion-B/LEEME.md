# 05-frontend — verificaciones de la Parte B

Mismo entorno que la Parte A: Node.js 24.22.0, Next.js 16.4.1, React 19.3.1, Chromium 141 (Playwright 1.56).
`app/` es la aplicación de prueba de la Parte A con rutas agregadas: `proxy.ts` (cabecera `x-finn-ruta`),
`lib/consultar.ts` (prototipo de `consultar()`, FE-28), `app/error.tsx`, `app/not-found.tsx`, `/fallo`,
`/fallo-normal`, `/protegida`, `/ingresar`, `/cosas/[id]`, `/lento`, `/lento2`, el flujo interceptado lento
de `@superpuesto/(.)lento` y `componentes/enlace-con-estado.tsx` (`useLinkStatus`).

| Verificación | Archivos | Cómo se ejecuta |
|---|---|---|
| V5-15, V5-16, V5-17 | `app/lib/consultar.ts`, `app/proxy.ts`, `app/app/{error,not-found}.tsx`, rutas de prueba, `pruebas/v5_15.py` | `cd app && npm i && npx next build`; después `python3 pruebas/v5_15.py`. Salida: `pruebas/v5_15.salida.txt` |
| V5-18 | `pruebas/cobertura.py`, `pruebas/control_negativo.py` | `python3 pruebas/cobertura.py 05-frontend.md` (código 0 si pasa). Control negativo: `python3 pruebas/control_negativo.py 05-frontend.md negativo.md` y `python3 pruebas/cobertura.py negativo.md` (7 errores). Salida: `pruebas/v5_18.salida.txt` |
| V5-19 | `app/app/lento*`, `app/app/@superpuesto/(.)lento/*`, `app/componentes/enlace-con-estado.tsx`, `pruebas/v5_19.py` | Con la app compilada: `python3 pruebas/v5_19.py` (3 navegaciones por caso). Salida: `pruebas/v5_19.salida.txt` |

Los scripts arrancan `next start` en el puerto 3100; si el puerto está ocupado por otro servidor, los resultados no son válidos.
