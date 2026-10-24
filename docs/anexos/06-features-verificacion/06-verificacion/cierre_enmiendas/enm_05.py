# Enmiendas de la Fase 6 a 05-frontend.md. Detalle normativo en 06-features.md.
d05 = Doc('05-frontend.md')
F6 = '**[F6]**'

# Encabezado
d05.antes("Plan de entrega aprobado:\n",
    "**Enmiendas de la Fase 6** **[F6]**: los cambios CF-01, CF-02, CF-04 a CF-08, CF-10 a CF-13, CF-15, CF-17 a CF-19 y CF-21 a "
    "CF-23 de `06-features.md` (§0.7 de ese documento) se aplicaron a este documento al cerrar la Fase 6 (21 de octubre de 2026). "
    "Cada sección afectada lleva la marca **[F6]**; la lista está en 0.13 y en \"Enmiendas posteriores\", al final. CF-03 queda "
    "diferido; CF-25, P6-26 y P6-27 (06 §5.8) están pendientes y no se aplican. Los props de los componentes visuales de la "
    "identidad (CF-13) están en 10.8.1.\n\n")

# 0.13
d05.antes("## 1. Estructura de `apps/web`\n", """### 0.13 Enmiendas de la Fase 6 **[F6]**

| CF | Qué cambia | Secciones de este documento | Detalle en 06 |
|---|---|---|---|
| CF-01 | Ruta `/cuentas/[cuentaId]/verificar-saldo` [L] (OP-53), previsualizar primero, nombres "Estado de cuenta" y "Verificación de saldo" | 1.3, 2.7, 4.4, 15.2 | 3.2 |
| CF-02 | Reporte `flujo-efectivo` | 1.3, 2.10 | 3.3 |
| CF-04 | Reportes `ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos`; hallazgos con `Aviso` y su acción | 1.3, 2.10, 10.8 | 3.5 |
| CF-05 | Ejecución de `Propuesta` por `ejecucion` (`un_toque` o `abrir_flujo`) y salidas para revertir de las propuestas nuevas | 4.13, 4.14 | 3.6 |
| CF-06 | Inicio: hallazgos de ritmo y pagos de tarjeta próximos en "Necesita tu atención"; "Todo al día" los exige vacíos | 2.3 | 3.7 |
| CF-07 | Destino `cuenta` → `/cuentas/[cuentaId]` | 3.5 | 3.8 |
| CF-08 | Plantilla de grupos y categorías: ruta `/presupuesto/estructura/plantilla` [L], textos en `src/textos/plantilla.ts` | 1.3, 2.3, 7.2, 12 | 3.9 |
| CF-10 | Tema por `data-theme="claro" \\| "oscuro"` | 10.1, 10.6 | 3.11 |
| CF-11 | Variables sin el prefijo `--finn-` | 10.1, 10.5 | 3.11 |
| CF-12 | Roles tipográficos generados como `@utility` desde `tokens.json`; rol nuevo `rotulo` | 10.4 | 3.11 |
| CF-13 | Componentes visuales propios de la identidad, con sus props | 10.8.1, 15.4 | §5.4 |
| CF-15 | Signo menos U+2212 al mostrar montos; `limpiarPegado` acepta U+2212 y U+2013; exportaciones sin cambio | 5.2, 5.4, 10.8 (`Monto`), 0.7 (V5-02) | 3.12 |
| CF-17 | "Categoría nueva" según `existiaEn`; "Tu promedio de gasto ({n} períodos)" | 2.10 | 3.14 |
| CF-18 | Primeros pasos en Inicio con "Ocultar por ahora"; recordatorio en `/ajustes` | 2.3, 2.11, 7.2 | 3.15 |
| CF-19 | Plantilla aplicada con OP-07 en lote, en tandas, con avance y reanudación desde el borrador | 1.3, 2.3, 4.11, 11.3 | 3.9.1 |
| CF-21 | Soltar un movimiento sobre una categoría aprueba con OP-37 `{ categoriaId }`; traspaso al flujo con la categoría puesta | 1.3, 2.5, 4.15 | 0.13, FT-78 |
| CF-22 | Panel de destinos del arrastre, carga diferida de `@dnd-kit/core` | 2.5, 10.8, 13.3 | 0.13, FT-78 |
| CF-23 | `/notificaciones` interceptada en `@superpuesto` desde la campana; `Superpuesto` con la variante "desde arriba" | 1.3, 1.4, 10.7 | 0.14, FT-69 |

""")

# 1.3 árbol
d05.despues("  presupuesto/estructura/page.tsx                     [L] administración de grupos y categorías\n",
            "  presupuesto/estructura/plantilla/                   [L] OP-07 en lote (plantilla) [F6] CF-08, CF-19\n")
d05.despues("  cuentas/[cuentaId]/conciliar/                       [L] OP-45, OP-46, OP-47\n",
            "  cuentas/[cuentaId]/verificar-saldo/                 [L] OP-53                          ?fecha= [F6] CF-01\n")
d05.cambiar("  notificaciones/page.tsx ",
            "  notificaciones/page.tsx (y @superpuesto/(.)notificaciones, [F6] CF-23) ")
d05.antes("### 1.4 Flujos largos y cortos (FE-04)\n",
          f"{F6} `reportes/[tipo]` agrega `ritmo`, `realidad`, `hormiga`, `suscripciones`, `tarjetas`, `hallazgos` (CF-04) y `flujo-efectivo` (CF-02) (tabla de 2.10). La lista de `bandeja/page.tsx` admite además soltar un movimiento sobre una categoría (OP-37 `{{ categoriaId }}`, CF-21; 2.5).\n\n")

# 1.4 (CF-23)
d05.antes("**Justificación.** Cumple P5-11",
          f"{F6} **Excepción de las notificaciones (CF-23).** `/notificaciones` es una sección [S], pero se intercepta como un flujo corto cuando se llega desde la campana de otra pantalla: `@superpuesto/(.)notificaciones/page.tsx` la muestra con `Superpuesto` en su variante \"desde arriba\" sobre la pantalla de origen, que sigue montada; cerrar (botón, velo o Escape) es `router.back()`. URL abierta directamente, recarga, deep link o \"atrás\" desde un destino: página completa. Tocar una notificación navega a su destino con `?notificacion=` (3.5), y el slot se vacía como con cualquier ruta interceptada.\n\n")

# 2.3 (CF-06, CF-08, CF-18, CF-19)
d05.despues("### 2.3 Inicio y Presupuesto\n",
            f"\n{F6} **Inicio.** \"Necesita tu atención\" muestra también `atencion.hallazgosRitmo` (cada uno con su `Aviso` y su acción) y `atencion.pagosTarjetaProximos` (CF-06); \"Todo al día\" exige además que los dos estén vacíos. **Primeros pasos** (CF-18; 06 §3.15): con `primerosPasos` distinto de nulo, un bloque con tres pasos marcables (crear una cuenta → `/cuentas/nueva`; crear las categorías → `/presupuesto/estructura`; conectar los SMS → `/ajustes/webhook`); sin cuentas ocupa el lugar de la atención, y con alguna cuenta va encima. \"Ocultar por ahora\" es una preferencia del dispositivo (`finn:primeros-pasos:oculto` en `localStorage`, con `cliente/almacen.ts`); no se ofrece sin cuentas. **Plantilla** (CF-08, CF-19; 06 §3.9): `/presupuesto/estructura/plantilla` [L], consulta `estructura()`, se ofrece desde el paso \"Crear las categorías\" y en `/presupuesto/estructura` mientras no haya categorías normales; la lista se edita antes de aplicar y se aplica con OP-07 en lote, en 3 o 4 tandas de hasta 12 elementos, grupos antes que sus categorías, con el avance \"Creando tu plantilla: {{k}} de {{n}}…\" en la región `status` (11.3).\n")

# 2.5 (CF-21, CF-22)
d05.despues("### 2.5 Bandeja\n",
            f"\n{F6} **Arrastrar a una categoría (CF-21, CF-22; FT-78).** En las filas con `aprobacion.arrastrable`, un asa permite soltar el movimiento sobre una categoría del `PanelDestinosArrastre` (sugerida, `destinosArrastre.frecuentes` y \"Otra categoría…\" con `destinosArrastre.grupos`; en computadora, el panel lateral lista además todas por grupo). Soltar envía OP-37 `{{ categoriaId }}`; si el servidor pide confirmación o falta un dato, se abre `/bandeja/[movimientoId]` con la categoría ya puesta (4.15). Teléfono: pulsación larga de 350 ms (tolerancia 8 px); ratón: después de 6 px; teclado: Espacio, flechas que saltan entre destinos, Espacio o Escape, con anuncios en voseo. Los botones de un toque no cambian (WCAG 2.5.7). La nota \"Tocá un movimiento para revisarlo completo. Arrastrar a una categoría es un atajo; los botones siempre están.\" se conserva.\n")

# 2.7 (CF-01)
d05.antes("| `/cuentas/[cuentaId]/conciliar` | [L] | `formulario({ operacion: 'conciliar', cuentaId })` (CP-16)",
          "| `/cuentas/[cuentaId]/verificar-saldo` **[F6]** CF-01 | [L] | `formulario({ operacion: 'verificar_saldo', cuentaId, fecha })` ← `?fecha=` (cambiarla usa `router.replace`) | OP-53 (previsualizar primero, 4.4) | AV-21 (después) con la propuesta de ajuste (abrir flujo) | Lista de candidatas para marcar: todas preseleccionadas si la diferencia de la previsualización es exactamente cero; ninguna si no. Borrador con fecha, saldo y marcas (4.11). En el detalle de cuenta, cada conciliación se nombra \"Estado de cuenta\" o \"Verificación de saldo\" según `modo` |\n")

# 2.10 (CF-02, CF-04, CF-17)
d05.antes("| Cualquier otro (incluido `datos_base`",
          "| `ritmo` **[F6]** | `ritmo` | — (período activo) |\n"
          "| `realidad` **[F6]** | `realidad` | — |\n"
          "| `hormiga` **[F6]** | `hormiga` | `?periodo=` |\n"
          "| `suscripciones` **[F6]** | `suscripciones` | — |\n"
          "| `tarjetas` **[F6]** | `tarjetas` | `?ventana=` (por defecto `ultimos-6`) |\n"
          "| `hallazgos` **[F6]** | `hallazgos` | — |\n"
          "| `flujo-efectivo` **[F6]** | `flujo_efectivo` | `?ventana=` (título \"Flujo de efectivo\") |\n")
d05.antes("### 2.11 Ajustes\n",
          f"{F6} Los títulos de los tipos nuevos están en 06 §3.5.1 y §3.3. Cada hallazgo se muestra con `Aviso` (estado de 10.3) y su acción: una `Propuesta` (4.13) o un enlace. **CF-17:** \"Categoría nueva\" (gasto semanal y reportes de comparación) significa que la categoría no existía en ningún período anterior (selector `existiaEn` de 04); la asignación rápida muestra \"Tu promedio de gasto ({{n}} períodos)\" cuando sale de menos de 3.\n\n")

# 2.11 (CF-18)
d05.despues("### 2.11 Ajustes\n",
            f"\n{F6} **CF-18.** Mientras los Primeros pasos estén ocultos y quede alguno pendiente, `/ajustes` muestra \"Primeros pasos: {{k}} de 3\" con \"Mostrar en Inicio\", que borra la preferencia del dispositivo.\n")

# 3.5 (CF-07)
d05.cambiar("| `diagnostico` | `/ajustes/diagnostico` |",
            "| `diagnostico` | `/ajustes/diagnostico` |\n| `cuenta` **[F6]** CF-07 | `/cuentas/[cuentaId]` |")

# 4.4 (CF-01)
d05.despues("| OP-19 Cambiar el ciclo | Siempre exige confirmación (AV-12, con el período de transición) |\n",
            "| OP-53 Verificar saldo **[F6]** CF-01 | La primera pantalla es el saldo de Finn a la fecha y la diferencia, que la interfaz no calcula (PF-3) |\n")

# 4.11 (CF-19)
d05.despues("**Dónde y cómo.**\n",
            f"- {F6} **CF-19.** La plantilla de categorías guarda además, antes de la primera tanda, los ids de creación de cada elemento; al volver se reenvían los elementos sin resultado con los mismos ids (lo creado responde `ya_aplicada`). Sin borrador, compara los nombres con `estructura()` y no envía los que ya existen.\n")

# 4.13 (CF-05)
d05.despues("- **Propuestas** (`SalidaOperacion.propuestas`, CP-8)",
            ". **[F6] CF-05:** con `ejecucion: 'un_toque'` se ejecuta tal cual; con `'abrir_flujo'` la interfaz escribe `entrada` como borrador del flujo de destino (4.11) y navega a su ruta: OP-20 → `/registrar/gasto`, OP-21 → `/registrar/ingreso`, OP-27 → `/registrar/entrada-tarjeta`, OP-42 → `/programadas/nueva`")

# 4.14 (CF-05)
d05.antes("\n\n**Reglas de la salida para revertir:**",
          "\n| **[F6]** Ejecutar una propuesta de CF-05 | OP-15, OP-14, OP-18, OP-42 | Donde aparece el hallazgo | Ritmo con OP-15: **Deshacer**, OP-15 con origen y destino intercambiados. OP-14: **Deshacer** como AV-08. Ajustar meta (OP-18): OP-18 con los valores intercambiados. Crear una programada (OP-42): OP-51 con el id creado. Reactivarla: OP-42 `activa: false`. Las de `abrir_flujo` no tienen salida (son un flujo) |")

# 4.15 (CF-21)
d05.antes("**Cuándo se ofrece.** En cada fila de la lista de la bandeja",
          f"{F6} **Soltar sobre una categoría (CF-21).** Usa el mismo envío, con la variante `{{ movimientoId, id, categoriaId, esperado }}`. Si responde `REQUIERE_CONFIRMACION` o un faltante, el traspaso al flujo es el de esta sección, con el borrador que agrega `{{ variante: 'categoria', categoriaId }}`; el flujo confirma con la misma variante, el mismo id y la `huellaImpacto`. El resultado es el del toque, sin \"Deshacer\" (PB-2). `arrastre_no_permitido` muestra su mensaje en la fila.\n\n")

# 5.2 (CF-15)
d05.despues("- **Al pegar** (`limpiarPegado`)",
            " (**[F6]** CF-15: además del guion, U+2212 y U+2013 al inicio marcan negativo)")

# 5.4 (CF-15)
d05.cambiar("| `formatearMonto(c)` | `Centavos` | `$1,234.50`, `-$45.00`,",
            "| `formatearMonto(c)` (**[F6]** CF-15: arma el texto con `formatToParts` y cambia `minusSign` por U+2212; igual `formatearMontoTexto`) | `Centavos` | `$1,234.50`, `−$45.00`,")
d05.cambiar("| V5-02 | Módulo de formato | `$1,234.50`, `-$45.00`,",
            "| V5-02 | Módulo de formato (**[F6]** CF-15: las salidas fijadas pasan a `−$45.00`, y un caso comprueba que la exportación CSV sigue con `-45.00`) | `$1,234.50`, `-$45.00`,")

# 7.2 (CF-08, CF-18)
d05.cambiar("| **Primer uso** |", "| **Primer uso** (**[F6]** en Inicio lo resuelven los Primeros pasos, CF-18; desde \"Crear las categorías\" se ofrece la plantilla, CF-08) |")

# 10.1 (CF-10, CF-11)
d05.antes("| Valores | `src/estilos/tokens.css` |",
          "**[F6] CF-10 y CF-11.** `tokens.css` es el que entregó el diseño, con las variables **sin** el prefijo `--finn-` (`--superficie`, `--radio-control`…), claro por defecto y oscuro por `data-theme=\"oscuro\"` o por preferencia del sistema. El puente usa `@custom-variant dark (&:where([data-theme=oscuro], [data-theme=oscuro] *))` y expone las mismas utilidades (`--color-superficie: var(--superficie)`); `--spacing` toma el valor de `--espacio-1`. Donde la tabla dice `--finn-*` y `.dark`, rige esta nota.\n\n")

# 10.4 (CF-12)
d05.antes("**Justificación de FE-42.**",
          f"{F6} **CF-12.** Los roles se generan como `@utility text-<rol>` desde `tokens.json` (`tipografia`: fuente, tamaño, interlineado, peso, `font-stretch`, cifras tabulares y mayúsculas), con los nombres de esta tabla más el rol nuevo `rotulo` (`text-rotulo`: encabezados de tabla y de bloque). Las clases `.t-*` de `tokens.css` no se copian. Los valores provisionales de la tabla quedan reemplazados por los de `tokens.json` (06-identidad-visual). La regla de movimiento reducido queda solo en `globals.css` (11.6). Fuentes: Big Shoulders Display (títulos, nunca montos) y Archivo (cuerpo y montos), autohospedadas.\n\n")

# 10.5 (CF-11)
d05.despues("### 10.5 Espaciado, radios, elevación, movimiento y capas\n",
            f"\n{F6} **CF-11.** Los nombres de los tokens son los de `tokens.css` sin prefijo; los radios nuevos (`radio-superpuesto`, `radio-identidad`, `radio-tarjeta`), la escala `espacio-1` a `espacio-16`, las duraciones y curvas nuevas son los de la entrega del diseño.\n")

# 10.6 (CF-10)
d05.cambiar("- **next-themes** con `attribute=\"class\"`",
            "- **next-themes** con `attribute=\"data-theme\"` y `value={ light: 'claro', dark: 'oscuro' }` (**[F6]** CF-10; antes `attribute=\"class\"` y la clase `.dark`)")

# 10.7 (CF-23)
d05.cambiar("| `Superpuesto` (1.4) |", "| `Superpuesto` (1.4; **[F6]** CF-23: variante `desde: 'abajo' \\| 'lado' \\| 'arriba'`, la de arriba para `/notificaciones`) |")

# 10.8 (CF-04, CF-13, CF-15, CF-22)
d05.cambiar("| `ResumenListoParaAsignar` |", "| `ResumenListoParaAsignar` (**[F6]** CF-13: variantes `billete` y `franja`, 10.8.1) |")
d05.cambiar("| `MovimientoBandeja` |", "| `MovimientoBandeja` (**[F6]** CF-22: asa de arrastre si `aprobacion.arrastrable`) |")
d05.despues("| `ErrorPantalla` (7.3) | `digest`, `reintentar` | Sí | En la página y en el superpuesto | La referencia se puede seleccionar y copiar |\n",
"""
#### 10.8.1 Componentes visuales de la identidad **[F6]** (CF-13, CF-22; 06 §5.4)

Reciben fragmentos de DTO sin transformarlos; ninguno calcula montos ni proporciones (ADR-07, PF-3). Los campos marcados *(CF-25)* dependen de un cambio a 04 pendiente de aprobación: hasta entonces, el componente se muestra sin esa parte.

| Componente | Props | Cliente | Datos | Estados |
|---|---|---|---|---|
| `ResumenListoParaAsignar` | `{ lpa, enCamino, lpaNegativo, variante: 'billete' \\| 'franja', accion?: { href; texto } }` | No | `InicioDto`, `PresupuestoDto` | Positivo, cero ("Todo asignado"), negativo; con "En camino" (sin nombre de deudor) |
| `BarraGastado` | `{ barra }` *(CF-25)* | No | `FilaCategoria.barra` | Dentro de lo asignado; sobregiro con débito, con tarjeta (rayado `patron-sin-reservar`) o mixto; con meta |
| `BilleteraTarjetas` | `{ tarjetas: CuentasDto['tarjetas'] }` | Sí (traer al frente) | 04 6.5; `usoSinReservarBp` *(CF-25)* | Te falta reservar, deuda reservada, saldo a favor, sin deuda. Caras decorativas por orden; con teclado, cada cara es un botón |
| `IdentidadCuenta` | `{ tipo: 'efectivo' \\| 'prestamo' \\| 'inversion' \\| 'archivada'; fila }` (la fila de `CuentasDto` de su tipo) | No | 04 6.5 | Una identidad para toda cuenta de efectivo; con diferencia de conciliación (AV-21); préstamo con talón de `proximaCuota` o "Sin modelo"; archivada |
| `PosicionNeta` | `{ posicion: CuentasDto['posicionNeta'] }` | No | 04 6.5; `deudasSobreActivosBp` *(CF-25)* | Deudas rayadas para distinguirlas sin color |
| `SelectorVista` | `{ vista: 'grafico' \\| 'tabla'; alCambiar }` | Sí | — | `role="radiogroup"`; estado local, no cambia la URL |
| `GraficoAcumulado` (`componentes/graficos/`) | `{ semanas; asignado; resumen }` | No | 04 6.9.3 | Con semanas futuras; asignado negativo (sin referencia) |
| `GraficoRango` (`componentes/graficos/`) | `{ semanas; resumen }` | No | 04 6.9.3 | Categoría nueva: sin rango |
| `CalendarioPeriodo` | `{ periodo; dias; hoy }` | Sí (filtrar por día) | `detalleCategoria().calendario`; intensidad *(CF-25)* | Días futuros, hoy, sin gasto |
| `PanelDestinosArrastre` | `{ sugerida?: Ref; frecuentes: Ref[]; grupos?: { grupo: Ref; categorias: Ref[] }[]; variante: 'telefono' \\| 'lateral' }` | Sí (con `import()`) | `bandeja().destinosArrastre` (CF-22) | Teléfono: sugerida, frecuentes, "Otra categoría…"; lateral: además todas por grupo. Destinos de 44 px; todos visibles sin desplazar en el teléfono |

Requisitos comunes: tres señales en todo estado (10.3); tocables de 44 × 44; movimiento reducido sin animación; los tokens decorativos (`cuenta-*`, `tarjeta-*`, `marca-grabado`) nunca llevan información. Los hallazgos de los reportes nuevos (CF-04) usan `Aviso` y los componentes de gráficos existentes.

**[F6] `Monto` (CF-15).** El texto visible lleva U+2212; el accesible sigue siendo "menos $X".
""")

# 11.3 (CF-19)
d05.despues("### 11.3 Lectores de pantalla\n",
            f"\n{F6} **CF-19.** El avance de la plantilla (\"Creando tu plantilla: {{k}} de {{n}}…\") se anuncia en la región `status` del marco. **CF-21:** los anuncios del arrastre (tomar, mover sobre un destino, soltar, cancelar) van en voseo en la región de estado de la librería.\n")

# 12 (CF-08)
d05.despues("### 12.1 Dos catálogos (FE-23)\n",
            f"\n{F6} **CF-08.** Los nombres de la plantilla de grupos y categorías van en `src/textos/plantilla.ts` (06 §3.9.2): no son datos del servidor ni de la base.\n")

# 13.3 (CF-22)
d05.despues("| Gráficos en el servidor (FE-44); d3 nunca en el cliente | 10.8 |\n",
            "| **[F6]** `@dnd-kit/core` solo con `import()` en la Bandeja, en el primer momento libre después de hidratar (`requestIdleCallback`, tope de 2 s) o al primer toque o tecla sobre una fila (CF-22) | Medido en 06 V6-08: 15.0 KB gzip fuera de lo que se descarga antes de `load` |\n")

# 15.2 (CF-01, CF-19, CF-21)
d05.despues("| OP-47 | `/cuentas/[cuentaId]/conciliar` | [L] | `flujos/cuentas-conciliar/` |\n",
            "| OP-53 **[F6]** | `/cuentas/[cuentaId]/verificar-saldo` | [L] | `flujos/cuentas-verificar-saldo/` |\n")
d05.despues("| OP-07 | `/presupuesto/estructura/grupos/nuevo` | [C] | `flujos/presupuesto-estructura-grupos-nuevo/` |\n",
            "| OP-07 (lote) **[F6]** | `/presupuesto/estructura/plantilla` | [L] | `flujos/presupuesto-estructura-plantilla/` |\n")

# 15.4 (CF-13)
d05.cambiar("| `/bandeja` | `bandeja` | `MovimientoBandeja`, `Resultado`, `Pestanas` (activos, descartados) |",
            "| `/bandeja` | `bandeja` | `MovimientoBandeja`, `Resultado`, `Pestanas` (activos, descartados), **[F6]** `PanelDestinosArrastre` |")
d05.cambiar("| `/` Inicio | `inicio` | `ResumenListoParaAsignar`,",
            "| `/` Inicio | `inicio` | **[F6]** `ResumenListoParaAsignar` (`billete`),")

# Enmiendas posteriores (nueva sección al final)
d05.s = d05.s.rstrip('\n') + """


---

## Enmiendas posteriores

Aprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle. Los textos de este documento ya están actualizados y marcados **[F6]**.

- **CF-01, CF-02, CF-04 a CF-08, CF-10 a CF-13, CF-15, CF-17 a CF-19 y CF-21 a CF-23** (Fase 6, aprobados en las revisiones de `06-features.md`): verificar saldo, flujo de efectivo y reportes accionables, propuestas que abren un flujo, Inicio (hallazgos, pagos próximos y primeros pasos), destino `cuenta`, plantilla de categorías en lote, tema y variables de la identidad visual, roles tipográficos, componentes visuales propios, signo menos U+2212, "categoría nueva", arrastrar a una categoría y notificaciones interceptadas. Tabla en 0.13; detalle en `06-features.md` §0.7, §0.13, §0.14, §3 y §5. CF-03 queda diferido.
"""
d05.n += 1
