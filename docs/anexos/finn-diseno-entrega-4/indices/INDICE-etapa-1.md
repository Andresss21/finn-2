# Finn 2.0 · exportación del diseño · entrega 4 · etapa 1 · limpieza del canvas y decisiones de la auditoría

Fecha: 11/11/2026. Responde a `docs/auditoria-diseno/PROMPT-DISENO.md` (contradicciones D-1 a D-10 y el ítem 22) y al pedido de limpiar el canvas para que cada pantalla quede bien en día y noche, en teléfono y en computadora.

Esta es la **etapa 1** de seis. Las pantallas que la auditoría marcó como "sin diseño" (`SIN-DISENO.md`) van en las etapas 2 a 6 y no están aquí (ver §8 y `FALTANTES.md`).

Qué trae:

- **Una regla nueva**: cuando un criterio de aceptación aprobado de `06-features.md` contradice un dibujo, manda el criterio.
- **11 decisiones (D-1 a D-11)** con su justificación, las alternativas descartadas y lo que sustituyen, en `DECISIONES.md`, sección "Entrega 4".
- **Cobertura completa de variantes.** Cada estado de S1–S7 y K1 tiene:
  - teléfono claro y teléfono oscuro;
  - computadora en un tono (claro).
  - Inicio (S1) y Cuentas (S6) tienen además computadora oscuro en su vista principal, como en la entrega 1.
- **Correcciones de referencias aprobadas** que no cumplían sus propias reglas: contraste, tabla cortada, Guardar activo sin conexión, campana en los flujos, filas partidas. Incluye las correcciones de la revisión independiente (§9).
- **Canvas reordenado** por recorrido, con lo sustituido en Historial.
- **Demo navegable actualizada** con D-3, D-4, D-6 y el aviso de sin conexión.

## 1 · Cómo abrirlo

| Carpeta | Qué hay |
|---|---|
| `pantallas/S1-inicio` … `S7-semanal`, `K1-navegacion` | S1–S7 y K1 (la numeración de la entrega 1). Cada estado tiene `__telefono-claro`, `__telefono-oscuro` y `__computadora-claro`; S1 y S6 tienen además `principal__computadora-oscuro`. HTML con `data-rol` y `var(--token)`, más su PNG. |
| `pantallas/07-flujos-del-presupuesto` | `mover-excede` redibujado (D-6), con su bloque de impacto. La carpeta conserva el nombre de la entrega 2. |
| `pantallas/14-sin-conexion-404-y-error-de-pantalla` | `sin-conexion-en-la-app`: aviso «Estás sin conexión» y Guardar deshabilitado también en computadora. |
| `pantallas/15-inicio-y-presupuesto-piezas-nuevas` | `primeros-pasos-sin-cuentas` («0 de 3»: manda sobre el primer uso de S1, D-7), `primeros-pasos` («1 de 3») y `ritmo-y-tarjetas` (filas de atención sin monto, D-4). |
| `pantallas/16-salir` | Las de la entrega 3, regeneradas con los tokens de esta entrega. Lo único que cambia es Inicio de fondo, que ya no muestra montos en «Necesita tu atención» (D-4). |
| `componentes/K4-avisos-globales__{claro,oscuro}` | Avisos globales con el aviso de sin conexión corregido (D-10). |
| `estilos/` | `tokens.css`, `tokens.json`, `finn.css`, `fuentes.css` y `tokens-propuesta.css` (sin aprobar, ver §4). |
| `demo/finn-demo.html` | Demo navegable de un solo archivo; su fuente está en `demo/fuente/`. |
| `herramientas/` | Scripts con los que se generó y verificó todo. |
| `FALTANTES.md` | Lo que queda sin diseño, con la etapa en que se diseña cada cosa. |

Los PNG de teléfono están a 2× y los de computadora a 1×, con «reducir movimiento» activado (el estado final de cada animación).

Medidas: teléfono a 390 con 20 px de margen; computadora a 1440.

## 2 · Cómo se verificó

- **Mirado.** Cada archivo se renderizó y se revisó en hojas de contacto, por tema y por pantalla.
- **Contraste medido en el DOM renderizado.** Para cada texto se midió su color contra el primer fondo opaco de sus ancestros, en los 4 temas/dispositivos (`herramientas/contraste_dom.py`). Resultados:
  - Todo pasa 4.5:1, o 3:1 en texto grande.
  - Quedan solo los botones **deshabilitados** («Guardar» y «Archivar»), que WCAG exime. Esos botones siempre llevan su motivo escrito debajo, en `texto-secundario`, y ese motivo sí pasa.
  - El script no mide textos sobre degradados. Esos se midieron aparte, contra el extremo más claro del degradado: el rótulo de red de la cara de la tarjeta («Visa · crédito») da 4.85:1 en oro y 5.31:1 en plata.
- **Valores sueltos.** Se buscaron hex, rgba y duraciones fuera de `var(--…)` y se compararon con los de las referencias aprobadas.
  - Hay un solo valor que no estaba en las referencias: `#9CCB4A`, el par oscuro del verde de la paleta categórica anterior. Sale de `06-herramientas/contract.py` (fila G), igual que `#7D96FF` para el azul, y solo aparece en `S7-semanal/varias-categorias-ejemplo__telefono-oscuro`.
  - Los demás son los ya documentados en el INDICE de la entrega 1:
    - sombra y animación de entrada del marco de presentación;
    - brillo del billete;
    - paleta categórica anterior de Gasto semanal (diferencia D2).
- **Demo.** Pasan las 10 pruebas nuevas (`probar_demo4.py`) y las 18 de la entrega 3 (`probar_demo_salir.py`). No hay errores en la consola.
- **Revisión independiente.** Un agente que no participó revisó la entrega completa. Sus hallazgos y lo que se hizo con cada uno están en §9.
- **Estados que en el teléfono son un fragmento.** En el Detalle, «con meta», «categoría de pago de tarjeta» y «sobregiro con tarjeta» dibujan solo la parte de arriba. En computadora muestran esa columna izquierda; la derecha (consumos, calendario, historial) es la de la vista principal y no se repite. «Sin movimientos» sí la dibuja, porque el vacío está en Consumos.

## 3 · Decisiones (resumen; el texto que manda está en `DECISIONES.md`)

| # | Tema | Decisión | Dónde se ve |
|---|---|---|---|
| — | Qué manda | Un CA aprobado de 06 manda sobre un dibujo | — |
| D-1 | Ancho de flujos en computadora | Corto: panel de 440. Largo de una columna: 720. Registrar gasto y Revisar movimiento: dos columnas a todo el ancho del contenido (1096 px a 1440). | `S5-registrar/*__computadora-claro` |
| D-2 | 768–1023 px | Marco de teléfono con contenido de 640 px como máximo. La barra lateral aparece desde 1024; las dos columnas de D-1, desde 1280. | Regla escrita; el dibujo va en la etapa 6 |
| D-3 | «Asignar $X» del billete | Lleva a Presupuesto filtrado por Sin fondos, sin hoja | Demo |
| D-4 | Filas de «Necesita tu atención» | Sin monto | S1 todas, `15-…/ritmo-y-tarjetas` |
| D-5 | Asignar en período cerrado | Detalle de la categoría con aviso de información y sin acciones | `S3-detalle/periodo-cerrado__*` |
| D-6 | Mover más que el Disponible | Se acepta con aviso de advertencia | `07-flujos-del-presupuesto/mover-excede__*` |
| D-7 | Primer uso sin cuentas | Manda `15-…/primeros-pasos-sin-cuentas`. El de S1 va a Historial. | `15-inicio-y-presupuesto-piezas-nuevas/primeros-pasos-sin-cuentas__*` (y `primeros-pasos__*` para «1 de 3») |
| D-8 | Filtros de Actividad en computadora | 320 px | Regla escrita |
| D-9 | Texto de Devolver | «Vuelve a» | Regla escrita |
| D-10 | Tokens de movimiento | Se aprueban 3 y pasan a `tokens.css`. Se mapean 15 variables de la app. Se proponen 2. | `estilos/` |
| D-11 | Pasos «Revisá el impacto» | Se quitan; el impacto va en vivo debajo de los campos | Regla escrita (GLO-28) |

### 3.1 · Correcciones de referencias aprobadas

| Qué | Antes | Ahora |
|---|---|---|
| **Computadora de cada estado** de S1–S7 y K1 (31 estados) | Solo existían en teléfono claro | Cada una parte de la computadora aprobada de su pantalla y cambia solo lo que cambia el estado. Los overlays (hojas) pasan a panel lateral de 440 px. |
| **Teléfono oscuro de cada estado** (30 estados; el período cerrado de S3 ya lo tenía) | Solo existían en teléfono claro | El mismo dibujo con el tema oscuro |
| **Línea de estado del billete** («Todo asignado», «Asignaste más de lo que tenés») | `texto-secundario` / `problema-texto` sobre `marca`: entre 1.80:1 y 3.33:1 | `texto-sobre-marca`. El estado lo lleva el glifo en su disco de color. La demo ya lo hacía así. |
| **«Archivada · BAC»** en Cuentas | `texto-terciario` sobre `superficie-hundida`: 3.49:1 | `texto-secundario` |
| **Historial del detalle en computadora** | La tabla se cortaba por la derecha | Gráfico arriba y tabla debajo, a todo el ancho |
| **Sin conexión en computadora** | «Guardar» activo | Deshabilitado, con «Sin conexión: no se puede guardar ahora.» |

### 3.2 · Las 31 vistas de computadora nuevas

| Pantalla | Estados |
|---|---|
| S1 Inicio | listo-para-asignar-negativo, todo-al-dia |
| S2 Presupuesto | filtro-sobregiradas, periodo-cerrado, periodo-futuro, sin-resultados (los filtros actúan sobre la tabla) |
| S3 Detalle | categoria-de-pago-de-tarjeta, con-meta, historial-como-tabla, periodo-cerrado (D-5), sin-movimientos, sobregiro-con-tarjeta |
| S4 Bandeja | aprobado-con-un-toque, bandeja-al-dia, descartado, no-reconocido-con-error-duplicado-y-datos-faltantes, vista-de-descartados |
| S5 Registrar | fecha-en-periodo-cerrado, guardado, guardando, monto-mal-escrito, sugerencia-al-escribir, suma-distinta-del-total, una-linea |
| S6 Cuentas | archivadas-visibles, tarjeta-con-saldo-a-favor-mastercard-al-frente |
| S7 Gasto semanal | asignado-negativo, categoria-nueva, varias-categorias-ejemplo, vista-de-tabla (en computadora, la tabla equivalente ya está visible debajo del gráfico) |
| K1 Navegación | notificaciones-abiertas-n7 (panel lateral) |

## 4 · Movimiento y tokens

- **Aprobados** y ahora en `tokens.css`:
  - `--duracion-temblor` 380 ms
  - `--retardo-cascada` 40 ms
  - `--duracion-confirmacion` 650 ms
- **Propuestos** en `tokens-propuesta.css`; no los incorpores hasta que se aprueben:
  - `--retardo-bloque` 60 ms
  - `--retardo-grafico` 80 ms
- `tokens-propuesta.css` trae también la tabla con las 18 variables propias de la app:
  - 12 se reemplazan por un token aprobado. Siete de ellos cambian el valor (por ejemplo, 300 → 340 ms): queda para decidir (§8).
  - 5 dependen de los dos propuestos.
  - `--tope-escalonado` es una cantidad: va como constante con nombre dentro del componente.
- Nada nuevo se mueve en esta etapa. Las pantallas redibujadas usan los mismos movimientos que su referencia, y con «reducir movimiento» no se anima nada.

## 5 · Contraste de los pares nuevos

| Qué | Par | Claro | Oscuro | Mínimo | |
|---|---|---|---|---|---|
| Aviso de información: título | `informacion-texto` sobre `informacion-fondo` | 6.07:1 | 7.67:1 | 4.5:1 | ✓ |
| Aviso de información: texto | `texto` sobre `informacion-fondo` | 15.85:1 | 13.02:1 | 4.5:1 | ✓ |
| Aviso de información: enlace | `enlace` sobre `informacion-fondo` | 6.25:1 | 5.29:1 | 4.5:1 | ✓ |
| Aviso de información: glifo | `informacion-texto` sobre `informacion-fondo` | 6.07:1 | 7.67:1 | 3:1 | ✓ |
| Aviso de advertencia: título | `advertencia-texto` sobre `advertencia-fondo` | 5.40:1 | 8.62:1 | 4.5:1 | ✓ |
| Aviso de advertencia: texto | `texto` sobre `advertencia-fondo` | 16.29:1 | 12.64:1 | 4.5:1 | ✓ |
| Aviso de advertencia: glifo | `advertencia-texto` sobre `advertencia-fondo` | 5.40:1 | 8.62:1 | 3:1 | ✓ |
| Motivo de Guardar deshabilitado | `texto-secundario` sobre `fondo` | 7.47:1 | 9.22:1 | 4.5:1 | ✓ |
| Fila de atención: estado | `problema-texto` sobre `superficie` | 5.56:1 | 7.48:1 | 4.5:1 | ✓ |
| Fila de atención: deuda sin reservar | `deuda-sin-respaldo-texto` sobre `superficie` | 7.38:1 | 7.25:1 | 4.5:1 | ✓ |
| Línea del billete (corregida) | `texto-sobre-marca` sobre `marca` | 16.45:1 | 16.64:1 | 4.5:1 | ✓ |
| Cuenta archivada (corregida) | `texto-secundario` sobre `superficie-hundida` | 6.87:1 | 9.53:1 | 4.5:1 | ✓ |

## 6 · Canvas

https://claude.ai/code/artifact/005bb3b4-83b2-46be-a82c-d775af5450e6

**Página "actual"**, ordenada por recorrido:

1. Prototipo v2 y marca
2. Acceso, marco y Salir
3. Inicio y Presupuesto
4. Detalle de categoría
5. Bandeja y Registrar
6. Actividad y Reportes
7. Cuentas
8. Más secciones y Ajustes
9. Decisiones de la auditoría
10. Componentes

Tableros nuevos:

- E4-S1 a E4-S7 y E4-K1. Cada estado va en una fila con todas sus variantes. Los tableros de más de 7600 px se parten en a/b/c.
- E4-09 · Decisiones.
- E3-01 · Salir, regenerado.

**Página "Historial"**:

- S1–S7 v2.
- E3-01 v1.
- S1 · primer uso sin cuentas (D-7).
- K1 · más secciones (sustituido en la entrega 3).

Cada tablero de entrega 2 con estados sustituidos lleva una nota naranja que dice qué lo reemplaza y dónde está.

## 7 · Demo navegable

https://claude.ai/artifact/5H4ohV8DggWb7ZcnDu12qF

Cambios de esta etapa:

- **D-3.** El botón del billete en Inicio lleva a Presupuesto filtrado por Sin fondos, o sin filtro si no hay categorías sin fondos.
- **D-4.** Las filas de «Necesita tu atención» no muestran monto, ni en teléfono ni en computadora.
- **D-6.** Mover más que el Disponible muestra el aviso de advertencia; «Mover» sigue activo y la categoría queda en negativo.
- **D-10.** El aviso de sin conexión dice solo «Estás sin conexión».
- **Sin conexión.** Cada envío principal queda deshabilitado con «Sin conexión: no se puede guardar ahora.» debajo. La demo responde también a la conexión real del navegador, no solo al botón «Sin conexión».
- **Fuentes.** Archivo y Big Shoulders van embebidas en el archivo: la demo ya no depende de Google Fonts.

Pruebas: 13 de 13 en `probar_demo4.py` y 18 de 18 en `probar_demo_salir.py`, las dos sobre el archivo entregado tal cual.

Sigue habiendo pantallas que la demo muestra como "pantalla sin diseño". Se completan **al final**, cuando las etapas 2 a 6 las dibujen: así la demo no inventa lo que el diseño todavía no decidió.

## 8 · Lo que queda abierto

El reparto ítem por ítem está en `FALTANTES.md`. Resumen:

| Etapa | Alcance |
|---|---|
| 2 | Acceso, seguridad y Cuentas |
| 3 | Bandeja, Revisar y Registrar |
| 4 | Presupuesto, categorías y Más secciones |
| 5 | Reportes y Ajustes |
| 6 | Estados transversales y dibujo del marco de 768–1023 (D-2) |
| Cierre | Demo navegable completa, un solo PROMPT-DESARROLLO con todas las etapas (criterios agrupados por pantalla) y revisión independiente |

Pendiente aparte: las muestras de color de Gasto semanal todavía usan la paleta categórica anterior (diferencia D2 de la entrega 1); pasarlas a `grafico-serie-*` es una decisión pendiente.

## 9 · Revisión independiente

Un agente que no participó en la entrega la revisó completa: cobertura, fidelidad, reglas medidas en el HTML, coherencia de las decisiones y la demo con clics. Esto es lo que encontró y lo que se hizo.

**Corregido en esta entrega**

| Hallazgo | Qué se hizo |
|---|---|
| D-7 apuntaba a «Primeros pasos · 1 de 3» | Se agregó `primeros-pasos-sin-cuentas__*` («0 de 3») y se corrigieron las rutas |
| D-1 y D-2 pedían 1144 px de contenido, imposible a 1440 | D-1 usa todo el ancho del contenido (1096 px a 1440); D-2 fija las dos columnas desde 1280 px de ventana |
| Los conteos de D-10 no cuadraban con su tabla | 12 aprobados, 5 propuestos, 1 constante |
| `historial-como-tabla` en computadora repetía la tarjeta vieja, cortada | Queda solo la tabla |
| Bandeja en computadora: el panel mostraba un movimiento aprobado o ajeno a la lista, y el segmentado de Descartados marcaba la otra vista | Panel vacío con «Elegí un movimiento…», segmentado y contadores corregidos |
| Detalle en período cerrado con consumos y «hoy» del período actual | Consumos y calendario del 21/08–20/09 |
| Mover de más sin bloque de impacto | Agregado |
| Guardando y Una línea en computadora con 3 líneas | Una línea, con su impacto |
| Asignado negativo en computadora con referencias del estado principal | Todo el reporte en $0.00 de referencia |
| Campana en los flujos de computadora | Quitada (regla de Marco) |
| Colores del tema claro en 4 archivos oscuros | Pasados a su par oscuro |
| Agarradera de hoja en el panel de notificaciones de computadora | Quitada |
| Fila de tarjeta partida en una palabra por línea y «−» separado de la cifra | Corregido |
| Rótulo de red de la tarjeta a 3.4–3.8:1 | Sin opacidad: 4.85:1 y 5.31:1 |
| Ninguna decisión tenía alternativas descartadas | Columna agregada en DECISIONES |
| Demo: Guardar sin motivo sin conexión; dependía de Google Fonts; las pruebas no usaban el archivo entregado | Motivo agregado, fuentes embebidas, pruebas sobre el archivo tal cual |
| Barra lateral de computadora sin «Salir» ni el engranaje de la entrega 3 (encontrado en la revisión de la etapa 2) | Puesta al día en las 46 vistas de computadora, con `herramientas/barra_lateral3.py` |
| Carpetas renumeradas y `_lista.json` suelto | Se usa la numeración de las entregas 1 y 2; el archivo se quitó |
| INDICE: computadora oscuro «en todas», 16-salir «sin cambios», `#9CCB4A` sin documentar | Corregido en §1 y §2 |

**Pendiente, con su etapa**

| Hallazgo | Dónde se resuelve |
|---|---|
| 7 reemplazos de D-10 cambian el valor (300 → 340 ms, etc.) y `finn.css` tiene duraciones y curvas sueltas | Decisión pendiente (próxima conversación) |
| «Asignar» de la franja de Presupuesto sin categoría elegida (PRE-08) también abre una hoja | Decisión pendiente; se propone extender D-3 |
| La columna «Ref. acum.» de la tabla de Gasto semanal se corta en el teléfono | Etapa 5: cómo se desplazan las tablas anchas |
| Menú «···» del detalle en un período cerrado | Etapa 4 (`archivadas`) |
| Período futuro de Presupuesto: el teléfono aprobado muestra gastos en un período que no empezó | Etapa 4 (`periodos`) |
| Heredados menores: tocables de 36–41 px medidos por su caja, textos sin `data-rol` (insignias, calendario, gráficos), montos dentro de botones sin cifras tabulares, título «PRESUPUES…» truncado, barra fija de Registrar a 14–15 px del borde, «Guardar» repetido en «suma distinta» | Etapa 6, con los transversales |

