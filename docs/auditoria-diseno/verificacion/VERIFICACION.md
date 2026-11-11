# Verificación independiente de diseño · 30 pantallas

Comparación de capturas de la app contra las referencias aprobadas (DECISIONES > tokens.css > PNG/HTML > PANTALLAS.md). Variantes revisadas: telefono-claro y computadora-claro (en varias pantallas la computadora se dedujo de la misma estructura por falta de tiempo); telefono-oscuro solo en acceso__ingresar y acceso__verificar-varios-factores.

## acceso__ingresar
- [alta] Sin tarjeta blanca en computadora: formulario de 400 px pegado arriba (y=64) sobre el lienzo → tarjeta blanca de 420 px, radio grande y sombra, centrada en vertical y horizontal (computadora-claro; ingresar__computadora-claro.png)
- [alta] Aparece enlace "Mostrar contraseña" (texto azul centrado, sin subrayado) entre el campo y el botón → la referencia no lo tiene; el botón va pegado bajo el campo (16 px) (telefono-claro, computadora-claro; ingresar__telefono-claro.png)
- [media] Texto de ayuda extra "Finn no tiene registro ni recuperación de contraseña…" bajo el botón → no existe en la referencia (telefono-claro)
- [media] Título "INGRESAR" → el diseño dice "INGRESÁ" (voseo, DECISIONES regla 4) (todas)
- [media] Logo: marca F dentro de un cuadrado oscuro de 32 px (claro) o claro (oscuro) → la referencia usa la F apilada sola, sin cuadrado, de unos 29×32 px, y "FINN" más grande (telefono 2x: ~185 px de ancho vs ~70) (todas)
- [baja] Campos más bajos y espaciado distinto: etiqueta→campo 14 px, campos de 48 px; la referencia usa campos de 46 px con 14 px de separación entre bloques, botón a 16 px del campo (telefono-claro; el botón queda a y=810/2=405 vs 350)
## acceso__credenciales-invalidas
- [alta] El campo Contraseña no toma el borde de problema (2 px `--problema-borde`, anillo completo) → la referencia lo marca con contorno naranja completo (telefono-claro; credenciales-invalidas__telefono-claro.png)
- [media] Mismas diferencias de marco que ingresar: "Mostrar contraseña", texto de ayuda, título "INGRESAR", logo con cuadrado, y en computadora sin tarjeta
- [baja] Contraseña muestra 20 puntos (dato) y el aviso del problema tiene el texto 1 px más pequeño y sin sombra; sin cambio de composición
## acceso__demasiados-intentos
- [alta] El botón "Ingresar" queda activo (azul) → el diseño lo muestra deshabilitado (fondo gris `--superficie-hundida`, texto atenuado) (telefono-claro; demasiados-intentos__telefono-claro.png)
- [media] Mismas diferencias que ingresar: "Mostrar contraseña", texto de ayuda, "INGRESAR" por "INGRESÁ", logo con cuadrado, sin tarjeta en computadora
## acceso__verificar-vacio
- [crítica] Campo único "Código" de 48 px de alto → DECISIONES (Código de verificación TOTP): 6 casillas de 44 × 52 (telefono-claro; verificar__telefono-claro.png)
- [media] Título "VERIFICÁ TU CÓDIGO" → la referencia dice "CÓDIGO DE VERIFICACIÓN"; la descripción dice "que muestra tu app de autenticación" vs "de tu app de autenticación" (telefono-claro)
- [media] Etiqueta "Código" visible sobre el campo → la referencia no lleva etiqueta; las casillas van directamente bajo la descripción (telefono-claro)
- [media] Logo con cuadrado oscuro y sin tarjeta en computadora (como en ingresar)
## acceso__codigo-incorrecto
- [crítica] Campo único con aro de foco doble azul → 6 casillas con borde inferior de `--problema-borde` (telefono-claro; codigo-incorrecto__telefono-claro.png)
- [alta] El error se muestra como aviso (tarjeta naranja con relleno) arriba del campo, a ancho completo → el diseño lo muestra como mensaje en línea (glifo + texto en `--problema-texto`) debajo de las casillas, sin fondo (telefono-claro)
- [media] Título y logo distintos, como en verificar-vacio
## acceso__codigo-vencido
- [crítica] Campo único → 6 casillas con el borde de problema (telefono-claro; codigo-vencido__telefono-claro.png)
- [alta] Error como tarjeta rellena arriba del campo → mensaje en línea debajo de las casillas (telefono-claro)
- [media] Título "VERIFICÁ TU CÓDIGO" vs "CÓDIGO DE VERIFICACIÓN"; logo con cuadrado
## acceso__verificar-varios-factores
- [alta] Selector de factor como lista de radios (dos filas blancas de 44 px con círculo) → la referencia usa un selector desplegable de una fila con ícono de candado, nombre "Autenticador" y chevron (telefono-claro, telefono-oscuro; verificar-varios-factores__telefono-claro.png)
- [crítica] Campo único de código → 6 casillas de 44 × 52 (DECISIONES) (todas)
- [media] Título "VERIFICÁ TU CÓDIGO" vs "CÓDIGO DE VERIFICACIÓN"; logo con cuadrado
## acceso__inscribir
- [crítica] Campo único "Código" y botón "Confirmar" → 6 casillas (DECISIONES) y el botón "Verificar y entrar" (referencia) (telefono-claro, computadora-claro)
- [alta] El código QR de 157 px, sin marco, pegado al fondo → el QR va en una tarjeta blanca de 182 px con radio y sombra, centrado (telefono-claro; inscribir__telefono-claro.png)
- [alta] El secreto se muestra como etiqueta "Secreto" y texto monoespaciado sin tarjeta → tarjeta blanca con sombra con la clave en mayúsculas con espaciado, en dos líneas, y el botón tonal "Copiar" con ícono de copia; aquí "Copiar" no lleva ícono (telefono-claro)
- [media] Título en la app es más grande (≈ 56 px de alto en 2x, "PROTEGÉ TU CUENTA") → la referencia lo muestra a la mitad (≈ 40 px) con peso 700 (telefono-claro)
- [media] Texto explicativo en 3 líneas con más palabras ("…código QR… guardarlo en tu gestor de contraseñas") → "Escaneá el código con tu app de autenticación o copiá la clave." en 2 líneas
- [alta] Computadora: sin tarjeta blanca centrada de 420 px (computadora-claro)
## acceso__inscribir-cierre
- [alta] Falta el aviso de éxito "Factor verificado · Listo: tu autenticador quedó inscrito." (tarjeta `--positivo-fondo` con glifo de check) → la referencia lo trae arriba (telefono-claro; inscribir-cierre__telefono-claro.png)
- [alta] Título grande "TU CUENTA QUEDÓ PROTEGIDA" → no hay título; la referencia va del logo al aviso y a una línea de texto
- [alta] "Seguir" como enlace de texto → el diseño pide botón primario "Seguir a Finn" debajo del botón tonal (telefono-claro)
- [media] Texto "Te recomendamos agregar un factor de respaldo: si perdés tu teléfono, lo vas a necesitar para entrar." → "Te conviene agregar un factor de respaldo por si perdés el teléfono." (textos distintos)
## ajustes__indice
- [alta] Falta la tarjeta "Primeros pasos: 2 de 3" con el botón tonal "Mostrar en Inicio" arriba de la lista (telefono-claro, computadora-claro; ajustes-indice__telefono-claro.png)
- [alta] Falta la tarjeta propia "Salir" (ícono logout, subtítulo "{correo} · en este dispositivo") debajo de la lista (telefono-claro, computadora-claro; DECISIONES Entrega 3 "Salir")
- [alta] Computadora: la barra lateral no trae al pie el correo de la sesión ni "Salir" bajo una línea `--borde-sutil` (computadora-claro; DECISIONES Entrega 3)
- [alta] Las filas no llevan subtítulo de estado ("Empieza el día 21", "7 activos", "2 factores · 1 sesión", "Según el sistema"…); solo Respaldo muestra uno → todas las filas llevan título y subtítulo (todas)
- [alta] Respaldo atrasado solo con color naranja → advertencia con glifo de triángulo y chip amarillo `--advertencia-fondo`, a la derecha (regla 2: color + glifo + texto) (telefono-claro, computadora-claro)
- [media] Título "Ciclo de los períodos" → el diseño dice "Ciclo"; "Exportar tus datos" → "Exportar" (textos)
- [media] Campana sin contador "2" ni el punto azul; en la barra inferior y la barra lateral faltan los contadores de Bandeja (3) y Notificaciones (2) (todas)
- [media] Íconos: Diagnóstico usa el pulso (igual que Actividad) → ícono de información `i` en círculo; en la barra lateral "Ajustes" usa el sol → engranaje `gear` de 8 dientes (DECISIONES Entrega 3 Íconos) (telefono-claro, computadora-claro)
- [media] Computadora: lista de 624 px de ancho y filas de 65 px → referencia 720 px con filas de 71 px; título a la izquierda del contenido sin margen coherente; ítems de "Más" en la barra lateral de 12 px con un peso distinto al de las secciones principales (computadora-claro)
## ajustes-seguridad__dos-factores
- [alta] "Salir" sigue como enlace de texto bajo "Cerrar las otras sesiones" → ya no existe en Seguridad: "Salir" vive en el marco y en Ajustes (DECISIONES Entrega 3 "Salir") (telefono-claro; seguridad__telefono-claro.png)
- [media] El botón tonal "Agregar un factor de respaldo" no lleva el glifo "+" a la izquierda (telefono-claro)
- [media] La fila "Este dispositivo" lleva un disco con ícono de persona → la referencia no tiene disco ni ícono y alinea el texto a 16 px (telefono-claro)
- [media] La campana no lleva contador y la barra inferior no tiene el aro azul ni el contador 3 de Bandeja (telefono-claro)
## ajustes-seguridad__un-factor
- [crítica] Falta el aviso de advertencia (`--advertencia-fondo`, triángulo) "Agregá otro factor antes de quitar este." debajo del factor (telefono-claro; DECISIONES "Un solo factor"; seguridad-factor-unico__telefono-claro.png)
- [alta] "Salir" como enlace de texto → sin el enlace
- [media] Botón tonal sin glifo "+"; "Este dispositivo" con disco que la referencia no tiene
## ajustes-ciclo__aviso
- [crítica] La pantalla es un paso de confirmación aparte (tarjeta "Hoy empieza el día / Vigencia futura", sección "ANTES DE CONFIRMAR", botones "Volver a editar" y "Cambiar el ciclo") → el diseño es un solo formulario: tarjeta de estado, selector "Nuevo día de inicio" (desplegable con chevron) y aviso informativo "Antes de confirmar" dentro de la misma pantalla (telefono-claro; ciclo__telefono-claro.png)
- [alta] Aviso de transición en amarillo con triángulo (advertencia) y dos tarjetas separadas → aviso informativo azul (`--informacion-fondo`, glifo `i`, título "Antes de confirmar") con el texto del período en la misma tarjeta (telefono-claro)
- [alta] Flecha de la barra superior es "×" (cerrar) y no hay barra inferior ni campana → la referencia usa la flecha "←" Volver a Ajustes, campana y barra inferior (el diseño trata Ciclo como subpágina; si es flujo que termina en Confirmar, DECISIONES pide sin campana ni barra: queda ambiguo y la app mezcla) (telefono-claro)
- [media] El botón "Cambiar el ciclo" y "Volver a editar" lado a lado a 170 px → no existe en la referencia
## ajustes-conectar-sms__con-token
- [crítica] No se muestra el token enmascarado en tarjeta ("fn_live_••••7Q2K" con botón "Copiar" e ícono y la nota "Se muestra completo una sola vez, al generarlo.") → la app solo dice "Token generado el 10/11/2026 22:32." sin tarjeta de token (telefono-claro; conectar-sms__telefono-claro.png)
- [alta] Se agrega una sección larga "CÓMO CONFIGURAR MACRODROID" y "PROBÁ EN EL TELÉFONO" con 8 pares etiqueta/valor y texto sin tarjetas → no existen en la referencia (pantalla más larga que el pliegue)
- [alta] El aviso "Conectado" no dice "El último SMS llegó hoy a las 12:41"; la tarjeta es de una línea y sin el dato (telefono-claro)
- [media] Botón tonal "Cambiar token" sin ícono de recarga ("Generar un token nuevo" en la referencia) (telefono-claro)
- [alta] Flecha "×" en vez de "←", sin campana ni barra inferior (telefono-claro)
- [media] Falta el título de sección "TOKEN DE MACRODROID" (telefono-claro)
## ajustes-formatos__lista
- [alta] Filas sin chevron (›) a la derecha y sin datos de uso ("412 usos · último hoy") → filas con chevron y uso; los inactivos con chip "Inactivo" y glifo (telefono-claro; formatos__telefono-claro.png)
- [media] "Inactivo" va como texto en la línea de detalle, sin glifo ni chip, con la fila entera en gris → chip con círculo punteado + texto (regla 2) (telefono-claro)
- [media] Botón tonal "Nuevo formato" sin el "+" (telefono-claro)
- [media] "Instituciones" como enlace subrayado de 20 px → la referencia lo muestra azul, negrita, sin subrayado (telefono-claro)
- [media] Texto introductorio "Cómo Finn lee los SMS de cada banco…" que no existe en la referencia
- [alta] "×" en lugar de "←" Volver a Ajustes; sin campana ni barra inferior (telefono-claro)
## ajustes-notificaciones__concedido
- [crítica] Falta la tarjeta con el interruptor "Notificaciones en este dispositivo" y "Permiso del navegador: concedido." → la app solo tiene la frase "Las notificaciones están activas en este dispositivo." (telefono-claro; notificaciones__telefono-claro.png)
- [alta] El dispositivo se muestra con el user agent completo ("Mozilla/5.0 (Windows NT 10.0…") en 4 líneas, sin tarjeta ni disco → fila con disco con campana y nombre corto "Este teléfono" + "Activado el 03/10" en tarjeta (telefono-claro)
- [alta] "Quitar" como botón tonal azul de 85 px → texto rojo `--peligro-texto` sin fondo, y no aparece para el dispositivo actual (telefono-claro)
- [media] Falta el aviso gris con círculo punteado ("Si el permiso está denegado…") (telefono-claro)
- [media] Título de sección "DISPOSITIVOS CON NOTIFICACIONES" → "DISPOSITIVOS"
- [baja] La campana aparece (correcto) pero sin el contador
## ajustes-exportar__principal
- [alta] Estructura de texto con secciones "TODOS TUS DATOS (JSON)" y "TUS TRANSACCIONES (CSV)" con botones tonales de ancho completo "Descargar JSON/CSV" → tarjeta única con dos filas (disco con ícono, título corto "Todo en JSON" / "Transacciones en CSV", subtítulo, botón tonal "Descargar" a la derecha) (telefono-claro; exportar__telefono-claro.png)
- [alta] "×" en vez de "←" Volver a Ajustes; sin campana ni barra inferior (telefono-claro)
- [media] Título "EXPORTAR TUS DATOS" vs "EXPORTAR"; texto de advertencia final "El archivo trae tus datos reales…" y el texto de CSV "los negativos con guion" (DECISIONES regla 3 pide U+2212 en montos) no están en la referencia (telefono-claro)
- [baja] Descripción pegada al título (12 px) → la referencia deja 32 px (telefono-claro)
## ajustes-respaldo__atrasado
- [alta] Estado atrasado como texto naranja en negrita sin glifo ("Atrasado. Pasaron más de 36 horas…") → aviso de advertencia (`--advertencia-fondo`, triángulo) con título "Respaldo atrasado" (regla 2: color + glifo + texto) (telefono-claro; respaldo__telefono-claro.png)
- [alta] Datos como secciones de texto sueltas ("ÚLTIMO RESPALDO", "ÚLTIMA PRUEBA DE RESTAURACIÓN") → una tarjeta blanca con filas etiqueta/valor y fila "Lo hace · GitHub Actions, cada noche" (telefono-claro)
- [alta] "×" en vez de "←"; sin campana ni barra inferior
- [media] Botón tonal extra "Ver el diagnóstico" y párrafo introductorio que no figuran en la referencia
## ajustes-diagnostico__con-referencia
- [alta] Los eventos se muestran como texto suelto ("Aviso · respaldo · 17/10/2026 00:00 / token_invalido") sin tarjeta ni estado → tarjetas con título ("Tarea diaria", "Error al procesar SMS"), detalle y estado con chip de color + glifo + texto ("Correcta" verde con check, "Error" naranja con círculo) (telefono-claro; diagnostico__telefono-claro.png)
- [alta] El buscador es un campo de texto con etiqueta "Buscar por referencia o texto / Opcional" y ayuda, sin ícono de lupa ni botón de limpiar → campo de búsqueda con lupa a la izquierda, "×" a la derecha y la referencia ya escrita, y el resultado en una tarjeta aparte (telefono-claro)
- [media] "Ejecutar tareas ahora" va arriba, antes de los eventos, con una sección "TAREAS DEL DÍA" y descripción → botón al final de la pantalla, con ícono de recarga y sin sección propia (telefono-claro)
- [alta] "×" en vez de "←"; sin barra inferior ni campana (telefono-claro)
## ajustes-apariencia__sistema
- [alta] Cada opción es su propia tarjeta de 44 px (3 tarjetas separadas, 8 px entre ellas) con radio de 22 px; la selección usa título + descripción ("Sigue el tema de tu dispositivo.") solo en la primera → una sola tarjeta con las tres opciones en fila de 56 px con separación (telefono-claro; apariencia__telefono-claro.png)
- [media] Orden "Sistema, Claro, Oscuro" y etiqueta "Sistema" → orden "Claro, Oscuro, Según el sistema"; falta "Según" (textos)
- [media] Etiqueta suelta "Tema" y texto largo "Se guarda en este dispositivo. En otro dispositivo podés elegir uno distinto." → la referencia solo dice "Se guarda en este dispositivo." (telefono-claro)
- [alta] "×" en vez de "←"; sin barra inferior ni campana (telefono-claro)
## marco__mas-secciones-abierta
- [crítica] Falta la fila "Salir" (ícono `logout`, sin chevron) al pie de la hoja, separada por una franja `--superficie-hundida` de 8 px → DECISIONES Entrega 3 "Salir": última fila de Más secciones (telefono-claro; mas-secciones__telefono-claro.png)
- [alta] Computadora: la barra lateral no tiene el correo ni "Salir" al pie bajo línea `--borde-sutil` (computadora-claro; DECISIONES Entrega 3)
- [alta] La fila "Ajustes" usa el ícono de sol → engranaje de 8 dientes (`gear`); el sol pasa a la fila Apariencia (telefono-claro, computadora-claro)
- [media] El botón de la barra superior de Inicio es solo "+" cuadrado de 44 px → "+ Registrar" con rótulo, 110 × 44 px (telefono-claro)
- [media] En la tarjeta "Listo para asignar", falta el texto "· Carlos te debe" tras "En camino $40.00" (dato; solo anotado por composición) (telefono-claro)
- [baja] La captura completa muestra la hoja anclada al pie de una página larga (se corta al final) en lugar de ocupar el pie del viewport; el pliegue la muestra bien (telefono-claro)
## registrar-gasto__principal
- [alta] Falta la tarjeta "ANTES DE GUARDAR" (impacto por línea: "Visa Oro · deuda $642.18 → $790.78", "Supermercado … Deuda sin reservar", "Carlos te debe …") → DECISIONES "Registrar gasto": impacto "Antes de guardar" por línea (telefono-claro, computadora-claro; S5-Registrar__telefono-claro.png)
- [media] Falta el texto de ayuda "Propuesta: la cuenta que más usás en PRICESMART." bajo la cuenta (telefono-claro, computadora-claro)
- [media] Textos distintos: "Cuenta o tarjeta" → "Cuenta"; "Total del gasto" → "Total"; "Comercio · Opcional" → "Comercio" sin "Opcional"; la nota vacía no muestra el marcador "Hasta 500 caracteres" (telefono-claro)
- [media] El campo Fecha trae un ícono de calendario a la derecha que la referencia no tiene (telefono-claro, computadora-claro)
- [media] Importes de las líneas con "$" suelto a la izquierda y la cifra a la derecha en campos de 120 px → un solo valor "$96.10" alineado a la derecha, sin "$" aparte (telefono-claro)
- [media] Las líneas con deudor "Carlos (me lo …" se cortan con elipsis → la referencia parte en dos líneas "Carlos (me lo / debe)" sin cortar (telefono-claro)
- [alta] Computadora: botón "×" a la izquierda del título y sin enlace "← Inicio" sobre el título; sin contador en la campana; sin contadores en la barra lateral (Bandeja 3, Notificaciones 2); "Ajustes" con sol (computadora-claro)
- [baja] Computadora: el botón "Guardar $148.60" va bajo la suma pegado a 52 px; en la referencia lo deja bajo la tarjeta de impacto, a 18 px de ella (computadora-claro)
## registrar-gasto__suma-distinta-del-total
- [crítica] "Guardar $148.60" sigue habilitado, en azul, en la barra fija inferior, con la suma $138.60 ≠ $148.60 → con diferencia, Guardar queda deshabilitado con motivo (DECISIONES "Registrar gasto"); la referencia lo muestra gris "Guardar" con el motivo "No se puede guardar hasta que la suma coincida con el total." (telefono-claro; S5-Registrar__suma-distinta-del-total.png)
- [alta] El aviso "Falta repartir $10.00" es texto gris sin glifo ni color → mensaje de problema con glifo ⊖ y color `--problema-texto`: "Faltan $10.00 por repartir. La suma tiene que ser igual al total." (regla 2: tres señales) (telefono-claro)
- [media] Mismas diferencias de la pantalla principal (impacto, "Propuesta…", etiquetas, calendario, "$" suelto, elipsis)
## revisar__listo
- [alta] Falta la tarjeta "DESPUÉS DE APROBAR" (Supermercado · Disponible $62.85 → $27.85; Visa Oro · deuda → …) sobre la barra de acciones (telefono-claro; listo__telefono-claro.png)
- [alta] Categoría resuelta como bloque "DIVIDIR" abierto con una línea (categoría + importe, "+ Agregar línea", "Suma de las líneas") → un selector "Categoría" de una sola fila y el enlace "+ Dividir en partes" que abre la división solo al elegirlo (telefono-claro)
- [alta] "Descartar" es un botón tonal de ancho completo con fondo → enlace/botón de texto centrado con ícono de papelera, sin fondo, bajo "Aprobar" (telefono-claro)
- [media] Falta el contador "1 de 6" a la derecha del título (telefono-claro)
- [media] Sobran los chips "Hoy" / "Ayer" bajo la fecha y la casilla "Recordar esta categoría para este comercio" → no figuran en la referencia (telefono-claro)
- [media] Encabezado del SMS "TEXTO DEL SMS" → "SMS DE BAC · HOY 12:41" y el texto entre comillas con el contenido del SMS real; la línea de contexto dice "Categoría sugerida: Supermercado (de tu historial)" → "categoría por la regla «SUPER SELECTOS»" (textos)
- [media] Etiquetas "Cuenta o tarjeta" → "Cuenta"; "Comercio · Opcional" → "Comercio"; la nota vacía sin placeholder "Hasta 500 caracteres" (telefono-claro)
- [baja] El segmento "Gasto" seleccionado se muestra con relleno blanco y sombra → contorno de 1.5 px en `--borde-fuerte` sin relleno diferenciado (telefono-claro)
## asignar__principal
- [crítica] Falta la tarjeta de impacto "Listo para asignar $312.40 → $237.40 / Fondo de emergencia · asignado $100.00 → $175.00" (telefono-claro, computadora-claro; asignar__telefono-claro.png)
- [alta] El campo se llama "Nuevo valor de Asignado" con 100.00 (valor absoluto) → "Asignar" con prefijo "+$" y el monto a sumar (75.00), con la ayuda "Para quitar, escribí el monto con signo menos." (telefono-claro, computadora-claro)
- [alta] Aparece un control extra tipo segmentado/pista gris con un botón redondo "+" y "−" bajo el campo → no existe en la referencia (telefono-claro, computadora-claro)
- [alta] Las opciones rápidas son filas sin radio y ninguna queda elegida; la referencia las trae como lista de radios con la primera elegida ("Lo que falta para la meta $75.00") (telefono-claro, computadora-claro)
- [media] Botón primario "Guardar" → "Asignar $75.00" (con monto); falta el subtítulo "Ahorro · meta mensual $175.00" (la app dice "La meta pide $175.00") (telefono-claro)
- [media] Textos: "ASIGNACIÓN RÁPIDA" → "OPCIONES RÁPIDAS"; "FALTA PARA LA META / $75.00" en dos líneas → "META / falta $75.00"; "Tu promedio de gasto" sin "(3 períodos)"
- [media] La hoja del teléfono no cubre la barra superior ("+" sin rótulo "Registrar") y ocupa la mitad inferior de una página larga; la referencia la deja a unos 212 px del tope con la cabecera visible
- [media] Computadora: la tabla de Presupuesto detrás no lleva los grupos "CASA / COMIDA FUERA / TRANSPORTE / SUSCRIPCIONES / AHORRO" y la columna de la derecha queda tapada por el panel; el panel mide 420 px y la referencia 440 px (computadora-claro; DECISIONES Entrega 3: 440 px)
## cuenta-nueva__tarjeta
- [crítica] "Tipo de cuenta" como lista de 4 radios en filas → 4 mosaicos 2×2 con ícono, título y descripción ("Efectivo · Cuenta corriente, de ahorro o billetera", "Tarjeta de crédito · Con corte, pago y límite"…), el elegido con fondo `--accion-fondo` y borde azul (telefono-claro; nueva-tarjeta__telefono-claro.png)
- [alta] "Institución" como lista de radios de 4 filas (con "Sin institución", Banco Agrícola, BAC, Cuscatlán) y "Red" como lista de 3 radios → desplegables (select) de media columna, Institución junto a "Últimos 4", Red junto a Color (telefono-claro)
- [alta] "Debo / Tengo a favor" va después del saldo, sin etiqueta, y "Saldo" sin la etiqueta "Saldo inicial" → el segmentado va bajo "Saldo inicial" y antes de "Saldo"; la opción elegida con borde de 1.5 px (telefono-claro)
- [media] Los campos de dinero (Saldo, Límite) no llevan el prefijo "$" → con prefijo "$" y formato "2,500.00"; los helpers "Se entiende como $…" y "Fecha elegida: …" no están en la referencia ("Por defecto, hoy") (telefono-claro)
- [media] Una columna con todo apilado (Límite, Tasa anual, Día de corte, Día de pago en filas separadas) → pares Límite/Tasa y Corte/Pago en dos columnas; la pantalla mide ≈ 2.000 px (telefono-claro)
- [media] Etiquetas: "Últimos 4 dígitos · Opcional" → "Últimos 4"; "Saldo de la tarjeta" → "Saldo"; "Tasa anual (%)" → "Tasa anual"; "Fecha de apertura" → "Fecha de apertura en Finn"; "Crear cuenta" → "Crear Visa Oro" (textos)
- [media] Color de la tarjeta: 8 muestras con vista previa en vivo (conforme a DECISIONES "Tarjetas de crédito"); la referencia aún muestra un select de 2 colores (referencia desactualizada). Las muestras miden ≈ 44 px pero la fila queda a 8 px de la vista previa y de las siguientes (telefono-claro)
- [baja] El botón fijo "Crear cuenta" ocupa el ancho de contenido sin la barra inferior de acciones con línea superior (telefono-claro)
## cuenta-pagar__principal
- [crítica] Se muestra como página completa (barra superior con "×" y título "PAGAR VISA ORO") → una hoja inferior sobre el detalle de la tarjeta (con asa y título "PAGAR VISA ORO" + "×" dentro de la hoja) (telefono-claro; pagar-tarjeta__telefono-claro.png)
- [alta] Falta el chip "Lo reservado" y la fila de chips no ajusta línea: "Toda la deuda" se corta en el borde derecho (x≈770 de 780) → los chips pasan a una segunda fila (telefono-claro)
- [alta] El campo Monto no lleva etiqueta y queda 48 px más arriba que Fecha → ambos con etiqueta ("Monto", "Fecha") en la misma fila (telefono-claro)
- [media] Falta "· pago 15/11" en el subtítulo ("Deuda $642.18 · pago 15/11"); la tarjeta de desglose no tiene separadores entre filas y "Para no generar intereses" no va en negrita (telefono-claro)
- [media] El ícono de la cuenta de origen es una billetera → ícono de institución (dato; solo composición)
## transaccion-editar__principal
- [crítica] El cuerpo del formulario está vacío: solo título "EDITAR TRANSACCIÓN" y el botón "Guardar cambios" → faltan Cuenta, Fecha, Total, Comercio, las partes (Parte 1…n con Monto y "×"), "Suma de las partes", "+ Agregar parte", Nota y la tarjeta "ANTES DE GUARDAR" (telefono-claro; editar__telefono-claro.png)
- [media] El botón "Guardar cambios" está activo aunque no hay datos que guardar (telefono-claro)
## meta__nueva-mensual
- [alta] Se muestra como página completa con "×" y título "META PARA VIAJE" → una hoja inferior sobre Metas con asa, título "META PARA …", subtítulo con la categoría ("Ahorro") y "×" dentro de la hoja (telefono-claro; nueva__telefono-claro.png)
- [alta] Falta la etiqueta "Tipo" sobre el primer segmentado y "Modo" sobre el segundo (telefono-claro)
- [alta] Segmentados en forma de píldora (radio total, pastilla blanca con sombra, "Mensual" casi sin margen interno dentro de la pastilla: texto 129 px en pastilla de 165 px) → segmentado de radio contenido, opción elegida con borde de 1.5 px, 52 px de alto en las dos filas y texto centrado (telefono-claro)
- [media] Textos del segundo segmentado "Acumular / Rellenar hasta" → "Asignar / Tener disponible"; el segmentado mide 104 px de alto y deja medio vacío (la segunda opción no se reparte el ancho) (telefono-claro)
- [media] Falta la etiqueta "Monto" (la app dice "Monto de la meta"), el prefijo "$" del campo y el aviso informativo "La meta no asigna sola: te muestra cuánto falta y lo propone en Auto-asignar." (telefono-claro)
- [media] Falta el botón tonal "Cancelar" junto al primario; "Crear meta" ocupa todo el ancho en vez de "Guardar meta" en media fila (telefono-claro)
## categoria-archivar__formulario
- [crítica] Falta el aviso informativo ("Al archivar, … deja de aparecer en el presupuesto. Su historial se conserva y la podés desarchivar.") y las secciones "DISPONIBLE $…" (lista de 2 radios "Devolver a Listo para asignar / Pasarlo a otra categoría"), "ASIGNADO EN PERÍODOS FUTUROS $…" (casilla), "PROGRAMADAS · 1" (tarjeta con la programada y "se va a desactivar") y la tarjeta de impacto "Listo para asignar $312.40 → $725.25 / Reglas que apuntan aquí 2 · dejan de aplicarse" (telefono-claro, computadora-claro; archivar-categoria__telefono-claro.png)
- [alta] "Mandar $40.00 de Disponible a" resuelto con un desplegable y "Programada Gimnasio ($30.00)" con otro "Elegí una opción." → las decisiones se toman con lista de radios y casilla; el desplegable es un componente equivocado (telefono-claro)
- [alta] El aviso de período futuro es una tarjeta blanca de texto sin glifo ni color → aviso informativo azul con glifo `i` (regla 2) (telefono-claro)
- [media] Título "ARCHIVAR CATEGORÍA" → "ARCHIVAR SUPERMERCADO" (con el nombre) y el nombre "Gimnasio" suelto en negrita bajo el título (telefono-claro)
- [alta] Computadora: formulario en una sola columna de 624 px con el botón "Archivar" alineado a la derecha pegado al último campo, sin enlace "← Supermercado" sobre el título y con "×" junto al título; sin columna derecha (Programadas e impacto); sin contadores en la campana ni en la barra lateral (computadora-claro)

## Resumen
- Pantallas revisadas: 30.
- Diferencias: 16 críticas, 60 altas, 63 medias, 8 bajas (147 en total).
- Patrones repetidos: logo con cuadrado y título sin voseo en acceso; códigos de verificación como campo único en lugar de 6 casillas; subpáginas de Ajustes con "×", sin campana ni barra inferior donde la referencia usa "←"; falta la tarjeta de impacto ("Antes de guardar", "Después de aprobar", Asignar, Archivar); hojas inferiores resueltas como página completa (Pagar tarjeta, Meta nueva); "Salir" ausente del marco (hoja Más secciones, barra lateral, tarjeta en Ajustes).
- Limitaciones: la variante de computadora se revisó con imagen en 12 pantallas y en el resto se dedujo de la estructura del teléfono; no se midieron JSON de `medidas/`, por lo que las medidas son de lectura de imagen (±2 px).
