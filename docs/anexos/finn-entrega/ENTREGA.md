# Finn 2.0 · entrega del diseño (A.10)

Archivos: `tokens.css`, `tokens.json`, `AGENTES.md` (guía para el agente de frontend), `PANTALLAS.md` (cómo construir cada pantalla y componente), `referencia/` (capturas y lógica de navegación), `iconos/` y los recursos de marca en `finn-marca.zip`. Las pantallas (A.7) y los componentes (A.6) están en el canvas de diseño: tableros S1–S7 y K1–K5, y el prototipo v2.

## Fuentes

- **Big Shoulders Display** 700 / 800 — títulos (`titulo-pantalla`, `titulo-seccion`). No trae cifras tabulares: nunca para montos.
- **Archivo** 400–800, eje de ancho 62–125, con `tnum` — cuerpo y montos (`cifra-principal` al 72 % de ancho, `cifra` al 80 %).
- Ambas se autohospedan (máximo dos familias, A.5).

## Reglas de contraste de los tokens nuevos

| Tema | Par | Contraste | Mínimo | |
|---|---|---|---|---|
| claro | accion (texto) sobre accion-tonal | 6.02:1 | 4.5:1 | ✓ |
| claro | grafico-tinta sobre fondo/superficie/elevada | 16.45:1 | 3:1 | ✓ |
| claro | grafico-otras sobre fondo/superficie/elevada | 5.02:1 | 3:1 | ✓ |
| claro | grafico-serie-1…8 sobre fondo/superficie/elevada (peor) | 3.05:1 | 3:1 | ✓ |
| claro | texto-secundario sobre cuenta-banco | 6.73:1 | 4.5:1 | ✓ |
| claro | texto-secundario sobre cuenta-ahorro | 6.86:1 | 4.5:1 | ✓ |
| claro | texto-secundario sobre cuenta-prestamo | 6.66:1 | 4.5:1 | ✓ |
| claro | texto-secundario sobre cuenta-inversion | 6.58:1 | 4.5:1 | ✓ |
| claro | advertencia-texto sobre cuenta-banco | 4.91:1 | 4.5:1 | ✓ |
| oscuro | accion (texto) sobre accion-tonal | 5.37:1 | 4.5:1 | ✓ |
| oscuro | grafico-tinta sobre fondo/superficie/elevada | 13.61:1 | 3:1 | ✓ |
| oscuro | grafico-otras sobre fondo/superficie/elevada | 5.02:1 | 3:1 | ✓ |
| oscuro | grafico-serie-1…8 sobre fondo/superficie/elevada (peor) | 3.01:1 | 3:1 | ✓ |
| oscuro | texto-secundario sobre cuenta-banco | 7.86:1 | 4.5:1 | ✓ |
| oscuro | texto-secundario sobre cuenta-ahorro | 7.94:1 | 4.5:1 | ✓ |
| oscuro | texto-secundario sobre cuenta-prestamo | 8.06:1 | 4.5:1 | ✓ |
| oscuro | texto-secundario sobre cuenta-inversion | 8.19:1 | 4.5:1 | ✓ |
| oscuro | advertencia-texto sobre cuenta-banco | 9.68:1 | 4.5:1 | ✓ |
| ambos | tarjeta-oro-texto sobre el tono más claro de tarjeta-oro | 4.85:1 | 4.5:1 | ✓ |
| ambos | tarjeta-plata-texto sobre el tono más claro de tarjeta-plata | 5.31:1 | 4.5:1 | ✓ |
| ambos | marca-icono-figura sobre marca-icono-fondo | 16.45:1 | 3:1 | ✓ |

Decorativos (sin requisito de contraste porque nunca llevan información): `marca-grabado`, `cuenta-*`, `cuenta-motivo`, `cuenta-disco`, `tarjeta-oro`, `tarjeta-plata`, `velo`.
La paleta categórica pasa además el validador de gráficos en los dos temas: banda de luminosidad, croma ≥ 0.10, separación con daltonismo entre vecinas (protan/deutan ≥ 13) y con visión normal (≥ 16). Se asigna en orden fijo; “Otras” va en `grafico-otras` con patrón rayado y nunca toma un noveno color.

## Lo agregado (A.10)

| Token o rol | Valor | Uso |
|---|---|---|
| `rotulo` | Rol: Archivo 600, 0.75rem/1.3, mayúsculas +0.06em | Encabezados de tabla y de bloque. Texto: se usa con texto-secundario o texto (≥ 4.5:1). |
| `radio-superpuesto` | 24px | Hojas inferiores, panel de notificaciones, diálogos. |
| `radio-identidad · radio-tarjeta` | 18px · 20px | Tarjetas de identidad de cuentas y cara de las tarjetas de crédito. |
| `accion-tonal` | #E4E9FB / #1C2444 | Fondo de acciones tonales (botón secundario, “+” de asignar, filtros). Texto e ícono en accion. |
| `grafico-tinta` | = marca | Barras de gasto y series principales de un solo color. |
| `grafico-otras` | = texto-terciario, con patrón rayado | Porción “Otras” de la dona (más de 8 categorías). |
| `marca-grabado` | rgba(241,242,238,.08) / rgba(13,16,19,.08) | Decorativo: guilloché del billete de Listo para asignar. |
| `patron-sin-reservar` | rayado 135° de deuda-sin-respaldo-borde sobre -fondo | Segunda señal (forma) de lo no reservado en barras. |
| `cuenta-banco · -ahorro · -prestamo · -inversion` | cuatro tonos por tema | Decorativos: fondo de la identidad de cada tipo de cuenta. Texto encima: texto / texto-secundario. |
| `cuenta-motivo · cuenta-disco` | transparencias | Decorativos: líneas de libreta, anillos, escalones y el disco del ícono. |
| `tarjeta-oro · tarjeta-plata` | degradados oscuros | Decorativos: cara de las tarjetas de crédito en la billetera. |
| `tarjeta-oro-texto · tarjeta-plata-texto` | #F7F1E3 · #F2F4F6 | Texto sobre la cara de la tarjeta. |
| `duracion-transicion · duracion-ambiental` | 340ms · 5000ms | Cambio de pantalla y hojas; bucles decorativos (brillo, halo). |
| `curva-entrada · curva-salida · curva-enfasis` | cubic-bezier(.2,.9,.25,1) · (.4,0,1,1) · (.3,1.4,.5,1) | Entrar y salir de hojas y pantallas; aparecer un resultado. |
| `espacio-1 … espacio-16` | múltiplos de 4 px | Escala de espaciado. |
| `fuente-titulo · fuente-cuerpo` | Big Shoulders Display · Archivo | Familias autohospedadas (máximo dos). |

Componentes visuales propios: billetera de tarjetas, identidad por tipo de cuenta, barra de gastado sobre asignado, fila compacta de la Bandeja, panel de Notificaciones, selector Gráfico / Tabla, gráfico acumulado y de rango (tablero K5).

## Tabla “token de F → token del contrato”

| Token de F | F claro / oscuro | Token del contrato | Contrato claro / oscuro | Estado | Nota |
|---|---|---|---|---|---|
| bg | #F1F2EE / #0D1013 | fondo | #F1F2EE / #0D1013 | igual |  |
| surface | #FFFFFF / #161A1F | superficie | #FFFFFF / #161A1F | igual |  |
| raised | #FFFFFF / #1F242B | superficie-elevada | #FFFFFF / #1F242B | igual | En claro es igual a superficie; se separa con elevacion-2/3. |
| sunken | #E7E9E3 / #090B0D | superficie-hundida | #E7E9E3 / #090B0D | igual |  |
| divider | #D9DCD4 / #2B3139 | borde-sutil, grafico-rejilla | #D9DCD4 / #2B3139 | igual | Solo decorativo (1.39:1). Los controles usan borde-control. |
| ink | #101418 / #EEF0EC | texto | #101418 / #EEF0EC | igual |  |
| ink2 | #474E58 / #AEB5BE | texto-secundario, grafico-referencia | #474E58 / #AEB5BE | igual |  |
| ink3 | #646B76 / #8B939D | texto-terciario | #61686F / #8B939D | ajustado | Claro #646B76 → #61686F: daba 4.39:1 sobre superficie-hundida. |
| disabled | #AEB3BA / #4A515A | texto-deshabilitado | #AEB3BA / #4A515A | igual | Exento de contraste; el control muestra su motivo en texto. |
| action | #1F47D1 / #7A93FF | accion, foco, enlace | #1F47D1 / #7A93FF | igual | El cobalto también es el anillo de foco y el enlace (subrayado). |
| actionHover | #1838A8 / #97ABFF | accion-hover | #1838A8 / #97ABFF | igual |  |
| onAction | #FFFFFF / #0D1013 | texto-sobre-accion | #FFFFFF / #0D1013 | igual |  |
| actionEdge | #1F47D1 / #7A93FF | — | — / — | no se usa | Era idéntico a action. |
| pos · posBg | #0A6B5F / #4FD1B8 | positivo-texto, positivo-fondo | #0A6B5F / #4FD1B8 | igual | Se agrega positivo-borde. |
| warn · warnBg | #835A00 / #F4C04E | advertencia-texto, advertencia-fondo | #835A00 / #F4C04E | ajustado | Mismo color; deja de significar "sin respaldo": solo metas y diferencias. |
| dang · dangBg | #B8400A / #FF8A4C | problema-texto, problema-fondo | #B8400A / #FF8A4C | igual | Se agrega problema-borde. |
| info · infoBg | #5644C2 / #ADA2FF | deuda-texto, deuda-fondo | #5644C2 / #ADA2FF | reasignado | El violeta pasa a deuda; informacion recibe un color nuevo. |
| debt · debtBg | #2B3038 / #D6DAE0 | — | — / — | no se usa | Grafito: se confundía con cero, que también es neutro. |
| onDang | #FFFFFF / #0D1013 | texto-sobre-peligro | #FFFFFF / #0D1013 | igual | Sobre el nuevo rojo de peligro. |
| struct | #101418 / #EEF0EC | marca, marca-icono-fondo | #101418 / #EEF0EC | igual | El grafito del billete es el acento de marca. |
| onStruct | #F1F2EE / #0D1013 | texto-sobre-marca | #F1F2EE / #0D1013 | igual |  |

## Ajustes a la identidad original, con su motivo

| Tipo | Ajuste | Motivo |
|---|---|---|
| Contraste | texto-terciario (claro) #646B76 → #61686F | Daba 4.39:1 sobre superficie-hundida. |
| Contraste | Nuevo borde-control #767D87 / #737B86 | El divisor de F (1.39:1) no sirve como borde de un control (mín. 3:1). |
| Contraste | Sello del billete en tono neutro (texto-sobre-marca) | El anillo de color daba 1.6–3.3:1 sobre el grafito; el estado lo dice el indicador, no el sello. |
| Tres señales | deuda pasa al violeta (antes info); el grafito sale | Grafito y cero eran dos grises: no se distinguían como estados. |
| Contrato | deuda-sin-respaldo con color propio (frambuesa) y glifo de tarjeta tachada | En F, el ámbar decía a la vez "sin respaldo" y "meta atrasada"; el contrato los separa. |
| Contrato | informacion con color propio (azul petróleo) | F no tenía este estado ("En camino", "Reserva excedente"). |
| Contrato | Bordes de estado nuevos, todos ≥ 3:1 | F no tenía la familia -borde. |
| Contrato | peligro en rojo, distinto de problema (naranja) | Eliminar no es un estado financiero; no deben verse iguales. |
| Contrato | Montos en Archivo condensado 800 con tnum | Big Shoulders no tiene cifras tabulares; sigue en títulos. |
| Contrato | Martian Mono sale; su papel lo toma el rol rotulo | Máximo dos familias autohospedadas. |
| Pantallas reales | Rótulos de 10.5 → 12 px; cuerpo 16 px; pequeño 14 px | Uso con una mano en Android de gama media; textos de A.5 en rem. |
| Contrato | Botones de radio 8 → 6 px (radio-control) | Un solo radio para todos los controles. |
| Contrato | Paleta de gráficos nueva | F no la tenía y no puede usar colores de estado. |
| Contraste | El azufre de E no entra en F | Como texto o borde sobre fondo claro da 1.07:1. Si algún día se usa, solo como relleno con texto oscuro encima. |
| Ronda v2 | Radios 6 · 8 · 12 · 4 → 10 · 16 · 24 · redondo | Las cajas se sentían anticuadas; esquinas más amplias y pastillas redondas. |
| Ronda v2 | elevacion-1: de borde a sombra suave; contenedores sin borde | Quitar el aspecto de “caja blanca con borde”. |
| Ronda v2 | Indicador de estado: de cajita con borde a glifo en círculo tenue + etiqueta en color del estado | Menos ruido; se mantienen las tres señales (color, glifo, texto). |
| Ronda v2 | Campos rellenos con línea inferior de borde-control (≥ 3:1) | Coherencia con los contenedores sin borde; el límite del control sigue cumpliendo 3:1. |
| Ronda v2 | Botón secundario tonal (accion-tonal + texto accion) | Jerarquía clara sin borde gris. |
| Ronda v2 | Paleta categórica nueva (8 tonos validados) | La provisional se veía genérica; la nueva pasa daltonismo, visión normal y 3:1, lejos de los estados. |
| Ronda v2 | Movimiento: duraciones 120 · 220 · 400 ms y transiciones de 340 ms | Transiciones de pantalla y hojas; ninguna animación transmite información. |
| Ronda v2 | marca-icono-figura #7A93FF → #F1F2EE | Con el símbolo F apilada, la figura en papel lee mejor en todos los tamaños. |
| Ronda v2 | Bandeja: tarjetas por movimiento → lista compacta | Se sentía saturada; la acción solo aparece donde se resuelve en la lista. |

## Notificaciones (propuesta)

El anexo pide el contador junto al acceso (N7) pero no define el contenido. Propuesta: la Bandeja tiene los movimientos de los SMS por revisar; Notificaciones tiene recordatorios y avisos de Finn (corte de tarjeta con falta de reserva, cuotas próximas, metas cubiertas, reglas aplicadas, cierre de período). “Estás sin conexión” y “Hay una versión nueva” siguen siendo avisos globales, no notificaciones.
