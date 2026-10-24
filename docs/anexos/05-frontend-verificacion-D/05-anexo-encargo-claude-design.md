# Finn 2.0 — Encargo para Claude Design

*Anexo A de `05-frontend.md` (Fase 5, aprobado).*

*Este anexo se entrega tal cual a Claude Design y se lee sin el resto de los documentos. Es el encargo, no el diseño: no contiene decisiones visuales. Todo valor marcado "provisional" es neutro y existe solo para que la app funcione mientras se integra la identidad.*

## A.0 Punto de partida

**Ya existe una exploración de identidad en este proyecto de Claude Design.** La dirección elegida es la síntesis **"Propuesta 1 — Precisa, tranquila y con pulso"**, con su set de tokens **"F · Precisión con voz de basalto"** (en adelante, "F"). Se nutre de las exploraciones **"1 · Sobres"** y **"5 · Foco"** (componentes y pantallas) y de las ideas que la síntesis rescata de **Sobres, Foco, Caudal y Calendario**. Las direcciones **C** y **E** son antecedentes: se consultan, pero no mandan.

"Desde cero" significa solo que no se conserva nada de Finn 1.0. **El trabajo es partir de la identidad F y llevarla a este contrato, no reemplazarla:**

1. **Mapear cada token de F a los nombres de A.3.** Lo que no tenga equivalente se agrega como token nuevo, con las condiciones de A.10.
2. **Revisar la identidad contra la regla de las tres señales (A.4) y los mínimos de A.5, en los dos temas.** Si algún color de F no cumple el contraste como texto o como borde (por ejemplo, un acento amarillo sobre un fondo claro), se ajusta su valor o se limita su uso a fondos o rellenos donde sí cumpla, y se informa.
3. **Aplicar la identidad a los componentes de A.6 y a las pantallas de A.7, con sus datos reales**, y refinarla donde las pantallas reales lo pidan (por ejemplo, montos largos, varias líneas en un gasto dividido, una bandeja con muchos movimientos).
4. **Donde la exploración contradiga este contrato, manda el contrato.** Por ejemplo: nombres de tokens o de estados distintos, términos distintos de los de A.4, una navegación que no cumpla N1 a N8, estados que solo se distinguen por color, montos sin cifras tabulares. Se lista cada caso y cómo se resolvió.

**Entregables adicionales de este punto de partida** (se suman a los de A.10):
- una tabla **"token de F → token del contrato"**, con una fila por token de F (y "nuevo" cuando se agregó, o "no se usa" con el motivo);
- la **lista de ajustes hechos a la identidad original**, cada uno con su motivo (contraste, tres señales, contrato, pantallas reales).

## A.1 Qué es Finn

Finn es una aplicación web personal (que se instala como app en el teléfono) para llevar un **presupuesto base cero**: cada dólar que entra recibe un trabajo. El usuario vive en El Salvador, usa dólares y tarjetas de crédito con ciclos de corte y pago, y registra sus gastos a mano o desde los SMS de su banco, que llegan a una **bandeja** para revisarlos. Cada período (por ejemplo, del 21 de septiembre al 20 de octubre) reparte lo que tiene en categorías, ve cuánto le queda en cada una y si se pasó, y sabe cuánto le falta reservar para pagar cada tarjeta. Es una app de un solo usuario, en español, que se usa sobre todo en un Android de gama media, con una mano, y a veces en la computadora.

**Tono:** calma y control. El usuario debe sentir que sabe dónde está su dinero, también cuando algo salió mal. Sin alarmismo, sin culpa, sin celebraciones exageradas. Los textos usan el **voseo** salvadoreño ("Te falta reservar $18.75 para Visa Oro", "Asignaste más de lo que tenés", "Revisala en la bandeja"). Montos como `$1,234.50`, negativos como `-$45.00`, fechas como `15/10/2026` o `15 oct`.

## A.2 Qué se espera del diseño

1. La **identidad visual** de Finn 2.0, **partiendo de la dirección ya elegida en este proyecto (A.0)** y llevada al contrato de este anexo: colores, tipografía, glifos de los estados, forma de la navegación y de los contenedores, disposición de las pantallas. No se conserva nada de Finn 1.0.
2. Los **valores** de todos los tokens de A.3 para los temas claro y oscuro, y los tokens, roles y variantes nuevos que la identidad necesite.
3. Los estilos de los componentes de A.6.
4. Los recursos de marca de A.9.
5. Las pantallas clave de A.7 en teléfono y computadora, con los estados que se indican.

## A.3 Tokens

Los nombres son fijos; los valores son provisionales y los reemplaza el diseño. Se pueden **agregar** tokens; no se pueden renombrar ni quitar los existentes (A.10).

**Superficies, bordes y texto**

| Token | Para qué | Provisional claro | Provisional oscuro |
|---|---|---|---|
| `fondo` | Fondo de la app | #FAFAFA | #09090B |
| `superficie` | Contenedores, filas, campos | #FFFFFF | #18181B |
| `superficie-elevada` | Lo que se superpone (flujos cortos, menús) | #FFFFFF | #27272A |
| `superficie-hundida` | Zonas secundarias, controles deshabilitados | #F4F4F5 | #111113 |
| `borde-sutil` | Separadores decorativos | #E4E4E7 | #27272A |
| `borde-control` | Borde de campos, casillas, interruptores | #8A8A93 | #7C7C85 |
| `foco` | Anillo de foco del teclado | #18181B | #FAFAFA |
| `velo` | Fondo detrás de un superpuesto | rgba(9,9,11,.5) | rgba(0,0,0,.6) |
| `texto` | Texto principal y montos | #18181B | #FAFAFA |
| `texto-secundario` | Etiquetas, metadatos | #52525B | #A1A1AA |
| `texto-terciario` | Notas, ayudas | #63636B | #9A9AA3 |
| `texto-deshabilitado` | Solo controles deshabilitados | #A1A1AA | #52525B |
| `enlace` | Enlaces dentro de un texto | #1D4ED8 | #93C5FD |

**Acción**

| Token | Para qué | Provisional claro | Provisional oscuro |
|---|---|---|---|
| `accion`, `accion-hover`, `accion-presionada` | Botón principal en sus tres estados | #18181B, #3F3F46, #27272A | #FAFAFA, #E4E4E7, #D4D4D8 |
| `texto-sobre-accion` | Texto del botón principal | #FFFFFF | #18181B |
| `accion-secundaria` | Fondo del botón secundario | #F4F4F5 | #27272A |
| `peligro`, `texto-sobre-peligro` | Acciones destructivas (eliminar) | #B91C1C, #FFFFFF | #F87171, #18181B |

**Estados financieros** (cada uno con `-texto`, `-fondo` y `-borde`; qué significan en A.4)

| Estado | Texto (claro / oscuro) | Fondo (claro / oscuro) | Borde (claro / oscuro) |
|---|---|---|---|
| `positivo` | #166534 / #86EFAC | #F0FDF4 / #052E16 | #15803D / #22C55E |
| `cero` | #3F3F46 / #D4D4D8 | #F4F4F5 / #27272A | #71717A / #A1A1AA |
| `advertencia` | #854D0E / #FDE68A | #FEFCE8 / #422006 | #A16207 / #EAB308 |
| `problema` | #991B1B / #FCA5A5 | #FEF2F2 / #450A0A | #DC2626 / #EF4444 |
| `deuda` | #1E3A8A / #BFDBFE | #EFF6FF / #172554 | #2563EB / #3B82F6 |
| `deuda-sin-respaldo` | #6B21A8 / #E9D5FF | #FAF5FF / #3B0764 | #9333EA / #A855F7 |
| `informacion` | #155E75 / #A5F3FC | #ECFEFF / #083344 | #0E7490 / #06B6D4 |

`deuda-sin-respaldo` es un nombre interno; en pantalla se lee "Deuda sin reservar" o "Te falta reservar" (A.4).

**Gráficos**

| Token | Para qué | Provisional claro | Provisional oscuro |
|---|---|---|---|
| `grafico-serie-1` a `grafico-serie-8` | Paleta categórica: porciones de la dona de gasto por categoría y series de líneas y barras. Con más de 8 categorías, el resto va en "Otras" | #2563EB, #C2410C, #15803D, #9333EA, #BE185D, #0E7490, #A16207, #52525B | #60A5FA, #FB923C, #4ADE80, #C084FC, #F472B6, #22D3EE, #FACC15, #A1A1AA |
| `grafico-referencia` | Líneas de referencia: lo asignado por semana, una meta, un límite | #3F3F46 | #D4D4D8 |
| `grafico-rejilla` | Rejilla y ejes secundarios (decorativos) | #E4E4E7 | #3F3F46 |

Reglas: cada serie se distingue **también sin color** (etiqueta directa, patrón o marcador distinto, y siempre una tabla con los mismos datos); cada serie y la referencia tienen contraste 3:1 contra `fondo`, `superficie` y `superficie-elevada`; la referencia se distingue además por la forma de su línea; la paleta categórica **no** usa los colores de los estados financieros, para que una categoría no parezca "problema" o "positivo".

**Marca**

| Token | Para qué | Provisional |
|---|---|---|
| `marca` | Acento de identidad opcional (símbolo, ingreso, algún detalle del marco). Si el diseño no lo usa, es igual a `accion` | `accion` |
| `texto-sobre-marca` | Texto sobre `marca` | `texto-sobre-accion` |
| `marca-icono-fondo`, `marca-icono-figura` | Colores fijos de los íconos de la app y del manifiesto (no admiten variables) | — (los define el diseño) |

El botón principal siempre usa `accion`, nunca `marca`.

**Otras familias** (nombres fijos, valores provisionales)

| Familia | Tokens | Provisional |
|---|---|---|
| Espaciado | Escala de múltiplos de una unidad base | 4 px |
| Radios | `radio-control`, `radio-contenedor`, `radio-pastilla` | 6 px, 12 px, redondo |
| Elevación | `elevacion-1` (filas, tarjetas), `elevacion-2` (menús), `elevacion-3` (superpuestos) | Sombras grises suaves |
| Movimiento | `duracion-rapida`, `duracion-normal`, `duracion-lenta`, `curva-estandar` | 120, 200 y 300 ms; `cubic-bezier(.2,0,0,1)` |
| Capas | `capa-marco`, `capa-superpuesto`, `capa-aviso` | 10, 40, 50 |
| Táctil | `tactil-minimo` | 44 px |

## A.4 Estados financieros y la regla de las tres señales

| Situación (en palabras simples) | Estado | Etiqueta en pantalla |
|---|---|---|
| A una categoría le queda dinero | `positivo` | — (el número lo dice) |
| A una categoría no le queda nada, sin pasarse | `cero` | — |
| Se gastó más de lo que tenía la categoría, **con débito o efectivo**: ese dinero salió de lo que había para asignar | `problema` | "Sobregiro con débito o efectivo" |
| Se gastó más de lo que tenía la categoría, **con tarjeta**: no salió dinero todavía, pero es deuda que no está reservada para pagarse | `deuda-sin-respaldo` | "Deuda sin reservar" |
| Las dos cosas a la vez | Los dos indicadores | Las dos etiquetas |
| Falta asignar para cumplir la meta de una categoría | `advertencia` | "Falta para la meta" |
| Pasó la fecha de una meta sin cumplirla | `advertencia` | "Meta vencida" |
| La meta está cubierta, cumplida o completada | `positivo` | "Meta cubierta", "Meta cumplida", "Meta completada" |
| A una tarjeta le falta dinero reservado para pagar su deuda (total de la tarjeta) | `deuda-sin-respaldo` | "Te falta reservar" |
| La deuda de una tarjeta está toda reservada | `deuda` | "Deuda de tarjeta" |
| Se pagó a una tarjeta más de lo que había reservado | `problema` | "Pago excedente" |
| Hay más reservado para una tarjeta del que se necesita | `informacion` | "Reserva excedente" |
| Se asignó más dinero del que hay | `problema` | "Asignaste más de lo que tenés" |
| Hay dinero prestado a otros que todavía no vuelve | `informacion` | "En camino" |
| El saldo no coincide con el último estado de cuenta | `advertencia` | "Diferencia con el estado de cuenta" |

"Deuda sin reservar" es **por categoría**; "Te falta reservar" es **el total de la tarjeta** (la suma de lo que dejaron sin reservar todas las categorías que se pasaron con ella, más lo que no se reservó por otros motivos). Donde aparecen juntos, el diseño deja claro cuál es cuál.

**Regla de las tres señales.** Un estado nunca se comunica solo con color. Todo indicador de estado tiene:
1. **color** del estado;
2. **forma**: un glifo distinto por estado, que se distingue en escala de grises y en el modo de alto contraste;
3. **nombre**: la etiqueta, visible o leída por el lector de pantalla.

En la lista del presupuesto, el indicador de un sobregiro va **sin montos**; los montos y el desglose aparecen al tocar.

## A.5 Tipografía y mínimos de accesibilidad

**Roles tipográficos** (el diseño fija fuente, tamaño, interlineado y peso de cada uno; los componentes solo usan roles):

| Rol | Uso | Provisional (tamaño / interlineado / peso) |
|---|---|---|
| `cifra-principal` | El número principal de una pantalla ("Listo para asignar", saldo de una cuenta) | 32 px / 1,15 / 600 |
| `cifra` | Montos destacados en tarjetas y filas | 18 px / 1,3 / 600 |
| `titulo-pantalla` | Título de cada pantalla | 24 px / 1,25 / 600 |
| `titulo-seccion` | Títulos de bloque y nombres de grupo | 18 px / 1,35 / 600 |
| `cuerpo` | Texto general, campos, botones | 16 px / 1,5 / 400 |
| `cuerpo-pequeno` | Metadatos de filas | 14 px / 1,45 / 400 |
| `etiqueta` | Etiquetas de campos e indicadores | 14 px / 1,35 / 500 |

- **Cifras tabulares obligatorias** en todo monto y en toda columna de números: la fuente elegida debe tenerlas.
- Tamaños en `rem`: el texto crece con el tamaño de letra del sistema.
- Campos con 16 px como mínimo en el teléfono.
- Mientras no haya fuente propia se usa la del sistema; las que elija el diseño se autohospedan (como máximo dos familias).

**Mínimos (WCAG 2.2 AA) que el diseño debe respetar en los dos temas:**

| Requisito | Mínimo |
|---|---|
| Contraste de texto (incluidos los textos de estado sobre su fondo) | 4,5:1 |
| Contraste de bordes de controles, foco, series de gráficos y elementos gráficos con significado | 3:1 |
| Tamaño de todo control tocable (botones, enlaces de navegación, filas tocables, casillas con su etiqueta) | 44 × 44 px |
| Foco visible | Anillo de al menos 2 px con 3:1 contra el fondo, siempre visible con teclado |
| Estados | Nunca solo color (A.4); un control deshabilitado muestra su motivo en texto |
| Movimiento | Ninguna animación transmite información; con "reducir movimiento" no hay animaciones |
| Reflujo | A 320 px de ancho no hay desplazamiento horizontal, salvo dentro de tablas de datos |
| Orientación | Vertical y horizontal |
| Gestos | Ninguna acción exige arrastrar: todo gesto tiene un botón equivalente |
| Mensajes | Las confirmaciones de una acción no desaparecen solas con un tiempo; quedan en el lugar del elemento |

## A.6 Navegación y componentes

**Secciones.** Principales: Inicio, Presupuesto, Bandeja, Actividad, Cuentas. Secundarias: Reportes, Metas, Programadas, Por cobrar, Reglas, Notificaciones, Ajustes. Acceso global: Registrar.

**Requisitos de navegación** (la forma es libre: barra inferior, menú lateral, cajón, pestañas u otra):

| # | Requisito |
|---|---|
| N1 | **Registrar** se alcanza con una interacción desde cualquier pantalla principal |
| N2 | La **Bandeja**, con su contador de movimientos por revisar, está siempre visible o a una interacción |
| N3 | En Presupuesto, el **período** que se ve está siempre visible, con sus fechas y su estado (cerrado, actual, futuro o de transición), y hay una forma visible de volver al período actual |
| N4 | Cada sección tiene su dirección propia y la sección activa se marca |
| N5 | Toda sección secundaria se alcanza en dos interacciones como máximo desde cualquier pantalla principal |
| N6 | Las mismas pantallas y la misma jerarquía en teléfono y en computadora |
| N7 | El contador de notificaciones no leídas se ve junto al acceso a Notificaciones |
| N8 | Volver es predecible: cerrar un flujo vuelve a donde se abrió; el "atrás" del sistema también funciona |

**Flujos.** Las tareas cortas (asignar, mover dinero, cambiar el estado de una transacción) se abren **sobre** la pantalla actual: la forma (hoja inferior, diálogo, panel lateral) la elige el diseño. Las largas (registrar un gasto con varias líneas, revisar un movimiento de la bandeja, conciliar una cuenta) ocupan la pantalla completa.

**Componentes base**

| Componente | Variantes y estados que debe tener |
|---|---|
| Botón | Principal, secundaria, peligro, discreta; normal, hover, presionado, foco, deshabilitado (con motivo visible), enviando (con texto "Guardando…") |
| Campo con etiqueta | Normal, foco, error (mensaje en texto debajo o junto), deshabilitado, solo lectura; "Opcional" en los no obligatorios |
| Selección | Cerrada, abierta, foco, error, deshabilitada; con pocas opciones puede mostrarlas todas |
| Buscador con sugerencias | Vacío, buscando, con resultados, sin resultados, error |
| Casilla, interruptor, opciones | Marcado, desmarcado, mixto (casilla), foco, deshabilitado |
| Pestañas o vistas | Activa, inactiva, foco |
| Superpuesto (flujo corto) | Abierto, cargando, error; con título, contenido, acciones y cerrar |
| Página de flujo (flujo largo) | Igual, a pantalla completa |
| Menú de acciones | Cerrado, abierto, elemento activo, elemento de peligro |
| Aviso en línea | Uno por estado financiero, con título opcional y una acción |
| Resultado de una acción | Texto con lo que pasó ("Aprobado: SUPER SELECTOS · $45.00 · Visa Oro · Supermercado") y una salida ("Deshacer", "Ver transacción"); queda en el lugar del elemento |
| Insignia de contador | Sin dato, cero, con número |
| Esqueleto de carga | Con la forma del contenido, sin números inventados |
| Indicador de navegación en curso | En el enlace tocado y global; un estado de presionado que se vea al instante |

**Componentes de dominio**

| Componente | Muestra | Estados y variantes |
|---|---|---|
| Monto | Un monto formateado (`$1,234.50`, `-$45.00`) | Negativo, cero, positivo; con color de estado; tamaños `cifra-principal`, `cifra`, `cuerpo` |
| Indicador de estado | Color + glifo + nombre (A.4) | Uno por estado; con etiqueta visible o solo para lector de pantalla |
| Fila de categoría | Nombre, Asignado, Gastado, Disponible, meta, indicadores | Normal; sobregirada (débito, tarjeta, ambas); con meta (falta, cubierta, vencida); período cerrado (sin acción de asignar) |
| Fila de pago de tarjeta | "Te falta reservar" como número principal, reserva excedente, pago excedente | Con falta, con exceso de reserva, con pago excedente, al día |
| Resumen "Listo para asignar" | El dinero sin asignar y lo que está "en camino" | Positivo, cero, negativo, con "en camino" |
| Tarjeta de crédito | Deuda, "Te falta reservar", uso del límite, próximos corte y pago, monto para no generar intereses | Con falta de reserva, deuda reservada, saldo a favor, sin deuda |
| Fila de cuenta | Saldo y saldo confirmado por el banco | Con diferencia de conciliación, archivada |
| Barra de progreso | Porcentaje (uso del límite, progreso de una meta de ahorro) | 0, parcial, completo; con color de estado |
| Resumen de meta | Pedido y falta del período, progreso si es de ahorro | Por estado de meta; vencida |
| Aviso | Texto del sistema con una acción propuesta opcional ("Mover $25.00 a Supermercado") | Sin acción, con acción y su resultado |
| Fila de transacción | Fecha, comercio, cuenta, monto con signo, marcas (por cobrar, con devoluciones, conciliada, programada, período cerrado) | Por tipo (gasto, ingreso, transferencia, pago de tarjeta…); estado bancario (pendiente, confirmado); agrupadas por día |
| Movimiento de la bandeja | Comercio, monto, cuenta, fecha, categoría sugerida, qué falta | Pendiente, con coincidencia con un pago programado, posible duplicado, no reconocido, con error, listo para aprobar con un toque, con datos faltantes |
| Selector de período | Período actual como texto, "Período anterior", "Período siguiente", "Ir al período actual" | Activo, cerrado, futuro, de transición |
| Confirmación del impacto | Qué va a cambiar antes de guardar (avisos y montos) | Con y sin avisos |
| Líneas de un gasto dividido | Varias líneas con monto y destino (categoría o persona que debe) | Una línea, varias, con diferencia entre la suma y el total |
| Gráfico de barras y de líneas | Series con su referencia y su tabla equivalente | Con datos, vacío, un solo punto, con semanas futuras |
| Gráfico de dona | Gasto por categoría con porcentajes y tabla | Con datos, una porción, sin datos, con "Otras" |
| Estado vacío | Primer uso (guía), sección vacía (primera acción), sin resultados (quitar filtros) | Tres clases |
| Error de pantalla | "Algo salió mal y no se pudo cargar esta pantalla." con una referencia copiable y "Intentar de nuevo" | En página y en superpuesto |
| Avisos globales | "Estás sin conexión", "Hay una versión nueva" con "Recargar" | — |

## A.7 Pantallas clave, con sus datos reales

Los datos de ejemplo son realistas. En los datos reales, los montos llegan como enteros en centavos (`28715` = $287.15) y la app solo los formatea; los nombres de campo son los que recibe cada pantalla. Hoy es el 15/10/2026; el período activo va del 21/09/2026 al 20/10/2026 (30 días, quedan 5).

**Datos que tiene toda pantalla** (encabezado): `hoy` 15/10/2026 · `periodoActivo` 21/09 – 20/10/2026 · `notificacionesNoLeidas` 2 · `bandejaPorRevisar` 3.

### Inicio (`/`) — "¿algo necesita mi atención?"

| Campo | Ejemplo |
|---|---|
| `lpa` (Listo para asignar) | $312.40 |
| `enCamino` | $40.00 (lo que Carlos le debe) |
| `lpaNegativo` | no |
| `reduccionProyectadaAlCierre` | $26.30 (lo que bajará "Listo para asignar" al cerrar el período por sobregiros con débito) |
| `atencion.bandeja` | pendientes 2, con coincidencia 1, posibles duplicados 0, no reconocidos 0, errores 0 |
| `atencion.sobregiradas` | Restaurantes (Comida fuera): sobregiro con débito de $26.30 · Gasolina (Transporte): sobregiro con tarjeta de $18.75 |
| `atencion.faltaReservar` | Visa Oro: $18.75 |
| `atencion.pagosExcedentes` | — |
| `atencion.reservaExcedente` | — |
| `atencion.proximosPagos` (7 días) | Netflix $15.49 el 17/10 (Visa Oro, se registra sola) · Cuota del préstamo $210.00 el 20/10 (Cuenta de ahorro) |
| `atencion.pagosAtrasados` | — |
| `atencion.cambiosRetroactivos` | 1: "Cambiaste la fecha de un gasto al período anterior; Listo para asignar bajó $12.00" |
| `atencion.metasVencidas` | — |
| `atencion.archivadasConDisponible` | Mascota (archivada) con $8.00, con la propuesta "Pasar $8.00 a Listo para asignar" |
| `recientes` (5) | 15/10 SUPER SELECTOS ESCALON −$35.00 (Visa Oro) · 14/10 PUMA SANTA ELENA −$30.00 (Visa Oro) · 13/10 PIZZA HUT −$18.50 (débito) · 12/10 Salario quincena +$925.00 · 11/10 FARMACIA SAN NICOLAS −$12.35 |
| `patrimonio` | activos $6,520.20 · deudas $4,852.18 · neto $1,668.02 |

Estados a diseñar: con todo esto; primer uso (sin cuentas); todo al día (nada que atender); "Listo para asignar" negativo.

### Presupuesto (`/presupuesto`)

| Campo | Ejemplo |
|---|---|
| `periodo` | 21/09 – 20/10/2026, estado activo, 25 días transcurridos, 5 restantes |
| `navegacion` | anterior 21/08/2026 · siguiente 21/10/2026 |
| `lpa` / `enCamino` | $312.40 / $40.00 |

`grupos` → `categorias` (cada fila: `asignado`, `gastado`, `arrastre`, `disponible`, `sobregiro`, `meta`, `clasificacion`):

| Grupo | Categoría | Asignado | Gastado | Arrastre | Disponible | Sobregiro | Meta |
|---|---|---|---|---|---|---|---|
| Casa | Supermercado | $350.00 | $287.15 | $0.00 | $62.85 | — | Mensual $350.00: cubierta |
| Casa | Luz y agua | $65.00 | $58.40 | $0.00 | $6.60 | — | — |
| Casa | Internet y teléfono | $45.00 | $45.00 | $0.00 | $0.00 | — | — |
| Comida fuera | Restaurantes | $120.00 | $146.30 | $0.00 | −$26.30 | Débito $26.30 | — |
| Transporte | Gasolina | $80.00 | $98.75 | $0.00 | −$18.75 | Tarjeta $18.75 | — |
| Suscripciones | Netflix | $15.49 | $0.00 | $0.00 | $15.49 | — | Mensual $15.49: cubierta |
| Ahorro | Fondo de emergencia | $100.00 | $0.00 | $1,250.00 | $1,350.00 | — | Para el 30/06/2027, $3,000.00: pide $175.00 este período, falta $75.00 (sin fondos suficientes) |
| Ahorro | Viaje | $0.00 | $0.00 | $184.62 | $184.62 | — | Anual $1,200.00: falta $92.31 |

`pagosTarjeta`:

| Tarjeta | Asignado | Actividad | Disponible | Te falta reservar | Reserva excedente | Pago excedente |
|---|---|---|---|---|---|---|
| Visa Oro | $0.00 | $623.43 | $623.43 | $18.75 | $0.00 | — |
| Mastercard Clásica | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | — |

`totales`: asignado $775.49 · gastado $635.60 · disponible $1,574.51.

Estados a diseñar: período activo con este contenido; período cerrado (sin acciones de asignar); período futuro (solo asignado, sin gasto); filtros (todas, sobregiradas, sin fondos, cubiertas) y "sin resultados".

### Detalle de categoría (`/presupuesto/categorias/[id]`), Restaurantes

| Campo | Ejemplo |
|---|---|
| `numeros` | asignado $120.00 · gastado $146.30 · arrastre $0.00 · disponible −$26.30 · fondo $120.00 · entradas $0.00 |
| `sobregiro` | débito, total $26.30 (parte con tarjeta $0.00, con débito $26.30) |
| `consumos` (en orden) | 23/09 LA PAMPA $42.10 débito (cubierto $42.10) · 30/09 PIZZA HUT $25.60 tarjeta (cubierto) · 05/10 STARBUCKS $8.75 débito (cubierto) · 08/10 CAMPERO $23.05 débito (cubierto $23.05) · 11/10 LA PAMPA $28.30 débito (cubierto $20.50, no cubierto $7.80) · 13/10 PIZZA HUT $18.50 débito (no cubierto $18.50) |
| `meta` | ninguna |
| `calendario` (días con gasto) | 23/09 $42.10 · 30/09 $25.60 · 05/10 $8.75 · 08/10 $23.05 · 11/10 $28.30 · 13/10 $18.50 |
| `historial` (6 períodos anteriores: asignado / gastado / disponible) | mar $100.00 / $88.20 / $11.80 · abr $100.00 / $101.50 / −$1.50 · may $100.00 / $96.40 / $3.60 · jun $100.00 / $112.20 / −$12.20 · jul $120.00 / $104.75 / $15.25 · ago $120.00 / $118.90 / $1.10 |
| `programadas` | — |
| `reglas` | "PIZZA HUT", "LA PAMPA" |
| `acciones` | puede asignar: sí · puede archivar: no (tiene Disponible distinto de cero) |

Estados: con sobregiro con débito (este), con sobregiro con tarjeta, con meta (barra y falta), sin movimientos, categoría de pago de tarjeta (otra variante: deuda, reservado, te falta reservar, desglose para no generar intereses).

### Bandeja (`/bandeja`)

`contadores`: pendientes 2 · con coincidencia 1 · posibles duplicados 0 · no reconocidos 0 · errores 0.

| `estado` | SMS (`sms.texto`, `remitente`, `recibidoEn`) | `cuenta` | `fecha` | `monto` | `comercio` | Sugerencia | `aprobacion` |
|---|---|---|---|---|---|---|---|
| pendiente | "BAC: Compra aprobada por USD 35.00 en SUPER SELECTOS ESCALON con tarjeta ***4821 el 15/10/2026 12:41" · BAC · hoy 12:41 | Visa Oro | 15/10 | $35.00 | SUPER SELECTOS ESCALON | Supermercado (por regla) | posible, un toque |
| pendiente | "Agricola: Compra por $12.35 en FARMACIA SAN NICOLAS..." · Banco Agrícola · ayer 18:05 | Cuenta corriente | 14/10 | $12.35 | FARMACIA SAN NICOLAS | — | falta la categoría |
| con coincidencia | "BAC: Cargo de USD 15.49 en NETFLIX.COM..." · BAC · 15/10 06:02 | Visa Oro | 15/10 | $15.49 | NETFLIX.COM | Netflix | coincide con la programada "Netflix" esperada el 17/10 por $15.49 |

Estados: lista con los tres; aprobado con un toque (resultado en el lugar de la fila con "Ver transacción"); descartado (con "Restaurar"); vista de descartados; bandeja al día (vacía); un SMS no reconocido y uno con error.

### Registrar gasto con división (`/registrar/gasto`), flujo largo

Lo que recibe el formulario: `catalogos.cuentas` (efectivo: Cuenta corriente $1,284.60, Cuenta de ahorro $3,120.00; tarjetas: Visa Oro con deuda $642.18, Mastercard Clásica sin deuda) · `catalogos.categorias` por grupo con su Disponible (Supermercado $62.85, Farmacia $27.65, Restaurantes −$26.30…) · `catalogos.deudores` (Carlos, con $40.00 abiertos) · `catalogos.comercios` (recientes, con su categoría sugerida: SUPER SELECTOS → Supermercado, PRICESMART → Supermercado) · `contexto.cuentaPropuesta` Visa Oro.

Lo que envía (y por lo tanto, los campos): `cuentaId`, `fecha` (por defecto hoy), `total`, `comercio`, `nota` (opcional, hasta 500 caracteres) y `lineas` (1 a 20), cada una con `monto` y destino (una categoría o una persona que debe).

Ejemplo: PRICESMART, 15/10/2026, Visa Oro, total $148.60, dividido en: Supermercado $96.10 · Farmacia $22.50 · Carlos (me lo debe) $30.00.

Estados: una línea; varias líneas; la suma de las líneas no coincide con el total (el formulario lo muestra y no deja guardar); sugerencia de categoría al escribir el comercio; monto mal escrito ("Usá el punto o la coma solo para los centavos, sin separador de miles."); confirmación del impacto cuando la fecha cae en un período cerrado; guardando; guardado (con el resultado y el regreso).

### Cuentas (`/cuentas`), con tarjeta

| Grupo | Ejemplo |
|---|---|
| `efectivo` | Cuenta corriente (Banco Agrícola, ***3310): saldo $1,284.60, confirmado $1,296.95, última conciliación 30/09 sin diferencia · Cuenta de ahorro (BAC): $3,120.00 |
| `tarjetas` | **Visa Oro** (BAC, ***4821, Visa): deuda $642.18 · saldo a favor $0.00 · límite $2,500.00 · uso del límite 25.69% · te falta reservar $18.75 · reserva excedente $0.00 · próximo corte 25/10 · próximo pago 15/11 · para no generar intereses $512.40 · confirmado $607.18. **Mastercard Clásica** (Banco Cuscatlán, ***0094): deuda $0.00, límite $1,000.00 |
| `prestamos` | Préstamo personal (Banco Agrícola): capital pendiente $4,210.00 · próxima cuota 20/10, $210.00, número 14 |
| `inversiones` | Depósito a plazo: $2,075.60 |
| `posicionNeta` | activos: efectivo $4,404.60, saldos a favor $0.00, inversiones $2,075.60, por cobrar $40.00, total $6,520.20 · deudas: tarjetas $642.18, préstamos $4,210.00, total $4,852.18 · neto $1,668.02 |

Estados: tarjeta con falta de reserva (Visa), sin deuda (Mastercard), con saldo a favor; cuenta con diferencia de conciliación; archivadas visibles.

### Gasto semanal (`/reportes/gasto-semanal`)

Período 21/09 – 20/10/2026; categoría Supermercado, asignado $350.00. Semanas del período (la última puede ser corta):

| k | Desde – hasta | Días | Futura | Gasto | Referencia (asignado proporcional) | Gasto acumulado | Referencia acumulada | Misma semana en los 3 períodos anteriores |
|---|---|---|---|---|---|---|---|---|
| 1 | 21/09 – 27/09 | 7 | no | $92.40 | $81.67 | $92.40 | $81.67 | $77.20 · $88.10 · $95.35 |
| 2 | 28/09 – 04/10 | 7 | no | $71.15 | $81.66 | $163.55 | $163.33 | $64.80 · $70.45 · $81.20 |
| 3 | 05/10 – 11/10 | 7 | no | $88.60 | $81.67 | $252.15 | $245.00 | $90.15 · $79.60 · $84.00 |
| 4 | 12/10 – 18/10 | 7 | no (en curso) | $35.00 | $81.67 | $287.15 | $326.67 | $71.30 · $85.75 · $62.40 |
| 5 | 19/10 – 20/10 | 2 | sí | $0.00 | $23.33 | $287.15 | $350.00 | $18.90 · $25.00 · $0.00 |

Estados: varias categorías a la vez; una semana futura (sin gasto, distinguible sin color); asignado negativo (referencia 0); categoría nueva sin períodos anteriores.

## A.8 Lo que la app ya resuelve y el diseño no necesita decidir

Las direcciones de cada pantalla, qué datos llegan, los textos (catálogo propio en voseo), el formato de montos y fechas, la carga, el error y la ausencia de conexión como estados con sus textos, los nombres que leen los lectores de pantalla y el orden del teclado. El diseño da la forma a todo eso.

## A.9 Recursos de marca a entregar

| Recurso | Formato | Dónde se usa |
|---|---|---|
| Símbolo | SVG de un color (`currentColor`) | Pantalla de ingreso, página sin conexión, marco si el diseño lo pone |
| Logotipo (opcional) | SVG | Ingreso |
| Ícono de la app | PNG 192 × 192 y 512 × 512 | Pantalla de inicio del teléfono, manifiesto |
| Ícono adaptable | PNG 512 × 512 con el símbolo dentro del 80 % central | Android lo recorta a su forma |
| Ícono de Apple | PNG 180 × 180, sin transparencia | iPhone |
| Favicon | SVG y ICO | Pestaña del navegador |
| Insignia de notificación | PNG 96 × 96, silueta blanca sobre transparente | Barra de estado de Android |
| Colores de los íconos | `marca-icono-fondo`, `marca-icono-figura` | Íconos y color de fondo del manifiesto |

## A.10 Qué se entrega, qué se puede agregar y qué no se puede cambiar

**Se entrega:**
- `tokens.css` y `tokens.json` con los valores de los dos temas, incluidos los tokens agregados;
- las reglas de contraste de los tokens nuevos;
- las fuentes elegidas;
- los estilos de los componentes de A.6;
- los recursos de A.9;
- las pantallas de A.7;
- una lista de lo agregado, con su uso;
- la tabla "token de F → token del contrato" y la lista de ajustes a la identidad original, con su motivo (A.0).

**Se puede cambiar:**
- todos los valores de A.3, los glifos de los estados, las fuentes y los valores de los roles tipográficos;
- la forma de la navegación y de los contenedores;
- la disposición de cada pantalla.

**Se puede agregar** tokens, roles tipográficos, variantes de componentes y componentes visuales propios (por ejemplo, una ilustración para un estado vacío), con estas condiciones:
- todo token nuevo tiene valor en los dos temas;
- si es un color de texto, borde, foco o gráfico, cumple el contraste que le corresponde (A.5); si es decorativo, se declara así;
- un rol nuevo usa `rem` y, si muestra montos, cifras tabulares.

**No se puede cambiar:**
- los nombres de los tokens, roles, estados y variantes de A.3 a A.6 (no se renombran ni se quitan);
- las secciones y los requisitos N1 a N8;
- lo que muestra cada componente y sus estados (A.6);
- la regla de las tres señales y los mínimos de A.5;
- los términos de A.4 ("Deuda sin reservar", "Te falta reservar"…) y el voseo.
