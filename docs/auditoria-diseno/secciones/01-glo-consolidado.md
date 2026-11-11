# GLO · hallazgos consolidados (aparecen en varias secciones)

Cada uno reúne hallazgos que varias secciones reportaron por separado. Los hallazgos de sección siguen en el informe con su id y la nota «→ GLO-nn»: sirven de lista de pantallas afectadas. Se arreglan una vez, en el componente compartido.

### GLO-20 · El código de verificación es un campo único, no 6 casillas — Verificar, Inscribir y Agregar factor · todas · crítica
- **Se ve:** `EntradaTexto` «Código» en una sola caja; no avanza, no reparte el pegado, no se verifica sola al sexto dígito, el error no tiembla; el recorrido tuvo que tocar «Verificar» a mano. Capturas `capturas/acceso__verificar-vacio__telefono-claro.png`, `acceso__inscribir__telefono-claro.png`, `ajustes-seguridad__agregar-factor__telefono-claro.png`; `movimiento/codigo__video.json` sin ninguna animación. Reúne ACC-01, ACC-02, ACC-03 y AJU-17.
- **Debería:** `docs/diseno/01-especificacion/DECISIONES.md`, fila «Código de verificación (TOTP)»: 6 casillas de 44 × 52; escribir avanza, pegar reparte, Retroceso vuelve; se verifica sola al sexto dígito; casilla llena con línea de 3 px en `--accion`, sube 2 px y pop; error: el grupo tiembla 380 ms y `--problema-borde`; correcto: `--positivo-fondo` en cascada de 40 ms, check con pop y sigue a los 650 ms. Comportamiento en `docs/diseno/04-demo/finn-demo.html`.
- **Arreglo:** un componente `CasillasCodigo` en `apps/web/src/componentes/formularios/` usado por `apps/web/src/app/ingresar/verificar/formulario-verificar.tsx`, `apps/web/src/app/ingresar/inscribir/**` y `apps/web/src/flujos/ajustes-seguridad-factores-nuevo/**`; los tiempos con `--duracion-temblor`, `--retardo-cascada` y `--duracion-confirmacion` (propuestos en `docs/diseno/entrega-3/estilos/tokens-propuesta.css`).
- **Cómo verificar:** `node tools/auditoria/correr.mjs casos/90-movimiento -g "mov codigo"` registra el pop por casilla, el temblor de 380 ms y la cascada; la verificación sale sola al sexto dígito sin tocar el botón; 6 tocables de 44 × 52 con etiqueta.

### GLO-21 · «Salir» de la entrega 3 no está implementado — marco, Ajustes y Seguridad · todas · crítica
- **Se ve:** Salir no está en la hoja Más secciones ni al pie de la barra lateral; Ajustes no tiene la tarjeta Salir y el enlace sigue en Seguridad; con borradores, Salir los borra sin avisar; sin conexión no se deshabilita. Reúne GLO-101, GLO-102, GLO-103, GLO-104, GLO-105, GLO-108 y AJU-02 (ver `secciones/10-acc-glo.md`, tabla «Entrega 3, punto por punto»).
- **Debería:** `docs/diseno/entrega-3/DECISIONES.md`, filas «Salir», «Tenés N cambios sin enviar», «Estados de Salir»; referencias `docs/diseno/entrega-3/pantallas/16-salir/`.
- **Arreglo:** según `docs/diseno/entrega-3/PROMPT-DESARROLLO.md`: fila Salir en `apps/web/src/componentes/navegacion/navegacion-app.tsx` (hoja y barra lateral), tarjeta en `apps/web/src/app/(finn)/ajustes/page.tsx`, quitarlo de `apps/web/src/app/(finn)/ajustes/seguridad/page.tsx`, hoja de cambios sin enviar sobre `apps/web/src/componentes/marco/superpuesto.tsx`.
- **Cómo verificar:** los 11 estados de `16-salir` reproducidos; con 2 borradores, Salir abre la hoja y «Quedarme» no borra nada.

### GLO-22 · «Registrar» queda solo como «+» a 390 px — barra superior de las pestañas · teléfono · alta
- **Se ve:** la clase `max-[25rem]:sr-only` en `apps/web/src/componentes/navegacion/acceso-registrar.tsx:19` oculta el texto por debajo de 400 px; en el teléfono de 390 se ve un cuadrado azul con «+». Reúne INI-01, BAN-02, GLO-111, ACT-13 y el candidato de CAT. Captura `capturas/inicio__principal__telefono-claro.png`.
- **Debería:** PANTALLAS §3.1 y `docs/diseno/02-referencias/tableros/S1-Inicio__telefono-claro.png`: botón «+ Registrar» de 44 de alto, padding 0 14 0 10, `.t-etiqueta` 700.
- **Arreglo:** quitar el ocultamiento a ese ancho en `acceso-registrar.tsx`; si a 360 no entra, decidirlo con diseño en vez de esconder la etiqueta.
- **Cómo verificar:** a 390 y a 360 px el texto «Registrar» es visible y el título de la pestaña no se corta.

### GLO-23 · Los flujos cortos abren como página completa — Cuentas, Actividad, Metas, Por cobrar, Reglas · teléfono y computadora · alta
- **Se ve:** pagar tarjeta, pagar cuota, archivar, eliminar, verificar saldo y ordenar (Cuentas); cambiar estado, eliminar y eliminar evento (transacción); nueva y editar meta; cobrar y renombrar; nueva regla: todas con «Cerrar» a pantalla completa. Reúne CTA-04, ACT-32, MAS-001, MAS-128 y MAS-129b.
- **Debería:** `docs/diseno/01-especificacion/INDICE-entrega-2.md` §6: los flujos cortos van en hoja inferior en el teléfono y en panel lateral de 440 px sobre velo en la computadora; PANTALLAS §2.17.
- **Arreglo:** montarlos en el slot `@superpuesto` con rutas interceptadas, como ya hacen asignar, mover y registrar (`apps/web/src/app/(finn)/@superpuesto/(.)…`), con `apps/web/src/componentes/marco/superpuesto.tsx`; la ruta directa queda como respaldo.
- **Cómo verificar:** desde la pantalla de origen cada uno abre un `role="dialog"` sobre el contenido, se cierra con Escape y el velo, y en computadora mide 440 px.

### GLO-24 · Flujos con campana y barras de pestaña, y pantallas hijas tratadas como flujo — marco · teléfono y computadora · alta
- **Se ve:** en computadora archivar, fusionar, metas y sacar llevan campana y barra lateral (CAT-32); agregar factor lleva campana y barra inferior en el teléfono (AJU-17); al revés, ocho subpáginas de Ajustes usan `PaginaFlujoDeRuta` con «X» y sin campana (AJU-06), y Notificaciones lleva la barra de pestaña (MAS-134).
- **Debería:** DECISIONES «Marco y densidad»: pestañas con Registrar, campana y ☰; hijas con flecha «Volver a <padre>» y campana; Más secciones solo con campana; flujos (todo lo que termina en Guardar, Confirmar o Verificar) sin campana ni barra inferior. Entrega 3, «Campana en Ajustes».
- **Arreglo:** que el tipo de pantalla lo declare cada página y el marco (`apps/web/src/componentes/marco/marco.tsx`, `pagina-flujo.tsx`, `proveedor-encabezado.tsx`) dibuje la barra de ese tipo; pasar las subpáginas de Ajustes de `PaginaFlujoDeRuta` a pantalla hija.
- **Cómo verificar:** el analizador (`node tools/auditoria/analizar.mjs`) no marca «flujo con campana», «flujo con barra inferior», «hija sin Volver» ni «Más secciones con Registrar» en ninguna captura.

### GLO-25 · El título de la pantalla hija va dentro del contenido y se superpone — pantallas hijas · teléfono · alta
- **Se ve:** en el detalle de categoría el título mide x=80, y=184.6, 60 de alto, encima del rótulo (y=184.6) y de «Disponible» (y=216.2); los títulos largos se cortan («FONDO DE EMERG…»); la barra superior no lleva título. Reúne GLO-113, CAT-01 y PRE-38. Captura `capturas/categoria__principal__telefono-claro.png`.
- **Debería:** DECISIONES «Marco»: la flecha «Volver a <padre>» a la izquierda del título, en la misma fila de la barra superior; PANTALLAS §3.1: título `.t-titulo-pantalla` 1.625rem con atrás, una línea con puntos suspensivos.
- **Arreglo:** `apps/web/src/componentes/navegacion/volver-en-titulo.tsx` y la barra de `apps/web/src/componentes/marco/marco.tsx`: el título de la hija va en la barra; el contenido empieza debajo.
- **Cómo verificar:** en todas las hijas (categoría, cuenta, transacción, gasto semanal, subpáginas de Ajustes) ningún texto del contenido se superpone al título.

### GLO-26 · Enlaces subrayados donde el diseño pone un botón — toda la app · teléfono y computadora · alta
- **Se ve:** acciones secundarias de las filas de la Bandeja (BAN-04), «Volver a la cuenta» y los bloqueos de archivar y eliminar (CTA-05, CTA-06), «Seguir» al cerrar la inscripción (ACC-15), «Salir» de las sesiones (AJU-18), acciones de aviso (MAS-006, MAS-014) y las acciones de `AvisoEnLinea` de 17–18 px de alto.
- **Debería:** PANTALLAS §2.1 (secundaria tonal, pastilla de acción en filas) y `docs/diseno/02-referencias/entrega-2/componentes/P1-01-boton-secundario-tonal-todos-los-estados__claro.png`; DECISIONES regla 6 (44 × 44).
- **Arreglo:** usar `Boton` variante tonal (o pastilla en filas) de `apps/web/src/componentes/base/boton.tsx` en esos lugares; la acción de `apps/web/src/componentes/base/aviso.tsx` con tocable de 44.
- **Cómo verificar:** cada caso de la lista muestra un botón con fondo `--accion-tonal`; ningún tocable de acción menor de 44 en el analizador.

### GLO-27 · Falta el resultado en el lugar después de una acción — Presupuesto, Actividad · todas · alta
- **Se ve:** después de asignar, mover, reordenar o eliminar una transacción no queda «Resultado de una acción» con «Deshacer» o «Restaurar»; donde aparece algo, no lleva `role="status"`. Reúne PRE-35, PRE-42, PRE-65, ACT-11 y ACT-12.
- **Debería:** DECISIONES regla 5 y PANTALLAS §2.13 (textos exactos, rebote de 300 ms con `--curva-enfasis`); `docs/diseno/02-referencias/entrega-2/pantallas/07-flujos-del-presupuesto/asignado__telefono-claro.png`.
- **Arreglo:** usar `apps/web/src/componentes/base/resultado.tsx` (el mismo que la Bandeja) en `apps/web/src/flujos/presupuesto-asignar-categoria`, `presupuesto-mover`, `presupuesto-estructura` y `actividad-eliminar`, con `role="status"`.
- **Cómo verificar:** tras cada acción, el resultado queda donde estaba el elemento, no desaparece solo, y `role="status"` > 0.

### GLO-28 · El impacto «Antes de guardar» no está en vivo y la app agrega pasos «Revisá el impacto» — flujos · todas · alta
- **Se ve:** en Registrar gasto el impacto aparece solo al pulsar Guardar (REG-10); los flujos cortos de Registrar no lo tienen (REG-05); Revisar no muestra «Después de aprobar» (BAN-14); archivar, fusionar, nueva cuenta, editar, eliminar y pagar agregan una pantalla «Revisá el impacto» que el diseño no tiene (CAT-22, CTA, ACT); y el aviso sale como código crudo «AV-07» / «AV-03» (ACT-26).
- **Debería:** DECISIONES «Registrar gasto» (impacto «Antes de guardar» por línea); `docs/diseno/02-referencias/entrega-1/componentes/K4-Dominio-B__confirmacion-del-impacto__claro.html`; el impacto va en la misma pantalla del flujo.
- **Arreglo:** `apps/web/src/componentes/formularios/confirmacion-impacto.tsx` calculado en vivo desde la vista del motor (sin calcular montos en la interfaz, PF-3), en la misma pantalla; textos AV-03 y AV-07 en `apps/web/src/textos/transaccion.ts`. Si el paso aparte se queda, es decisión de diseño (`PROMPT-DISENO.md` ítem 22).
- **Cómo verificar:** al cambiar un monto el impacto cambia sin pulsar Guardar; ningún texto `AV-\d\d` visible.

### GLO-29 · Márgenes laterales de 16 px en vez de 20 — Bandeja, avisos globales, esqueletos · teléfono · alta
- **Se ve:** 16 px laterales en Bandeja, Revisar y Registrar gasto (BAN-03), en el aviso global sin conexión (GLO-110) y en los esqueletos (GLO-122).
- **Debería:** DECISIONES «Marco y densidad»: 20 px (`--espacio-5`).
- **Arreglo:** el relleno del contenedor de esas pantallas en `apps/web/src/app/(finn)/bandeja/`, `apps/web/src/flujos/registrar-gasto/` y `apps/web/src/componentes/marco/marco.tsx` con `--espacio-5`.
- **Cómo verificar:** `margenIzq` = 20 en las medidas de esas capturas.

### GLO-30 · Tablas anchas desbordan la página — Reportes y detalle de categoría · teléfono y 768 · alta
- **Se ve:** tendencia como tabla, tarjetas y cumplimiento a 429 px en 390 (REP-09) — la barra superior se estira y Registrar y la campana quedan fuera —, y el historial de categoría a 794 en 768 (GLO-06).
- **Debería:** DECISIONES «Marco»: nada pasa el borde salvo las filas de filtros.
- **Arreglo:** contenedor con desplazamiento propio en `apps/web/src/componentes/graficos/tabla-equivalente.tsx`.
- **Cómo verificar:** `desbordeHorizontal: false` en todas las medidas.

### GLO-31 · Flujos destructivos con el botón azul de acción — eliminar, quitar, fusionar · todas · alta
- **Se ve:** confirmar eliminar una transacción, un evento y otros destructivos usan el primario `--accion` (ACT-33).
- **Debería:** PANTALLAS §2.1 (botón de peligro) e INDICE-entrega-2 §6: «Eliminar va en el botón `peligro`… Fusionar también usa `peligro`».
- **Arreglo:** `Boton variante="peligro"` en `apps/web/src/flujos/actividad-eliminar`, `actividad-eventos-eliminar`, `cuentas-eliminar` y `presupuesto-categorias-fusionar` (el repaso de Ajustes comprobó que `ajustes-seguridad-factores-quitar` ya usa `--peligro`).
- **Cómo verificar:** fondo `--peligro` en el botón final de cada uno.

### GLO-32 · Esqueleto de carga genérico y barra sin título en cargando y error — `(finn)` · todas · media
- **Se ve:** un solo `loading.tsx` y `error.tsx` para todas las rutas, con la barra superior sin título y bloques con radio de pastilla (INI-13, INI-14, GLO-122).
- **Debería:** `docs/diseno/02-referencias/entrega-1/componentes/K2-Base__esqueleto-de-carga__claro.html`; la barra conserva el título de la pantalla.
- **Arreglo:** `loading.tsx` por sección en `apps/web/src/app/(finn)/**` con la forma de su pantalla (falta diseño por pantalla: `PROMPT-DISENO.md` prioridad 3).
- **Cómo verificar:** durante la carga la barra muestra el título y el esqueleto coincide con la pantalla que llega.

### GLO-33 · Pastillas de filtro, segmentados y selects fuera del componente — toda la app · media
- **Se ve:** pastillas de filtro en 16/400 con la activa fuera de vista (PRE-01, PRE-02); segmentados con segmentos desiguales y la pastilla que sobresale (MAS-010); `<select>` nativo con flecha gruesa en Ciclo, Reglas y formularios (MAS-118); casilla nativa de 48 px donde va interruptor (AJU-12).
- **Debería:** PANTALLAS §2.2 y §2.3; `docs/diseno/02-referencias/entrega-1/componentes/K5-Nuevos__selector-en-pastilla-filtros__claro.html`, `K2-Base__seleccion__claro.html`, `K2-Base__casilla-interruptor-opciones__claro.html`.
- **Arreglo:** `apps/web/src/componentes/base/pastillas.tsx`, `selector-segmentado.tsx`, `seleccion.tsx` y `interruptor-enlace.tsx` según K2/K5, y reemplazar los usos nativos.
- **Cómo verificar:** pastillas de 40 px, 700 la activa; segmentado con opciones iguales; ningún `<select>` sin estilo del juego.

### GLO-34 · Botones con monto sin espacio y sin el monto — flujos cortos · todas · media
- **Se ve:** «Cubrir$26.30», «Asignar$75.00» (CAT-04) y botones de confirmar sin el monto («Guardar» en vez de «Asignar $75.00», PRE-33).
- **Debería:** PANTALLAS §2.17 («Asignar $75.00») y DECISIONES regla 3.
- **Arreglo:** el texto del botón en `apps/web/src/textos/` con espacio y monto formateado por `apps/web/src/formato/`.
- **Cómo verificar:** ningún botón con `\S\$\d`; los flujos de asignar y mover muestran el monto en el botón.
