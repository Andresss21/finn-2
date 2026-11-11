# Prompt para el agente de diseño · lo que falta diseñar después de auditar la app real

> Pegá todo lo que sigue al agente de diseño, junto con el paquete `finn-diseno-fuente` (y la entrega 3) y la carpeta `docs/auditoria-diseno/` de esta auditoría.

---

Vas a completar el diseño de Finn 2.0 (PWA de presupuesto base cero para El Salvador: USD, español con voseo, movimientos que llegan por SMS). Una auditoría de la **app real** (no de la demo), pantalla por pantalla y estado por estado, encontró pantallas y estados que la app ya muestra pero que **no tienen diseño**, diseños **incompletos** y **contradicciones** que solo diseño puede resolver. Este prompt te las entrega ordenadas.

## Cómo trabajar

- Fuentes, en este orden: `01-especificacion/DECISIONES.md` (y la sección "Entrega 3" de `entrega-3/DECISIONES.md`) > `tokens.css` > PNG/HTML de referencia > `PANTALLAS.md` > demo. Leé `AGENTES.md` y `FALTANTES.md`.
- Para cada pantalla o estado nuevo: mirá primero la **captura de la app** que te indico (`docs/auditoria-diseno/capturas/<id>__<variante>.png`; `capturas/pliegue/` es lo que se ve al abrir), porque muestra qué datos, textos y acciones existen de verdad. Diseñá sobre eso; no copies la composición de la app si contradice el sistema.
- Entregá con el mismo formato que la entrega 2: cada estado en **teléfono claro, teléfono oscuro y computadora claro**, PNG + HTML con `data-rol` en cada texto y solo `var(--token)`; una entrada en un `INDICE-entrega-4.md`; contraste medido en los dos temas. Un valor nuevo va a `tokens-propuesta.css` con su motivo.
- Usá componentes existentes (`PANTALLAS.md` §2, K2–K5, P1-01 a P1-05). Si hace falta uno nuevo, decilo y justificalo.
- Al terminar cada ítem, marcalo en `FALTANTES.md` como diseñado. Cada decisión que cambie algo anterior va a `DECISIONES.md` con fecha y motivo.
- **Lo que no es tuyo:** los errores de funcionamiento o de implementación (flujos rotos, desbordes, componentes mal usados donde el diseño ya existe) los arregla desarrollo con `docs/auditoria-diseno/PROMPT-FIXES.md`. Acá solo entra lo que exige una decisión o un dibujo que hoy no existe.

## Prioridad 1 · Decisiones que bloquean a desarrollo

Sin estas respuestas, desarrollo no puede cerrar hallazgos ya abiertos. Para cada una, resolvé y anotá la decisión en `DECISIONES.md`.

| # | Pregunta | Evidencia | Hallazgos que destraba |
|---|---|---|---|
| D-1 | **Ancho de los flujos en computadora.** DECISIONES dice `max-width: 720px` para flujos y formularios, pero `S5-Registrar__computadora-claro.png` y `01-revisar-movimiento/listo__computadora-claro.png` miden ~1144 px con dos columnas o panel. ¿Cuáles flujos van a 720 y cuáles a 1144? | `secciones/40-ban-reg.md` (BAN-01, REG-16) | BAN-01, REG-16, CAT-32 |
| D-2 | **Marco entre 768 y 1024 px.** DECISIONES define 390 y 1440. Hoy a 768 la app pone la barra lateral de 248 y deja 424 px útiles: el selector de período se parte en cinco líneas y el detalle de categoría desborda. ¿Desde qué ancho va la barra lateral? ¿Qué relleno hay en el medio? | `capturas/pliegue/resp-inicio__a7__ancho-768.png`, `resp-categoria__a7__ancho-768.png` | GLO-05, GLO-06 |
| D-3 | **«Asignar $X» de Inicio.** PANTALLAS §2.8 y §11: abre la hoja Asignar. Los criterios de la app (CA-08.11, P6-26) lo llevan a Presupuesto filtrado por «sin fondos». ¿Qué manda? Si es la hoja: ¿asignar sin categoría elegida cómo se ve? | `capturas/inicio__asignar-boton__telefono-claro.png` | INI-02 |
| D-4 | **Sobregiros en «Necesita tu atención» sin monto.** S1 muestra −$26.30 en la fila; la app aplica una regla propia (PF-2) de no mostrar montos ahí. ¿Va el monto? | `capturas/inicio__principal__telefono-claro.png` | INI-05 |
| D-5 | **Asignar en un período cerrado.** El diseño 07 muestra una hoja con el motivo; el criterio CA-10.8 redirige al detalle. ¿Cuál? | `capturas/asignar__periodo-cerrado__telefono-claro.png` | PRE-37 |
| D-6 | **Mover más que el Disponible.** El diseño `07/mover-excede` bloquea; CA-11.2 lo acepta con aviso. ¿Bloquea o avisa? | `capturas/mover__excede__telefono-claro.png` | PRE-41 |
| D-7 | **Primer uso sin cuentas: dos referencias.** `tableros/S1-Inicio__primer-uso-sin-cuentas.png` («Empecemos», 3 pasos numerados) y `entrega-2/…/15-…/primeros-pasos-sin-cuentas__*` («Primeros pasos · 0 de 3»). La app sigue la de la entrega 2. ¿Cuál queda? | `capturas/inicio__primeros-pasos-sin-cuentas__telefono-claro.png` | INI-16 |
| D-8 | **Columna de filtros de Actividad en computadora:** la referencia mide 320 px; la app y su prueba usan 260. | `capturas/actividad__filtros-abiertos__computadora-claro.png` | ACT-07 |
| D-9 | **Texto de devolver:** «Devolver a» (app) frente a «Vuelve a» (referencia). | `capturas/transaccion-devolver__principal__telefono-claro.png` | ACT-29 |
| D-10 | **Aprobar los pendientes de la entrega 3:** los tres tokens de `tokens-propuesta.css` (`--duracion-temblor`, `--retardo-cascada`, `--duracion-confirmacion`) y el fix del texto del aviso sin conexión (`FIX-aviso-sin-conexion.md`). Además, la app usa 18 variables de movimiento con nombres propios (`--duracion-sacudida`, `--espera-verificado`, `--escalonado-*`…): decidí cuáles se vuelven tokens y cuáles se mapean a los aprobados. | `secciones/00-glo.md` GLO-09 | GLO-09, GLO-11 |

## Prioridad 2 · Estados que la app muestra y no tienen diseño

Ordenados por cuánto los ve el usuario. Las capturas están todas en `docs/auditoria-diseno/capturas/`; la lista completa, con cada id, está en `docs/auditoria-diseno/SIN-DISENO.md`.

### 2.1 · Flujos que el usuario recorre seguido

1. **Arrastrar un movimiento a una categoría (Bandeja).** La app lo tiene (FT-78) y el diseño solo dice en PANTALLAS §7 que «es un atajo; los botones siempre están». Hoy: asa ⋮⋮ visible junto a «Aprobar», pastilla flotante «Super · $12.00», panel inferior «Destinos del arrastre» con «Sugerida: Super» y «Otra categoría…», el destino solo cambia de fondo y al soltar la pastilla desaparece sin animación. Diseñá: el asa (¿visible siempre o solo al tocar?), la fila levantada, el panel de destinos en teléfono y computadora, el destino resaltado, el soltar y el resultado, **y su movimiento** (agregalo a la tabla de §11), con la versión de teclado y lector de pantalla. Capturas `bandeja__arrastre-tomado__video.png`, `bandeja__arrastre-sobre-destino__video.png`, `bandeja__arrastre-soltado__video.png` (y `__video-computadora`); video `docs/auditoria-diseno/videos/arrastre__video.webm`.
2. **Aprobar todos** (FALTANTES `aprobar-todos`): botón y resultado. `bandeja__aprobar-todos`, `bandeja__aprobar-todos-resultado`.
3. **Borrador recuperado** (FALTANTES `borrador`): «Recuperamos lo que estabas escribiendo» en Registrar gasto. `registrar-gasto__borrador`.
4. **Editar transacción, estados completos** (FALTANTES `editar-tx`): editar una dividida, con devolución, con conciliación, y el error de línea menor que los eventos. `transaccion-editar__dividida`, `transaccion-editar__con-devolucion`.
5. **Editar una meta y meta vencida** (FALTANTES `meta-vencida`): solo existe `09a-metas/nueva`. `meta__editar`, `meta__editar-vencida`, `meta__editar-extender`, `meta__editar-eliminar`.
6. **Nueva programada** (FALTANTES `programada-nueva`) y editar sin historial. `programada__nueva`, `programada__editar-sin-historial`, `programada__ocurrencia-omitida`.
7. **Alta de préstamo y de inversión** (FALTANTES `prestamo-alta`, `inversion-alta`). `cuenta-nueva__prestamo`, `cuenta-nueva__inversion`.
8. **Identidad de la billetera** (FALTANTES `billetera`): hoy `--cuenta-banco` con el ícono `wallet` provisorio y sin motivo. `cuenta__billetera`, `cuentas__subtipos-y-tres-tarjetas`.
9. **Agregar y quitar un factor** (FALTANTES `factor-nuevo`, `factor-quitar`): QR, clave, código en 6 casillas, resultado; y la confirmación de quitar cuando hay dos o más. `ajustes-seguridad__agregar-factor`, `ajustes-seguridad__agregar-factor-codigo-malo`, `ajustes-seguridad__quitar-factor`.

### 2.2 · Acceso y sesión

10. **Sesión vencida a mitad de un flujo** (FALTANTES `sesion-vencida`). `acceso__sesion-vencida`.
11. **Alta de usuario y «Olvidé mi contraseña»** (FALTANTES `alta-usuario`, `olvide`): la app no tiene pantalla y muestra un párrafo propio en Ingresar (ACC-09). Decidí si existen y cómo se ven.
12. **Validación de campos vacíos, contraseña visible e Ingresar sin conexión.** `acceso__ingresar-validacion`, `acceso__ingresar-contrasena-visible`, `acceso__ingresar-sin-conexion`.
13. **Inscribir: preparando, copiado y error.** `acceso__inscribir-preparando`, `acceso__inscribir-copiado`, `acceso__inscribir-error`.

### 2.3 · Reportes sin diseño (FALTANTES `reportes-otros`)

14. La app muestra nueve tipos de reporte sin referencia: **flujo de efectivo, ritmo, realidad, tarjetas (con ciclos), hormiga, suscripciones, remanente, cumplimiento y patrimonio** (`reporte-<tipo>__principal`, `reporte-tarjetas__con-ciclos`). Diseñalos con la plantilla común de §2.18 y `04-reportes` (cifra grande, gráfico con leyenda, selector Gráfico / Tabla, tabla equivalente, tres señales). Ojo: tendencia como tabla, tarjetas y cumplimiento hoy desbordan a 429 px en el teléfono; el diseño tiene que decir cómo se desplazan las tablas anchas.

### 2.4 · Ajustes, Programadas, Por cobrar, Reglas

15. **Nuevo formato bancario y su detalle** (FALTANTES `formato-nuevo`); **nueva institución, detalle y nombre repetido** (FALTANTES `institucion`). `ajustes-formatos__nuevo`, `ajustes-formatos__detalle`, `ajustes-instituciones__*`.
16. **Permiso de notificaciones** (FALTANTES `permiso-push`): la tarjeta «Activar notificaciones» de Inicio y Ajustes › Notificaciones sin pedir y denegado. `inicio__activar-notificaciones`, `ajustes-notificaciones__sin-pedir`, `ajustes-notificaciones__denegado`.
17. **Por cobrar cerrados** (FALTANTES `cerrados`). `por-cobrar__cerrados`.
18. **Reglas: editar, eliminar y búsqueda sin resultados.** `regla__editar`, `regla__eliminar-confirmar`, `reglas__sin-coincidencias`.
19. **Conectar SMS: advertencia antes de cambiar el token;** diagnóstico sin eventos y sin resultados; respaldo sin respaldo. `ajustes-conectar-sms__cambiar`, `ajustes-diagnostico__sin-eventos`, `ajustes-diagnostico__sin-resultados`, `ajustes-respaldo__sin-respaldo`.

### 2.5 · Presupuesto, categorías y cuentas

20. **Estructura:** nuevo grupo, editar grupo (FALTANTES `grupo-editar`), nueva categoría y error de nombre vacío. `estructura__nuevo-grupo`, `estructura__editar-grupo`, `estructura__nueva-categoria`, `estructura__error-nombre-vacio`. Ojo con D-1: el diseño 08 pide flujo largo para editar categoría y la app usa hojas.
21. **Categoría archivada, resultado de desarchivar y detalle en período cerrado** (FALTANTES `archivadas`). `categoria__archivada`, `categoria-mas__archivada`, `categoria-sacar__desarchivar`, `categoria__periodo-cerrado`, `categoria-mas__periodo-cerrado`.
22. **Pasos «Revisá el impacto»** (corregido el 11/11/2026): no se quitan. Son el paso de previsualizar y confirmar de 05 §4.4 (FE-07), aprobado; 06 P6-27 a) / CA-21.12 además quita «Antes de guardar» de Registrar gasto. Lo que falta es diseñar ese paso con el componente K4 «confirmación del impacto» en cada flujo: `categoria-archivar__impacto`, `categoria-fusionar__impacto`, `cuenta-nueva__revisar-impacto`, `transaccion-editar__revisar-impacto`, `transaccion-eliminar__revisar`, `transaccion-eliminar-evento__revisar`, `cuenta-pagar__mas-que-la-deuda`.
23. **Resultados «listo»** de verificar saldo, pagar cuota, conciliar, mover dinero y desarchivar; **verificar saldo de una tarjeta** («Deuda que muestra tu banco»); **archivar una tarjeta con asignaciones futuras**. `cuenta-verificar-saldo__listo-con-ajuste`, `cuenta-cuota__listo`, `cuenta-conciliar__resultado`, `mover__resultado`, `cuenta-verificar-saldo__tarjeta`, `cuenta-archivar__tarjeta`.
24. **Cuentas vacías, una sola tarjeta y préstamo sin modelo en la lista.** `cuentas__sin-cuentas`, `cuentas__una-tarjeta`, `cuentas__principal` (talón «Sin modelo»).
25. **Elegir otro período** (FALTANTES `periodos`), **cierre automático del período** (`cierre-periodo`) e **instalar Finn** (`instalar`): la app no tiene pantalla; siguen pendientes.

## Prioridad 3 · Estados transversales incompletos

El diseño tiene la pantalla pero no estos estados, y la app los resuelve sin referencia:

- **Cargando por pantalla.** Hay un solo esqueleto genérico (K2 `esqueleto-de-carga`); la app lo usa en todas, con la barra sin título. Definí el esqueleto de Inicio, Presupuesto, Cuentas, Actividad, Reportes y Ajustes. `inicio__cargando`, `cuentas__cargando`, `actividad__cargando`, `reportes__cargando`, `ajustes__cargando`, `estado__cargando-generico`.
- **Sin conexión dentro de cada flujo:** Bandeja, Revisar, Registrar, Registrar gasto, Nueva cuenta. Hay `14-…/sin-conexion-en-la-app` como pantalla, no el envío deshabilitado de cada flujo. `bandeja__sin-conexion`, `revisar__sin-conexion`, `registrar__ingreso-sin-conexion`, `registrar-gasto__sin-conexion`, `cuenta-nueva__sin-conexion`, `estado__sin-conexion-navegacion-bloqueada`.
- **Error de red y validación en los flujos** (no el conflicto, que sí está): `revisar__error-de-red`, `registrar-gasto__error-de-red`, `revisar__validacion`, `registrar__ingreso-validacion`, `registrar-gasto__validacion`, `registrar-gasto__suma-rechazada`.
- **No encontrado dentro de la app:** cada detalle usa el 404 general con otro texto. `cuenta__no-encontrada`, `categoria__no-encontrada`, `transaccion__no-encontrada`, `revisar__no-encontrado`, `reporte__no-encontrado`, `estado__404-dentro`.
- **Aviso de actualización de la PWA** y **página sin conexión con un borrador.** `estado__actualizacion-pwa`, `estado__sin-conexion-pagina-con-borrador`.
- **Panel de notificaciones vacío y «todo leído»** (la página tiene referencia; el panel desde la campana, no). `notificaciones-panel__vacio`, `notificaciones-panel__todo-leido`.
- **Revisar movimiento:** tipo ingreso, registrar a mano un no reconocido, aprobando, datos faltantes, muchos movimientos y confirmar en período cerrado. `revisar__ingreso`, `revisar__no-reconocido-a-mano`, `revisar__aprobando`, `revisar__datos-faltantes`, `revisar__muchos`, `revisar__confirmar-periodo-cerrado`.
- **Registrar:** retiro y ajuste de inversión, dinero que entra a una tarjeta, confirmar avance, una sola cuenta de efectivo, sin cuentas; Registrar gasto con fecha inexistente o posterior, calendario abierto y «otra persona». `registrar__inversion-retiro`, `registrar__inversion-ajuste`, `registrar__entrada-tarjeta`, `registrar__avance-confirmar`, `registrar__transferencia-una-cuenta`, `registrar__sin-cuentas`, `registrar-gasto__fecha-no-existe`, `registrar-gasto__fecha-posterior`, `registrar-gasto__calendario`, `registrar-gasto__otra-persona`.

## Para contexto (no es trabajo tuyo, salvo que te pida decidir)

La auditoría encontró además ~375 diferencias entre la app y el diseño que ya existe; las arregla desarrollo. Las que más cambian lo que ves en las capturas: el código de verificación es un campo único (DECISIONES pide 6 casillas), «Salir» de la entrega 3 no está implementado, los flujos cortos de Cuentas, Actividad, Metas y Por cobrar abren como página completa, el título de las pantallas hijas va dentro del contenido en el teléfono, «Registrar» queda solo como «+» a 390 px y las transiciones entre pantallas no siguen §11. No las rediseñes: mirá las capturas sabiendo que esas partes van a cambiar. El detalle está en `docs/auditoria-diseno/AUDITORIA-APP.md`.

Al terminar, respondé con: lo diseñado por prioridad, las decisiones D-1 a D-10 con su respuesta, y lo que quedó pendiente con su motivo.
