# Finn 2.0 · cómo construir cada pantalla

Especificación de las 7 pantallas de A.7 y de sus componentes, tal como están diseñadas (estilo v2). Los nombres entre `--` son variables de `tokens.css`; los roles tipográficos son clases `.t-<rol>`. Las medidas en px son a tamaño de letra 16 px; los textos van en rem (los roles ya lo hacen).

---

## 1 · Convenciones

- **Lienzo del teléfono**: 390 px de ancho. Zona segura superior 44 px. Contenido con margen lateral 20 px (`--espacio-5`).
- **Separación entre bloques** de una pantalla: 24 px (`--espacio-6`); en Inicio 28 px.
- **Contenedor** (todo lo que antes era "caja"): `background: var(--superficie); border-radius: var(--radio-contenedor); box-shadow: var(--elevacion-1); overflow: hidden;` sin borde.
- **Filas dentro de un contenedor**: separadas por `1px solid var(--borde-sutil)`; la última sin separador.
- **Encabezado de grupo**: `.t-rotulo` en `--texto-secundario` a la izquierda y el total en `.t-cuerpo-pequeno` `--texto-secundario` a la derecha, con 4 px de margen lateral y 8 px sobre el contenedor.
- **Encabezado de sección**: `.t-titulo-seccion` en `--texto`, alto mínimo 44 px, con un enlace o control a la derecha; 10 px sobre su contenido.
- **Color de montos**: Disponible positivo `--positivo-texto`; cero `--texto`; negativo con débito `--problema-texto`; negativo con tarjeta `--deuda-sin-respaldo-texto`. Montos neutros (gastos, saldos) en `--texto`.

---

## 2 · Componentes

### 2.1 Botones
| Tipo | Fondo | Texto | Alto | Radio |
|---|---|---|---|---|
| Principal | `--accion` (hover `--accion-hover`, presionado `--accion-presionada`) | `--texto-sobre-accion`, `.t-cuerpo` 600 | 48 (52 en acciones de pantalla, 44 en filas) | `--radio-control` |
| Secundaria (tonal) | `--accion-tonal` | `--accion` | igual | `--radio-control` |
| Peligro | `--peligro` | `--texto-sobre-peligro` | igual | `--radio-control` |
| Discreta (enlace) | transparente | `--enlace`, subrayado al pasar | 44 | — |
| Pastilla de acción en filas | `--accion` o `--accion-tonal` | `.t-etiqueta` 700 | 38 | `--radio-pastilla` |
| "+" de asignar en filas | `--accion-tonal`, círculo 40 px | ícono `plus` 18 px trazo 2.2 en `--accion` | 40 (área 44) | redondo |

Deshabilitado: fondo `--superficie-hundida`, texto `--texto-deshabilitado`, y debajo el motivo en `.t-cuerpo-pequeno` `--texto-secundario`. Enviando: spinner + "Guardando…".

### 2.2 Campo, selección y buscador (rellenos)
- Caja: alto 48 (52 para la cuenta en Registrar), padding 0 12, fondo `--superficie`, radio `10px 10px 4px 4px`, **sin borde**, `box-shadow: inset 0 -2px 0 var(--borde-control)` (la línea inferior cumple 3:1).
- Foco: `inset 0 -3px 0 var(--foco), 0 0 0 3px var(--accion-tonal)`.
- Error: borde 2 px `--problema-borde` + mensaje con glifo `problema` en `--problema-texto`.
- Etiqueta arriba en `.t-etiqueta` `--texto`; "Opcional" a la derecha en `--texto-terciario`. Prefijo "$" en `--texto-secundario`. Montos con `tabular-nums`.
- Selección abierta: lista en `--superficie-elevada`, `--radio-contenedor`, `--elevacion-2`; opción activa con fondo `--superficie-hundida` y `check`.

### 2.3 Pastillas de filtro y selector Gráfico / Tabla
- **Filtros** (Presupuesto): pastillas de 40 px de alto, padding 0 14, `--radio-pastilla`. Activa: fondo `--texto`, texto `--fondo`, 700. Inactiva: fondo `--superficie-hundida`, texto `--texto`. Fila con desplazamiento horizontal si no caben.
- **Selector segmentado**: contenedor `--superficie-hundida`, padding 3, `--radio-pastilla`. Opción activa: fondo `--superficie`, `--elevacion-1`, 700; inactiva transparente, `--texto-secundario`. Alto 36. `role="radiogroup"`.

### 2.4 Indicador de estado (sin cajita)
`[círculo 20 px con fondo --<estado>-fondo y el glifo del estado 13 px en --<estado>-texto] + etiqueta .t-etiqueta 600 en --<estado>-texto`, separación 7 px, sin borde ni fondo de caja. Versión chica: etiqueta a .8125rem. Versión solo lector de pantalla: el círculo + texto oculto. Glifos en `iconos/estados/`.

### 2.5 Barra de gastado sobre asignado
Pista de 6 px, `--radio-pastilla`, fondo `--superficie-hundida`, segmentos separados 2 px:
- Dentro de lo asignado: un segmento de ancho `gastado/asignado` en `--texto-secundario`.
- Sobregiro: segmento 1 de ancho `asignado/gastado` en `--texto-secundario` + segmento 2 (el excedente) en `--problema-borde` (débito) o `--deuda-sin-respaldo-borde` (tarjeta).
- Con meta: un segmento con el avance en `--positivo-borde` o `--advertencia-borde`.
Crece desde la izquierda al aparecer (800 ms, `--curva-estandar`; el excedente con 250 ms de retraso).

### 2.6 Fila de categoría
Padding 14 16; columnas `[contenido flexible][botón + 40 px]`, separación 14.
1. Nombre `.t-cuerpo` 600 `--texto` · a la derecha Disponible `.t-cifra` con el color de §1.
2. Barra de gastado (2.5).
3. "Asignado $120.00 · Gastado $146.30" `.t-cuerpo-pequeno` `--texto-secundario`. Período cerrado: candado + "Período cerrado" en `--texto-terciario` y **sin** botón +.
4. Indicadores (2.4), en fila con separación 12, sin montos (el desglose está en el detalle).
Toda la zona de contenido es un enlace al Detalle de categoría.
Computadora: tabla con columnas Categoría (nombre + indicadores) · Asignado · Gastado · Disponible (110 px cada una, alineadas a la derecha).

### 2.7 Fila de pago de tarjeta
Nombre 600 + número principal a la derecha ("Te falta reservar" en `--deuda-sin-respaldo-texto`; reserva excedente en `--informacion-texto`; pago excedente en `--problema-texto`; al día $0.00 en `--texto`). Debajo "Disponible para pagar $623.43" y el indicador correspondiente.

### 2.8 Billete "Listo para asignar"
- Contenedor `--marca`, `--radio-contenedor`, padding 22 20 20, con el guilloché: dos `repeating-radial-gradient` de `--marca-grabado` (anillos de 7–8 px y 9–10 px desde esquinas opuestas) que se desplazan muy lento (40 s, decorativo).
- Contenido en `--texto-sobre-marca`: "Listo para asignar" `.t-rotulo` al 80 %; el monto en Archivo 800, ancho 72 %, 3.25rem (cifras que ruedan una vez al entrar, 1.4 s, 90 ms entre dígitos); línea con glifo `informacion` y "En camino $40.00 · Carlos te debe".
- Detrás: un resplandor de `--accion` difuminado (blur 22 px) que respira (6 s). Un brillo cruza cada 7 s.
- Debajo, separado 12: botón principal de 52 px a todo el ancho, "Asignar $312.40" (abre la hoja Asignar).
- Estados: cero → indicador `cero` "Todo asignado"; negativo → indicador `problema` "Asignaste más de lo que tenés" y botón "Quitar $86.15 de una categoría".
- Versión franja (Presupuesto): `--marca`, `--radio-contenedor`, padding 12 14; rótulo + monto `.t-cifra` 1.75rem + "En camino $40.00"; botón "Asignar" de 44 a la derecha.

### 2.9 Tarjeta de crédito (cara) y billetera
- **Cara**: alto 206, `--radio-tarjeta`, padding 18 20, fondo `--tarjeta-oro` (Visa Oro) o `--tarjeta-plata` (Mastercard Clásica) más un guilloché de anillos blancos al 7 %, sombra `0 22px 40px -18px rgba(0,0,0,.6)` y luz interior `inset 0 1px 0 rgba(255,255,255,.2)`. Texto en `--tarjeta-oro-texto` / `--tarjeta-plata-texto`.
  - Arriba: nombre en `.t-titulo-seccion` 1.25rem (una línea, con puntos suspensivos) · banco en `.t-rotulo` al 80 %.
  - A 20 px: chip (40 × 30, radio 7, degradado dorado o plateado con líneas) + ícono sin contacto.
  - Abajo: "Deuda" `.t-rotulo` + monto `.t-cifra` 1.75rem · a la derecha "•••• 4821" (espaciado .14em, 600) + "Visa · crédito" `.t-rotulo`.
  - No lleva logotipos de marcas: la red se escribe como texto.
- **Billetera** (Cuentas): contenedor de 268 px de alto. La tarjeta de atrás arriba (top 0), escalada .94 desde el centro superior, saturación .85 y brillo .92: se ve su franja con nombre y banco. La de adelante a 62 px. Tocar la de atrás la trae al frente (500 ms, `--curva-entrada`, sube 46 px y se aclara). Debajo: "Tocá la tarjeta de atrás para traerla al frente." `.t-cuerpo-pequeno` `--texto-terciario` centrado.
- **Detalle de la tarjeta al frente** (contenedor, padding 16, separación 14):
  - Visa Oro: indicador `deuda-sin-respaldo` "Te falta reservar $18.75" · "Confirmado $607.18"; barra de uso del límite (8 px) con etiqueta "Uso del límite de $2,500.00" y 25.69 %, con la parte sin reservar en `--patron-sin-reservar`; rejilla de 3: Corte 25/10 · Pago 15/11 · Sin intereses $512.40 (`.t-rotulo` + valor 700).
  - Mastercard sin deuda: "Sin deuda" · "Límite $1,000.00" + barra en 0 %.
  - Saldo a favor: la cara dice "Saldo a favor $25.00"; el detalle lo explica.
  - Deuda reservada: indicador `deuda` "Deuda de tarjeta".

### 2.10 Identidad por tipo de cuenta
Tarjetas con fondo propio (decorativo) y un motivo dibujado; texto en `--texto` y `--texto-secundario`; radio `--radio-identidad`; padding 16; alto mínimo 168.
- Encabezado: disco de 38 px, radio 12, fondo `--cuenta-disco`, con el ícono del tipo (20 px, `--texto`).
- Abajo: nombre `.t-cuerpo` 700 · banco y últimos dígitos `.t-cuerpo-pequeno` `--texto-secundario` · saldo `.t-cifra`.

| Tipo | Fondo | Ícono | Motivo |
|---|---|---|---|
| Cuenta corriente | `--cuenta-banco` | `bank` | Líneas de libreta horizontales (1 px cada 14 px) en `--cuenta-motivo`, en el 70 % derecho, desvanecidas hacia la izquierda |
| Cuenta de ahorro | `--cuenta-ahorro` | `coins` | Anillos concéntricos (cada 11 px) en un círculo de 150 px que sale por la esquina superior derecha |
| Préstamo | `--cuenta-prestamo` | `ticket` | Forma de boleto: columnas `[1fr][103px]`, línea punteada vertical de 2 px y dos muescas de 22 px (color `--fondo`) arriba y abajo de la línea. El talón dice "Cuota" `.t-rotulo` + número en Big Shoulders 800 2.75rem + "20/10" 700 + "$210.00" |
| Inversión | `--cuenta-inversion` | `trend` | Seis barras redondeadas que suben, en `--cuenta-motivo`, abajo a la derecha. Diseño horizontal: disco + nombre y saldo |

Cuenta corriente con diferencia de conciliación: debajo del saldo, glifo `advertencia` en su círculo + "Diferencia con el estado de cuenta" en `--advertencia-texto` 600 (puede ocupar dos líneas). Archivada: fondo `--superficie-hundida`, opacidad .85, candado, "Archivada · BAC", saldo en `--texto-secundario`.

### 2.11 Posición neta
Contenedor, padding 18, separación 16: "Posición neta" `.t-rotulo` + $1,668.02 `.t-cifra-principal`; dos filas (Activos / Deudas) con nombre `.t-etiqueta` 700, monto a la derecha, barra de 10 px redonda (Activos al 100 % en `--grafico-tinta`; Deudas al 74.4 % rayada a 135° con `--texto-secundario`, para que se distinga sin color) y el desglose en `.t-cuerpo-pequeno`.

### 2.12 Fila de movimiento de la Bandeja (compacta)
Padding 14 16; columnas `[40][1fr][auto]`, separación 12.
- Círculo de 40 px con `--<estado>-fondo` y glifo 18 px en `--<estado>-texto`.
- Comercio `.t-cuerpo` 700 (una línea) · "Cuenta · fecha · banco hora" `.t-cuerpo-pequeno` `--texto-secundario` · estado en `--<estado>-texto` 700 + pista en `--texto-secundario` ("→ Supermercado (por regla)").
- Monto `.t-cifra`; sin acción en la lista lleva `chevR` 16 px `--texto-terciario`.
- Acciones (solo si se resuelve en la lista), en una fila con sangría de 52 px: pastilla principal + enlace.

| Estado | Estado (A.6) | Acción en la lista |
|---|---|---|
| `positivo` | Listo para aprobar | "Aprobar" (pastilla `--accion`) + "Revisar" |
| `advertencia` | Falta la categoría | ninguna (se abre la revisión) |
| `informacion` | Con coincidencia | ninguna |
| `advertencia` | Posible duplicado | "Es otro gasto" (tonal) + "Descartar" |
| `cero` | No reconocido | SMS citado en caja `--superficie-hundida` radio 12 + "Registrar a mano" |
| `problema` | Con error | "Intentar de nuevo" + "Copiar referencia" |
| `advertencia` | Datos faltantes | "Completar datos" |
Monto ausente: "—". Las filas entran escalonadas (400 ms, 60 ms entre filas).

### 2.13 Resultado de una acción
Contenedor sin borde, alto mínimo 56, padding 8 12 8 14: ícono 18 + texto `.t-cuerpo-pequeno` + enlace 700 en `--enlace`. Aparece con un pequeño rebote (300 ms, `--curva-enfasis`). Textos exactos:
- "Aprobado: SUPER SELECTOS ESCALON · $35.00 · Visa Oro · Supermercado" → "Ver transacción".
- "Descartado: FARMACIA SAN NICOLAS · $12.35" → "Restaurar" (con ícono `undo`).
- "Asignaste $75.00 a Fondo de emergencia." → "Deshacer".

### 2.14 Aviso en línea
Fondo `--<estado>-fondo`, `--radio-contenedor`, sin borde, padding 12 14; glifo 20 + título `.t-etiqueta` 700 en `--<estado>-texto` + texto `.t-cuerpo-pequeno` `--texto` + acción subrayada en `--<estado>-texto`.

### 2.15 Selector de período
Contenedor, padding 10 12. Botones "Período anterior / siguiente": círculos de 44, fondo `--superficie-hundida`, `arrowL` / `arrowR`. Centro: fechas "21/09 – 20/10/2026" `.t-cuerpo` 700 + ícono de estado + "Actual · 25 días transcurridos · quedan 5" `.t-cuerpo-pequeno`. Si no es el actual: "Ir al período actual" (discreta) debajo. Estados: Actual (`clock`), Cerrado (`lock`), Futuro (`cal`), De transición (`swap`).

### 2.16 Fila de transacción, día y fecha
- Encabezado de día: `.t-rotulo` `--texto-secundario` ("15 oct · hoy").
- Insignia de fecha (Inicio, consumos): mes `.t-rotulo` .6875rem arriba + día en Archivo 800 ancho 72 % 1.5rem.
- Fila simple: columnas `[48][1fr][auto]`, alto mínimo 60, padding 0 14; título 600 + subtítulo; monto `.t-cifra` (ingresos en `--positivo-texto` con "+").

### 2.17 Hojas, menú y panel de notificaciones
- **Hoja inferior** (Asignar, Más secciones): `--superficie-elevada`, radio `--radio-superpuesto` arriba, `--elevacion-3`, agarradera de 40 × 4 en `--borde-control`, título `.t-titulo-seccion` + botón cerrar de 44. Velo `--velo` detrás; tocar el velo cierra.
  - Asignar: campo Monto con foco ("$ 75.00"), "Listo para asignar $312.40", botones Cancelar (tonal) y "Asignar $75.00" en columnas 1fr 1.4fr.
  - Más secciones: Reportes, Metas, Programadas, Por cobrar, Reglas, Notificaciones (con contador "2"), Ajustes; filas de 52 con ícono 20 `--texto-secundario` y `chevR`.
- **Panel de notificaciones**: cae desde arriba, ancho completo, radio `0 0 28px 28px`, `--superficie-elevada`, `--elevacion-3`, alto máximo 92 %, padding superior 50 (zona segura).
  - Título "Notificaciones" `.t-titulo-pantalla` 1.625rem + cerrar.
  - Barra: "2 sin leer" `.t-rotulo` + "Marcar todo como leído" (`--enlace` 700). Al marcar: `check` en `--positivo-texto` + "Todo leído", y el contador de la campana y de Más secciones desaparece.
  - Grupos "Nuevas" y "Anteriores" (`.t-rotulo` `--texto-terciario`), separados por una línea `--borde-sutil`.
  - Aviso: columnas `[40][1fr][10]`; cuadro de 40 px, radio 12 (sin leer: fondo `--accion-tonal` e ícono `--accion`; leído: `--superficie-hundida` y `--texto-secundario`); título 700 (600 leído) + hora `--texto-terciario`; texto `.t-cuerpo-pequeno`; acción opcional "Ver tarjeta →"; punto de 9 px `--accion` si no está leído.
  - Pie: caja `--superficie-hundida` radio 14 con `info` y "Acá llegan recordatorios y avisos de Finn. Los movimientos de tus SMS por revisar están en la Bandeja."
  - Contenido de ejemplo: "Visa Oro corta el 25/10" (cal, acción "Ver tarjeta" → Cuentas con Visa al frente), "Cuota del préstamo el 20/10" (repeat), "Netflix tiene su meta cubierta" (target), "La regla PIZZA HUT se aplicó" (filter), "Se cerró el período 21/08 – 20/09" (lock).

### 2.18 Gráficos
Siempre dentro de un contenedor (padding 18 16), con: una **cifra grande** arriba (`.t-cifra-principal` 2.25rem + subtítulo `.t-cuerpo-pequeno`; a la derecha un dato o indicador), el gráfico SVG, la leyenda debajo y el selector Gráfico / Tabla o la tabla equivalente. Sin eje Y ni rejilla salvo una línea base (`--grafico-rejilla`). Textos del SVG en Archivo 11 px (`--texto-secundario`); valores en Archivo 700 ancho 80 % 12.5 px (`--texto`).
- **Barras por semana**: barras de 32 px con solo las esquinas superiores redondeadas (radio 8), degradado vertical de `--grafico-tinta` (100 % → 62 %); la semana en curso en `--accion` con sombra `drop-shadow(0 6px 10px <accion 33 %>)` y un punto de 2 px bajo su etiqueta (en negrita). **Referencia**: un tope horizontal de 44 px en `--grafico-referencia` (2 px, extremos con círculos de 2.6 px rellenos de `--superficie`), se distingue por su forma. Semana futura: barra rayada con contorno punteado `--borde-control` y "faltan 2 días". Las barras crecen desde la base (700 ms, 80 ms entre barras).
- **Acumulado**: línea suavizada de 3 px en `--accion` que se dibuja (1.4 s) con área bajo la curva en degradado `--accion` 28 % → 0; referencia acumulada punteada (puntos redondos cada 6 px) en `--grafico-referencia`; proyección futura punteada al 60 %; punto actual de 5 px con anillo `--superficie` y halo que pulsa; píldora con el monto ($287.15) en `--accion`; distancia a la referencia como trazo vertical en `--positivo-borde` y "−$39.52 de la referencia" en `--positivo-texto`; "Asignado $350.00" arriba a la derecha.
- **Contra los 3 períodos anteriores**: una fila por semana: `S1` `.t-rotulo` · pista de 22 px con una cápsula `--superficie-hundida` del mínimo al máximo de los anteriores, una marca vertical de 2 × 14 px por cada período anterior en `--texto-secundario` y el período actual como círculo de 16 px `--accion` con anillo `--superficie` · valor a la derecha. Escala $0 · $50 · $100 debajo.
- **Historial de 6 períodos** (detalle): barras de 26 px (tinta; las que se pasaron en `--problema-borde` con el glifo `problema` debajo del mes), tope de asignado (34 px) y valor encima en `--problema-texto` si se pasó. Cifra grande: promedio gastado + indicador "Se pasó 2 de 6".
- **Dona**: anillo de 20 px, 3 px de separación entre porciones, total al centro (Archivo 800 ancho 72 %) + "gastado"; colores `--grafico-serie-1…8` en orden fijo (la categoría conserva su color aunque cambie el filtro); "Otras" en `--grafico-otras` rayado. Lista a la derecha: muestra 12 × 12 radio 4, nombre, monto 600, porcentaje.
- **Tabla equivalente**: encabezados `.t-rotulo` `--texto-secundario`, filas de 11 px de padding vertical separadas por `--borde-sutil`, números `tabular-nums` con ancho 88 %, la fila actual resaltada con fondo `--superficie-hundida` y radio 10, barritas de 52 × 4 px bajo los montos de gasto.

### 2.19 Vacíos y errores
- Vacío: círculo de 72 px con `--positivo-fondo` y glifo 32 px, título `.t-titulo-seccion`, texto `.t-cuerpo-pequeno` de 280 px máximo, centrado.
- Gráfico sin datos: caja `--superficie-hundida` radio 16 de 180 px con ícono `chart` y el texto.

---

## 3 · Marco

### 3.1 Teléfono
- **Barra superior** (alto mínimo 60, padding 0 8 0 20): título `.t-titulo-pantalla` (2rem; 1.625rem cuando hay "atrás" o "cerrar"; una línea con puntos suspensivos) · botón "Registrar" (44 de alto, padding 0 14 0 10, `--accion`, ícono `plus` 18 trazo 2.2, `.t-etiqueta` 700) · campana de 44 con contador (círculo de 17 px `--accion`, texto 10.5 px 700, anillo de 2 px `--fondo`) · menú ☰ de 44 ("Más secciones").
  - En pantallas hijas: flecha "Volver a <padre>" a la izquierda (44, margen −8) y, a la derecha, campana + "Más acciones" (`more`).
  - En flujos largos: "Cerrar" (`x`) a la izquierda y sin acciones a la derecha.
- La barra superior y la inferior quedan **fijas**; solo el contenido se desplaza (sin barra de desplazamiento visible).
- **Barra inferior** (padding 6 4 22, fondo `--superficie`, línea superior `--borde-sutil`): Inicio · Presupuesto · **Bandeja** · Actividad · Cuentas.
  - Pestaña: ícono 22 + nombre .75rem, alto mínimo 56; activa en `--texto` 700 con una raya de 28 × 3 px `--accion` arriba (radio inferior 3) que se dibuja desde el centro (400 ms); inactiva en `--texto-secundario` 500.
  - Bandeja: botón de 62 × 62, radio 18, fondo `--marca` (activa: `--accion`), borde de 4 px `--fondo`, `--elevacion-2`, sube 26 px sobre la barra; ícono `inbox` 24 en `--texto-sobre-marca`; contador de 22 px arriba a la derecha (`--accion` con borde 2 px `--fondo`); "Bandeja" .75rem 700 debajo. Mientras hay movimientos por revisar, dos halos de 2 px `--accion` salen del botón (2.8 s, desfasados 1.4 s; decorativo).
- Pie fijo de flujo largo: padding 12 16 26, fondo `--superficie`, línea superior `--borde-sutil`, botón principal de 52 a todo el ancho.

### 3.2 Computadora (1440 px)
- **Barra lateral** de 248 px (padding 24 14, fondo `--superficie`, línea derecha `--borde-sutil`): marca (cuadro de 34 px `--marca` con la "F" o el símbolo + "Finn" `.t-titulo-seccion`) · botón principal "Registrar" a todo el ancho · navegación principal (filas de 44, radio `--radio-control`; activa con fondo `--superficie-hundida`, texto 700 y raya lateral de 3 px `--accion`; Bandeja con contador `--marca`) · "Más" `.t-rotulo` `--texto-terciario` + secundarias (filas de 40, Notificaciones con contador).
- **Contenido**: padding 32 48 48, separación 28. Encabezado: (enlace "atrás" `.t-cuerpo-pequeno` si corresponde) + título 2.5rem; a la derecha acciones y la campana en círculo de 44 con fondo `--superficie-hundida`.
- Los flujos cortos se abren como **panel lateral** en lugar de hoja inferior.

---

## 4 · Inicio — "¿Algo necesita mi atención?"
Capturas: `S1-Inicio__*`. Datos: A.7 Inicio.

**Teléfono, de arriba abajo** (separación 28):
1. Billete "Listo para asignar" con su botón (2.8).
2. Sección "Necesita tu atención" + enlace "Ver las 6 →" (a Presupuesto filtrado por sobregiradas). Contenedor con filas de 68 px: círculo de 36 px con el glifo del estado, nombre 600 + etiqueta del estado en su color 600, monto `.t-cifra` en el color del estado, `chevR`. Filas: Restaurantes (problema, −$26.30) · Gasolina (deuda-sin-respaldo, $18.75) · Visa Oro (deuda-sin-respaldo, "Te falta reservar", $18.75). Restaurantes abre su detalle; la flecha se mueve 4 px al pasar.
3. "Próximos 7 días" + enlace "Programadas": filas simples con insignia de fecha (17 oct Netflix, Visa Oro · se registra sola, −$15.49; 20 oct Cuota del préstamo, Cuenta de ahorro, −$210.00).
4. "Recientes" + enlace "Actividad": 15 SUPER SELECTOS ESCALON −$35.00 · 14 PUMA SANTA ELENA −$30.00 · 12 Salario quincena +$925.00.
5. Fila "Patrimonio neto" (contenedor, 64 px): "Activos $6,520.20 · Deudas $4,852.18" + $1,668.02 + `chevR` → Cuentas.
Entrada: los bloques aparecen de arriba abajo con 90 ms entre sí (600 ms, `--curva-estandar`).

**Computadora**: dos columnas iguales (separación 40, máximo 1080 px): izquierda billete (monto 3.75rem) + Necesita tu atención; derecha Próximos 7 días, Recientes y Patrimonio neto.

**Estados**:
- *Primer uso (sin cuentas)*: "Empecemos" `.t-rotulo` + "Tu dinero, con un trabajo para cada dólar" (2.25rem) + texto; contenedor con 3 pasos (círculo de 40 px, el primero en `--marca`): "1. Agregá tu primera cuenta", "2. Sumá tus tarjetas", "3. Asigná lo que tenés"; botón de 52 "Agregar una cuenta".
- *Todo al día*: billete en $0.00 con "Todo asignado"; aviso `positivo` grande "Todo al día · Nada necesita tu atención. Cada categoría tiene lo que pide."; Próximos 7 días y Recientes.
- *Listo para asignar negativo*: billete −$86.15 con "Asignaste más de lo que tenés" + botón "Quitar $86.15 de una categoría"; Necesita tu atención; Próximos 7 días.

## 5 · Presupuesto
Capturas: `S2-Presupuesto__*`. Datos: A.7 Presupuesto (grupos, categorías, pagosTarjeta).

**Teléfono** (separación 20):
1. Selector de período (2.15) y debajo, a 12, la franja de Listo para asignar (2.8). (N3: el período siempre visible.)
2. Filtros: Todas · Sobregiradas · Sin fondos · Cubiertas (2.3).
3. Grupos (separación 18), cada uno con su encabezado (nombre + total) y un contenedor con sus filas de categoría (2.6): Casa (Supermercado con meta cubierta, Luz y agua, Internet y teléfono), Comida fuera (Restaurantes, sobregiro con débito), Transporte (Gasolina, deuda sin reservar), Suscripciones (Netflix, meta cubierta), Ahorro (Fondo de emergencia y Viaje, falta para la meta).
4. "Pagos de tarjeta": contenedor con filas de pago (2.7): Visa Oro "Te falta reservar" $18.75 · Mastercard Clásica $0.00 "Deuda de tarjeta".
5. Totales: rejilla de 3 en caja `--superficie-hundida` radio 16 (Asignado $775.49 · Gastado $635.60 · Disponible $1,574.51).
Tocar una fila abre el Detalle; "+" y "Asignar" abren la hoja Asignar.

**Computadora**: arriba período y filtros en dos columnas; abajo tabla de categorías (2.6 en columnas, encabezado con línea de 2 px `--texto`) a 1.7fr y a la derecha franja de Listo para asignar, Pagos de tarjeta y Totales.

**Estados**: *Período cerrado* (filas sin "+" y con candado, sin franja de Listo para asignar) · *Período futuro* (solo asignado, sin gasto ni indicadores, sin pagos de tarjeta) · *Filtro: sobregiradas* (solo Comida fuera y Transporte) · *Sin resultados* (filtro "Cubiertas" activo + vacío).

## 6 · Detalle de categoría · Restaurantes
Capturas: `S3-Detalle__*`. Barra superior hija ("Volver a Presupuesto", campana, "Más acciones").

**Teléfono** (separación 24):
1. Héroe: "Comida fuera" `.t-rotulo` · "Disponible" `.t-cuerpo-pequeno` · −$26.30 en `.t-cifra-principal` 3rem `--problema-texto` · indicador `problema`.
2. Números: contenedor con rejilla de 3 × 2 (`.t-rotulo` + valor 600): Asignado $120.00 · Gastado $146.30 · Arrastre $0.00 · Fondo $120.00 · Entradas $0.00 · Sobregiro $26.30.
3. Desglose del sobregiro: aviso `problema` (2.14) "Sobregiro con débito o efectivo · $26.30" + "Con débito $26.30 · con tarjeta $0.00. Al cerrar el período, Listo para asignar bajará $26.30." + botón principal de 44 "Cubrir $26.30" (abre Asignar).
4. "Consumos" con el contador "6": contenedor con filas (insignia de fecha, comercio 600, "Débito"/"Tarjeta", nota de cobertura "cubierto" o "cubierto $20.50 · no cubierto $7.80" en `--problema-texto`, barrita de 5 px con lo cubierto en `--texto-secundario` y lo no cubierto rayado `--problema-borde`/`--problema-fondo`, monto). Orden de A.7.
5. "En el período": calendario de 7 columnas (L M M J V S D) del 21/09 al 20/10; un punto en `--texto` que crece con el gasto del día (6 a 18 px); hoy con anillo de 2 px `--foco`; días futuros en `--texto-terciario`; nota "El punto crece con el gasto del día. Tocá un día para ver sus consumos."
6. "Últimos 6 períodos" con selector Gráfico / Tabla a la derecha: historial (2.18) o su tabla (Período · Asignado · Gastado con barrita · Disponible; los negativos con glifo `problema`).
7. "Reglas": pastillas `--superficie-hundida` de 36 px con `filter` 14 + "PIZZA HUT", "LA PAMPA".
8. Acciones: rejilla 1fr 1fr con "Asignar" (principal con `plus`) y "Mover dinero" (tonal); debajo "Archivar" deshabilitado con el motivo "No se puede archivar: tiene Disponible distinto de cero."

**Computadora**: columnas 1fr / 1.6fr: izquierda héroe, números, desglose y acciones; derecha consumos, calendario, historial (gráfico y tabla lado a lado) y reglas.

**Estados**: *Historial como tabla* · *Sobregiro con tarjeta* (Gasolina −$18.75 en `--deuda-sin-respaldo-texto`, indicador `deuda-sin-respaldo`, texto "Pagaste con Visa Oro $18.75 más de lo asignado. Esa deuda todavía no está reservada.", números Asignado/Gastado/Con tarjeta, botón "Reservar $18.75") · *Con meta* (Fondo de emergencia $1,350.00, indicador `advertencia`, resumen de meta con barra 45 % "$1,350.00 de $3,000.00", "Pide $175.00 este período · falta $75.00", botón "Asignar $75.00") · *Sin movimientos* (Internet y teléfono $0.00, caja "Sin consumos en este período.") · *Categoría de pago de tarjeta* (Visa Oro, deuda $623.43, reservado, te falta reservar $18.75, "Para no generar intereses · Pagá antes del 15/11 · $512.40", botón "Reservar $18.75").

## 7 · Bandeja
Capturas: `S4-Bandeja__*`. Datos: A.7 Bandeja.

**Teléfono** (separación 24):
1. Selector segmentado "Por revisar · 3" / "Descartados".
2. Resumen: "3 por revisar" `.t-titulo-seccion` + "2 pendientes · 1 con coincidencia" a la derecha.
3. Un contenedor con las filas compactas (2.12): SUPER SELECTOS ESCALON (listo para aprobar, con Aprobar/Revisar) · FARMACIA SAN NICOLAS (falta la categoría) · NETFLIX.COM (con coincidencia).
4. Nota `--texto-terciario`: "Tocá un movimiento para revisarlo completo. Arrastrar a una categoría es un atajo; los botones siempre están."
Tocar una fila sin acción abre la revisión del movimiento **a pantalla completa** (flujo largo).

**Computadora**: lista a la izquierda y la revisión del movimiento seleccionado a la derecha (comercio, monto grande, SMS citado, Cuenta/Fecha/Categoría, botones Aprobar · Editar · Descartar).

**Estados**: *Aprobado con un toque* (el resultado "Aprobado: … $35.00 …" con "Ver transacción" en lugar de la fila; resumen "2 por revisar") · *Descartado* (resultado con "Restaurar") · *Vista de descartados* (filas apagadas en `--texto-secundario` con "Restaurar") · *Bandeja al día* (vacío 2.19 con "Bandeja al día") · *No reconocido, con error, posible duplicado y datos faltantes* (las cuatro filas de 2.12 con sus acciones).

## 8 · Registrar gasto con división (flujo largo)
Capturas: `S5-Registrar__*`. Pantalla completa, sin barra inferior; barra superior con "Cerrar"; pie fijo con "Guardar $148.60".

**Teléfono** (separación 24):
1. Cuenta: selector de 52 con ícono `card`, "Visa Oro" 600 y "Deuda $642.18" + `chevD`; debajo "Propuesta: la cuenta que más usás en PRICESMART." `--texto-terciario`.
2. Fecha y Total en dos columnas (campos con `tabular-nums`; Total con prefijo "$").
3. Comercio: "PRICESMART".
4. Sección "Dividir" + "opcional": "3 líneas" `.t-rotulo`; cada línea en columnas `[1fr][120][44]`: selección de categoría o deudor, monto alineado a la derecha, botón "Quitar línea" (`x`). Líneas: Supermercado $96.10 · Farmacia $22.50 · Carlos (me lo debe) $30.00. "+ Agregar línea" (discreta). Pie: "Suma de las líneas" + "$148.60 de $148.60".
5. Nota (opcional, "Hasta 500 caracteres").
6. Confirmación del impacto: contenedor "Antes de guardar" con filas "valor actual → valor nuevo" (Visa Oro · deuda $642.18 → $790.78; Supermercado $62.85 → −$33.25 con indicador `deuda-sin-respaldo`; Farmacia; Carlos te debe).
Cerrar vuelve a la pantalla de origen.

**Computadora**: columnas iguales: izquierda cuenta, fecha/total, comercio y nota; derecha dividir, impacto y el botón Guardar.

**Estados**: *Una línea* · *Suma distinta del total* (mensaje `problema` "Faltan $10.00 por repartir. La suma tiene que ser igual al total." y Guardar deshabilitado con "La suma de las líneas no coincide con el total.") · *Sugerencia al escribir* (buscador del comercio con resultados y su categoría sugerida) · *Monto mal escrito* (Total "1.486,0" en error con "Usá el punto o la coma solo para los centavos, sin separador de miles.") · *Fecha en período cerrado* (aviso `advertencia` dentro del impacto) · *Guardando* (botón con spinner "Guardando…") · *Guardado* (resultado "Guardado: PRICESMART · $148.60 · Visa Oro · 3 líneas", números de las líneas, "Registrar otro" (tonal) y "Volver a Inicio").

## 9 · Cuentas
Capturas: `S6-Cuentas__*`. Datos: A.7 Cuentas.

**Teléfono** (separación 24; cada grupo con encabezado `.t-titulo-seccion` 1.125rem + total `.t-cuerpo-pequeno` 600, a 12 px de su contenido):
1. Posición neta (2.11).
2. Tarjetas · $642.18: billetera (2.9) con Visa Oro al frente y su detalle.
3. Efectivo · $4,404.60: dos tarjetas de identidad en columnas iguales (separación 10): Cuenta corriente (con diferencia de conciliación) y Cuenta de ahorro (2.10).
4. Préstamos · $4,210.00: boleto del Préstamo personal.
5. Inversiones · $2,075.60: Depósito a plazo.
6. Interruptor "Mostrar archivadas".

**Computadora**: columnas iguales (separación 40): izquierda posición neta, efectivo, préstamos e inversiones; derecha tarjetas y archivadas.

**Estados**: *Tarjeta con saldo a favor* (Mastercard al frente con "Saldo a favor $25.00") · *Archivadas visibles* (interruptor encendido + la cuenta archivada).

## 10 · Gasto semanal
Capturas: `S7-Semanal__*`. Barra superior hija ("Volver a Reportes", campana). Datos: A.7 Gasto semanal (Supermercado).

**Teléfono** (separación 24):
1. Selector de período.
2. Selector de categorías: pastillas (activa con fondo `--texto` y una muestra de 10 px del color de su serie).
3. Resumen: contenedor con rejilla de 3: Asignado $350.00 · Gastado $287.15 · Referencia hoy $326.67.
4. "Ver" + selector Gráficos / Tabla.
5. Con Gráficos: "Por semana" (barras, cifra grande $35.00 "esta semana · en curso" + "43 % de la referencia"), "Acumulado" (cifra $287.15 "gastado en 25 de 30 días" + indicador `positivo` "Vas $39.52 por debajo") y "Contra los 3 anteriores" (2.18). Con Tabla: Semana · Gasto (con barrita) · Ref. · Acum. · Ref. acum., la semana en curso resaltada.

**Computadora**: período y categorías arriba; dos columnas con resumen + barras y acumulado + rango; tabla equivalente abajo a todo el ancho.

**Estados**: *Vista de tabla* · *Varias categorías* (dos pastillas activas, cada una con su color de serie) · *Asignado negativo* (aviso `informacion` "El asignado es negativo, así que la referencia queda en $0.00", barras sin tope de referencia) · *Categoría nueva* (sin comparación: aviso "Categoría nueva: todavía no hay períodos anteriores para comparar").

---

## 11 · Navegación, interacción y movimiento

Lógica completa en `referencia/prototipo-logica.js`. Resumen:

| Acción | Resultado | Transición |
|---|---|---|
| Pestaña a la derecha de la actual | Cambia de sección | La pantalla entra desde 22 px a la derecha con opacidad 0 → 1 (320 ms, `--curva-estandar`) |
| Pestaña a la izquierda | Cambia de sección | Igual desde la izquierda |
| Abrir un detalle (categoría, Gasto semanal) | Pantalla hija | Entra desde 70 px a la derecha (360 ms) |
| Volver | Pantalla padre | Entra desde 50 px a la izquierda (360 ms) |
| "Registrar" | Flujo largo | Sube desde abajo (420 ms, `--curva-entrada`) |
| Cerrar Registrar | Vuelve a donde estabas | Aparece con 8 px hacia arriba (300 ms) |
| Asignar, Más secciones | Hoja inferior | Velo 0 → 1 (280 ms) y la hoja sube (380 ms, `--curva-entrada`); al cerrar baja (200 ms, `--curva-salida`) y recién entonces se desmonta. Las opciones de Más secciones entran escalonadas (40 ms) |
| Campana | Panel de notificaciones | Cae desde arriba (360 ms); avisos escalonados (60 ms); al cerrar sube (200 ms) |
| Tarjeta de atrás (Cuentas) | Pasa al frente | 500 ms, `--curva-entrada` |
| Filtros, Gráfico / Tabla, Aprobar, Guardar | Cambio en el lugar | Sin transición de pantalla; el resultado aparece con `--curva-enfasis` |

Microinteracciones: el botón principal de Inicio tiene un destello al pasar (700 ms) y se hunde al presionar; las filas tocables cambian el fondo a 6 % y mueven su flecha 4 px. Ninguna animación transmite información y todas se apagan con "reducir movimiento".

Accesibilidad: `aria-current="page"` en la pestaña activa; la campana se anuncia "Notificaciones, 2 sin leer"; la Bandeja "Bandeja, 3 por revisar"; las hojas son `role="dialog"` con foco atrapado y se cierran con Escape; los indicadores llevan su etiqueta como texto; los gráficos tienen `role="img"` con descripción y su tabla equivalente.

---

## 12 · Índice de capturas (`referencia/`)

- `S1-Inicio__…` a `S7-Semanal__…`: `telefono-claro`, `telefono-oscuro`, `computadora-claro` (y `computadora-oscuro` en Inicio y Cuentas) y un archivo por estado con su nombre.
- `K1-Navegacion__…`: marco en teléfono (claro, oscuro, Más secciones abierto, Notificaciones abiertas) y computadora.
- `K2-Base__…`, `K3-Dominio-A__…`, `K4-Dominio-B__…`, `K5-Nuevos__…`: tableros de componentes en claro y oscuro.
