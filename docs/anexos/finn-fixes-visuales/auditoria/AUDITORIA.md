# Finn 2.0 · auditoría visual de la demo navegable

Auditado: `demo/finn-demo.html` (compilado 08:16). Referencias: `finn-tokens/referencia/*` (S1–S7, K1–K5), `finn-tokens/PANTALLAS.md`, `finn-tokens/AGENTES.md`, `finn-diseno-export-2/pantallas/*` (entrega 2) y `finn-diseno-export/prototipo/Prototipo-v2-Claro.html` (movimiento).

## 0 · Cómo se hizo y qué conviene saber antes de leer

- Capturas con Playwright y las fuentes reales (Archivo y Big Shoulders Display inyectadas desde `finn-diseno-export-2/fuentes/`). Las 51 rutas de `SCR` (con parámetros reales de los datos de ejemplo) se capturaron en **teléfono claro** (`__tc`), **teléfono oscuro** (`__to`) y **computadora claro** (`__dc`, a 1280 px), a altura completa del contenido: `capturas/r_<ruta>-<param>__<variante>.png`. Las hojas, menús y paneles están en `capturas/h_*`; los estados forzados y vacíos en `capturas/e_*`; el recorrido desde cero en `capturas/w01…w38_*`; la página a 390 y 768 px en `capturas/P390_*` y `capturas/P768_*`. Los recortes de evidencia llevan el id del hallazgo (`capturas/A_*`, `capturas/B_*`).
- Contraste: se midió el texto real de las 51 rutas y 7 hojas en claro y oscuro (color efectivo contra el fondo compuesto). **Ningún texto queda por debajo de 4.5:1** (el mínimo es 4.55:1, "Algo falló al procesarlo" en `problema-texto`). Por eso la categoría E es corta. No se miden los textos sobre degradados (tarjetas y billete).
- Tocables: se midió cada `button`, `a`, `[data-a]` e `input` en teléfono (resultado en B10).
- **Aviso importante.** Mientras se auditaba, el código fuente siguió cambiando: `app.css`, `app.js`, `screens1.js` y `screens3.js` son posteriores al HTML auditado, y existe `demo/finn-demo-next.html` (08:35) compilado con esos cambios. Ese build ya trae el arreglo de varios hallazgos. Cuando pasa, el hallazgo dice **"(en curso en -next)"**. Son: el TOTP con casillas, avance, temblor y check; el presionado `scale(.97)` y las transiciones de pastillas y segmentos; la barra lateral con "Más", `it2` y el contador en `--marca`; el "Atrás" en fila propia en computadora; `.flowd` a 720 px en flujos de computadora; el interruptor K2; el subtipo de efectivo; y la computadora dibujada a 1440 × 900 y escalada. Hay que volver a verificarlos sobre el build final.

**Recuento**

| Categoría | Hallazgos | Alta | Media | Baja |
|---|---|---|---|---|
| A · Diseño v2 no aplicado o sin diseño | 36 | 5 | 19 | 12 |
| B · Responsive | 11 | 4 | 6 | 1 |
| C · Movimiento | 12 | 3 | 4 | 5 |
| D · Flujos y detalles faltantes | 12 | 5 | 6 | 1 |
| E · Color y contraste | 4 | 0 | 2 | 2 |
| **Total** | **75** | **17** | **37** | **21** |

---

## A · Pantallas que no aplican el diseño v2

### A1 · Pastillas de filtro con borde — Presupuesto y Reportes · tc/to/dc · media
- **Se ve:** las pastillas inactivas (Sobregiradas, Sin fondos, Cubiertas; Categorías, Ingresos y gastos…) son contorneadas, con borde de 1 px y fondo transparente. `capturas/A_chips_borde__tc.png`, `capturas/r_reportes-tendencia__tc.png`, `capturas/r_presupuesto__to.png`.
- **Referencia:** PANTALLAS §2.3. La inactiva lleva fondo `--superficie-hundida`, texto `--texto` y sin borde. `S2-Presupuesto__telefono-claro.png`, `D3-…/todas__telefono-claro.png`, `04-reportes/tendencia__telefono-claro.png`.
- **Arreglo:** `.chip { border: none; background: var(--superficie-hundida); height: 40px; padding: 0 14px; border-radius: var(--radio-pastilla) }` y la activa con `background: var(--texto); color: var(--fondo); font-weight: 700`. La fila sangra hasta el borde del teléfono (`margin: 0 -20px; padding: 0 20px`) y no muestra barra de desplazamiento (D3).

### A2 · Pagos de tarjeta dibujados como categorías — Presupuesto · tc/to/dc · alta
- **Se ve:** Visa Oro aparece como fila de categoría con barra, botón "+", "Deuda $390.00 · Reservado $300.30" y el número principal **$300.30 en verde**, mientras el indicador dice "Te falta reservar $89.70". El color contradice el estado. `capturas/A_pagos_tarjeta_como_categoria__tc.png`.
- **Referencia:** §2.7 Fila de pago de tarjeta. `S2-Presupuesto__telefono-claro.png` muestra "Visa Oro $18.75" en `--deuda-sin-respaldo-texto`, "Disponible para pagar $623.43" y el indicador a la derecha.
- **Arreglo:** una fila propia `v2PayRow`, con el nombre 600 y, a la derecha, lo que falta reservar en `--deuda-sin-respaldo-texto` (o la reserva excedente en `--informacion-texto`, o $0.00 en `--texto`). Debajo, "Disponible para pagar $X" en `.t-cuerpo-pequeno` más el indicador (2.4). Sin botón "+": la acción "Reservar" vive en el detalle.

### A3 · Falta la rejilla de Totales — Presupuesto · tc/dc · media
- **Se ve:** la lista termina en "Editar grupos y categorías". `capturas/r_presupuesto__tc.png`.
- **Referencia:** §5, punto 5. Rejilla de 3 en caja `--superficie-hundida`, radio 16: Asignado · Gastado · Disponible. `S2-Presupuesto__telefono-claro.png`.
- **Arreglo:** caja hundida con padding 14 16 y grid de 3 columnas. Cada celda lleva `.t-rotulo` `--texto-secundario` más el valor `.t-cifra` 700 con `tabular-nums`. En computadora va en la columna derecha, debajo de Pagos de tarjeta.

### A4 · Presupuesto en computadora sin tabla y con las columnas invertidas · dc · alta
- **Se ve:** la columna izquierda tiene el período, la franja, "Mover dinero" y "Auto-asignar"; la derecha repite las tarjetas del teléfono con los botones "+". `capturas/r_presupuesto__dc.png`.
- **Referencia:** §5 Computadora y §2.6. Arriba van el período y los filtros en dos columnas. Abajo, una tabla Categoría · Asignado · Gastado · Disponible (columnas de 110 px a la derecha, encabezado con línea de 2 px `--texto`) a 1.7fr; a la derecha, la franja, Pagos de tarjeta y Totales. `S2-Presupuesto__computadora-claro.png`.
- **Arreglo:** un `dbody` propio con `grid-template-columns: minmax(0,1.7fr) minmax(0,1fr)`. La tabla lleva `<table class="tb">` con filas de 56 px, el nombre y los indicadores en la primera celda, y el grupo como fila `.t-rotulo`.

### A5 · Barra superior de las pantallas hijas con "Atrás" en una fila aparte — todas las hijas · tc/to · media
- **Se ve:** "← Presupuesto" (o Cuentas, Actividad, Ajustes) queda en una fila propia sobre el título, y el título baja unos 40 px. `capturas/r_categoria-k-rest__tc.png`, `capturas/r_cuenta-c1__tc.png`.
- **Referencia:** §3.1. En hijas va la flecha "Volver a <padre>" de 44 a la izquierda del título (margen −8) y el título a 1.625rem en la misma fila. `S3-Detalle__telefono-claro.png`, `06-…/corriente__telefono-claro.png`.
- **Arreglo:** en `render()` (app.js), para `v.child` poner `lead = <button class="ib" aria-label="Volver a ${v.back}">arrowL</button>` dentro de `header.top.child` y quitar `.crumb`.

### A6 · Detalle de categoría incompleto · tc/to/dc · alta
- **Se ve:** faltan el rótulo del grupo ("COMIDA FUERA"); la rejilla de números 3 × 2 (Arrastre, Fondo, Entradas, Sobregiro), que quedó reemplazada por "Este período" con 3 valores; la nota de cobertura y la barrita cubierto/no cubierto de cada consumo; el calendario "En el período"; la sección "Reglas"; y "Archivar" deshabilitado con su motivo. `capturas/r_categoria-k-rest__tc.png`, `capturas/r_categoria-k-rest__dc.png`.
- **Referencia:** §6, puntos 1–8. `S3-Detalle__telefono-claro.png` y `S3-Detalle__computadora-claro.png`.
- **Arreglo:** reutilizar `v2Kv` en una rejilla `repeat(3,1fr)` × 2 filas. En la fila de consumo, agregar la nota ("cubierto" o "cubierto $20.50 · no cubierto $7.80" en `--problema-texto`) y la barrita de 5 px (lo cubierto en `--texto-secundario`; lo no cubierto con `repeating-linear-gradient(135deg, var(--problema-borde) 0 3px, var(--problema-fondo) 3px 6px)`). El calendario va en 7 columnas con un punto de 6 a 18 px proporcional al gasto y hoy con anillo de 2 px `--foco`. Las reglas van en pastillas de 36 px `--superficie-hundida` con `filter` 14. "Archivar" va deshabilitado (`--superficie-hundida`, `--texto-deshabilitado`) con el motivo debajo.

### A7 · El historial de 6 períodos no marca los meses pasados — Detalle de categoría · tc/dc · media
- **Se ve:** las barras que se pasaron están en naranja, pero no llevan el glifo `problema` bajo el mes y la leyenda no incluye "Se pasó". `capturas/r_categoria-k-rest__tc.png`.
- **Referencia:** §2.18 Historial. `S3-Detalle__telefono-claro.png`.
- **Arreglo:** en `v2HistChart`, si `g > a`, dibujar `gl('problema', 12)` en `--problema-texto` debajo de la etiqueta del mes y agregar `legItem(gl('problema'), 'Se pasó')`. Ver también D9 (datos inventados) y B11 (escala en computadora).

### A8 · Categoría de pago de tarjeta con la plantilla genérica — Detalle Visa Oro (k-pago-c3) · tc/dc · alta
- **Se ve:** héroe "$300.30" en verde junto a "Te falta reservar $89.70"; "Este período" con Deuda/Cubierto/Pagado; "Consumos del período" vacío; un historial de "gastado en promedio" que no aplica. `capturas/r_categoria-k-pago-c3__tc.png`.
- **Referencia:** §6, estado "Categoría de pago de tarjeta". `S3-Detalle__categoria-de-pago-de-tarjeta.png` muestra la rejilla Deuda de la tarjeta · Reservado · Te falta reservar, el bloque "Para no generar intereses · Pagá antes del 15/11 · $512.40" y el botón principal "Reservar $18.75".
- **Arreglo:** una rama `k.pagoDe` en `SCR.categoria`. El héroe va en `--texto` (la reserva no es un "disponible positivo"), con el indicador `deuda-sin-respaldo`. Agregar la rejilla de 3, el contenedor "Para no generar intereses" y el botón principal de 52 px a todo el ancho "Reservar $X", que abre Asignar con el monto. Quitar el historial de gasto.

### A9 · Con meta: falta el resumen de la meta y el botón con el monto — Detalle Fondo de emergencia · tc · baja
- **Se ve:** "Mensual · $175.00 · Falta $75.00" con una barra, y los botones genéricos "Asignar / Mover dinero". `capturas/r_categoria-k-fondo__tc.png`.
- **Referencia:** `S3-Detalle__con-meta.png`: "$1,350.00 de $3,000.00 · 45 %", "Pide $175.00 este período · falta $75.00" y el botón principal "Asignar $75.00".
- **Arreglo:** si `k.falta > 0`, el botón principal lleva el monto de lo que falta y abre Asignar con ese valor. Agregar la línea "Pide … · falta …" en `.t-cuerpo-pequeno`.

### A10 · Filas de la Bandeja sin sus acciones en la lista · tc/to/dc · media
- **Se ve:** "SMS de BAC" (no reconocido), "SMS de Banco Agrícola" (con error) y "PUMA SANTA ELENA" (posible duplicado) solo tienen la flecha. `capturas/r_bandeja__tc.png`.
- **Referencia:** §2.12. El no reconocido lleva el SMS citado en caja `--superficie-hundida` radio 12 más "Registrar a mano"; con error, "Intentar de nuevo" + "Copiar referencia"; posible duplicado, "Es otro gasto" (tonal) + "Descartar". `S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.png`.
- **Arreglo:** pasar `action` a `v2InboxRow` según `claseDe(b)`, en una fila con sangría de 52 px: pastilla de 38 px más un enlace. El SMS citado va en `.t-cuerpo-pequeno` `--texto-secundario`.

### A11 · Bandeja en computadora sin panel de revisión · dc · alta
- **Se ve:** una sola columna de 640 px. Al tocar una fila se abre "Revisar movimiento" como página entera, con los campos a ~1000 px. `capturas/r_bandeja__dc.png`, `capturas/r_revisar-b1__dc.png`.
- **Referencia:** §7 Computadora; `S4-Bandeja__computadora-claro.png`; `01-revisar-movimiento/listo__computadora-claro.png` (lista a la izquierda con el elegido resaltado y la revisión a la derecha).
- **Arreglo:** un `dbody` de Bandeja con `grid-template-columns: minmax(360px,0.9fr) minmax(0,1.1fr)`. La derecha muestra `SCR.revisar([seleccionado]).body` (por defecto, el primero) con el pie Aprobar · Descartar. La fila elegida lleva fondo `--superficie-hundida` y la raya de 3 px `--accion`.

### A12 · Revisar movimiento sin selector Tipo ni EntradaFecha · tc/to · media
- **Se ve:** no está el segmentado Gasto · Ingreso · Pago · Devolución, y la Fecha es un campo de texto sin el botón de calendario. `capturas/r_revisar-b1__tc.png`.
- **Referencia:** `01-revisar-movimiento/listo__telefono-claro.png`, `pago-de-tarjeta__*`, `devolucion__*`; EntradaFecha en `componentes/P1-03-…` (INDICE §3.2).
- **Arreglo:** usar `seg()` con las 4 opciones (alto 36, `--superficie-hundida`, padding 3) entre Comercio y Categoría. Pago muestra el origen preseleccionado; Devolución, "Elegí la compra". La Fecha va con un botón `cal` de 44 dentro del campo más los atajos "Hoy" y "Ayer".

### A13 · Campana en los flujos largos — Revisar (b3–b6), Registrar, Nueva cuenta, Estructura · tc · baja
- **Se ve:** en los flujos aparece la campana a la derecha; en b1 y b2 aparece "1 de 6", así que se comportan distinto. `capturas/r_revisar-b3__tc.png`, `capturas/r_registrar__tc.png`.
- **Referencia:** §3.1: en flujos largos, "Cerrar" a la izquierda y nada a la derecha. `01-…/coincidencia__telefono-claro.png`.
- **Arreglo:** en `render()`, si `v.flow`, `right = v.right ?? ''` (solo el contador "n de N" cuando exista).

### A14 · Actividad: buscador sin línea y filas recargadas · tc/to/dc · media
- **Se ve:** el buscador es una caja blanca sin la línea inferior. El subtítulo junta cuenta, categoría y estado en 2 o 3 líneas ("Cuenta corriente · Internet y teléfono · conciliada"). No hay indicadores de estado (Pendiente, Programada, Conciliada, Por cobrar, Con devoluciones) ni "Cargar más". En computadora los filtros no van en columna. `capturas/r_actividad__tc.png`, `capturas/B_actividad_subtitulo_apretado__tc.png`, `capturas/r_actividad__dc.png`.
- **Referencia:** `02-actividad/lista__telefono-claro.png` y `lista__computadora-claro.png`; §2.2 buscador relleno.
- **Arreglo:** el buscador lleva `box-shadow: inset 0 -2px 0 var(--borde-control)` y radio `10px 10px 4px 4px`. La fila: título en una línea con `text-overflow: ellipsis`, subtítulo "Cuenta · Categoría" en una línea, y una tercera línea de metadatos con glifo 12 + etiqueta (`clock` Pendiente en pastilla de borde punteado, `repeat` Programada, `reconcile` Conciliada, `user` Por cobrar, `undo` Con devoluciones). Agregar un botón tonal "Cargar más" centrado. En computadora, una columna fija de filtros de 260 px a la izquierda.

### A15 · Detalle de transacción con piezas faltantes · tc/to · media
- **Se ve:** "Confirmada · Desde SMS" en texto suelto. Las partes no muestran lo cubierto y lo no cubierto, y faltan "Efectos hoy" y "Cambios posteriores". `capturas/r_transaccion-t2__tc.png`.
- **Referencia:** `03-detalle-de-transaccion/principal__telefono-claro.png`.
- **Arreglo:** pastillas de 32 px `--superficie-hundida` con glifo (`check` Confirmada, `sms` Desde SMS). Cada parte con la barrita de 5 px cubierto/no cubierto (como A6) y su nota. Una sección "Efectos hoy" con `kvs` (Disponible de cada categoría y la deuda o el saldo de la cuenta) y otra "Cambios posteriores" con filas título + "antes … · fecha".

### A16 · Detalle de cuenta corriente y de ahorro · tc/to · media
- **Se ve:** la tarjeta de identidad no lleva "SALDO" con la cifra grande. Faltan el aviso de diferencia de conciliación, "Conciliaciones", "Programadas de esta cuenta" y "Ver en Actividad". El detalle de ahorro es idéntico al de corriente. `capturas/r_cuenta-c1__tc.png`, `capturas/r_cuenta-c2__tc.png`.
- **Referencia:** `06-detalle-de-cuenta/corriente__telefono-claro.png`.
- **Arreglo:** en el detalle, la tarjeta de identidad horizontal lleva disco + nombre/banco y, debajo, "Saldo" `.t-rotulo` + `.t-cifra-principal` 2.75rem. El aviso `advertencia` (2.14) va cuando hay diferencia. Las secciones Conciliaciones (filas con indicador "Diferencia" o "Igual") y Programadas usan `v2PlainRow` con insignia de fecha.

### A17 · Detalle de tarjeta · tc/to · media
- **Se ve:** "Reservar $89.70" queda suelto como enlace entre el contenedor y los botones. Falta "Para no generar intereses". La sección se llama "Movimientos" y no "Movimientos del ciclo". `capturas/r_cuenta-c3__tc.png`.
- **Referencia:** `06-detalle-de-cuenta/tarjeta__telefono-claro.png`: "Reservar $18.75" en la cabecera del contenedor a la derecha, un contenedor "Para no generar intereses" con 4 filas y "Movimientos del ciclo".
- **Arreglo:** mover el enlace a la primera fila de `v2CardDetails` (justificado a la derecha) y agregar el contenedor `kvs` "Deuda al corte anterior · Cargos del ciclo actual · Ya pagado en el ciclo · Pagá antes del 15/11".

### A18 · Detalle de préstamo · tc · media
- **Se ve:** el boleto, "Próxima cuota" con "Pagar" (que lleva a `noimpl`) y una sección "Condiciones" sin "Editar". Faltan "Capital pendiente" grande, Amortización y Pagos. `capturas/r_cuenta-c5__tc.png`.
- **Referencia:** `06-detalle-de-cuenta/prestamo__telefono-claro.png`.
- **Arreglo:** cabecera con "CAPITAL PENDIENTE" + cifra 2.75rem; barra "Cuotas pagadas 13 de 36 · 36.10 %" (8 px, `--grafico-tinta`); tabla de amortización (`.tb`, con la fila actual sobre `--superficie-hundida` radio 10) con "Ver tabla completa"; sección Pagos.

### A19 · Detalle de inversión · tc · media
- **Se ve:** solo la tarjeta y "Esta cuenta todavía no tiene movimientos". `capturas/r_cuenta-c6__tc.png`.
- **Referencia:** `06-detalle-de-cuenta/inversion__telefono-claro.png`: "VALOR $2,075.60" grande, rejilla Aportado · Retirado · Ajustes, botones Aporte (principal) · Retiro · Ajuste (tonales) y "Aportes, retiros y ajustes".
- **Arreglo:** una rama `c.tipo === 'inversion'` con esas piezas; los botones abren hojas cortas (12-registrar-tipos/inversion).

### A20 · Vacío "Esta cuenta todavía no tiene movimientos" · tc · baja
- **Se ve:** un círculo gris pequeño y el título en Big Shoulders en mayúsculas, centrado a 2 líneas. `capturas/r_cuenta-c4__tc.png`.
- **Referencia:** §2.19: círculo de 72 px `--positivo-fondo` con glifo de 32 px, título `.t-titulo-seccion` y texto de 280 px máximo.
- **Arreglo:** `empty()` con un disco de 72 px y título en `.t-titulo-seccion` 1.375rem.

### A21 · Metas con una lista plana · tc/dc · media
- **Se ve:** filas simples "Supermercado · Mensual $350.00 · Cubierta". `capturas/r_metas__tc.png`.
- **Referencia:** `09a-metas/lista__telefono-claro.png`: tarjetas con barra de progreso, "Para el 30/06/2027", "Pide $175.00 este período · falta $75.00", el indicador, el aviso "Sin fondos suficientes en Listo para asignar" y una sección "Otras metas" con el estado "Vencida".
- **Arreglo:** contenedor por meta con `v2Progress` (8 px) y su texto. La meta vencida, con el indicador `advertencia` "Vencida", en lugar del enlace "Una meta vencida: extender la fecha".

### A22 · Programadas con la insignia de fecha vieja y sin estados · tc/to · media
- **Se ve:** la insignia pone el día arriba y "OCT" abajo, al revés de `v2Datebadge`. Faltan el selector Horizonte (7 · 30 · 90 días), el aviso "Atrasada", el estado "Pausa" y el aviso "Cuota sin modelo". El título se corta en "PROGRAMA…". `capturas/A_programadas_insignia_vieja__tc.png`.
- **Referencia:** `09b-programadas/lista__telefono-claro.png`; §2.16 insignia (mes `.t-rotulo` arriba y día en Archivo 800 ancho 72 % 1.5rem).
- **Arreglo:** usar `v2Datebadge` y `v2PlainRow`. Agregar `seg([['7','7 días'],['30','30 días'],['90','90 días']])`, el aviso `problema` "Atrasada" con "Registrar $58.40 · Omitir" y la fila en pausa con "PAUSA —" + "Reactivar".

### A23 · Por cobrar · tc/to · baja
- **Se ve:** cada deudor con una fila por compra y "Cobrar $X". Faltan el aviso "En camino" (`informacion`), "Renombrar", "Condonar" y el total "Te debe". `capturas/r_porcobrar__tc.png`.
- **Referencia:** `09c-por-cobrar/lista__telefono-claro.png`.
- **Arreglo:** encabezado del deudor con "Renombrar" (enlace) y la fila "Te debe $40.00" en `--positivo-texto`. Cada compra con "Cobrar" (tonal) + "Condonar" (enlace). Arriba, el aviso `informacion` "En camino".

### A24 · Reglas sin buscador ni alta · tc · baja
- **Se ve:** filas no tocables, sin buscador ni "Nueva regla". `capturas/r_reglas__tc.png`.
- **Referencia:** `09d-reglas/lista__telefono-claro.png`: buscador relleno, filas con `chevR`, el estado "No se aplica: la categoría está archivada" y el botón tonal "+ Nueva regla".
- **Arreglo:** buscador (§2.2), filas tocables de 60 px con flecha y el botón tonal a todo el ancho.

### A25 · Notificaciones (pantalla) · tc · baja
- **Se ve:** filas sin el punto de no leído ni el segmento Todas / Sin leer, y sin la acción "Ver tarjeta →". `capturas/r_notificaciones__tc.png`.
- **Referencia:** `10-notificaciones/lista__telefono-claro.png`; §2.17 (aviso `[40][1fr][10]`, punto de 9 px `--accion`).
- **Arreglo:** reutilizar el renglón de `v2NotifPanel` y agregar `seg([['todas','Todas'],['sin','Sin leer · 2']])`.

### A26 · Reportes con gráficos genéricos · tc/to/dc · media
- **Se ve:** en Tendencia, las barras tienen eje Y y rejilla, pero falta la línea punteada de referencia, la leyenda y el selector Gráfico / Tabla. Categorías: la dona no tiene el total al centro ni los porcentajes, y "Otras" no va rayado. Top de comercios: filas sin conteo ni barra. Ingresos y gastos: solo `kvs`. `capturas/r_reportes-tendencia__tc.png`, `capturas/r_reportes-categorias__tc.png`, `capturas/r_reportes-comercios__tc.png`.
- **Referencia:** `04-reportes/tendencia__*`, `categorias__*`, `top-comercios__*`, `ingresos-gastos__*`; §2.18 Dona y Tabla.
- **Arreglo:** Tendencia con el tope de asignado punteado en `--grafico-referencia` y la leyenda "Períodos cerrados · Período actual · Asignado". Dona con anillo de 20 px, 3 px entre porciones, total en Archivo 800 ancho 72 % + "gastado" y lista con porcentaje; "Otras" con `repeating-linear-gradient` sobre `--grafico-otras`. Top de comercios: "4 compras · Supermercado" más una barra de 6 px proporcional en `--texto`.

### A27 · "Conectar los SMS" marcado como diseñado en la demo cuando ya tiene diseño · tc/to · media
- **Se ve:** la etiqueta "+ DISEÑADA EN LA DEMO", los pasos y "Dirección". `capturas/w18_webhook.png`, `capturas/w19_webhook-token.png`.
- **Referencia:** `11-ajustes/conectar-sms__telefono-claro.png`: aviso "Conectado. El último SMS llegó…", sección "Token de MacroDroid" con el token enmascarado + "Copiar" y "Se muestra completo una sola vez", botón tonal "Generar un token nuevo".
- **Arreglo:** quitar la etiqueta y la entrada `webhook` de `NUEVAS_EN_DEMO`. Después de generar el token, usar la anatomía del tablero; los pasos de MacroDroid pueden quedar como sección "Cómo se conecta".

### A28 · "Nueva cuenta" marcada como diseñada en la demo · tc · baja
- **Se ve:** "+ DISEÑADA EN LA DEMO" al elegir Efectivo. `capturas/w10_cuentaNueva-efectivo.png`.
- **Referencia:** `06-detalle-de-cuenta/nueva-tipo__*` y `nueva-tarjeta__*` (incluye el segmentado "Debo / Tengo a favor", la EntradaFecha con calendario, Red y Color como selecciones).
- **Arreglo:** quitar `cuenta-efectivo` de `NUEVAS_EN_DEMO` y alinear el formulario de efectivo al de tarjeta (campos rellenos y EntradaFecha). Ver D1.

### A29 · Lista sugerida (plantilla) · tc · baja
- **Se ve:** filas de unos 52 px con título 600 y solo "×". `capturas/r_plantilla__tc.png`.
- **Referencia:** `08-estructura-y-plantilla-inicial/plantilla__telefono-claro.png`: filas de 44 px con texto regular, lápiz para renombrar y "×". Al quitar, la fila queda tachada en `--texto-terciario` con un botón `undo`. Abajo, "+ Agregar grupo".
- **Arreglo:** fila `min-height: 44px`, título `.t-cuerpo` 400. En lugar de borrar la fila, marcarla quitada (tachado + deshacer) y agregar el enlace.

### A30 · Estructura · tc/to · media
- **Se ve:** "Editar grupo" queda en una línea aparte, debajo del rótulo del grupo. Las filas no tienen separador. Solo está la flecha "subir". No hay pie "Listo". En Estructura vacía, el pie "Listo" es tonal y parece deshabilitado. `capturas/B_editar_grupo_desalineado__tc.png`, `capturas/r_estructura__tc.png`, `capturas/w14_estructura-vacia.png`.
- **Referencia:** `08-…/estructura__telefono-claro.png` y `estructura-vacia__telefono-claro.png`.
- **Arreglo:** encabezado de grupo `display:flex; justify-content:space-between; align-items:center` (§1). Filas separadas por `1px solid var(--borde-sutil)` con subir y bajar (`chevU`/`chevD` de 44). Pie fijo con el botón principal "Listo".

### A31 · Inicio sin las piezas nuevas y sin flechas en los enlaces · tc/to/dc · media
- **Se ve:** "Necesita tu atención" sin "Ver las 6 →"; "Programadas" y "Actividad" sin flecha. Faltan el aviso "Ritmo alto en Restaurantes" y "Pagos de tarjeta próximos". `capturas/r_inicio__tc.png`.
- **Referencia:** `S1-Inicio__telefono-claro.png`; `15-inicio-y-presupuesto-piezas-nuevas/ritmo-y-tarjetas__telefono-claro.png`.
- **Arreglo:** `link(..., 'arrowR')` en los tres encabezados, y "Ver las N" hacia Presupuesto filtrado por sobregiradas. Agregar el aviso `advertencia` (2.14) con "Mover dinero" y la sección de pagos con insignia de fecha + indicador ("Te falta reservar $18.75" / "Nada que pagar").

### A32 · Barra lateral de computadora · dc · baja (en curso en -next, salvo la campana)
- **Se ve:** no tiene el rótulo "Más". Las secundarias tienen el mismo tamaño que las principales. Falta "Notificaciones" con su contador. El contador de la Bandeja va en `--accion`. La campana no lleva el círculo hundido de 44. `capturas/r_inicio__dc.png`.
- **Referencia:** §3.2; `S1-Inicio__computadora-claro.png`.
- **Arreglo:** lo que trae -next (`.snav`, `it2` de 40 px, `.n` en `--marca`), más Notificaciones con contador en `.sidebar`. La campana va con `width:44px; height:44px; border-radius:999px; background: var(--superficie-hundida)` en `.dtop`.

### A33 · Hoja "Más secciones" · tc/to · baja
- **Se ve:** las opciones van dentro de un contenedor con discos de 38 px. `capturas/h_mas__tc.png`.
- **Referencia:** §2.17: filas de 52 px con ícono de 20 px `--texto-secundario` y `chevR`, sin disco ni contenedor. `K1-Navegacion__mas-secciones-abierto-n5-n7.png`.
- **Arreglo:** `list(..., { flat: true })`: filas sin disco y separadas por `--borde-sutil`, con el contador "2" de Notificaciones en un círculo `--accion`.

### A34 · Detalle de "Listo para asignar" · tc/to · media
- **Se ve:** el billete no lleva el botón "Asignar $312.40" ni el guilloché, y el indicador dice "Para repartir" donde debería ir "En camino". Faltan "Reducción proyectada al cierre" y el selector Gráfico / Tabla. `capturas/r_lpa__tc.png`.
- **Referencia:** `05-detalle-de-listo-para-asignar/principal__telefono-claro.png`.
- **Arreglo:** usar `v2Lpa(C.lpa, …, 3.25, true)`, el mismo de Inicio. Agregar el contenedor "Reducción proyectada al cierre" con las sobregiradas con débito y "Al cerrar el 20/10 quedaría", y `v2Toggle` en el historial.

### A35 · Sin conexión y error de pantalla · tc · baja
- **Se ve:** sin conexión es un aviso `cero` en caja; el error de pantalla es un aviso `problema` con dos botones. `capturas/e_forz-sinconexion__tc.png`, `capturas/e_forz-error__tc.png`.
- **Referencia:** `14-…/sin-conexion-en-la-app__telefono-claro.png` (banda compacta `--texto` sobre `--fondo` con ícono de nube tachada) y `error-de-pantalla__telefono-claro.png` (tarjeta con `info`, texto, "Referencia" + copiar y botón principal "Intentar de nuevo").
- **Arreglo:** la banda va en un contenedor `background: var(--texto); color: var(--fondo); radius: var(--radio-control); padding: 10px 14px`. El error de pantalla, en una tarjeta de superficie con `--elevacion-1`.

### A36 · Hoja Asignar · tc/dc · baja
- **Se ve:** el campo Asignar no toma el foco al abrir y no tiene relleno (queda transparente sobre `--superficie-elevada`). Falta "Lo que falta para la meta" cuando hay meta. `capturas/w33_hoja-asignar.png`.
- **Referencia:** `07-flujos-del-presupuesto/asignar__telefono-claro.png`; §2.17 ("campo Monto con foco").
- **Arreglo:** `autofocus` más `fld(..., { filled: true })` con `background: var(--superficie)` y foco `inset 0 -3px 0 var(--foco), 0 0 0 3px var(--accion-tonal)`. Si `k.falta > 0`, poner primero la opción "Lo que falta para la meta" con el monto, preseleccionada.

---

## B · Responsive

### B1 · "Atrás" encima del título en computadora — todas las hijas y flujos · dc · alta (en curso en -next)
- **Se ve:** "← Presupuesto" (`position:absolute; top:8px`) pisa el título de 2.5rem. `capturas/B_atras_solape__dc.png`, `capturas/r_registrarGasto__dc.png`, `capturas/r_revisar-b1__dc.png`.
- **Referencia:** §3.2: enlace "atrás" `.t-cuerpo-pequeno` y, debajo, el título. `S3-Detalle__computadora-claro.png`.
- **Arreglo:** `.dtop { flex-wrap: wrap; row-gap: 4px } .dtop .crumb { flex-basis: 100% }` y quitar el `position:absolute`, como en -next.

### B2 · Formularios y listas sin ancho máximo en computadora · dc · alta
- **Se ve:** Registrar gasto, Nueva cuenta, Revisar movimiento, Ajustes y sus subpáginas y Actividad estiran campos y filas hasta unos 1000 px. El pie de Registrar queda a la derecha y lejos de los campos. `capturas/r_registrarGasto__dc.png`, `capturas/r_cuentaNueva__dc.png`, `capturas/r_ajCiclo__dc.png`, `capturas/r_actividad__dc.png`.
- **Referencia:** §8 Computadora (Registrar en dos columnas iguales: datos a la izquierda; dividir, impacto y Guardar a la derecha) y `12-…/selector__computadora-claro.png`.
- **Arreglo:** los flujos van con `max-width: 720px` (-next ya trae `.dcontent.flowd`) y Registrar gasto en `dcols` de 2 columnas. Las páginas de lista (Ajustes, Reglas, Metas, Programadas, Por cobrar) van con `max-width: 720px`; Actividad con la columna de filtros de A14 más una lista de hasta 760 px. El pie (`.flowfoot`) debe alinearse con el contenido, no con el borde derecho.

### B3 · Computadora en anchos chicos: las columnas no colapsan · P768 / P390 · alta (en curso en -next con escalado)
- **Se ve:** a 768 px (y en cualquier ventana de menos de unos 1100 px con el panel lateral), `.dcols` mantiene 2 columnas en unos 300 px. Los montos se solapan con los nombres ("Visa −$148.60"), el billete corta "$312.4" y "Necesita tu atención" ocupa 3 líneas. A 390 px aparece desplazamiento horizontal dentro de `.scr`. `capturas/P768_desk_inicio.png`, `capturas/P768_desk_pres.png`, `capturas/P768_desk_cat.png`, `capturas/P390_desk.png`.
- **Referencia:** el marco de computadora es de 1440 px (§3.2).
- **Arreglo:** dibujar la computadora a 1440 × 900 y escalarla (`fitDevice()` de -next). Como respaldo, `@container (max-width: 900px) { .dcols { grid-template-columns: 1fr } }`.

### B4 · Teléfono a 390 px: las reglas móviles quedan anuladas · P390 · alta
- **Se ve:** a 390 px de ventana el dispositivo sigue a 390 × 844 con radio de 44 y empieza en y = 291. La barra inferior queda en y = 1050, fuera de la vista (la ventana mide 844), y la página se desplaza entera. `capturas/P390_inicio.png`, `capturas/P390_categoria.png`.
- **Causa:** `@media (max-width:520px) { .device.phone { width:100%; height:calc(100vh - 57px); border-radius:0 } }` está en la línea 60 de `app.css`, antes de `.device.phone { width:390px; height:844px; border-radius:44px }` (línea 65). Misma especificidad y orden posterior: gana la regla base.
- **Arreglo:** mover el bloque `@media (max-width:520px)` al final de `app.css`. Calcular la altura con la barra real: `height: calc(100dvh - var(--bar-h))`, con `--bar-h` medido en `chrome()`.

### B5 · La barra de la demo ocupa demasiado en móvil · P390/P768 · media
- **Se ve:** a 390 px la barra (marca, Vista, Tema, Simular SMS, Datos de ejemplo, Empezar de cero, Recorrido) se apila en 4 filas, 291 px. A 768 px ocupa 108 px. `capturas/P390_inicio.png`.
- **Arreglo:** a menos de 520 px, una fila de 52 px con la marca más un botón "Demo" que abre los controles en una hoja (o una fila con `overflow-x:auto` y `scrollbar-width:none`). Simular SMS queda visible como ícono de 44.

### B6 · Títulos de la barra superior truncados · tc/to · media
- **Se ve:** "PRESUPUES…" y "PROGRAMA…" a 390 px. `capturas/r_presupuesto__tc.png`, `capturas/r_programadas__tc.png`. La referencia S2 también corta "PRESUPUES…"; Programadas no lleva "Registrar" en su tablero.
- **Referencia:** §3.1 (una línea con puntos suspensivos); `09b-programadas/lista__telefono-claro.png` (solo la campana).
- **Arreglo:** las pantallas que se abren desde Más secciones (Programadas, Metas, Por cobrar, Reglas, Reportes, Ajustes) no llevan "Registrar" ni ☰ (`right: bell()`). Para Presupuesto, bajar el título de pestaña a 1.75rem en menos de 400 px (-next lo cambia en `.top h1`) o dejar "Registrar" solo con ícono (44 × 44) cuando el título no entra.

### B7 · Montos y etiquetas partidos en dos líneas · tc · media
- **Se ve:** en "Después de aprobar", "$157.60 → / $122.60" se parte en dos renglones. "Se pasó 3 de / 6" también se parte en el historial. `capturas/B_despues_aprobar_monto_partido__tc.png`, `capturas/B_sepaso_partido__tc.png`.
- **Referencia:** `01-…/listo__telefono-claro.png`: el valor anterior va en `--texto-secundario` y el nuevo en 700, en una línea; la etiqueta de la izquierda puede ocupar dos.
- **Arreglo:** en `kvs`, el valor con `white-space: nowrap; flex: none` y la etiqueta con `min-width: 0`. El valor anterior en `--texto-secundario` 400 y el nuevo en `--texto` 700. En el indicador, `white-space: nowrap` o la versión chica (.8125rem).

### B8 · Interlineado apretado en filas de varias líneas — Actividad, Detalle de cuenta · tc · media
- **Se ve:** "STARBUCKS MULTIPLAZA" y "RESTAURANTE EL ZOCALO" en 2 líneas casi pegadas; subtítulos de 3 líneas con interlineado de alrededor de 1.05. `capturas/B_actividad_subtitulo_apretado__tc.png`, `capturas/r_cuenta-c3__tc.png`.
- **Arreglo:** título con `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`, subtítulo `.t-cuerpo-pequeno` (line-height 1.45) a una línea, y la información extra en la línea de metadatos de A14.

### B9 · Estructura: "Editar grupo" desalineado · tc · baja
- Ver A30. `capturas/B_editar_grupo_desalineado__tc.png`. El enlace queda 14 px por debajo del rótulo porque `.gh` no centra en el eje cruzado. Arreglo: `align-items: center; min-height: 44px`.

### B10 · Tocables menores de 44 px · tc · media
- **Se ve (medido):** "Registrar" de la barra superior 104 × 40; pastillas de filtro y de Reportes 40 de alto; segmentados Gráfico / Tabla 36 y Períodos 40; "+" de las filas 40 × 40; "Aprobar" y "Revisar" de la Bandeja 38; botones `sm` ("Mover dinero", "Auto-asignar", "Nueva cuenta", "Ordenar", "Copiar referencia", "Cobrar $20.00", "Pagar") 40; casillas `rec_b2` y `_arch` 20 × 20; enlace "Editar" 40 × 44; "Quitar" 42 × 44.
- **Referencia:** AGENTES ("tocables de 44 × 44 como mínimo, aunque el dibujo sea más chico"); §3.1 (Registrar de 44).
- **Arreglo:** "Registrar" con `min-height: 44px`. Para mantener el dibujo de 40, 38 o 36: `position: relative` + `::after { content:""; position:absolute; inset: -4px 0; }` (o `inset:-2px`). `.btn.sm` con `min-height: 44px`. Las casillas, dentro de un `label` de 44 px de alto que sea el área de toque.

### B11 · Los gráficos se agrandan con el ancho en computadora · dc · media
- **Se ve:** en Detalle de categoría (dc), el historial ocupa unos 420 px de ancho y escala el SVG entero: los meses quedan en unos 15 px y los valores en unos 16 px 700. `capturas/r_categoria-k-rest__dc.png`.
- **Referencia:** §2.18 (textos del SVG en Archivo 11 px; valores 12.5 px ancho 80 %); `S3-Detalle__computadora-claro.png` (gráfico y tabla lado a lado).
- **Arreglo:** dibujar el SVG con `width="100%"` y `viewBox` del ancho real (o `preserveAspectRatio="none"` solo para las barras, con textos HTML superpuestos). Más simple: `max-width: 360px` y la tabla equivalente al lado, como en el tablero.

---

## C · Movimiento

Duraciones y curvas a usar: `--duracion-rapida` 120 ms, `--duracion-normal` 220 ms, `--duracion-transicion` 340 ms, `--duracion-lenta` 400 ms, `--curva-estandar`, `--curva-entrada`, `--curva-salida`, `--curva-enfasis`. Los keyframes ya están en `app.css`. La regla de `tokens.css` (`prefers-reduced-motion: reduce → animation/transition: none !important`) ya anula también los estilos en línea; cualquier animación nueva queda cubierta si se declara con `animation`/`transition`. Lo que se mueve por JS (contar cifras, `setTimeout`) debe consultar `matchMedia('(prefers-reduced-motion: reduce)')`.

### C1 · Hojas, menús y panel de notificaciones se cierran sin animación · tc/dc · alta
- **Se ve:** al cerrar con ×, el velo o Escape, la hoja desaparece en el mismo cuadro. A 100 ms ya no hay nada. `capturas/w36_hoja-auto.png` → `capturas/w37_hoja-cerrada.png`.
- **Referencia:** §11 (al cerrar baja en 200 ms con `--curva-salida` y recién entonces se desmonta; el panel sube en 200 ms). El prototipo tiene `fz-sh-out`, `fz-v-out` y `fz-dr-out`.
- **Arreglo:** en `closeSheet()`, agregar `.closing` a `.sheet` y `.velo`, esperar `animationend` (o 200 ms) y recién ahí `UI.sheet = null; render()`. CSS: `.sheet.closing { animation: fz-sh-out 200ms var(--curva-salida) both }` con `@keyframes fz-sh-out { to { transform: translateY(100%) } }`; `.velo.closing { animation: fz-v-out 200ms ease both }`. En computadora, `fz-left` en reversa (`translateX(100%)`). Panel: `fz-dr-out { to { transform: translateY(-100%) } }` en 200 ms. Menú: `opacity 0; scale(.96)` en 120 ms.

### C2 · Aprobar en la Bandeja: la fila no sale y el resultado no aparece en su lugar · tc/dc · alta
- **Se ve:** al tocar "Aprobar", la fila desaparece de golpe y el resultado "Aprobado: PUMA SANTA ELENA…" aparece **arriba de todo**, sobre las pestañas. `capturas/w25_bandeja.png` → `capturas/w26_aprobado-1toque.png`.
- **Referencia:** `S4-Bandeja__aprobado-con-un-toque.png` (resultado en el lugar de la fila); §2.13 (rebote de 300 ms `--curva-enfasis`); AGENTES ("Resultados en el lugar"). Ver D6.
- **Arreglo:** guardar `UI.F.res_<id>` y, en `SCR.bandeja`, dibujar `.res` en la posición de la fila. Animación: la fila sale con `opacity 1→0; translateX(0→24px)` en 220 ms `--curva-salida`; el alto colapsa con `grid-template-rows: 1fr→0fr` en 220 ms; entra `.res` con `fz-pop-in` 340 ms `--curva-enfasis`. El contador del botón Bandeja hace `fz-pop-in` (escala .85→1) al cambiar.

### C3 · Los montos cambian de golpe · tc/dc · media
- **Se ve:** después de "Asignar $50.00", el billete pasa de $1,450.00 a $1,400.00 y el Disponible de la fila cambia sin transición. Pasa lo mismo con Posición neta, los totales y el resumen "N por revisar". `capturas/w33_hoja-asignar.png` → `capturas/w34_asignado.png`.
- **Referencia:** §2.8 (cifras que ruedan, 1.4 s, 90 ms entre dígitos; `fz-roll` del prototipo); §11 (el resultado aparece con `--curva-enfasis`).
- **Arreglo:** marcar cada monto con `data-amt="<clave>"`. En `render()`, comparar con el valor anterior; si cambió, agregar `.amt-chg`: `animation: fz-item 220ms var(--curva-estandar)` y un destello de color (`--positivo-texto` si sube, `--problema-texto` si baja) durante 400 ms. En el billete, contar el número en 400 ms con `requestAnimationFrame` y `tabular-nums`, siempre que no esté activo "reducir movimiento".

### C4 · Al billete le faltan la respiración, la deriva y las cifras que ruedan · tc/to/dc · media
- **Se ve:** el billete tiene el brillo (`fz-sheen`), pero el guilloché no se mueve, falta el resplandor de `--accion` detrás y el monto no rueda al entrar. `capturas/r_inicio__tc.png`.
- **Referencia:** §2.8 (deriva de 40 s; resplandor con blur de 22 px que respira en 6 s; brillo cada 7 s; cifras que ruedan una vez, 1.4 s); en el prototipo, `fz-drift`, `fz-glow` y `fz-roll`.
- **Arreglo:** en `v2Lpa`, una capa `::before` con el guilloché y `animation: fz-drift 40s linear infinite alternate` (`background-position` 0 → 40px). Un `<span aria-hidden>` detrás con `background: var(--accion); filter: blur(22px); opacity:.35; animation: fz-glow var(--duracion-ambiental) ease-in-out infinite`. Cada dígito del monto en un `span` con `fz-roll` (`translateY(100%)→0`, 600 ms, retraso `i*90ms`), solo en la primera entrada de la sesión.

### C5 · Inicio y las listas entran sin escalonado · tc/dc · media
- **Se ve:** los bloques de Inicio y las filas de Presupuesto, Actividad, Metas y Programadas aparecen todos a la vez. Solo se escalonan las filas de la Bandeja y las tarjetas de Cuentas.
- **Referencia:** §4 (entrada: los bloques de arriba abajo con 90 ms entre sí, 600 ms `--curva-estandar`); §2.12 (filas a 400 ms con 60 ms entre filas).
- **Arreglo:** `.content > *` y `.dcols > div > *` con `animation: fz-item var(--duracion-lenta) var(--curva-estandar) both; animation-delay: calc(var(--n) * 90ms)`, con `--n` puesto al armar el body. Las filas dentro de `v2Box` con `fz-item` 400 ms y retraso de `60ms * i`, con tope de 8 filas para no demorar.

### C6 · Código TOTP sin respuesta visual · tc · alta (en curso en -next)
- **Se ve en el build auditado:** al escribir "12" solo queda "1" (no avanza a la siguiente casilla); el error pinta bordes rojos sin temblor; al verificar se salta directo a "Factor verificado", sin check. `capturas/w04_totp-escribiendo.png`, `capturas/w05_totp-error.png`, `capturas/w06_totp-ok.png`.
- **Arreglo:** el de -next. Casilla llena: `inset 0 -3px 0 var(--accion)` y `translateY(-2px)` con `--curva-enfasis` 220 ms, más `fz-pop-in` al escribir. Error: `fz-jitter` 380 ms y bordes `--problema-borde`. Verificado: casillas en `--positivo-fondo` encendidas en cascada (`transition-delay: calc(var(--i)*40ms)`), `.okcheck` con `fz-pop-in` 400 ms y la navegación a los 650 ms. Falta además **pegar el código entero** (evento `paste` que reparte los 6 dígitos) y Retroceso que vuelve a la casilla anterior.

### C7 · Botones, pastillas y segmentos no responden al presionar · tc/dc · media (en curso en -next)
- **Se ve:** sin hundimiento al presionar; al cambiar de pastilla o segmento, el fondo salta.
- **Referencia:** §11 (el botón principal se hunde al presionar; D1 presionado escala .98).
- **Arreglo:** el de -next (`:active { transform: scale(.97) }` 120 ms y transición de fondo y color de 220 ms). Agregar el indicador del segmentado como un elemento que se desliza (`transform: translateX(...)` 220 ms `--curva-estandar`) en lugar de repintar la opción.

### C8 · Opciones y avisos sin escalonado — Más secciones y panel de notificaciones · tc · baja
- **Referencia:** §11 (opciones de Más secciones escalonadas a 40 ms; avisos del panel a 60 ms).
- **Arreglo:** cada fila con `fz-item` 300 ms y retraso de `40ms * i` (Más secciones) o `120ms + 60ms * i` (panel). "Marcar todo como leído" ya hace `fz-item` sobre "Todo leído".

### C9 · Estados vacíos sin entrada · tc · baja
- **Se ve:** solo "Bandeja al día" hace `fz-pop-in`. Los demás vacíos ("Esta cuenta todavía no tiene movimientos", "Nada con este filtro", "Todavía no hay metas", "Sin resultados con estos filtros") aparecen secos.
- **Arreglo:** en `empty()`, el disco con `fz-pop-in .4s var(--curva-enfasis)` y el texto con `fz-item` 220 ms y 80 ms de retraso.

### C10 · Gráficos de Reportes sin entrada · tc/dc · baja
- **Se ve:** las barras genéricas de Tendencia y Gasto semanal y la dona aparecen ya dibujadas. El historial de categoría sí crece (`fz-barup`).
- **Referencia:** §2.18 (barras que crecen desde la base: 700 ms con 80 ms entre barras; línea que se dibuja en 1.4 s).
- **Arreglo:** barras con `transform-box: fill-box; transform-origin: bottom; animation: fz-barup 700ms var(--curva-estandar) both; animation-delay: calc(i*80ms)`. Dona: cada porción con `stroke-dasharray` y `stroke-dashoffset` de su largo a 0 en 800 ms, escalonadas 80 ms. Barras de Top de comercios con `fz-grow` 800 ms.

### C11 · Filas tocables sin hover ni flecha que se mueve · dc · baja
- **Referencia:** §11 ("las filas tocables cambian el fondo a 6 % y mueven su flecha 4 px"); §4 ("la flecha se mueve 4 px al pasar").
- **Arreglo:** `[data-a].row:hover, v2 rows:hover { background: color-mix(in srgb, var(--texto) 6%, transparent) }` y `:hover .chev { transform: translateX(4px); transition: transform var(--duracion-normal) var(--curva-estandar) }`.

### C12 · Duraciones de hojas y pantallas desalineadas con §11 · tc · baja
- **Se ve:** la hoja sube con `fz-up` en 340 ms (`--duracion-transicion`). §11 pide 380 ms con `--curva-entrada`; el prototipo usa `fz-sh-in` a 380 ms. Al cambiar de período en Presupuesto, el contenido no hace transición (los botones llevan a un faltante; ver D10).
- **Arreglo:** `.sheet { animation: fz-sh-in 380ms var(--curva-entrada) both }`. Al cambiar de período, el contenido entra con `fz-s-right` o `fz-s-left` (320 ms) según la dirección.

---

## D · Flujos y detalles faltantes en el recorrido real

Recorrido hecho: Empezar de cero → ingresar (error y luego bien) → inscribir TOTP (error y luego bien) → Primeros pasos → cuenta de efectivo → lista sugerida → conectar SMS → tarjeta → Simular SMS × 6 → aprobar con un toque → revisar "falta la categoría", elegir y aprobar → asignar → auto-asignar. Capturas `capturas/w01…w38`.

### D1 · Cuenta de efectivo sin subtipo, y el detalle y la tarjeta no dependen de él · tc · alta (subtipo en curso en -next)
- **Se ve en el build auditado:** al elegir Efectivo no hay forma de decir si es corriente, de ahorro o billetera. Forzar `UI.F.csub='billetera'` no cambia nada. `capturas/w10_cuentaNueva-efectivo.png`, `capturas/w11_cuentaNueva-billetera.png`.
- **Lo que queda pendiente aunque -next agrega el segmentado:**
  - Con "Billetera" se siguen pidiendo Institución y Últimos 4, aunque el texto de ayuda dice "sin banco ni últimos 4".
  - `v2Tile` solo distingue `ahorro`; una billetera se dibuja con el motivo de libreta del banco.
  - El detalle de ahorro es igual al de corriente (A16).
  - El SMS de Banco Agrícola TD ***3310 se asigna a la cuenta de **ahorro** recién creada, porque el número por defecto 3310 se rellena solo en cualquier efectivo (`capturas/w28_revisar-falta.png`: "Cuenta de ahorro · 14/10").
- **Referencia:** `06-…/nueva-tipo__*` y `corriente__*`; §2.10 (identidades: corriente → libreta, ahorro → anillos). No hay identidad de billetera diseñada.
- **Arreglo:** con `csub === 'billetera'`, ocultar Institución y Últimos 4 y guardar `inst: null`. No precargar "3310" (placeholder "Opcional"). En `v2Tile`, decidir por `c.motivo` (no por el nombre). Para billetera, agregar el caso a `FALTANTES` ("Identidad de billetera") o usar provisoriamente `--cuenta-banco` con el ícono `wallet` y sin motivo. En el detalle, la cuenta de ahorro no se ofrece como origen de "Pagar tarjeta" por defecto y muestra su identidad de anillos.

### D2 · Código TOTP: no avanza solo ni se puede pegar · tc · alta (avance en curso en -next)
- Ver C6. En el build auditado, escribir los 6 dígitos de corrido deja solo el primero, y un usuario real no puede completar la inscripción sin tocar cada casilla. Además falta `paste` (los gestores y el autocompletado de SMS pegan el código entero).

### D3 · Registrar gasto sin división ni por cobrar · tc/dc · alta
- **Se ve:** la tarjeta del selector dice "Con división y por cobrar", pero el formulario tiene una sola Categoría. No hay sección "Dividir", ni líneas por deudor, ni "Suma de las líneas", ni "Propuesta: la cuenta que más usás…". `capturas/r_registrarGasto__tc.png`.
- **Referencia:** §8; `S5-Registrar__telefono-claro.png` y sus estados (una línea, suma distinta, sugerencia al escribir, monto mal escrito, guardando, guardado).
- **Arreglo:** sección Dividir con líneas en columnas `[1fr][120][44]` (selección de categoría o deudor, monto alineado a la derecha, "Quitar línea"), "+ Agregar línea" y la fila de suma. Validar que la suma coincida con el total ("Faltan $10.00 por repartir…") y deshabilitar Guardar con su motivo. Impacto "Antes de guardar" por línea, con el indicador cuando una categoría queda en deuda sin reservar.

### D4 · Registrar: faltan tipos y Devolución no está conectada · tc · media
- **Se ve:** con los datos de ejemplo (préstamo, inversión y 2 tarjetas) solo aparecen Gasto, Ingreso, Transferencia, Pago de tarjeta y Devolución, y Devolución lleva a `noimpl`. `capturas/r_registrar__tc.png`.
- **Referencia:** `12-registrar-tipos-y-flujos-cortos/selector__telefono-claro.png` (Inversión, Desembolso, Avance de efectivo, Transferencia de deuda) y los estados `devolucion__*`, `inversion__*`, `desembolso__*`, `avance__*`, `transferencia-deuda__*`.
- **Arreglo:** agregar los tipos según las cuentas (inversión si hay inversión; desembolso si hay préstamo; avance y transferencia de deuda si hay al menos una o dos tarjetas). Conectar Devolución como hoja que pide la compra original. Subir el título de cada tarjeta a `.t-cuerpo` 700, como en el tablero.

### D5 · No se pueden crear préstamos ni inversiones · tc · media
- **Se ve:** al elegir Préstamo o Inversión aparece la nota "está en el tablero 06; en la demo solo se crean efectivo y tarjeta" y Continuar queda deshabilitado. `capturas/r_cuentaNueva__tc.png`.
- **Referencia:** `06-…/condiciones__*`, `cuota__*`, `cuota-no-cuadra__*`, `inversion__*`.
- **Arreglo:** formularios cortos. Préstamo: nombre, institución, capital pendiente, cuota, día de pago, cuotas pagadas y plazo, con "Agregar condiciones" opcional. Inversión: nombre, institución y valor actual. Así los Primeros pasos cubren las 4 identidades.

### D6 · Resultados fuera de lugar · tc · alta
- **Se ve:** aprobar en la lista, asignar desde la hoja, crear una cuenta, crear categorías y conectar los SMS ponen el resultado como "flash" arriba de la pantalla, no donde estaba el elemento. `capturas/w26_aprobado-1toque.png`, `capturas/w34_asignado.png`.
- **Referencia:** AGENTES ("después de una acción queda un Resultado de una acción donde estaba el elemento; no desaparece solo"); `S4-Bandeja__aprobado-con-un-toque.png`; `07-…/asignado__telefono-claro.png` (el resultado de asignar va arriba de la pantalla de Presupuesto, así que ese caso sí coincide).
- **Arreglo:** Bandeja como en C2. "Creaste…" y "13 categorías creadas" pueden quedar arriba, pero la acción siguiente ("Crear las categorías", "Ir a Presupuesto") debe coincidir con el paso pendiente de Primeros pasos, que hoy queda duplicado justo debajo.

### D7 · Gasto semanal no está conectado · tc/dc · alta
- **Se ve:** Reportes › Gasto semanal muestra la nota "en la demo no está conectado" y 4 barras genéricas con eje. `capturas/r_reportes-semanal__tc.png`.
- **Referencia:** S7 completo (`S7-Semanal__*`, `D2-gasto-semanal-paleta-validada/*`) y §10.
- **Arreglo:** una pantalla hija `semanal` ("Volver a Reportes") con el selector de período, las pastillas de categorías (`--grafico-serie-1…8`), el resumen de 3, el selector Gráficos / Tabla, `v2WeekBars` (ya existe en v2.js), el acumulado y "Contra los 3 anteriores".

### D8 · Revisar: no se puede marcar un SMS como pago de tarjeta o devolución · tc · media
- Ver A12. Sin el selector Tipo, el pago de una tarjeta llegado por SMS solo puede aprobarse como gasto. Referencia: `01-…/pago-de-tarjeta__*` y `devolucion__*`.

### D9 · Historial de categoría con datos inventados que se contradicen · tc · media
- **Se ve:** `hist` se arma como `base × [.88, 1.04, .96, 1.21, .99]`, así que Fondo de emergencia (ahorro, $0 gastado) dice "Se pasó 2 de 6" y "$84.67 gastado en promedio"; Visa Oro (pago de tarjeta) muestra un historial de gasto. `capturas/r_categoria-k-fondo__tc.png`, `capturas/r_categoria-k-pago-c3__tc.png`.
- **Arreglo:** calcular el historial con `S.transacciones` por período. Si no hay períodos anteriores, mostrar la caja "Gráfico sin datos" (§2.19: `--superficie-hundida` radio 16, 180 px, ícono `chart`). No mostrar el historial en las categorías de pago ni en las que tienen meta de ahorro sin gasto.

### D10 · Período anterior y siguiente llevan a un faltante · tc/dc · media
- **Se ve:** las flechas del selector de período abren "falta: periodos", aunque los estados de período cerrado y futuro están diseñados. `capturas/r_presupuesto__tc.png`.
- **Referencia:** `S2-Presupuesto__periodo-cerrado.png` y `__periodo-futuro.png`; §2.15.
- **Arreglo:** `UI.F.periodo` (−1, 0, +1). Cerrado: filas sin "+", con candado y sin franja de Listo para asignar. Futuro: solo lo asignado, sin gasto ni pagos de tarjeta. "Ir al período actual" como enlace discreto.

### D11 · Detalle de tarjeta: el enlace "Reservar $X" y la acción desde la categoría de pago · tc · media
- **Se ve:** el usuario que ve "Te falta reservar $89.70" en Inicio, al tocar Visa Oro va al detalle de la cuenta y encuentra "Reservar" como enlace suelto (A17). Desde la categoría de pago solo están Asignar y Mover dinero (A8).
- **Arreglo:** un botón principal "Reservar $X" en ambos lugares, que abra Asignar preseleccionado en la categoría de pago con el monto.

### D12 · Hay pantallas diseñadas que llevan a "noimpl" · tc · baja
- **Se ve:** "Pagar" del préstamo, "Editar" de cuenta y de transacción, y "Devolución" llevan a `noimpl` ("diseñada pero no está conectada"). `capturas/e_noimpl__tc.png`.
- **Arreglo:** priorizar Editar transacción (`03-…/editar__*`) y Pagar cuota (`06-…/cuota__*`). El resto puede seguir en `noimpl`, pero con el nombre del tablero exacto y un enlace a su captura.

---

## E · Color y contraste

El texto pasa 4.5:1 en todas las rutas medidas (ver §0). Lo que sigue es uso de tokens.

### E1 · Monto principal en verde en un estado de deuda — Presupuesto (Pagos de tarjeta) y Detalle de categoría de pago · tc/to · media
- `$300.30` en `--positivo-texto` junto a "Te falta reservar $89.70" en `--deuda-sin-respaldo-texto`. El color comunica "todo bien" cuando el estado dice lo contrario. `capturas/A_pagos_tarjeta_como_categoria__tc.png`, `capturas/r_categoria-k-pago-c3__to.png`. Referencia: §1 (color de montos) y §2.7. Arreglo: A2 y A8 (la reserva en `--texto`; lo que falta en `--deuda-sin-respaldo-texto`).

### E2 · Indicador "Para repartir" del billete: el glifo en verde sobre `--marca` · to · media
- En LPA (to), el círculo del indicador queda `--positivo-texto` sobre `--positivo-fondo` dentro del billete claro, y el texto en `--texto-sobre-marca`. Mezcla dos sistemas de color dentro de la marca. `capturas/r_lpa__to.png`. Referencia: §2.8 (dentro del billete todo va en `--texto-sobre-marca`; la línea lleva el glifo `informacion` "En camino…"). Arreglo: usar la línea de `v2Lpa` (glifo `informacion` en `--texto-sobre-marca` al 80 %), igual que en Inicio.

### E3 · Campos sin relleno sobre superficies elevadas — hojas Asignar, Mover, Meta, Pagar tarjeta · tc/to · baja
- El campo queda transparente sobre `--superficie-elevada` y solo se ve la línea. En oscuro la diferencia de superficie desaparece. `capturas/h_mover__tc.png`, `capturas/h_mas__to.png`. Referencia: §2.2 (caja de fondo `--superficie`, radio `10px 10px 4px 4px`). Arreglo: `background: var(--superficie)` en todos los `fld` y `sel`, incluso dentro de las hojas.

### E4 · Tamaño fuera de escala en "Opcional" · tc · baja
- "Opcional" se dibuja a 11.67 px (`small` en .7291rem), fuera de la escala de roles. Referencia: INDICE §3.3 (redondear a .75rem `rotulo`) y §2.2 ("Opcional" en `--texto-terciario`). Arreglo: `.t-cuerpo-pequeno` (.875rem) en `--texto-terciario`, como en `01-…/listo__telefono-claro.png`.

---

## Índice por pantalla

| Pantalla (ruta) | Hallazgos |
|---|---|
| Acceso (`ingresar`, `inscribir`, `verificar`, `inscrito`) | C6, D2, B10 |
| Inicio (`inicio`) | A31, A32, C3, C4, C5, D6 |
| Presupuesto (`presupuesto`) | A1, A2, A3, A4, B6, B10, C3, C5, D10, E1 |
| Detalle de categoría (`categoria`) | A5, A6, A7, A8, A9, B7, B11, D9, D11, E1 |
| Listo para asignar (`lpa`) | A34, E2 |
| Estructura y plantilla (`estructura`, `plantilla`) | A29, A30, B9 |
| Conectar los SMS (`webhook`) | A27 |
| Bandeja (`bandeja`) | A10, A11, C2, D6, B10 |
| Revisar movimiento (`revisar`) | A11, A12, A13, B2, B7, D8, E4 |
| Registrar (`registrar`, `registrarGasto`) | A13, B2, D3, D4 |
| Actividad (`actividad`) | A14, B2, B8 |
| Detalle de transacción (`transaccion`) | A5, A15, D12 |
| Cuentas (`cuentas`) | C5 (y la nota final sobre el interruptor) |
| Detalle de cuenta (`cuenta`) | A5, A16, A17, A18, A19, A20, B8, D1, D11, D12 |
| Nueva cuenta (`cuentaNueva`) | A28, B2, D1, D5 |
| Reportes (`reportes`) | A1, A26, B10, C10, D7 |
| Metas, Programadas, Por cobrar, Reglas | A21, A22, A23, A24, B6, C9 |
| Notificaciones (pantalla y panel) | A25, C1, C8 |
| Ajustes (`ajustes`, `ajCiclo`, `ajSeguridad`, `ajDiag`, `ajApariencia`) | A5, B2 |
| Hojas y menús (`SHEETS.*`, menús K2) | A33, A36, C1, C12, E3 |
| Estados forzados (sin conexión, error, sesión vencida, cierre) | A35 |
| Marco de computadora | A32, B1, B2, B3, B11, C11 |
| Página entera a 390 y 768 px | B3, B4, B5 |

Nota sobre "Mostrar archivadas" (Cuentas): en el build auditado es una casilla nativa (`capturas/r_cuentas__tc.png`). -next le aplica el estilo de interruptor K2 por `role="switch"`, así que no se cuenta como hallazgo aparte; hay que verificarlo en el build final.
