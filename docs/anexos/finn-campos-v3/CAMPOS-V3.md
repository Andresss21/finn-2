# K2 · Campos y controles · v3

**Fecha:** 13/11/2026 · **Decisión:** C-45 · **Reemplaza:** el estilo de campo de K2-Base («Campo con etiqueta», «Selección», «Buscador con sugerencias» y «Casilla · interruptor · opciones») y la parte de C-39 que deja la lista nativa en Safari y Firefox.
**No cambian:** botones, pestañas, superpuesto, menú de acciones, avisos, insignias ni el calendario (C-38). Siguen las reglas de 05 §10.7 (props, ids, `aria-*`) y 05 §4.3 (`aria-disabled` en el botón de enviar).

Referencias: `referencias/K2-Campos-v3__hoja-completa.png` (día y noche lado a lado) y una por sección y tema (`K2-Campos-v3__<sección>__<claro|oscuro>.png`). El CSS de referencia está en `campos-v3.css`. La lógica de máscaras, validación y reparto del prototipo está en `logica/` (motor.js y motor2.js). Se puede probar en el lienzo «Registrar gasto», tablero «Probar».

---

## 1. Idea

Los campos son **filas dentro de un grupo**, como las listas de Cuentas y Ajustes. El rótulo siempre está arriba del valor, dentro de la fila. Al enfocar un campo, **la fila se levanta**: cambia de superficie, sale 6 px a cada lado, se redondea y toma sombra. No hay anillo de color ni borde.

*Justificación:* el dueño probó contornos, halo, hundido, borde inferior, etiqueta en el borde, tarjeta y segmentado. Ninguno combinaba con el resto de la app. La lista agrupada usa piezas que Finn ya tiene, y «Solo sombra» fue la variante del foco que eligió.
*Alternativas descartadas:*
- Contorno gris o de acción: parece un formulario genérico.
- Halo: compite con el foco de los botones.
- «Más alta»: mueve demasiado el contenido.
- Hundido: se perdía al escribir y no se veía de noche.
- Etiqueta en el borde.

## 2. Anatomía y medidas

| Pieza | Valor |
|---|---|
| Grupo | `--superficie`, radio 16, `--elevacion-1`. Un grupo por bloque de datos; entre grupos, 20 px |
| Fila | alto mínimo **64**, relleno **10 × 16**, separador inferior 1 px `--borde-sutil` (la última sin separador). Primera y última fila con radio 16 arriba y abajo |
| Rótulo | Archivo 600, 12 px, interlineado 1.3, espaciado .04em, `--texto-secundario`. Es el `<label>` del control |
| Valor | Archivo 600, **17 px** (1.0625rem), interlineado 1.4, cifras tabulares, `--texto`. Vacío: el `placeholder` en `--texto-terciario`. El placeholder nunca reemplaza al rótulo |
| Ayuda | 13 px, `--texto-secundario`, debajo del valor |
| Error | dentro de la fila, debajo del valor: ícono octágono de 16 px y texto 14 px, peso 500, `--problema-texto` |
| Ícono a la derecha | 18 px: flecha (selección), calendario (fecha), lupa (buscador), candado (solo lectura) |
| Prefijo y sufijo | «$» antes y «%» después, con el estilo del valor en `--texto-terciario`. Están fuera del `<input>` |

## 3. Estados de la fila

| Estado | Cómo se ve |
|---|---|
| Normal | Fondo `--superficie` |
| **Foco** (`:focus-within`) | `z-index: 2`; fondo `--superficie-elevada`; radio 12; `margin: 0 -6px`; relleno lateral 22; separador transparente; `--elevacion-3`; rótulo en `--accion`. Transición de 120 ms en sombra, fondo, margen y relleno; sin transición con `prefers-reduced-motion`. Con `forced-colors: active` se agrega `outline: 2px solid CanvasText` |
| Error | fondo `--problema-fondo`; rótulo en `--problema-texto`; mensaje dentro de la fila. El control lleva `aria-invalid="true"` y `aria-describedby` apunta al mensaje |
| Error con foco | Se ve como el foco, más un anillo de 2 px `--problema-borde` y `--elevacion-2` en lugar de `--elevacion-3`. El mensaje sigue visible |
| Con ayuda | La ayuda va debajo del valor y entra en `aria-describedby` |
| Solo lectura | Texto plano, no un `<input>`, así que no recibe foco. A la derecha del rótulo dice «Solo lectura»; a la derecha del valor va el candado; debajo, el porqué («La cuenta viene del SMS y no se puede cambiar aquí.») |
| Deshabilitado | Rótulo, valor e ícono en `--texto-deshabilitado`; cursor `not-allowed`; no recibe foco. Si no es obvio por qué está deshabilitado, la ayuda lo dice |
| Opcional | «Opcional» a la derecha del rótulo, dentro del `<label>` (05 §10.7: va en la etiqueta). 12 px, `--texto-terciario` |

En un grupo con varias filas solo se levanta la activa. Las demás no se mueven: el margen negativo no empuja a las vecinas.

## 4. Total (billete)

Es la pieza para el total del movimiento, en Registrar gasto, Registrar ingreso, Cobro y la edición de una transacción. Hay **uno por pantalla**; los demás montos van en fila.

| Pieza | Valor |
|---|---|
| Caja | `--marca` y `--texto-sobre-marca`; radio 20; relleno 16 / 18 / 14; `--elevacion-1`. De noche la marca está invertida, así que el billete es claro |
| Rótulo | «Total», 12 px, 600, mayúsculas, espaciado .06em, opacidad .8 |
| Cifra | Archivo 800, `font-stretch: 72%`, **44 px**, cifras tabulares. «$» a 28 px con opacidad .7. El cursor es del color del texto |
| Línea | Borde inferior de 2 px: `--texto-sobre-marca` al 28 % en normal, al 100 % con foco y `--problema-borde` con error |
| Ayuda | «Las comas de miles se ponen solas.» (13 px, opacidad .75) |
| Error | Debajo de la caja, fuera de ella, con el estilo de error de la fila |

## 5. Máscaras y validación

La lógica de referencia está en `logica/motor.js`.

| Campo | Máscara | Teclado |
|---|---|---|
| Monto | Solo dígitos y un punto. Comas de miles mientras se escribe, hasta 2 decimales, sin ceros a la izquierda, máximo 9 dígitos enteros. Al salir se completa a dos decimales («1,236.40») | `inputmode="decimal"` |
| Fecha | Se escriben 8 dígitos; las barras se ponen solas (`dd/mm/aaaa`) | `inputmode="numeric"` |
| Porcentaje | Hasta 3 enteros sin separador de miles y hasta 2 decimales. El «%» va fuera del input | `inputmode="decimal"` |

**Cuándo se valida:**
- **En el momento:** lo que no se arregla escribiendo más, como un monto mayor que $21,474,836.47, un porcentaje mayor que 100, partes que ya pasan el total o una fecha que no existe.
- **Al salir del campo:** lo incompleto, como una fecha a medias o porcentajes que todavía no suman 100.
- **Al tocar Guardar:** todo lo demás.

El botón Guardar se ve apagado mientras falte algo, pero sigue siendo tocable (`aria-disabled`). Al tocarlo marca todos los errores y lleva el foco al primero. Debajo del botón siempre dice qué falta.

**Textos exactos (los del prototipo):**
- «Escribí un monto mayor que $0.00.»
- «El máximo es $21,474,836.47.»
- «Completá la fecha como dd/mm/aaaa.»
- «Esa fecha no existe. Escribila como dd/mm/aaaa.»
- «Elegí una fecha del 21/09 al 15/10/2026: el período actual, hasta hoy.» (el rango sale del período en contexto, C-38)
- «Elegí una categoría.» y, con división, «Elegí la categoría de tu parte.»
- «Elegí con quién lo dividís.»
- «Cada parte va de 0 a 100 %.»
- «Suman {n} %. Sobran {m} %.»
- «Suman {n} %. Falta repartir {m} % ({monto}).»
- «Las partes pasan el total por {monto}.»
- «Las partes suman {a} y el total es {b}.»
- Debajo de Guardar: «Corregí {n} campo(s) para guardar.», «Escribí el monto para guardar.», «Elegí una categoría para guardar.», «Terminá de repartir el total.»

## 6. Selección (`Seleccion`)

- **Disparador:** una fila con el valor, una línea secundaria opcional («Disponible $62.85»; si es negativo, en `--problema-texto`) y una flecha. Sin elegir, muestra «Elegí una categoría» en `--texto-terciario`. Es un `<button aria-haspopup="listbox" aria-expanded>` y su nombre accesible es el rótulo más el valor.
- **Lista:** es propia de Finn en todos los navegadores, nunca el `<select>` del sistema.
  - Panel: `--superficie-elevada`, borde 1 px `--borde-sutil`, radio 14, `--elevacion-3`, relleno 6, alto máximo 340 con desplazamiento. Se abre debajo de la fila (`top: calc(100% − 6px)`, 8 px de margen a cada lado) sin tapar el rótulo.
  - Grupos: cada uno con su rótulo de 12 px en mayúsculas.
  - Opciones: alto mínimo 48, radio 10, nombre a 16 px (500) y línea secundaria a 13 px.
  - La opción elegida lleva fondo `--accion-tonal`, peso 700 y check de 18 px en `--accion`.
  - La opción bajo el puntero o el teclado lleva fondo `--superficie-hundida`.
- **Teclado** (patrón *listbox* de ARIA):
  - Las flechas mueven la opción activa (`aria-activedescendant`), Inicio y Fin van a los extremos, y escribir letras salta a la opción.
  - Intro elige y cierra; Escape cierra sin cambiar.
  - Al cerrar, el foco vuelve al disparador. Un clic afuera cierra.
- **Pocas opciones:** con 3 o menos opciones se muestran todas como segmentado (Cuenta: Efectivo · Visa Oro · Mastercard). Con 4 a 7 se puede usar `Opciones` (radios en filas). Con más de 7 se usa la lista.
- **Estados:** cerrada, sin elegir, abierta, con error y deshabilitada, más el foco de la fila.

## 7. Buscador con sugerencias (`Buscador`)

- Usa la misma fila y el mismo panel que la selección; el ícono es la lupa. Sigue el patrón *combobox* de ARIA: el input lleva `role="combobox"`, `aria-expanded`, `aria-controls` y `aria-autocomplete="list"`.
- **Buscando:** se busca después de 250 ms sin escribir. Mientras tanto, «Buscando…» aparece a la derecha de la fila, en 13 px.
- **Con resultados:** la parte que coincide con lo escrito va en 700 y el resto en 500. La línea secundaria dice «Suele ir a {categoría}». Una región `status` anuncia «{n} comercios».
- **Sin resultados:** el panel dice «No hay comercios con «{texto}». Se guarda como comercio nuevo.»
- **Error:** el panel muestra «No se pudo buscar.» y el botón tonal «Intentar de nuevo», con fondo `--accion-tonal`, alto 40 y **sin subrayado** (C-33). Es un botón, no un enlace.
- Lo escrito se respeta: si no se elige nada, se guarda tal cual.

## 8. Casilla, interruptor y opciones

**Toda la fila es el blanco táctil:** alto mínimo 56, el control y el texto juntos dentro de un `<label>`. Con foco, la fila se levanta como un campo.

| Control | Medidas y estados |
|---|---|
| Casilla | 22 × 22, radio 6, a la izquierda del texto. Sin marcar: borde 2 px `--borde-control`. Marcada: fondo `--accion` con check de 16 px en `--texto-sobre-accion`. A medias (`aria-checked="mixed"`): igual, pero con un guion. Deshabilitada: borde `--borde-sutil` y fondo `--superficie-hundida`. Si la fila tiene una cifra, va a la derecha |
| Interruptor | 44 × 26 con perilla de 20, **a la derecha** de la fila. Apagado: `--borde-control`; encendido: `--accion`. Deshabilitado: pista `--superficie-hundida` y perilla `--borde-sutil`. Lleva `role="switch"` y anuncia su estado |
| Opciones (radio) | Círculo de 22 con borde 2 px. Elegida: borde `--accion` y punto de 10. Deshabilitada: borde `--borde-sutil` y fondo `--superficie-hundida`. Va dentro de un `radiogroup` con su nombre |

## 9. Elección (pocas opciones a la vista)

En todas estas piezas, lo elegido lleva borde 2 px `--accion`, fondo `--accion-tonal` y peso 700. El foco de teclado es `outline: 2px solid var(--foco)` con separación de 2 px.

- **Tarjetas de elección** («Solo yo» y «Con alguien»): son un `radiogroup` de dos columnas, alto mínimo 96, radio 16, ícono de 22, título y una línea de detalle.
- **Segmentado:**
  - pista `--superficie-hundida`, radio 11, relleno 3;
  - opciones de alto mínimo 44 y radio 8;
  - la elegida lleva fondo `--superficie` y sombra `0 0 0 1px var(--borde-control), 0 1px 2px rgba(0,0,0,.08)`.
- **Chips de selección múltiple** (personas):
  - alto 44, radio 999; avatar de 30 con la inicial, que se vuelve check al marcar;
  - `role="checkbox"` dentro de un `group` con nombre;
  - la persona creada en este registro lleva la etiqueta «Nueva» (`--informacion-fondo` y `--informacion-texto`);
  - «Otra persona» es un chip con borde punteado `--borde-control` y texto `--enlace`.
- **Agregar otra persona:**
  - Una fila en línea que ya entra levantada, con el rótulo «Nombre de la persona» y los botones «Cancelar» (discreto) y «Agregar» (principal).
  - Intro agrega y Escape cancela.
  - Reglas:
    - El nombre se capitaliza.
    - Un nombre que ya existe, sin importar mayúsculas, reutiliza a esa persona y lo avisa con `role="status"`: «Ya tenías a Ana en Por cobrar: la sumamos.»
    - Rechaza «vos» y «yo» con «Tu parte ya está: escribí el nombre de la otra persona.»
    - Vacío: «Escribí un nombre.»
    - Más de 19 personas: «Llegaste al máximo: hasta 19 personas.» Vos más 19 da 20 líneas, el máximo de `lineas` (05).

## 10. Fila de parte (división)

- **Rejilla:** `40px · 1fr · auto · auto`, separación 12, sobre una fila de 64.
- **Avatar:** 40 px con la inicial. Vos va en `--accion-tonal` / `--accion`; las demás personas en `--deuda-fondo` / `--deuda-texto`.
- **Nombre y destino:** el nombre va en 16 px y 700. El destino va en 13 px y se corta con «…»:
  - «Tu parte · {categoría}»;
  - «Te debe · queda en Por cobrar»;
  - «Persona nueva · queda en Por cobrar».
- **Cifra a la derecha:**
  - **En partes iguales:** fija, a 20 px en `CIFRA`, con el porcentaje debajo. El centavo que sobra queda en Vos ($1,236.40 entre tres da $412.14, $412.13 y $412.13).
  - **Porcentaje:** una entrada compacta de 5ch sobre `--superficie-hundida`, radio 10 y «%» fijo, con el monto calculado debajo. Con foco lleva un anillo de 2 px `--accion`. Al sumar 100, Vos absorbe el redondeo.
  - **Montos:** igual, con «$» fijo y 8ch de ancho; el porcentaje va debajo.
- **Quitar:** una × de 36 en todas las filas menos la de Vos. Su nombre accesible es «Quitar a {nombre}».
- **Resumen debajo del grupo** (`role="status"`, radio 12): «Repartido {a} de {b}» en `--positivo-*`, o el error de §5 en `--problema-*`.

## 11. Guardar

Ocupa todo el ancho, alto 52 y radio 12. Listo: `--accion`. Falta algo: `--superficie-hundida` y `--texto-deshabilitado`, con `aria-disabled="true"` y `aria-describedby` hacia el motivo, que va debajo, centrado, en 14 px. El texto incluye el total: «Guardar $1,236.40».

## 12. Accesibilidad (resumen)

- **Contraste medido** (texto de 4.5 en adelante; elementos que no son texto, de 3 en adelante):

  | Par | Día | Noche |
  |---|---|---|
  | rótulo con foco (`--accion` sobre `--superficie-elevada`) | 7.29 | 5.53 |
  | error (`--problema-texto` sobre `--problema-fondo`) | 4.55 | 6.75 |
  | placeholder (`--texto-terciario` sobre `--superficie`) | 5.65 | 5.62 |
  | elegida (`--accion` sobre `--accion-tonal`) | 6.02 | 5.37 |
  | borde de casilla (`--borde-control`) | 4.16 | 4.08 |
  | anillo de error (`--problema-borde`) | 4.46 | 4.85 |

- **Foco:** de día, `--superficie-elevada` es igual a `--superficie`. El foco se nota por la sombra, el desplazamiento y el rótulo en acción, más el cursor del input. Cumple 2.4.7 (AA). En modo de alto contraste se agrega el contorno de §3.
- **Blancos táctiles:** 44 × 44 como mínimo en todo; las filas tienen 56 o 64.
- **Nombres accesibles:** todo control tiene `<label>` o `aria-label`, y los errores van en `aria-describedby`. Un error que aparece en el momento se anuncia una vez: el mensaje tiene `role="alert"` solo al aparecer.

## 13. Abierto (no decidido en esta entrega)

- **P-1 · División entre categorías.**
  - FT-21 y 05 piden repartir una compra entre varias categorías (Supermercado $96.10 · Farmacia $22.50 · Carlos $30.00).
  - La pieza «¿Quién paga?» resuelve el reparto entre personas, pero la parte de Vos va a una sola categoría.
  - **Propuesta para decidir:** una acción «Dividir mi parte en categorías» en la fila de Vos que abra filas de categoría (`CampoLineas`) con la misma fila de parte. Hasta que se decida, `CampoLineas` sigue como está en 05.
- **P-2 · «Editar estructura» en el menú ☰ del teléfono.** La pregunta del dueño sigue abierta: dejarla como grupo «En Presupuesto» (C-43), que solo aparece en Presupuesto, o pasarla a una fila al pie de la lista de categorías.
