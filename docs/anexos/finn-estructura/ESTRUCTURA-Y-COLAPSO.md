# Estructura: colapsar y ordenar arrastrando · Presupuesto: colapsar

**Fecha:** 13/11/2026 · **Decisiones:** C-46 (Estructura), C-47 (Presupuesto) y C-48 (P-2).

**Referencias:**
- `referencias/estructura/`: 14 estados × teléfono y computadora × claro y oscuro.
- `referencias/presupuesto/`: 4 estados × claro y oscuro.
- Cada referencia está en HTML y en PNG.

**Lógica de referencia:** `logica/estructura.js`, con el orden, los lugares, los ordinales y los textos.

**Prototipo:** lienzo «Finn 2.0 · Estructura · colapsar y arrastrar», tablero «Probar», propuesta 3.

**Qué no cambia:**
- Lo que se puede hacer con grupos y categorías: crear, renombrar, archivar y mover (FT-18).
- Las operaciones: OP-07 y OP-08.
- Los paneles «Nueva categoría», «Nuevo grupo» y «Editar», que usan campos v3 (C-45).
- «Archivadas · N» (E4-6) y «Listo».

---

## 1. Estructura (`/presupuesto/estructura`)

### 1.1 Grupo

| Pieza | Medida y estilo |
|---|---|
| Encabezado | Fila de 44 px de alto, fuera de la tarjeta. Contiene, en orden: el **asa** (44 × 44), el **botón de colapsar** (flecha de 18 px y nombre) y «Editar grupo». La flecha mira abajo con el grupo abierto y gira −90° con el grupo colapsado. El nombre usa el estilo de rótulo: 12 px, 600, espaciado .06em, mayúsculas y `--texto-secundario`. «Editar grupo» va en 14 px y 700, color `--enlace`, sin subrayado (C-33) |
| Botón de colapsar | Es un `<button>` con `aria-expanded`. Su nombre accesible es el nombre del grupo. Ocupa todo el ancho que dejan el asa y «Editar grupo» |
| Tarjeta | `--superficie`, radio 16, `--elevacion-1` |
| Colapsado | La tarjeta queda con **una fila de resumen** (botón con `aria-expanded="false"`, alto mínimo 60, relleno 8 × 16). Arriba dice «{n} categorías» (16 px, 600) y debajo el resumen de nombres (14 px, `--texto-secundario`). Tocarla expande el grupo |
| Abierto | Las filas de categoría y, al pie, «+ Nueva categoría» (alto 48, 14 px, 700, `--enlace`) |

**El resumen de nombres** sigue el orden del grupo:
- 1 categoría: «A».
- 2: «A y B».
- 3: «A, B y C».
- 4 o más: «A, B y {n − 2} más».
- 0: «Todavía no tiene categorías.».

**«Colapsar todos» y «Expandir todos»** van arriba a la derecha de la lista, como botón con estilo de enlace. Dice «Colapsar todos» mientras haya algún grupo abierto y «Expandir todos» cuando están todos colapsados.

**Qué se recuerda:**
- Los grupos colapsados se guardan **en el dispositivo**, en `localStorage`, con la clave `finn.colapsados.estructura` (una lista de ids de grupo).
- Un id que ya no existe se ignora.
- La primera vez todo está expandido, y un grupo nuevo nace expandido.
- No hace falta tocar 04.

### 1.2 Categoría

| Pieza | Medida y estilo |
|---|---|
| Fila | Alto mínimo 56, relleno 4 / 6 / 4 / 4 y separador de 1 px `--borde-sutil` |
| Asa | Botón de 44 × 44 a la izquierda, **siempre visible**, con el glifo de 6 puntos (20 px, `--texto-secundario`). Su nombre accesible es «Mover {categoría}» y lleva `aria-expanded` según esté abierta su barra «Mover». `touch-action: none`. Al pasar el puntero, fondo `--superficie-hundida`. Foco: contorno de 2 px `--foco` |
| Cuerpo | El resto de la fila es un `<button>` que abre «Editar categoría». Muestra el nombre (16 px, 600) y, si existe, la línea de meta (14 px) |

### 1.3 Arrastrar con el asa

- **Inicio:** al presionar el asa y mover **4 px** empieza el arrastre, igual en teléfono y computadora. No hay pulsación larga ni asa que aparezca al pasar el puntero (diferencia con E3-1, ver C-46). Presionar en el cuerpo de la fila nunca arrastra.
- **Tomar:**
  - La fila deja un **hueco**: margen 6 / 8, alto mínimo 48, borde punteado de 2 px `--borde-control`, radio 12 y fondo `--superficie-hundida`.
  - Encima, bajo el dedo, va la **fila levantada**:
    - fondo `--superficie-elevada`, radio 12;
    - anillo de 2 px `--accion` y `--elevacion-3`;
    - escala 1.03;
    - el asa en `--accion`.
  - La fila levantada muestra el nombre y, debajo, el destino: glifo de entrada de 18 px más «→ {ordinal} en {grupo}» (13 px, 700, `--accion`).
- **Sobre otro grupo abierto:** el hueco se mueve a la posición donde caería. Su tarjeta se resalta con un anillo de 2 px `--accion` y `--elevacion-2`. Son tres señales: el anillo (color), el glifo y el texto «→ …».
- **Sobre un grupo colapsado:**
  - Su encabezado toma fondo `--accion-tonal` con un anillo interior de 2 px `--accion`.
  - Debajo aparece «Soltá aquí para dejarla al final · se abre en un momento» (13 px, 600, `--accion`).
  - A los **650 ms** el grupo se abre y se puede elegir la posición.
  - Si se suelta antes, la categoría queda al final y el grupo se abre para mostrar el resultado.
- **Desplazamiento:** si el dedo queda a menos de 56 px del borde superior o inferior de la zona que se desplaza, la lista se desplaza sola.
- **Soltar:** se manda un solo OP-08 con `grupoId` y `orden`.
  - Mientras se espera la respuesta, la fila queda en su lugar nuevo.
  - Si la respuesta es `nombre_repetido` («Ya existe {nombre} en {grupo}.»), la fila vuelve a su lugar y el mensaje queda debajo de ella como error en línea (glifo de 16, `--problema-texto`, `role="alert"`), como en E3-5.
  - Soltar en el mismo lugar no manda nada.
- **Cancelar:** Escape, soltar fuera de la pantalla o perder el puntero (`pointercancel`). La fila vuelve a su lugar y no se manda nada.
- **Mover un grupo:**
  - Se arrastra desde el asa de su encabezado.
  - Al tomarlo, **todos los grupos se colapsan** a su encabezado y su resumen. Al soltar o cancelar vuelven como estaban.
  - La fila levantada del grupo muestra su nombre y «→ {ordinal} lugar · {n} categorías».
- **Pagos de tarjeta:**
  - Va fijo: al final en el teléfono y en la columna derecha en computadora.
  - No tiene asa ni flecha, no se colapsa y nada se suelta en él.
  - A la derecha del nombre dice «Lo administra Finn», con el glifo de candado.

### 1.4 La barra «Mover» (sin arrastre: teclado, lector de pantalla y quien no puede arrastrar)

**Cuándo se abre:** al tocar el asa sin moverla, o con Enter o Espacio sobre ella. Aparece debajo de la fila:
- La fila y la barra van en fondo `--accion-tonal`.
- La barra tiene relleno 10 / 12 / 12 y es un `role="group"` llamado «Mover».

**Qué tiene la barra:**
- **Línea de estado** (`role="status"`, 14 px, 600): «{categoría} es {la ordinal} de {grupo}.».
- **Botones** tonales de 44 de alto: «Subir», «Bajar», «Otro grupo» y «Listo».
  - «Subir» y «Bajar» **cruzan de grupo**: subir la primera de un grupo la lleva al final del grupo anterior, que se abre si estaba colapsado.
  - En el primer lugar posible, «Subir» queda deshabilitado; en el último, «Bajar».
- **«Otro grupo»** (`aria-expanded`) abre «Llevarla al final de:» con un botón por cada grupo.

**Qué pasa con cada toque:** se manda un OP-08, el resultado se actualiza (§1.5) y el foco se queda en el botón tocado.

**«Listo»:** cierra la barra y devuelve el foco al asa.

**Para un grupo:** su barra va debajo del encabezado, con «{grupo} es el {ordinal} grupo.», «Subir», «Bajar» y «Listo».

**Las flechas de subir y bajar salen de las filas.** Solo existen en esta barra.

### 1.5 Resultado en el lugar (principio 5, C-42)

- **Dónde va:**
  - Debajo de la fila movida o creada, dentro de la tarjeta.
  - Para un grupo, debajo de su encabezado, con radio 14.
- **Cómo se ve:**
  - fondo `--positivo-fondo`, alto mínimo 56;
  - check de 20 px `--positivo-texto`;
  - texto en 14 px, 500;
  - «Deshacer» con el glifo de volver (`--enlace`, 700, 44 de alto);
  - × de 44 × 44 llamada «Cerrar este aviso».
- **Cómo funciona:**
  - Lleva `role="status"`.
  - **Hay uno solo a la vez:** la siguiente acción lo reemplaza.
  - **No desaparece solo:** queda hasta la ×, la siguiente acción o salir de la pantalla.
- **Deshacer:** vuelve al orden anterior (un OP-08 con la posición original). El resultado pasa a «{categoría} volvió a su lugar: {la ordinal} de {grupo}.», sin «Deshacer».
- **Reemplaza** al aviso «Moviste {nombre}.» que hoy queda fijo arriba.

## 2. Presupuesto (`/presupuesto`), solo colapsar

- **Encabezado:** cada grupo de usuario lleva un `<button>` con `aria-expanded`, con la flecha, el nombre y, a la derecha, su Disponible, como hoy.
- **Teléfono, colapsado:** la tarjeta queda en una fila de resumen:
  - «{n} categorías» (16 px, 600) y, a la derecha, el **Disponible del grupo** en la cifra de la fila (800, condensada, 22 px);
  - debajo, «Asignado {a} · Gastado {g}» (14 px, `--texto-secundario`);
  - debajo, **los avisos de sus categorías**, con las mismas etiquetas de la fila y agrupados: «Falta para la meta · 2 categorías». «Meta cubierta» no se repite.
- **Computadora, colapsado:** la fila del grupo usa las columnas de la tabla:
  - flecha, NOMBRE y «· {n} categorías», con los avisos debajo;
  - Asignado, Gastado y Disponible en sus columnas.
  - Abierto, la fila del grupo muestra solo la flecha, el nombre y «· {n} categorías».
- **Color del Disponible del grupo:**
  - mayor que 0: `--positivo-texto`;
  - 0: `--texto`;
  - negativo: `--deuda-texto` si todos los sobregiros del grupo son de tarjeta; si no, `--problema-texto`.
- **Datos:** salen de `PresupuestoDto.grupos[].totales` y de las `FilaCategoria`. **La interfaz no suma montos.** Contar categorías por `clasificacion` sí está permitido, porque no es un cálculo de dinero.
- **Con un filtro activo** (Sobregiradas, Sin fondos o Cubiertas):
  - los grupos se muestran abiertos y sin flecha, porque el filtro existe para ver esas categorías;
  - al volver a «Todas» regresa lo guardado.
- **«Colapsar todos» y «Expandir todos»:** debajo de los filtros, a la derecha (teléfono), o arriba de la tabla (computadora).
- **Qué se recuerda:** se guarda en `finn.colapsados.presupuesto`, aparte de Estructura.
- **Lo que no cambia:** Pagos de tarjeta no se colapsa (el DTO no trae su total) y no hay arrastre.

## 3. Movimiento (solo tokens; con «reducir movimiento» no se anima nada)

| Acción | Transición |
|---|---|
| Tomar | Escala 1 → 1.03 y `--elevacion-3`, en `--duracion-normal` con `--curva-estandar` |
| El hueco cambia de lugar | Las filas y grupos que se corren van de su posición vieja a la nueva (técnica FLIP): `--duracion-normal`, `--curva-estandar` |
| Resaltar el destino | Fondo y anillo en `--duracion-rapida` |
| Soltar | La fila va de donde está el dedo a su lugar (`--duracion-normal`, `--curva-estandar`). El resultado aparece con opacidad y −4 px → 0 (`--duracion-normal`, `--curva-enfasis`) |
| Cancelar | La fila vuelve a su lugar (`--duracion-normal`, `--curva-estandar`) |
| Colapsar o expandir | La flecha gira 90° y lo de abajo se corre (`--duracion-normal`, `--curva-estandar`). El contenido nuevo aparece en `--duracion-rapida` |

Ningún movimiento lleva información: las tres señales de cada estado quedan sin animación.

## 4. Anuncios (región de estado, cortés, en voseo; como E3-6)

Cada referencia lleva el anuncio de su estado en un `role="status"` oculto (`data-anuncio="estructura"`).

**Al arrastrar:**
- «Tomaste {categoría}.»
- «Tomaste el grupo {grupo}. Los grupos se colapsan mientras lo movés.»
- «Sobre {grupo}: {la ordinal}.» Sobre un grupo colapsado se agrega «, al final».
- «Se abrió {grupo}.»
- «{grupo}: {ordinal} lugar.»

**Al soltar o cancelar:**
- «Soltaste. {texto del resultado}»
- «Soltaste {categoría} en su mismo lugar.»
- «Arrastre cancelado. {categoría} volvió a su lugar.»

**Con la barra «Mover»:**
- «Mover {categoría}: {la ordinal} de {grupo}.»
- «Barra Mover cerrada.»

**Al colapsar o expandir:**
- «Colapsaste {grupo}.» / «Expandiste {grupo}.»
- «Colapsaste todos los grupos.» / «Expandiste todos los grupos.»

## 5. Textos nuevos

**Resultados:**
- «Moviste {categoría}: ahora es {la ordinal} de {grupo}.»
- «Moviste {categoría} a {grupo}: ahora es {la ordinal}.»
- «Moviste el grupo {grupo}: ahora es {el ordinal}.»
- «Creaste la categoría {categoría} en {grupo}.»
- «{categoría} volvió a su lugar: {la ordinal} de {grupo}.»
- «El grupo {grupo} volvió a su lugar.»

**Ordinales:**
- Femenino para las categorías y masculino para los grupos.
- Del primero al décimo: «primera… décima» y «primero… décimo». Después, «{n}.ª» o «{n}.º».
- Si hay más de dos y es la última posición: «la última» / «el último».
- Si es la única: «la única» / «el único».

**Destinos y barra:**
- «→ {ordinal} en {grupo}» (sin artículo: «→ segunda en Comida fuera») y «→ {ordinal} lugar · {n} categorías».
- «Soltá aquí para dejarla al final · se abre en un momento»
- «{categoría} es {la ordinal} de {grupo}.» y «{grupo} es {el ordinal} grupo.»
- «Subir», «Bajar», «Otro grupo», «Llevarla al final de:», «Listo»

**Otros:**
- «Colapsar todos», «Expandir todos»
- «{n} categorías» / «1 categoría», y «Todavía no tiene categorías.»
- «Mover {categoría}», «Mover el grupo {grupo}»
- «Lo administra Finn»
- «Deshacer», «Cerrar este aviso»

**Presupuesto:** «Asignado {a} · Gastado {g}» y «{etiqueta del aviso} · {n} categorías».

## 6. Accesibilidad

- **Blancos táctiles:** todos los controles miden al menos 44 × 44.
- **Contraste:** ya medido en C-45 y E3-3 para `--accion` sobre `--accion-tonal` y `--superficie-elevada`, y para `--positivo-texto` sobre `--positivo-fondo`.
- **Teclado y lector:** el orden es asa → cuerpo de la fila. El foco nunca se pierde: después de cada movimiento queda en el botón tocado o en el asa.
- **Inertes:** mientras dura un arrastre con puntero en el teléfono, la barra inferior y «Listo» quedan `inert`, como en la Bandeja.
- **`prefers-reduced-motion`:** sin animaciones, sin escala 1.03 y sin giro animado.
