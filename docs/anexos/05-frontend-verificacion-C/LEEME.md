# 05-frontend — verificación de la Parte C

Entorno: Node 24.22, Next.js 16.4.1 (Turbopack, `next build` + `next start`), React 19.3.1, Tailwind CSS 4.3.3,
axe-core 4.14.0, Playwright con Chromium 141, Lighthouse 12.8.2. La app de prueba no tiene base de datos.

| Verificación | Archivo | Salida |
|---|---|---|
| V5-18 (cobertura del mapa, repetida sobre el documento completo) | pruebas/cobertura.py, pruebas/control_negativo.py | pruebas/v5_18.salida.txt |
| V5-20 JS por ruta | pruebas/v5_parte_c.py (primer bloque) | pruebas/v5_parte_c.salida.txt |
| V5-21 D-8 con hidratación | pruebas/v5_parte_c.py | ídem |
| V5-21b clic antes de hidratar | pruebas/v5_21b.py | pruebas/v5_21b.salida.txt |
| V5-22 caché del enrutador | pruebas/v5_parte_c.py | pruebas/v5_parte_c.salida.txt |
| V5-23 contraste de tokens | prototipos/tokens.py (`python3 tokens.py tokens.css`; genera tokens.css y tokens.json) | prototipos/tokens.salida.txt |
| V5-24 axe-core y control negativo | pruebas/v5_parte_c.py, pruebas/v5_24_control.py | *.salida.txt |
| V5-25 árbol de accesibilidad | pruebas/v5_parte_c.py | pruebas/v5_parte_c.salida.txt |
| V5-26 Lighthouse | pruebas/v5_26.sh | pruebas/v5_26.salida.txt |
| V5-27 INP de laboratorio y movimiento reducido | pruebas/v5_27.py | pruebas/v5_27.salida.txt |
| V5-28 foco y anunciador de rutas | pruebas/v5_28.py | pruebas/v5_28.salida.txt |

App de prueba: `app-prueba-c/` (`npm install` y `npx next build`). Los scripts usan rutas absolutas del contenedor de trabajo
(`/home/claude/v5/...`); hay que ajustarlas para correrlos en otra máquina. Los componentes de `app-prueba-c/componentes/`
son prototipos para medir, no la implementación de la Fase 8.
