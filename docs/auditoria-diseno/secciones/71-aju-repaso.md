# Auditoría de diseño · AJU (Ajustes), repaso completo de la comparación

Motivo: la verificación independiente (`verificacion/CRUCE.md`, V-02 a V-05) encontró en Ajustes más de 3 diferencias que `70-mas-aju.md` no tenía; por regla se repitió la comparación completa de la sección. Se miró con Read cada captura de `capturas/ajustes__*` y `ajustes-*__*` en `telefono-claro` y `computadora-claro` junto al PNG de referencia (`02-referencias/entrega-2/pantallas/11-ajustes/` y `entrega-3/pantallas/16-salir/`), y en `telefono-oscuro` el índice, Seguridad y Notificaciones (más Apariencia oscuro). Se usaron `medidas/*.json`, `analisis/*.md` y el HTML de referencia (`seguridad__telefono-claro.html`, `exportar__…`, `notificaciones__…`) para confirmar espaciados y colores.
Ids nuevos desde `AJU-30`. No se repite nada de AJU-01…24, GLO-20…34, GLO-101…131 ni V-02…V-05.

## Hallazgos nuevos

### AJU-30 · Bloques de Seguridad a 10 px en vez de 24 — Seguridad · un factor, dos factores, inscripción sin terminar · teléfono y computadora · media
- **Se ve:** `capturas/ajustes-seguridad__dos-factores__telefono-claro.png`: la tarjeta de factores termina en y=249 y «Agregar un factor de respaldo» empieza en y=259 (10 px); la tarjeta de sesiones y «Cerrar las otras sesiones» también a 10 px. En computadora (`…__computadora-claro.png`) lo mismo: 10 px entre tarjeta y botón.
- **Debería:** `02-referencias/entrega-2/pantallas/11-ajustes/seguridad__telefono-claro.html`: contenedor `display:flex; flex-direction:column; gap:24px; padding:4px 20px 0`, y 10 px solo entre el rótulo de sección y su tarjeta. En el PNG la tarjeta termina en y=305 y el botón empieza en y=329 (24 px); igual en `seguridad__computadora-claro.png` (339 → 363) y en el estado de un factor (`entrega-3/pantallas/16-salir/seguridad-factor-unico__telefono-claro.png`).
- **Arreglo:** en `apps/web/src/app/(finn)/ajustes/seguridad/page.tsx`, `lista-factores.tsx` y `sesiones.tsx`, separar tarjeta y botón con el token de espacio de 24 px del juego (no valores sueltos).
- **Cómo verificar:** en las medidas, la distancia entre el borde inferior de cada tarjeta y el botón siguiente es 24 ± 2 px.

### AJU-31 · «Quitar» de Seguridad a 24 px del borde de la tarjeta, no a 16 — Seguridad · todas · teléfono y computadora · baja
- **Se ve:** `ajustes-seguridad__dos-factores__telefono-claro.png`: el texto «Quitar» termina en x=346 con la tarjeta hasta x=370 (24 px). En computadora termina en 896 con la tarjeta en 920.
- **Debería:** `seguridad__telefono-claro.png` y `seguridad__computadora-claro.png`: «Quitar» a 16 px del borde (padding 12 16 de la fila; el tocable de 44 de alto crece hacia dentro, no hacia afuera).
- **Arreglo:** `apps/web/src/app/(finn)/ajustes/seguridad/lista-factores.tsx:56-62`: quitar el relleno horizontal extra del enlace «Quitar» (que el área de 44 use alto, no margen).
- **Cómo verificar:** `medidas/ajustes-seguridad__dos-factores__telefono-claro.json`: x + ancho del texto «Quitar» = ancho de tarjeta − 16.

### AJU-32 · Seguridad y Notificaciones de Ajustes, en computadora, sin «← Ajustes» — Seguridad y Notificaciones · computadora · alta
- **Se ve:** `capturas/ajustes-seguridad__dos-factores__computadora-claro.png` y `ajustes-notificaciones__concedido__computadora-claro.png`: el título va solo a la izquierda, sin enlace de regreso (`analisis/…`: `volver=""`). En teléfono sí hay flecha «Volver a Ajustes» (`volver="Volver a Ajustes"`).
- **Debería:** `…/11-ajustes/seguridad__computadora-claro.png` y `notificaciones__computadora-claro.png`: enlace «← Ajustes» (14 px, gris) encima del título, más campana a la derecha. DECISIONES «Marco»: pantalla hija = flecha/enlace «Volver a <padre>».
- **Arreglo:** el marco de pantalla hija en computadora (`apps/web/src/componentes/marco/marco.tsx`, `componentes/navegacion/volver-en-titulo.tsx`) debe mostrar el enlace sobre el título; vale también para las demás subpáginas cuando AJU-06 las pase a pantalla hija.
- **Cómo verificar:** a 1440 px el analizador marca `volver="Volver a Ajustes"` en Seguridad y Notificaciones.

### AJU-33 · «Quitar» con un factor: aviso de problema y enlaces subrayados — Seguridad · quitar-un-factor · teléfono · media
- **Se ve:** `capturas/ajustes-seguridad__quitar-un-factor__telefono-claro.png`: la frase «Agregá otro factor antes de quitar este.» va en aviso de problema (fondo `--problema-fondo`, octógono con raya), y debajo dos enlaces subrayados «Agregar un factor de respaldo» y «Volver a Seguridad».
- **Debería:** la misma frase es un aviso de **advertencia** (`--advertencia-fondo`, triángulo) en `entrega-3/pantallas/16-salir/seguridad-factor-unico__telefono-claro.png`; las acciones son botones tonales. Regla 2 de DECISIONES: no es un error, es un impedimento previo.
- **Arreglo:** AJU-15 hace desaparecer esta pantalla; mientras exista, `flujos/ajustes-seguridad-factores-quitar/` debe usar `AvisoEnLinea estado="advertencia"` y `Boton` tonal. El mismo aviso, con advertencia, es el de AJU-14.
- **Cómo verificar:** el aviso lleva tokens `advertencia` y triángulo; ningún enlace subrayado de acción.

### AJU-34 · Diagnóstico: otro orden y bloques que el diseño no tiene — Diagnóstico · todas · teléfono y computadora · media
- **Se ve:** `capturas/ajustes-diagnostico__con-referencia__telefono-claro.png`: intro «Los últimos eventos del sistema…», sección «TAREAS DEL DÍA» con texto y el botón «Ejecutar tareas ahora» arriba, luego «ÚLTIMOS EVENTOS», buscador con etiqueta y ayuda «Pegá la referencia que te mostró el error.» y los eventos al final.
- **Debería:** `…/11-ajustes/diagnostico__telefono-claro.png`: primero el buscador (con lupa, sin etiqueta, sin ayuda), después el resultado de la búsqueda, «ÚLTIMOS EVENTOS» en una tarjeta y «Ejecutar tareas ahora» tonal con ícono **al final**; sin intro ni sección «Tareas del día».
- **Arreglo:** `apps/web/src/app/(finn)/ajustes/diagnostico/panel.tsx` y `apps/web/src/textos/` de diagnóstico: reordenar buscador, eventos y botón; quitar intro, «Tareas del día» y la ayuda, o llevarlos a CH. (AJU-21 cubre lupa, «Opcional» e indicador; no el orden.)
- **Cómo verificar:** el orden en la captura coincide con la referencia y no quedan los textos sobrantes.

### AJU-35 · Diagnóstico: el evento muestra el código interno y fecha absoluta — Diagnóstico · con-referencia · teléfono y computadora · media
- **Se ve:** `ajustes-diagnostico__con-referencia__telefono-claro.png`: «Aviso · respaldo · 17/10/2026 00:00» y `token_invalido` (identificador interno, snake_case), sin tarjeta.
- **Debería:** `diagnostico__telefono-claro.png`: título legible («Error al procesar SMS», «Tarea diaria»), subtítulo «BDJ-4K2Q · ayer 21:40 · Banco Agrícola» / «Hoy 00:12 · 2 programadas registradas» en 14 px secundario, dentro de una tarjeta de filas.
- **Arreglo:** `ajustes/diagnostico/panel.tsx` y la consulta de eventos: textos legibles por tipo de evento (en `apps/web/src/textos/`), fecha relativa como en el resto de la app; nunca mostrar el código crudo.
- **Cómo verificar:** ningún texto con guion bajo visible; cada evento con título en español y hora relativa.

### AJU-36 · Diagnóstico: el botón de limpiar el buscador es una «✕» de texto — Diagnóstico · sin-resultados · teléfono · baja
- **Se ve:** `ajustes-diagnostico__sin-resultados__telefono-claro.png`: «✕» pesada azul a la derecha del campo.
- **Debería:** ícono `x` del juego (trazo de 1.5, gris) como en `diagnostico__telefono-claro.png` (la «×» de la derecha).
- **Arreglo:** `ajustes/diagnostico/panel.tsx`: usar `Icono x` dentro de un botón de 44 × 44 con etiqueta «Limpiar búsqueda».
- **Cómo verificar:** mismo ícono y color que en la referencia; tocable ≥ 44.

### AJU-37 · Notificaciones de Ajustes: la fila del dispositivo no sigue el patrón — Notificaciones · concedido · teléfono y computadora · baja
- **Se ve:** `ajustes-notificaciones__concedido__telefono-claro.png`: sin disco con campana; segunda línea «Renovada el 15/10/2026 10:00» y «· Este dispositivo» pegado al nombre.
- **Debería:** `…/11-ajustes/notificaciones__telefono-claro.png`: disco de 40 con ícono `bell`, título en 600 y «Activado el 03/10» (dd/mm, sin hora ni año); «Este teléfono» como nombre. AJU-12 pide la lista en tarjeta pero no el ícono ni el formato de fecha.
- **Arreglo:** `ajustes/notificaciones/panel.tsx` y `textos/notificaciones.ts`.
- **Cómo verificar:** cada dispositivo con ícono de campana y fecha `dd/mm`.

### AJU-38 · Apariencia: la fila «Sistema» sin relleno y con un subtítulo que el diseño no tiene — Apariencia · sistema, claro, oscuro · todas · media
- **Se ve:** `ajustes-apariencia__sistema__telefono-claro.png`: las opciones son tarjetas de 44 px separadas 8 px; «Sistema» ocupa dos líneas (título + «Sigue el tema de tu dispositivo.») dentro de esos 44 px, con el texto pegado al borde superior e inferior (`medidas`: «Sistema» y=96 h=44, subtítulo y=120).
- **Debería:** `…/11-ajustes/apariencia__telefono-claro.png`: filas de 56 px con 22 px de radio de selección, sin subtítulo, en una sola tarjeta.
- **Arreglo:** `ajustes/apariencia/panel.tsx` y `textos/ajustes-apariencia.ts` (quitar el subtítulo; fila con `min-h` del juego y relleno vertical).
- **Cómo verificar:** filas de 56 px, texto centrado, una línea.

### AJU-39 · Formatos (nuevo y detalle): casillas nativas del navegador — Formatos · nuevo y detalle · teléfono · media
- **Se ve:** `capturas/ajustes-formatos__nuevo__telefono-claro.png` y `…__detalle__…`: «Formatos de fecha» y «Activo» con casillas cuadradas de 44 px, azul puro del navegador (fuera de los tokens) y pegadas entre sí (4 px).
- **Debería:** casilla del juego (K2 `casilla-interruptor-opciones`): redonda de 44 con check en círculo y color `--accion`, 8 px de separación. No hay referencia de la pantalla (FALTANTES formato-nuevo); el componente sí.
- **Arreglo:** `ajustes/formatos/nuevo/page.tsx`, `formatos/[formatoId]/page.tsx` y el componente compartido de casilla (candidato global ya listado: casilla nativa).
- **Cómo verificar:** sin `accent-color` del navegador; colores de token; separación ≥ 8 px.

### AJU-40 · Exportar: texto de introducción en gris secundario — Exportar · principal · baja
- **Se ve:** `ajustes-exportar__principal__telefono-claro.png`: «Descargá una copia de tus datos…» en `#474e58` (`texto-secundario`) y con otro texto.
- **Debería:** `exportar__telefono-claro.html`: el párrafo introductorio «Descargá tus transacciones y el presupuesto. El archivo se arma en el momento.» en `cuerpo-pequeno` con `var(--texto)`.
- **Arreglo:** `apps/web/src/textos/ajustes-exportar.ts` y `ajustes/exportar/page.tsx`.
- **Cómo verificar:** texto y color igual a la referencia.

## Correcciones

- **AJU-06** (y la fila (c) de «Decisiones comprobadas»): dice que Seguridad y Notificaciones «sí llevan flecha + campana + barra». Es verdad solo en teléfono; en computadora no llevan «← Ajustes» (`analisis/ajustes-seguridad__dos-factores.md:7`, `ajustes-notificaciones__concedido.md:7`: `volver=""`). Cambiar a «solo en teléfono» y remitir a AJU-32.
- **AJU-05:** quitar «y sin campana pegada al borde»: en las dos imágenes la campana está en x≈1370 con el mismo círculo tonal; no hay diferencia. Queda solo el ancho (624 contra 720).
- **Inventario, `ajustes-seguridad__agregar-factor-codigo-malo`** (veredicto AJU-17): la captura solo tiene el código `000000` escrito; el caso (`tools/auditoria/casos/70-mas-aju.cap.ts:939-942`) hace `fill` y espera sin tocar «Confirmar», y no hay mensaje de error ni `role="alert"` (`medidas/…codigo-malo…json`: alert=0). No muestra el estado de error: pasar a «no capturado el error» y recapturar tocando «Confirmar». AJU-17 sigue valiendo para el resto.
- **GLO-31** (`secciones/01-glo-consolidado.md`): lista `ajustes-seguridad-factores-quitar` entre los destructivos con botón azul, pero `capturas/ajustes-seguridad__quitar-factor__telefono-claro.png` ya usa el rojo de peligro. Quitarlo de esa lista (AJU-23 sí lo dice bien).
- **AJU-08:** en el estado `token-generado` el aviso va en advertencia («Copiá este token ahora: no lo vas a poder ver de nuevo.»), no en «Conectado»; agregar que la referencia no tiene ese estado (el diseño ya está en el aviso de «Conectado» y la tarjeta enmascarada) y que sus dos botones «Copiar» (token y URL) también van sin ícono.

## Repasado

Capturas distintas repasadas: 41 (34 con Read directo en claro y computadora; las marcadas † se repasaron con medidas y análisis, sin abrir la imagen, porque son iguales a otra ya mirada).

| id de captura | variantes miradas | resultado |
|---|---|---|
| ajustes__indice | telefono-claro, computadora-claro, telefono-oscuro | sin diferencias nuevas (AJU-01…05, GLO-103/107) |
| ajustes__indice-primeros-pasos-ocultos | telefono-claro | sin diferencias nuevas |
| ajustes__indice-sin-cuentas | telefono-claro | sin diferencias nuevas |
| ajustes__indice-respaldo-al-dia † / -atrasado † | medidas y análisis | sin diferencias nuevas (AJU-04) |
| ajustes__cargando † / ajustes__error † | medidas | sin diferencias nuevas (proxies del marco, GLO-32) |
| ajustes-ciclo__principal | telefono-claro | sin diferencias nuevas (AJU-06, 07; MAS-118) |
| ajustes-ciclo__aviso | telefono-claro, computadora-claro | sin diferencias nuevas (V-02, AJU-07) |
| ajustes-conectar-sms__sin-token | telefono-claro | sin diferencias nuevas (AJU-08) |
| ajustes-conectar-sms__token-generado | telefono-claro | sin diferencias nuevas; ver Correcciones (AJU-08) |
| ajustes-conectar-sms__con-token | telefono-claro, computadora-claro | sin diferencias nuevas (AJU-06, 08) |
| ajustes-conectar-sms__cambiar | telefono-claro | sin diferencias nuevas (sin diseño; «Cancelar» como texto es GLO-26) |
| ajustes-formatos__lista | telefono-claro | sin diferencias nuevas (AJU-06, 10) |
| ajustes-formatos__detalle / __nuevo | telefono-claro | AJU-39 |
| ajustes-instituciones__lista | telefono-claro | sin diferencias nuevas (AJU-11) |
| ajustes-instituciones__detalle † / __nueva † | medidas y análisis | sin diferencias nuevas (sin diseño) |
| ajustes-instituciones__nueva-repetida | telefono-claro | sin diferencias nuevas (error con tres señales; el aviso «Revisá los campos marcados.» duplica el error del campo, sin diseño) |
| ajustes-notificaciones__concedido | telefono-claro, computadora-claro, telefono-oscuro | AJU-32, AJU-37 (más AJU-12 y V-03) |
| ajustes-notificaciones__sin-pedir | telefono-claro | sin diferencias nuevas (sin diseño) |
| ajustes-notificaciones__denegado | telefono-claro | sin diferencias nuevas (advertencia con tres señales) |
| ajustes-seguridad__un-factor | telefono-claro (+ referencia entrega-3) | AJU-30 (más AJU-14, 16, 18) |
| ajustes-seguridad__dos-factores | telefono-claro, computadora-claro, telefono-oscuro | AJU-30, 31, 32 |
| ajustes-seguridad__inscripcion-sin-terminar | telefono-claro | sin diferencias nuevas (AJU-30, 31 aplican) |
| ajustes-seguridad__quitar-un-factor | telefono-claro | AJU-33 |
| ajustes-seguridad__quitar-factor | telefono-claro | sin diferencias nuevas (AJU-23; ver Corrección GLO-31) |
| ajustes-seguridad__agregar-factor | telefono-claro | sin diferencias nuevas (AJU-17) |
| ajustes-seguridad__agregar-factor-codigo-malo | telefono-claro | sin diferencias nuevas; el error no se capturó (ver Correcciones) |
| ajustes-exportar__principal | telefono-claro | AJU-40 (más AJU-19, V-04) |
| ajustes-respaldo__sin-respaldo | telefono-claro | sin diferencias nuevas (AJU-20, V-05) |
| ajustes-respaldo__al-dia | telefono-claro | sin diferencias nuevas |
| ajustes-respaldo__atrasado | telefono-claro | sin diferencias nuevas (AJU-20, V-05) |
| ajustes-diagnostico__con-referencia | telefono-claro, computadora-claro | AJU-34, 35 |
| ajustes-diagnostico__sin-eventos | telefono-claro | AJU-34 |
| ajustes-diagnostico__sin-resultados | telefono-claro | AJU-36 |
| ajustes-diagnostico__tareas-ejecutadas | telefono-claro | AJU-34; la captura muestra «Ejecutando…» y no el resultado, a recapturar tras el fin de la acción (sin verificar) |
| ajustes-apariencia__sistema | telefono-claro | AJU-38 |
| ajustes-apariencia__claro † | medidas | sin diferencias nuevas (igual a sistema) |
| ajustes-apariencia__oscuro | telefono-oscuro | AJU-38; colores de tema oscuro bien (radio con `--accion` del oscuro) |

## Candidatos a global

- Componente de casilla de verificación nativa del navegador (azul puro, 44 px) en formularios de Ajustes: ya en la lista de la sección; ahora con Formatos como caso (AJU-39).
- «← Ajustes» / «Volver a <padre>» como enlace sobre el título en computadora para toda pantalla hija (AJU-32).
