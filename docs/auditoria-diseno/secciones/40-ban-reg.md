# Auditoría de diseño · BAN (Bandeja y Revisar movimiento) y REG (Registrar)

Capturas: `docs/auditoria-diseno/capturas/<id>__<variante>.png` (86 casos x 3 variantes = 258 capturas, todas presentes). Medidas: `docs/auditoria-diseno/medidas/`. Análisis: `docs/auditoria-diseno/analisis/<id>.md`.
Referencias (carpeta `docs/diseno/02-referencias/`): Bandeja `tableros/S4-Bandeja__*.png`; Revisar `entrega-2/pantallas/01-revisar-movimiento/*`; Registrar gasto `entrega-1/referencia/S5-Registrar__*.png`; tipos `entrega-2/pantallas/12-registrar-tipos-y-flujos-cortos/*`.

Nota de método: el archivo de casos del agente anterior (`tools/auditoria/casos/40-ban-reg.cap.ts`) ya tenía las 258 capturas (20:52 a 20:59). Intenté volver a correrlo completo, pero el candado de capturas lo ocupaba otro agente durante toda la sesión; lo cancelé para no bloquear a los demás y trabajé con esas capturas, que revisé y coinciden con los estados que dice cada caso. No hubo casos que arreglar ni estados del inventario que agregar (la carga de `/registrar/gasto` reexporta el `loading.tsx` de `(finn)` y queda cubierta por `registrar__cargando`; `/bandeja` no tiene `loading.tsx` propio). Corrí `analizar.mjs` para los cuatro prefijos.

Comparación visual lado a lado (teléfono claro y computadora claro, y teléfono oscuro en Bandeja principal) hecha para: bandeja principal, no reconocido/error/duplicado/faltantes, aprobado, descartado, vista de descartados, al día, error al aprobar; revisar listo, dividido, coincidencia, no reconocido, con error, posible duplicado, aprobado, ya aprobado, devolución con compra elegida; selector, ingreso, transferencia, retroactivo; registrar gasto principal, suma distinta, guardado. El resto de los estados se compararon por el análisis de textos y estructura (`analisis/*.md`) y heredan los hallazgos de su familia; así se indica en la tabla. El modo oscuro no mostró diferencias de color ni de contraste (cero `fueraToken` y cero `contraste` en los análisis): los hallazgos de color son los mismos que en claro.

## Inventario

Rutas: `B` = `apps/web/src/app/(finn)/bandeja`, `F` = `apps/web/src/flujos`, `R` = `apps/web/src/app/(finn)/registrar`. Veredicto "familia X" = estructura comparada con el análisis, mismos hallazgos que X.

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| bandeja__principal | /bandeja | `B/page.tsx`, `B/lista.tsx`, `B/fila.tsx`, `componentes/dominio/movimiento-bandeja.tsx` | tableros/S4-Bandeja__telefono-claro y __computadora-claro | BAN-01 BAN-02 BAN-03 BAN-04 BAN-05 BAN-09 BAN-10 BAN-11 BAN-13 |
| bandeja__al-dia | /bandeja | `B/lista.tsx` | S4-Bandeja__bandeja-al-dia | BAN-08 (más BAN-02 BAN-03) |
| bandeja__aprobado-con-un-toque | /bandeja | `B/fila.tsx`, `componentes/base/resultado.tsx` | S4-Bandeja__aprobado-con-un-toque | BAN-06 |
| bandeja__descartado | /bandeja | `B/fila.tsx` | S4-Bandeja__descartado | BAN-06 |
| bandeja__vista-de-descartados | /bandeja?vista=descartados | `B/descartados.tsx` | S4-Bandeja__vista-de-descartados | BAN-07 |
| bandeja__descartados-vacio | /bandeja (Descartados) | `B/descartados.tsx` | SIN DISEÑO (vacío de Descartados) | sin diseño |
| bandeja__restaurado | /bandeja | `B/descartados.tsx`, `B/fila.tsx` | SIN DISEÑO (resultado de Restaurar) | sin diseño |
| bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes | /bandeja | `movimiento-bandeja.tsx` | S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes | BAN-04 BAN-12 BAN-05 |
| bandeja__referencia-copiada | /bandeja | `B/fila.tsx`, `F/bandeja-movimiento/error-sms.ts` | SIN DISEÑO (confirmación de copiar la referencia) | sin diseño |
| bandeja__error-al-aprobar | /bandeja | `B/fila.tsx`, `componentes/base/aviso.tsx` | SIN DISEÑO (error de aprobar en la fila; el aviso es el de `problema`) | bien en el aviso; BAN-05 (la fila se parte en tres líneas de acciones) |
| bandeja__sin-conexion | /bandeja sin red | `B/fila.tsx` | SIN DISEÑO (el aviso global está en 14-…/sin-conexion) | sin diseño |
| bandeja__aprobar-todos, bandeja__aprobar-todos-resultado | /bandeja | `B/aprobar-todos.tsx` | SIN DISEÑO (FALTANTES `aprobar-todos`) | sin diseño |
| bandeja__arrastre-destinos | /bandeja (asa con foco) | `B/arrastre.tsx` | SIN DISEÑO (FT-78) | no capturado el estado: la captura muestra solo el asa con foco; los destinos de arrastre no se despliegan sin un arrastre real |
| bandeja__otra-categoria | /bandeja | `B/otra-categoria.tsx` | SIN DISEÑO (CH-220 A10) | sin diseño |
| bandeja__muchos | /bandeja (varias filas) | `B/lista.tsx` | S4-Bandeja__telefono-claro (misma lista) | familia principal |
| revisar__listo | /bandeja/[id] | `F/bandeja-movimiento/formulario.tsx`, `campos-movimiento.tsx`, `encabezado.tsx`, `panel-navegacion.tsx` | 01-revisar-movimiento/listo | BAN-03 BAN-14 BAN-15 BAN-16 BAN-17 BAN-18 BAN-19 BAN-20 |
| revisar__falta-categoria | idem | idem | 01-revisar-movimiento/falta-categoria | familia listo (BAN-14 BAN-15 BAN-19); faltan «Categoría», «Crea una regla…» y «Elegí una categoría o un por cobrar…» (análisis) |
| revisar__dividido | idem | `F/bandeja-movimiento/*` | 01-revisar-movimiento/dividido | BAN-14 BAN-15 (rótulos «Línea» en vez de «Parte 1/2», «Agregar línea», sin la nota de «Recordar») |
| revisar__parte-sin-destino | idem | idem | 01-revisar-movimiento/parte-sin-destino | familia dividido; faltan «Elegí una categoría o por cobrar» (análisis) |
| revisar__coincidencia | idem | `F/bandeja-movimiento/coincidencia.tsx` | 01-revisar-movimiento/coincidencia | BAN-23 |
| revisar__posible-duplicado | idem | `F/bandeja-movimiento/estados.tsx` | 01-revisar-movimiento/posible-duplicado | BAN-26 |
| revisar__no-reconocido | idem | `F/bandeja-movimiento/estados.tsx` | 01-revisar-movimiento/no-reconocido | BAN-21 BAN-18 |
| revisar__no-reconocido-a-mano | idem | idem | SIN DISEÑO (formulario a mano tras «Registrar a mano») | sin diseño |
| revisar__con-error | idem | `F/bandeja-movimiento/detalle-error.tsx` | 01-revisar-movimiento/con-error | BAN-22 |
| revisar__ya-aprobado | idem | `F/bandeja-movimiento/ya-resuelto.tsx` | 01-revisar-movimiento/ya-aprobado | BAN-27 |
| revisar__ya-descartado | idem | idem | 01-revisar-movimiento/ya-descartado | familia ya-aprobado; texto «está descartado» en vez de «ya está descartado» (análisis) |
| revisar__aprobado | idem | `F/bandeja-movimiento/resultado.tsx` | 01-revisar-movimiento/aprobado | BAN-24 |
| revisar__pago-de-tarjeta | idem | `F/bandeja-movimiento/formulario.tsx` | 01-revisar-movimiento/pago-de-tarjeta | BAN-28 |
| revisar__devolucion | idem | `F/bandeja-movimiento/eleccion-compra.tsx` | 01-revisar-movimiento/devolucion | BAN-25 |
| revisar__devolucion-compra-elegida | idem | idem | 01-revisar-movimiento/devolucion | BAN-25 |
| revisar__ingreso | idem | `formulario.tsx` | SIN DISEÑO (tipo Ingreso dentro de Revisar) | sin diseño |
| revisar__datos-faltantes, revisar__validacion, revisar__sin-conexion, revisar__error-de-red, revisar__aprobando, revisar__confirmar-periodo-cerrado, revisar__muchos | idem | `formulario.tsx`, `componentes/formularios/confirmacion-impacto.tsx` | SIN DISEÑO (estados de error/envío de Revisar) | sin diseño; heredan BAN-03 BAN-14 BAN-15 BAN-19 |
| revisar__descartado | idem | `F/bandeja-movimiento/descartado.tsx` | SIN DISEÑO (resultado de descartar a pantalla completa) | sin diseño |
| revisar__no-encontrado, revisar__sin-cuentas | idem | `F/bandeja-movimiento/sin-cuentas-movimiento.tsx` | SIN DISEÑO (404 y sin cuentas de Revisar) | sin diseño; margen 55 px, ver BAN-03 |
| registrar__selector | /registrar | `R/page.tsx`, `F/registrar/lector.tsx` | 12-…/selector | REG-01 |
| registrar__cargando | /registrar al navegar | `R/loading.tsx` | SIN DISEÑO (más cercana: 15-inicio-y-presupuesto-piezas-nuevas/cargando) | sin diseño; «$40.00» sin tabular-nums y dos enlaces sin nombre accesible (REG-03) |
| registrar__ingreso, registrar__ingreso-pagina | /registrar/ingreso (hoja y página) | `F/registrar-tipo/formulario.tsx` | 12-…/ingreso | REG-02 REG-03 REG-04 REG-05 REG-06 REG-07 |
| registrar__ingreso-validacion, registrar__ingreso-sin-conexion, registrar__ingreso-guardado | idem | idem | SIN DISEÑO (estados de error/guardado del flujo corto) | sin diseño; heredan REG-02 REG-03 |
| registrar__transferencia | /registrar/transferencia | `formulario.tsx` | 12-…/transferencia | REG-02 REG-03 REG-04 REG-05 REG-06 REG-08 |
| registrar__transferencia-misma-cuenta | idem | idem | 12-…/transferencia-misma-cuenta | familia transferencia (REG-02 REG-03) |
| registrar__transferencia-una-cuenta | idem | idem | SIN DISEÑO (una sola cuenta de efectivo) | sin diseño |
| registrar__devolucion, registrar__devolucion-compra-elegida, registrar__devolucion-sin-compra | /registrar/devolucion | `F/registrar-tipo/devolucion.tsx`, `lector-devolucion.tsx` | 12-…/devolucion | familia ingreso (REG-02 REG-05 REG-06); margen 16 px en compra-elegida (BAN-03) |
| registrar__inversion | /registrar/inversion | `F/registrar-tipo/inversion-formulario.tsx` | 12-…/inversion | familia ingreso |
| registrar__inversion-retiro, registrar__inversion-ajuste | idem | idem | SIN DISEÑO (el diseño solo tiene el aporte) | sin diseño |
| registrar__desembolso | /registrar/desembolso | `formulario-desembolso.tsx` | 12-…/desembolso | familia ingreso |
| registrar__avance | /registrar/avance | `formulario-tarjeta.tsx` | 12-…/avance | familia ingreso |
| registrar__transferencia-deuda | /registrar/transferencia-deuda | `formulario-tarjeta.tsx` | 12-…/transferencia-deuda | familia transferencia |
| registrar__entrada-tarjeta | /registrar/entrada-tarjeta | `formulario-tarjeta.tsx` | SIN DISEÑO («Dinero que entra a una tarjeta») | sin diseño |
| registrar__avance-confirmar | idem | `componentes/formularios/confirmacion-impacto.tsx` | SIN DISEÑO (confirmación de avance) | sin diseño |
| registrar__retroactivo | idem (fecha en período cerrado) | `confirmacion-impacto-de-vista.tsx` | 12-…/retroactivo | REG-09 |
| registrar__no-encontrado, registrar__sin-cuentas | /registrar/[tipo] | `R/[tipo]/page.tsx` | SIN DISEÑO | sin diseño |
| registrar-gasto__principal, registrar-gasto__inicial, registrar-gasto__otra-persona | /registrar/gasto | `F/registrar-gasto/formulario.tsx`, `lineas.tsx`, `parte.tsx` | entrega-1/referencia/S5-Registrar__telefono-claro y __computadora-claro | REG-10 REG-12 REG-13 REG-14 REG-16 |
| registrar-gasto__una-linea | idem | idem | S5-Registrar__una-linea | familia principal (REG-10 REG-12) |
| registrar-gasto__suma-distinta-del-total | idem | `formulario.tsx`, `lineas.tsx` | S5-Registrar__suma-distinta-del-total | REG-11 |
| registrar-gasto__suma-rechazada | idem | idem | S5-Registrar__suma-distinta-del-total | REG-11 |
| registrar-gasto__monto-mal-escrito | idem | `formulario.tsx` | S5-Registrar__monto-mal-escrito | familia principal (REG-12); sin diferencias propias en el análisis |
| registrar-gasto__fecha-en-periodo-cerrado | idem | idem | S5-Registrar__fecha-en-periodo-cerrado | REG-10 (el aviso de período cerrado va dentro del impacto, que no se muestra antes de guardar) |
| registrar-gasto__confirmar-periodo-cerrado | idem | `confirmacion-impacto-de-vista.tsx` | S5-Registrar__fecha-en-periodo-cerrado | REG-10 |
| registrar-gasto__guardando | idem | `formulario.tsx` | S5-Registrar__guardando | bien en estructura (análisis sin diferencias); REG-14 |
| registrar-gasto__guardado | idem | `resultado-gasto.tsx` | S5-Registrar__guardado | REG-15 |
| registrar-gasto__sugerencia-al-escribir | idem | `sugerencia-comercio.tsx` | S5-Registrar__sugerencia-al-escribir | familia principal; sin diferencias propias en el análisis |
| registrar-gasto__validacion, registrar-gasto__calendario, registrar-gasto__fecha-no-existe, registrar-gasto__fecha-posterior, registrar-gasto__error-de-red, registrar-gasto__sin-conexion | idem | `formulario.tsx`, `componentes/formularios/entrada-fecha.tsx` | SIN DISEÑO (estados de error del formulario) | sin diseño |
| registrar-gasto__borrador | idem | `borrador-gasto.tsx` | SIN DISEÑO (FALTANTES `borrador`) | sin diseño |
| registrar-gasto__sin-cuentas | idem | `sin-cuentas.tsx` | SIN DISEÑO | sin diseño |

## Hallazgos

### BAN-01 · Computadora: la Bandeja no abre el panel de revisión a la derecha — Bandeja principal · computadora-claro · alta
- **Se ve:** `capturas/bandeja__principal__computadora-claro.png`: una sola columna de 1144 px con las filas a todo el ancho (monto a 1262 px del borde izquierdo, medida `medidas/bandeja__principal__computadora-claro.json`). No hay panel derecho. El panel solo existe al entrar a un movimiento (`capturas/revisar__listo__computadora-claro.png`), y entonces la lista se angosta y desaparece el título «Bandeja».
- **Debería:** `tableros/S4-Bandeja__computadora-claro.png` y PANTALLAS §7 «Computadora»: lista a la izquierda (≈534 px) y a la derecha, ya abierta, la revisión del movimiento seleccionado (comercio, monto grande, SMS citado, Cuenta/Fecha/Categoría, Aprobar · Editar · Descartar). Título «BANDEJA» siempre visible.
- **Arreglo:** que `B/page.tsx` en computadora monte la lista y el panel (`F/bandeja-movimiento/panel-navegacion.tsx` ya existe) con el primer movimiento preseleccionado, y que el título de página no se pierda al abrir el panel. Contenedor de la lista a `max-width` de columna, no a 1144.
- **Cómo verificar:** a 1440 px, `/bandeja` con A.7 muestra lista (3 filas) + panel con SUPER SELECTOS ESCALON; el título «Bandeja» está arriba en ambos estados.

### BAN-02 · El botón «Registrar» pierde su etiqueta a 390 px — Barra superior de pestañas · telefono-claro y telefono-oscuro · alta
- **Se ve:** `capturas/bandeja__principal__telefono-claro.png`: botón cuadrado de 44 px con solo «+» (en todas las pantallas de pestaña). La etiqueta está oculta por `max-[25rem]:sr-only` y `max-[25rem]:w-11` en `componentes/navegacion/acceso-registrar.tsx:18-35` (25 rem = 400 px, así que 390 px cae dentro).
- **Debería:** `tableros/S4-Bandeja__telefono-claro.png` y PANTALLAS §3.1: botón de 44 de alto, padding `0 14 0 10`, ícono `plus` + «Registrar» `.t-etiqueta` 700, a 390 px.
- **Arreglo:** quitar la variante `max-[25rem]` de `VARIANTES.barra` (o bajarla a ≤ 360 px), y comprobar que cabe junto al título más largo («Presupuesto»).
- **Cómo verificar:** a 390 px la barra de Bandeja, Inicio, Presupuesto, Actividad y Cuentas muestra «+ Registrar».

### BAN-03 · Margen lateral de 16 px en lugar de 20 px — pantallas de pestaña y flujos de Revisar y Registrar gasto · telefono-claro y telefono-oscuro · alta
- **Se ve:** `analisis/bandeja__principal.md`: `main` con `pad=16px/16px`, texto más a la izquierda en x=16 (esperado 20). Igual en las 27 capturas de Revisar y las de `registrar-gasto__*`: x=16 (`registrar__devolucion-compra-elegida` también). En los flujos cortos (`registrar__ingreso`, `registrar__selector`) el margen sí es 20. En `revisar__no-encontrado`/`sin-cuentas` es 55 y 36.
- **Debería:** DECISIONES «Marco y densidad»: relleno lateral del contenido 20 px (`--espacio-5`); `tableros/S4-Bandeja__telefono-claro.png` mide 20 px.
- **Arreglo:** el contenedor de contenido de pestañas y flujos largos usa `--espacio-4`; pasarlo a `--espacio-5` en el marco (`componentes/navegacion/` marco de `(finn)`), y la hoja/pie del flujo largo (16 px es correcto en el pie, PANTALLAS §3.1: padding 12 16 26).
- **Cómo verificar:** a 390 px el borde izquierdo del primer texto de `/bandeja`, `/bandeja/[id]` y `/registrar/gasto` está en x=20 y el derecho a 20 px del borde.

### BAN-04 · Acciones secundarias de la fila como enlaces subrayados — Bandeja · telefono-claro y computadora-claro · alta
- **Se ve:** «Revisar», «Ver la programada», «Completar datos», «Registrar a mano» son `EnlaceFinn` con `underline`, 16 px peso 600 (`componentes/dominio/movimiento-bandeja.tsx:201-206`; el análisis marca «Revisar»: tamaño 16≠14, peso 600≠700, decoración underline≠none). Ver `capturas/bandeja__principal__telefono-claro.png` y `capturas/bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes__telefono-claro.png`.
- **Debería:** `tableros/S4-Bandeja__telefono-claro.png`: «Revisar» es botón de texto 14 px 700 `--accion`, sin subrayado; «Registrar a mano», «Completar datos», «Es otro gasto», «Intentar de nuevo» son botones **tonales** (`tableros/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.png`); «Descartar» es botón de texto.
- **Arreglo:** usar `Boton` con variante `texto` para Revisar/Descartar y `tonal` para las acciones únicas de la fila (`movimiento-bandeja.tsx` y `componentes/base/boton.tsx`); reservar el enlace subrayado para «Ver transacción». «Ver la programada» en la fila de coincidencia: el diseño no lo pone, la línea dice «→ programada Netflix del 17/10».
- **Cómo verificar:** ninguna fila de Bandeja tiene texto subrayado salvo «Ver transacción»; las alturas de los tocables siguen ≥ 44.

### BAN-05 · Fila con acciones de más, asa visible y sin flecha — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** la fila «lista» muestra Aprobar + Descartar + Revisar, y por ancho «Revisar» cae a una tercera línea (`capturas/bandeja__principal__telefono-claro.png`, y `bandeja__error-al-aprobar`); el asa ⋮⋮ de arrastre queda visible a la izquierda de las acciones (`movimiento-bandeja.tsx:127`); las filas sin acción no llevan flecha `chevR` cuando tienen un enlace (la de coincidencia).
- **Debería:** S4 teléfono: fila lista = «Aprobar» (principal) + «Revisar» (texto) en una sola línea; sin asa visible (el arrastre es un atajo discreto, PANTALLAS §7 nota); filas sin acción = toda la fila tocable con `chevR` a la derecha.
- **Arreglo:** mover «Descartar» a la pantalla de Revisar (ya está ahí) o a un menú; dejar el asa como `sr-only`/sin dibujo hasta el foco; en `movimiento-bandeja.tsx` mostrar `chevR` siempre que la fila abra Revisar.
- **Cómo verificar:** en la fila lista, Aprobar y Revisar caben en una línea a 390 px; las filas sin acción muestran flecha.

### BAN-06 · Resultado de aprobar o descartar integrado en la lista, con glifo y texto distintos — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/bandeja__aprobado-con-un-toque__telefono-claro.png`: el resultado es la primera fila del mismo contenedor de la lista, «Ver transacción» a la derecha del texto; resumen «2 pendientes». `capturas/bandeja__descartado__telefono-claro.png`: glifo check (no papelera) y «Descartaste Super $35.00.».
- **Debería:** `tableros/S4-Bandeja__aprobado-con-un-toque.png`: tarjeta propia, separada de la lista por 24 px, «Aprobado: COMERCIO · $35.00 · Visa Oro · Supermercado» y «Ver transacción» debajo, subrayado. `tableros/S4-Bandeja__descartado.png`: glifo papelera, «Descartado: FARMACIA SAN NICOLAS · $12.35» y «Restaurar» con ícono. El resumen dice «1 pendiente · 1 con coincidencia».
- **Arreglo:** `B/fila.tsx` y `componentes/base/resultado.tsx`: renderizar el resultado como contenedor propio (Contenedor §1) fuera de la tarjeta de filas; ícono `trash` para descartado; textos en `textos/bandeja.ts` (`textoDescartado`, `textoAprobado`) con el formato «Verbo: comercio · monto · cuenta · categoría».
- **Cómo verificar:** tras aprobar/descartar, el resultado es una tarjeta aparte con la medida de S4 y permanece hasta navegar.

### BAN-07 · Descartados sin el resumen «N en los últimos 30 días» — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/bandeja__vista-de-descartados__telefono-claro.png`: solo el título «DESCARTADOS», sin texto a la derecha.
- **Debería:** `tableros/S4-Bandeja__vista-de-descartados.png`: «2 en los últimos 30 días» `.t-cuerpo-pequeno` a la derecha; filas con el nombre en negrita 700 y «Descartado hoy»/«Descartado el 10/10» (no «Descartado · T · 20/…» truncado).
- **Arreglo:** `B/descartados.tsx`: agregar el resumen (texto en `textos/bandeja.ts`) y la línea de estado con fecha relativa, sin truncar.
- **Cómo verificar:** con 3 descartados se lee «3 en los últimos 30 días».

### BAN-08 · Bandeja al día: ícono y texto distintos — Bandeja · telefono-claro y telefono-oscuro · baja
- **Se ve:** `capturas/bandeja__al-dia__telefono-claro.png`: ícono bandeja (`inbox`) en el disco y «No hay movimientos por revisar.»
- **Debería:** `tableros/S4-Bandeja__bandeja-al-dia.png`: ícono check en círculo y «No hay movimientos por revisar. Los SMS nuevos de tu banco van a aparecer aquí.»
- **Arreglo:** vacío 2.19 en `B/lista.tsx` / `textos/bandeja.ts`.
- **Cómo verificar:** coincide el glifo y la segunda frase.

### BAN-09 · Metadatos de la fila: fecha completa, sin origen ni hora, sin línea de destino — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** «Visa Oro · 15/10/2026» (`bandeja__principal__telefono-claro`); la fila lista dice «→ Supermercado»; la de coincidencia no dice a qué programada se parece.
- **Debería:** S4: «Visa Oro · 15/10 · BAC 12:41», «→ Supermercado (por regla)», «→ programada Netflix del 17/10»; «Cuenta corriente · 14/10 · ayer 18:05».
- **Arreglo:** `movimiento-bandeja.tsx` y `textos/bandeja.ts`: fecha corta d/m (con año solo si no es el actual), fuente y hora, y la «razón» del destino («por regla», «del historial»).
- **Cómo verificar:** el subtítulo de la fila coincide en estructura con S4.

### BAN-10 · Nota al pie sin la mitad de la frase — Bandeja · telefono-claro y computadora-claro · baja
- **Se ve:** «Tocá un movimiento para revisarlo completo.»
- **Debería:** PANTALLAS §7 y S4: «…Arrastrar a una categoría es un atajo; los botones siempre están.»
- **Arreglo:** `textos/bandeja.ts` (la nota).
- **Cómo verificar:** el texto es el de §7.

### BAN-11 · Selector Por revisar / Descartados: opción activa sin borde y con peso 700 — Bandeja · telefono-claro, telefono-oscuro y computadora-claro · baja
- **Se ve:** la opción activa es una píldora blanca con sombra, peso 700 (`analisis/bandeja__principal.md`: «Por revisar · 3» peso 700≠500).
- **Debería:** S4: opción activa con borde de 1.5 px `--borde-fuerte`, fondo superficie, peso 500.
- **Arreglo:** `B/selector-vista.tsx` (o el segmentado compartido en `componentes/base/`).
- **Cómo verificar:** coincide el segmentado en claro y oscuro.

### BAN-12 · Fila de «No reconocido» y «Con error»: título «Sin comercio» y sin fecha ni monto «—» — Bandeja · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes__telefono-claro.png`: «Sin comercio», sin monto, el SMS citado, sin hora; «Con error» sin el motivo («Algo falló al procesarlo.»); «Datos faltantes» sin «Falta la cuenta.»
- **Debería:** `tableros/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.png`: «SMS de BAC», «Hoy 09:12 · sin monto ni comercio», monto «—», SMS citado con «· BAC · hoy 09:12», «Con error Algo falló al procesarlo.» + «Intentar de nuevo» y «Copiar referencia» con ícono, «Datos faltantes / Falta la cuenta.».
- **Arreglo:** `componentes/dominio/movimiento-bandeja.tsx` y `textos/bandeja.ts`.
- **Cómo verificar:** las cuatro filas coinciden con S4 en estructura.

### BAN-13 · Orden de las filas distinto — Bandeja · telefono-claro · baja
- **Se ve:** Netflix (coincidencia), Farmacia, Super Selectos.
- **Debería:** S4: listo para aprobar primero, luego falta categoría, luego coincidencia.
- **Arreglo:** el criterio de orden de `B/lista.tsx`/`B/activos.ts` (verificar contra 05 antes de tocar: puede ser un orden por fecha del dato).
- **Cómo verificar:** con A.7, Super Selectos aparece primero. Puede ser solo de datos si el orden de la app es por fecha.

### BAN-14 · Revisar: falta la confirmación del impacto «Después de aprobar» — Revisar movimiento · telefono-claro, telefono-oscuro y computadora-claro · alta
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`: después de la nota hay solo la casilla «Recordar esta categoría…» y el pie; no hay bloque de impacto antes de aprobar.
- **Debería:** `01-revisar-movimiento/listo__telefono-claro.png`: contenedor «DESPUÉS DE APROBAR» con «Supermercado · Disponible $62.85 → $27.85» y «Visa Oro · deuda $642.18 → $677.18» (también `dividido__*`, `devolucion__*`, `pago-de-tarjeta__*`).
- **Arreglo:** en `F/bandeja-movimiento/formulario.tsx`, montar `ConfirmacionImpactoDeVista` (`componentes/formularios/confirmacion-impacto-de-vista.tsx`) como bloque en vivo bajo la nota, no solo al confirmar.
- **Cómo verificar:** al abrir un movimiento listo aparece el bloque con las filas «valor actual → valor nuevo».

### BAN-15 · Revisar: «Dividir» siempre abierto en lugar de Categoría + «Dividir en partes» — Revisar movimiento · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`: sección «DIVIDIR» con «1 LÍNEA», campo categoría + monto, «+ Agregar línea» y «Suma de las líneas». En `dividido`: rótulos de línea y «Agregar línea».
- **Debería:** `listo__telefono-claro.png`: campo «Categoría» (selector de ancho completo) y debajo el enlace «+ Dividir en partes»; solo al dividir aparecen «Parte 1», «Parte 2», «Agregar parte», «Suma de las partes» y la nota «Con más de una parte no se ofrece “Recordar esta categoría”.» (`dividido__telefono-claro.png`).
- **Arreglo:** `formulario.tsx` y `F/registrar-gasto/lineas.tsx`: modo simple (una categoría) + botón «Dividir en partes»; rótulos «Parte n»/«partes» en `textos/bandeja.ts` para Revisar (Registrar gasto conserva «líneas», S5).
- **Cómo verificar:** el estado «listo» no muestra «Dividir»; al tocar «Dividir en partes» aparecen dos partes.

### BAN-16 · Revisar en teléfono: falta el contador «1 de N» — Revisar movimiento · telefono-claro · baja
- **Se ve:** la barra superior solo tiene la «X» y el título.
- **Debería:** `listo__telefono-claro.png`: «1 de 6» a la derecha del título.
- **Arreglo:** `F/bandeja-movimiento/encabezado.tsx` / `panel-navegacion.tsx` mostrar el contador también en teléfono si hay más movimientos.
- **Cómo verificar:** con 3 movimientos por revisar, el encabezado dice «1 de 3».

### BAN-17 · Revisar en computadora: título grande, flechas pegadas a la campana y panel sin la forma del diseño — Revisar movimiento · computadora-claro · media
- **Se ve:** `capturas/revisar__listo__computadora-claro.png`: «REVISAR MOVIMIENTO» como título de pantalla (40 px) con «3 de 3», flechas y X; la campana de la página se superpone a la flecha derecha; el panel arranca en el borde superior sin radio ni margen; la lista pierde el título «BANDEJA».
- **Debería:** `01-revisar-movimiento/listo__computadora-claro.png`: panel-tarjeta (radio contenedor, elevación 1) con rótulo pequeño «REVISAR MOVIMIENTO» a la izquierda y ← → ✕ a la derecha, 24 px de padding; título «BANDEJA» arriba del todo; fila seleccionada con raya lateral `--accion`.
- **Arreglo:** `F/bandeja-movimiento/encabezado.tsx` (rol `rotulo` en panel) y el contenedor del panel en `B/[movimientoId]/page.tsx`.
- **Cómo verificar:** la campana no toca los controles del panel y el título «Bandeja» sigue visible.

### BAN-18 · «Descartar» como botón tonal de ancho completo en vez de botón de texto — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/revisar__listo__telefono-claro.png`, `revisar__no-reconocido`: botón tonal de 48 px con papelera.
- **Debería:** `01-revisar-movimiento/listo__telefono-claro.png`: «Descartar» es botón de texto (papelera + etiqueta) centrado bajo el principal, sin fondo. Excepción: «No es este pago» (coincidencia) y «Es duplicado» sí son tonales.
- **Arreglo:** variante `texto` de `Boton` en `F/bandeja-movimiento/formulario.tsx` y `estados.tsx`.
- **Cómo verificar:** el pie fijo muestra principal + texto.

### BAN-19 · Revisar: controles que el diseño no tiene (chips Hoy/Ayer, casilla «Recordar») y casilla de 20 × 20 — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** chips «Hoy» «Ayer» bajo Fecha y casilla «Recordar esta categoría para este comercio» de 20 × 20 px (`analisis/revisar__listo.md`: «Tocables < 44»; repetido en `datos-faltantes`, `validacion`, `error-de-red`, `sin-conexion`, `aprobando`).
- **Debería:** `listo__telefono-claro.png`: Fecha sin atajos; la regla se ofrece **después** de aprobar («¿Siempre a Supermercado?» con «Crear regla»/«Ahora no», ver BAN-24). Si la casilla se queda, 44 × 44 de área de toque.
- **Arreglo:** quitar los chips en esta pantalla (`componentes/formularios/entrada-fecha.tsx` los pone por defecto) y mover «Recordar» a la propuesta posterior; si no, ampliar el área táctil.
- **Cómo verificar:** ningún tocable < 44; coincide con el diseño.

### BAN-20 · Revisar: subtítulo, rótulo del SMS y etiquetas distintos — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** «Visa Oro · 15/10/2026 · Categoría sugerida: Supermercado (de tu historial)», recuadro «TEXTO DEL SMS» sin comillas, etiqueta «Cuenta o tarjeta», «Monto».
- **Debería:** «Visa Oro · 15/10 · categoría por la regla “SUPER SELECTOS”» (`listo__telefono-claro.png`); rótulo «SMS DE BAC · HOY 12:41» con el texto entre comillas; etiqueta «Cuenta»; nota con placeholder «Hasta 500 caracteres».
- **Arreglo:** `F/bandeja-movimiento/texto-sms.tsx`, `encabezado.tsx` y `textos/bandeja.ts`.
- **Cómo verificar:** los rótulos y el formato coinciden con la referencia.

### BAN-21 · No reconocido: sin monto «—», sin el aviso de formato, aviso azul donde va uno neutro — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/revisar__no-reconocido__telefono-claro.png`: «SIN COMERCIO», un aviso `informacion` celeste, sin monto ni hora.
- **Debería:** `01-revisar-movimiento/no-reconocido__telefono-claro.png`: «SMS DE BAC», una raya «—» de monto, «Hoy 09:12 · sin monto ni comercio», dos avisos **neutros** (glifo circular punteado «No encontramos un formato de BAC…» y «Si corregís el formato en Ajustes › Formatos, este SMS se puede volver a procesar desde aquí.»).
- **Arreglo:** `F/bandeja-movimiento/estados.tsx`, `textos/bandeja.ts`; avisos con la variante neutra de `componentes/base/aviso.tsx`.
- **Cómo verificar:** coinciden los dos avisos y el encabezado.

### BAN-22 · Con error: «Detalle del error» duplicado y referencia sin su tarjeta — Revisar movimiento · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/revisar__con-error__telefono-claro.png`: bloque «Detalle del error» con `cuerpo_invalido: content_type`, repetido debajo en «Referencia: …», botón «Copiar referencia» tonal suelto y tres botones en el pie (incluye «Registrar a mano»).
- **Debería:** `01-revisar-movimiento/con-error__telefono-claro.png`: tarjeta «REFERENCIA / BDJ-4K2Q» (negrita, espaciado de letras) con «Copiar referencia» tonal a la derecha; la leyenda «La misma referencia aparece en Ajustes › Diagnóstico.»; pie con solo «Intentar de nuevo» y «Descartar».
- **Arreglo:** `F/bandeja-movimiento/detalle-error.tsx` y `formulario.tsx` (quitar el duplicado y el tercer botón del pie).
- **Cómo verificar:** una sola referencia, en su tarjeta.

### BAN-23 · Coincidencia: formulario de edición completo en lugar del resumen de la programada — Revisar movimiento · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/revisar__coincidencia__telefono-claro.png`: tras el aviso, una tabla de 3 filas (Programada, Fecha esperada, Monto esperado) y luego el formulario completo (Cuenta, Fecha, Monto, Hoy/Ayer, Comercio, Tipo, Dividir con «Elegí…» vacío, Nota). La categoría de la división aparece vacía.
- **Debería:** `01-revisar-movimiento/coincidencia__telefono-claro.png`: título «Coincide con Netflix del 17/10», tabla de 5 filas (Programada, Fecha esperada, Monto esperado, Cuenta, Categoría), el aviso neutro «Un movimiento con coincidencia no se descarta…» y nada más; pie «Confirmar» + «No es este pago».
- **Arreglo:** `F/bandeja-movimiento/coincidencia.tsx` y `formulario.tsx`: no montar los campos de edición en el estado de coincidencia; agregar Cuenta y Categoría a la tabla.
- **Cómo verificar:** la pantalla de coincidencia no tiene campos editables.

### BAN-24 · Aprobado: faltan la propuesta de regla y «Siguen por revisar»; el cierre es «Volver a la Bandeja» — Revisar movimiento · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/revisar__aprobado__telefono-claro.png`: el resultado sin tarjeta, «Ver transacción» subrayado a la derecha, el resto vacío y «Volver a la Bandeja».
- **Debería:** `01-revisar-movimiento/aprobado__telefono-claro.png`: tarjeta de resultado con «Ver transacción» debajo; tarjeta «¿Siempre a Supermercado?» con «Crear regla» (tonal) y «Ahora no»; sección «SIGUEN POR REVISAR» con las filas restantes; botón principal «→ Siguiente movimiento». (En el repo `textos/bandeja.ts:149` tiene `siguiente: 'Siguiente movimiento'`, pero la captura no lo muestra; no hay texto de la propuesta de regla en `textos/` ni en `F/bandeja-movimiento/`.)
- **Arreglo:** `F/bandeja-movimiento/resultado.tsx`: agregar la propuesta de regla (según diseño 05) y la lista de pendientes, y el botón siguiente cuando haya más movimientos.
- **Cómo verificar:** tras aprobar con otros 2 pendientes, el pie dice «Siguiente movimiento».

### BAN-25 · Devolución: desborde horizontal y «Cambiar compra» cortado; la compra no se elige en lista — Revisar movimiento · telefono-claro y telefono-oscuro · crítica
- **Se ve:** `capturas/revisar__devolucion-compra-elegida__telefono-claro.png`: documento de 446 px en 390 (`analisis/revisar__devolucion-compra-elegida.md`: «Desborde horizontal», `form#formulario-revisar-movimiento > fieldset` x=20 w=425.8): el botón «Cambiar compra» queda cortado y el campo de monto sobresale; el rótulo del campo dice «Supermercado» (la categoría) y no «Monto». No se ve el encabezado ni el título porque el scroll quedó abajo.
- **Debería:** `01-revisar-movimiento/devolucion__telefono-claro.png`: título «¿QUÉ COMPRA TE DEVOLVIERON?» y lista de radios con comercio, fecha, categoría y «quedan $X por devolver»; bloque «Después de aprobar» con «Sobregiro con débito o efectivo»; pie «Aprobar devolución $18.50».
- **Arreglo:** `F/bandeja-movimiento/eleccion-compra.tsx` (`min-w-0` en el `fieldset`, rejilla que no supere el ancho) y reemplazar el botón por la lista de compras; rótulos en `textos/bandeja.ts`.
- **Cómo verificar:** `documentElement.scrollWidth` = 390 y la lista de compras se lee completa.

### BAN-26 · Posible duplicado: nota fuera del pie y la fila original sin origen — Revisar movimiento · telefono-claro · baja
- **Se ve:** `capturas/revisar__posible-duplicado__telefono-claro.png`: la explicación de «Es duplicado» en un aviso neutro dentro del cuerpo; la tarjeta del gasto original con «T · 20/02/2027».
- **Debería:** `posible-duplicado__telefono-claro.png`: la nota va **bajo** los botones como texto terciario centrado dentro del pie; la tarjeta dice «Visa Oro · 14/10 · registrada desde un SMS a las 20:01». El resto (aviso de advertencia, botones) coincide.
- **Arreglo:** `F/bandeja-movimiento/estados.tsx`.
- **Cómo verificar:** coincide el pie.

### BAN-27 · Ya aprobado: tabla de solo lectura en lugar de los campos deshabilitados; «Ver transacción» falta en el aviso — Revisar movimiento · telefono-claro · media
- **Se ve:** `capturas/revisar__ya-aprobado__telefono-claro.png`: aviso «Este movimiento ya se aprobó.» sin enlace y un contenedor «SOLO LECTURA» con filas; «Volver a la Bandeja» principal.
- **Debería:** `01-revisar-movimiento/ya-aprobado__telefono-claro.png`: aviso «Este movimiento ya está aprobado.» con «Ver transacción» dentro; los campos Cuenta, Fecha, Monto, Comercio y Nota en su forma deshabilitada (borde discontinuo, «Solo lectura» a la derecha de la etiqueta); «Volver a la Bandeja» tonal.
- **Arreglo:** `F/bandeja-movimiento/ya-resuelto.tsx` y `textos/bandeja.ts`.
- **Cómo verificar:** coincide el estado; en `ya-descartado` el texto es «Este movimiento ya está descartado.».

### BAN-28 · Pago de tarjeta: aparece el formulario genérico de gasto — Revisar movimiento · telefono-claro · alta
- **Se ve:** `analisis/revisar__pago-de-tarjeta.md`: el estado muestra «Falta la categoría», «FARMACIA SAN NICOLAS», «Cuenta o tarjeta», Hoy/Ayer, «Sale de» y no aparecen «Pago a Visa Oro», «Tarjeta», «Desde», «Preseleccionada…», «Después de aprobar» ni «Te falta reservar / Meta cubierta». La captura no representa el movimiento de pago (puede ser el semillado del caso `revisar__pago-de-tarjeta`, línea 655 del archivo de casos; no pude confirmar sin repetir la semilla).
- **Debería:** `01-revisar-movimiento/pago-de-tarjeta__telefono-claro.png`: «Listo para aprobar», «Pago a Visa Oro», campos Tarjeta y Desde (preseleccionada), impacto «Después de aprobar».
- **Arreglo:** verificar primero el semillado en `tools/auditoria/casos/40-ban-reg.cap.ts` y, si es correcto, `F/bandeja-movimiento/formulario.tsx` no tiene la variante de pago.
- **Cómo verificar:** el estado muestra «Pago a Visa Oro» con Tarjeta/Desde.

### REG-01 · Selector de tipo: lista de 11 filas de texto en lugar de cuadrícula de 8 tarjetas con ícono — Registrar · telefono-claro, telefono-oscuro y computadora-claro · alta
- **Se ve:** `capturas/registrar__selector__telefono-claro.png`: 11 filas de ancho completo con título largo («Un gasto», «Un ingreso», «Una transferencia entre mis cuentas»…), sin ícono, incluyendo «Un retiro de una inversión», «Un ajuste de valor», «Dinero que entra a una tarjeta» (sin diseño); sin la nota final.
- **Debería:** `12-…/selector__telefono-claro.png`: cuadrícula de 2 columnas, 8 tarjetas de ≈ 168 × 150 (radio contenedor, elevación 1), disco con ícono (gasto en `--accion-secundaria`, resto en `--superficie-hundida`), título «Gasto», «Ingreso», «Transferencia», «Devolución», «Inversión», «Desembolso», «Avance de efectivo», «Transferencia de deuda» y subtítulo corto («Con división y por cobrar»); nota «Solo aparecen los tipos que tus cuentas permiten: …».
- **Arreglo:** `F/registrar/lector.tsx` y `R/page.tsx` + textos del selector; agrupar retiro/ajuste dentro de «Inversión» («Aporte, retiro o ajuste») y la entrada a tarjeta dentro de la tarjeta correspondiente, o pedir diseño (ver Sin diseño).
- **Cómo verificar:** a 390 px se ve una cuadrícula 2 × 4 con íconos y la nota inferior.

### REG-02 · Flujos cortos: la cuenta se elige con radios en lugar de un selector con ícono y subtítulo — Registrar (ingreso, transferencia, tarjeta, desembolso) · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/registrar__ingreso__telefono-claro.png` y `registrar__transferencia__telefono-claro.png`: listas de radios («Cuenta corriente», «Cuenta de ahorro») bajo «Cuenta que recibe» / «Cuenta de origen» / «Cuenta de destino».
- **Debería:** `12-…/ingreso__telefono-claro.png`: selector de 52 con ícono de la cuenta, nombre 600 y subtítulo («Solo cuentas de efectivo»); transferencia: «Desde» (con «Saldo $1,284.60») y «Hacia».
- **Arreglo:** `F/registrar-tipo/formulario.tsx`: usar el selector de cuenta de Registrar gasto (`componentes/formularios/`, el que muestra «Visa Oro / Deuda $642.18») para estos campos; etiquetas «Cuenta», «Desde», «Hacia».
- **Cómo verificar:** no hay radios para elegir cuenta en los flujos cortos.

### REG-03 · Radios sin nombre accesible — Registrar · telefono-claro y computadora-claro · media
- **Se ve:** `analisis/registrar__ingreso.md`: «Tocables sin nombre accesible (2): button@32,348; button@32,396» (`role="radio"`, nombre vacío en `medidas/registrar__ingreso__telefono-claro.json`); 4 en transferencia, 4 en transferencia-deuda, 3 en desembolso; en `registrar__cargando` dos enlaces vacíos de 270 × 44.
- **Debería:** DECISIONES regla 8 y PANTALLAS §11: todo control con nombre accesible.
- **Arreglo:** `aria-labelledby` hacia el texto de cada radio (si se mantienen) en `F/registrar-tipo/formulario.tsx`; los enlaces del loading (`R/loading.tsx`) con `aria-hidden` o texto.
- **Cómo verificar:** el análisis da 0 «sin nombre».

### REG-04 · Fecha y Total apilados en vez de dos columnas; «Monto» en lugar de «Total» — Registrar (flujos cortos) · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/registrar__ingreso__telefono-claro.png`: Fecha (ancho completo), luego Monto debajo, sin prefijo «$» (el «Se entiende como $925.00» lo reemplaza).
- **Debería:** `12-…/ingreso__telefono-claro.png`: Fecha y Total en dos columnas, Total con prefijo «$».
- **Arreglo:** `F/registrar-tipo/formulario.tsx` y `componentes/formularios/` (campo de monto con prefijo, el de Registrar gasto).
- **Cómo verificar:** coinciden las dos columnas y el prefijo.

### REG-05 · Flujos cortos sin el impacto antes de guardar — Registrar (ingreso, transferencia, devolución, inversión, tarjeta, desembolso) · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/registrar__ingreso__telefono-claro.png`, `registrar__transferencia__telefono-claro.png`: ninguna fila de impacto; solo el botón.
- **Debería:** ingreso: contenedor «Listo para asignar $312.40 → $1,237.40»; transferencia: «No cambia el presupuesto.» (`12-…/ingreso__*`, `transferencia__*`).
- **Arreglo:** montar `ConfirmacionImpacto` (`componentes/formularios/confirmacion-impacto.tsx`) en vivo en `F/registrar-tipo/formulario.tsx` (hoy solo se muestra tras confirmar, ver `registrar__retroactivo`).
- **Cómo verificar:** al escribir un monto aparece la fila de impacto.

### REG-06 · Pie de la hoja sin «Cancelar» y con el botón sin monto — Registrar (flujos cortos) · telefono-claro y computadora-claro · media
- **Se ve:** un solo botón «Guardar ingreso» / «Transferir» a todo el ancho.
- **Debería:** `12-…/ingreso__telefono-claro.png`: dos botones iguales, «Cancelar» (tonal) y «Guardar $925.00» (principal); «Transferir $100.00».
- **Arreglo:** pie del flujo corto en `F/registrar-tipo/formulario.tsx` y `componentes/formularios/`.
- **Cómo verificar:** coinciden las etiquetas y el par de botones.

### REG-07 · Textos auxiliares que el diseño no tiene — Registrar (flujos cortos) · telefono-claro · baja
- **Se ve:** «Fecha elegida: 15/10/2026» y «Se entiende como $925.00» bajo los campos.
- **Debería:** no aparecen en `12-…/ingreso__telefono-claro.png`.
- **Arreglo:** pasarlos a `aria-live` visualmente oculto o proponer el diseño (si responden a una regla de 05 que el diseño no recogió).
- **Cómo verificar:** no se ven; se anuncian por lector.

### REG-08 · Título de la hoja de transferencia — Registrar · telefono-claro · baja
- **Se ve:** «TRANSFERIR ENTRE CUENTAS».
- **Debería:** «TRANSFERENCIA» (`12-…/transferencia__telefono-claro.png`); «REGISTRAR INGRESO» coincide.
- **Arreglo:** `textos/` del flujo.
- **Cómo verificar:** título coincide.

### REG-09 · Fecha en período cerrado: confirmación sin el aviso titulado, sin el período y con otros botones — Registrar · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/registrar__retroactivo__telefono-claro.png`: título «REVISÁ EL IMPACTO», una sola fila «Listo para asignar cambia +$925.00.», advertencia sin título ni fechas del período, botones «Volver a editar» y «Confirmar».
- **Debería:** `12-…/retroactivo__telefono-claro.png`: título «REGISTRAR GASTO OLVIDADO» con el campo Fecha, aviso `advertencia` «Cambio retroactivo. La fecha cae en un período cerrado (21/08 – 20/09). Se registra allí y lo posterior se recalcula.», tres filas de impacto («Listo para asignar hoy $312.40 → $279.15», «Supermercado · Disponible», «Reducción proyectada al cierre») y «Cancelar» + «Confirmar y guardar». (La captura usa un ingreso; la referencia un gasto: diferencia de caso, no de composición.)
- **Arreglo:** `componentes/formularios/confirmacion-impacto-de-vista.tsx` y `textos/formularios.ts`.
- **Cómo verificar:** el aviso trae título y período; botones «Cancelar»/«Confirmar y guardar».

### REG-10 · Registrar gasto: el impacto «Antes de guardar» solo aparece al pulsar Guardar — Registrar gasto · telefono-claro, telefono-oscuro y computadora-claro · alta
- **Se ve:** `capturas/registrar-gasto__principal__telefono-claro.png` y `__computadora-claro.png`: con 3 líneas completas no hay bloque de impacto (`F/registrar-gasto/formulario.tsx:217-233` solo lo monta en estado `confirmando`).
- **Debería:** `entrega-1/referencia/S5-Registrar__telefono-claro.png` y `__computadora-claro.png`: contenedor «ANTES DE GUARDAR» con «Visa Oro · deuda $642.18 → $790.78», «Supermercado $62.85 → −$33.25» con el indicador «Deuda sin reservar», «Farmacia $27.65 → $5.15», «Carlos te debe $40.00 → $70.00» (PANTALLAS §8.6, DECISIONES «Registrar gasto»).
- **Arreglo:** previsualización en vivo (misma operación de previsualización, con espera) en `formulario.tsx`, usando `confirmacion-impacto-de-vista.tsx`.
- **Cómo verificar:** con A.7 y 3 líneas, aparece el bloque antes de tocar Guardar.

### REG-11 · Registrar gasto: suma distinta del total sin aviso de problema y con Guardar activo — Registrar gasto · telefono-claro y computadora-claro · alta
- **Se ve:** `capturas/registrar-gasto__suma-distinta-del-total__telefono-claro.png`: «Falta repartir $10.00» como texto secundario sin glifo; el botón sigue «Guardar $148.60» activo.
- **Debería:** `S5-Registrar__suma-distinta-del-total.png`: aviso `problema` con glifo y color («Faltan $10.00 por repartir. La suma tiene que ser igual al total.», `role="alert"`) y «Guardar» deshabilitado con el motivo «La suma de las líneas no coincide con el total.» debajo (DECISIONES «Registrar gasto»; regla 2 tres señales).
- **Arreglo:** `F/registrar-gasto/lineas.tsx` y `formulario.tsx`: `AvisoEnLinea estado="problema"` y `disabled` + `aria-describedby` en el botón del pie.
- **Cómo verificar:** con diferencia, el botón está deshabilitado y el aviso tiene glifo y rol.

### REG-12 · Registrar gasto: etiquetas, ayuda de cuenta y placeholder de la nota — Registrar gasto · telefono-claro y computadora-claro · media
- **Se ve:** «Cuenta o tarjeta», «Total del gasto»; sin «Propuesta: la cuenta que más usás en PRICESMART.»; Nota sin «Hasta 500 caracteres»; `analisis/registrar-gasto__principal.md`: faltan 7 textos / sobran 2.
- **Debería:** S5: «Cuenta», «Total», la línea de propuesta en `--texto-terciario`, placeholder «Hasta 500 caracteres».
- **Arreglo:** `textos/formularios.ts` y `F/registrar-gasto/formulario.tsx`.
- **Cómo verificar:** coinciden los textos de S5.

### REG-13 · Registrar gasto: detalle de las líneas — Registrar gasto · telefono-claro · baja
- **Se ve:** `capturas/registrar-gasto__principal__telefono-claro.png`: el monto con «$» separado a la izquierda del campo; «+ Agregar línea» alineado a la izquierda; «Carlos (me lo …» truncado.
- **Debería:** S5: el monto es «$96.10» alineado a la derecha en el campo; «+ Agregar línea» centrado; la categoría parte en dos líneas «Carlos (me lo / debe)».
- **Arreglo:** `F/registrar-gasto/lineas.tsx` y `parte.tsx`.
- **Cómo verificar:** coincide el dibujo de las líneas.

### REG-14 · Registrar gasto: pie y márgenes — Registrar gasto · telefono-claro y telefono-oscuro · media
- **Se ve:** texto a 16 px del borde (`analisis/registrar-gasto__*.md`: «margen izq 16»); el `main` mide 1080 px de máximo en teléfono (`max=1080px`).
- **Debería:** 20 px laterales (DECISIONES «Marco»); el pie fijo sí lleva 16 px.
- **Arreglo:** igual que BAN-03.
- **Cómo verificar:** x=20.

### REG-15 · Guardado: título, enlaces por línea y falta «Ver transacción» — Registrar gasto · telefono-claro y computadora-claro · media
- **Se ve:** `capturas/registrar-gasto__guardado__telefono-claro.png`: título «GASTO REGISTRADO»; enlaces «Ver Supermercado», «Ver Farmacia» (sin Carlos), «Registrar otro» y «Volver a Inicio».
- **Debería:** `S5-Registrar__guardado.png`: título «REGISTRAR GASTO», un único enlace «Ver transacción» dentro de la tarjeta de resultado; las cifras por línea en una tarjeta (con su contenedor interno).
- **Arreglo:** `F/registrar-gasto/resultado-gasto.tsx` y `textos/`.
- **Cómo verificar:** un solo «Ver transacción»; título igual a S5.

### REG-16 · Registrar gasto en computadora: ancho, enlace de vuelta y barra lateral — Registrar gasto · computadora-claro · media
- **Se ve:** `capturas/registrar-gasto__principal__computadora-claro.png`: `main` de 1144 px con dos columnas, «X» a la izquierda del título, ningún ítem activo en la barra lateral, campana presente.
- **Debería:** `S5-Registrar__computadora-claro.png`: enlace «← Inicio» sobre el título, ítem «Inicio» activo en la barra, impacto en la columna derecha. DECISIONES dice flujos con `max-width: 720px`; el propio S5 mide ≈ 1144 con dos columnas (ver Contradicciones).
- **Arreglo:** `R/gasto/page.tsx`: enlace de vuelta y estado activo de la barra según el origen.
- **Cómo verificar:** coincide el encabezado y la barra lateral.

## Candidatos a global

- BAN-02: botón «Registrar» sin etiqueta a ≤ 400 px (`acceso-registrar.tsx`), en toda pantalla de pestaña.
- BAN-03: margen lateral de contenido 16 px en lugar de 20 (marco de teléfono).
- BAN-04: acciones de fila como enlace subrayado en vez de botón de texto o tonal (`movimiento-bandeja.tsx`); revisar el uso de enlaces subrayados como botones en toda la app.
- BAN-18: «Descartar» como botón tonal de ancho completo en vez de botón de texto (patrón de pie de flujo).
- BAN-19: chips «Hoy/Ayer» en `entrada-fecha.tsx` (no están en el diseño) y casillas de 20 × 20.
- BAN-06: resultados de acción dentro del contenedor de la lista en lugar de tarjeta propia (`componentes/base/resultado.tsx`).
- REG-02/REG-03: radios sin nombre accesible y selección de cuenta con radios en lugar del selector.
- REG-10/BAN-14: impacto «Antes de guardar»/«Después de aprobar» solo en el paso de confirmar y no en vivo (patrón en `componentes/formularios/confirmacion-impacto*.tsx`).
- REG-11: avisos de validación como texto secundario en vez de `AvisoEnLinea estado="problema"`, y botón principal sin deshabilitar.

## Sin diseño

Estados que el diseño no tiene (FALTANTES o inventados por la app); cada uno con su captura en `docs/auditoria-diseno/capturas/<id>__telefono-claro.png`:

- Aprobar todos (FALTANTES `aprobar-todos`): `bandeja__aprobar-todos`, `bandeja__aprobar-todos-resultado`. El botón «Aprobar todos (1)» entre el resumen y la lista no existe en S4 ni en PANTALLAS §7.
- Borrador recuperado (FALTANTES `borrador`): `registrar-gasto__borrador`.
- Vacío de Descartados, resultado de Restaurar, referencia copiada, sin conexión y error al aprobar en la fila: `bandeja__descartados-vacio`, `bandeja__restaurado`, `bandeja__referencia-copiada`, `bandeja__sin-conexion`, `bandeja__error-al-aprobar`.
- Arrastre a categoría y «Elegir categoría» (FT-78, CH-220 A10): `bandeja__arrastre-destinos` (no capturado el estado de arrastre: solo se ve el asa con foco; los destinos requieren un arrastre real de dnd), `bandeja__otra-categoria`.
- Revisar: tipo Ingreso, registrar a mano, descartado a pantalla completa, 404, sin cuentas, sin conexión, error de red, aprobando, validación, datos faltantes, confirmar período cerrado, muchos: `revisar__ingreso`, `revisar__no-reconocido-a-mano`, `revisar__descartado`, `revisar__no-encontrado`, `revisar__sin-cuentas`, `revisar__sin-conexion`, `revisar__error-de-red`, `revisar__aprobando`, `revisar__validacion`, `revisar__datos-faltantes`, `revisar__confirmar-periodo-cerrado`, `revisar__muchos`.
- Registrar tipos: retiro y ajuste de inversión, entrada a tarjeta («Dinero que entra a una tarjeta»), confirmación de avance, una sola cuenta de efectivo, 404 y sin cuentas, validación, sin conexión y guardado de ingreso, página de ingreso, carga del selector: `registrar__inversion-retiro`, `registrar__inversion-ajuste`, `registrar__entrada-tarjeta`, `registrar__avance-confirmar`, `registrar__transferencia-una-cuenta`, `registrar__no-encontrado`, `registrar__sin-cuentas`, `registrar__ingreso-validacion`, `registrar__ingreso-sin-conexion`, `registrar__ingreso-guardado`, `registrar__ingreso-pagina`, `registrar__cargando`.
- Registrar gasto: sin cuentas, fecha inexistente, fecha posterior, calendario, validación, error de red, sin conexión, suma rechazada, otra persona: `registrar-gasto__sin-cuentas`, `registrar-gasto__fecha-no-existe`, `registrar-gasto__fecha-posterior`, `registrar-gasto__calendario`, `registrar-gasto__validacion`, `registrar-gasto__error-de-red`, `registrar-gasto__sin-conexion`, `registrar-gasto__suma-rechazada`, `registrar-gasto__otra-persona`.

Contradicciones entre fuentes de diseño (para el CH, no se resolvieron): DECISIONES fija «Flujos y formularios con `max-width: 720px`» en computadora, mientras `S5-Registrar__computadora-claro.png` y `01-revisar-movimiento/listo__computadora-claro.png` mide ≈ 1144 con dos columnas/panel. La app usa 720 en los flujos cortos y 1144 en Registrar gasto, así que cumple una u otra según la pantalla. Además, DECISIONES manda 20 px laterales y los PNG de teléfono de Revisar miden 20-21 px: coinciden.
