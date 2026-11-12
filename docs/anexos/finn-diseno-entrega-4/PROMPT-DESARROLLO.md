Implementá en Finn 2.0 la **entrega 4 de diseño completa**: las respuestas a la auditoría de la app (etapa 1), las pantallas y estados de las etapas 2 a 6 y el cierre (juego de datos único y cambios aplicados a 04, 05 y 06). El paquete está en `docs/diseno/entrega-4/`; si lo dejaste en otra carpeta, ajustá las rutas.

Este prompt reemplaza las semillas de cada etapa (`prompt/etapa-1.md`, `etapa-5.md`, `etapa-6.md`). Implementá exactamente lo entregado: no rediseñes, no agregues pantallas que no estén dibujadas y no cierres en silencio lo que no está.

## 1 · Qué manda

En este orden:

1. `DECISIONES.md`: reglas transversales, marco y las decisiones D-1 a D-11, E2-1 a E2-16, E3-1 a E3-25, E4-1 a E4-33, E5-1 a E5-22, E6-1 a E6-24, C-1 a C-20 (datos) y C-21 a C-25 (cierre). La D-11 fue reemplazada por E4-1 y la D-10 quedó cerrada por E4-32: donde difieran, mandan E4-1 y E4-32.
2. Los criterios aprobados de `06-features.md`. **Si un criterio contradice un dibujo, manda el criterio.**
3. `05-frontend.md` sobre los dibujos (por ejemplo, la clase de cada ruta y los textos del catálogo).
4. Los HTML de `pantallas/`: los estilos en línea son la medida exacta; cada color es un `var(--token)` y cada texto lleva `data-rol`.
5. Los PNG son la imagen de cada HTML; no tienen información propia.

**Cuál es la versión vigente de un estado.** La de la etapa más reciente que lo dibujó, en este orden: cierre, etapa 6, 5, 4, 3, 2, 1, entrega 3 y entrega 2. `INDICE-cierre.md` y la demo ya muestran la vigente.

**Demo.** «Finn 2.0 · demo navegable» tiene los 400 estados en sus variantes, enlazados como en la app. Sirve para recorrer los flujos; la medida sigue siendo el HTML.

## 2 · Antes de escribir código

1. Leé `INDICE-cierre.md`, `DECISIONES.md` y `DATOS-EJEMPLO.md` enteros.
2. Cruzá cada decisión con `docs/auditoria-diseno/AUDITORIA-APP.md`, que dice dónde está hoy cada cosa en la app.
3. Mandame un plan corto, por bloque de la sección 5, con los archivos que vas a tocar, y esperá mi confirmación. Trabajá un bloque por PR.

## 3 · Reglas que no se rompen

- **Solo tokens de `tokens.css`.** Ningún valor suelto de color, espacio, radio, duración ni curva. Excepción declarada (C-18): el arte de las caras de tarjeta y del héroe de Listo para asignar, que va como tokens decorativos con nombre (`--decorativo-*`) en un solo archivo, sin mínimo de contraste porque no lleva texto propio. La sombra del marco del teléfono de las referencias es de presentación: no se implementa.
- **Tres señales por estado:** color, glifo y texto.
- **Textos en voseo**, tal cual están en los HTML y en el catálogo (04 §7.10). Los textos de error de pantalla dicen «Intentar de nuevo» (05 §7.3).
- **Tocables de 44 × 44** como mínimo, también donde un PNG viejo muestra 36 o 40 (E6-18).
- **Contraste:** 4.5:1 para texto y 3:1 para gráficos, en claro y en oscuro.
- **Con `prefers-reduced-motion` no se anima nada.**
- **Los resultados quedan en el lugar del control,** sin toast. «Deshacer» solo donde 05 §4.14 tiene una operación inversa; sin inversa, el resultado no la ofrece. Aprobar no tiene Deshacer; Descartar se recupera con Restaurar.
- **La interfaz no calcula** Listo para asignar, Disponible, saldos ni proyecciones (PF-3): los trae del servidor (previsualizar o la consulta).
- **Marco:** teléfono hasta 767 px; de 768 a 1023, marco de teléfono con el contenido centrado a 640 px; barra lateral desde 1024. Los flujos no llevan barra inferior ni campana. Un flujo corto es una hoja en el teléfono y un panel de 440 px en computadora.

## 4 · Datos de las referencias

Las referencias usan un solo juego de datos: **A.7 corregido por CT-07**, con lo que A.7 no da fijado en `DATOS-EJEMPLO.md`. Los números de las pruebas no se copian de los PNG: salen de la semilla `estado-a7` ejecutada por el motor (DP-27, 07 §12.4). Si un número de una referencia no coincide con lo que da la semilla, manda la semilla: avisame la diferencia, no ajustes la semilla.

Hay estados que ilustran otra situación (Listo para asignar negativo, la comisión de $12.40, la rama «después de guardar PRICESMART», entre otros). La lista está en `DATOS-EJEMPLO.md` §7. Sus pruebas siembran esa situación sobre A.7.

Las referencias dibujan dos momentos del recorrido 4.2: la Bandeja y Revisar, antes del paso 3 (3 por revisar); el resto, después del paso 3 (2 por revisar). Ver `DATOS-EJEMPLO.md` §1 y CA-C-1.

Las preguntas abiertas para el dueño están en `INDICE-cierre.md` §7. Ninguna se resuelve en el código sin su respuesta.

## 5 · Qué cambia, por bloque

### 5.1 · Tokens y movimiento (D-10, E4-32)

- Reemplazá `tokens.css` y `tokens.json` por los de `estilos/`. Agregan `--duracion-temblor`, `--retardo-cascada` y `--duracion-confirmacion`; ningún valor anterior cambia.
- Cada variable de movimiento propia de la app y cada duración suelta de `finn.css` pasa al token de la tabla de `estilos/tokens-propuesta.css`, con los valores de los tokens aprobados (por ejemplo, 300 → 340 ms).
- **No** incorpores `--retardo-bloque` ni `--retardo-grafico`: siguen propuestos. Lo que depende de ellos queda con el comentario `// pendiente: tokens-propuesta (entrega 4)`.
- `--tope-escalonado` es una constante con nombre dentro del componente.

### 5.2 · Marco, anchos y carga (D-1, D-2, D-8, E4-26, E6-1 a E6-3, E6-10, E6-19)

- Flujos en computadora: una columna de 720 px. Registrar gasto, Revisar movimiento, Editar transacción y Formato nuevo o editar van en dos columnas (D-1 y E5-11). Archivar, fusionar y los de Programadas, en una.
- Actividad en computadora: la columna de filtros mide 320 px. Ajustá la prueba que hoy espera 260.
- Barra lateral: filas de 44 px y el símbolo de la marca.
- Carga: esqueleto estático en `loading.tsx` de cada sección, detalle y flujo corto (`T1-carga`), y la señal de navegación de FE-39 (`EnlaceFinn` con `useLinkStatus`, punto de 8 px en el enlace y franja de 3 px en el marco, `T2-navegacion`).
- 768 a 1023 px: `T4-tableta`. Lo que no está dibujado a 768 se deriva de D-2.

### 5.3 · Inicio y Presupuesto (D-3 a D-7, E4-1 a E4-33, E6-14 a E6-17)

- «Asignar $X» del billete navega a Presupuesto con el filtro «Sin fondos» (sin filtro si no hay ninguna); con Listo para asignar negativo, «Quitar $X de una categoría» lleva a Presupuesto. No abre hojas.
- «Necesita tu atención»: ninguna fila muestra monto.
- Primer uso sin cuentas: «Primeros pasos · 0 de 3» (`15-…/primeros-pasos-sin-cuentas`).
- Línea de estado del billete en `--texto-sobre-marca`; el glifo conserva su disco.
- Asignar en un período cerrado: no hay hoja; lleva al detalle en ese período con el aviso de información (`S3-detalle/periodo-cerrado`).
- Mover más que el Disponible se acepta con el aviso de advertencia (`07-…/mover-excede`).
- Pasos «Revisá el impacto» (E4-1): archivar, fusionar, eliminar cuenta, auto-asignar, cambiar el ciclo y verificar saldo **empiezan por el impacto** (llaman a previsualizar); los demás envían con `modo: 'confirmar'` y muestran el paso solo si el servidor responde `REQUIERE_CONFIRMACION`. Registrar gasto y Revisar no tienen impacto en vivo (E4-2, E4-3).
- Estructura, categorías archivadas, Más acciones, períodos de transición y primer período, Metas, Programadas, Por cobrar y Reglas: decisiones E4-5 a E4-33, con sus referencias en `08-…`, `S3-detalle`, `MA-…`, `S2-presupuesto`, `09a` a `09d`.

### 5.4 · Acceso, seguridad y Cuentas (E2-1 a E2-16, E6-14, E6-15)

- Ingresar: sin alta ni «Olvidé mi contraseña»; bajo «Ingresar», la línea «¿Olvidaste la contraseña? Cambiala desde el panel de Supabase.» (CH-05-9.3, aplicado).
- Código de verificación sin envío automático, mostrar la contraseña, sesión vencida, inscribir y factores de respaldo: `13-acceso`, `11-ajustes/seguridad*`, `agregar-factor*`, `quitar-factor`.
- Altas de préstamo e inversión, billetera, verificar el saldo de una tarjeta, archivar una tarjeta y Cuentas vacía: `06-detalle-de-cuenta`, `S6-cuentas`.
- «Nueva cuenta» y «Ordenar las cuentas» van en el menú del encabezado (teléfono) o en «Más acciones» (computadora).

### 5.5 · Bandeja, Revisar y Registrar (E3-1 a E3-25, E6-6 a E6-8)

- Arrastrar a una categoría (CF-21, CF-22): cómo empieza, panel de destinos, fila tomada, soltar, cancelar, «Otra categoría…», anuncios y movimiento (`S4-bandeja/arrastre-*`, `asa-al-pasar-y-con-foco`). El ejemplo es FARMACIA SAN NICOLAS → Farmacia (06 §4.2, paso 4).
- Aprobar todos y Bandeja con muchos movimientos.
- Revisar en computadora (dos columnas), ingreso, no reconocido a mano, datos faltantes, aprobando y período cerrado.
- Editar una conciliada: no se bloquea; el aviso AV-16 va en el paso de confirmar.
- Registrar: borrador recuperado, errores de fecha y calendario, otra persona, entrada a una tarjeta, inversión (retiro y ajuste), avance guardado, una sola cuenta de efectivo y sin cuentas.
- Errores de los flujos: un patrón por tipo (corto, largo, arrastre, lote), en todos los flujos (`T3-errores-de-flujo`).

### 5.6 · Reportes y Ajustes (E5-1 a E5-22, E6-22 a E6-24)

- Reportes: `SelectorReportes` (CH-E5-1 y CH-E5-2, aplicados): hoja en el teléfono, lista fija de 232 px en computadora; cada opción es un enlace a `/reportes/[tipo]`. Filtro de cuentas, Períodos compacto y los 15 tipos dibujados.
- Tablas anchas en el teléfono: primera columna fija y desplazamiento horizontal.
- Categorías: hasta 8 porciones; con más, «Otras» con rayado, y la tabla lista todas. Tendencia: sin «Asignado»; se llama «Tendencia».
- Ajustes: `/ajustes/webhook`, `/ajustes/formatos` e `/ajustes/instituciones` son páginas [S] (con «←», campana y barra inferior); generar el token es el flujo corto `/ajustes/webhook/token` (CH-E5-3, aplicado). El token se muestra una sola vez y nunca un sufijo.
- Formatos: formato nuevo y editar con la prueba en vivo; los textos de `patron_invalido`, `banderas_no_permitidas`, `grupos_obligatorios` y `patron_lento` vienen del catálogo del servidor (CH-E5-4, aplicado a 04 §7.10).
- Después de guardar un formato: si el servidor informa cuántos SMS sin reconocer hay de esa institución, la línea dice el número; si no, va sin número («Si tenés SMS sin reconocer de BAC…»). No hay «Reprocesar todos».
- Notificaciones (tarjeta en Inicio, permiso denegado, iPhone sin instalar), instalar, diagnóstico y respaldo vacíos.

### 5.7 · Sin conexión, versión y notificaciones (E6-4, E6-5, E6-9 a E6-12)

`14-sin-conexion-404-y-error-de-pantalla` y `K1-navegacion`: navegación bloqueada, flujo corto, revisar, bandeja, nueva cuenta, página con borrador, versión nueva, no encontrado al enviar, transferencia con una cuenta y el panel de notificaciones vacío, todo leído y con error.

## 6 · Cambios aplicados a los documentos (marca [D4])

Aplicados al cerrar el diseño el 11/11/2026, cada uno con su línea en «Enmiendas posteriores»:

| CH | Documento | Qué cambia |
|---|---|---|
| CH-E5-1 | 06 FT-60 | Navegación entre reportes con `SelectorReportes` |
| CH-E5-2 | 05 §10.7 | Componente `SelectorReportes` |
| CH-E5-3 | 05 §1.3, §2.11 y §15 | Webhook, formatos e instituciones como [S]; OPT-01 en `/ajustes/webhook/token` [C] |
| CH-E5-4 | 04 §7.10 | Textos de `patron_invalido`, `banderas_no_permitidas`, `grupos_obligatorios`, `patron_lento` y `nombre_repetido` en OPT-07 |
| CH-05-9.3 | 05 §9.3 | Línea de ayuda de Ingresar |
| Consecuencias | 05 §15.4; 06 FT-03, FT-73 y §6.4 | `/reportes/[tipo]` suma `SelectorReportes`; FT-03 y la tabla de rutas suman `/ajustes/webhook/token`; FT-73 remite a los textos de 04 §7.10 |

**Propuesto y no aplicado (CH-C-2).** Conectar SMS muestra el último SMS recibido, que `AjustesDto.webhook` (04 §6.11) no trae. Hasta que el dueño lo apruebe, esa línea no se implementa: la pantalla muestra solo el estado de la conexión.

Volvé a correr `trazabilidad.py --comprobar` y `cobertura.py` de la Fase 5 con estos 05 y 06: CH-E5-3 agrega una ruta.

## 7 · Criterios de aceptación

### 7.1 · Etapa 1

**Tokens y movimiento**
- CA-E4-1 · Dado el código de la app, entonces ninguna variable de movimiento propia queda: todas usan el token de la tabla.
- CA-E4-2 · Dado el código nuevo, entonces no hay ningún color hexadecimal ni duración en ms fuera de `tokens.css` (salvo los tokens decorativos de C-18, en su archivo).
- CA-E4-3 · Dado que estoy sin conexión, entonces el aviso global dice «Estás sin conexión» y nada más.

**Marco**
- CA-E4-4 · Dada una ventana de 1440 px, cuando abro un flujo de una columna, entonces el contenido mide 720 px como máximo.
- CA-E4-5 · Dada una ventana de 1440 px, cuando abro Registrar gasto o Revisar movimiento, entonces el flujo ocupa todo el ancho del contenido (1096 px) en dos columnas iguales.
- CA-E4-6 · Dada una ventana de 900 px, entonces veo barra superior y barra inferior, sin barra lateral, y el contenido no pasa de 640 px.
- CA-E4-7 · Dada una ventana de 1024 px, entonces aparece la barra lateral y las pantallas de dos columnas se muestran en una; desde 1280 px, en dos.
- CA-E4-8 · Dada Actividad en computadora, entonces la columna de filtros mide 320 px.

**Inicio**
- CA-E4-9 · Dado Listo para asignar positivo y al menos una categoría sin fondos, cuando toco «Asignar $X», entonces llego a Presupuesto con el filtro «Sin fondos» aplicado y no se abre ninguna hoja.
- CA-E4-10 · Dado Listo para asignar positivo y ninguna categoría sin fondos, cuando toco «Asignar $X», entonces llego a Presupuesto sin filtro.
- CA-E4-11 · Dado Listo para asignar negativo, cuando toco «Quitar $X de una categoría», entonces llego a Presupuesto.
- CA-E4-12 · Dado «Necesita tu atención» con filas, entonces ninguna fila muestra un monto, en teléfono ni en computadora.
- CA-E4-13 · Dado un usuario sin cuentas, entonces Inicio muestra «Primeros pasos · 0 de 3».
- CA-E4-14 · Dado el billete en «Todo asignado» o en negativo, entonces el texto de la línea de estado mide 4.5:1 o más sobre el billete, en claro y en oscuro.

**Presupuesto y detalle**
- CA-E4-15 · Dado un período cerrado, cuando abro la URL de asignar de una categoría en ese período, entonces llego a su detalle en ese período con el aviso de información y el texto del catálogo, y no hay Asignar, Mover dinero, Archivar ni «Cubrir».
- CA-E4-16 · Dado ese aviso, cuando toco «Ir al período actual», entonces veo el mismo detalle en el período actual.
- CA-E4-17 · Dado Mover con un monto mayor que el Disponible, entonces no hay error en el campo, aparece el aviso de advertencia con el monto negativo que va a quedar y «Mover $X» está activo.
- CA-E4-18 · Dado ese mover confirmado, entonces la categoría de origen queda en negativo y aparece en «Necesita tu atención».
- CA-E4-19 · Dado el detalle en computadora, entonces la tabla del historial se ve entera, sin corte a la derecha.

**Textos y pasos**
- CA-E4-20 · Dado Devolver, entonces el texto dice «Vuelve a {cuenta}».
- CA-E4-21 · Dado eliminar cuenta, auto-asignar, cambiar el ciclo o verificar saldo, cuando envío el formulario, entonces la app llama a previsualizar y muestra el paso «Revisá el impacto» con la tarjeta K4 antes de confirmar. Dado archivar o fusionar, entonces la tarjeta K4 está en la misma pantalla del formulario (E4-1) y se vuelve a pedir cada vez que cambia una decisión.
- CA-E4-21b · Dado cualquier otro flujo de escritura, cuando el servidor responde `REQUIERE_CONFIRMACION`, entonces aparece el mismo paso con los avisos y el impacto de la respuesta; «Confirmar» reenvía con la huella y «Volver a editar» vuelve al formulario con lo escrito. En eliminar, el par es «Cancelar» y el verbo en peligro.
- CA-E4-21c · Dado Registrar gasto, Revisar movimiento o un flujo corto de Registrar, entonces no hay bloque de impacto que se actualice al escribir.
- CA-E4-21d · Dado un gasto guardado, entonces el resultado lista cada categoría (y cada deudor) que tocó, con un enlace a su detalle.

**Transversales**
- CA-E4-22 · Dada la lista de cuentas archivadas, entonces «Archivada · {banco}» mide 4.5:1 o más.
- CA-E4-23 · Dado que estoy sin conexión en computadora, entonces «Guardar» está deshabilitado con su motivo escrito.
- CA-E4-24 · Con `prefers-reduced-motion`, nada de lo tocado se anima.

### 7.2 · Etapas 2 a 4

- CA-E2-1 · Dada Ingresar, entonces no hay alta ni «Olvidé mi contraseña», y bajo el botón está la línea de ayuda de CH-05-9.3, sin enlace.
- CA-E2-2 · Dado el código de verificación, entonces no se envía solo al completar los 6 dígitos (E2-2).
- CA-E2-3 · Dados los estados de `13-acceso` y de Seguridad, entonces la app coincide con cada uno en sus variantes.
- CA-E3-1 · Dado el arrastre en el teléfono y con ratón y teclado, entonces empieza, resalta, se suelta y se cancela como en `S4-bandeja/arrastre-*`, con los anuncios de E3-6; los botones de un toque no cambian (WCAG 2.5.7).
- CA-E3-2 · Dados Revisar y Registrar, entonces cada estado de E3-10 a E3-23 coincide con su referencia.
- CA-ET4-1 · Dado un dato que no se edita (el tipo de una meta o de una programada), entonces va como texto con candado y una línea que dice por qué (E4-16), no como control deshabilitado.
- CA-ET4-2 · Dados Estructura, categorías archivadas, Más acciones, períodos, Metas, Programadas, Por cobrar y Reglas, entonces cada estado de E4-5 a E4-33 coincide con su referencia en sus variantes.

### 7.3 · Etapa 5

**Reportes**
- CA-E5-1 · Dado `/reportes`, entonces llego a `/reportes/tendencia`.
- CA-E5-2 · Dado el teléfono, cuando toco el botón bajo el título, entonces se abre una hoja con los 15 reportes en tres grupos; el actual tiene `aria-current="page"`; cada fila es un enlace a `/reportes/[tipo]`; «atrás» vuelve al reporte anterior.
- CA-E5-3 · Dada la computadora, entonces la lista de reportes está siempre visible a la izquierda (232 px) y no hay pestañas.
- CA-E5-4 · Dado un reporte que recibe `?cuentas=`, cuando elijo cuentas en la hoja y toco «Ver N cuentas», entonces la URL lleva `?cuentas=` y el botón dice qué está filtrado; «Quitar el filtro» la quita.
- CA-E5-5 · Dado Ritmo, Realidad, Hormiga, Suscripciones o Hallazgos, entonces no hay filtro de cuentas; en Ritmo, Suscripciones y Hallazgos tampoco hay Períodos; Hormiga navega con «Período anterior» y «Período siguiente» como enlaces (`?periodo=`).
- CA-E5-6 · Dada una tabla de más de 3 columnas en el teléfono, entonces desplaza en horizontal con la primera columna fija, el aviso «Desplazá para ver más columnas.» y el área desplazable alcanzable con Tab (`role="region"`, `tabindex="0"`, nombre). En computadora no desplaza.
- CA-E5-7 · Dado un gráfico en computadora, entonces sus textos no se agrandan con el ancho (máximo 560 px).
- CA-E5-8 · Dado Ritmo, entonces las cifras proyectadas vienen del servidor; la interfaz no las calcula.
- CA-E5-9 · Dado Flujo de efectivo filtrado a una cuenta que transfirió a otra, entonces aparece «Transferencias a otras cuentas» y saldo inicial + movimientos = saldo final.
- CA-E5-10 · Dado un reporte sin datos suficientes, entonces se ve el texto de 06 tal cual (FT-62 a FT-65).
- CA-E5-11 · Dado Reportes en el teléfono, entonces la barra inferior no marca ningún ítem; en computadora, la fila activa de la barra lateral es Reportes.

**Formatos e instituciones**
- CA-E5-12 · Dado Formato nuevo o editar en computadora, entonces el formulario y «Probar con un SMS» van en dos columnas.
- CA-E5-13 · Dado un SMS elegido y «Probar», entonces la tabla muestra cada grupo, lo que capturó y cómo se lee, con el resultado que devolvió el servidor.
- CA-E5-14 · Dado un patrón rechazado (`patron_invalido`, `banderas_no_permitidas`, `grupos_obligatorios`, `patron_lento`), entonces el error va en el campo Patrón con el texto del catálogo de 04 §7.10; `patron_lento` muestra el grado y describe la repetición que lo hace lento (`{cadena}` es esa descripción, no la cadena de ataque literal).
- CA-E5-15 · Dado un formato guardado, entonces la lista muestra el resultado y, si el servidor informa SMS sin reconocer de esa institución, cuántos son y «Verlos en la Bandeja»; si no informa el número, la frase va sin número. No hay «Reprocesar todos».
- CA-E5-16 · Dado Formatos, entonces no hay «Eliminar»; un formato se desactiva con el interruptor «Activo».
- CA-E5-17 · Dado Nueva institución o Renombrar, entonces es hoja en el teléfono y panel de 440 en computadora; un nombre repetido muestra «Ya hay una institución llamada {nombre}.» en el campo.
- CA-E5-17b · Dados `/ajustes/webhook`, `/ajustes/formatos` e `/ajustes/instituciones`, entonces son páginas [S] con «←», campana y barra inferior, y `/ajustes/webhook` no muestra ningún sufijo del token.

**Notificaciones, instalar y SMS**
- CA-E5-18 · Dado el permiso sin decidir, entonces Inicio muestra «Activá las notificaciones» entre Listo para asignar y «Necesita tu atención»; «Ahora no» la descarta en ese dispositivo; al aceptar, desaparece (CA-06.1, CA-06.2). La app nunca pide el permiso sola.
- CA-E5-19 · Dado el permiso denegado o un iPhone sin instalar, entonces `/ajustes/notificaciones` muestra los pasos de E5-16 (CA-06.4, CA-06.5) y este dispositivo no está en la lista.
- CA-E5-20 · Dado Android sin instalar, entonces arriba de Ajustes está «Instalar Finn en este dispositivo»; en iPhone sin instalar, los pasos de Safari; ya instalada, nada.
- CA-E5-21 · Dado «Generar un token nuevo» (`/ajustes/webhook/token`), entonces se confirma con el botón de peligro; después, el token se muestra completo una sola vez con «Copiar»; al salir, no queda en el cliente.
- CA-E5-22 · Dado Diagnóstico sin eventos, una búsqueda sin coincidencias o Respaldo sin respaldos, entonces se ven los vacíos de E5-19; «Quitar la búsqueda» limpia el campo.

### 7.4 · Etapa 6

**Carga y navegación**
- CA-E6-1 · Dada cualquier sección, detalle o flujo, entonces su `loading.tsx` tiene la estructura de la pantalla, sin ningún dato (números, nombres, colores de estado; el marco conserva sus insignias), sin animación, con `aria-busy="true"`, sus hijos ocultos a los lectores y «Cargando {pantalla}» anunciado una vez desde fuera de la región; un detalle usa el nombre genérico del segmento («Cargando categoría»).
- CA-E6-2 · Dado un enlace interno tocado, mientras la navegación está pendiente, entonces el enlace tiene `aria-busy="true"` y el punto de 8 px, y el marco muestra la franja de 3 px; con «reducir movimiento», ninguno se anima.
- CA-E6-3 · Dado un flujo corto, cuando lo abro, entonces la hoja (o el panel de 440) aparece de inmediato en esqueleto sobre la pantalla de origen.

**Sin conexión, errores y versión**
- CA-E6-4 · Dado `navigator.onLine === false`, entonces el marco muestra «Estás sin conexión», todo control de envío está deshabilitado con su motivo enlazado, y un enlace interno no navega y el aviso dice «Estás sin conexión. No se puede abrir esta pantalla.».
- CA-E6-5 · Dada una recarga sin conexión con un borrador en la pestaña, entonces `/sin-conexion` muestra «Lo que estabas registrando sigue guardado en esta pestaña.» sin ningún monto.
- CA-E6-6 · Para cada categoría de `ResultadoAccion` de 05 §4.7, en todo flujo corto y largo, el error se muestra con el patrón de `T3-errores-de-flujo` del tipo de flujo y conserva lo escrito.
- CA-E6-7 · Dado `conflicto_desactualizado` después de soltar sobre una categoría, entonces el flujo abre con el mensaje, el valor visto, el actual y «Usar el valor actual», y la categoría elegida sigue puesta.
- CA-E6-8 · Dado «Aprobar todos» en curso, entonces el botón dice «Aprobando…» con `aria-disabled` y no hay un avance numérico; con un rechazo, el resultado lista el movimiento con el motivo del servidor y «Ver transacción».
- CA-E6-9 · Dado `NO_ENCONTRADO` al enviar, entonces el flujo se cierra y la pantalla de destino muestra «Esto ya no existe.» en el lugar.
- CA-E6-10 · Dado `/registrar/transferencia` con una sola cuenta de efectivo, entonces la hoja explica que hacen falta dos y ofrece «Crear una cuenta».
- CA-E6-11 · Dada una versión nueva esperando o `version_nueva` al enviar, entonces se ve «Hay una versión nueva de Finn.» con «Recargar»; en un flujo largo, lo escrito vuelve después de recargar.
- CA-E6-12 · Dado el panel de notificaciones sin notificaciones, con todo leído o con un error de carga, entonces se ve el estado de `K1-navegacion` correspondiente; el error, dentro del panel, con su referencia e «Intentar de nuevo».

**Marco de 768 a 1023**
- CA-E6-13 · Dada una ventana de 768 a 1023 px, entonces se usa el marco de teléfono con el contenido centrado a 640 px y 24 px de relleno, los flujos de dos columnas en una y las hojas centradas a 640.

**Cuentas, impacto y resultados**
- CA-E6-14 · Dada la lista de Cuentas, entonces «Nueva cuenta» y «Ordenar las cuentas» están en el menú del encabezado (teléfono) o en «Más acciones» (computadora).
- CA-E6-15 · Dado el detalle de una cuenta con `?tipo=` y `?estado=` sin movimientos, entonces se ve «Sin resultados con estos filtros» y «Quitar filtros» lleva a la ruta sin esos parámetros.
- CA-E6-16 · Dados auto-asignar, cambiar el ciclo y eliminar una cuenta, entonces la pantalla llama a previsualizar con lo elegido y muestra la tarjeta K4 con lo que devolvió antes de confirmar; cambiar el ciclo es un flujo corto y `ciclo_sin_cambio` va en el campo.
- CA-E6-17 · Dada una acción de un toque con inversa en 05 §4.14, entonces su resultado queda en el lugar con la salida para revertir, sin tiempo límite; sin inversa, el resultado no la ofrece. La pantalla muestra los datos ya revalidados. Al revertir una propuesta de un reporte, el hallazgo reaparece (CA-67.3).

**Heredados**
- CA-E6-18 · Ningún enlace ni botón mide menos de 44 px de alto; la barra fija de los flujos va a 20 px de los bordes.
- CA-E6-19 · La barra lateral tiene filas de 44 px y el símbolo de la marca.
- CA-E6-20 · Los textos de 06 §5.6 son los aprobados en todas las pantallas.
- CA-E6-21 · Los filtros de Presupuesto y los Períodos de Reportes son enlaces con `aria-current`; todo texto lleva `data-rol`; los montos en botones usan cifras tabulares.
- CA-E6-22 · Categorías dibuja una porción por categoría hasta 8; con más, las que siguen van en «Otras» con rayado, y la tabla lista todas con porcentajes que suman 100 %. Tendencia no muestra «Asignado».

### 7.5 · Cierre

- CA-C-1 · Dada la semilla `estado-a7` sembrada, entonces la Bandeja y Revisar movimiento coinciden con sus PNG. Dada la semilla más el recorrido 4.2 hasta el paso 3 (SUPER SELECTOS aprobado), entonces Inicio, Presupuesto, el detalle de Restaurantes, Registrar gasto, Cuentas, Actividad y Gasto semanal muestran los números de `DATOS-EJEMPLO.md` §2 a §5 y coinciden con sus PNG.
- CA-C-2 · Dada la semilla, después del paso 1 del recorrido 4.2 la insignia dice 3 por revisar en todas las pantallas; después del paso 3 dice 2 en todas (CT-07). Las referencias muestran 3 en la Bandeja y 2 en las demás porque dibujan esos dos momentos (`DATOS-EJEMPLO.md` §1).
- CA-C-3 · Dado el detalle de Listo para asignar, entonces su composición suma exactamente Listo para asignar (04 §6.4) y el historial excluye los adelantos (B-4). La línea «arrastre» del detalle no está en `DetalleLpaDto` (04 §6.4): es una pregunta abierta del cierre (revisión, pregunta 7). Hasta que el dueño la responda, no la agregues al DTO ni la calcules por tu cuenta: avisame.
- CA-C-4 · Dado el código, entonces los valores decorativos de C-18 viven en un solo archivo de tokens decorativos y ningún texto se apoya en ellos para su contraste.

### 7.6 · Para todo estado

- CA-T-1 · Para cada estado de `pantallas/`, en sus variantes (teléfono claro, teléfono oscuro, computadora y, donde la hay, tableta), la app coincide con su PNG. Método: captura de la app en el mismo ancho y tema, en el momento que dice `DATOS-EJEMPLO.md` §1, comparada con el PNG por diferencia de píxeles con Playwright (`toHaveScreenshot`), con un umbral de 0.2 por píxel y a lo sumo 1 % de píxeles distintos; textos y montos se comparan además por su `data-rol`, sin tolerancia. Un número que difiere por la semilla se informa, no se ajusta.

## 8 · Cómo entregarme el trabajo

1. Por bloque de la sección 5, una captura de la app al lado del PNG de referencia, en las variantes que toca.
2. La lista de criterios con su resultado y la prueba que cubre cada uno (en el título de la prueba, como pide 07 §2.1).
3. Si algo obliga a cambiar `04`, `05` o `06` más allá de lo aplicado en la sección 6, preparame el cambio sin aplicarlo. Lo apruebo yo.
4. Lo que no pudiste implementar tal cual, con el motivo. No lo resuelvas en silencio.
