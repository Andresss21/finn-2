# Registrar gasto · dividir mi gasto entre categorías

**Fecha:** 14/11/2026 · **Decisión:** C-49 (cierra P-1 de C-45).
**Referencias:** `referencias/`, 13 estados en teléfono y computadora, de día y de noche, en HTML y PNG.
**Lógica de referencia:** `logica/reparto.js` (`repartir()`).
**Prototipo:** lienzo «Finn 2.0 · Registrar gasto…», tablero «Probar · Dividir entre categorías», propuesta 2.

**Qué no cambia:**
- «¿Quién paga?» es la sección completa de C-45: chips, «Otra persona», modos y filas de parte.
- Las piezas son las de campos v3 (C-45).
- Las operaciones: cada línea va a una categoría o a un deudor (OP-20).
- E4-2: no hay «Antes de guardar».

> **Sobre el prototipo:** en el tablero «Probar», el selector de modos de «¿Quién paga?» no responde; ahí siempre queda en Montos. En la app funciona como en C-45. Las referencias de esta entrega muestran la sección como es.

---

## 1. Dónde vive

Es una **sección propia**, «¿En qué categorías?», después de «¿Quién paga?» y antes de Nota y Guardar.
- **Computadora:** va en la columna derecha, debajo de «¿Quién paga?» (D-1, dos columnas).
- **Editar en computadora:** una sola columna de 720 (C-30).

**Encabezado:** el título de sección (estilo de «¿Quién paga?») y, a la derecha, un selector compacto «Una · Varias». Es un `radiogroup` llamado «Cuántas categorías», de 168 px de ancho y 44 de alto, con la pieza segmentada de C-45.
- Con «Con alguien», el título pasa a «¿En qué categorías va tu parte?».

**Con «Una»** (por defecto):
- un grupo con una fila de categoría, que muestra el rótulo «Categoría», el nombre y «Disponible {monto}»;
- su monto es el total o tu parte, sin campo para escribirlo;
- la sugerencia del comercio (CP-3) la llena si está vacía y nunca cambia una categoría que elegiste.

**Con «Varias»:**
1. Una línea que dice qué se reparte:
   - «Repartís el total: {total}.»
   - «Repartís tu parte: {monto de Vos}. Lo de {persona} va a Por cobrar.» Con dos o más personas: «Lo de las demás personas va a Por cobrar.»
2. Los modos, como en «¿Quién paga?» y en el mismo orden: «En partes iguales · Porcentaje · **Montos**». Montos va marcado por defecto.
3. El grupo de filas, con «+ Agregar categoría» al pie.
4. El resumen.

**Al pasar de «Una» a «Varias»:**
- la categoría elegida queda en la primera fila como «Lo que queda»;
- se agrega una segunda fila vacía con la lista abierta;
- el anuncio dice «Repartir entre varias categorías: elegí la segunda.».

**Al volver a «Una»:**
- queda solo la primera categoría y las demás filas se descartan;
- el anuncio dice «Una sola categoría: queda {categoría}.».

## 2. La fila de categoría (con «Varias»)

- **Fila:** es la de C-45, alto mínimo 64, que se levanta con el foco. Dentro hay, de izquierda a derecha:
  1. el disparador de la lista, con el nombre (o «Elegí una categoría») y, debajo, «Disponible {monto}» (en `--problema-texto` si es negativo) y la flecha;
  2. el monto;
  3. la ×.
- **Lista:** la propia de C-45, con grupos y la elegida con check. **Una categoría que ya está en otra fila aparece deshabilitada**, en `--texto-deshabilitado`, con «Ya está en otra fila». No se puede repetir.
- **Monto según el modo:**
  - **Montos:** campo compacto con «$» fijo y la máscara de C-45.
    - La **primera fila** muestra «Lo que queda» (12 px, 600, `--informacion-texto`): su valor es lo que se reparte menos las demás filas. Así, con dos categorías se escribe un solo monto.
    - Al escribir en la primera fila, deja de ser «Lo que queda».
  - **Porcentaje:** campo con «%» fijo y, debajo, el monto que resulta.
    - Al entrar en este modo, se propone lo mismo para cada fila, con el resto en la primera.
    - Redondeo mitad hacia arriba (CH-276). Si suman 100 %, la diferencia del redondeo va a la primera fila.
  - **En partes iguales:** el monto queda fijo, a 20 px en cifra condensada. El centavo que sobra va a la primera fila (CH-276).
- **Cambiar de modo** conserva las categorías y recalcula los montos.
- **La ×** («Quitar {categoría}») aparece en todas las filas cuando hay tres o más. Con dos no hay ×: para volver a una categoría se usa «Una».
- **Máximo:** cada gasto admite hasta 20 líneas, y cada categoría y cada persona cuentan como una. Al llegar a 20:
  - «+ Agregar categoría» y «Otra persona» quedan deshabilitados;
  - debajo del grupo dice «Llegaste a 20 partes entre categorías y personas.».

## 3. Resumen y validación

**Resumen** debajo del grupo (`role="status"`, la pieza de C-45):
- Cierra: «Repartido {suma} de {lo que se reparte}», en positivo.
- Falta: «Falta repartir {monto}.», en problema.
- Sobra: «Las categorías pasan el total por {monto}.» o «Las categorías pasan tu parte por {monto}.»
- Porcentaje que no suma 100: «Suman {n} %. Falta repartir {m} % ({monto}).» o «Suman {n} %. Sobran {m} %.»
- Una parte con más de 100 %: «Cada parte va de 0 a 100 %.», en la fila y en el momento.

**Cuándo se marca** (como en C-45):
- **En el momento:** lo que ya no se arregla escribiendo más (sobra o pasa de 100 %).
- **Al salir del campo:** lo que falta.
- **Al tocar Guardar:** una fila sin categoría muestra «Elegí una categoría.» en la fila, con su fondo de error.

**Guardar** dice «Guardar {total}» (o «Guardar cambios» al editar). Si falta algo:
- se ve apagado con `aria-disabled`;
- debajo dice el primer motivo que aplique, en este orden:
  1. «Escribí el monto para guardar.»
  2. «Terminá de repartir el total.» (las partes de «¿Quién paga?» no cierran)
  3. «Elegí una categoría para guardar.» (con «Una») o «Elegí la categoría de cada fila para guardar.»
  4. «Terminá de repartir el total entre las categorías.» o «Terminá de repartir tu parte entre las categorías.»
- al tocarlo, marca todos los errores y lleva el foco al primero.

**El servidor sigue validando:** si responde `suma_lineas_distinta`, su mensaje («Las partes suman {a} y el total es {b}.») queda junto al resumen.

## 4. Las dos secciones juntas

- **Con «Solo yo»:** las categorías reparten el **total**.
- **Con «Con alguien»:** las categorías reparten el **monto de Vos** en «¿Quién paga?».
  - La fila de Vos dice «Tu parte · {categoría}» o «Tu parte · {n} categorías».
  - Si cambia lo de Vos, la primera fila («Lo que queda») se ajusta sola. Las filas que escribiste no cambian y el resumen dice si falta o sobra.
  - En porcentaje y partes iguales se recalcula.
- **Lo que se envía:** una línea por categoría y una por cada persona (por cobrar). Nunca dos líneas a la misma categoría.

## 5. Editar una transacción dividida

- Abre con «Varias», sus filas y sus montos en modo Montos. Ninguna es «Lo que queda» hasta que edites.
- El título es «Editar gasto» y el botón, «Guardar cambios».
- En computadora va en una columna de 720 (C-30).
- Valen los bloqueos de E3-16: una parte con cobros o devoluciones no cambia de destino ni se quita.

## 6. Impacto (E4-2)

- No hay «Antes de guardar».
- Cada fila muestra el Disponible actual de su categoría, que viene del catálogo, sin cálculos en la interfaz (PF-3).
- Después de guardar, el resultado muestra «Repartido en», con un enlace por categoría y por persona (E4-2).

## 7. Anuncios del lector

- «Repartir entre varias categorías: elegí la segunda.»
- «Una sola categoría: queda {categoría}.»
- «Agregaste una categoría: elegila.»
- «Quitaste una categoría.»
- «{categoría} en la fila {n}.»
- «Montos.», «Porcentaje.», «En partes iguales.»
- Los resúmenes y errores se anuncian por su `role="status"` o `role="alert"`.

## 8. Accesibilidad

- «Una · Varias» y los modos son `radiogroup` con nombre.
- La lista es un `listbox`, con las opciones deshabilitadas marcadas con `aria-disabled`.
- Cada campo tiene un nombre accesible: «Monto para {categoría}», «Porcentaje para {categoría}», «Quitar {categoría}».
- Todos los blancos táctiles miden al menos 44 × 44, y cada estado lleva tres señales (color, glifo y texto).
