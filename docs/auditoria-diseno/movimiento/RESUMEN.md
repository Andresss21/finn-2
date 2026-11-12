# Movimiento medido

Animaciones y transiciones finitas que corrieron en cada momento (Web Animations API, muestreadas por cuadro).

## arrastre__video-computadora

### tomar el movimiento (ratón, más de 6 px)
Esperado: SIN DISEÑO: PANTALLAS §7 solo dice «Arrastrar a una categoría es un atajo; los botones siempre están»
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:transform | 120 ms | 0 | linear | `div > span > button[role=button][aria-label=Arrastrar Super $12.00 a una c]` | transform:none |
| fz-item | 400 ms | 480 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=status]` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 300 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 360 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > aside[aria-label=Destinos del arrastre]` | opacity:0;transform:translateY(8px) |

### llevarlo sobre un destino
Esperado: SIN DISEÑO
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:background-color | 220 ms | 0 | linear | `div > main > button` | backgroundColor:rgb(228, 233, 251) |
| transition:background-color | 124.12283709572468 ms | 0 | linear | `div > main > button` | backgroundColor:rgb(230, 233, 237) |

### soltar sobre el destino
Esperado: SIN DISEÑO; por DECISIONES el resultado queda en el lugar de la fila
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:transform | 120 ms | 0 | linear | `div > span > button[role=button][aria-label=Arrastrar Super $12.00 a una c]` | transform:scale(0.97) |
| fz-pop-in | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `le=list][aria-label=Movimientos por revisar] > div[role=listitem] > div.fz-resultado-entra` | opacity:0;transform:scale(0.85) |

## arrastre__video-computadora__reducido

### tomar el movimiento (ratón, más de 6 px)
Esperado: SIN DISEÑO: PANTALLAS §7 solo dice «Arrastrar a una categoría es un atajo; los botones siempre están»
Después: `/bandeja`

_Ninguna animación ni transición._

### llevarlo sobre un destino
Esperado: SIN DISEÑO
Después: `/bandeja`

_Ninguna animación ni transición._

### soltar sobre el destino
Esperado: SIN DISEÑO; por DECISIONES el resultado queda en el lugar de la fila
Después: `/bandeja`

_Ninguna animación ni transición._

## arrastre__video

### tomar el movimiento (ratón, más de 6 px)
Esperado: SIN DISEÑO: PANTALLAS §7 solo dice «Arrastrar a una categoría es un atajo; los botones siempre están»
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:transform | 120 ms | 0 | linear | `div > span > button[role=button][aria-label=Arrastrar Super $12.00 a una c]` | transform:none |
| fz-item | 400 ms | 480 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=status]` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 300 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 360 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > aside[aria-label=Destinos del arrastre]` | opacity:0;transform:translateY(8px) |

### llevarlo sobre un destino
Esperado: SIN DISEÑO
Después: `/bandeja`

_Ninguna animación ni transición._

### soltar sobre el destino
Esperado: SIN DISEÑO; por DECISIONES el resultado queda en el lugar de la fila
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:transform | 120 ms | 0 | linear | `div > span > button[role=button][aria-label=Arrastrar Super $12.00 a una c]` | transform:scale(0.97) |
| fz-pop-in | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `le=list][aria-label=Movimientos por revisar] > div[role=listitem] > div.fz-resultado-entra` | opacity:0;transform:scale(0.85) |
| fz-rebote | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `a[aria-label=Bandeja, 2 por revisar] > span > span.fz-rebote` | transform:scale(0.85) |

## arrastre__video__reducido

### tomar el movimiento (ratón, más de 6 px)
Esperado: SIN DISEÑO: PANTALLAS §7 solo dice «Arrastrar a una categoría es un atajo; los botones siempre están»
Después: `/bandeja`

_Ninguna animación ni transición._

### llevarlo sobre un destino
Esperado: SIN DISEÑO
Después: `/bandeja`

_Ninguna animación ni transición._

### soltar sobre el destino
Esperado: SIN DISEÑO; por DECISIONES el resultado queda en el lugar de la fila
Después: `/bandeja`

_Ninguna animación ni transición._

## bandeja__video-computadora

### entrar a la Bandeja (filas escalonadas)
Esperado: §2.12: las filas entran escalonadas (400 ms, 60 ms entre filas)
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:background-color | 220 ms | 0 | linear | `main > div[role=radiogroup][aria-label=Vista de la Bandeja] > button[role=radio]` | backgroundColor:rgb(255, 255, 255) |
| fz-item | 400 ms | 0 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=radiogroup][aria-label=Vista de la Bandeja]` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 60, 240 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > p` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 120 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > button` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 180 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=list][aria-label=Movimientos por revisar]` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 360 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=status]` | opacity:0;transform:translateY(8px) |

### aprobar con un toque
Esperado: §2.13 y §11: el resultado aparece en el lugar con un rebote (300 ms, --curva-enfasis); sin transición de pantalla
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:background-color | 220 ms | 0 | linear | `article > div > button[aria-label=Aprobar Super]` | backgroundColor:rgb(31, 71, 209) |
| fz-pop-in | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `le=list][aria-label=Movimientos por revisar] > div[role=listitem] > div.fz-resultado-entra` | opacity:0;transform:scale(0.85) |

### aprobar otro
Esperado: igual; el contador de la Bandeja cambia
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:background-color | 220 ms | 0 | linear | `article > div > button[aria-label=Aprobar Super]` | backgroundColor:rgb(31, 71, 209) |
| fz-pop-in | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `le=list][aria-label=Movimientos por revisar] > div[role=listitem] > div.fz-resultado-entra` | opacity:0;transform:scale(0.85) |

## bandeja__video-computadora__reducido

### entrar a la Bandeja (filas escalonadas)
Esperado: §2.12: las filas entran escalonadas (400 ms, 60 ms entre filas)
Después: `/bandeja`

_Ninguna animación ni transición._

### aprobar con un toque
Esperado: §2.13 y §11: el resultado aparece en el lugar con un rebote (300 ms, --curva-enfasis); sin transición de pantalla
Después: `/bandeja`

_Ninguna animación ni transición._

### aprobar otro
Esperado: igual; el contador de la Bandeja cambia
Después: `/bandeja`

_Ninguna animación ni transición._

## bandeja__video

### entrar a la Bandeja (filas escalonadas)
Esperado: §2.12: las filas entran escalonadas (400 ms, 60 ms entre filas)
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| transition:background-color | 220 ms | 0 | linear | `main > div[role=radiogroup][aria-label=Vista de la Bandeja] > button[role=radio]` | backgroundColor:rgb(255, 255, 255) |
| fz-item | 400 ms | 0 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=radiogroup][aria-label=Vista de la Bandeja]` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 60, 240 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > p` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 120 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > button` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 180 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=list][aria-label=Movimientos por revisar]` | opacity:0;transform:translateY(8px) |
| fz-item | 400 ms | 360 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div[role=status]` | opacity:0;transform:translateY(8px) |

### aprobar con un toque
Esperado: §2.13 y §11: el resultado aparece en el lugar con un rebote (300 ms, --curva-enfasis); sin transición de pantalla
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-pop-in | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `le=list][aria-label=Movimientos por revisar] > div[role=listitem] > div.fz-resultado-entra` | opacity:0;transform:scale(0.85) |
| fz-rebote | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `a[aria-label=Bandeja, 2 por revisar] > span > span.fz-rebote` | transform:scale(0.85) |

### aprobar otro
Esperado: igual; el contador de la Bandeja cambia
Después: `/bandeja`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-pop-in | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `le=list][aria-label=Movimientos por revisar] > div[role=listitem] > div.fz-resultado-entra` | opacity:0;transform:scale(0.85) |
| fz-rebote | 340 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `a[aria-label=Bandeja, 1 por revisar] > span > span.fz-rebote` | transform:scale(0.85) |

## bandeja__video__reducido

### entrar a la Bandeja (filas escalonadas)
Esperado: §2.12: las filas entran escalonadas (400 ms, 60 ms entre filas)
Después: `/bandeja`

_Ninguna animación ni transición._

### aprobar con un toque
Esperado: §2.13 y §11: el resultado aparece en el lugar con un rebote (300 ms, --curva-enfasis); sin transición de pantalla
Después: `/bandeja`

_Ninguna animación ni transición._

### aprobar otro
Esperado: igual; el contador de la Bandeja cambia
Después: `/bandeja`

_Ninguna animación ni transición._

## codigo__video-computadora

### escribir tres dígitos
Esperado: DECISIONES: casilla llena con línea de 3 px en --accion, sube 2 px y hace un pop; avanza a la siguiente
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### completar con un código incorrecto
Esperado: DECISIONES: se verifica sola al sexto dígito; error: el grupo tiembla 380 ms y las casillas toman --problema-borde
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### pegar el código correcto
Esperado: DECISIONES: pegar reparte los 6 dígitos; correcto: --positivo-fondo en cascada (40 ms), check con pop, sigue a los 650 ms
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

## codigo__video-computadora__reducido

### escribir tres dígitos
Esperado: DECISIONES: casilla llena con línea de 3 px en --accion, sube 2 px y hace un pop; avanza a la siguiente
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### completar con un código incorrecto
Esperado: DECISIONES: se verifica sola al sexto dígito; error: el grupo tiembla 380 ms y las casillas toman --problema-borde
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### pegar el código correcto
Esperado: DECISIONES: pegar reparte los 6 dígitos; correcto: --positivo-fondo en cascada (40 ms), check con pop, sigue a los 650 ms
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

## codigo__video

### escribir tres dígitos
Esperado: DECISIONES: casilla llena con línea de 3 px en --accion, sube 2 px y hace un pop; avanza a la siguiente
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### completar con un código incorrecto
Esperado: DECISIONES: se verifica sola al sexto dígito; error: el grupo tiembla 380 ms y las casillas toman --problema-borde
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### pegar el código correcto
Esperado: DECISIONES: pegar reparte los 6 dígitos; correcto: --positivo-fondo en cascada (40 ms), check con pop, sigue a los 650 ms
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

## codigo__video__reducido

### escribir tres dígitos
Esperado: DECISIONES: casilla llena con línea de 3 px en --accion, sube 2 px y hace un pop; avanza a la siguiente
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### completar con un código incorrecto
Esperado: DECISIONES: se verifica sola al sexto dígito; error: el grupo tiembla 380 ms y las casillas toman --problema-borde
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

### pegar el código correcto
Esperado: DECISIONES: pegar reparte los 6 dígitos; correcto: --positivo-fondo en cascada (40 ms), check con pop, sigue a los 650 ms
Después: `/ingresar/verificar`

_Ninguna animación ni transición._

## navegacion__video-computadora

### entrada de Inicio y billete Listo para asignar (recarga)
Esperado: §2.8: cifras que ruedan una vez, 1.4 s, 90 ms entre dígitos; bloques escalonados
Después: `/`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### pestaña a la derecha: Inicio → Presupuesto
Esperado: §11: entra desde 22 px a la derecha, opacidad 0→1, 320 ms, --curva-estandar
Después: `/presupuesto`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### abrir un detalle: Presupuesto → categoría Restaurantes
Esperado: §11: entra desde 70 px a la derecha, 360 ms
Después: `/presupuesto/categorias/00000000-0000-4000-8000-000000000011`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |
| fz-barup | 700 ms | 0, 80, 160, 240, 320, 400 | cubic-bezier(0.2, 0.8, 0.2, 1) | `svg[role=img][aria-label=Últimos 6 períodos: Promedio g] > g > g.fz-barra-sube` | transform:scaleY(0) |
| fz-item | 400 ms | 120 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > nav[aria-label=Acciones de la categoría]` | opacity:0;transform:translateY(8px) |
| transition:background-color | 220 ms | 0 | linear | `div > div[role=radiogroup][aria-label=Vista] > button[role=radio]` | backgroundColor:rgb(255, 255, 255) |

### volver: categoría → Presupuesto
Esperado: §11: entra desde 50 px a la izquierda, 360 ms
Después: `/presupuesto`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### pestaña a la izquierda: Presupuesto → Inicio
Esperado: §11: igual desde la izquierda, 320 ms
Después: `/`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### abrir Registrar (flujo largo)
Esperado: §11: sube desde abajo, 420 ms, --curva-entrada
Después: `/registrar`

_Ninguna animación ni transición._

### cerrar Registrar
Esperado: §11: aparece con 8 px hacia arriba, 300 ms
Después: `/`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### abrir el panel de notificaciones (campana)
Esperado: §11: cae desde arriba (360 ms), avisos escalonados 60 ms
Después: `/notificaciones` · diálogos abiertos: Notificaciones

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-v-in | 200 ms | 0 | ease | `div.fz-velo` | opacity:0 |
| fz-dr-in | 200 ms | 0 | cubic-bezier(0.2, 0.9, 0.25, 1) | `div[role=dialog].fz-hoja` | transform:translateY(-100%) |
| fz-pop-in | 400 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `div > div > span.fz-vacio-disco` | opacity:0;transform:scale(0.85) |
| fz-item | 220 ms | 80 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > div > h2.fz-vacio-texto` | opacity:0;transform:translateY(8px) |
| fz-item | 220 ms | 80 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > div > p.fz-vacio-texto` | opacity:0;transform:translateY(8px) |

### cerrar el panel de notificaciones (Escape)
Esperado: §11: sube (200 ms)
Después: `/`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-v-out | 200 ms | 0 | ease | `div.fz-velo` | opacity:1 |
| fz-dr-out | 200 ms | 0 | cubic-bezier(0.4, 0, 1, 1) | `div[role=dialog].fz-hoja` | transform:none |

### abrir la hoja Asignar desde Inicio
Esperado: §11: velo (280 ms) y hoja que sube (380 ms); en computadora, panel lateral
Después: `/presupuesto?filtro=sin-fondos`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### cerrar la hoja Asignar (Escape)
Esperado: §11: baja (200 ms, --curva-salida)
Después: `/presupuesto?filtro=sin-fondos`

_Ninguna animación ni transición._

## navegacion__video-computadora__reducido

### entrada de Inicio y billete Listo para asignar (recarga)
Esperado: §2.8: cifras que ruedan una vez, 1.4 s, 90 ms entre dígitos; bloques escalonados
Después: `/`

_Ninguna animación ni transición._

### pestaña a la derecha: Inicio → Presupuesto
Esperado: §11: entra desde 22 px a la derecha, opacidad 0→1, 320 ms, --curva-estandar
Después: `/presupuesto`

_Ninguna animación ni transición._

### abrir un detalle: Presupuesto → categoría Restaurantes
Esperado: §11: entra desde 70 px a la derecha, 360 ms
Después: `/presupuesto/categorias/00000000-0000-4000-8000-000000000011`

_Ninguna animación ni transición._

### volver: categoría → Presupuesto
Esperado: §11: entra desde 50 px a la izquierda, 360 ms
Después: `/presupuesto`

_Ninguna animación ni transición._

### pestaña a la izquierda: Presupuesto → Inicio
Esperado: §11: igual desde la izquierda, 320 ms
Después: `/`

_Ninguna animación ni transición._

### abrir Registrar (flujo largo)
Esperado: §11: sube desde abajo, 420 ms, --curva-entrada
Después: `/registrar`

_Ninguna animación ni transición._

### cerrar Registrar
Esperado: §11: aparece con 8 px hacia arriba, 300 ms
Después: `/`

_Ninguna animación ni transición._

### abrir el panel de notificaciones (campana)
Esperado: §11: cae desde arriba (360 ms), avisos escalonados 60 ms
Después: `/notificaciones` · diálogos abiertos: Notificaciones

_Ninguna animación ni transición._

### cerrar el panel de notificaciones (Escape)
Esperado: §11: sube (200 ms)
Después: `/`

_Ninguna animación ni transición._

### abrir la hoja Asignar desde Inicio
Esperado: §11: velo (280 ms) y hoja que sube (380 ms); en computadora, panel lateral
Después: `/presupuesto?filtro=sin-fondos`

_Ninguna animación ni transición._

### cerrar la hoja Asignar (Escape)
Esperado: §11: baja (200 ms, --curva-salida)
Después: `/presupuesto?filtro=sin-fondos`

_Ninguna animación ni transición._

## navegacion__video

### entrada de Inicio y billete Listo para asignar (recarga)
Esperado: §2.8: cifras que ruedan una vez, 1.4 s, 90 ms entre dígitos; bloques escalonados
Después: `/`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### pestaña a la derecha: Inicio → Presupuesto
Esperado: §11: entra desde 22 px a la derecha, opacidad 0→1, 320 ms, --curva-estandar
Después: `/presupuesto`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### abrir un detalle: Presupuesto → categoría Restaurantes
Esperado: §11: entra desde 70 px a la derecha, 360 ms
Después: `/presupuesto/categorias/00000000-0000-4000-8000-000000000011`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |
| fz-barup | 700 ms | 0, 80, 160, 240, 320, 400 | cubic-bezier(0.2, 0.8, 0.2, 1) | `svg[role=img][aria-label=Últimos 6 períodos: Promedio g] > g > g.fz-barra-sube` | transform:scaleY(0) |
| fz-item | 400 ms | 120 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > nav[aria-label=Acciones de la categoría]` | opacity:0;transform:translateY(8px) |
| transition:background-color | 220 ms | 0 | linear | `div > div[role=radiogroup][aria-label=Vista] > button[role=radio]` | backgroundColor:rgb(255, 255, 255) |

### volver: categoría → Presupuesto
Esperado: §11: entra desde 50 px a la izquierda, 360 ms
Después: `/presupuesto`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### pestaña a la izquierda: Presupuesto → Inicio
Esperado: §11: igual desde la izquierda, 320 ms
Después: `/`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### abrir Registrar (flujo largo)
Esperado: §11: sube desde abajo, 420 ms, --curva-entrada
Después: `/registrar`

_Ninguna animación ni transición._

### cerrar Registrar
Esperado: §11: aparece con 8 px hacia arriba, 300 ms
Después: `/`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### abrir la hoja Más secciones
Esperado: §11: velo 0→1 (280 ms), la hoja sube (380 ms, --curva-entrada), opciones escalonadas 40 ms
Después: `/` · diálogos abiertos: Más secciones

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-v-in | 200 ms | 0 | ease | `div.fz-velo` | opacity:0 |
| fz-sh-in | 380 ms | 0 | cubic-bezier(0.2, 0.9, 0.25, 1) | `div[role=dialog].fz-hoja` | transform:translateY(100%) |
| fz-item | 300 ms | 0, 40, 80, 120, 160, 200, 240 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > ul > li.fz-opcion` | opacity:0;transform:translateY(8px) |

### cerrar la hoja Más secciones (Escape)
Esperado: §11: baja (200 ms, --curva-salida) y recién entonces se desmonta
Después: `/`

_Ninguna animación ni transición._

### abrir el panel de notificaciones (campana)
Esperado: §11: cae desde arriba (360 ms), avisos escalonados 60 ms
Después: `/notificaciones` · diálogos abiertos: Notificaciones

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-v-in | 200 ms | 0 | ease | `div.fz-velo` | opacity:0 |
| fz-dr-in | 200 ms | 0 | cubic-bezier(0.2, 0.9, 0.25, 1) | `div[role=dialog].fz-hoja` | transform:translateY(-100%) |
| fz-pop-in | 400 ms | 0 | cubic-bezier(0.3, 1.4, 0.5, 1) | `div > div > span.fz-vacio-disco` | opacity:0;transform:scale(0.85) |
| fz-item | 220 ms | 80 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > div > h2.fz-vacio-texto` | opacity:0;transform:translateY(8px) |
| fz-item | 220 ms | 80 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > div > p.fz-vacio-texto` | opacity:0;transform:translateY(8px) |

### cerrar el panel de notificaciones (Escape)
Esperado: §11: sube (200 ms)
Después: `/`

_Ninguna animación ni transición._

### abrir la hoja Asignar desde Inicio
Esperado: §11: velo (280 ms) y hoja que sube (380 ms); en computadora, panel lateral
Después: `/presupuesto?filtro=sin-fondos`

| animación | duración | retraso | curva | destino | primer cuadro |
|---|---|---|---|---|---|
| fz-item | 400 ms | 0, 60 | cubic-bezier(0.2, 0.8, 0.2, 1) | `div > main > div` | opacity:0;transform:translateY(8px) |

### cerrar la hoja Asignar (Escape)
Esperado: §11: baja (200 ms, --curva-salida)
Después: `/presupuesto?filtro=sin-fondos`

_Ninguna animación ni transición._

## navegacion__video__reducido

### entrada de Inicio y billete Listo para asignar (recarga)
Esperado: §2.8: cifras que ruedan una vez, 1.4 s, 90 ms entre dígitos; bloques escalonados
Después: `/`

_Ninguna animación ni transición._

### pestaña a la derecha: Inicio → Presupuesto
Esperado: §11: entra desde 22 px a la derecha, opacidad 0→1, 320 ms, --curva-estandar
Después: `/presupuesto`

_Ninguna animación ni transición._

### abrir un detalle: Presupuesto → categoría Restaurantes
Esperado: §11: entra desde 70 px a la derecha, 360 ms
Después: `/presupuesto/categorias/00000000-0000-4000-8000-000000000011`

_Ninguna animación ni transición._

### volver: categoría → Presupuesto
Esperado: §11: entra desde 50 px a la izquierda, 360 ms
Después: `/presupuesto`

_Ninguna animación ni transición._

### pestaña a la izquierda: Presupuesto → Inicio
Esperado: §11: igual desde la izquierda, 320 ms
Después: `/`

_Ninguna animación ni transición._

### abrir Registrar (flujo largo)
Esperado: §11: sube desde abajo, 420 ms, --curva-entrada
Después: `/registrar`

_Ninguna animación ni transición._

### cerrar Registrar
Esperado: §11: aparece con 8 px hacia arriba, 300 ms
Después: `/`

_Ninguna animación ni transición._

### abrir la hoja Más secciones
Esperado: §11: velo 0→1 (280 ms), la hoja sube (380 ms, --curva-entrada), opciones escalonadas 40 ms
Después: `/` · diálogos abiertos: Más secciones

_Ninguna animación ni transición._

### cerrar la hoja Más secciones (Escape)
Esperado: §11: baja (200 ms, --curva-salida) y recién entonces se desmonta
Después: `/`

_Ninguna animación ni transición._

### abrir el panel de notificaciones (campana)
Esperado: §11: cae desde arriba (360 ms), avisos escalonados 60 ms
Después: `/notificaciones` · diálogos abiertos: Notificaciones

_Ninguna animación ni transición._

### cerrar el panel de notificaciones (Escape)
Esperado: §11: sube (200 ms)
Después: `/`

_Ninguna animación ni transición._

### abrir la hoja Asignar desde Inicio
Esperado: §11: velo (280 ms) y hoja que sube (380 ms); en computadora, panel lateral
Después: `/presupuesto?filtro=sin-fondos`

_Ninguna animación ni transición._

### cerrar la hoja Asignar (Escape)
Esperado: §11: baja (200 ms, --curva-salida)
Después: `/presupuesto?filtro=sin-fondos`

_Ninguna animación ni transición._
