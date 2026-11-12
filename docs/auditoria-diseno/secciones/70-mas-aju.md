# Auditoría de diseño · MAS (Programadas, Por cobrar, Reglas, Notificaciones) y AJU (Ajustes)

Casos: `tools/auditoria/casos/70-mas-aju.cap.ts` (56 pruebas, 168 capturas en las tres variantes; ~80 ids). Capturas en `docs/auditoria-diseno/capturas/<id>__<variante>.png`, medidas en `medidas/`, análisis en `analisis/` (prefijos `programada`, `por-cobrar`, `notificaciones__`, `regla`, `ajustes`).
Semillas: A.7 con hoy 15/10/2026 (Ajustes, Notificaciones, Reglas) y 19/10/2026 (Programadas, para tener a Netflix atrasada); Por cobrar suma PRICESMART (Visa, cobrado $10) y una partida de Ana. Las referencias usan datos propios (Luz y agua, Salario, Gimnasio, Pizza Hut): las diferencias de datos no se reportan.
Ids: `MAS-101…` y `AJU-01…`. Los hallazgos GLO-103, GLO-104 y GLO-107 (Salir y el ícono `gear`) se citan, no se repiten.

## Decisiones de DECISIONES comprobadas una por una

| Punto | Resultado |
|---|---|
| (a) Un solo factor | **No cumple.** Con un factor, Seguridad no tiene el aviso de advertencia ni el triángulo; "Quitar" abre una pantalla aparte `/quitar` (AJU-15, crítica y AJU-14). El botón "Agregar un factor de respaldo" sí es tonal (`accion-tonal`), pero sin el `+` de la referencia (AJU-16). |
| (b) Código de 6 casillas | **No cumple.** "Agregar factor" usa un campo único "Código" (`ajustes-seguridad__agregar-factor`), sin las 6 casillas de 44 × 52 (AJU-17). Confirma lo que otro agente ya vio en acceso. |
| (c) Entrega 3 | Cumple: campana en el índice de Ajustes (390 px); flecha "Volver a Ajustes" + campana en Seguridad y en Notificaciones de Ajustes; fila activa "Ajustes" en la barra lateral de computadora en el índice y en las subpáginas. No cumple: tarjeta "Salir" (ausente, GLO-103/104), `gear` de 8 dientes y `sun` en Apariencia (GLO-107), campana y flecha en el resto de subpáginas (AJU-06). |

## Inventario

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| programadas__lista | /programadas | `(finn)/programadas/pantalla.tsx` | 09b-programadas/lista | MAS-101, 102, 103, 104, 105, 106, 107, 115 |
| programadas__lista-7-dias | /programadas?horizonte=7 | pantalla.tsx | 09b-programadas/lista | MAS-101 |
| programadas__desactivada | /programadas | programadas/activar.tsx | 09b-programadas/lista | MAS-108 |
| programadas__vacia | /programadas | pantalla.tsx | 09b-programadas/vacia | MAS-104, 109 |
| programadas__lista-sin-modelo | /programadas | pantalla.tsx | 09b-programadas/lista | **no capturado**: la «Cuota sin modelo» exige una cuota con registro automático cuyo préstamo no tenga modelo; las operaciones de semilla (OP-42) solo crean gastos y el servidor rechaza crearla (`registro_automatico_sin_modelo`). Por código: el aviso existe (`pantalla.tsx:152`) pero sin la acción «Agregar condiciones» (MAS-110) |
| programada__nueva | /programadas/nueva | `flujos/programadas-nueva/formulario.tsx` | SIN DISEÑO (FALTANTES programada-nueva) | MAS-111, 112, 113, 114, 117, 118 |
| programada__editar | /programadas/[id] | `flujos/programadas-programada/lector.tsx` | 09b-programadas/editar | MAS-111, 112, 113, 114, 115, 116, 117, 118 |
| programada__editar-sin-historial | /programadas/[id] | lector.tsx | 09b-programadas/editar (sin estado propio) | sin diseño del estado editable; mismos MAS-111 a 118 |
| programada__ocurrencia | /programadas/[id]/ocurrencias/[fecha] (hoja desde la lista) | `flujos/programadas-ocurrencias-fecha-esperada/formulario.tsx` | 09b-programadas/ocurrencia | MAS-103, 119, 120 |
| programada__ocurrencia-pagina | ídem, URL directa | `(finn)/programadas/[id]/ocurrencias/[fecha]/page.tsx` | 09b-programadas/ocurrencia | MAS-119, 120, 121 |
| programada__ocurrencia-resuelta | ídem, ya registrada | `…/resuelta.tsx` | 09b-programadas/ocurrencia-resuelta | MAS-121, 122 |
| programada__ocurrencia-registrada | resultado de «Registrar» | formulario.tsx | 09b-programadas/ocurrencia-resuelta | bien (resultado en la hoja con «Ver transacción») |
| programada__ocurrencia-omitida | resultado de «Omitir» | formulario.tsx | SIN DISEÑO | ver Sin diseño |
| por-cobrar__lista | /por-cobrar | `(finn)/por-cobrar/pantalla.tsx` | 09c-por-cobrar/lista | MAS-123, 124, 125, 126, 127 |
| por-cobrar__lista-a7 | /por-cobrar | pantalla.tsx | 09c-por-cobrar/lista | MAS-123, 124, 125 |
| por-cobrar__vacia | /por-cobrar | pantalla.tsx | 09c-por-cobrar/vacia | MAS-123 (la tarjeta de totales no aparece vacía: bien); resto igual |
| por-cobrar__cerrados | /por-cobrar?cerrados=1 | pantalla.tsx | SIN DISEÑO (FALTANTES cerrados) | ver Sin diseño |
| por-cobrar__cobrar | /por-cobrar/cobrar?linea= | `flujos/por-cobrar-cobrar/formulario.tsx` | 09c-por-cobrar/cobrar | MAS-128, 129 |
| por-cobrar__condonar | hoja `@superpuesto/(.)por-cobrar/condonar/[lineaId]` | page.tsx | 09c-por-cobrar/condonar | bien (hoja, campos, botones iguales a la referencia) |
| por-cobrar__renombrar | /por-cobrar/deudores/[id]/renombrar | `por-cobrar/deudores/[deudorId]/renombrar/page.tsx` | 09c-por-cobrar/renombrar-repetido | MAS-128 |
| por-cobrar__renombrar-repetido | ídem con «Ana» | ídem | 09c-por-cobrar/renombrar-repetido | MAS-128; el error tiene las tres señales: bien |
| reglas__lista | /reglas | `(finn)/reglas/pantalla.tsx` | 09d-reglas/lista | MAS-131 |
| reglas__sin-coincidencias | /reglas (buscar) | pantalla.tsx | SIN DISEÑO | ver Sin diseño |
| reglas__vacia | /reglas | pantalla.tsx | 09d-reglas/vacia | bien |
| regla__nueva-vacia | /reglas/nueva | `flujos/reglas-nueva/formulario.tsx` | 09d-reglas/nueva | MAS-129b, 130 |
| regla__nueva | /reglas/nueva (llena) | formulario.tsx | 09d-reglas/nueva | MAS-129b, 130, 133 |
| regla__nueva-repetida | /reglas/nueva | formulario.tsx | 09d-reglas/nueva-repetida | MAS-129b, 130; error con tres señales: bien |
| regla__editar | /reglas/[reglaId] | `flujos/reglas-regla/lector.tsx` | SIN DISEÑO (la referencia más cercana es «nueva») | ver Sin diseño |
| regla__eliminar-confirmar | /reglas/[reglaId] | lector.tsx | SIN DISEÑO | ver Sin diseño |
| notificaciones__lista | /notificaciones | `(finn)/notificaciones/contenido.tsx` | 10-notificaciones/lista | MAS-134, 135, 136, 137, 138 |
| notificaciones__solo-sin-leer | /notificaciones?no-leidas=1 | contenido.tsx | 10-notificaciones/lista | MAS-134, 136 |
| notificaciones__marcar-todo | /notificaciones | marcar-todo.tsx | 10-notificaciones/todo-leido | MAS-134, 136 |
| notificaciones__todo-leido | /notificaciones | contenido.tsx | 10-notificaciones/todo-leido | MAS-134, 135, 136 |
| notificaciones__vacia | /notificaciones | pantalla.tsx | 10-notificaciones/vacia | MAS-134, 138 |
| notificaciones__panel | /notificaciones (panel desde la campana) | `@superpuesto/(.)notificaciones/page.tsx` | K5 panel (es de otro agente) | solo capturado como contexto |
| ajustes__indice | /ajustes | `(finn)/ajustes/page.tsx`, `lista-ajustes.tsx` | entrega-3/16-salir/ajustes-indice | AJU-01, 02, 03, 04, 05 |
| ajustes__indice-primeros-pasos-ocultos | /ajustes | recordatorio-primeros-pasos.tsx | 11-ajustes/indice | bien (tarjeta y botón tonal); AJU-01, 03 en la lista |
| ajustes__indice-sin-cuentas | /ajustes | page.tsx | 11-ajustes/indice | AJU-01 |
| ajustes__indice-respaldo-al-dia / -atrasado | /ajustes | lista-ajustes.tsx | ajustes-indice | AJU-04 |
| ajustes__cargando | proxy `/pruebas/estados/carga` | `ajustes/loading.tsx` (re-exporta el de `(finn)`) | SIN DISEÑO | proxy: el loading de todas las subpáginas es el mismo bloque global; sin referencia en esta sección |
| ajustes__error | proxy `/pruebas/estados/error` | `(finn)/error.tsx` | 14-sin-conexion-404-y-error | es del marco (otro agente) |
| ajustes-ciclo__principal / __aviso | /ajustes/ciclo | `flujos/ajustes-ciclo/panel.tsx` | 11-ajustes/ciclo | AJU-06, 07 |
| ajustes-conectar-sms__sin-token / token-generado / con-token / cambiar | /ajustes/webhook | `ajustes/webhook/page.tsx` | 11-ajustes/conectar-sms | AJU-06, 08, 09 |
| ajustes-formatos__lista | /ajustes/formatos | `ajustes/formatos/lista.tsx` | 11-ajustes/formatos | AJU-06, 10 |
| ajustes-formatos__detalle / __nuevo | /ajustes/formatos/[id], /nuevo | `formatos/[formatoId]/page.tsx`, `nuevo/page.tsx` | SIN DISEÑO (FALTANTES formato-nuevo) | ver Sin diseño |
| ajustes-instituciones__lista | /ajustes/instituciones | `instituciones/lista.tsx` | 11-ajustes/formatos (la referencia las pone al pie de formatos) | AJU-06, 11 |
| ajustes-instituciones__detalle / __nueva / __nueva-repetida | /ajustes/instituciones/… | `instituciones/…/page.tsx` | SIN DISEÑO (FALTANTES institucion) | ver Sin diseño |
| ajustes-notificaciones__concedido | /ajustes/notificaciones | `ajustes/notificaciones/panel.tsx` | 11-ajustes/notificaciones | AJU-12 |
| ajustes-notificaciones__sin-pedir | ídem | panel.tsx | SIN DISEÑO (FALTANTES permiso-push) | ver Sin diseño |
| ajustes-notificaciones__denegado | ídem | panel.tsx | SIN DISEÑO | advertencia con tres señales: bien; ver Sin diseño |
| ajustes-seguridad__un-factor | /ajustes/seguridad | `seguridad/lista-factores.tsx`, `sesiones.tsx` | entrega-3/16-salir/seguridad-factor-unico | AJU-14, 16, 18 |
| ajustes-seguridad__dos-factores | ídem con respaldo verificado | lista-factores.tsx | 11-ajustes/seguridad | AJU-16, 18 |
| ajustes-seguridad__inscripcion-sin-terminar | ídem | lista-factores.tsx | 11-ajustes/seguridad | bien en estructura (texto «Inscripción sin terminar»); AJU-16 |
| ajustes-seguridad__quitar-un-factor | /ajustes/seguridad/factores/[id]/quitar con un factor | `flujos/ajustes-seguridad-factores-quitar/formulario.tsx` | DECISIONES: no existe | AJU-15 |
| ajustes-seguridad__quitar-factor | ídem con dos factores | formulario.tsx | SIN DISEÑO (FALTANTES factor-quitar) | AJU-23; ver Sin diseño |
| ajustes-seguridad__agregar-factor / __agregar-factor-codigo-malo | /ajustes/seguridad/factores/nuevo | `flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx` | SIN DISEÑO (FALTANTES factor-nuevo) + DECISIONES (6 casillas) | AJU-17 |
| ajustes-exportar__principal | /ajustes/exportar | `ajustes/exportar/page.tsx`, `descargas.tsx` | 11-ajustes/exportar | AJU-06, 19 |
| ajustes-respaldo__sin-respaldo / al-dia / atrasado | /ajustes/respaldo | `ajustes/respaldo/page.tsx` | 11-ajustes/respaldo | AJU-06, 20 |
| ajustes-diagnostico__sin-eventos / con-referencia / sin-resultados / tareas-ejecutadas | /ajustes/diagnostico | `diagnostico/panel.tsx` | 11-ajustes/diagnostico | AJU-06, 21 |
| ajustes-apariencia__sistema / claro / oscuro | /ajustes/apariencia | `apariencia/panel.tsx`, `pagina.tsx` | 11-ajustes/apariencia | AJU-06, 22, 24 |
| reprocesar (FALTANTES) | — | — | — | no capturado: no pertenece a estas pantallas (nace del flujo de un movimiento no reconocido) |

No capturado además: estado de error de red / sin conexión de cada pantalla (es el aviso global del marco, ya cubierto por otro agente) y los estados de "cargando" propios (no existe uno propio: todos usan el `loading.tsx` global, ver `ajustes__cargando`).

## Hallazgos

### MAS-101 · Horizonte como dos interruptores — Programadas · lista · teléfono y computadora · alta
- **Se ve:** `programadas__lista__telefono-claro.png`: dos interruptores "7 días" / "30 días" sin rótulo. No hay 90 días.
- **Debería:** selector segmentado "7 días · 30 días · 90 días" con el rótulo "Horizonte" encima (`11-…/09b-programadas/lista__telefono-claro.png`, INDICE-entrega-2 §09b; PANTALLAS §2.3).
- **Arreglo:** usar el segmentado de pastillas (K2 `casilla-interruptor-opciones`, el mismo de Gráfico/Tabla) en lugar de `InterruptorEnlace`; agregar `?horizonte=90` en `app/(finn)/programadas/page.tsx` y en `pantalla.tsx:60-72`.
- **Cómo verificar:** tres opciones, una activa, el rótulo "Horizonte" sobre el control, 90 días funciona.

### MAS-102 · Atrasada en advertencia y no en problema — Programadas · lista · todas · media
- **Se ve:** aviso amarillo `advertencia` con triángulo (`programadas__lista__telefono-claro.png`).
- **Debería:** aviso de problema (`--problema-fondo`, ícono de prohibido) como en la referencia `lista__telefono-claro.png`.
- **Arreglo:** `estado="problema"` en `AvisoEnLinea` de `pantalla.tsx:87`.
- **Cómo verificar:** fondo y texto con tokens `problema`, glifo del juego de íconos de problema.

### MAS-103 · «Atrasada» sin «Omitir» y sin monto en «Registrar» — Programadas · lista · alta
- **Se ve:** la acción es solo «Registrar» (enlace subrayado de 72 × 18, menor de 44) y el texto dice "se esperaba el 17 oct 2026 y no llegó el SMS" con año.
- **Debería:** dos acciones, "Registrar $58.40" y "Omitir", y la fecha "12/10" (`lista__telefono-claro.png`). Tocables de 44 mínimo.
- **Arreglo:** en `pantalla.tsx:97-110` agregar la acción Omitir (la hoja ya tiene `omitir`), poner `Registrar {monto}`, formatear la fecha con `dd/mm`, y dar a las dos acciones `min-h-11` (el análisis marca «Registrar» 72×18).
- **Cómo verificar:** ambas acciones visibles de 44 × 44 y con monto con tabular-nums.

### MAS-104 · Botón «Nueva programada» en el encabezado — Programadas · lista y vacía · baja
- **Se ve:** botón tonal "+ Nueva programada" bajo el título en la lista y en la vacía (`programadas__lista`, `programadas__vacia`).
- **Debería:** ninguna acción en el encabezado de la lista; la vacía tiene un solo botón "Programar un pago" (`vacia__telefono-claro.png`).
- **Arreglo:** retirar el botón de `pantalla.tsx:40-43` o proponer el diseño de la entrada a "nueva" (FALTANTES programada-nueva); en la vacía dejar un único botón.
- **Cómo verificar:** coincidencia con la referencia o CH aprobado.

### MAS-105 · Lista de «Programadas» duplicada con «Desactivar» a todo el ancho — Programadas · lista · alta
- **Se ve:** tras "Próximos" aparece otra sección "Programadas" con cada programada repetida y un botón tonal "Desactivar" de ancho completo (`programadas__lista__telefono-claro.png`, `…__computadora-claro.png`).
- **Debería:** una sola lista; la programada desactivada es una fila con "PAUSA —", título atenuado, "Desactivada" y el enlace "Reactivar" (`lista__telefono-claro.png`).
- **Arreglo:** fusionar `data-seccion="todas"` en la lista de próximos (`pantalla.tsx:118-146`); mover Desactivar a la pantalla de editar y dejar «Reactivar» como enlace en la fila pausada (`programadas/activar.tsx`).
- **Cómo verificar:** cada programada aparece una vez; la pausada muestra "PAUSA" y "Reactivar".

### MAS-106 · Filas de próximos: sin flecha, sin fecha corta y títulos cortados — Programadas · lista · media
- **Se ve:** "CUOTA DEL PRESTA…" con puntos suspensivos (`analisis/programadas__lista.md`), sin `chevR` ni "20/10 · ".
- **Debería:** título que se parte en dos líneas, subtítulo "20/10 · Cuenta de ahorro · se registra sola", `chevR` a la derecha (`lista__telefono-claro.png`).
- **Arreglo:** quitar `truncate` en `pantalla.tsx:131`, agregar la fecha y el `Icono chevR`.
- **Cómo verificar:** ningún título con puntos suspensivos a 390 px.

### MAS-107 · Una columna a 624 px en computadora — Programadas · lista · computadora · alta
- **Se ve:** `programadas__lista__computadora-claro.png`: contenido de 624 px de ancho, en una sola columna.
- **Debería:** contenido de 1144 con dos columnas (Horizonte y atrasadas a la izquierda, Próximos a la derecha) (`lista__computadora-claro.png`).
- **Arreglo:** el `<main>` de `pantalla.tsx:37` usa `max-w-3xl`; pasar al ancho de contenido del marco (1144) con `md:grid md:grid-cols-2`. Igual en Por cobrar (`max-w-3xl`), Reglas, Notificaciones (`max-w-3xl`) y Ajustes (`max-w-xl`, 576 px).
- **Cómo verificar:** a 1440 el contenido mide 1144 y el diseño coincide con la referencia de computadora.

### MAS-108 · Estado desactivado distinto — Programadas · lista (desactivada) · media
- **Se ve:** "Visa Oro · Desactivada" en la línea de cuenta y un resultado "NETFLIX quedó desactivada." con "Reactivar" subrayado (`programadas__desactivada__telefono-claro.png`).
- **Debería:** insignia "PAUSA —" en la columna de la fecha, "Desactivada", y «Reactivar» como enlace de acción (no subrayado) (`lista__telefono-claro.png`).
- **Arreglo:** `pantalla.tsx` y `activar.tsx`.
- **Cómo verificar:** coincide con la fila "Gimnasio" de la referencia.

### MAS-109 · Texto del estado vacío — Programadas · vacía · baja
- **Se ve:** "Todavía no tenés programadas / Cargá tus pagos que se repiten… / Crear la primera".
- **Debería:** "No hay pagos programados / Programá Netflix o la cuota del préstamo para verlos venir y emparejarlos con su SMS. / Programar un pago" (`vacia__telefono-claro.png`).
- **Arreglo:** `textos/programadas.ts` (`vacioTitulo`, `vacioTexto`, `crearUna`).
- **Cómo verificar:** textos idénticos a la referencia.

### MAS-110 · «Cuota sin modelo» sin acción — Programadas · lista · baja (por código, sin capturar)
- **Se ve:** `pantalla.tsx:152-156`: aviso `informacion` con título y texto, sin acción.
- **Debería:** acción "Agregar condiciones" (`lista__telefono-claro.png`).
- **Arreglo:** pasar `accion` a `AvisoEnLinea` con el enlace al préstamo.
- **Cómo verificar:** la acción lleva a las condiciones del préstamo.

### MAS-111 · Falta el segmentado «Tipo» y los tipos no coinciden — Programada · nueva y editar · alta
- **Se ve:** `programada__nueva__telefono-claro.png` trae Gasto · Pago de tarjeta · Cuota · Aporte, con "Pago de tarjeta" partido en dos líneas. `programada__editar` no tiene Tipo.
- **Debería:** Tipo: Gasto · Ingreso · Transferencia · Cuota, también en Editar (`editar__telefono-claro.png`).
- **Arreglo:** `flujos/programadas-nueva/formulario.tsx:148` y el de edición; ajustar tipos al diseño (o CH si el dominio no soporta Ingreso/Transferencia); evitar el corte de texto en el segmentado.
- **Cómo verificar:** tipos y rótulos de una línea.

### MAS-112 · «undefined/undefined/» en Fecha de fin — Programada · nueva y editar · alta
- **Se ve:** el campo vacío "Fecha de fin" muestra el texto «undefined/undefined/» (`programada__editar__telefono-claro.png`, `programada__nueva__telefono-claro.png`).
- **Debería:** campo vacío con marcador de formato `dd/mm/aaaa`.
- **Arreglo:** el componente de fecha del formulario (`flujos/programadas-nueva/formulario.tsx`, campo `fechaFin`) formatea un valor vacío; devolver cadena vacía.
- **Cómo verificar:** sin la palabra «undefined» en ninguna pantalla.

### MAS-113 · Monto y Tolerancia sin prefijos — Programada · nueva y editar · media
- **Se ve:** campos sin "$" ni "±$", con la ayuda "Se entiende como $15.49" debajo.
- **Debería:** "$ 15.49" y "±$ 2.00" con prefijo dentro del campo, sin ayuda (`editar__telefono-claro.png`).
- **Arreglo:** campo de monto con prefijo (el de Condonar/Cobrar ya lo hace, ver `por-cobrar__condonar`).
- **Cómo verificar:** prefijos visibles.

### MAS-114 · «Solo lectura» resuelto con campos deshabilitados — Programada · editar · media
- **Se ve:** Frecuencia deshabilitada (gris) y Primera fecha deshabilitada; el aviso es azul `informacion` y dice "Terminala y creá otra con el calendario nuevo".
- **Debería:** rótulo "Solo lectura" a la derecha de la etiqueta, campo de borde punteado, y debajo un aviso neutro (ícono de círculo punteado): "La primera fecha y la frecuencia no se pueden cambiar porque ya hay pagos registrados con esta programada." (`editar__telefono-claro.png`).
- **Arreglo:** `flujos/programadas-programada/lector.tsx` y `formulario.tsx`; usar `AvisoEnLinea` neutro.
- **Cómo verificar:** coincide con la referencia.

### MAS-115 · «Registrar sola» con casilla nativa — Programada · nueva y editar · media
- **Se ve:** casilla cuadrada de 48 px (`programada__editar__telefono-claro.png`).
- **Debería:** interruptor de K2 (`casilla-interruptor-opciones`), como en la referencia.
- **Arreglo:** `formulario.tsx:308-319` con el componente interruptor.
- **Cómo verificar:** interruptor de 44 de alto.

### MAS-116 · Guardar fuera del pie fijo y botón «Desactivar» de más — Programada · editar · media
- **Se ve:** Guardar en la columna, seguido de «Desactivar» tonal.
- **Debería:** pie fijo (12 16 26, línea superior) con solo Guardar (`editar__telefono-claro.png`; PANTALLAS §3.1).
- **Arreglo:** `PaginaFlujo` con `acciones`; mover «Desactivar» a la lista (ver MAS-105).
- **Cómo verificar:** el pie queda fijo al desplazar.

### MAS-118 · Select nativo con flecha gruesa — Programada y Regla · nueva · media (transversal)
- **Se ve:** en Cuenta, Categoría y Frecuencia el desplegable es distinto en cada pantalla; en Reglas (`regla__nueva`) y Ciclo se ve el chevron nativo grueso, no el `chev` del juego.
- **Debería:** selección rellena con `chev` fino (PANTALLAS §2.2).
- **Arreglo:** componente `componentes/base/seleccion` / el `<select>` de `flujos/ajustes-ciclo/panel.tsx:126` y de `reglas-nueva`.
- **Cómo verificar:** mismo chevron en todos los selects.

### MAS-119 · Hoja de ocurrencia sin «Atrasada 3 días» ni «Programada» — Programada · ocurrencia · media
- **Se ve:** título "NETFLIX · 17 OCT 2026" y filas Fecha esperada, Cuenta, Categoría, sin tarjeta (`programada__ocurrencia__telefono-claro.png`).
- **Debería:** título "LUZ Y AGUA · 12/10", subtítulo "Atrasada 3 días", y las cuatro filas (Programada, Fecha esperada, Cuenta, Categoría) dentro de una tarjeta con elevación (`ocurrencia__telefono-claro.png`).
- **Arreglo:** `flujos/programadas-ocurrencias-fecha-esperada/formulario.tsx`; título con `dd/mm`; subtítulo con los días de atraso que trae el DTO.
- **Cómo verificar:** coincide con la referencia.

### MAS-120 · Tocables de acción menores de 44 — Programada · ocurrencia · media
- **Se ve:** «Registrar» 70.5 × 17 y «Ver transacción» 120 × 18 (`analisis/programada__ocurrencia.md`, `…__resuelta.md`).
- **Debería:** 44 × 44 mínimo (DECISIONES regla 6).
- **Arreglo:** `AvisoEnLinea` (`componentes/base/aviso.tsx`): acción con `min-h-11` y `min-w-11`.
- **Cómo verificar:** `tocables < 44` vacío en el análisis.

### MAS-121 · La ocurrencia, en URL directa, es una página y no la hoja — Programada · ocurrencia-pagina y resuelta · baja
- **Se ve:** `programada__ocurrencia-pagina` y `…-resuelta` abren como página completa con X, sin fondo de Programadas.
- **Debería:** la referencia muestra siempre una hoja sobre la lista.
- **Arreglo:** se acepta (05 §1.4 lo prevé para URL directa); solo documentar.
- **Cómo verificar:** —

### MAS-122 · Ocurrencia resuelta sin la fila «Monto» — Programada · ocurrencia-resuelta · media
- **Se ve:** Fecha esperada y Cuenta (`programada__ocurrencia-resuelta__telefono-claro.png`).
- **Debería:** Fecha, Monto ($58.40) y Cuenta (`ocurrencia-resuelta__telefono-claro.png`).
- **Arreglo:** `…/resuelta.tsx`: agregar la fila Monto con tabular-nums.
- **Cómo verificar:** la fila existe.

### MAS-123 · Tarjeta de totales «Te deben / En camino» que el diseño no tiene — Por cobrar · lista · media
- **Se ve:** tarjeta con "TE DEBEN $65.00 · EN CAMINO $55.00" sobre el aviso (`por-cobrar__lista__telefono-claro.png`).
- **Debería:** solo el aviso "En camino" arriba (`lista__telefono-claro.png`).
- **Arreglo:** `(finn)/por-cobrar/pantalla.tsx` (`data-total-abierto`, `data-en-camino`): retirar o proponer CH.
- **Cómo verificar:** primera pieza es el aviso.

### MAS-124 · Aviso «En camino» genérico — Por cobrar · lista · media
- **Se ve:** "Pagaste con débito por otras personas: Listo para asignar está más bajo por ese monto hasta que te paguen."
- **Debería:** "Carlos te debe $40.00. Como pagaste con débito, Listo para asignar está $20.00 más bajo hasta que te pague."
- **Arreglo:** `textos/por-cobrar.ts` y su uso en `pantalla.tsx`: con nombre del deudor y los dos montos.
- **Cómo verificar:** texto con deudor y montos.

### MAS-125 · Todos los deudores expandidos — Por cobrar · lista · media
- **Se ve:** Ana y Carlos con todas sus partidas abiertas (`por-cobrar__lista__telefono-claro.png`); orden alfabético.
- **Debería:** el deudor con más deuda expandido; los demás como fila resumen "Te debe $15.00 · desde el 02/10" con `chevR` (`lista__telefono-claro.png`).
- **Arreglo:** `pantalla.tsx`: orden por monto abierto descendente, deudores secundarios como enlace.
- **Cómo verificar:** coincide.

### MAS-126 · Línea de la partida y «Ver los cerrados» distintos — Por cobrar · lista · media
- **Se ve:** "02/10/2026 · Débito", insignia «Abierto/Parcial» aparte, «Compartido $…» y «Cobrado…»; «Ver los cerrados» es un interruptor (`por-cobrar__lista__telefono-claro.png`).
- **Debería:** una línea "15/10 · Visa Oro · cobrado $10.00 · abierto" y «Ver los cerrados» como enlace (`lista__telefono-claro.png`).
- **Arreglo:** `FilaPartida` en `pantalla.tsx:47-90` y `InterruptorEnlace` de `pantalla.tsx:171`.
- **Cómo verificar:** coincide.

### MAS-127 · Fecha larga en lugar de dd/mm — Por cobrar · lista · baja
- **Se ve:** "02/10/2026", "desde el 06/10/2026".
- **Debería:** "desde el 02/10".
- **Arreglo:** `formatearFecha` en `pantalla.tsx`.
- **Cómo verificar:** sin año.

### MAS-128 · Cobrar y Renombrar son páginas completas, no hojas — Por cobrar · cobrar y renombrar · alta
- **Se ve:** `por-cobrar__cobrar__telefono-claro.png` y `…renombrar…`: página con X, sin la lista detrás; Condonar sí es hoja.
- **Debería:** flujo corto como hoja sobre Por cobrar, con Cancelar (`cobrar__telefono-claro.png`, `renombrar-repetido__telefono-claro.png`).
- **Arreglo:** crear `(finn)/@superpuesto/(.)por-cobrar/cobrar/page.tsx` y `(.)por-cobrar/deudores/[deudorId]/renombrar/page.tsx` como el de condonar; Renombrar necesita botón Cancelar.
- **Cómo verificar:** al tocar «Cobrar» aparece la hoja sobre la lista.

### MAS-129 · Casilla «Reservar» de 48 px sólida — Por cobrar · cobrar · baja
- **Se ve:** cuadro azul de 48 px con check blanco grande, y línea extra "Saldo $1,264.60" bajo la cuenta.
- **Debería:** casilla redonda de 44 con check en círculo (K2); sin línea de saldo.
- **Arreglo:** `flujos/por-cobrar-cobrar/casilla-reservar.tsx`.
- **Cómo verificar:** coincide.

### MAS-129b · «Nueva regla» es página de flujo y no hoja con Cancelar — Reglas · nueva y nueva-repetida · alta
- **Se ve:** `regla__nueva__telefono-claro.png`: página con X y un solo botón «Guardar regla».
- **Debería:** hoja inferior sobre Reglas, con "Cancelar" (tonal) y "Guardar regla" (`nueva__telefono-claro.png`).
- **Arreglo:** crear `@superpuesto/(.)reglas/nueva/page.tsx` y `(.)reglas/[reglaId]`; agregar Cancelar a `flujos/reglas-nueva/formulario.tsx`.
- **Cómo verificar:** hoja sobre la lista y Cancelar la cierra.

### MAS-130 · Texto del error de patrón repetido — Reglas · nueva-repetida · baja
- **Se ve:** "Ya hay una regla para PUMA."
- **Debería:** "Ya hay una regla con este patrón."
- **Arreglo:** el mensaje que trae el servidor (`patron_repetido`) o `textos/reglas.ts`.
- **Cómo verificar:** coincide.

### MAS-131 · Lista de reglas: buscador y contador — Reglas · lista · baja
- **Se ve:** marcador "Comercio o categoría", flecha larga "→" como texto, sin "usada N veces", orden alfabético (`reglas__lista__telefono-claro.png`).
- **Debería:** "Buscá un comercio", flecha del juego de íconos, "· usada 9 veces" y orden por uso (`lista__telefono-claro.png`).
- **Arreglo:** `textos/reglas.ts` (`buscarMarcador`, `hacia`) y `reglas/pantalla.tsx`; el conteo requiere el DTO (decisión de producto: confirmar si existe).
- **Cómo verificar:** textos iguales.

### MAS-133 · Falta «Coincide con: …» en Nueva regla — Reglas · nueva · media
- **Se ve:** sin vista previa de comercios.
- **Debería:** "Coincide con: SUPER SELECTOS ESCALON, SUPER SELECTOS SANTA ELENA." bajo la categoría (`nueva__telefono-claro.png`).
- **Arreglo:** `flujos/reglas-nueva/formulario.tsx` con la lista de comercios del DTO.
- **Cómo verificar:** aparece al escribir un patrón con coincidencias.

### MAS-134 · Notificaciones lleva la barra de pestaña — Notificaciones · todas · alta
- **Se ve:** Registrar + campana + ☰ (`notificaciones__lista__telefono-claro.png`, `…__vacia`).
- **Debería:** pantallas de Más secciones llevan solo la campana (DECISIONES, marco).
- **Arreglo:** `(finn)/notificaciones/pantalla.tsx` y la configuración del marco: tratar `/notificaciones` como Más secciones.
- **Cómo verificar:** solo la campana arriba.

### MAS-135 · Fechas absolutas y títulos partidos — Notificaciones · lista · media
- **Se ve:** "15/10/2026 08:00" junto al título, que se parte en 2 y 3 líneas.
- **Debería:** "Hace 2 h", "Hoy 8:00", "Ayer", "13/10" en una columna estrecha, título en una o dos líneas (`lista__telefono-claro.png`).
- **Arreglo:** `notificaciones/contenido.tsx` con formateo relativo.
- **Cómo verificar:** coincide.

### MAS-136 · Filtro y «Marcar todo como leído» mal ubicados — Notificaciones · lista · media
- **Se ve:** el filtro tonal con sombra y "Marcar todo como leído" en otra fila debajo.
- **Debería:** filtro Todas / Sin leer · 2 con borde y "Marcar todo como leído" a la derecha, en la misma fila.
- **Arreglo:** `contenido.tsx` y `marcar-todo.tsx`.
- **Cómo verificar:** misma fila.

### MAS-137 · Dos tarjetas por grupo — Notificaciones · lista · baja
- **Se ve:** "Nuevas" y "Anteriores" en tarjetas separadas.
- **Debería:** una tarjeta continua, con los grupos como en el panel (PANTALLAS §2.17) pero sin rótulos en la página (`lista__telefono-claro.png`).
- **Arreglo:** `contenido.tsx`.
- **Cómo verificar:** —

### MAS-138 · Pie y vacía con caja de información — Notificaciones · lista y vacía · baja
- **Se ve:** caja `superficie-hundida` con 3 frases y "180 días".
- **Debería:** línea simple "Se guardan las notificaciones de los últimos 90 días." (lista) y sin caja en la vacía.
- **Arreglo:** `textos/notificaciones.ts` (`retencion`) y `contenido.tsx`. Verificar si 90 o 180 manda (04 §11).
- **Cómo verificar:** coincide.

### AJU-01 · Las filas del índice no traen resumen — Ajustes · índice · alta
- **Se ve:** una sola línea por fila (`ajustes__indice__telefono-claro.png`).
- **Debería:** nombre y resumen ("Empieza el día 21", "Conectado · último SMS hoy 12:41", "7 activos", "4", "Activas en este dispositivo", "2 factores · 1 sesión", "JSON y CSV", "Sin errores en 7 días", "Según el sistema") (`ajustes-indice__telefono-claro.png`).
- **Arreglo:** `ajustes/lista-ajustes.tsx` y la consulta `consultas/ajustes` (traer los resúmenes).
- **Cómo verificar:** cada fila con su resumen.

### AJU-02 · «Salir» ausente en el índice — Ajustes · índice · alta
- **Se ve:** no hay tarjeta Salir; en Seguridad sigue el enlace (`ajustes-seguridad__un-factor`).
- **Debería:** tarjeta Salir con "{correo} · en este dispositivo" bajo la lista (entrega-3 `ajustes-indice`).
- **Arreglo:** ya reportado como GLO-103 y GLO-104.
- **Cómo verificar:** ver GLO-103.

### AJU-03 · Títulos e íconos del índice — Ajustes · índice · baja
- **Se ve:** "Ciclo de los períodos" y "Exportar tus datos"; Diagnóstico con `activity`; Apariencia con el dibujo de `gear` (sol).
- **Debería:** "Ciclo", "Exportar", Diagnóstico con `info`, Apariencia con `sun` (entrega-3 `ajustes-indice`).
- **Arreglo:** `textos/ajustes-ciclo.ts`, `ajustes-exportar.ts`, `lista-ajustes.tsx:19-28`; el ícono es GLO-107.
- **Cómo verificar:** coincide.

### AJU-04 · «Respaldo atrasado» como texto de problema — Ajustes · índice · media
- **Se ve:** texto naranja bajo el título (`ajustes__indice-respaldo-atrasado__telefono-claro.png`; 14 px, `problema-texto`).
- **Debería:** insignia de advertencia (triángulo, `advertencia-fondo`, 13 px) a la derecha de la fila; es un aviso de advertencia, no de problema (entrega-3 `ajustes-indice`).
- **Arreglo:** `lista-ajustes.tsx:57-61`.
- **Cómo verificar:** insignia con triángulo y token `advertencia`.

### AJU-05 · Contenido a 624 px en computadora — Ajustes · índice · baja
- **Se ve:** `ajustes__indice__computadora-claro.png`: 624 px; la fila "Ajustes" de la barra está activa (bien).
- **Debería:** 720 px aproximados y sin campana pegada al borde (entrega-3 `ajustes-indice__computadora-claro.png`).
- **Arreglo:** `ajustes/page.tsx:18` (`max-w-xl`); ver MAS-107.
- **Cómo verificar:** el ancho coincide.

### AJU-06 · Las subpáginas de Ajustes son «flujo»: X, sin campana y sin barra inferior — Ajustes · ciclo, conectar SMS, formatos, instituciones, exportar, respaldo, diagnóstico, apariencia · teléfono y computadora · alta
- **Se ve:** "Cerrar (X)" y sin barra inferior ni campana (`ajustes-ciclo__principal`, `ajustes-formatos__lista`, `ajustes-exportar__principal`, `ajustes-respaldo__atrasado`, `ajustes-diagnostico__con-referencia`, `ajustes-apariencia__sistema`, `ajustes-conectar-sms__sin-token`, `ajustes-instituciones__lista`). En computadora, X junto al título sin "← Ajustes". Solo Seguridad y Notificaciones de Ajustes sí llevan flecha + campana + barra.
- **Debería:** pantalla hija: flecha "Volver a Ajustes" + campana + barra inferior; en computadora, enlace "← Ajustes" sobre el título (entrega-3 DECISIONES «Campana en Ajustes»; `formatos__computadora-claro.png`).
- **Arreglo:** estas rutas usan `PaginaFlujoDeRuta` (`componentes/navegacion/flujo-de-ruta.tsx`, `componentes/marco/pagina-flujo.tsx`, oculta barras con `data-pagina-flujo`); cambiar a la plantilla de pantalla hija usada por `ajustes/seguridad`.
- **Cómo verificar:** en cada subpágina la barra superior tiene flecha y campana y se ve la barra inferior.

### AJU-07 · Ciclo: aviso detrás de un botón — Ajustes · ciclo · media
- **Se ve:** al elegir el día no pasa nada hasta tocar «Ver el cambio»; select nativo (`ajustes-ciclo__aviso`).
- **Debería:** el aviso "Antes de confirmar" aparece al elegir el día, bajo el campo (`ciclo__telefono-claro.png`).
- **Arreglo:** `flujos/ajustes-ciclo/panel.tsx`: mostrar el aviso al cambiar el select; el botón sigue siendo «Cambiar el ciclo».
- **Cómo verificar:** el aviso aparece sin tocar nada más.

### AJU-08 · Conectar los SMS: sin tarjeta y con la guía de MacroDroid — Ajustes · conectar SMS · media
- **Se ve:** `ajustes-conectar-sms__token-generado__telefono-claro.png`: sin tarjeta, "Copiar" sin ícono, y debajo una guía de 14 filas de MacroDroid.
- **Debería:** aviso de estado ("Conectado. El último SMS llegó…"), tarjeta "TOKEN DE MACRODROID" con el token y "Copiar" con ícono, "Se muestra completo una sola vez, al generarlo." y "Generar un token nuevo" con ícono (`conectar-sms__telefono-claro.png`).
- **Arreglo:** `ajustes/webhook/page.tsx` y `flujos/ajustes-webhook`; la guía sobra o va en un detalle desplegable (decisión de producto).
- **Cómo verificar:** coincide.

### AJU-09 · URL partida a mitad de palabra — Ajustes · conectar SMS · baja
- **Se ve:** "http://localhost:3100/api/sm|s" (corte en medio).
- **Debería:** la URL en una línea o cortada por segmento.
- **Arreglo:** `overflow-wrap:anywhere` → `break-all` solo en el token; la URL con `break-word` por `/`.
- **Cómo verificar:** sin corte de palabras.

### AJU-10 · Formatos: sin chevron, sin «+» y «Inactivo» solo como texto — Ajustes · formatos · media
- **Se ve:** `ajustes-formatos__lista__telefono-claro.png`: filas sin `chevR`, "Nuevo formato" sin `+`, un párrafo introductorio de más, "Inactivo" en el subtítulo, «Instituciones» subrayado.
- **Debería:** `chevR`, `+ Nuevo formato`, "Inactivo" con indicador (círculo + texto), enlace «Instituciones» sin subrayar (`formatos__telefono-claro.png`).
- **Arreglo:** `ajustes/formatos/lista.tsx`.
- **Cómo verificar:** coincide.

### AJU-11 · Instituciones: enlace subrayado a Formatos — Ajustes · instituciones · baja
- **Se ve:** «Formatos bancarios» subrayado, filas sin chevron (`ajustes-instituciones__lista`).
- **Debería:** enlace de acción sin subrayar (`formatos__telefono-claro.png`).
- **Arreglo:** `ajustes/instituciones/lista.tsx`.
- **Cómo verificar:** coincide.

### AJU-12 · Notificaciones: sin interruptor, sin tarjetas y con el agente crudo — Ajustes · notificaciones · concedido · alta
- **Se ve:** texto suelto "Las notificaciones están activas…"; el dispositivo se llama «Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 …» (cuatro líneas), con «Quitar» tonal (`ajustes-notificaciones__concedido__telefono-claro.png`).
- **Debería:** tarjeta con interruptor "Notificaciones en este dispositivo" y "Permiso del navegador: concedido."; lista "Dispositivos" en tarjeta con "Este teléfono · Activado el 03/10"; «Quitar» como texto de peligro; nota "Si el permiso está denegado…" (`notificaciones__telefono-claro.png`).
- **Arreglo:** `ajustes/notificaciones/panel.tsx:133` (nombre legible a partir del agente), `textos/notificaciones.ts`.
- **Cómo verificar:** coincide, nombre legible.

### AJU-13 · Seguridad sin las sesiones en tarjeta limpia — Ajustes · seguridad · baja
- **Se ve:** «Este dispositivo» con ícono de persona.
- **Debería:** fila sin ícono (`seguridad__telefono-claro.png` de entrega-3).
- **Arreglo:** `ajustes/seguridad/sesiones.tsx`.
- **Cómo verificar:** coincide.

### AJU-14 · Un solo factor sin aviso de advertencia — Ajustes · seguridad · un factor · alta
- **Se ve:** `ajustes-seguridad__un-factor__telefono-claro.png`: factor, botón «Agregar un factor de respaldo», sin aviso.
- **Debería:** aviso de advertencia (`--advertencia-fondo`, triángulo) "Agregá otro factor antes de quitar este." debajo del factor, antes del botón tonal (DECISIONES «Un solo factor»; `entrega-3/pantallas/16-salir/seguridad-factor-unico__telefono-claro.png`).
- **Arreglo:** `ajustes/seguridad/lista-factores.tsx`: con un factor verificado, `AvisoEnLinea estado="advertencia"` (con `role="status"`).
- **Cómo verificar:** con un factor el aviso aparece con triángulo y token `advertencia`.

### AJU-15 · «Quitar» con un factor abre la pantalla «Quitar un factor» — Ajustes · seguridad · un factor · crítica
- **Se ve:** al tocar «Quitar» navega a `/ajustes/seguridad/factores/[id]/quitar` con X (`ajustes-seguridad__quitar-un-factor__telefono-claro.png`).
- **Debería:** DECISIONES: «No hay pantalla "Quitar un factor"»; con un solo factor «Quitar» no abre nada (el aviso lo explica).
- **Arreglo:** `lista-factores.tsx:56-62`: con un factor, «Quitar» no es enlace (deshabilitado con `aria-disabled`, o ausente); `flujos/ajustes-seguridad-factores-quitar/lector.tsx` redirige a Seguridad si hay un solo factor.
- **Cómo verificar:** con un factor no existe la ruta navegable desde la lista.

### AJU-16 · «Agregar un factor de respaldo» sin ícono — Ajustes · seguridad · baja
- **Se ve:** botón tonal sin glifo (`ajustes-seguridad__un-factor`, `…__dos-factores`).
- **Debería:** `+ Agregar un factor de respaldo` (referencia entrega-3).
- **Arreglo:** `lista-factores.tsx:70-76`, `Icono plus`.
- **Cómo verificar:** ícono visible.

### AJU-17 · Agregar factor: campo único, sin márgenes y con barras de pestaña — Ajustes · agregar factor · alta
- **Se ve:** `ajustes-seguridad__agregar-factor__telefono-claro.png`: el texto, el secreto, el campo «Código» y el botón llegan a x = 0 (sin 20 px laterales); título cortado ("AGREGÁ UN FACTOR DE RESP…"); campana y barra inferior presentes en un flujo que termina en Confirmar; el código es un campo único.
- **Debería:** 20 px de margen; flujo sin campana ni barra inferior (DECISIONES, marco); 6 casillas de 44 × 52 (DECISIONES «Código de verificación»).
- **Arreglo:** `flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx` (contenedor sin `px-5`), pasar a `PaginaFlujo`, usar el componente de 6 casillas del acceso; título más corto (`textos/seguridad.ts`).
- **Cómo verificar:** margen 20, sin barras, 6 casillas.

### AJU-18 · Sesiones: «Salir» como enlace — Ajustes · seguridad · alta (citado)
- **Se ve:** «Salir» como enlace en el pie de Seguridad.
- **Debería:** fuera de Seguridad (entrega 3).
- **Arreglo:** GLO-103.
- **Cómo verificar:** ver GLO-103.

### AJU-19 · Exportar: estructura distinta — Ajustes · exportar · media
- **Se ve:** dos secciones con título grande, párrafos y botón tonal de ancho completo, y una nota final (`ajustes-exportar__principal__telefono-claro.png`).
- **Debería:** tarjeta de dos filas con ícono, "Todo en JSON" / "Transacciones en CSV", subtítulo y «Descargar» tonal compacto a la derecha (`exportar__telefono-claro.png`).
- **Arreglo:** `ajustes/exportar/page.tsx` y `descargas.tsx`.
- **Cómo verificar:** coincide.

### AJU-20 · Respaldo: atraso como texto y sin tarjeta — Ajustes · respaldo · alta
- **Se ve:** "Atrasado. Pasaron más de 36 horas…" en texto naranja bajo el título; sin la fila «Lo hace» (`ajustes-respaldo__atrasado__telefono-claro.png`).
- **Debería:** aviso de advertencia "Respaldo atrasado" y tarjeta de tres filas: Último respaldo, Última prueba de restauración, Lo hace: GitHub Actions, cada noche (`respaldo__telefono-claro.png`).
- **Arreglo:** `ajustes/respaldo/page.tsx`, `AvisoEnLinea estado="advertencia"`.
- **Cómo verificar:** coincide.

### AJU-21 · Diagnóstico: eventos como texto y sin severidad — Ajustes · diagnóstico · media
- **Se ve:** "Aviso · respaldo · 17/10/2026 00:00 / token_invalido" en texto, sin indicador (`ajustes-diagnostico__con-referencia__telefono-claro.png`); el buscador lleva «Opcional» y no tiene ícono.
- **Debería:** buscador con lupa, filas con referencia, hora y origen, e indicador «Error» / «Correcta» (tres señales) y botón «Ejecutar tareas ahora» con ícono (`diagnostico__telefono-claro.png`).
- **Arreglo:** `ajustes/diagnostico/panel.tsx`.
- **Cómo verificar:** cada evento con indicador de estado.

### AJU-22 · Apariencia: orden, rótulos y tarjetas — Ajustes · apariencia · media
- **Se ve:** "Tema", Sistema / Claro / Oscuro en tarjetas separadas, texto "En otro dispositivo podés elegir uno distinto." (`ajustes-apariencia__oscuro__telefono-claro.png`).
- **Debería:** una tarjeta con Claro, Oscuro, Según el sistema (en ese orden) y "Se guarda en este dispositivo." (`apariencia__telefono-oscuro.png`).
- **Arreglo:** `ajustes/apariencia/panel.tsx` y `textos/ajustes-apariencia.ts`.
- **Cómo verificar:** coincide.

### AJU-23 · Quitar un factor (con 2): sin Cancelar ni resultado — Ajustes · quitar factor · baja
- **Se ve:** "¿Quitar Respaldo? Con ese factor ya no vas a poder ingresar." y un botón rojo «Quitar» (`ajustes-seguridad__quitar-factor`).
- **Debería:** sin diseño (FALTANTES factor-quitar); como mínimo con Cancelar y el resultado en el lugar.
- **Arreglo:** `flujos/ajustes-seguridad-factores-quitar/formulario.tsx`, a la espera del diseño.
- **Cómo verificar:** con el diseño aprobado.

### AJU-24 · Apariencia: botones sin nombre accesible — Ajustes · apariencia · media
- **Se ve:** el análisis marca 3 botones sin nombre (`analisis/ajustes-apariencia__claro.md`).
- **Debería:** cada opción con su nombre accesible.
- **Arreglo:** `componentes/base/seleccion.tsx` (el radio personalizado).
- **Cómo verificar:** el análisis no lista tocables sin nombre.

## Candidatos a global

- Tocables de acción de `AvisoEnLinea` menores de 44 (acción como enlace subrayado de 17 a 18 px de alto).
- `<select>` nativo con chevron grueso en Ciclo, Reglas y formularios (falta el `chev` del juego).
- Casilla nativa de 48 px donde el diseño usa interruptor o casilla circular (K2).
- `PaginaFlujoDeRuta` usada para pantallas hijas de Ajustes: X sin campana ni barra inferior.
- Texto «undefined/undefined/» en el campo de fecha vacío de los formularios de Programadas (revisar el componente de fecha en todas las pantallas).
- Contenido de 576 a 768 px en computadora en lugar de 1144 (Ajustes, Programadas, Por cobrar, Reglas, Notificaciones).
- Fecha larga "dd/mm/aaaa" donde la referencia usa "dd/mm" o relativa.
- Avisos de atraso como texto en `problema-texto` (Respaldo) en lugar de `AvisoEnLinea` de advertencia.

## Sin diseño

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

## Sin verificar

- La acción «Ver tarjeta →» de una notificación: la semilla usó un destino `{pantalla:'cuentas'}` que puede no ser el real; no se confirmó si la app dibuja la acción (MAS-135 no la incluye).
- `programadas__lista-sin-modelo`: no capturado (ver Inventario).
- Casos con error de red o sin conexión: cubiertos por otros agentes (aviso global del marco).
