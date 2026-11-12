# Cruce de la verificación independiente con la auditoría por secciones

Entradas: `verificacion/VERIFICACION.md` (30 pantallas, 147 diferencias, una por línea) contra `secciones/*.md` (hallazgos de sección y globales `GLO-01…13`, `GLO-20…34`, `GLO-101…131`). Cada línea del verificador cuenta una vez; las comprobaciones de medida salen de `medidas/<id>__<variante>.json` y `analisis/`.

Resultado: de 147 diferencias, 126 ya estaban cubiertas, 12 son nuevas (en 10 hallazgos `V-nn`) y 9 se descartan. Ninguna nueva es crítica ni alta: `V-01` se comprobó en vivo y quedó en media (el formulario aparece al segundo; el vacío permanente es solo con la cuenta archivada, ya reportado como ACT-28).

## Nuevas

### ACT

### V-01 · Editar transacción se ve vacío mientras carga sus campos, con «Guardar cambios» activo — Editar transacción · todas · media
- **Se ve:** comprobado en vivo (`tools/auditoria/casos/93-editar-tx.cap.ts`, resultado `verificacion/editar-tx.json`): al entrar por el enlace «Editar», a 0 ms hay 0 campos y a 1 s aparecen los 7; por URL directa, el documento llega con 0 campos y aparecen ~3 s después. Mientras tanto solo se ven el título y «Guardar cambios» azul y activo (`capturas/transaccion-editar__principal__telefono-claro.png` de la primera pasada; la recaptura con 3 s de margen, `capturas/pliegue/transaccion-editar__principal__telefono-claro.png`, ya muestra el formulario). Los campos son un `lazy(() => import('./edicion'))` con `<Suspense fallback={null}>` (`apps/web/src/flujos/actividad-editar/formulario.tsx:68` y `:170`), y el HTML del servidor no los trae aunque el comentario de la línea 67 dice que sí. Con la cuenta archivada el formulario no aparece nunca: eso es ACT-28 (confirmado con la misma espera).
- **Debería:** `docs/diseno/02-referencias/entrega-2/pantallas/03-detalle-de-transaccion/editar__telefono-claro.png` para el formulario; para la espera, el estado de carga de un campo (`docs/diseno/02-referencias/entrega-2/componentes/P1-02-cargando-y-error-en-campos-selecciones-y__claro.png`: el control conserva su etiqueta y su lugar con «Cargando…»); PANTALLAS §2.1: un botón sin acción posible va deshabilitado con su motivo.
- **Arreglo:** que el HTML del servidor traiga los campos (renderizar `Edicion` en el servidor o sin `lazy`) o que el `fallback` del `Suspense` de `formulario.tsx` sea el esqueleto de los campos; «Guardar cambios» deshabilitado hasta que los campos estén y haya un cambio.
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/93-editar-tx --project=telefono-claro`: `porUrl.carga` y `porEnlace.0ms` mayores que 0, o un esqueleto visible en la captura `verificacion/editar-tx__url.png`; «Guardar cambios» deshabilitado sin cambios.
- **Sección:** ACT · **Fuente:** verificación independiente (confirmado y recalificado en vivo; además corrige ACT-25, que daba la pantalla por igual a la referencia mirando una captura sin campos)

### AJU

### V-02 · Ciclo: aviso en amarillo de advertencia con dos tarjetas — Ajustes · Ciclo (aviso) · telefono-claro · media
- **Se ve:** `capturas/ajustes-ciclo__aviso__telefono-claro.png`: el aviso de transición va en amarillo con triángulo (advertencia) y separado en dos tarjetas («Hoy empieza el día / Vigencia futura» y «Antes de confirmar»); AJU-07 solo cubre que el aviso está detrás del botón «Ver el cambio».
- **Debería:** `docs/diseno/02-referencias/entrega-3/pantallas/11-ajustes/ciclo__telefono-claro.png`: aviso informativo azul (`--informacion-fondo`, glifo `i`, título «Antes de confirmar») con el texto del período en la misma tarjeta; es información, no advertencia (regla 2: color, glifo y texto).
- **Arreglo:** en `apps/web/src/flujos/ajustes-ciclo/panel.tsx` usar `AvisoEnLinea estado="informacion"` (`apps/web/src/componentes/base/aviso.tsx`) con una sola tarjeta y el título «Antes de confirmar»; textos en `apps/web/src/textos/ajustes-ciclo.ts`.
- **Cómo verificar:** el aviso mide una sola caja con fondo `--informacion-fondo` y glifo `i`; el analizador no marca triángulo de advertencia en esta pantalla.
- **Sección:** AJU · **Fuente:** verificación independiente

### V-03 · Notificaciones de Ajustes: título de sección largo — Ajustes · Notificaciones · telefono-claro · baja
- **Se ve:** `capturas/ajustes-notificaciones__concedido__telefono-claro.png`: sección «DISPOSITIVOS CON NOTIFICACIONES».
- **Debería:** `…/11-ajustes/notificaciones__telefono-claro.png`: «DISPOSITIVOS».
- **Arreglo:** el texto en `apps/web/src/textos/notificaciones.ts` y su uso en `apps/web/src/app/(finn)/ajustes/notificaciones/panel.tsx`.
- **Cómo verificar:** el rótulo de sección dice «Dispositivos».
- **Sección:** AJU · **Fuente:** verificación independiente

### V-04 · Exportar: texto de advertencia final y espaciado del título — Ajustes · Exportar · telefono-claro · baja
- **Se ve:** `capturas/ajustes-exportar__principal__telefono-claro.png`: el título «EXPORTAR TUS DATOS» lleva la descripción a 12 px; abajo hay una nota «El archivo trae tus datos reales…» que la referencia no tiene. El texto de CSV dice «los negativos con guion» (`apps/web/src/textos/ajustes-exportar.ts:14`).
- **Debería:** `…/11-ajustes/exportar__telefono-claro.png`: descripción a 32 px del título y sin la nota final; DECISIONES regla 3 pide U+2212 en los montos que se muestran (el CSV puede seguir con guion ASCII para hojas de cálculo; decidir con diseño y quitar el texto o reformularlo).
- **Arreglo:** `apps/web/src/app/(finn)/ajustes/exportar/page.tsx` (separación del título) y `apps/web/src/textos/ajustes-exportar.ts` (quitar la nota o dejarla como información en la tarjeta). El título corto «Exportar» ya lo cubre AJU-03.
- **Cómo verificar:** la separación título–descripción mide 32 px y no queda la nota final.
- **Sección:** AJU · **Fuente:** verificación independiente

### V-05 · Respaldo: botón «Ver el diagnóstico» y párrafo que la referencia no tiene — Ajustes · Respaldo · telefono-claro · baja
- **Se ve:** `capturas/ajustes-respaldo__atrasado__telefono-claro.png`: botón tonal extra «Ver el diagnóstico» y un párrafo introductorio.
- **Debería:** `…/11-ajustes/respaldo__telefono-claro.png`: aviso, tarjeta de filas y nada más.
- **Arreglo:** quitar el botón y el párrafo en `apps/web/src/app/(finn)/ajustes/respaldo/page.tsx` y `apps/web/src/textos/ajustes-respaldo.ts`, o proponerlos como CH si el acceso al diagnóstico se quiere conservar.
- **Cómo verificar:** la pantalla solo tiene aviso, tarjeta y el pie de la referencia.
- **Sección:** AJU · **Fuente:** verificación independiente

### REG

### V-06 · Registrar gasto: ícono de calendario en el campo Fecha — Registrar gasto · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/registrar-gasto__principal__telefono-claro.png`: el campo Fecha lleva un ícono de calendario a la derecha.
- **Debería:** `docs/diseno/02-referencias/entrega-1/referencia/S5-Registrar__telefono-claro.png`: el campo Fecha sin ícono (el calendario se abre al tocar el campo).
- **Arreglo:** `apps/web/src/componentes/formularios/entrada-fecha.tsx`: quitar el ícono o hacerlo opcional con una propiedad; si el ícono es una decisión de accesibilidad, proponer un CH.
- **Cómo verificar:** el campo Fecha de Registrar gasto no muestra ícono y sigue abriendo el calendario al tocarlo.
- **Sección:** REG · **Fuente:** verificación independiente

### V-07 · Registrar gasto en computadora: «Guardar» más cerca de la suma que de la tarjeta de impacto — Registrar gasto · computadora-claro · baja
- **Se ve:** `capturas/registrar-gasto__principal__computadora-claro.png`: «Guardar $148.60» a 52 px bajo la suma.
- **Debería:** `S5-Registrar__computadora-claro.png`: el botón bajo la tarjeta de impacto, a 18 px de ella. Depende de REG-10 (el impacto en vivo todavía no existe).
- **Arreglo:** `apps/web/src/flujos/registrar-gasto/formulario.tsx`: ordenar suma, tarjeta de impacto y botón con ese espaciado cuando se construya el impacto de REG-10.
- **Cómo verificar:** a 1440 px el botón queda a 18 px de la tarjeta de impacto.
- **Sección:** REG · **Fuente:** verificación independiente

### BAN

### V-08 · Revisar: el segmento «Gasto» elegido se dibuja con relleno y sombra — Revisar movimiento · telefono-claro · baja
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`: el segmento seleccionado con relleno blanco y sombra.
- **Debería:** `docs/diseno/02-referencias/entrega-2/pantallas/01-revisar-movimiento/listo__telefono-claro.png` y K2 Selección: contorno de 1.5 px en `--borde-fuerte`, sin relleno diferenciado. Es el mismo patrón que GLO-33 y MAS-010 para otros segmentados.
- **Arreglo:** `apps/web/src/componentes/base/selector-segmentado.tsx`, usado por `apps/web/src/flujos/bandeja-movimiento/campos-movimiento.tsx`.
- **Cómo verificar:** el segmento activo tiene borde de 1.5 px `--borde-fuerte` y fondo igual al resto.
- **Sección:** BAN · **Fuente:** verificación independiente

### CTA

### V-09 · Nueva cuenta (tarjeta): rótulos y botón distintos de la referencia — Nueva cuenta · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__tarjeta__telefono-claro.png`: «Últimos 4 dígitos · Opcional», «Saldo de la tarjeta», «Tasa anual (%)», «Fecha de apertura» y «Crear cuenta».
- **Debería:** `docs/diseno/02-referencias/entrega-2/pantallas/06-detalle-de-cuenta/nueva-tarjeta__telefono-claro.png`: «Últimos 4», «Saldo», «Tasa anual», «Fecha de apertura en Finn» y «Crear Visa Oro». CTA-35 pide el pie fijo con «Crear Visa Oro» y CTA-36 el «Saldo», pero no listan los demás rótulos.
- **Arreglo:** `apps/web/src/textos/cuentas-nueva.ts` (y `cuentas-nueva-base.ts`), usados por `apps/web/src/flujos/cuentas-nueva/formulario.tsx`.
- **Cómo verificar:** los rótulos coinciden con el PNG de referencia.
- **Sección:** CTA · **Fuente:** verificación independiente

### V-10 · Pagar tarjeta: el campo Monto no lleva etiqueta y el desglose no tiene separadores — Pagar tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta-pagar__principal__telefono-claro.png`: `medidas/…json` coloca el campo Monto (x=20, y=480) y el campo Fecha (x=200, y=504) en la misma fila con 24 px de diferencia; solo Fecha tiene etiqueta. El desglose («Deuda anterior», «Cargos del ciclo», «Ya pagado»…) no lleva líneas entre filas y «Para no generar intereses» va en peso 400.
- **Debería:** `…/06-detalle-de-cuenta/pagar-tarjeta__telefono-claro.png`: «Monto» y «Fecha» con etiqueta, a la misma altura; filas del desglose separadas por `--borde-sutil` y la fila final en negrita (CTA-28 pide lo mismo para el detalle de la tarjeta).
- **Arreglo:** `apps/web/src/flujos/cuentas-pagar/formulario.tsx` (etiqueta y alineación de los dos campos; separadores del `<dl>` «Desglose del ciclo») y `apps/web/src/textos/cuentas-pagar.ts`.
- **Cómo verificar:** ambos campos tienen etiqueta visible y mismo `y` en las medidas; el desglose tiene separadores.
- **Sección:** CTA · **Fuente:** verificación independiente

## Cubiertas

Una fila por línea del verificador. «GLO-nn» son los globales de `secciones/00-glo.md`, `01-glo-consolidado.md` y `10-acc-glo.md`.

| pantalla | diferencia | hallazgo que la cubre |
|---|---|---|
| acceso__ingresar | Sin tarjeta blanca en computadora | ACC-06 |
| acceso__ingresar | Enlace «Mostrar contraseña» | ACC-08 |
| acceso__ingresar | Texto de ayuda extra bajo el botón | ACC-09 |
| acceso__ingresar | Título «INGRESAR» en vez de «INGRESÁ» | ACC-04 |
| acceso__ingresar | Logo con cuadrado oscuro y «FINN» más chico | ACC-07 |
| acceso__ingresar | Campos más bajos y espaciado distinto (botón a 16 px) | ACC-08 (botón empujado a 810 contra 700) |
| acceso__credenciales-invalidas | Campo contraseña sin borde de problema | ACC-11 |
| acceso__credenciales-invalidas | Mismas diferencias de marco que ingresar | ACC-04, ACC-06, ACC-07, ACC-08, ACC-09 |
| acceso__demasiados-intentos | Botón «Ingresar» activo | ACC-10 |
| acceso__demasiados-intentos | Mismas diferencias que ingresar | ACC-04, ACC-06, ACC-07, ACC-08, ACC-09 |
| acceso__verificar-vacio | Campo único en vez de 6 casillas | ACC-01 / GLO-20 |
| acceso__verificar-vacio | Título «VERIFICÁ TU CÓDIGO» y descripción | ACC-05 |
| acceso__verificar-vacio | Etiqueta «Código» visible | ACC-01 (grupo con etiqueta «Código») |
| acceso__verificar-vacio | Logo con cuadrado y sin tarjeta en computadora | ACC-06, ACC-07 |
| acceso__codigo-incorrecto | Campo único con aro de foco | ACC-01 / GLO-20, ACC-03 |
| acceso__codigo-incorrecto | Error como tarjeta rellena arriba | ACC-03 |
| acceso__codigo-incorrecto | Título y logo distintos | ACC-05, ACC-07 |
| acceso__codigo-vencido | Campo único en vez de 6 casillas | ACC-01 / GLO-20 |
| acceso__codigo-vencido | Error como tarjeta rellena arriba | ACC-03 |
| acceso__codigo-vencido | Título y logo con cuadrado | ACC-05, ACC-07 |
| acceso__verificar-varios-factores | Lista de radios en vez de selector | ACC-16 |
| acceso__verificar-varios-factores | Campo único en vez de 6 casillas | ACC-01 / GLO-20 |
| acceso__verificar-varios-factores | Título y logo | ACC-05, ACC-07 |
| acceso__inscribir | Campo único y botón «Confirmar» | ACC-02 / GLO-20, ACC-13 («Verificar y entrar») |
| acceso__inscribir | QR sin marco ni tarjeta | ACC-12 |
| acceso__inscribir | Secreto sin tarjeta, «Copiar» sin ícono | ACC-12 |
| acceso__inscribir | Título más grande | ACC-14 |
| acceso__inscribir | Texto explicativo más largo | ACC-13 |
| acceso__inscribir | Computadora sin tarjeta de 420 px | ACC-06 |
| acceso__inscribir-cierre | Falta el aviso «Factor verificado» | ACC-15 |
| acceso__inscribir-cierre | Título grande sin equivalente en la referencia | ACC-14, ACC-15 |
| acceso__inscribir-cierre | «Seguir» como enlace en vez de «Seguir a Finn» | ACC-15 / GLO-26 |
| acceso__inscribir-cierre | Texto del factor de respaldo distinto | ACC-15 |
| ajustes__indice | Falta la tarjeta «Salir» bajo la lista | GLO-103 / GLO-21, AJU-02 |
| ajustes__indice | Barra lateral sin correo ni «Salir» al pie | GLO-102 / GLO-21 |
| ajustes__indice | Filas sin subtítulo de estado | AJU-01 |
| ajustes__indice | Respaldo atrasado solo con color naranja | AJU-04 |
| ajustes__indice | «Ciclo de los períodos» y «Exportar tus datos» | AJU-03 |
| ajustes__indice | Íconos de Diagnóstico y de «Ajustes» (sol en vez de engranaje) | GLO-107, AJU-03 |
| ajustes__indice | Computadora: lista de 624 px en vez de 720 (los ítems de «Más» en la barra lateral usan 14 px / 400 como el rol `cuerpo-pequeno` de la referencia: sin diferencia real) | AJU-05 |
| ajustes-seguridad__dos-factores | «Salir» como enlace en Seguridad | GLO-104, AJU-18, GLO-21 |
| ajustes-seguridad__dos-factores | Botón tonal sin «+» | AJU-16 |
| ajustes-seguridad__dos-factores | «Este dispositivo» con disco e ícono | AJU-13 |
| ajustes-seguridad__un-factor | Falta el aviso «Agregá otro factor antes de quitar este.» | AJU-14 |
| ajustes-seguridad__un-factor | «Salir» como enlace | GLO-104, AJU-18, GLO-21 |
| ajustes-seguridad__un-factor | Botón sin «+» y disco en «Este dispositivo» | AJU-16, AJU-13 |
| ajustes-ciclo__aviso | Paso de confirmación aparte con «Volver a editar» | AJU-07 (aviso detrás de «Ver el cambio») |
| ajustes-ciclo__aviso | Flecha «×», sin campana ni barra inferior | AJU-06 / GLO-24 |
| ajustes-ciclo__aviso | Botones «Volver a editar» y «Cambiar el ciclo» lado a lado | AJU-07 |
| ajustes-conectar-sms__con-token | No se muestra el token en tarjeta | AJU-08 |
| ajustes-conectar-sms__con-token | Guía larga de MacroDroid | AJU-08 |
| ajustes-conectar-sms__con-token | Aviso «Conectado» sin el dato del último SMS | AJU-08 |
| ajustes-conectar-sms__con-token | «Cambiar token» sin ícono de recarga | AJU-08 («Generar un token nuevo» con ícono) |
| ajustes-conectar-sms__con-token | Flecha «×», sin campana ni barra inferior | AJU-06 / GLO-24 |
| ajustes-conectar-sms__con-token | Falta «TOKEN DE MACRODROID» | AJU-08 |
| ajustes-formatos__lista | Filas sin chevron ni datos de uso | AJU-10 |
| ajustes-formatos__lista | «Inactivo» como texto sin chip | AJU-10 |
| ajustes-formatos__lista | «Nuevo formato» sin «+» | AJU-10 |
| ajustes-formatos__lista | «Instituciones» subrayado | AJU-10, AJU-11 |
| ajustes-formatos__lista | Texto introductorio de más | AJU-10 |
| ajustes-formatos__lista | «×» en vez de «←» | AJU-06 / GLO-24 |
| ajustes-notificaciones__concedido | Falta la tarjeta con el interruptor y el permiso | AJU-12 |
| ajustes-notificaciones__concedido | User agent completo en 4 líneas | AJU-12 |
| ajustes-notificaciones__concedido | «Quitar» tonal azul en vez de texto de peligro | AJU-12 |
| ajustes-notificaciones__concedido | Falta la nota «Si el permiso está denegado…» | AJU-12 |
| ajustes-exportar__principal | Secciones de texto en vez de tarjeta de dos filas | AJU-19 |
| ajustes-exportar__principal | «×», sin campana ni barra inferior | AJU-06 / GLO-24 |
| ajustes-respaldo__atrasado | Atraso como texto naranja sin glifo | AJU-20, AJU-04 |
| ajustes-respaldo__atrasado | Datos como secciones sueltas, sin tarjeta ni «Lo hace» | AJU-20 |
| ajustes-respaldo__atrasado | «×», sin campana ni barra inferior | AJU-06 / GLO-24 |
| ajustes-diagnostico__con-referencia | Eventos como texto suelto, sin estado | AJU-21 |
| ajustes-diagnostico__con-referencia | Buscador sin lupa, con «Opcional» | AJU-21 |
| ajustes-diagnostico__con-referencia | «Ejecutar tareas ahora» arriba y sin ícono de recarga | AJU-21 (ícono); la ubicación se arregla en `ajustes/diagnostico/panel.tsx` |
| ajustes-diagnostico__con-referencia | «×», sin barra inferior ni campana | AJU-06 / GLO-24 |
| ajustes-apariencia__sistema | Tres tarjetas separadas en vez de una | AJU-22 |
| ajustes-apariencia__sistema | Orden y rótulo «Sistema» | AJU-22 |
| ajustes-apariencia__sistema | Etiqueta «Tema» y texto largo | AJU-22 |
| ajustes-apariencia__sistema | «×», sin barra inferior ni campana | AJU-06 / GLO-24 |
| marco__mas-secciones-abierta | Falta la fila «Salir» al pie de la hoja | GLO-101 / GLO-21, GLO-106 |
| marco__mas-secciones-abierta | Barra lateral sin correo ni «Salir» | GLO-102 / GLO-21 |
| marco__mas-secciones-abierta | «Ajustes» con sol, «Apariencia» sin él | GLO-107 |
| marco__mas-secciones-abierta | Botón «+» sin rótulo «Registrar» | GLO-111 / GLO-22 |
| registrar-gasto__principal | Falta «ANTES DE GUARDAR» | REG-10 / GLO-28 |
| registrar-gasto__principal | Falta «Propuesta: la cuenta que más usás…» | REG-12 |
| registrar-gasto__principal | «Cuenta o tarjeta», «Total del gasto», «Opcional», placeholder de la nota | REG-12 |
| registrar-gasto__principal | «$» suelto a la izquierda de los importes | REG-13 |
| registrar-gasto__principal | Líneas con elipsis en «Carlos (me lo …» | REG-13 |
| registrar-gasto__principal | Computadora: «×», sin «← Inicio», barra lateral, «Ajustes» con sol (contadores: ver Descartadas) | REG-16, GLO-107 |
| registrar-gasto__suma-distinta-del-total | «Guardar» habilitado con la suma distinta | REG-11 |
| registrar-gasto__suma-distinta-del-total | Aviso de diferencia en gris sin glifo | REG-11 |
| registrar-gasto__suma-distinta-del-total | Mismas diferencias de la pantalla principal | REG-10, REG-12, REG-13 |
| revisar__listo | Falta «DESPUÉS DE APROBAR» | BAN-14 / GLO-28 |
| revisar__listo | «DIVIDIR» siempre abierto | BAN-15 |
| revisar__listo | «Descartar» como botón tonal de ancho completo | BAN-18 / GLO-26 |
| revisar__listo | Falta el contador «1 de 6» | BAN-16 |
| revisar__listo | Chips «Hoy» / «Ayer» y casilla «Recordar» | BAN-19 |
| revisar__listo | «TEXTO DEL SMS» y línea de contexto | BAN-20 |
| revisar__listo | «Cuenta o tarjeta», «Comercio · Opcional», placeholder de la nota | BAN-20, REG-12 |
| asignar__principal | Falta la tarjeta de impacto | PRE-32 |
| asignar__principal | «Nuevo valor de Asignado» en vez de «Asignar» con «+$» | PRE-30 |
| asignar__principal | Control extra «+» / «−» bajo el campo | PRE-30 |
| asignar__principal | Opciones rápidas sin radios ni elegida | PRE-31 |
| asignar__principal | «Guardar» en vez de «Asignar $75.00», falta el subtítulo | PRE-33, PRE-34, GLO-34 |
| asignar__principal | «ASIGNACIÓN RÁPIDA», «FALTA PARA LA META», «(3 períodos)» | PRE-31, PRE-34 (el rótulo se corrige en el mismo `textos/presupuesto-asignar.ts`) |
| asignar__principal | Computadora: panel de 420 px contra 440 y tabla sin los grupos de la referencia (los grupos son datos de la semilla) | GLO-23 (criterio de 440 px) y nota de `20-ini-pre.md` §Sin diseño |
| meta__nueva-mensual | Página completa en vez de hoja | MAS-001 / GLO-23 |
| meta__nueva-mensual | Faltan «Tipo» y «Modo» | MAS-002 |
| meta__nueva-mensual | Segmentados en píldora, sin margen interno | MAS-010 / GLO-33 |
| meta__nueva-mensual | «Acumular / Rellenar hasta» y segmentado medio vacío | MAS-002, MAS-010 |
| meta__nueva-mensual | «Monto de la meta», sin «$» ni aviso informativo | MAS-009 |
| meta__nueva-mensual | Falta «Cancelar» y «Guardar meta» en media fila | MAS-008 |
| categoria-archivar__formulario | Falta el aviso y las secciones del diseño | CAT-21 |
| categoria-archivar__formulario | Decisiones con desplegable en vez de radios y casilla | CAT-21 |
| categoria-archivar__formulario | Aviso de período futuro sin glifo ni color | CAT-23 |
| categoria-archivar__formulario | Título sin el nombre y «Gimnasio» suelto | CAT-20 |
| categoria-archivar__formulario | Computadora: una columna, botón pegado, sin «← Supermercado», con «×» y campana | CAT-21, CAT-32, GLO-24 |
| cuenta-nueva__tarjeta | «Tipo de cuenta» como lista de radios | CTA-02 |
| cuenta-nueva__tarjeta | Institución y Red como listas de radios | CTA-35 |
| cuenta-nueva__tarjeta | «Debo / Tengo a favor» después del saldo | CTA-36 |
| cuenta-nueva__tarjeta | Campos de dinero sin «$» y helpers extra | CTA-36 |
| cuenta-nueva__tarjeta | Una columna, pantalla de ≈ 2.000 px | CTA-35 |
| cuenta-nueva__tarjeta | Muestras de color con poca separación de la vista previa | CTA-37 |
| cuenta-nueva__tarjeta | Botón fijo sin barra de acciones con línea superior | CTA-35 |
| cuenta-pagar__principal | Página completa en vez de hoja | CTA-04 / GLO-23 |
| cuenta-pagar__principal | Falta «Lo reservado» y los chips no ajustan línea | CTA-41 |
| cuenta-pagar__principal | Falta «· pago 15/11» en el subtítulo (los separadores del desglose van en V-10) | CTA-42 |

## Descartadas

| pantalla | diferencia | motivo |
|---|---|---|
| acceso__credenciales-invalidas | Contraseña con 20 puntos y aviso 1 px más pequeño y sin sombra | Los 20 puntos son datos; el tamaño del aviso es de 1 px y el verificador mismo dice «sin cambio de composición»; el aviso se arregla con ACC-03/ACC-11 y GLO-26. |
| ajustes__indice | Falta la tarjeta «Primeros pasos: 2 de 3» con «Mostrar en Inicio» | Es condicional: `recordatorio-primeros-pasos.tsx` solo se dibuja con los Primeros pasos ocultos. La sección lo capturó en `ajustes__indice-primeros-pasos-ocultos` y lo marcó «bien» (`70-mas-aju.md:55`); la captura del verificador es el estado por defecto. |
| ajustes__indice | Campana sin contador «2» ni punto azul; faltan contadores de Bandeja y Notificaciones | Dato de semilla: la semilla del caso no tiene notificaciones (`10-acc-glo.md:66`, `20-ini-pre.md:7`); la hoja Más secciones sí muestra el contador «2» (`10-acc-glo.md:79`). |
| ajustes-seguridad__dos-factores | La campana no lleva contador y la barra inferior no tiene aro ni contador de Bandeja | Mismo motivo: contadores de la campana y de Bandeja dependen de las notificaciones y movimientos sembrados. |
| ajustes-notificaciones__concedido | La campana aparece sin el contador | Mismo motivo: dato de semilla; el verificador mismo la marca como correcta. |
| marco__mas-secciones-abierta | Falta «· Carlos te debe» tras «En camino $40.00» | Solo de datos; el propio verificador lo anota «por composición». |
| marco__mas-secciones-abierta | La captura completa muestra la hoja al pie de una página larga | Artefacto de la captura de página entera; el verificador reconoce que el pliegue la muestra bien (`capturas/pliegue/marco__mas-secciones-abierta__telefono-claro.png`). |
| asignar__principal | La hoja no cubre la barra superior y ocupa la mitad inferior de una página larga | Contradice la referencia: también deja visible la cabecera; la diferencia viene de la página larga de la captura completa (`medidas/asignar__principal__telefono-claro.json`: docH 2147). El «+» sin rótulo ya lo cubre GLO-22. |
| cuenta-pagar__principal | Ícono de billetera en la cuenta de origen en vez del de institución | Dato: depende de la institución de la cuenta de la semilla (el verificador lo anota «dato; solo composición»). |

## Recuento por sección

Las diferencias son las líneas del verificador (147). Una nueva puede reunir varias líneas (`V-04` reúne dos).

| sección | pantallas de la muestra | nuevas | cubiertas | descartadas |
|---|---|---|---|---|
| 10-acc-glo (acceso y marco) | 10 | 0 | 37 | 3 |
| 20-ini-pre | 1 | 0 | 7 | 1 |
| 30-cat (incluye metas) | 2 | 0 | 11 | 0 |
| 40-ban-reg | 3 | 3 | 16 | 0 |
| 50-act-rep | 1 | 2 | 0 | 0 |
| 60-cta | 2 | 2 | 10 | 1 |
| 70-mas-aju (ajustes) | 11 | 5 | 45 | 4 |
| Total | 30 | 12 | 126 | 9 |

Nota: el total de cubiertas, descartadas y nuevas suma 147. En 10-acc-glo las 3 descartadas son 1 de credenciales-invalidas y 2 de marco__mas-secciones-abierta; en 20-ini-pre, la hoja de Asignar descrita arriba (el panel de 420 contra 440 va como cubierta); en 60-cta, el ícono de la cuenta de origen; en 70-mas-aju, los tres contadores de campana y Primeros pasos.
