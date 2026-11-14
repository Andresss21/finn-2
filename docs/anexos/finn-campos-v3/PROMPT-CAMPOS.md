Implementá en Finn 2.0 la **familia de campos y controles v3** (decisión C-45). Es la entrega de diseño `docs/diseno/campos-v3/`; si la dejaste en otra carpeta, ajustá las rutas.

Implementá exactamente lo entregado:
- No rediseñes.
- No agregues piezas que no estén dibujadas.
- No cierres en silencio lo que está abierto (P-1 y P-2 de `CAMPOS-V3.md` §13).

## 1 · Qué manda

En este orden:

1. `DECISIONES.md` con la nueva **C-45**: reemplaza el estilo de campo de K2-Base y la lista nativa de C-39 en Safari y Firefox. Todo lo demás sigue igual: C-33 (sin subrayado), C-38 (calendario y rango de fechas), C-41 (máscaras y cuándo se marca un error) y 05 §10.7 (props, ids y `aria-*` de `Campo`, `EntradaTexto`, `Seleccion`, `Buscador`, `Casilla`, `Interruptor` y `Opciones`).
2. `CAMPOS-V3.md`: medidas, estados, máscaras, textos y accesibilidad. Si un dibujo y el documento difieren, manda el documento.
3. `campos-v3.css`: el CSS de referencia. Los nombres de clase son de la referencia; en la app usá los componentes de `componentes/base/`.
4. Los HTML de `referencias/`: los estilos en línea son la medida exacta.
5. Los PNG de `referencias/`: son la imagen de cada HTML.
6. `logica/motor.js` y `logica/motor2.js`: la lógica del prototipo. Son la especificación de comportamiento de las máscaras, la validación y el reparto, no código para copiar. El cálculo con centavos va en el módulo `formato/` existente (FE-18).

## 2 · Antes de escribir código

1. Leé `CAMPOS-V3.md` entero.
2. Ubicá en la app cada componente de 05 §10.7 y cada pantalla que lo usa. Hoy lo usan, como mínimo: Registrar gasto, ingreso y cobro, Editar transacción, Revisar (Bandeja), Nueva cuenta, Filtros de Actividad, Ajustes y Estructura.
3. Mandame un plan corto con los archivos que vas a tocar y esperá mi confirmación. Un PR para los componentes base y otro por cada pantalla grande.

## 3 · Reglas que no se rompen

- **Solo tokens de `tokens.css`.** La única excepción es la sombra de la opción elegida del segmentado, ya aprobada: `0 0 0 1px var(--borde-control), 0 1px 2px rgba(0,0,0,.08)`. Si hace falta, creá un token `--sombra-segmento` con ese valor; no inventes otro.
- **Una lista propia en todos los navegadores.** Nunca el `<select>` del sistema para `Seleccion`.
- **El rótulo nunca es el placeholder** y siempre está visible.
- **Sin subrayados** (C-33). «Intentar de nuevo» es un botón tonal.
- **Blancos de 44 × 44** como mínimo.
- **Textos en voseo, tal cual** `CAMPOS-V3.md` §5 y §9.
- **El botón de guardar nunca usa `disabled`:** va con `aria-disabled` y motivo (05 §4.3).

## 4 · Qué construir

1. **`Campo` como fila y `GrupoCampos`** como contenedor. Estados de §3: normal, foco (con `:focus-within`), error, error con foco, ayuda, solo lectura, deshabilitado y opcional. Respetá `prefers-reduced-motion` y `forced-colors` como dice §3.
2. **`EntradaMonto`** en fila (prefijo «$») y en **billete** (`variante="total"`, §4). `EntradaFecha` en fila con el calendario de C-38. **`EntradaPorcentaje`** con «%» fijo. Máscaras de §5.
3. **`Seleccion`** con disparador en fila y panel propio con grupos, línea secundaria y negativos en `--problema-texto`; teclado de §6. Con 3 opciones o menos, `SelectorSegmentado`; con 4 a 7, `Opciones`; con más, la lista.
4. **`Buscador`** con el mismo panel: espera de 250 ms, coincidencia en negrita, sin resultados, error con reintento y región `status` (§7).
5. **`Casilla`, `Interruptor` y `Opciones` como filas** (§8). Toda la fila es el `<label>`; el interruptor va a la derecha.
6. **Elección** (§9): tarjetas, segmentado, chips de personas con «Otra persona» y la fila en línea para agregar.
7. **Fila de parte y resumen** (§10). Partes iguales, porcentaje y montos, quitar, y el resumen `status`.
8. **Registrar gasto** armado con estas piezas, igual al tablero «Probar» del lienzo. La sección «¿Quién paga?» envía una línea para la parte de Vos (con su categoría) y una línea por cobrar por cada persona, con `lineas` de 1 a 20 (05). Si la persona es nueva, el deudor se crea con la transacción.

## 5 · Criterios de aceptación

- **CA-K3-1** · Dado cualquier campo de texto, cuando recibe foco, entonces su fila tiene fondo `--superficie-elevada`, radio 12, sale 6 px a cada lado, tiene relleno lateral de 22 y sombra `--elevacion-3`, y el rótulo está en `--accion`. Ninguna otra fila del grupo cambia de posición.
- **CA-K3-2** · Dado un campo con error, entonces su fila tiene fondo `--problema-fondo`, el rótulo está en `--problema-texto`, el mensaje está dentro de la fila con su ícono, el control tiene `aria-invalid="true"` y `aria-describedby` incluye el id del mensaje. Con foco, además, tiene un anillo de 2 px `--problema-borde`.
- **CA-K3-3** · Dado Total vacío, cuando escribo `1236.456`, entonces se ve `1,236.45`. Al salir de un total `1236.4`, se ve `1,236.40`. Con `25000000` se marca en el momento «El máximo es $21,474,836.47.».
- **CA-K3-4** · Dado Fecha, cuando escribo `15102026`, entonces se ve `15/10/2026`. Si salgo con `1510`, aparece «Completá la fecha como dd/mm/aaaa.». Con `31022026` aparece en el momento «Esa fecha no existe. Escribila como dd/mm/aaaa.».
- **CA-K3-5** · Dado la Categoría cerrada, cuando la abro con Intro o con un clic, entonces aparece la lista propia, también en Safari y Firefox:
  - con los grupos y su rótulo;
  - la elegida con fondo `--accion-tonal` y check;
  - Restaurantes con «Disponible −$26.30» en `--problema-texto`.
  
  Con las flechas e Intro elijo; Escape cierra y el foco vuelve al disparador.
- **CA-K3-6** · Dado una selección de 3 opciones o menos, entonces se muestran todas como segmentado, sin lista.
- **CA-K3-7** · Dado el buscador de Comercio, cuando escribo `pric` y espero 250 ms, entonces:
  - se ve «Buscando…»;
  - después, las sugerencias con «PRIC» en negrita;
  - una región `status` anuncia la cantidad.
  
  Si el servidor falla, se ve «No se pudo buscar.» con el botón «Intentar de nuevo», sin subrayado.
- **CA-K3-8** · Dado una lista de casillas, cuando toco el texto de una fila, entonces cambia su casilla. Una casilla a medias tiene `aria-checked="mixed"`. Un interruptor tiene `role="switch"`, está a la derecha y anuncia su estado.
- **CA-K3-9** · Dado «Con alguien» con Carlos y Ana en partes iguales y un total de $1,236.40, entonces las partes son Vos $412.14, Carlos $412.13 y Ana $412.13, y el resumen dice «Repartido $1,236.40 de $1,236.40».
- **CA-K3-10** · Dado el reparto por porcentaje 40 / 20 / 20, cuando salgo del campo, entonces el resumen dice «Suman 80 %. Falta repartir 20 % ($247.28).» y Guardar dice «Corregí 1 campo para guardar.». Con 120 en una parte, se marca en el momento «Cada parte va de 0 a 100 %.».
- **CA-K3-11** · Dado el reparto por montos 600 / 400 / 300 con un total de $1,236.40, entonces el error aparece en el momento: «Las partes pasan el total por $63.60.».
- **CA-K3-12** · Dado «Otra persona», cuando escribo «ana» (ya existe), entonces se marca la Ana existente, no se crea otra y aparece «Ya tenías a Ana en Por cobrar: la sumamos.». Con «Luis» aparece el chip con «Nueva». Con «yo» aparece «Tu parte ya está: escribí el nombre de la otra persona.».
- **CA-K3-13** · Dado un formulario incompleto, cuando toco Guardar, entonces:
  - no se envía;
  - se marcan todos los errores;
  - el foco va al primero;
  - el motivo debajo del botón dice cuántos campos corregir.
  
  El botón tiene `aria-disabled="true"`, no `disabled`.
- **CA-K3-14** · Dado el tema oscuro, entonces el billete usa la marca invertida (fondo claro). Todos los pares de §12 cumplen el contraste medido; axe no reporta violaciones en los dos temas.
- **CA-K3-15** · Dado `forced-colors: active`, cuando enfoco un campo, entonces se ve un contorno de 2 px. Con `prefers-reduced-motion: reduce`, la fila se levanta sin transición.
- **CA-K3-16** · Dado Registrar gasto con Carlos (existente) y Luis (nuevo), cuando guardo, entonces se envían 3 líneas: Vos con la categoría elegida, Carlos y Luis como por cobrar. Luis se crea como deudor, y Por cobrar muestra a los dos.

## 6 · Cómo entregarme el trabajo

Por cada PR mandame:
- capturas del tema claro y del oscuro de cada componente tocado, al lado de su PNG de `referencias/`;
- la salida de `pnpm test:componentes` y de axe;
- cualquier diferencia que no pudiste resolver, con el motivo.

No toques P-1 (división entre categorías) ni P-2 (Editar estructura en el ☰): están abiertos.
