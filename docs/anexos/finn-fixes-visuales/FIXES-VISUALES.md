# Finn 2.0 · Fixes visuales (entrega 3)

Este documento le dice a los agentes de desarrollo qué corregir en la app para que coincida con el diseño. Sale de una auditoría de 75 hallazgos (`auditoria/AUDITORIA.md`, con 236 capturas de evidencia). Esa auditoría comparó la demo navegable con los tableros, `PANTALLAS.md` y el prototipo de movimiento.

**Qué fuente manda, en este orden:**

1. **Tableros y PNG de la entrega 2.** Están en `finn-diseno-export-2/pantallas/*` (ya entregados) y en `finn-tokens/referencia/*`, con los tableros S1–S7 y K1–K5. Mandan en composición, jerarquía y estados.
2. **`tokens.css`.** Es la única fuente de color, tipografía, espacio, radio, elevación, duración y curva. `estilos/tokens-propuesta.css` solo trae propuestas, marcadas como tales; las 8 tarjetas de color ya están aprobadas.
3. **La demo navegable.** Es `demo/finn-demo.html` (se abre en el navegador, sin servidor) y es la **implementación de referencia** para el movimiento, el responsive y los flujos nuevos. Si un fix dice "como en la demo", copiá el comportamiento, no el código: la demo es HTML de una sola pieza.
4. **`auditoria/AUDITORIA.md`.** Trae el detalle de cada hallazgo: qué se ve, la referencia exacta y el arreglo con medidas. Los ids (A1, B4, C2…) son los mismos en este documento.

> Nota: los arreglos de `AUDITORIA.md` nombran funciones de la demo (`v2Tile`, `render()`, `SCR.bandeja`). En la app, llevalos a su componente equivalente. Lo que cuenta es la medida, el token y el comportamiento.

---

## 1 · Reglas que valen para todo

- **Solo tokens.** No se usan hex, px de color ni duraciones sueltas. Si falta un valor, se propone en `tokens-propuesta.css` con un comentario y no se inventa en el componente.
- **Tres señales por estado:** color, glifo y texto. Nunca alcanza solo el color, tampoco en los gráficos (glifo `problema` bajo el mes que se pasó).
- **Signo menos U+2212 (−)** en los montos negativos, nunca el guion. Las cifras van con `font-variant-numeric: tabular-nums`.
- **Voseo** en todo el texto: "Elegí", "Reservá", "Te falta reservar".
- **Resultados en el lugar.** Después de una acción, el resultado aparece donde estaba el elemento y no se va solo. Aprobar no ofrece "Deshacer". Descartar ofrece "Restaurar" en la pestaña Descartados.
- **Tocables de 44 × 44 como mínimo,** aunque el dibujo sea de 36, 38 o 40. Se agranda el área con `::after { inset: -4px 0 }`.
- **Reducir movimiento.** Con `prefers-reduced-motion: reduce` no se anima nada. La regla de `tokens.css` ya anula `animation` y `transition`. Lo que se mueva por JS (cifras que ruedan, retrasos con `setTimeout`) tiene que consultar `matchMedia` y saltar directo al estado final.

## 2 · Densidad y escala ("se ve más grande, más grueso y apretado")

La causa no es un solo valor. Son estas cuatro cosas juntas, y hay que corregirlas todas:

1. **Archivo tiene que cargar con el eje de ancho.** `.t-cifra-principal` usa `font-stretch: 72%` y `.t-cifra` `80%`. Si la fuente carga sin el eje `wdth`, o cae al respaldo del sistema, las cifras salen anchas y pesadas, y eso se ve "grueso".
   - Usar `fuentes/archivo-latin-wdth-wght.woff2` autoalojada, declarada con `font-stretch: 62% 125%; font-weight: 100 900` (ver `estilos/fuentes.css`), o Google Fonts `Archivo:wdth,wght@62..125,100..900`.
   - Big Shoulders Display se carga en 700 y 800.
   - Verificación: en DevTools, "$312.40" en el billete (3.25rem, 52 px) mide unos 160 px de ancho con la fuente bien cargada. Si mide bastante más, la fuente no cargó con el eje de ancho.
2. **La computadora se diseña a 1440 px y no se agranda.**
   - Contenido con `max-width: 1144px` y relleno `32px 48px` arriba, `20px 48px 48px` en el cuerpo.
   - Columnas con `gap: 36px`.
   - Los flujos y las listas de Más secciones van con `max-width: 720px`.
   - Los gráficos no escalan con el ancho: tienen `max-width: 360px` y la tabla va al lado (B11).
   - No usar unidades `vw` en la tipografía.
3. **Escala de roles sin desvíos.** Los valores son los de `tokens.css`:

   | Rol | Tamaño y estilo |
   |---|---|
   | `t-titulo-pantalla` | 2rem; 1.625rem en las hijas de teléfono |
   | `t-titulo-seccion` | 1.375rem |
   | `t-cuerpo` | 1rem / 1.5 |
   | `t-cuerpo-pequeno` | .875rem / 1.45 |
   | `t-cifra` | 1.25rem |
   | `t-cifra-principal` | 2.75rem; 3.25rem solo en el héroe de los detalles |

   Nada por debajo de .75rem (E4).
4. **Aire entre bloques.**
   - Barra lateral: `padding: 24px 14px`, `gap: 22px`, ítems de Más a 40 px de alto y .875rem en `--texto-secundario`.
   - Filas de lista: título en una línea con elipsis y subtítulo en una línea (B8).
   - Montos y etiquetas que no se parten: `white-space: nowrap` en el valor (B7).

## 3 · Catálogo de movimiento

Curvas y duraciones de `tokens.css`: `--duracion-rapida` 120 ms, `--duracion-normal` 220 ms, `--duracion-transicion` 340 ms, `--duracion-lenta` 400 ms, y `--curva-estandar`, `--curva-entrada`, `--curva-salida` y `--curva-enfasis`. Todos los keyframes de abajo están en la demo.

| Dónde | Qué se mueve | Cómo |
|---|---|---|
| Cambio de pantalla | Entra el contenido | Pestaña: fundido de 220 ms. Hija: entra desde la derecha 320 ms `--curva-entrada`. Volver: desde la izquierda. Flujo: sube. |
| Entrada de pantalla | Bloques de arriba abajo | `fz-item` (opacidad 0 y 8 px abajo → 0) en 400 ms `--curva-estandar`, con 60 ms entre bloques (90 ms en las columnas de computadora). |
| Listas | Filas | `fz-item` 400 ms, 60 ms entre filas, con tope de 8 filas. |
| Hoja inferior | Abre / cierra | Abre: `translateY(100%)→0` 380 ms `--curva-entrada`. Cierra: al revés en 200 ms `--curva-salida` y **recién después se desmonta**. En computadora, panel lateral `translateX`. |
| Velo | Abre / cierra | Opacidad, 200 ms. |
| Menú (K2) | Abre / cierra | Desde la esquina; al cerrar `opacity 0; scale(.96)` en 120 ms. |
| Panel de notificaciones | Abre / cierra | Baja / sube en 200 ms. Los avisos entran con 120 ms + 60 ms × i. |
| Opciones de Más secciones | Filas | `fz-item` 300 ms con 40 ms × i. |
| Botones, pastillas, segmentos | Presionar | `:active { transform: scale(.97) }` 120 ms. Fondo y color con transición de 220 ms. El indicador del segmentado se desliza (C7). |
| Filas tocables (computadora) | Hover | Fondo al 6 % de `--texto` y la flecha se mueve 4 px. |
| Código TOTP | Escribir | La casilla llena hace `fz-pop-in` y sube 2 px con borde inferior de 3 px en `--accion`. Avanza sola. Pegar reparte los 6 dígitos con 40 ms entre casillas. Retroceso en una casilla vacía vuelve a la anterior. |
| Código TOTP | Error | `fz-jitter` 380 ms y bordes `--problema-borde`. |
| Código TOTP | Correcto | Casillas en `--positivo-fondo` en cascada (40 ms × i), check con `fz-pop-in` 400 ms y la navegación a los 650 ms. |
| Billete (Listo para asignar) | Ambiente | El guilloché deriva (`fz-drift` 40 s, alterno). Detrás, un resplandor `--accion` con blur de 22 px que respira (`fz-glow` 6 s). El brillo pasa cada 7 s. |
| Billete | Primera entrada de la sesión | Las cifras ruedan: cada carácter `translateY(100%)→0` en 600 ms, 60–90 ms entre caracteres. Una sola vez por sesión. |
| Montos | Cambio de valor | Si el monto cambió desde la última vez que se dibujó, hace un destello de 600 ms: sube 4 px en `--positivo-texto` si aumentó y baja en `--problema-texto` si bajó. Aplica a billete, Disponible de la categoría, pagos de tarjeta y totales. |
| Aprobar en la Bandeja | Fila → resultado | La fila sale (`opacity→0; translateX(24px)` en 240 ms `--curva-salida`), el alto colapsa y el **resultado entra en el mismo lugar** con `fz-pop-in` 340 ms `--curva-enfasis`. El contador de Bandeja rebota (escala .85→1). |
| Estados vacíos | Entrada | El disco hace `fz-pop-in` 400 ms `--curva-enfasis`; el texto, `fz-item` con 80 ms de retraso. |
| Gráficos | Entrada | Barras que crecen desde la base: `fz-barup` 700 ms, 80 ms entre barras. La dona se dibuja por `stroke-dashoffset` en 800 ms. Las barras horizontales usan `fz-grow` 800 ms. |
| Indicador de navegación | Cambio | La marca de 3 px de la barra lateral y la pastilla de la barra inferior hacen `fz-pill` 400 ms. |

## 4 · Responsive

- **Teléfono (≤ 520 px):**
  - La app ocupa todo el ancho y `100dvh`, sin marco ni radio.
  - Las reglas móviles van **después** de las base, o con más especificidad. Esta fue la causa de B4: la media query estaba antes y la anulaba la regla base.
- **Computadora:**
  - El "Atrás" va en su propia línea arriba del título (`.t-cuerpo-pequeno`), nunca superpuesto (B1).
  - Las columnas colapsan a una sola por debajo de unos 900 px de contenedor (`@container`).
  - Flujos y formularios con `max-width: 720px` y el pie alineado al contenido (B2).
- **Barra superior del teléfono:**
  - Las pestañas llevan Registrar, campana y ☰.
  - Las hijas llevan la flecha "Volver a X" en la misma fila, a la izquierda del título.
  - Las pantallas de Más secciones y los flujos llevan solo la campana o nada.
  - Si el título no entra, Registrar queda solo con ícono de 44 (B6).
- **Pastillas de filtro:** la fila sangra hasta el borde y se desplaza sin barra visible.

## 5 · Hallazgos por pantalla

Estado en la demo:

- **✔ demo**: ya está corregido en la demo publicada y se puede copiar de ahí.
- **◐ demo**: corregido en parte (dice qué falta).
- **○ spec**: solo especificado; el detalle está en `AUDITORIA.md`.

Prioridad: **A**lta, **M**edia, **B**aja.

### Acceso
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| C6 / D2 | A | El TOTP avanza solo, se puede pegar, Retroceso vuelve, temblor en error y cascada con check al verificar (§3). | ✔ demo |
| B10 | M | Tocables de 44. | ✔ demo |

### Inicio
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| C4 | M | Billete con deriva, resplandor y cifras que ruedan una vez. | ✔ demo |
| C3 | M | Destello de los montos que cambian. | ✔ demo |
| C5 | M | Entrada escalonada de los bloques. | ✔ demo |
| A31 | M | Enlaces con flecha `arrowR` que se mueve al pasar. Faltan las piezas nuevas de §5 que no están en la demo. | ◐ demo |
| D6 | A | Resultados en el lugar. La acción siguiente coincide con el paso pendiente de Primeros pasos, sin duplicarlo. | ◐ demo (Bandeja sí; Primeros pasos no) |

### Presupuesto
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| A2 / E1 | A | Los pagos de tarjeta van en una **fila propia**. Muestra lo que falta reservar en `--deuda-sin-respaldo-texto` (o la reserva excedente en `--informacion-texto`, o $0.00 en `--texto`) y "Disponible para pagar $X" más el indicador. Sin "+". | ✔ demo |
| A3 | M | Rejilla de Totales (Asignado · Gastado · Disponible) en caja `--superficie-hundida`, radio 16. | ✔ demo |
| A1 | M | Pastillas sin borde, inactiva en `--superficie-hundida` y activa en `--texto` / `--fondo`. | ✔ demo |
| A4 | A | En computadora: tabla Categoría · Asignado · Gastado · Disponible a 1.7fr, con filas de 56 px y encabezado con línea de 2 px. A la derecha van la franja, Pagos de tarjeta y Totales. | ○ spec |
| D10 | M | Período anterior (cerrado: candado, sin "+", sin franja) y siguiente (solo lo asignado). "Ir al período actual" como enlace. | ○ spec |
| B6 | M | Título sin truncar (Registrar solo con ícono cuando no entra). | ✔ demo |

### Detalle de categoría
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| A8 / D11 | A | **Categoría de pago de tarjeta con su propia pantalla:**<br>• Héroe "Te falta reservar $X" en `--deuda-sin-respaldo-texto` (o "Pago reservado" en positivo).<br>• Rejilla Deuda · Reservado · Te falta.<br>• Sección "Para no generar intereses" (contado y mínimo).<br>• Botón principal **"Reservar $X"**, que abre Asignar con el monto precargado; con todo reservado, "Pagar la tarjeta".<br>• Lista de pagos y nada de historial de gasto. | ✔ demo |
| A6 | A | Rótulo del grupo; rejilla 3 × 2 (Asignado, Arrastre, Fondo, Entradas, Gastado, Sobregiro); nota y barrita cubierto / no cubierto por consumo; calendario "En el período"; sección Reglas; Archivar deshabilitado con motivo. | ○ spec |
| A7 | M | Glifo `problema` bajo el mes que se pasó y "Se pasó" en la leyenda del gráfico. | ◐ demo (solo la tabla lleva glifo) |
| D9 | M | Historial calculado con las transacciones reales. Sin datos: caja "Gráfico sin datos". No va en las categorías de pago ni en las de ahorro sin gasto. | ◐ demo (sin datos inventados en categorías vacías y de pago) |
| A9 | B | Con meta: resumen de la meta y el botón con el monto. | ○ spec |
| B11 | M | Gráfico con ancho máximo de 360 px en computadora y la tabla al lado. | ○ spec |
| A36 | B | Hoja Asignar: foco automático, campo con relleno y opción preseleccionada con lo que falta. | ◐ demo (preselección sí) |

### Bandeja y Revisar
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| C2 | A | Aprobar con un toque: la fila sale, el resultado queda en su lugar y el contador rebota (§3). | ✔ demo |
| A11 | A | Computadora: lista a la izquierda y **panel de revisión** del movimiento elegido a la derecha (fijo al desplazar). La fila elegida lleva el fondo hundido y una marca de 3 px en `--accion`. | ✔ demo |
| A10 | M | Acciones en cada fila según su clase (Elegir categoría, Ver la programada, Es un duplicado…), no solo en "Listo". | ○ spec |
| A12 / D8 | M | Revisar con selector **Tipo** (Gasto, Pago de tarjeta, Devolución) y EntradaFecha. | ○ spec |
| A13 | B | Sin campana en los flujos largos. | ✔ demo |

### Registrar
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| D3 | A | **Dividir:**<br>• Líneas `[1fr][120][44]` con categoría o deudor ("Alguien me lo debe" → por cobrar), monto a la derecha y "Quitar línea".<br>• "+ Agregar línea" y la fila "Suma de las líneas $X de $Total".<br>• Si la suma no da el total: "Faltan $X por repartir…" y Guardar deshabilitado con motivo.<br>• Impacto "Antes de guardar" por línea. | ✔ demo |
| B2 | A | Computadora: dos columnas (datos a la izquierda; dividir, impacto y Guardar a la derecha), con un máximo de 720 px por columna. | ○ spec |
| D4 | M | Tipos según las cuentas (Inversión, Desembolso, Avance, Transferencia de deuda) y Devolución conectada. | ○ spec |

### Cuentas
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| D1 | A | **Crear cuenta corriente, de ahorro o billetera:**<br>• En Nueva cuenta → Efectivo, segmentado **Corriente · Ahorro · Billetera** con la ayuda debajo; el nombre se propone según el subtipo.<br>• Billetera oculta Institución y Últimos 4. Institución y Últimos 4 no se precargan (placeholder; ahí se colaba "3310").<br>• La tarjeta de la cuenta decide su identidad por el **motivo guardado**, no por el nombre: corriente → libreta, ahorro → monedas/anillos, billetera → ícono `wallet` sin motivo de fondo (provisorio; la identidad propia falta).<br>• La cuenta de ahorro no se ofrece como origen por defecto de "Pagar tarjeta". | ✔ demo (salvo el origen de "Pagar tarjeta") |
| — | M | **Tarjeta de crédito:** al crearla se elige uno de los **8 colores** (oro, plata, grafito, zafiro, rubí, esmeralda, amatista, cobre; tokens `--tarjeta-*` y `-texto`) y la red (Visa o Mastercard). La vista previa se actualiza en vivo. | ✔ demo |
| A16–A19 | M | Detalles de corriente / ahorro, tarjeta (con "Para no generar intereses" y "Reservar $X" como acción principal), préstamo e inversión, completos según el tablero 06. | ◐ demo (tarjeta: Reservar sí) |
| D5 | M | Alta de préstamo e inversión (formularios cortos). | ○ spec |
| A20 | B | Vacío "Esta cuenta todavía no tiene movimientos" con su entrada. | ✔ demo |

### Actividad y transacción
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| A14 | M | Buscador con línea; filas con título en una línea y la línea de metadatos; "Cargar más". En computadora, columna de filtros. | ○ spec |
| B8 | M | Interlineado: el título no se parte en dos líneas pegadas. | ○ spec |
| A15 | M | Detalle de transacción con las piezas que faltan. | ○ spec |
| D12 | B | Editar transacción y Pagar cuota conectados. | ○ spec |

### Reportes
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| D7 | A | **Gasto semanal conectado:**<br>• "Esta semana $X" con la diferencia contra la referencia semanal.<br>• Barras por semana con la semana en curso en `--accion` y las futuras rayadas.<br>• Tope de referencia y leyenda.<br>Falta el resto del tablero S7: pastillas de categorías, Gráficos / Tabla, acumulado y "Contra los 3 anteriores". | ◐ demo |
| A26 / C10 | M | Gráficos con el lenguaje v2 (degradados, topes, leyenda) y entrada animada. | ◐ demo (semanal sí) |

### Más secciones, ajustes y estados
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| A21–A25 | B–M | Metas (no lista plana), Programadas (insignia de fecha nueva y estados), Por cobrar, Reglas (buscador y alta), Notificaciones. | ○ spec |
| A33 / C8 | B | Hoja Más secciones plana, con opciones escalonadas. | ◐ demo (escalonado sí) |
| A34 / E2 | M | Detalle de Listo para asignar; dentro del billete todo va en `--texto-sobre-marca`. | ○ spec |
| A30 / B9 | B | Estructura: "Editar grupo" centrado con 44 de alto. | ○ spec |
| A35 | B | Sin conexión y error de pantalla con el diseño. | ○ spec |
| E3 | B | Campos con relleno `--superficie` también dentro de las hojas. | ○ spec |

### Marco y movimiento global
| Id | P | Qué hacer | Estado |
|---|---|---|---|
| B1–B4 | A | Atrás en su línea, máximos de ancho, columnas que colapsan y reglas móviles al final. | ✔ demo |
| B5 / B7 / B10 | M | Montos que no se parten y tocables de 44. | ✔ demo |
| C1 | A | Hojas, menús y panel se cierran con animación y se desmontan después. | ✔ demo |
| C7 / C9 / C11 / C12 | M–B | Presionado, vacíos, hover y duraciones de §11. | ✔ demo (falta el indicador deslizante del segmentado) |
| A5 | M | Hijas con la flecha en la fila del título. | ✔ demo |
| E4 | B | "Opcional" a .875rem en `--texto-terciario`. | ✔ demo |

## 6 · Cómo verificar cada fix

Para cada id:

1. Abrí la pantalla en teléfono (390 × 844) y en computadora (1440 × 900), en claro y en oscuro.
2. Comparala con el PNG del tablero que cita `AUDITORIA.md`, y para el movimiento con la demo.
3. Activá "reducir movimiento" en el sistema y confirmá que todo llega a su estado final sin animar.
4. Revisá que no haya hex ni duraciones sueltas en el diff (`grep -E "#[0-9a-fA-F]{3,6}|[0-9]+ms"` fuera de `tokens.css`).
5. Medí los tocables (≥ 44) y el contraste del texto nuevo (≥ 4.5:1).
6. Dejá en el PR una captura de antes y después por id, en las dos vistas.

## 7 · Qué trae este paquete

| Ruta | Qué es |
|---|---|
| `FIXES-VISUALES.md` | Este documento. |
| `PROMPT-AGENTES.md` | El prompt para los agentes de desarrollo. |
| `demo/finn-demo.html` | La demo navegable con los fixes aplicados (referencia de movimiento y flujos). |
| `demo/capturas-despues/` | Capturas de la demo corregida en los puntos nuevos. |
| `auditoria/AUDITORIA.md` | Los 75 hallazgos con arreglo y medidas. |
| `auditoria/capturas/` | La evidencia de cada hallazgo, con el id en el nombre del archivo. |
| `estilos/` | `tokens.css`, `tokens-propuesta.css` (8 colores de tarjeta), `fuentes.css`. |
| `fuentes/` | Archivo (con eje de ancho) y Big Shoulders Display, autoalojadas. |

Los PNG de cada pantalla y estado están en `finn-diseno-export-2.zip` (entrega 2), que no se repite aquí.
