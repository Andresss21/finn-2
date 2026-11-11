# Pantallas y estados sin diseño

Lo que la app real muestra sin una referencia aprobada en `docs/diseno/`: o está en `docs/diseno/01-especificacion/FALTANTES.md`, o la app lo agregó por su cuenta. Es la lista de trabajo para el agente de diseño (ver `PROMPT-DISENO.md`). Cada entrada lleva su captura en `capturas/<id>__<variante>.png`.

## Acceso y marco (ACC, GLO-1nn)

| Pantalla o estado | Captura |
|---|---|
| Validación de campos vacíos en Ingresar | `capturas/acceso__ingresar-validacion__telefono-claro.png` |
| Contraseña visible | `capturas/acceso__ingresar-contrasena-visible__telefono-claro.png` |
| Ingresar sin conexión | `capturas/acceso__ingresar-sin-conexion__telefono-claro.png` |
| Sesión vencida (FALTANTES `sesion-vencida`) | `capturas/acceso__sesion-vencida__telefono-claro.png` |
| Verificar incompleto (6 casillas a medias) | `capturas/acceso__verificar-incompleto__telefono-claro.png` |
| Inscribir: preparando, copiado y error | `capturas/acceso__inscribir-preparando__…`, `acceso__inscribir-copiado__…`, `acceso__inscribir-error__telefono-claro.png` |
| Alta de usuario, olvidé mi contraseña (FALTANTES `alta-usuario`, `olvide`) | sin pantalla; solo el párrafo de ACC-09 |
| Navegación bloqueada sin conexión | `capturas/estado__sin-conexion-navegacion-bloqueada__telefono-claro.png` |
| Aviso de actualización de la PWA | `capturas/estado__actualizacion-pwa__telefono-claro.png` |
| 404 fuera de la app | `capturas/estado__404-fuera__telefono-claro.png` |
| Página sin conexión con borrador | `capturas/estado__sin-conexion-pagina-con-borrador__telefono-claro.png` |
| Panel de notificaciones: vacío y «todo leído» | `capturas/notificaciones-panel__vacio__telefono-claro.png`, `notificaciones-panel__todo-leido__telefono-claro.png` |
| Quitar un factor (FALTANTES `factor-quitar`) | no capturado: es del agente de Ajustes |

## Inicio y Presupuesto (INI, PRE)

- `inicio__activar-notificaciones` (`capturas/inicio__activar-notificaciones__telefono-claro.png`): tarjeta «Activar notificaciones» de FT-06 (FALTANTES `permiso-push`); se fuerza el permiso en «default». Se ve como una tarjeta blanca con título «ACTIVAR NOTIFICACIONES», texto, botón primario y «Ahora no», con 20 de margen.
- `asignar__pagina-completa` y `auto-asignar__pagina-completa` (`capturas/pliegue/…`): las rutas se pueden abrir por URL como páginas completas (con «×», sin barra inferior ni campana); el diseño solo trae la hoja. Con la hoja del teléfono y el panel de computadora (≈ 420 px de ancho; la referencia, 440) cubierto, la página completa es un estado propio sin referencia.
- `estructura__nuevo-grupo`, `estructura__nueva-categoria`, `estructura__editar-grupo` (FALTANTES `grupo-editar`), `estructura__error-nombre-vacio`: hojas inferiores sin tablero; coherentes con las demás hojas, el botón «Eliminar grupo» es un peligro sólido de ancho completo.
- `mover__resultado`: el resultado de mover no tiene PNG (ver PRE-42).
- Selector de período «Elegir otro período» (FALTANTES `periodos`), archivadas como pantalla propia (`archivadas`), `cierre-periodo` e `instalar`: no hay pantalla en la app en esta sección.
- **Referencias en conflicto (para un CH):** el estado «primer uso sin cuentas» tiene dos diseños: `T/S1-Inicio__primer-uso-sin-cuentas.png` («Empecemos», 3 pasos numerados, botón «Agregar una cuenta»; PANTALLAS §4) y `E2/15-…/primeros-pasos-sin-cuentas__*` («Primeros pasos · 0 de 3» con nota). La app implementa el de la entrega 2 (INI-16).

## Detalle de categoría y Metas (CAT, MAS-0nn)

- **Categoría archivada** (`categoria__archivada`, `categoria-mas__archivada`): FALTANTES `archivadas`. La app muestra «Categoría archivada» como texto plano, «Sacar el dinero» y «Desarchivar» como botones tonales.
- **Resultado de «Desarchivar»** (`categoria-sacar__desarchivar`): sin referencia.
- **Detalle con período cerrado** (`categoria__periodo-cerrado`, `categoria-mas__periodo-cerrado`): solo existe la especificación escrita (PANTALLAS §2.6, §2.15); no hay PNG de detalle cerrado.
- **Editar una meta** (`meta__editar`, `meta__editar-vencida`, `meta__editar-extender`, `meta__editar-eliminar`, `meta__editar-no-encontrada`): INDICE-entrega-2 dice «nueva y editar como flujo corto», pero solo existe `nueva`. FALTANTES `meta-vencida` (extender o ajustar) tampoco tiene pantalla propia.
- **Nueva meta sin categorías** (`meta__nueva-sin-categorias`: «Todas tus categorías ya tienen meta.») y **errores de la nueva meta** (`meta__nueva-error-*`): sin referencia.
- **Menú Más acciones con período cerrado o categoría archivada:** sin referencia.
- **Paso «Revisá el impacto»** de archivar y fusionar: no está en el diseño (CAT-22).
- **Entrada «Nueva meta»** de la lista: sin diseño (MAS-005).

## Bandeja y Registrar (BAN, REG)

Estados que el diseño no tiene (FALTANTES o inventados por la app); cada uno con su captura en `docs/auditoria-diseno/capturas/<id>__telefono-claro.png`:

- Aprobar todos (FALTANTES `aprobar-todos`): `bandeja__aprobar-todos`, `bandeja__aprobar-todos-resultado`. El botón «Aprobar todos (1)» entre el resumen y la lista no existe en S4 ni en PANTALLAS §7.
- Borrador recuperado (FALTANTES `borrador`): `registrar-gasto__borrador`.
- Vacío de Descartados, resultado de Restaurar, referencia copiada, sin conexión y error al aprobar en la fila: `bandeja__descartados-vacio`, `bandeja__restaurado`, `bandeja__referencia-copiada`, `bandeja__sin-conexion`, `bandeja__error-al-aprobar`.
- Arrastre a categoría y «Elegir categoría» (FT-78, CH-220 A10): `bandeja__arrastre-destinos` (no capturado el estado de arrastre: solo se ve el asa con foco; los destinos requieren un arrastre real de dnd), `bandeja__otra-categoria`.
- Revisar: tipo Ingreso, registrar a mano, descartado a pantalla completa, 404, sin cuentas, sin conexión, error de red, aprobando, validación, datos faltantes, confirmar período cerrado, muchos: `revisar__ingreso`, `revisar__no-reconocido-a-mano`, `revisar__descartado`, `revisar__no-encontrado`, `revisar__sin-cuentas`, `revisar__sin-conexion`, `revisar__error-de-red`, `revisar__aprobando`, `revisar__validacion`, `revisar__datos-faltantes`, `revisar__confirmar-periodo-cerrado`, `revisar__muchos`.
- Registrar tipos: retiro y ajuste de inversión, entrada a tarjeta («Dinero que entra a una tarjeta»), confirmación de avance, una sola cuenta de efectivo, 404 y sin cuentas, validación, sin conexión y guardado de ingreso, página de ingreso, carga del selector: `registrar__inversion-retiro`, `registrar__inversion-ajuste`, `registrar__entrada-tarjeta`, `registrar__avance-confirmar`, `registrar__transferencia-una-cuenta`, `registrar__no-encontrado`, `registrar__sin-cuentas`, `registrar__ingreso-validacion`, `registrar__ingreso-sin-conexion`, `registrar__ingreso-guardado`, `registrar__ingreso-pagina`, `registrar__cargando`.
- Registrar gasto: sin cuentas, fecha inexistente, fecha posterior, calendario, validación, error de red, sin conexión, suma rechazada, otra persona: `registrar-gasto__sin-cuentas`, `registrar-gasto__fecha-no-existe`, `registrar-gasto__fecha-posterior`, `registrar-gasto__calendario`, `registrar-gasto__validacion`, `registrar-gasto__error-de-red`, `registrar-gasto__sin-conexion`, `registrar-gasto__suma-rechazada`, `registrar-gasto__otra-persona`.

Contradicciones entre fuentes de diseño (para el CH, no se resolvieron): DECISIONES fija «Flujos y formularios con `max-width: 720px`» en computadora, mientras `S5-Registrar__computadora-claro.png` y `01-revisar-movimiento/listo__computadora-claro.png` mide ≈ 1144 con dos columnas/panel. La app usa 720 en los flujos cortos y 1144 en Registrar gasto, así que cumple una u otra según la pantalla. Además, DECISIONES manda 20 px laterales y los PNG de teléfono de Revisar miden 20-21 px: coinciden.

## Actividad y Reportes (ACT, REP)

Tipos de reporte que la app muestra y no tienen referencia propia (FALTANTES `reportes-otros`); se capturaron igual:

- Flujo de efectivo: `capturas/reporte-flujo-efectivo__principal__telefono-claro.png` (y `-oscuro`, `computadora-claro`).
- Ritmo: `capturas/reporte-ritmo__principal__telefono-claro.png`.
- Realidad: `capturas/reporte-realidad__principal__telefono-claro.png`.
- Tarjetas: `capturas/reporte-tarjetas__principal__telefono-claro.png`, `capturas/reporte-tarjetas__con-ciclos__telefono-claro.png`.
- Hormiga: `capturas/reporte-hormiga__principal__telefono-claro.png`.
- Suscripciones: `capturas/reporte-suscripciones__principal__telefono-claro.png`.
- Remanente: `capturas/reporte-remanente__principal__telefono-claro.png`.
- Cumplimiento: `capturas/reporte-cumplimiento__principal__telefono-claro.png`.
- Patrimonio: `capturas/reporte-patrimonio__principal__telefono-claro.png`.
- Estado de carga de Reportes: `capturas/reportes__cargando__telefono-claro.png`.

Otros estados sin referencia propia (ya anotados como «sin referencia propia» en los casos): detalle de transacción dividida, por cobrar con cobro, con devolución y pendiente (`capturas/transaccion__dividida__…`, `transaccion__por-cobrar__…`, `transaccion__por-cobrar-con-cobro__…`, `transaccion__con-devolucion__…`, `transaccion__pendiente__…`); «Revisá el impacto» de la edición (`capturas/transaccion-editar__revisar-impacto__…`), «Revisar» de eliminar y de eliminar evento (`transaccion-eliminar__revisar__…`, `transaccion-eliminar-evento__revisar__…`), y devolver una compra dividida (`transaccion-devolver__dividida__…`). FALTANTES `editar-tx` («Editar transacción, estados completos») cubre los estados de edición: el diseño trae `editar`, `editar-conflicto` y `editar-cuenta-archivada`, y falta, por ejemplo, la edición de una dividida con conciliación, la edición con devolución (la app la resuelve con la cuenta fija y su motivo, que parece correcto) y el error de línea menor que los eventos.

Revisados solo por texto o sin comparar imagen: `actividad__cargando`, `reporte-gasto-semanal__tabla`, `__asignado-negativo`, `__categoria-nueva`, `__sin-movimientos`, `reporte-ingresos-gastos__principal`, `reporte-hallazgos__vacio`, `reportes__sin-movimientos`, y las variantes `telefono-oscuro` de todos los casos (se corrieron; solo se miró el estado principal por la analizadora).

## Cuentas (CTA)

- **Nueva cuenta · préstamo** (`capturas/cuenta-nueva__prestamo__telefono-claro.png`) y **inversión** (`cuenta-nueva__inversion`): FALTANTES `prestamo-alta` e `inversion-alta`.
- **Billetera**: identidad visual (`capturas/cuenta__billetera__telefono-claro.png`, y en la lista `cuentas__subtipos-y-tres-tarjetas`). FALTANTES `billetera`: hoy `--cuenta-banco` con ícono `wallet` provisorio y sin motivo.
- **Nueva cuenta · revisá el impacto** (`cuenta-nueva__revisar-impacto`).
- **Pagar tarjeta · revisá el pago y resultado «listo»** (`cuenta-pagar__mas-que-la-deuda`, `cuenta-pagar__listo*`).
- **Cuentas sin ninguna cuenta** (`cuentas__sin-cuentas`): vacío «Agregá tu primera cuenta» (PANTALLAS §2.19 da la forma, no hay tablero).
- **Una sola tarjeta** (`cuentas__una-tarjeta`): billetera sin apilar.
- **«Nueva cuenta» y «Ordenar»** como botones de la lista (`cuentas__principal`) y «Ordenar cuentas» en el menú.
- **Préstamo en la lista sin modelo**: talón «Sin modelo» (`cuentas__principal`).
- **Estado de carga de Cuentas** (`cuentas__cargando`): sin `loading` propio ni esqueleto.
- **Filtro sin resultados** (`cuenta__filtro-sin-resultados`) y **período cerrado** (`cuenta__periodo-anterior`).
- **Resultados «listo»** de verificar saldo, cuota, conciliar y desarchivar.
- **Archivar tarjeta con asignaciones futuras** («Devolverlas a Listo para asignar / Dejarlas como están»).
- **Verificar saldo de tarjeta** («Deuda que muestra tu banco»).
- **Cuenta no encontrada** (`cuenta__no-encontrada`): el 404 general con otro texto.

## Programadas, Por cobrar, Reglas, Notificaciones y Ajustes (MAS-1nn, AJU)

- `programada__nueva` (FALTANTES programada-nueva): `capturas/programada__nueva__telefono-claro.png`.
- `programada__editar-sin-historial` (estado editable de Editar): `capturas/programada__editar-sin-historial__telefono-claro.png`.
- `programada__ocurrencia-omitida` (resultado de Omitir): `capturas/programada__ocurrencia-omitida__telefono-claro.png`.
- `por-cobrar__cerrados` (FALTANTES cerrados): `capturas/por-cobrar__cerrados__telefono-claro.png`.
- `reglas__sin-coincidencias`, `regla__editar`, `regla__eliminar-confirmar`: sus capturas con esos ids.
- `ajustes-formatos__nuevo` y `ajustes-formatos__detalle` (FALTANTES formato-nuevo), `ajustes-instituciones__detalle`, `__nueva`, `__nueva-repetida` (FALTANTES institucion).
- `ajustes-notificaciones__sin-pedir` (FALTANTES permiso-push) y `ajustes-notificaciones__denegado`.
- `ajustes-seguridad__agregar-factor` y `…codigo-malo` (FALTANTES factor-nuevo), `ajustes-seguridad__quitar-factor` (FALTANTES factor-quitar).
- `ajustes-conectar-sms__cambiar` (advertencia antes de cambiar el token), `ajustes-diagnostico__sin-resultados`, `ajustes-respaldo__sin-respaldo`, `ajustes-diagnostico__sin-eventos`.
- `ajustes__cargando` y `ajustes__error` (proxies del marco).

## Global

| Pantalla o estado | Captura | Nota |
|---|---|---|
| Arrastrar un movimiento a una categoría: fila tomada, panel «Destinos del arrastre», destino resaltado, soltar | `capturas/bandeja__arrastre-tomado__video.png`, `bandeja__arrastre-sobre-destino__video.png`, `bandeja__arrastre-soltado__video.png` (y `__video-computadora`); `videos/arrastre__video.webm` | PANTALLAS §7 solo dice que es un atajo. Falta el aspecto de cada paso y su movimiento (GLO-13) |
| Marco entre 768 y 1024 px | `capturas/pliegue/resp-inicio__a7__ancho-768.png`, `resp-categoria__a7__ancho-768.png` | DECISIONES define solo 390 y 1440 (GLO-05) |
