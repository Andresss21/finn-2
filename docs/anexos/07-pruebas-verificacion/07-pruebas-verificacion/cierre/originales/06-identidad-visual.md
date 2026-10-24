# Finn 2.0 — Identidad visual (resultado de Claude Design)

*Reúne en un solo archivo la entrega de Claude Design sobre el anexo A de `05-frontend.md`. Fuente: `finn-entrega.zip` (16/10/2026). Los recursos binarios (íconos SVG, `finn-marca.zip` con símbolo, logotipo e íconos de la app, y las 67 capturas de `referencia/`) los guarda el usuario fuera del proyecto y se usan en la Fase 8.*

## Contenido

1. ENTREGA — fuentes, contraste de los tokens nuevos, lo agregado, tabla "token de F → token del contrato" y ajustes a la identidad.
2. AGENTES — guía de Claude Design para el agente de frontend.
3. PANTALLAS — cómo se construye cada componente y cada pantalla de A.7 (anatomía, tokens, medidas, estados, movimiento) e índice de capturas.
4. tokens.css y tokens.json — valores de los dos temas.

## Puntos a reconciliar con 04 y 05 (revisión previa a la Fase 6)

La entrega cumple el contrato en lo esencial (nombres de tokens y estados, tres señales, términos de A.4, voseo, contraste verificado, dos familias tipográficas). Estas diferencias deben resolverse como cambios (CF) en la Fase 6 o como precisiones para la Fase 8:

| # | Diferencia | Dónde | Qué decidir |
|---|---|---|---|
| R-1 | Tema oscuro por `data-theme="oscuro"` / `prefers-color-scheme`; 05 §10.1 y §10.6 usan la clase `.dark` con next-themes | tokens.css | Configurar next-themes con `attribute="data-theme"` y valores `claro`/`oscuro`, o adaptar los selectores. Precisión a 05 |
| R-2 | Variables sin prefijo (`--radio-control`); 05 §10.1 menciona `--finn-*` | tokens.css | Adoptar los nombres sin prefijo en 05 o agregar el prefijo al integrar. Precisión a 05 |
| R-3 | Roles tipográficos como clases `.t-<rol>`; 05 los expone como utilidades de Tailwind (`text-cifra-principal`) | tokens.css | Mapear las clases a utilidades en el puente `@theme` (Fase 8) |
| R-4 | Signo menos tipográfico U+2212 (`−$26.30`); 04 §7.10 y 05 §5.4 fijan `-$45.00` (guion) | AGENTES, PANTALLAS | Adoptar U+2212 en el módulo de formato y en los mensajes del servidor (CF a 04 §7.10 y 05 §5.4), manteniendo el texto accesible "menos $X" |
| R-5 | Panel de notificaciones que cae desde arriba | PANTALLAS §2.17 | Debe ser la presentación de la ruta `/notificaciones` (N4, URL propia), por ejemplo como ruta interceptada |
| R-6 | Propuesta de contenido de Notificaciones con avisos que 04 §11.2 no tiene (metas cubiertas, reglas aplicadas, cuotas próximas) | ENTREGA | Decidir en la Fase 6 qué motivos nuevos entran (CF a 04) o ajustar la propuesta a los motivos existentes |
| R-7 | Arrastrar un movimiento de la Bandeja a una categoría como atajo (con botones equivalentes) | PANTALLAS §7 | Interacción nueva no prevista en 05; decidir si entra en la primera versión (peso de JS, accesibilidad) |
| R-8 | Componentes visuales propios (billete de LPA, billetera de tarjetas, identidad por tipo de cuenta, barra gastado/asignado, selector Gráfico/Tabla, gráfico acumulado y de rango) | ENTREGA, PANTALLAS | Registrarlos en 05 §10.8 como componentes de dominio con sus props |

---

# 1. ENTREGA

## Finn 2.0 · entrega del diseño (A.10)

Archivos: `tokens.css`, `tokens.json`, `AGENTES.md` (guía para el agente de frontend), `PANTALLAS.md` (cómo construir cada pantalla y componente), `referencia/` (capturas y lógica de navegación), `iconos/` y los recursos de marca en `finn-marca.zip`. Las pantallas (A.7) y los componentes (A.6) están en el canvas de diseño: tableros S1–S7 y K1–K5, y el prototipo v2.

### Fuentes

- **Big Shoulders Display** 700 / 800 — títulos (`titulo-pantalla`, `titulo-seccion`). No trae cifras tabulares: nunca para montos.
- **Archivo** 400–800, eje de ancho 62–125, con `tnum` — cuerpo y montos (`cifra-principal` al 72 % de ancho, `cifra` al 80 %).
- Ambas se autohospedan (máximo dos familias, A.5).

### Reglas de contraste de los tokens nuevos

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

### Lo agregado (A.10)

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

### Tabla “token de F → token del contrato”

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

### Ajustes a la identidad original, con su motivo

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

### Notificaciones (propuesta)

El anexo pide el contador junto al acceso (N7) pero no define el contenido. Propuesta: la Bandeja tiene los movimientos de los SMS por revisar; Notificaciones tiene recordatorios y avisos de Finn (corte de tarjeta con falta de reserva, cuotas próximas, metas cubiertas, reglas aplicadas, cierre de período). “Estás sin conexión” y “Hay una versión nueva” siguen siendo avisos globales, no notificaciones.

---

# 2. AGENTES

## Finn 2.0 · guía para el agente de frontend

Leé esto primero. Explica qué hay en este paquete, en qué orden usarlo y qué reglas no se rompen.

### Qué hay en el paquete

| Archivo | Para qué |
|---|---|
| `tokens.css` | Variables CSS de los dos temas (claro por defecto, oscuro por `prefers-color-scheme` o `data-theme="oscuro"`) y clases `.t-<rol>` de tipografía. **Es la única fuente de colores, radios, sombras, espaciado y movimiento.** |
| `tokens.json` | Los mismos valores como datos (para Tailwind, un tema de CSS-in-JS o Flutter). |
| `PANTALLAS.md` | Cómo se construye cada pantalla de A.7 y cada componente: anatomía, tokens, medidas, estados, interacción y transiciones. |
| `referencia/` | Capturas de cada pantalla y estado (teléfono a 2×, computadora a 1×) y de los tableros de componentes. Úsalas para comparar tu resultado. |
| `referencia/prototipo-logica.js` | La lógica de navegación del prototipo interactivo: pantallas, hojas, dirección de las transiciones. |
| `iconos/` | Los 52 íconos (trazo 1.5, extremos rectos, `currentColor`) y `iconos/estados/` con los 7 glifos de estado (trazo 1.8). |
| `ENTREGA.md` | Fuentes, contraste de los tokens nuevos, lista de lo agregado, tabla F → contrato y ajustes. |
| `finn-marca.zip` | Símbolo, logotipo, íconos de la app, favicon e insignia, con su `manifest-icons.json`. |

### Orden de trabajo recomendado

1. Importá `tokens.css` en la raíz y autohospedá **Archivo** (variable, ejes `wght` 100–900 y `wdth` 62–125) y **Big Shoulders Display** 700 y 800. Nada de otras familias.
2. Construí los componentes base y de dominio de `PANTALLAS.md` §2 antes que las pantallas. Cada componente usa solo variables de `tokens.css`; ningún color en hexadecimal en el código de un componente.
3. Construí el marco: barra superior, barra inferior con la Bandeja al centro, barra lateral en computadora (§3).
4. Construí las pantallas en este orden: Inicio, Presupuesto, Detalle de categoría, Bandeja, Registrar gasto, Cuentas, Gasto semanal (§4–§10). Para cada una hacé primero la vista principal y después cada estado listado.
5. Agregá las transiciones (§11) al final, detrás de `prefers-reduced-motion`.
6. Compará cada pantalla con su captura en `referencia/` en los dos temas.

### Reglas que no se rompen

- **Tres señales en todo estado financiero**: color del estado + su glifo + su etiqueta en texto. Nunca solo color. Los nombres de los estados y sus textos son los de A.4 ("Deuda sin reservar" por categoría, "Te falta reservar" por tarjeta, etc.).
- **Voseo** en todos los textos ("Asigná", "Tocá", "Revisá").
- **Montos** siempre con `font-variant-numeric: tabular-nums`, en Archivo (nunca en Big Shoulders), con signo y dos decimales: `−$26.30`, `$1,350.00`. El signo menos es U+2212.
- **Tocables de 44 × 44 px** como mínimo (`--tactil-minimo`), aunque el dibujo sea más chico.
- **Ningún gesto obligatorio**: si algo se puede arrastrar, también tiene un botón.
- **Resultados en el lugar**: después de una acción queda un "Resultado de una acción" donde estaba el elemento; no desaparece solo. Aprobar un movimiento **no** tiene "Deshacer" (ofrece "Ver transacción"); descartar sí ("Restaurar").
- **Flujos cortos sobre la pantalla** (hoja inferior en teléfono, panel lateral en computadora); **flujos largos a pantalla completa** (Registrar gasto, revisar un movimiento de la Bandeja).
- **Contenedores sin borde**: superficie + `--elevacion-1` + `--radio-contenedor`. Los bordes de 1 px solo para separar filas dentro de un contenedor (`--borde-sutil`).
- **Reducir movimiento**: con la preferencia activa no hay ninguna animación (ya está en `tokens.css`).
- **Datos de ejemplo**: las pantallas usan los datos reales de A.7. Lo marcado "(ejemplo)" en las capturas es un estado que el anexo pide pero sin datos; reemplazalo por los datos reales de la app.

### Cuando algo no está especificado

Mirá la captura del estado más parecido y usá el mismo componente. Si no existe, combiná componentes de §2 con los tokens; no inventes colores, radios ni tamaños nuevos.

---

# 3. PANTALLAS

## Finn 2.0 · cómo construir cada pantalla

Especificación de las 7 pantallas de A.7 y de sus componentes, tal como están diseñadas (estilo v2). Los nombres entre `--` son variables de `tokens.css`; los roles tipográficos son clases `.t-<rol>`. Las medidas en px son a tamaño de letra 16 px; los textos van en rem (los roles ya lo hacen).

---

### 1 · Convenciones

- **Lienzo del teléfono**: 390 px de ancho. Zona segura superior 44 px. Contenido con margen lateral 20 px (`--espacio-5`).
- **Separación entre bloques** de una pantalla: 24 px (`--espacio-6`); en Inicio 28 px.
- **Contenedor** (todo lo que antes era "caja"): `background: var(--superficie); border-radius: var(--radio-contenedor); box-shadow: var(--elevacion-1); overflow: hidden;` sin borde.
- **Filas dentro de un contenedor**: separadas por `1px solid var(--borde-sutil)`; la última sin separador.
- **Encabezado de grupo**: `.t-rotulo` en `--texto-secundario` a la izquierda y el total en `.t-cuerpo-pequeno` `--texto-secundario` a la derecha, con 4 px de margen lateral y 8 px sobre el contenedor.
- **Encabezado de sección**: `.t-titulo-seccion` en `--texto`, alto mínimo 44 px, con un enlace o control a la derecha; 10 px sobre su contenido.
- **Color de montos**: Disponible positivo `--positivo-texto`; cero `--texto`; negativo con débito `--problema-texto`; negativo con tarjeta `--deuda-sin-respaldo-texto`. Montos neutros (gastos, saldos) en `--texto`.

---

### 2 · Componentes

#### 2.1 Botones
| Tipo | Fondo | Texto | Alto | Radio |
|---|---|---|---|---|
| Principal | `--accion` (hover `--accion-hover`, presionado `--accion-presionada`) | `--texto-sobre-accion`, `.t-cuerpo` 600 | 48 (52 en acciones de pantalla, 44 en filas) | `--radio-control` |
| Secundaria (tonal) | `--accion-tonal` | `--accion` | igual | `--radio-control` |
| Peligro | `--peligro` | `--texto-sobre-peligro` | igual | `--radio-control` |
| Discreta (enlace) | transparente | `--enlace`, subrayado al pasar | 44 | — |
| Pastilla de acción en filas | `--accion` o `--accion-tonal` | `.t-etiqueta` 700 | 38 | `--radio-pastilla` |
| "+" de asignar en filas | `--accion-tonal`, círculo 40 px | ícono `plus` 18 px trazo 2.2 en `--accion` | 40 (área 44) | redondo |

Deshabilitado: fondo `--superficie-hundida`, texto `--texto-deshabilitado`, y debajo el motivo en `.t-cuerpo-pequeno` `--texto-secundario`. Enviando: spinner + "Guardando…".

#### 2.2 Campo, selección y buscador (rellenos)
- Caja: alto 48 (52 para la cuenta en Registrar), padding 0 12, fondo `--superficie`, radio `10px 10px 4px 4px`, **sin borde**, `box-shadow: inset 0 -2px 0 var(--borde-control)` (la línea inferior cumple 3:1).
- Foco: `inset 0 -3px 0 var(--foco), 0 0 0 3px var(--accion-tonal)`.
- Error: borde 2 px `--problema-borde` + mensaje con glifo `problema` en `--problema-texto`.
- Etiqueta arriba en `.t-etiqueta` `--texto`; "Opcional" a la derecha en `--texto-terciario`. Prefijo "$" en `--texto-secundario`. Montos con `tabular-nums`.
- Selección abierta: lista en `--superficie-elevada`, `--radio-contenedor`, `--elevacion-2`; opción activa con fondo `--superficie-hundida` y `check`.

#### 2.3 Pastillas de filtro y selector Gráfico / Tabla
- **Filtros** (Presupuesto): pastillas de 40 px de alto, padding 0 14, `--radio-pastilla`. Activa: fondo `--texto`, texto `--fondo`, 700. Inactiva: fondo `--superficie-hundida`, texto `--texto`. Fila con desplazamiento horizontal si no caben.
- **Selector segmentado**: contenedor `--superficie-hundida`, padding 3, `--radio-pastilla`. Opción activa: fondo `--superficie`, `--elevacion-1`, 700; inactiva transparente, `--texto-secundario`. Alto 36. `role="radiogroup"`.

#### 2.4 Indicador de estado (sin cajita)
`[círculo 20 px con fondo --<estado>-fondo y el glifo del estado 13 px en --<estado>-texto] + etiqueta .t-etiqueta 600 en --<estado>-texto`, separación 7 px, sin borde ni fondo de caja. Versión chica: etiqueta a .8125rem. Versión solo lector de pantalla: el círculo + texto oculto. Glifos en `iconos/estados/`.

#### 2.5 Barra de gastado sobre asignado
Pista de 6 px, `--radio-pastilla`, fondo `--superficie-hundida`, segmentos separados 2 px:
- Dentro de lo asignado: un segmento de ancho `gastado/asignado` en `--texto-secundario`.
- Sobregiro: segmento 1 de ancho `asignado/gastado` en `--texto-secundario` + segmento 2 (el excedente) en `--problema-borde` (débito) o `--deuda-sin-respaldo-borde` (tarjeta).
- Con meta: un segmento con el avance en `--positivo-borde` o `--advertencia-borde`.
Crece desde la izquierda al aparecer (800 ms, `--curva-estandar`; el excedente con 250 ms de retraso).

#### 2.6 Fila de categoría
Padding 14 16; columnas `[contenido flexible][botón + 40 px]`, separación 14.
1. Nombre `.t-cuerpo` 600 `--texto` · a la derecha Disponible `.t-cifra` con el color de §1.
2. Barra de gastado (2.5).
3. "Asignado $120.00 · Gastado $146.30" `.t-cuerpo-pequeno` `--texto-secundario`. Período cerrado: candado + "Período cerrado" en `--texto-terciario` y **sin** botón +.
4. Indicadores (2.4), en fila con separación 12, sin montos (el desglose está en el detalle).
Toda la zona de contenido es un enlace al Detalle de categoría.
Computadora: tabla con columnas Categoría (nombre + indicadores) · Asignado · Gastado · Disponible (110 px cada una, alineadas a la derecha).

#### 2.7 Fila de pago de tarjeta
Nombre 600 + número principal a la derecha ("Te falta reservar" en `--deuda-sin-respaldo-texto`; reserva excedente en `--informacion-texto`; pago excedente en `--problema-texto`; al día $0.00 en `--texto`). Debajo "Disponible para pagar $623.43" y el indicador correspondiente.

#### 2.8 Billete "Listo para asignar"
- Contenedor `--marca`, `--radio-contenedor`, padding 22 20 20, con el guilloché: dos `repeating-radial-gradient` de `--marca-grabado` (anillos de 7–8 px y 9–10 px desde esquinas opuestas) que se desplazan muy lento (40 s, decorativo).
- Contenido en `--texto-sobre-marca`: "Listo para asignar" `.t-rotulo` al 80 %; el monto en Archivo 800, ancho 72 %, 3.25rem (cifras que ruedan una vez al entrar, 1.4 s, 90 ms entre dígitos); línea con glifo `informacion` y "En camino $40.00 · Carlos te debe".
- Detrás: un resplandor de `--accion` difuminado (blur 22 px) que respira (6 s). Un brillo cruza cada 7 s.
- Debajo, separado 12: botón principal de 52 px a todo el ancho, "Asignar $312.40" (abre la hoja Asignar).
- Estados: cero → indicador `cero` "Todo asignado"; negativo → indicador `problema` "Asignaste más de lo que tenés" y botón "Quitar $86.15 de una categoría".
- Versión franja (Presupuesto): `--marca`, `--radio-contenedor`, padding 12 14; rótulo + monto `.t-cifra` 1.75rem + "En camino $40.00"; botón "Asignar" de 44 a la derecha.

#### 2.9 Tarjeta de crédito (cara) y billetera
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

#### 2.10 Identidad por tipo de cuenta
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

#### 2.11 Posición neta
Contenedor, padding 18, separación 16: "Posición neta" `.t-rotulo` + $1,668.02 `.t-cifra-principal`; dos filas (Activos / Deudas) con nombre `.t-etiqueta` 700, monto a la derecha, barra de 10 px redonda (Activos al 100 % en `--grafico-tinta`; Deudas al 74.4 % rayada a 135° con `--texto-secundario`, para que se distinga sin color) y el desglose en `.t-cuerpo-pequeno`.

#### 2.12 Fila de movimiento de la Bandeja (compacta)
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

#### 2.13 Resultado de una acción
Contenedor sin borde, alto mínimo 56, padding 8 12 8 14: ícono 18 + texto `.t-cuerpo-pequeno` + enlace 700 en `--enlace`. Aparece con un pequeño rebote (300 ms, `--curva-enfasis`). Textos exactos:
- "Aprobado: SUPER SELECTOS ESCALON · $35.00 · Visa Oro · Supermercado" → "Ver transacción".
- "Descartado: FARMACIA SAN NICOLAS · $12.35" → "Restaurar" (con ícono `undo`).
- "Asignaste $75.00 a Fondo de emergencia." → "Deshacer".

#### 2.14 Aviso en línea
Fondo `--<estado>-fondo`, `--radio-contenedor`, sin borde, padding 12 14; glifo 20 + título `.t-etiqueta` 700 en `--<estado>-texto` + texto `.t-cuerpo-pequeno` `--texto` + acción subrayada en `--<estado>-texto`.

#### 2.15 Selector de período
Contenedor, padding 10 12. Botones "Período anterior / siguiente": círculos de 44, fondo `--superficie-hundida`, `arrowL` / `arrowR`. Centro: fechas "21/09 – 20/10/2026" `.t-cuerpo` 700 + ícono de estado + "Actual · 25 días transcurridos · quedan 5" `.t-cuerpo-pequeno`. Si no es el actual: "Ir al período actual" (discreta) debajo. Estados: Actual (`clock`), Cerrado (`lock`), Futuro (`cal`), De transición (`swap`).

#### 2.16 Fila de transacción, día y fecha
- Encabezado de día: `.t-rotulo` `--texto-secundario` ("15 oct · hoy").
- Insignia de fecha (Inicio, consumos): mes `.t-rotulo` .6875rem arriba + día en Archivo 800 ancho 72 % 1.5rem.
- Fila simple: columnas `[48][1fr][auto]`, alto mínimo 60, padding 0 14; título 600 + subtítulo; monto `.t-cifra` (ingresos en `--positivo-texto` con "+").

#### 2.17 Hojas, menú y panel de notificaciones
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

#### 2.18 Gráficos
Siempre dentro de un contenedor (padding 18 16), con: una **cifra grande** arriba (`.t-cifra-principal` 2.25rem + subtítulo `.t-cuerpo-pequeno`; a la derecha un dato o indicador), el gráfico SVG, la leyenda debajo y el selector Gráfico / Tabla o la tabla equivalente. Sin eje Y ni rejilla salvo una línea base (`--grafico-rejilla`). Textos del SVG en Archivo 11 px (`--texto-secundario`); valores en Archivo 700 ancho 80 % 12.5 px (`--texto`).
- **Barras por semana**: barras de 32 px con solo las esquinas superiores redondeadas (radio 8), degradado vertical de `--grafico-tinta` (100 % → 62 %); la semana en curso en `--accion` con sombra `drop-shadow(0 6px 10px <accion 33 %>)` y un punto de 2 px bajo su etiqueta (en negrita). **Referencia**: un tope horizontal de 44 px en `--grafico-referencia` (2 px, extremos con círculos de 2.6 px rellenos de `--superficie`), se distingue por su forma. Semana futura: barra rayada con contorno punteado `--borde-control` y "faltan 2 días". Las barras crecen desde la base (700 ms, 80 ms entre barras).
- **Acumulado**: línea suavizada de 3 px en `--accion` que se dibuja (1.4 s) con área bajo la curva en degradado `--accion` 28 % → 0; referencia acumulada punteada (puntos redondos cada 6 px) en `--grafico-referencia`; proyección futura punteada al 60 %; punto actual de 5 px con anillo `--superficie` y halo que pulsa; píldora con el monto ($287.15) en `--accion`; distancia a la referencia como trazo vertical en `--positivo-borde` y "−$39.52 de la referencia" en `--positivo-texto`; "Asignado $350.00" arriba a la derecha.
- **Contra los 3 períodos anteriores**: una fila por semana: `S1` `.t-rotulo` · pista de 22 px con una cápsula `--superficie-hundida` del mínimo al máximo de los anteriores, una marca vertical de 2 × 14 px por cada período anterior en `--texto-secundario` y el período actual como círculo de 16 px `--accion` con anillo `--superficie` · valor a la derecha. Escala $0 · $50 · $100 debajo.
- **Historial de 6 períodos** (detalle): barras de 26 px (tinta; las que se pasaron en `--problema-borde` con el glifo `problema` debajo del mes), tope de asignado (34 px) y valor encima en `--problema-texto` si se pasó. Cifra grande: promedio gastado + indicador "Se pasó 2 de 6".
- **Dona**: anillo de 20 px, 3 px de separación entre porciones, total al centro (Archivo 800 ancho 72 %) + "gastado"; colores `--grafico-serie-1…8` en orden fijo (la categoría conserva su color aunque cambie el filtro); "Otras" en `--grafico-otras` rayado. Lista a la derecha: muestra 12 × 12 radio 4, nombre, monto 600, porcentaje.
- **Tabla equivalente**: encabezados `.t-rotulo` `--texto-secundario`, filas de 11 px de padding vertical separadas por `--borde-sutil`, números `tabular-nums` con ancho 88 %, la fila actual resaltada con fondo `--superficie-hundida` y radio 10, barritas de 52 × 4 px bajo los montos de gasto.

#### 2.19 Vacíos y errores
- Vacío: círculo de 72 px con `--positivo-fondo` y glifo 32 px, título `.t-titulo-seccion`, texto `.t-cuerpo-pequeno` de 280 px máximo, centrado.
- Gráfico sin datos: caja `--superficie-hundida` radio 16 de 180 px con ícono `chart` y el texto.

---

### 3 · Marco

#### 3.1 Teléfono
- **Barra superior** (alto mínimo 60, padding 0 8 0 20): título `.t-titulo-pantalla` (2rem; 1.625rem cuando hay "atrás" o "cerrar"; una línea con puntos suspensivos) · botón "Registrar" (44 de alto, padding 0 14 0 10, `--accion`, ícono `plus` 18 trazo 2.2, `.t-etiqueta` 700) · campana de 44 con contador (círculo de 17 px `--accion`, texto 10.5 px 700, anillo de 2 px `--fondo`) · menú ☰ de 44 ("Más secciones").
  - En pantallas hijas: flecha "Volver a <padre>" a la izquierda (44, margen −8) y, a la derecha, campana + "Más acciones" (`more`).
  - En flujos largos: "Cerrar" (`x`) a la izquierda y sin acciones a la derecha.
- La barra superior y la inferior quedan **fijas**; solo el contenido se desplaza (sin barra de desplazamiento visible).
- **Barra inferior** (padding 6 4 22, fondo `--superficie`, línea superior `--borde-sutil`): Inicio · Presupuesto · **Bandeja** · Actividad · Cuentas.
  - Pestaña: ícono 22 + nombre .75rem, alto mínimo 56; activa en `--texto` 700 con una raya de 28 × 3 px `--accion` arriba (radio inferior 3) que se dibuja desde el centro (400 ms); inactiva en `--texto-secundario` 500.
  - Bandeja: botón de 62 × 62, radio 18, fondo `--marca` (activa: `--accion`), borde de 4 px `--fondo`, `--elevacion-2`, sube 26 px sobre la barra; ícono `inbox` 24 en `--texto-sobre-marca`; contador de 22 px arriba a la derecha (`--accion` con borde 2 px `--fondo`); "Bandeja" .75rem 700 debajo. Mientras hay movimientos por revisar, dos halos de 2 px `--accion` salen del botón (2.8 s, desfasados 1.4 s; decorativo).
- Pie fijo de flujo largo: padding 12 16 26, fondo `--superficie`, línea superior `--borde-sutil`, botón principal de 52 a todo el ancho.

#### 3.2 Computadora (1440 px)
- **Barra lateral** de 248 px (padding 24 14, fondo `--superficie`, línea derecha `--borde-sutil`): marca (cuadro de 34 px `--marca` con la "F" o el símbolo + "Finn" `.t-titulo-seccion`) · botón principal "Registrar" a todo el ancho · navegación principal (filas de 44, radio `--radio-control`; activa con fondo `--superficie-hundida`, texto 700 y raya lateral de 3 px `--accion`; Bandeja con contador `--marca`) · "Más" `.t-rotulo` `--texto-terciario` + secundarias (filas de 40, Notificaciones con contador).
- **Contenido**: padding 32 48 48, separación 28. Encabezado: (enlace "atrás" `.t-cuerpo-pequeno` si corresponde) + título 2.5rem; a la derecha acciones y la campana en círculo de 44 con fondo `--superficie-hundida`.
- Los flujos cortos se abren como **panel lateral** en lugar de hoja inferior.

---

### 4 · Inicio — "¿Algo necesita mi atención?"
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

### 5 · Presupuesto
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

### 6 · Detalle de categoría · Restaurantes
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

### 7 · Bandeja
Capturas: `S4-Bandeja__*`. Datos: A.7 Bandeja.

**Teléfono** (separación 24):
1. Selector segmentado "Por revisar · 3" / "Descartados".
2. Resumen: "3 por revisar" `.t-titulo-seccion` + "2 pendientes · 1 con coincidencia" a la derecha.
3. Un contenedor con las filas compactas (2.12): SUPER SELECTOS ESCALON (listo para aprobar, con Aprobar/Revisar) · FARMACIA SAN NICOLAS (falta la categoría) · NETFLIX.COM (con coincidencia).
4. Nota `--texto-terciario`: "Tocá un movimiento para revisarlo completo. Arrastrar a una categoría es un atajo; los botones siempre están."
Tocar una fila sin acción abre la revisión del movimiento **a pantalla completa** (flujo largo).

**Computadora**: lista a la izquierda y la revisión del movimiento seleccionado a la derecha (comercio, monto grande, SMS citado, Cuenta/Fecha/Categoría, botones Aprobar · Editar · Descartar).

**Estados**: *Aprobado con un toque* (el resultado "Aprobado: … $35.00 …" con "Ver transacción" en lugar de la fila; resumen "2 por revisar") · *Descartado* (resultado con "Restaurar") · *Vista de descartados* (filas apagadas en `--texto-secundario` con "Restaurar") · *Bandeja al día* (vacío 2.19 con "Bandeja al día") · *No reconocido, con error, posible duplicado y datos faltantes* (las cuatro filas de 2.12 con sus acciones).

### 8 · Registrar gasto con división (flujo largo)
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

### 9 · Cuentas
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

### 10 · Gasto semanal
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

### 11 · Navegación, interacción y movimiento

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

### 12 · Índice de capturas (`referencia/`)

- `S1-Inicio__…` a `S7-Semanal__…`: `telefono-claro`, `telefono-oscuro`, `computadora-claro` (y `computadora-oscuro` en Inicio y Cuentas) y un archivo por estado con su nombre.
- `K1-Navegacion__…`: marco en teléfono (claro, oscuro, Más secciones abierto, Notificaciones abiertas) y computadora.
- `K2-Base__…`, `K3-Dominio-A__…`, `K4-Dominio-B__…`, `K5-Nuevos__…`: tableros de componentes en claro y oscuro.

---

# 4. tokens.css

```css
/* Finn 2.0 · tokens (A.3 + agregados de A.10). Claro por defecto; oscuro por preferencia del sistema o data-theme="oscuro". */

:root {
  --tarjeta-oro: linear-gradient(135deg, #15120C 0%, #3A301E 40%, #6E5631 78%, #7E6638 100%);
  --tarjeta-plata: linear-gradient(135deg, #121519 0%, #2B3138 45%, #4A525C 80%, #5C6670 100%);
  --patron-sin-reservar: repeating-linear-gradient(135deg, var(--deuda-sin-respaldo-borde) 0 3px, var(--deuda-sin-respaldo-fondo) 3px 6px);
  --fuente-titulo: "Big Shoulders Display", "Archivo", system-ui, sans-serif;
  --fuente-cuerpo: "Archivo", system-ui, sans-serif;
  --espacio-1: 4px;
  --espacio-2: 8px;
  --espacio-3: 12px;
  --espacio-4: 16px;
  --espacio-5: 20px;
  --espacio-6: 24px;
  --espacio-8: 32px;
  --espacio-10: 40px;
  --espacio-12: 48px;
  --espacio-16: 64px;
  --radio-control: 10px;
  --radio-contenedor: 16px;
  --radio-pastilla: 999px;
  --radio-superpuesto: 24px;
  --radio-identidad: 18px;
  --radio-tarjeta: 20px;
  --duracion-rapida: 120ms;
  --duracion-normal: 220ms;
  --duracion-lenta: 400ms;
  --duracion-transicion: 340ms;
  --duracion-ambiental: 5000ms;
  --curva-estandar: cubic-bezier(.2, .8, .2, 1);
  --curva-entrada: cubic-bezier(.2, .9, .25, 1);
  --curva-salida: cubic-bezier(.4, 0, 1, 1);
  --curva-enfasis: cubic-bezier(.3, 1.4, .5, 1);
  --capa-marco: 10;
  --capa-superpuesto: 40;
  --capa-aviso: 50;
  --tactil-minimo: 44px;
}

:root {
  color-scheme: light;
  --fondo: #F1F2EE;
  --superficie: #FFFFFF;
  --superficie-elevada: #FFFFFF;
  --superficie-hundida: #E7E9E3;
  --borde-sutil: #D9DCD4;
  --borde-control: #767D87;
  --foco: #1F47D1;
  --velo: rgba(16,20,24,.5);
  --texto: #101418;
  --texto-secundario: #474E58;
  --texto-terciario: #61686F;
  --texto-deshabilitado: #AEB3BA;
  --enlace: #1F47D1;
  --accion: #1F47D1;
  --accion-hover: #1838A8;
  --accion-presionada: #132C85;
  --texto-sobre-accion: #FFFFFF;
  --accion-secundaria: #E7E9E3;
  --peligro: #B42318;
  --texto-sobre-peligro: #FFFFFF;
  --marca: #101418;
  --texto-sobre-marca: #F1F2EE;
  --positivo-texto: #0A6B5F;
  --positivo-fondo: #DDF2EE;
  --positivo-borde: #13897A;
  --cero-texto: #474E58;
  --cero-fondo: #E7E9E3;
  --cero-borde: #767D87;
  --advertencia-texto: #835A00;
  --advertencia-fondo: #FFF0C2;
  --advertencia-borde: #A87800;
  --problema-texto: #B8400A;
  --problema-fondo: #FFE3D3;
  --problema-borde: #C9521C;
  --deuda-texto: #5644C2;
  --deuda-fondo: #ECE9FB;
  --deuda-borde: #6A58D6;
  --deuda-sin-respaldo-texto: #A3195B;
  --deuda-sin-respaldo-fondo: #FCE4EF;
  --deuda-sin-respaldo-borde: #C02A6E;
  --informacion-texto: #0E5E86;
  --informacion-fondo: #E0F0F8;
  --informacion-borde: #1A76A6;
  --grafico-serie-1: #2489EA;
  --grafico-serie-2: #E25A73;
  --grafico-serie-3: #7A2A90;
  --grafico-serie-4: #266600;
  --grafico-serie-5: #99578A;
  --grafico-serie-6: #739629;
  --grafico-serie-7: #B16CD9;
  --grafico-serie-8: #88392E;
  --grafico-referencia: #474E58;
  --grafico-rejilla: #D9DCD4;
  --marca-icono-fondo: #101418;
  --marca-icono-figura: #F1F2EE;
  --accion-tonal: #E4E9FB;
  --grafico-tinta: #101418;
  --grafico-otras: #61686F;
  --marca-grabado: rgba(241,242,238,.08);
  --cuenta-banco: #DCE8EE;
  --cuenta-ahorro: #E2EBDA;
  --cuenta-prestamo: #EFE3D8;
  --cuenta-inversion: #E4E2F0;
  --cuenta-motivo: rgba(16,20,24,.08);
  --cuenta-disco: rgba(255,255,255,.7);
  --tarjeta-oro-texto: #F7F1E3;
  --tarjeta-plata-texto: #F2F4F6;
  --elevacion-1: 0 1px 2px rgba(16,20,24,.05), 0 10px 28px -10px rgba(16,20,24,.16);
  --elevacion-2: 0 8px 24px rgba(16,20,24,.12);
  --elevacion-3: 0 18px 48px rgba(16,20,24,.22);
}

:root[data-theme="oscuro"] {
  color-scheme: dark;
  --fondo: #0D1013;
  --superficie: #161A1F;
  --superficie-elevada: #1F242B;
  --superficie-hundida: #090B0D;
  --borde-sutil: #2B3139;
  --borde-control: #737B86;
  --foco: #7A93FF;
  --velo: rgba(0,0,0,.6);
  --texto: #EEF0EC;
  --texto-secundario: #AEB5BE;
  --texto-terciario: #8B939D;
  --texto-deshabilitado: #4A515A;
  --enlace: #7A93FF;
  --accion: #7A93FF;
  --accion-hover: #97ABFF;
  --accion-presionada: #B3C2FF;
  --texto-sobre-accion: #0D1013;
  --accion-secundaria: #1F242B;
  --peligro: #FF7A6E;
  --texto-sobre-peligro: #0D1013;
  --marca: #EEF0EC;
  --texto-sobre-marca: #0D1013;
  --positivo-texto: #4FD1B8;
  --positivo-fondo: #0F2E2A;
  --positivo-borde: #2FAE97;
  --cero-texto: #AEB5BE;
  --cero-fondo: #1F242B;
  --cero-borde: #737B86;
  --advertencia-texto: #F4C04E;
  --advertencia-fondo: #33280B;
  --advertencia-borde: #C99A2E;
  --problema-texto: #FF8A4C;
  --problema-fondo: #3A1A0C;
  --problema-borde: #E0702F;
  --deuda-texto: #ADA2FF;
  --deuda-fondo: #221E45;
  --deuda-borde: #8C80F0;
  --deuda-sin-respaldo-texto: #FF7AB6;
  --deuda-sin-respaldo-fondo: #3D1129;
  --deuda-sin-respaldo-borde: #E0559A;
  --informacion-texto: #6CC4F0;
  --informacion-fondo: #0B2A3A;
  --informacion-borde: #3FA3D6;
  --grafico-serie-1: #0072CE;
  --grafico-serie-2: #B34B53;
  --grafico-serie-3: #A047B9;
  --grafico-serie-4: #438F21;
  --grafico-serie-5: #975889;
  --grafico-serie-6: #6A8F02;
  --grafico-serie-7: #9A47C6;
  --grafico-serie-8: #A6584C;
  --grafico-referencia: #AEB5BE;
  --grafico-rejilla: #2B3139;
  --marca-icono-fondo: #101418;
  --marca-icono-figura: #F1F2EE;
  --accion-tonal: #1C2444;
  --grafico-tinta: #EEF0EC;
  --grafico-otras: #8B939D;
  --marca-grabado: rgba(13,16,19,.08);
  --cuenta-banco: #13222B;
  --cuenta-ahorro: #172219;
  --cuenta-prestamo: #261C15;
  --cuenta-inversion: #1C1B2A;
  --cuenta-motivo: rgba(238,240,236,.07);
  --cuenta-disco: rgba(255,255,255,.07);
  --tarjeta-oro-texto: #F7F1E3;
  --tarjeta-plata-texto: #F2F4F6;
  --elevacion-1: inset 0 1px 0 rgba(255,255,255,.05), 0 10px 30px -12px rgba(0,0,0,.75);
  --elevacion-2: 0 8px 24px rgba(0,0,0,.45);
  --elevacion-3: 0 18px 48px rgba(0,0,0,.6);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="claro"]) {
    color-scheme: dark;
    --fondo: #0D1013;
    --superficie: #161A1F;
    --superficie-elevada: #1F242B;
    --superficie-hundida: #090B0D;
    --borde-sutil: #2B3139;
    --borde-control: #737B86;
    --foco: #7A93FF;
    --velo: rgba(0,0,0,.6);
    --texto: #EEF0EC;
    --texto-secundario: #AEB5BE;
    --texto-terciario: #8B939D;
    --texto-deshabilitado: #4A515A;
    --enlace: #7A93FF;
    --accion: #7A93FF;
    --accion-hover: #97ABFF;
    --accion-presionada: #B3C2FF;
    --texto-sobre-accion: #0D1013;
    --accion-secundaria: #1F242B;
    --peligro: #FF7A6E;
    --texto-sobre-peligro: #0D1013;
    --marca: #EEF0EC;
    --texto-sobre-marca: #0D1013;
    --positivo-texto: #4FD1B8;
    --positivo-fondo: #0F2E2A;
    --positivo-borde: #2FAE97;
    --cero-texto: #AEB5BE;
    --cero-fondo: #1F242B;
    --cero-borde: #737B86;
    --advertencia-texto: #F4C04E;
    --advertencia-fondo: #33280B;
    --advertencia-borde: #C99A2E;
    --problema-texto: #FF8A4C;
    --problema-fondo: #3A1A0C;
    --problema-borde: #E0702F;
    --deuda-texto: #ADA2FF;
    --deuda-fondo: #221E45;
    --deuda-borde: #8C80F0;
    --deuda-sin-respaldo-texto: #FF7AB6;
    --deuda-sin-respaldo-fondo: #3D1129;
    --deuda-sin-respaldo-borde: #E0559A;
    --informacion-texto: #6CC4F0;
    --informacion-fondo: #0B2A3A;
    --informacion-borde: #3FA3D6;
    --grafico-serie-1: #0072CE;
    --grafico-serie-2: #B34B53;
    --grafico-serie-3: #A047B9;
    --grafico-serie-4: #438F21;
    --grafico-serie-5: #975889;
    --grafico-serie-6: #6A8F02;
    --grafico-serie-7: #9A47C6;
    --grafico-serie-8: #A6584C;
    --grafico-referencia: #AEB5BE;
    --grafico-rejilla: #2B3139;
    --marca-icono-fondo: #101418;
    --marca-icono-figura: #F1F2EE;
    --accion-tonal: #1C2444;
    --grafico-tinta: #EEF0EC;
    --grafico-otras: #8B939D;
    --marca-grabado: rgba(13,16,19,.08);
    --cuenta-banco: #13222B;
    --cuenta-ahorro: #172219;
    --cuenta-prestamo: #261C15;
    --cuenta-inversion: #1C1B2A;
    --cuenta-motivo: rgba(238,240,236,.07);
    --cuenta-disco: rgba(255,255,255,.07);
    --tarjeta-oro-texto: #F7F1E3;
    --tarjeta-plata-texto: #F2F4F6;
    --elevacion-1: inset 0 1px 0 rgba(255,255,255,.05), 0 10px 30px -12px rgba(0,0,0,.75);
    --elevacion-2: 0 8px 24px rgba(0,0,0,.45);
    --elevacion-3: 0 18px 48px rgba(0,0,0,.6);
  }
}

/* Roles tipográficos (A.5): en rem; los montos con cifras tabulares */
.t-cifra-principal { font-family: var(--fuente-cuerpo); font-size: 2.75rem; line-height: 1.05; font-weight: 800; font-stretch: 72%; font-variant-numeric: tabular-nums; }
.t-cifra { font-family: var(--fuente-cuerpo); font-size: 1.25rem; line-height: 1.25; font-weight: 700; font-stretch: 80%; font-variant-numeric: tabular-nums; }
.t-titulo-pantalla { font-family: var(--fuente-titulo); font-size: 2rem; line-height: 1.05; font-weight: 800; letter-spacing: .01em; text-transform: uppercase; }
.t-titulo-seccion { font-family: var(--fuente-titulo); font-size: 1.375rem; line-height: 1.15; font-weight: 700; letter-spacing: .01em; text-transform: uppercase; }
.t-cuerpo { font-family: var(--fuente-cuerpo); font-size: 1rem; line-height: 1.5; font-weight: 400; }
.t-cuerpo-pequeno { font-family: var(--fuente-cuerpo); font-size: .875rem; line-height: 1.45; font-weight: 400; }
.t-etiqueta { font-family: var(--fuente-cuerpo); font-size: .875rem; line-height: 1.35; font-weight: 500; }
.t-rotulo { font-family: var(--fuente-cuerpo); font-size: .75rem; line-height: 1.3; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

# 5. tokens.json

```json
{
  "$descripcion": "Finn 2.0 · tokens del contrato (A.3) y agregados (A.10). Los colores tienen valor claro y oscuro.",
  "color": {
    "fondo": {
      "claro": "#F1F2EE",
      "oscuro": "#0D1013"
    },
    "superficie": {
      "claro": "#FFFFFF",
      "oscuro": "#161A1F"
    },
    "superficie-elevada": {
      "claro": "#FFFFFF",
      "oscuro": "#1F242B"
    },
    "superficie-hundida": {
      "claro": "#E7E9E3",
      "oscuro": "#090B0D"
    },
    "borde-sutil": {
      "claro": "#D9DCD4",
      "oscuro": "#2B3139"
    },
    "borde-control": {
      "claro": "#767D87",
      "oscuro": "#737B86"
    },
    "foco": {
      "claro": "#1F47D1",
      "oscuro": "#7A93FF"
    },
    "velo": {
      "claro": "rgba(16,20,24,.5)",
      "oscuro": "rgba(0,0,0,.6)"
    },
    "texto": {
      "claro": "#101418",
      "oscuro": "#EEF0EC"
    },
    "texto-secundario": {
      "claro": "#474E58",
      "oscuro": "#AEB5BE"
    },
    "texto-terciario": {
      "claro": "#61686F",
      "oscuro": "#8B939D"
    },
    "texto-deshabilitado": {
      "claro": "#AEB3BA",
      "oscuro": "#4A515A"
    },
    "enlace": {
      "claro": "#1F47D1",
      "oscuro": "#7A93FF"
    },
    "accion": {
      "claro": "#1F47D1",
      "oscuro": "#7A93FF"
    },
    "accion-hover": {
      "claro": "#1838A8",
      "oscuro": "#97ABFF"
    },
    "accion-presionada": {
      "claro": "#132C85",
      "oscuro": "#B3C2FF"
    },
    "texto-sobre-accion": {
      "claro": "#FFFFFF",
      "oscuro": "#0D1013"
    },
    "accion-secundaria": {
      "claro": "#E7E9E3",
      "oscuro": "#1F242B"
    },
    "peligro": {
      "claro": "#B42318",
      "oscuro": "#FF7A6E"
    },
    "texto-sobre-peligro": {
      "claro": "#FFFFFF",
      "oscuro": "#0D1013"
    },
    "marca": {
      "claro": "#101418",
      "oscuro": "#EEF0EC"
    },
    "texto-sobre-marca": {
      "claro": "#F1F2EE",
      "oscuro": "#0D1013"
    },
    "positivo-texto": {
      "claro": "#0A6B5F",
      "oscuro": "#4FD1B8"
    },
    "positivo-fondo": {
      "claro": "#DDF2EE",
      "oscuro": "#0F2E2A"
    },
    "positivo-borde": {
      "claro": "#13897A",
      "oscuro": "#2FAE97"
    },
    "cero-texto": {
      "claro": "#474E58",
      "oscuro": "#AEB5BE"
    },
    "cero-fondo": {
      "claro": "#E7E9E3",
      "oscuro": "#1F242B"
    },
    "cero-borde": {
      "claro": "#767D87",
      "oscuro": "#737B86"
    },
    "advertencia-texto": {
      "claro": "#835A00",
      "oscuro": "#F4C04E"
    },
    "advertencia-fondo": {
      "claro": "#FFF0C2",
      "oscuro": "#33280B"
    },
    "advertencia-borde": {
      "claro": "#A87800",
      "oscuro": "#C99A2E"
    },
    "problema-texto": {
      "claro": "#B8400A",
      "oscuro": "#FF8A4C"
    },
    "problema-fondo": {
      "claro": "#FFE3D3",
      "oscuro": "#3A1A0C"
    },
    "problema-borde": {
      "claro": "#C9521C",
      "oscuro": "#E0702F"
    },
    "deuda-texto": {
      "claro": "#5644C2",
      "oscuro": "#ADA2FF"
    },
    "deuda-fondo": {
      "claro": "#ECE9FB",
      "oscuro": "#221E45"
    },
    "deuda-borde": {
      "claro": "#6A58D6",
      "oscuro": "#8C80F0"
    },
    "deuda-sin-respaldo-texto": {
      "claro": "#A3195B",
      "oscuro": "#FF7AB6"
    },
    "deuda-sin-respaldo-fondo": {
      "claro": "#FCE4EF",
      "oscuro": "#3D1129"
    },
    "deuda-sin-respaldo-borde": {
      "claro": "#C02A6E",
      "oscuro": "#E0559A"
    },
    "informacion-texto": {
      "claro": "#0E5E86",
      "oscuro": "#6CC4F0"
    },
    "informacion-fondo": {
      "claro": "#E0F0F8",
      "oscuro": "#0B2A3A"
    },
    "informacion-borde": {
      "claro": "#1A76A6",
      "oscuro": "#3FA3D6"
    },
    "grafico-serie-1": {
      "claro": "#2489EA",
      "oscuro": "#0072CE"
    },
    "grafico-serie-2": {
      "claro": "#E25A73",
      "oscuro": "#B34B53"
    },
    "grafico-serie-3": {
      "claro": "#7A2A90",
      "oscuro": "#A047B9"
    },
    "grafico-serie-4": {
      "claro": "#266600",
      "oscuro": "#438F21"
    },
    "grafico-serie-5": {
      "claro": "#99578A",
      "oscuro": "#975889"
    },
    "grafico-serie-6": {
      "claro": "#739629",
      "oscuro": "#6A8F02"
    },
    "grafico-serie-7": {
      "claro": "#B16CD9",
      "oscuro": "#9A47C6"
    },
    "grafico-serie-8": {
      "claro": "#88392E",
      "oscuro": "#A6584C"
    },
    "grafico-referencia": {
      "claro": "#474E58",
      "oscuro": "#AEB5BE"
    },
    "grafico-rejilla": {
      "claro": "#D9DCD4",
      "oscuro": "#2B3139"
    },
    "marca-icono-fondo": {
      "claro": "#101418",
      "oscuro": "#101418"
    },
    "marca-icono-figura": {
      "claro": "#F1F2EE",
      "oscuro": "#F1F2EE"
    },
    "accion-tonal": {
      "claro": "#E4E9FB",
      "oscuro": "#1C2444"
    },
    "grafico-tinta": {
      "claro": "#101418",
      "oscuro": "#EEF0EC"
    },
    "grafico-otras": {
      "claro": "#61686F",
      "oscuro": "#8B939D"
    },
    "marca-grabado": {
      "claro": "rgba(241,242,238,.08)",
      "oscuro": "rgba(13,16,19,.08)"
    },
    "cuenta-banco": {
      "claro": "#DCE8EE",
      "oscuro": "#13222B"
    },
    "cuenta-ahorro": {
      "claro": "#E2EBDA",
      "oscuro": "#172219"
    },
    "cuenta-prestamo": {
      "claro": "#EFE3D8",
      "oscuro": "#261C15"
    },
    "cuenta-inversion": {
      "claro": "#E4E2F0",
      "oscuro": "#1C1B2A"
    },
    "cuenta-motivo": {
      "claro": "rgba(16,20,24,.08)",
      "oscuro": "rgba(238,240,236,.07)"
    },
    "cuenta-disco": {
      "claro": "rgba(255,255,255,.7)",
      "oscuro": "rgba(255,255,255,.07)"
    },
    "tarjeta-oro-texto": {
      "claro": "#F7F1E3",
      "oscuro": "#F7F1E3"
    },
    "tarjeta-plata-texto": {
      "claro": "#F2F4F6",
      "oscuro": "#F2F4F6"
    }
  },
  "elevacion": {
    "elevacion-1": {
      "claro": "0 1px 2px rgba(16,20,24,.05), 0 10px 28px -10px rgba(16,20,24,.16)",
      "oscuro": "inset 0 1px 0 rgba(255,255,255,.05), 0 10px 30px -12px rgba(0,0,0,.75)"
    },
    "elevacion-2": {
      "claro": "0 8px 24px rgba(16,20,24,.12)",
      "oscuro": "0 8px 24px rgba(0,0,0,.45)"
    },
    "elevacion-3": {
      "claro": "0 18px 48px rgba(16,20,24,.22)",
      "oscuro": "0 18px 48px rgba(0,0,0,.6)"
    }
  },
  "otros": {
    "tarjeta-oro": "linear-gradient(135deg, #15120C 0%, #3A301E 40%, #6E5631 78%, #7E6638 100%)",
    "tarjeta-plata": "linear-gradient(135deg, #121519 0%, #2B3138 45%, #4A525C 80%, #5C6670 100%)",
    "patron-sin-reservar": "repeating-linear-gradient(135deg, var(--deuda-sin-respaldo-borde) 0 3px, var(--deuda-sin-respaldo-fondo) 3px 6px)",
    "fuente-titulo": "\"Big Shoulders Display\", \"Archivo\", system-ui, sans-serif",
    "fuente-cuerpo": "\"Archivo\", system-ui, sans-serif",
    "espacio-1": "4px",
    "espacio-2": "8px",
    "espacio-3": "12px",
    "espacio-4": "16px",
    "espacio-5": "20px",
    "espacio-6": "24px",
    "espacio-8": "32px",
    "espacio-10": "40px",
    "espacio-12": "48px",
    "espacio-16": "64px",
    "radio-control": "10px",
    "radio-contenedor": "16px",
    "radio-pastilla": "999px",
    "radio-superpuesto": "24px",
    "radio-identidad": "18px",
    "radio-tarjeta": "20px",
    "duracion-rapida": "120ms",
    "duracion-normal": "220ms",
    "duracion-lenta": "400ms",
    "duracion-transicion": "340ms",
    "duracion-ambiental": "5000ms",
    "curva-estandar": "cubic-bezier(.2, .8, .2, 1)",
    "curva-entrada": "cubic-bezier(.2, .9, .25, 1)",
    "curva-salida": "cubic-bezier(.4, 0, 1, 1)",
    "curva-enfasis": "cubic-bezier(.3, 1.4, .5, 1)",
    "capa-marco": "10",
    "capa-superpuesto": "40",
    "capa-aviso": "50",
    "tactil-minimo": "44px"
  },
  "tipografia": {
    "cifra-principal": {
      "fuente": "fuente-cuerpo",
      "tamano": "2.75rem",
      "interlineado": "1.05",
      "peso": 800,
      "extra": "font-stretch: 72%; font-variant-numeric: tabular-nums"
    },
    "cifra": {
      "fuente": "fuente-cuerpo",
      "tamano": "1.25rem",
      "interlineado": "1.25",
      "peso": 700,
      "extra": "font-stretch: 80%; font-variant-numeric: tabular-nums"
    },
    "titulo-pantalla": {
      "fuente": "fuente-titulo",
      "tamano": "2rem",
      "interlineado": "1.05",
      "peso": 800,
      "extra": "letter-spacing: .01em; text-transform: uppercase"
    },
    "titulo-seccion": {
      "fuente": "fuente-titulo",
      "tamano": "1.375rem",
      "interlineado": "1.15",
      "peso": 700,
      "extra": "letter-spacing: .01em; text-transform: uppercase"
    },
    "cuerpo": {
      "fuente": "fuente-cuerpo",
      "tamano": "1rem",
      "interlineado": "1.5",
      "peso": 400,
      "extra": ""
    },
    "cuerpo-pequeno": {
      "fuente": "fuente-cuerpo",
      "tamano": ".875rem",
      "interlineado": "1.45",
      "peso": 400,
      "extra": ""
    },
    "etiqueta": {
      "fuente": "fuente-cuerpo",
      "tamano": ".875rem",
      "interlineado": "1.35",
      "peso": 500,
      "extra": ""
    },
    "rotulo": {
      "fuente": "fuente-cuerpo",
      "tamano": ".75rem",
      "interlineado": "1.3",
      "peso": 600,
      "extra": "letter-spacing: .06em; text-transform: uppercase"
    }
  },
  "fuentes": {
    "Big Shoulders Display": "títulos (700, 800) · sin cifras tabulares, no se usa para montos",
    "Archivo": "cuerpo y montos (400–800, eje de ancho 62–125, tnum) · autohospedar ambas, máximo dos familias"
  }
}
```
