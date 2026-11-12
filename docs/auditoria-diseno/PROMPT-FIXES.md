# Prompt para los agentes de desarrollo · aplicar la auditoría de diseño de la app real

> Pegá lo que sigue al orquestador de Finn (o a cada agente de tarea), junto con la carpeta `docs/auditoria-diseno/`.

---

Una auditoría visual de la **app real** (la que corre, no la demo) comparó cada pantalla y cada estado contra el diseño aprobado. El resultado está en `docs/auditoria-diseno/AUDITORIA-APP.md`: un hallazgo por diferencia, con id, severidad, **Se ve** (captura y medida), **Debería** (referencia exacta), **Arreglo** (componentes, tokens y archivos) y **Cómo verificar**. Tu trabajo es aplicarlos todos, en el orden de este prompt.

## Reglas

- El diseño manda en este orden: `docs/diseno/01-especificacion/DECISIONES.md` (más la sección "Entrega 3" de `docs/diseno/entrega-3/DECISIONES.md`) > `tokens.css` > PNG/HTML de referencia > `PANTALLAS.md` > demo. `docs/diseno/05-auditoria-previa/` no es fuente.
- **Solo tokens.** Ningún color, medida, radio, sombra, duración ni curva suelta. Si falta un valor, se propone en `tokens-propuesta.css` del paquete de diseño y no se inventa.
- **La interfaz no calcula montos** (PF-3): los impactos y montos vienen del motor.
- Las reglas de `CLAUDE.md` siguen valiendo (tamaño por PR, pruebas primero, sin `eslint-disable` de frontera, etc.). Si un bloque no entra en el tamaño de un PR, partilo por pantalla.
- **Contradicciones:** algunos hallazgos dependen de una decisión de diseño todavía abierta (lista abajo). No los resuelvas en el código: dejalos `bloqueada` con motivo «contradicción» y seguí con el resto.
- **Cada PR lleva, por cada id que cierra, «antes» y «después»:** la captura de la auditoría (`docs/auditoria-diseno/capturas/<id>__<variante>.png`) y la nueva, en las mismas variantes (`telefono-claro`, `telefono-oscuro`, `computadora-claro`), más el resultado del criterio «Cómo verificar». Un id sin antes y después no cuenta como cerrado.
- **Para sacar el «después»** usá el arnés de la auditoría: `tools/auditoria/README.md`. `node tools/auditoria/servir.mjs` (en segundo plano: toma el candado de la E2E) y `node tools/auditoria/correr.mjs casos/<archivo> -g "<id>"`; `node tools/auditoria/analizar.mjs <id>` vuelve a medir contra la referencia. Los casos ya existen para cada id de captura del inventario.

## Bloqueados hasta que diseño decida (`docs/auditoria-diseno/PROMPT-DISENO.md`, prioridad 1)

| Decisión | Hallazgos que esperan |
|---|---|
| D-1 ancho de flujos en computadora (720 o 1144) | BAN-01, REG-16, CAT-32 |
| D-2 marco entre 768 y 1024 | GLO-05 |
| D-3 «Asignar $X» de Inicio abre hoja o va a Presupuesto | INI-02, PRE-08 |
| D-4 monto en las filas de sobregiro | INI-05 |
| D-5 asignar en período cerrado | PRE-37 |
| D-6 mover más que el Disponible | PRE-41 |
| D-7 primer uso sin cuentas | INI-16 |
| D-8 ancho de la columna de filtros de Actividad | ACT-07 |
| D-9 «Devolver a» o «Vuelve a» | ACT-29 |
| D-10 tokens de movimiento propuestos | GLO-09, GLO-11, parte de GLO-20 |
| Pantallas sin diseño (`SIN-DISENO.md`) | no se tocan hasta tener referencia, salvo para cumplir tokens y marco |

## Bloque 1 · Global: tokens, fuentes, marco, componentes compartidos y movimiento

Primero, porque arreglan muchas pantallas a la vez y cambian lo que miden los bloques siguientes. Orden sugerido:

1. **Tokens.** GLO-09 (incorporar los aprobados de la entrega 2, mapear los propios), GLO-10, GLO-11, GLO-12. Archivos: `apps/web/src/app/tokens.css`, `tokens.json`, `apps/web/tailwind.css` (generado), `apps/web/src/app/globals.css`.
2. **Marco.** GLO-22 («Registrar» solo «+»), GLO-24 (barra según el tipo de pantalla; subpáginas de Ajustes como hijas), GLO-25 (título de la hija en la barra), GLO-29 (20 px), GLO-30 (tablas que desbordan), GLO-06, GLO-109 y GLO-110 (aviso sin conexión que tapa), REP-01 (Reportes marca Presupuesto), ACC-06 (acceso en tarjeta centrada en computadora). Archivos: `apps/web/src/componentes/marco/*`, `apps/web/src/componentes/navegacion/*`.
3. **Componentes compartidos.** GLO-20 (6 casillas), GLO-23 (flujos cortos en hoja/panel), GLO-26 (botón tonal en vez de enlace), GLO-27 (resultado en el lugar), GLO-28 (textos AV-xx y forma K4 del paso de confirmar; sin impacto en vivo, 05 §4.4 y P6-27), GLO-31 (botón de peligro), GLO-32 (esqueletos), GLO-33 (pastillas, segmentados, selects, interruptores), GLO-34 (monto en el botón), ACT-17 (glifo de «Pendiente»), MAS-112 («undefined/undefined/» en fechas), errores de formulario con `role="alert"` (MAS-012, CAT-26), glifo de vacío (CAT-14). Archivos: `apps/web/src/componentes/base/*`, `componentes/formularios/*`, `componentes/dominio/*`.
4. **Entrega 3 · Salir a la vista.** GLO-21 completo, siguiendo `docs/diseno/entrega-3/PROMPT-DESARROLLO.md`, con GLO-107 (ícono `gear` de 8 dientes y `sun` en Apariencia).
5. **Accesibilidad global.** GLO-07 y GLO-08 (foco con `--foco`), tocables < 44 que señala cada sección.
6. **Movimiento.** GLO-01 (dirección de las transiciones de §11), GLO-02 (Registrar sube desde abajo), GLO-03 (tiempos del panel de notificaciones), GLO-04 (filas de la Bandeja escalonadas). Todo detrás de `prefers-reduced-motion` (hoy se respeta: no lo rompas). Verificá con `node tools/auditoria/correr.mjs casos/90-movimiento --project=video --project=video-computadora` y `node tools/auditoria/resumir-movimiento.mjs`.

Al cerrar el bloque 1, recapturá todas las secciones (`node tools/auditoria/correr.mjs casos/`) y volvé a correr el analizador: muchos hallazgos de sección marcados «→ GLO-nn» deben quedar resueltos. Marcalos así en el PR, con su antes y después.

## Bloque 2 · Críticas y altas, por sección

En este orden (el de uso diario). Cada id está en `AUDITORIA-APP.md` con su arreglo y su archivo:

1. **Acceso** (ACC): el resto de altas después de GLO-20 — ACC-15 (cierre de inscripción con aviso positivo y botón principal).
2. **Bandeja y Revisar** (BAN): BAN-25 (crítica: devolución que desborda), BAN-01 (bloqueado por D-1), BAN-15, BAN-23, BAN-24, BAN-28 (confirmar primero si es la semilla del caso).
3. **Registrar** (REG): REG-01 (selector en cuadrícula de 8 tarjetas con ícono), REG-02, REG-11.
4. **Inicio** (INI): INI-03, INI-07 (más los bloqueados INI-02 e INI-05).
5. **Presupuesto** (PRE): PRE-30 (Asignar suma un monto, no edita el absoluto), PRE-35, PRE-64, PRE-73, PRE-75 (más los bloqueados PRE-37 y PRE-41).
6. **Detalle de categoría** (CAT): CAT-21, CAT-31 (CAT-01 y CAT-32 van por GLO-25 y GLO-24/D-1).
7. **Actividad** (ACT): ACT-28 (crítica: editar con cuenta archivada deja el formulario vacío), ACT-01, ACT-02, ACT-05, ACT-06, ACT-08, ACT-16, ACT-18, ACT-21, ACT-30, ACT-35.
8. **Reportes** (REP): REP-02, REP-16, REP-18, REP-20, REP-22 (REP-09 va por GLO-30).
9. **Cuentas** (CTA): CTA-01 (crítica: editar tarjeta sin límite, tasa, corte ni pago), CTA-02, CTA-03, CTA-05, CTA-06, CTA-07, CTA-09, CTA-26 (CTA-04 va por GLO-23).
10. **Metas, Programadas, Por cobrar, Reglas, Notificaciones** (MAS): MAS-004, MAS-101, MAS-103, MAS-105, MAS-107, MAS-111 (MAS-001, MAS-128, MAS-129b, MAS-134 van por GLO-23/GLO-24; MAS-112 por el bloque 1).
11. **Ajustes** (AJU): AJU-15 (crítica: con un solo factor no hay pantalla «Quitar»), AJU-14 (aviso de advertencia con el botón tonal), AJU-01, AJU-12, AJU-20 (AJU-02 va por GLO-21, AJU-06 por GLO-24, AJU-17 por GLO-20).

## Bloque 3 · Medias y bajas

Todo lo demás de `AUDITORIA-APP.md`, sección por sección en el mismo orden: tipografía por rol, colores, espacios, radios, sombras, textos y detalles. Agrupá por archivo para no tocar el mismo componente en varios PR.

## Cierre

- Volvé a correr todo el arnés y el analizador en las tres variantes y en 360, 768 y 1024 (`casos/91-responsive`), la pasada de foco (`casos/92-foco`) y la de movimiento.
- Actualizá en `AUDITORIA-APP.md` el estado de cada id (cerrado con su PR, bloqueado con su motivo).
- Respondé con: ids cerrados por bloque, ids bloqueados y por qué, y cualquier diferencia nueva que hayas visto al recapturar.

## Corrección del 11/11/2026

No implementes impacto en vivo ni quites los pasos de confirmar. 05 §4.4 (FE-07) define previsualizar y confirmar, y 06 P6-27 a) / CA-21.12 quita «Antes de guardar» de Registrar gasto. REG-10, REG-05, BAN-14, CAT-22, ACT-25 y V-07 están descartados; GLO-28 quedó reducido a los textos AV-xx y la forma del paso de confirmar. Si el paquete de diseño (entrega 4: D-11 y CA-E4-21) pide lo contrario, es una contradicción: detenete y reportala.
