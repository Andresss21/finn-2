# Finn 2.0 · Etiqueta de resultado (C-50)

Elegida por el dueño el 14/11/2026: **propuesta 2, etiqueta sobre la fila**. Enmienda el principio 5 de `DECISIONES.md` y la parte del resultado de C-46. Se aplica en toda la app, con una sola forma.

## 1. La regla en una frase

Después de una acción sobre una fila, el resultado aparece como **una etiqueta sobre esa fila**: una palabra y, si la hay, una acción. **Se va sola a los 3 s.** Espera mientras la estás usando. Si el resultado se puede deshacer, la fila conserva **↶** hasta la siguiente acción.

## 2. Anatomía

| Pieza | Valor |
|---|---|
| Forma | Pastilla: `--radio-pastilla`, alto mínimo 44 px (el de los tocables) |
| Fondo y borde | `--positivo-fondo`, borde de 1 px `--positivo-borde`, sombra `--elevacion-2` |
| Glifo | `check-circle` de 18 px en `--positivo-texto` (señal 1) |
| Palabra | Archivo 600, .8125rem, `--texto`, sin cortes (señal 2) |
| Acción | Botón de texto `--enlace`, 700, alto 44 px, con su glifo: ↶ para «Deshacer» |
| Fila afectada | Fondo `--positivo-fondo` mientras se ve la etiqueta (señal 3) y vuelve a `--superficie` con `--duracion-normal` |
| Rellenos | Izquierda `--espacio-3`; derecha `--espacio-1` con acción o `--espacio-3` sin acción; separación `--espacio-2`; margen derecho `--espacio-2` |
| Capa | Encima de la fila (`z-index` sobre el contenido de la lista, debajo de hojas y menús) |

Tres señales por estado: color de la fila, glifo y palabra.

## 3. Dónde se pega

1. **Fila sin datos a la derecha** (Estructura, filas de nombre solo): centrada en el alto de la fila, contra el borde derecho. Puede tapar el final del nombre durante los 3 s: el resaltado dice cuál fila es.
2. **Fila con monto o datos a la derecha** (Bandeja, Cuentas, Programadas, Metas): **pegada al borde de arriba de la fila, a la derecha**, la mitad afuera. El monto queda a la vista. La tarjeta que la contiene deja ver lo que sobresale (`overflow: visible`) y sus filas primera y última redondean sus propias esquinas. Referencia: `referencias/variantes/fila-que-se-va-aparece__*`.
3. **Encabezado de grupo** (mover un grupo): igual que 1, en el encabezado. Tapa «Editar grupo» durante los 3 s.
4. **La fila sale de la lista** (aprobar, descartar, eliminar, quitar un factor): la fila **se queda 3 s** en su lugar, resaltada y con la etiqueta, y después **se recoge**: la lista se cierra con `--duracion-normal` y `--curva-estandar`. Referencia: `referencias/variantes/fila-que-se-va-*`.
5. **La fila se mueve a otra sección** (desactivar una programada pasa a pausadas, desarchivar vuelve a su grupo): la etiqueta va en la fila, en su lugar nuevo.

## 4. Tiempo

- Visible **3000 ms**: token nuevo `--duracion-aviso` (propuesto en `estilos/tokens-propuesta.css`). La interfaz lo lee del token, no lo escribe.
- **Espera** mientras el puntero está encima, mientras el foco está dentro de la etiqueta o mientras hay un arrastre en curso. Cuando eso termina, **cuenta los 3 s completos otra vez**.
- Si el puntero o el foco llega mientras se está yendo, vuelve a verse entera.
- **La siguiente acción la reemplaza**: hay una sola etiqueta a la vez en la pantalla.
- Escape con el foco adentro la quita en el momento.
- Entrada: `aparecer` (opacidad y 4 px) con `--duracion-normal` y `--curva-enfasis`. Salida: opacidad con `--duracion-normal` y `--curva-salida`.
- Con `prefers-reduced-motion`: nada anima; aparece y se quita sin transición, y la fila que sale se quita sin recogerse.

## 5. «Deshacer» después: ↶ en la fila

- Si el resultado tiene inverso (mover), cuando la etiqueta se va queda un botón **↶** de 44 × 44 a la derecha de la fila, con `aria-label` «Deshacer: {nombre} vuelve a su lugar».
- Aparece también mientras la etiqueta se está yendo, debajo de ella.
- Se va con la **siguiente acción que cambia datos** o al salir de la pantalla.
- Deshacer (desde la etiqueta o desde ↶) devuelve la fila a su lugar y muestra «Volvió», sin acción.

## 6. Toda acción de la etiqueta tiene otro lugar

Esto es lo que permite que la etiqueta se vaya sola sin quitarle nada a nadie (WCAG 2.2.1):

| Acción en la etiqueta | Dónde sigue estando |
|---|---|
| Deshacer (mover) | ↶ en la fila hasta la siguiente acción; también se puede volver a mover |
| Ver transacción (aprobar) | Actividad |
| Restaurar (descartar) | Bandeja › Descartados |
| Archivarla de nuevo (desarchivar) | Editar categoría › Archivar |

Un resultado nuevo solo puede llevar una acción en la etiqueta si cumple esta regla.

## 7. Accesibilidad

- **4.1.3 Mensajes de estado.** Cada pantalla tiene **una** región `role="status"` (`aria-live="polite"`) fuera de la etiqueta. Al aparecer el resultado se escribe ahí **la frase completa** (columna «Se anuncia» de §8). La etiqueta en sí no es región viva: no se anuncia dos veces.
- **2.2.1 Tiempo ajustable.** La etiqueta confirma algo que ya se ve en pantalla (la fila en su lugar nuevo, la fila que ya no está), espera mientras se usa y su acción tiene otro lugar permanente (§6). No hay límite de tiempo para hacer nada.
- **2.1.1 Teclado.** La etiqueta está en el orden del DOM justo después del contenido de su fila: Tab llega a su acción. El foco no se mueve solo a la etiqueta.
- **Foco al deshacer:** vuelve al botón principal de la fila que regresó. **Foco al recogerse una fila** que tenía el foco: pasa a la fila siguiente, o a la anterior si era la última.
- **2.5.8 Tamaño del objetivo:** acción de 44 px de alto; ↶ de 44 × 44.
- **1.4.3 Contraste:** palabra en `--texto` sobre `--positivo-fondo` y enlace en `--enlace` sobre `--positivo-fondo`, en claro y oscuro (ya validados en los avisos positivos).

## 8. Textos exactos

| Pantalla y acción | Palabra | Acción | Se anuncia (región de estado) | Fila |
|---|---|---|---|---|
| Estructura · mover categoría (arrastre, barra «Mover» u Otro grupo) | Movida | Deshacer | Arrastre: «Soltaste. » + la frase. Barra: la frase sola. Frase: «Moviste {categoría} a {grupo}: ahora es {la primera…}.» o «Moviste {categoría}: ahora es {la segunda…} de {grupo}.» | Se queda, resaltada |
| Estructura · mover grupo | Movido | Deshacer | «Moviste el grupo {grupo}: ahora es {el segundo…}.» | Encabezado del grupo |
| Estructura · nueva categoría | Creada | — | «Creaste la categoría {categoría} en {grupo}.» | La fila nueva |
| Estructura · nuevo grupo (C-42) | Creado | — | «Creaste el grupo {grupo}. Todavía no tiene categorías.» | Encabezado del grupo nuevo |
| Estructura · deshacer | Volvió | — | «{categoría} volvió a su lugar: {la última de Casa}.» o «El grupo {grupo} volvió a su lugar.» | La fila en su lugar de antes |
| Estructura · desarchivar (E4-6) | Desarchivada | Archivarla de nuevo | «Desarchivaste {categoría}: volvió a {grupo}.» o «Desarchivaste {categoría} y el grupo {grupo}.» | La fila, ya en su grupo |
| Bandeja · aprobar con un toque o soltando (FE-25, E3-4) | Aprobado | Ver transacción | «Aprobado: {comercio} · {monto} · {cuenta} · {categoría}» (al soltar, antes: «Soltaste {comercio} en {categoría}.») | Se queda 3 s y se recoge |
| Bandeja · descartar | Descartado | Restaurar | «Descartado: {comercio} · {monto}» | Se queda 3 s y se recoge |
| Programadas · desactivar (E6-14) | Desactivada | — («Reactivar» ya está en la fila) | «Desactivaste {programada}: ya no se esperan sus pagos.» | Ya en pausadas |
| Programadas · eliminar | Eliminada | — | «Eliminaste la programada {nombre}.» y, si corresponde, «No tenía pagos registrados.» | Se queda 3 s y se recoge |
| Metas · eliminar | Eliminada | — | «Eliminaste la meta de {categoría}. Lo asignado y el Disponible no cambian.» | Se queda 3 s y se recoge |
| Metas · ajustar | Ajustada | — | «Ajustaste la meta de {categoría} a {monto}.» | Se queda, actualizada |
| Reglas · eliminar | Eliminada | — | «Eliminaste la regla de {comercio}.» (texto nuevo: no había referencia del resultado) | Se queda 3 s y se recoge |
| Seguridad · quitar un factor (E2-8) | Quitado | — | «Quitaste {factor}.» | Se queda 3 s y se recoge |
| Fila con ↶ | — | ↶ (solo glifo) | `aria-label` «Deshacer: {categoría} vuelve a su lugar» o «Deshacer: el grupo {grupo} vuelve a su lugar» | — |

Las palabras concuerdan con lo que se movió: categoría, meta, programada o regla en femenino; grupo, movimiento y factor en masculino.

## 9. Lo que no es etiqueta

**Banda, como hoy: no se va sola y lleva ×.** Un aviso entra aquí si muestra un problema, pide algo o trae información para leer o un enlace para usar que no tiene otro lugar:

- Problemas y avisos que piden algo: AV-19 («No se aprobaron {k}…»), «Esto ya no existe.» (E6-7), errores de envío, «Hay {n} SMS sin reconocer de {institución}…» con «Verlos en la Bandeja» (E5-13).
- Resultados con información o enlaces: «Aprobar todos» (E3-8: el resumen con «Ver en Actividad» y los que quedan para revisar uno por uno), «Repartido en» de Registrar (E4-2, un enlace por categoría y por deudor) y las propuestas de Reportes (E6-15, con números y «Deshacer»).

**Sin cambio:** «Copiada» de Inscribir queda en el botón (E2-6).

**Pendiente (P-3):** los resultados que no cuelgan de una fila de lista sino de un detalle: Cuentas (verificar saldo, ajuste registrado, conciliada, pagar tarjeta, próxima cuota del préstamo), Asignar y Mover dinero en el detalle de la categoría (E2-13) y el avance guardado (E3-22). Siguen como hoy hasta que el dueño decida.

## 10. Alternativas descartadas

- **Propuesta 1, línea bajo la fila:** empuja la lista 44 px al aparecer y al irse.
- **Propuesta 3, barra al pie:** queda lejos de la fila y tapa el pie de la pantalla.
- **La banda de C-46 tal cual:** pesada, 56 px, y había que cerrarla a mano.
- **Fila que se va: etiqueta en el título de la sección:** lejos de lo que se tocó.
- **Fila con monto: etiqueta centrada encima del monto:** tapa justo el dato que cambió.
- **Avisos de problema como etiqueta:** no caben en una palabra y no deben irse solos.
- **Una frase en la etiqueta («Movida a Comida fuera»):** el dueño eligió una palabra; la fila resaltada ya dice cuál y dónde.
- **Duración distinta según el texto:** con una palabra no hace falta; 3 s para todas.
