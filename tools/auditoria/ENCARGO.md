# Encargo común de una sección de la auditoría de diseño

Sos parte de una auditoría de diseño visual de la app real Finn 2.0 (PWA de presupuesto, Next.js 16, Windows con Git
Bash, repo en `C:/finn/repo`). Se compara **lo que se ve renderizado** en la app que corre contra el diseño aprobado,
pantalla por pantalla y estado por estado. No asumas que algo está bien porque el código parece correcto.

## Reglas duras

- NO modifiques código de la app ni documentos del repo. Solo escribís tu archivo de casos en `tools/auditoria/casos/`
  y tu informe en `docs/auditoria-diseno/secciones/`. No commitees, no toques git, `plan/`, `pruebas/` ni
  `C:/finn/_privado`. Ignorá "Cómo tomar una tarea" de CLAUDE.md: esto no es una TA.
- El servidor local YA corre en http://localhost:3100. No lo lances ni lo detengas; no corras `pnpm test:e2e` ni
  `servir.mjs`. No lances subagentes.
- Credenciales: solo las del usuario de prueba, por las ayudas de `tools/auditoria/lib.ts`. No las imprimas. No
  reemplaces ni quites el factor TOTP del usuario de prueba.
- Cuidá el contexto: no leas archivos enteros si alcanza con una parte, y no abras imágenes que no vayas a comparar.

## Primero leé

1. `tools/auditoria/README.md` (cómo escribir un caso, correrlo y analizarlo) y `tools/auditoria/lib.ts`.
2. `docs/diseno/01-especificacion/DECISIONES.md`, la sección "Entrega 3" de `docs/diseno/entrega-3/DECISIONES.md`,
   `docs/diseno/01-especificacion/FALTANTES.md` y, de `PANTALLAS.md`, §1, §2, §3, §11 y la sección de tu pantalla.
   Jerarquía: DECISIONES > tokens.css > PNG/HTML de referencia > PANTALLAS.md > demo.
3. Las referencias y el código que nombra tu encargo particular.

## Trabajo

**A. Inventario.** Todas las rutas, pantallas, hojas, menús, diálogos y estados que la app puede mostrar en tu sección
(vacío, cargando, error, sin conexión, deshabilitado, uno, muchos, negativo…). Para cada una: ruta, componente
(archivo) y la referencia exacta de diseño, o "SIN DISEÑO" (está en FALTANTES.md, o la app inventó una pantalla o
estado que el diseño resuelve de otra forma: eso es un hallazgo en sí).

**B. Captura.** Un caso por entrada del inventario en tu archivo de casos. Forzá cada estado con semillas de
operaciones reales, mocks de red (`page.route`), `context.setOffline` o los pasos de las E2E del repo
(`apps/web/e2e/pantallas/<sección>`, `apps/web/e2e/flujos/<sección>`). Usá la semilla A.7 (`escenarioA7()`, hoy
servidor 2026-10-15) cuando se pueda: son los datos de las referencias. Depurá con `--project=telefono-claro -g`; al
final corré las 3 variantes. Lo que no puedas forzar tras un intento razonable va como "no capturado" con su motivo.

**C. Comparación, sin saltear ninguna pantalla.** Para cada caso:

- `node tools/auditoria/analizar.mjs <prefijo>` y leé `docs/auditoria-diseno/analisis/<id>.md` (tipografía por texto
  contra la referencia, colores fuera de token, contraste, tocables < 44, márgenes, marco, desbordes, textos que faltan
  o sobran). Da falsos positivos (datos distintos, coincidencias por texto): confirmá antes de reportar. Más medidas en
  `docs/auditoria-diseno/medidas/<id>__<variante>.json` (`cajas`, `textos`, `tocables`) y en `medidas-ref/` (en las
  referencias el lienzo está desplazado: restá el `x` de la caja de 390 px de ancho).
- MIRÁ con Read `docs/auditoria-diseno/capturas/<id>__telefono-claro.png` junto al PNG de referencia, y lo mismo en
  `computadora-claro`. En `telefono-oscuro`, al menos el estado principal de cada pantalla y todo caso donde el
  análisis marque diferencias de color.
- Revisá: (1) estructura: bloques, orden, lo que falta, sobra o vive en otra pantalla; (2) marco: 20 px laterales en
  teléfono (24 en acceso), anchos máximos en computadora (contenido 1144, flujos 720), barra superior según el tipo de
  pantalla (pestaña: Registrar + campana + ☰; hija: flecha "Volver a <padre>" a la izquierda del título; Más secciones:
  solo campana; **flujos —todo lo que termina en Guardar, Confirmar o Verificar— sin campana ni barra inferior**);
  (3) componente correcto y su variante: un enlace subrayado donde va un botón tonal es error, un aviso de problema
  donde va una advertencia es error; (4) tipografía por rol, `font-stretch` en cifras, textos partidos; (5) color y
  tokens, contraste; (6) espacio, radio y elevación (±2 px); (7) tres señales por estado, U+2212 y tabular-nums en
  negativos, voseo, resultados en el lugar; (8) tocables ≥ 44 × 44, etiquetas, `role="status"` en avisos.
- Para cada diferencia real, ubicá el archivo del repo a tocar.

Las diferencias que son solo de DATOS (otros montos, sin nombre de comercio, sin notificaciones sembradas) no son
hallazgos, salvo que revelen un problema de composición.

**D. Informe** en `docs/auditoria-diseno/secciones/<tu archivo>.md`, en español, con tres partes:

1. `## Inventario`: tabla | id de captura | ruta | componente | referencia (o SIN DISEÑO) | veredicto en una línea
   ("bien" o los ids de hallazgos) |. Incluí lo no capturado con su motivo.
2. `## Hallazgos`: UNO por diferencia, sin agrupar diferencias distintas. Formato exacto:

```
### XXX-01 · <título corto> — <pantalla> · <variantes> · <crítica|alta|media|baja>
- **Se ve:** qué muestra la app, con la ruta de la captura y la medida tomada.
- **Debería:** qué dice el diseño, con la ruta exacta del PNG/HTML de referencia o la fila de DECISIONES.
- **Arreglo:** qué cambiar, en componentes y tokens (nunca valores sueltos), con los archivos del repo.
- **Cómo verificar:** criterio de aceptación.
```

   Severidades: **crítica** = pantalla inventada o que contradice el diseño, o flujo roto; **alta** = componente
   equivocado, marco o márgenes rotos, movimiento faltante en un momento clave; **media** = medidas, tipografía o
   color; **baja** = detalles. Lo transversal a toda la app reportalo con tu id y listalo al final en
   `## Candidatos a global`, una línea cada uno.
3. `## Sin diseño`: cada pantalla o estado sin referencia, con su captura.

**Respuesta final** (corta): casos capturados y no capturados, hallazgos por severidad y los 5 más graves en una línea
cada uno. El detalle va en el archivo.
