# Finn 2.0 · Detalle de categoría: un recorrido (C-52)

Ruta: `/presupuesto/categorias/[categoriaId]` (categoría normal; la de pago de tarjeta no cambia).

Elegida por el dueño el 15/11/2026: **propuesta 1, un recorrido**. Reemplaza el orden y la distribución de S3 en teléfono y computadora.

**Lo que no cambia:**
- Los datos de `detalleCategoria()` (04 §6.3). La interfaz no calcula montos (PF-3).
- Los tokens, los campos v3, C-50 y C-51.
- Los textos aprobados.

## 1. Por qué

Lo que más hace el dueño aquí es revisar en qué se fue la plata, y también actuar (asignar, cubrir, mover) y entender cómo viene en el tiempo. La pantalla de hoy tenía seis problemas:

- Con 45 consumos la lista ocupaba casi todo.
- El calendario y el historial quedaban al fondo.
- En computadora las dos columnas no se equilibraban.
- Las acciones quedaban lejos.
- La jerarquía era plana.
- No había movimiento que acompañara.

## 2. Estructura en el teléfono

En este orden:

1. **Barra superior:** ← (volver a Presupuesto, `aria-label` «Volver a Presupuesto») y ⋯ («Más acciones»).
2. **Encabezado:** grupo (rótulo), nombre (título de 1.75rem) y el **selector de período**:
   - flechas ‹ › de 44 × 44, deshabilitadas cuando no hay período vecino (`navegacion`);
   - debajo de las fechas, «Período actual · quedan {n} días» o «Período cerrado».
3. **Disponible:** la cifra de 3rem, con el color de su estado, y debajo los indicadores (`IndicadorEstado`, PF-2: sin montos).
4. **Cifras:** tarjeta de 3 × 2 con Asignado, Gastado y Arrastre arriba, y Fondo, Entradas y Sobregiro abajo.
5. **Avisos de estado** (forma de C-51) y la **meta** si la hay.
6. **«¿En qué se fue?»:** una tarjeta con dos vistas, en un control segmentado:
   - **«Este período»:** el calendario, con la nota «El punto crece con el gasto del día. Tocá un día para ver sus consumos.»;
   - **«Últimos {n}»:** el historial (gráfico, y «Ver como tabla»).
7. **Consumos:** título con su cantidad, los filtros y la lista por semana (§4).
8. **Programadas** de la categoría (nombre, «Próxima: dd/mm» y monto) y **Reglas** (fichas con el patrón), si las hay.
9. **Barra de acciones** fija al pie, sobre la navegación (§5).

## 3. Estructura en la computadora

- Grilla de **380 px + el resto**, con 40 px de separación.
- **Columna izquierda, fija** (`position: sticky; top: 0`) mientras la derecha se desplaza. Lleva:
  - la barra superior;
  - el encabezado y el selector de período;
  - el Disponible y las cifras;
  - los avisos y la meta;
  - **las acciones**, dos botones a lo ancho;
  - programadas y reglas.
- **Columna derecha:**
  - una tarjeta con **«En el período»** (calendario) y **«Últimos {n} períodos»** (historial) **lado a lado**, sin el control segmentado, porque hay espacio;
  - debajo, los consumos (§4).
- **«Más acciones»** es el botón con texto de E4-8, arriba a la derecha de la columna izquierda; en el teléfono, el ⋯ de la barra superior.

## 4. Consumos

- **Orden:** del más reciente al más antiguo. El servidor los manda en el orden en que se cubren (D2, del más antiguo al más reciente); la interfaz los invierte.
- **Explicación del orden:** si hay alguno sin cubrir, encima de la lista va «Lo asignado cubre los consumos del más antiguo al más reciente: los últimos son los que quedaron sin cubrir.».
- **Semanas:** de lunes a domingo, recortadas al período. Título «5–11 oct» o «28 sep – 4 oct», y a la derecha «{n} consumos». **No hay subtotales**, porque la interfaz no suma montos.
- **Plegado:**
  - con **más de 10** consumos y sin filtro, solo la semana más reciente arranca abierta;
  - con 10 o menos, o con un filtro o un día elegido, todas abiertas;
  - cada semana es un botón con `aria-expanded`;
  - lo que el usuario abre o cierra se respeta mientras siga en la pantalla.
- **Filtros** (grupo de radios), según lo que haya:
  - «Todos · {n}» va siempre;
  - «No cubiertos · {k}» si k > 0;
  - «Débito» y «Tarjeta» solo si hay de los dos medios;
  - con un solo filtro posible, no se muestran.
- **Día elegido:** tocar un día del calendario filtra la lista por ese día:
  - arriba aparece una píldora `--texto` con «{Viernes} {9} de {oct}» y × («Quitar el filtro del día»);
  - la página baja suave hasta la lista;
  - tocar el mismo día o la × lo quita;
  - un día sin gasto no se puede tocar.
- **Fila:** la misma de hoy:
  - fecha (mes y día);
  - comercio y «{cuenta} · débito / tarjeta»;
  - estado: «cubierto», «cubierto $x · no cubierto $y» o «no cubierto $y», en `--problema-texto` con débito o en `--deuda-sin-respaldo-texto` con tarjeta;
  - barra de cobertura;
  - monto.
- **Vacíos:** «Sin gastos en este período» sin consumos; «Ningún consumo con este filtro.» cuando el filtro no deja ninguno.
- Lógica de referencia: `logica/consumos.js`, que corre con `node logica/consumos.test.js`.

## 5. Acciones

| Situación | Barra (teléfono) y columna izquierda (computadora) |
|---|---|
| Sin sobregiro | **Asignar** (principal, con `plus`) · **Mover dinero** (tonal) |
| Con sobregiro (débito, tarjeta o mixto) | **Cubrir {sobregiro.total}** (principal; abre Asignar con `rapida.cubrirSobregiro`, CA-14.7) · **Mover dinero** |
| Período cerrado | Sin barra: el aviso «Período cerrado» lleva «Ir al período actual» |
| Categoría archivada | Como hoy (Sacar y Desarchivar) |

- El aviso de sobregiro ya no lleva botón: explica, en la forma de C-51.
- **Más acciones** (⋯) lleva «Archivar»:
  - si no se puede, va deshabilitado y con su motivo debajo, por ejemplo «No se puede archivar: tiene Disponible distinto de cero.» (E4-29);
  - ya no hay botón deshabilitado al pie.

## 6. Avisos

- **Sobregiro con débito o mixto:**
  - tono problema, con el borde de C-51;
  - título «Sobregiro con débito o efectivo · {total}»;
  - texto «Con débito {d} · con tarjeta {t}. Al cerrar el período, Listo para asignar bajará {d}.».
- **Deuda sin reservar** (solo tarjeta):
  - glifo `card` en `--deuda-sin-respaldo-texto`;
  - título «Deuda sin reservar en {categoría} · {monto}»;
  - texto «Esta deuda suma a lo que te falta reservar para {tarjeta}.».
- **Período cerrado (D-5):**
  - tono información;
  - título «Período cerrado · {fechas}»;
  - texto «No se puede cambiar lo asignado en un período cerrado.»;
  - enlace «Ir al período actual»;
  - calendario sin hoy ni días futuros.

## 7. Calendario e historial

- **Calendario:**
  - grilla de lunes a domingo; los días fuera del período quedan vacíos;
  - hoy lleva el anillo `--enlace`; los días futuros, en `--texto-terciario`;
  - el punto mide entre 6 y 18 px según `intensidadBp`;
  - cada día es un botón con nombre: «viernes 9 de oct, gastaste $23.10» o «…, sin gasto», con `aria-pressed`;
  - el día elegido se invierte (fondo `--texto`).
- **Historial:**
  - cabecera: promedio (`historialResumen.promedioGastado`) y «Se pasó {k} de {n}» con `dang` cuando k > 0;
  - barras de lo gastado: `--grafico-tinta`, o `--problema-texto` cuando se pasó;
  - marca de lo asignado: `--grafico-referencia`;
  - leyenda Gastado · Asignado;
  - «Ver como tabla» en el teléfono; la tabla tiene Período, Asignado, Gastado y Disponible;
  - el alto de cada barra es solo escala de dibujo.

## 8. Movimiento

| Qué | Cómo se mueve | Duración y curva | Con `prefers-reduced-motion` |
|---|---|---|---|
| **Presupuesto → detalle** | El nombre y el Disponible de la fila viajan a su lugar en el encabezado: View Transitions (`document.startViewTransition` y `view-transition-name: cat-nombre-{id}` y `cat-disp-{id}` en la fila y en el encabezado). Sin soporte, FLIP con `element.animate`: se mide antes y después y se anima `translate` + `scale` desde la posición de la fila. Al volver, el mismo camino al revés | `--duracion-transicion` (340 ms), `--curva-entrada` | Cambio directo |
| **Entrada al detalle** | Cada sección sube 8 px y aparece (`opacity` 0 → 1), escalonada 40 ms por orden: barra superior, selector, Disponible, cifras, avisos y meta, «¿En qué se fue?», consumos, programadas y reglas | `--duracion-normal`, `--curva-entrada` | Sin animación |
| **Barra de acciones** | Sube 8 px y aparece, 120 ms después del encabezado | `--duracion-normal`, `--curva-entrada` | Sin animación |
| **Barras del historial** | Crecen desde la base (`scaleY` 0 → 1, origen abajo), escalonadas 30 ms, la primera vez que se ven | `--duracion-lenta` (400 ms), `--curva-entrada` | Aparecen ya dibujadas |
| **Cambiar de vista** («Este período» ↔ «Últimos n») | El fondo del segmento se mueve; el contenido sube 8 px y aparece | `--duracion-normal`, `--curva-estandar` / `--curva-entrada` | Sin animación |
| **Tocar un día** | El día se invierte; su punto crece a 1.15. La lista se funde con el filtro nuevo; la píldora del día sube y aparece; la página baja suave hasta la lista | Día: `--duracion-rapida`; punto: `--duracion-normal`, `--curva-enfasis`; lista: `--duracion-normal`, `--curva-entrada` | Sin animación; desplazamiento instantáneo |
| **Filtros** | La ficha elegida cambia de fondo y color; la lista se funde | `--duracion-rapida`, `--curva-estandar` | Sin transición |
| **Abrir o cerrar una semana** | El alto se abre o se cierra (`grid-template-rows` 1fr ↔ 0fr) y la flecha gira 180° | `--duracion-normal`, `--curva-estandar` | Instantáneo |
| **Cambiar de período** (‹ ›) | Igual que la entrada al detalle | Como la entrada | Sin animación |
| **Más acciones** | El menú sube 8 px y aparece | `--duracion-rapida`, `--curva-entrada` | Sin animación |

Nunca se animan cifras: el Disponible no cuenta desde cero, porque mostraría montos que el servidor no dio (PF-3).

## 9. Accesibilidad

- **Anuncios** en la región `role="status"` de la pantalla:
  - «Detalle de {categoría}» al entrar;
  - «Consumos del {9} de {oct}» o «Todos los consumos del período» al elegir o quitar un día;
  - el nombre del filtro;
  - «Período {fechas}, cerrado» o «Período actual: {fechas}» al cambiar de período.
- **Calendario:** `role="group"` con nombre; días como botones; los que no tienen gasto, deshabilitados.
- **Filtros:** `role="radiogroup"`. **Vista:** segmentado con `role="radio"`. **Semanas:** botones con `aria-expanded`.
- Todo tocable mide 44 × 44 o más. El foco lleva el anillo `--foco`.
- Tres señales por estado: color, glifo y nombre.
- La barra fija no tapa el último contenido: la página reserva su alto al final.

## 10. Textos nuevos

«¿En qué se fue?» · «Este período» · «Últimos {n}» · «Últimos {n} períodos» · «Período actual · quedan {n} días» · «Período cerrado» · «Período anterior» · «Período siguiente» · «Todos · {n}» · «No cubiertos · {k}» · «Débito» · «Tarjeta» · «{n} consumos» y «1 consumo» · «Lo asignado cubre los consumos del más antiguo al más reciente: los últimos son los que quedaron sin cubrir.» · «Ningún consumo con este filtro.» · «Quitar el filtro del día» · «Próxima: {dd/mm}» · «Volver a Presupuesto» · los anuncios de §9.

Se mantienen: «Sin gastos en este período», «El punto crece con el gasto del día. Tocá un día para ver sus consumos.», «Ver como tabla», «Cubrir {monto}», «Asignar», «Mover dinero», «Más acciones», «Archivar» y su motivo, «Se pasó {k} de {n}» y «gastado en promedio por período».

## 11. Alternativas descartadas

- **Propuesta 2, pestañas:** ordena bien, pero esconde la lista detrás de una pestaña y obliga a saltar entre Resumen y Consumos para cruzar un día con sus gastos.
- **Propuesta 3, tablero y lista aparte:** la tarea más frecuente queda a un toque más, en otra capa.
- **La lista de 10 con «ver el resto»:** con 45 seguía ocupando casi todo.
- **Subtotales por semana:** la interfaz sumaría montos.
- **Contar el Disponible al entrar:** cifras que el servidor no dio.
- **Botón flotante de Asignar:** tapa la lista y no deja ver la segunda acción.
- **Calendario y lista en dos columnas en el teléfono:** no caben a 390 px.
- **Ordenar en el orden de cobertura (D2):** lo más reciente quedaba al final. La línea de explicación cubre el porqué de «no cubierto».
- **Dejar «Cubrir» dentro del aviso:** C-51 no admite botones con fondo en un aviso, y la acción quedaba lejos del pulgar.
