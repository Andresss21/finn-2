# Finn 2.0 · exportación del diseño · entrega 4 · etapa 2 · Acceso, seguridad y Cuentas

Fecha: 11/11/2026. Diseña los ítems 7 a 13, 23 y 24 de `docs/auditoria-diseno/PROMPT-DISENO.md`, con las respuestas del dueño del 11/11/2026. Las decisiones están en `DECISIONES.md`, sección "Entrega 4 · etapa 2" (E2-1 a E2-16), con su justificación y las alternativas descartadas.

Esta etapa se suma a la etapa 1: el paquete trae solo lo nuevo. Las pantallas de la etapa 1 siguen en `finn-diseno-entrega-4-etapa-1.zip`.

## 1 · Qué hay

34 estados, cada uno en `__telefono-claro`, `__telefono-oscuro` y `__computadora-claro`, como HTML (con `data-rol` y `var(--token)`) y PNG (teléfono a 2×, computadora a 1×, con «reducir movimiento»): 102 HTML y sus 102 PNG.

| Carpeta | Estados |
|---|---|
| `pantallas/13-acceso` | `ingresar` (con la línea de ayuda y el ícono para mostrar la contraseña), `ingresar-validacion`, `ingresar-contrasena-visible`, `ingresar-sin-conexion`, `sesion-vencida`, `sesion-vencida-con-borrador`, `verificar-incompleto`, `inscribir` (6 casillas), `inscribir-preparando`, `inscribir-copiado`, `inscribir-error` |
| `pantallas/11-ajustes` | `agregar-factor-nombre`, `agregar-factor-nombre-repetido`, `agregar-factor`, `agregar-factor-codigo-malo`, `seguridad-factor-agregado`, `quitar-factor`, `seguridad-factor-quitado` |
| `pantallas/06-detalle-de-cuenta` | `nueva-prestamo`, `nueva-prestamo-condiciones`, `nueva-inversion`, `nueva-billetera`, `billetera`, `saldo-verificado`, `ajuste-registrado`, `conciliada`, `cuota-pagada`, `tarjeta-pagada`, `verificar-saldo-tarjeta`, `archivar-tarjeta` |
| `pantallas/S6-cuentas` | `con-billetera`, `sin-cuentas`, `una-tarjeta` |
| `pantallas/S3-detalle` | `mover-resultado` |
| `iconos/` | `eye.svg` y `eyeoff.svg` (nuevos, para mostrar y ocultar la contraseña) |
| `estilos/tokens-propuesta.css` | `--cuenta-billetera`, propuesto (E2-12), con su motivo y contraste. Las pantallas que lo usan lo traen incrustado y marcado como propuesta |
| `CH-05-9.3-linea-de-ayuda.md` | Cambio propuesto a 05 §9.3, sin aplicar |
| `FALTANTES.md` | Actualizado: lo de esta etapa, marcado como diseñado |
| `herramientas/` | Los generadores de esta etapa (`lib.py`, `gen_*.py`), `barra_lateral3.py`, `contraste_dom.py`, `renderizar.py` y el armador de tableros |

Cada estado parte de una referencia aprobada y cambia solo lo que cambia el estado:
- Acceso: `13-acceso/ingresar`, `verificar`, `inscribir` y `codigo-incorrecto` de la entrega 2.
- Seguridad: `16-salir/seguridad` y `seguridad-factor-unico` de la entrega 3; el marco del flujo largo es `06-detalle-de-cuenta/condiciones`.
- Cuentas: `06-detalle-de-cuenta/nueva-tarjeta`, `corriente`, `prestamo`, `tarjeta`, `vacia`, `verificar-saldo` y `archivar` de la entrega 2; `S6-cuentas/principal` y `S3-detalle/principal` de la etapa 1.

En computadora, los flujos van en una columna de 720 px, sin campana (D-1); las hojas pasan a panel lateral de 440 px. Todas las vistas de computadora con barra lateral llevan el pie de la entrega 3 (correo de la sesión y «Salir») y el engranaje en Ajustes; esto también se aplicó a las 49 vistas de computadora de la etapa 1, que venían con la barra lateral anterior a la entrega 3.

El resultado de desarchivar (ítem 23) va con las categorías archivadas, en la etapa 4.

## 2 · Componentes

No hay componentes nuevos. Se usan:
- Campo y selección (§2.2); campo con error con el mensaje en línea de `13-acceso/codigo-incorrecto` (glifo de 16, color y texto).
- Selector segmentado (§2.2): Debo / Tengo a favor, Fija / Variable, Corriente / Ahorro / Billetera.
- Selección con la opción elegida en `--superficie-hundida` y `check` (§2.2), en archivar tarjeta.
- Aviso en línea (§2.14), resultado de una acción (§2.13), botón deshabilitado con su motivo (§2.1), botón de peligro.
- Identidad por tipo de cuenta (§2.10), con el fondo propio de la billetera.
- Casillas del código (DECISIONES · código de verificación).

Lo único nuevo que se dibuja es el plegable de «Condiciones · opcional» (un contenedor con el título, el resumen y un `chevD` que gira; `aria-expanded`). Es un contenedor de §1 con un botón adentro: no hace falta un componente aparte.

## 3 · Movimiento

Nada nuevo se mueve. Los resultados entran con el rebote de §2.13 (`fz-pop-in`); las hojas y los paneles, como en la referencia. Las casillas siguen la tabla de DECISIONES salvo el envío automático (E2-2). El plegable gira el `chevD` 180° con `--duracion-rapida`; con «reducir movimiento» no gira, cambia.

## 4 · Contraste de los pares nuevos

Medido con los valores de `tokens.css` (y `tokens-propuesta.css` para la billetera), en claro y en oscuro. Además se midió cada texto renderizado contra su fondo real en los 102 archivos (`herramientas/contraste_dom.py`): todo pasa, salvo los botones deshabilitados, que WCAG exime y que llevan su motivo escrito.

| Qué | Par | Claro | Oscuro | Mínimo | |
|---|---|---|---|---|---|
| Billetera: nombre y saldo | `texto` sobre `cuenta-billetera` | 14.42:1 | 13.72:1 | 4.5:1 | ✓ |
| Billetera: «Efectivo en mano» | `texto-secundario` sobre `cuenta-billetera` | 6.55:1 | 7.61:1 | 4.5:1 | ✓ |
| Billetera: ícono | `grafico-tinta` sobre `cuenta-disco` (sobre `cuenta-billetera`) | 17.19:1 | 11.15:1 | 3:1 | ✓ |
| Billetera: costura | `cuenta-motivo` sobre `cuenta-billetera` | 1.17:1 | 1.21:1 | decorativa | — |
| Ícono mostrar contraseña | `texto-secundario` sobre `superficie` | 8.40:1 | 8.45:1 | 3:1 | ✓ |
| Error en línea | `problema-texto` sobre `fondo` | 4.95:1 | 8.17:1 | 4.5:1 | ✓ |
| Borde de campo con error | `problema-borde` sobre `superficie` | 4.46:1 | 5.43:1 | 3:1 | ✓ |
| Aviso sesión vencida: título | `advertencia-texto` sobre `advertencia-fondo` | 5.40:1 | 8.62:1 | 4.5:1 | ✓ |
| Aviso sesión vencida: texto | `texto` sobre `advertencia-fondo` | 16.29:1 | 12.64:1 | 4.5:1 | ✓ |
| Aviso error de inscripción: título | `problema-texto` sobre `problema-fondo` | 4.55:1 | 6.75:1 | 4.5:1 | ✓ |
| Botón de peligro | `texto-sobre-peligro` sobre `peligro` | 6.57:1 | 7.51:1 | 4.5:1 | ✓ |
| Opción elegida | `texto` sobre `superficie-hundida` | 15.12:1 | 17.19:1 | 4.5:1 | ✓ |
| Opción elegida: detalle | `texto-secundario` sobre `superficie-hundida` | 6.87:1 | 9.53:1 | 4.5:1 | ✓ |
| Check de la opción | `accion` sobre `superficie-hundida` | 5.96:1 | 6.99:1 | 3:1 | ✓ |
| Ayuda de Ingresar | `texto-secundario` sobre `fondo` | 7.47:1 | 9.22:1 | 4.5:1 | ✓ |
| Campo de solo lectura | `texto` sobre `superficie-hundida` | 15.12:1 | 17.19:1 | 4.5:1 | ✓ |

## 5 · Canvas

Tableros nuevos en la fila «Acceso, marco y Salir» y en la fila «Cuentas» de la página actual: E4-E2-Acceso (a, b), E4-E2-Seguridad (a, b) y E4-E2-Cuentas (a a e). No se movió nada a Historial: esta etapa no sustituye tableros, los completa.

## 6 · Demo

La demo navegable se actualiza al cierre, con todas las etapas juntas (lo acordado). Hasta entonces, sesión vencida, agregar y quitar factor y las altas de préstamo e inversión siguen como "pantalla sin diseño" en la demo.

## 7 · Revisión independiente

Un agente que no participó revisó la etapa completa. No encontró nada que bloquee; esto es lo que encontró y lo que se hizo.

| Hallazgo | Qué se hizo |
|---|---|
| Los resultados «listo» decían una cosa y la pantalla de fondo mostraba la de antes | Cada fondo muestra los datos actualizados: movimiento nuevo con su saldo, saldos corridos, conciliación al día, cuota 14 en Pagos y la 15 resaltada |
| «Nueva cuenta · Billetera» no usaba la identidad de la billetera | Vista previa «Así se va a ver» con la identidad |
| Discos del ícono de tipo cruzados en Nueva cuenta | Como en `nueva-tarjeta`: `--superficie` en la elegida y `--superficie-hundida` en las demás |
| «−» separado de «$12.40» | Montos de los resultados sin corte y con cifras tabulares |
| El flujo de agregar factor volvía a «Ajustes» | Vuelve a «Seguridad» |
| Ingresar sin conexión y preparando sin glifo | Motivo con `wifioff` y `clock`, enlazado con `aria-describedby` |
| La barra lateral de computadora sin «Salir» ni el engranaje en 15 vistas (y en la etapa 1) | Puesta al día en todas, con `herramientas/barra_lateral3.py` |
| Valores sueltos nuevos | Costura a 8 px (escala de espacio); paddings de la selección y del campo de contraseña llevados a combinaciones que ya existen |
| Comentarios de cabecera de la referencia de origen | Cada archivo nombra su carpeta, estado y variante |
| `aria-label` de los segmentados copiado de «Saldo inicial» | Cada uno lleva su rótulo |
| «Quitaste Respaldo.» arriba de Autenticador | Debajo, donde estaba Respaldo |
| Plegable: campos fuera del contenedor y resumen visible al abrir | Un contenedor con borde sutil, abierto o cerrado, con los campos adentro; el resumen se oculta al abrir |
| «Deuda que muestra tu banco» en dos líneas | «Deuda según el banco», en paralelo a «Saldo según el banco» |
| Contraseña escrita en sesión vencida | Vacía |
| Nueva inversión sin «Últimos 4» | Agregado, opcional |
| Trazo de `eye` y `eyeoff` en 1.8 | 1.5, el del juego |
| Filas viejas de DECISIONES sin remisión | Tabla «Filas anteriores que esta etapa sustituye» |
| Par del ícono de la billetera mal medido; costura sin anotar | Corregidos en §4 |
| Billetera y préstamo casi del mismo tono en claro | Billetera más amarilla (#F2E3AE; oscuro #272310), con el contraste medido otra vez |
| FALTANTES sin cuatro ítems de Cuentas de SIN-DISENO | Agregados; el resultado de pagar tarjeta se dibujó en esta etapa (`tarjeta-pagada`) |
