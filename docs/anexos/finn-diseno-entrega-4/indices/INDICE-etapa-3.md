# Finn 2.0 · exportación del diseño · entrega 4 · etapa 3 · Bandeja, Revisar y Registrar

Fecha: 11/11/2026. Diseña los ítems 1 a 4 y los estados de Prioridad 3 de Revisar y Registrar de `docs/auditoria-diseno/PROMPT-DISENO.md`, con las respuestas del dueño del 11/11/2026. Las decisiones están en `DECISIONES.md`, sección "Entrega 4 · etapa 3" (E3-1 a E3-24), con su justificación y las alternativas descartadas, la fila nueva de movimiento de PANTALLAS §11 y la lista de textos nuevos.

Esta etapa se suma a las etapas 1 y 2: el paquete trae solo lo nuevo.

## 1 · Qué hay

31 estados. Cada uno en `__telefono-claro`, `__telefono-oscuro` y `__computadora-claro`, salvo `asa-al-pasar-y-con-foco`, que solo existe en computadora (el teléfono no tiene asa, E3-1): 91 HTML (con `data-rol` y `var(--token)`) y sus 91 PNG (teléfono a 2×, computadora a 1×, con «reducir movimiento»).

| Carpeta | Estados |
|---|---|
| `pantallas/S4-bandeja` | `arrastre-tomado`, `arrastre-sobre-destino`, `arrastre-soltado`, `arrastre-otra-categoria`, `arrastre-no-permitido`, `asa-al-pasar-y-con-foco` (solo computadora), `aprobar-todos`, `aprobar-todos-resultado`, `muchos` |
| `pantallas/01-revisar-movimiento` | `ingreso`, `no-reconocido-a-mano`, `datos-faltantes`, `aprobando`, `periodo-cerrado` |
| `pantallas/03-detalle-de-transaccion` | `conciliada` (Más acciones, sustituye al de la entrega 2), `editar-conciliada`, `editar-conciliada-solo-categoria`, `editar-dividida-parte-menor`, `editar-con-devolucion` |
| `pantallas/S5-registrar` | `borrador-recuperado`, `fecha-inexistente`, `fecha-posterior`, `calendario-abierto`, `otra-persona` |
| `pantallas/12-registrar-tipos-y-flujos-cortos` | `selector` (sustituye al de la entrega 2), `inversion-retiro`, `inversion-ajuste`, `entrada-a-tarjeta`, `avance-guardado`, `una-cuenta-de-efectivo`, `sin-cuentas` |
| `FALTANTES.md` | Actualizado: lo de esta etapa, marcado como diseñado, y ocho filas nuevas (una decisión pendiente, cuatro arrastres de etapas anteriores y tres pendientes que encontró la revisión) |
| `herramientas/` | Los generadores de esta etapa (`lib.py`, `lib3.py`, `gen_*.py`, `post3.py`), `barra_lateral3.py`, `contraste_dom.py`, `renderizar.py` y el armador de tableros con su `spec3.json` |

Cada estado parte de una referencia aprobada y cambia solo lo que cambia el estado:
- Bandeja: `S4-bandeja/principal` y `aprobado-con-un-toque` de la etapa 1.
- Revisar: `01-revisar-movimiento/listo` y `falta-categoria` de la entrega 2 (teléfono); en computadora, el marco de dos columnas de `S5-registrar/principal` de la etapa 1 (E3-10).
- Editar: `03-detalle-de-transaccion/editar` y `conciliada` de la entrega 2; en computadora, el mismo marco de dos columnas.
- Registrar gasto: `S5-registrar/principal` de la etapa 1, con el texto de 06 §5.6 («Propuesta: la cuenta de tu último gasto.»).
- Registrar: `12-registrar-tipos-y-flujos-cortos/selector`, `inversion` y `avance` de la entrega 2.

En computadora, los flujos no llevan campana y todas las vistas llevan la barra lateral de la entrega 3; las hojas pasan a panel lateral de 440 px.

## 2 · Componentes

Piezas nuevas, todas con tokens:
- **Asa de arrastre** (solo computadora): botón de 44 × 44 con `grip`, transparente hasta pasar el puntero o recibir el foco; lugar reservado en todas las filas.
- **Panel de destinos** (`PanelDestinosArrastre`, 05 §10.8): variante teléfono (rejilla de 2, sobre la barra inferior) y variante lateral (con los grupos). Destino de 48 px: libre con borde punteado, resaltado con fondo de acción, borde y glifo `in`.
- **Fila levantada** y **hueco** del arrastre.
- **Calendario** de `EntradaFecha`: panel bajo el campo con días de 44 px.
- **Bloqueo con motivo** en un selector (fondo hundido, `lock` y el motivo debajo), para las restricciones que el servidor ya conoce.

Se usan además: fila de la Bandeja (§7), resultado (§2.13), aviso en línea (§2.14), error en línea de `13-acceso/codigo-incorrecto`, botón deshabilitado con su motivo y glifo (§2.1), selector segmentado, hoja y panel lateral de 440 px, impacto «Antes de guardar» / «Después de aprobar», vacío (§2.19).

## 3 · Movimiento

La fila nueva de PANTALLAS §11 está en DECISIONES (E3-7): tomar, pasar sobre un destino, soltar y cancelar, con `--duracion-normal`, `--duracion-transicion`, `--duracion-rapida` y las curvas del sistema. Las tres animaciones nuevas (`fz-tomar`, `fz-destinos`, `fz-soltar`) están incrustadas en cada HTML que las usa, con la regla de «reducir movimiento». Lo demás entra como en la referencia (`fz-item`, `fz-pop-in`, hojas y paneles).

## 4 · Contraste de los pares nuevos

Medido con los valores de `tokens.css`, en claro y en oscuro. Además se midió cada texto renderizado contra su fondo real en los 91 archivos (`herramientas/contraste_dom.py`): todo pasa, salvo los botones deshabilitados (y «Marcar como pendiente», heredado de la entrega 2), que WCAG exime y que llevan su motivo escrito.

| Qué | Par | Claro | Oscuro | Mínimo | |
|---|---|---|---|---|---|
| Destino resaltado: nombre | `texto-sobre-accion` sobre `accion` | 7.29:1 | 6.76:1 | 4.5:1 | ✓ |
| Destino libre: borde punteado | `borde-control` sobre `superficie` | 4.16:1 | 4.08:1 | 3:1 | ✓ |
| Destino libre: nombre | `texto` sobre `superficie` | 18.50:1 | 15.24:1 | 4.5:1 | ✓ |
| «Otra categoría…» | `enlace` sobre `superficie` | 7.29:1 | 6.20:1 | 4.5:1 | ✓ |
| «Otra categoría…» resaltada | `enlace` sobre `accion-tonal` | 6.02:1 | 5.37:1 | 4.5:1 | ✓ |
| Fila levantada: «→ categoría» | `accion` sobre `superficie` | 7.29:1 | 6.20:1 | 4.5:1 | ✓ |
| Fila levantada: anillo | `accion` sobre `fondo` | 6.48:1 | 6.76:1 | 3:1 | ✓ |
| Hueco: borde | `borde-control` sobre `superficie-hundida` | 3.40:1 | 4.61:1 | 3:1 | ✓ |
| Asa: glifo | `texto-secundario` sobre `superficie-hundida` | 6.87:1 | 9.53:1 | 3:1 | ✓ |
| Anillo de foco del asa | `foco` sobre `superficie` | 7.29:1 | 6.20:1 | 3:1 | ✓ |
| Globo de la instrucción | `fondo` sobre `texto` | 16.45:1 | 16.64:1 | 4.5:1 | ✓ |
| «Aprobar todos (n)» | `accion` sobre `accion-tonal` | 6.02:1 | 5.37:1 | 4.5:1 | ✓ |
| Motivo no elegible en la fila | `advertencia-texto` sobre `superficie` | 6.13:1 | 10.40:1 | 4.5:1 | ✓ |
| Campo que falta: borde | `advertencia-texto` sobre `superficie` | 6.13:1 | 10.40:1 | 3:1 | ✓ |
| Línea del campo que falta | `advertencia-texto` sobre `fondo` | 5.45:1 | 11.35:1 | 4.5:1 | ✓ |
| Destino bloqueado: texto y candado | `texto-secundario` sobre `superficie-hundida` | 6.87:1 | 9.53:1 | 4.5:1 | ✓ |
| Aviso de información: título | `informacion-texto` sobre `informacion-fondo` | 6.07:1 | 7.67:1 | 4.5:1 | ✓ |
| Calendario: hoy | `texto-sobre-accion` sobre `accion` | 7.29:1 | 6.76:1 | 4.5:1 | ✓ |
| Calendario: día deshabilitado (tachado) | `texto-secundario` sobre `superficie` | 8.40:1 | 8.45:1 | 4.5:1 | ✓ |
| Botón del calendario abierto: glifo | `grafico-tinta` sobre `accion-tonal` | 15.28:1 | 13.22:1 | 3:1 | ✓ |

## 5 · Canvas

Tableros nuevos en la fila «Bandeja y Registrar»: E4-E3-Bandeja-Arrastre (a, b), E4-E3-Bandeja-Aprobar-Todos, E4-E3-Revisar (a, b), E4-E3-Registrar-Gasto (a, b) y E4-E3-Registrar-Tipos (a, b); y en «Actividad y Reportes», E4-E3-Editar-Transaccion (a, b). Las filas de abajo se corrieron 231 px para dejar 600 px antes de cada título. No se movió nada a Historial: los tableros de la entrega 2 de Revisar, Detalle de transacción y Registrar siguen vigentes en lo demás; una nota naranja junto a cada uno dice qué parte sustituye esta etapa.

## 6 · Demo

La demo navegable se actualiza al cierre, con todas las etapas juntas (lo acordado).

## 7 · Revisión independiente

Un agente que no participó revisó la etapa completa (los 91 PNG, el HTML, DECISIONES, INDICE y FALTANTES, contra 04 y las referencias). Encontró 2 bloqueantes, 14 importantes y 15 menores; esto es lo que se hizo.

| Hallazgo | Qué se hizo |
|---|---|
| **Bloqueante.** La dividida con una parte menor anunciaba un cambio posterior aunque el total no cambiaba | Aviso de información «Sigue conciliada» (04 PE y PC); E3-15 lo dice |
| **Bloqueante.** «Ana te debe $0.00 → $70.00» | $0.00 → $30.00 |
| Cambio posterior por una categoría en el detalle de la conciliada; fechas posteriores a hoy | Fila quitada (04: solo monto, fecha, cuenta o eliminación); fechas al 15/10 |
| `arrastre-no-permitido` sobre una fila arrastrable | La fila se muestra revalidada (ahora dividida, sin asa) con el mensaje; E3-5. `conflicto_desactualizado`, a FALTANTES `errores-flujos` |
| `aria-describedby="asa-instr"` sin destino en tres vistas | La instrucción está en toda vista de computadora con asa; sin ids repetidos ni referencias sueltas (comprobado en los 91 archivos) |
| Motivo de «Aprobar» atribuido a `movimiento_incompleto` sin serlo | Diferencia anotada en E3-12 |
| «Escribila o elegí Hoy» sin «Hoy» a la vista; error angosto | «El SMS no trae la fecha. Escribila.», a lo ancho de la fila |
| `EntradaFecha` distinto según la pantalla | Botón de 44 × 44 y «Elegir la fecha en el calendario» en todos los estados, también en los heredados de la entrega 2 |
| Fecha imposible con «Guardar» habilitado | «Guardar» deshabilitado con su motivo y «Antes de guardar» en espera, como Editar y Revisar |
| La fila levantada tapaba el destino resaltado | Va arriba del panel, sin tapar ningún destino; con el nombre completo |
| El motivo de exclusión reemplazaba el estado de la fila | Estado real con «Aprobar» y una línea «No entra en «Aprobar todos»: …»; AV-19 dice «Quedan 2 para revisar uno por uno» |
| Restaurantes negativo con dos señales | Marca «Deuda sin reservar» |
| Se podía quitar una parte con cobros | ✕ bloqueado con `lock` y «Tiene $10.00 cobrado: no se puede quitar.» |
| Panel lateral de destinos cortado; grupos distintos entre variantes | Panel más alto con desplazamiento; los mismos grupos en las tres variantes |
| «Otra categoría…» sin borde de destino | Borde punteado como los demás |
| Calendario: animación literal, `grid` falso, días sin nombre, ancho de 340 | Tokens de duración y curva, `group` con días «15 de octubre de 2026», ancho de la fila |
| Globo del asa tapando la fila | A la derecha del asa, sobre el panel |
| Anuncios: «cancelado» sin explicar, `assertive`, `status` anidados, barra inferior `aria-hidden` con foco | Explicado en E3-6; región cortés; avisos dentro del impacto sin rol propio; barra `inert` |
| Seis «Aprobar» iguales en `muchos` | Nombre accesible con comercio y monto (E3-24) |
| «1 de 6» con 3 en la Bandeja | «1 de 3» |
| Retiro sin saldo de la cuenta; «Guardar ajuste» contra E3-21 | Saldo en la vista previa; E3-21 explica por qué el ajuste no lleva el monto |
| Aprobando: campos de solo lectura iguales a los editables; «Descartar» cambiaba de forma | Fondo hundido; «Descartar» sigue como enlace, deshabilitado con su motivo |
| Período cerrado de Revisar sin la categoría | Fila de Gasolina en el período cerrado |
| Dos versiones del logo en la barra lateral | Símbolo de la marca en las vistas de esta etapa (E3-25); las de la etapa 1, a FALTANTES `logo-barra` |
| DECISIONES sin alternativas en cinco filas; remisión errada | Completadas; remisión a `bandeja-filas-etapa-1` |
| Pendientes que FALTANTES no tenía | `arrastre-traspaso` (con CP-8), `aprobar-todos-en-curso`, `logo-barra` y `conflicto_desactualizado` en `errores-flujos` |
| `CH-05-9.3-linea-de-ayuda.md` de la etapa 2 en el paquete | Fuera del paquete |

Después de los cambios: contraste medido otra vez en los 91 archivos (solo quedan los deshabilitados con su motivo), ningún valor suelto nuevo frente a las referencias aprobadas y todos los `aria-describedby` apuntan a un id que existe.
