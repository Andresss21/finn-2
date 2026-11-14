Implementá en Finn 2.0 la sección **«¿En qué categorías?»** de Registrar gasto: dividir mi gasto entre varias categorías propias. Es la decisión C-49, que cierra P-1 de C-45. La entrega está en `docs/diseno/reparto-categorias/`; si la dejaste en otra carpeta, ajustá las rutas.

Implementá exactamente lo entregado. **Las operaciones no cambian** (OP-20): cada línea va a una categoría o a un deudor, y el servidor valida la suma.

**«¿Quién paga?» es la sección completa de C-45.** Las referencias la muestran así. En el tablero «Probar» del lienzo, su selector de modos no responde a propósito; en la app funciona como dice C-45.

## 1 · Qué manda

En este orden:

1. `DECISIONES.md`: C-49. Siguen vigentes:
   - C-45: piezas, máscaras, cuándo se marca un error y «¿Quién paga?»;
   - E4-2: sin «Antes de guardar», y «Repartido en» después de guardar;
   - C-30: editar en computadora va en una columna de 720;
   - E3-16: bloqueos al editar;
   - D-1: dos columnas en computadora;
   - CH-276: redondeos.
2. `REPARTO-ENTRE-CATEGORIAS.md`: comportamiento, textos y accesibilidad. Si un dibujo y el documento difieren, manda el documento.
3. Los HTML de `referencias/`, con su PNG: 13 estados en teléfono y computadora, de día y de noche.
4. `logica/reparto.js`: la especificación del cálculo (`repartir()`). No es código para copiar: los centavos van con el módulo `formato/` (FE-18).

## 2 · Antes de escribir código

1. Leé el documento entero.
2. Ubicá en el código `CampoLineas`, la sección «¿Quién paga?» y el envío de `lineas`.
3. Mandame un plan corto con los archivos que vas a tocar y esperá mi confirmación.

## 3 · Reglas que no se rompen

- Solo tokens. Tres señales por estado. Blancos de 44 × 44. Voseo. Sin subrayados.
- **Nunca dos líneas a la misma categoría:** en la lista, una categoría usada aparece deshabilitada con «Ya está en otra fila».
- **Máximo 20 líneas** entre categorías y personas.
- **Sin «Antes de guardar»:** cada fila muestra el Disponible del catálogo, sin calcular nada en la interfaz (PF-3).
- La app propone montos («Lo que queda», partes iguales, porcentaje con redondeo mitad hacia arriba), pero **cada monto se ve antes de guardar**.
- El botón de guardar nunca usa `disabled`: va con `aria-disabled` y su motivo.

## 4 · Criterios de aceptación

- **CA-R-1** · Dado Registrar gasto nuevo, entonces:
  - «¿En qué categorías?» muestra «Una» marcado y una fila de categoría;
  - con PRICESMART, la sugerencia la llena con Supermercado («Disponible $62.85»);
  - al guardar $148.60, se envía 1 línea de $148.60 a Supermercado.
- **CA-R-2** · Dado «Una» con Supermercado, cuando elijo «Varias», entonces:
  - la primera fila es Supermercado con $148.60 y «Lo que queda»;
  - aparece una segunda fila vacía con la lista abierta;
  - en esa lista, Supermercado está deshabilitado con «Ya está en otra fila».
- **CA-R-3** · Dado eso, cuando elijo Farmacia y escribo 52.50, entonces:
  - Supermercado pasa a $96.10 solo;
  - el resumen dice «Repartido $148.60 de $148.60»;
  - al guardar se envían 2 líneas: $96.10 y $52.50.
- **CA-R-4** · Dado Supermercado escrito en 96.10 y Farmacia en 22.50, cuando salgo del campo, entonces:
  - el resumen dice «Falta repartir $30.00.»;
  - debajo de Guardar dice «Terminá de repartir el total entre las categorías.»;
  - al tocar Guardar no se envía nada.
- **CA-R-5** · Dado tres categorías en «En partes iguales», entonces los montos son $49.54, $49.53 y $49.53.
- **CA-R-6** · Dado Porcentaje con 60 y 20, entonces el resumen dice «Suman 80 %. Falta repartir 20 % ($29.72).». Con 60 y 40, los montos son $89.16 y $59.44. Con 120 en una fila, aparece en el momento «Cada parte va de 0 a 100 %.».
- **CA-R-7** · Dado «Con alguien» con Carlos en $30.00 y Vos en $118.60, entonces:
  - el título es «¿En qué categorías va tu parte?»;
  - debajo dice «Repartís tu parte: $118.60. Lo de Carlos va a Por cobrar.»;
  - con Supermercado 96.10 y Farmacia 22.50, el resumen dice «Repartido $118.60 de $118.60»;
  - al guardar se envían 3 líneas.
- **CA-R-8** · Dado CA-R-7, cuando Vos pasa a 108.60 y Carlos a 40.00, entonces el resumen de categorías dice «Las categorías pasan tu parte por $10.00.». Si la primera fila era «Lo que queda», se ajusta sola a $86.10.
- **CA-R-9** · Dado «Con alguien» con Vos en 110.00 y Carlos en 30.00, entonces:
  - «¿Quién paga?» dice «Las partes suman $140.00 y el total es $148.60.»;
  - debajo de Guardar dice «Terminá de repartir el total.».
- **CA-R-10** · Dado una fila sin categoría, cuando toco Guardar, entonces:
  - la fila muestra «Elegí una categoría.» con fondo de error;
  - el foco va a esa fila;
  - debajo de Guardar dice «Elegí la categoría de cada fila para guardar.».
- **CA-R-11** · Dado 16 personas y 4 categorías, entonces:
  - «+ Agregar categoría» y «Otra persona» están deshabilitados;
  - debajo del grupo dice «Llegaste a 20 partes entre categorías y personas.».
- **CA-R-12** · Dado «Varias» con dos filas, cuando elijo «Una», entonces queda solo la primera categoría, con el total o tu parte, y se anuncia «Una sola categoría: queda Supermercado.».
- **CA-R-13** · Dado una transacción con Supermercado $96.10, Farmacia $22.50 y Carlos $30.00, cuando la edito, entonces:
  - abre con «Varias» en Montos y esos montos, sin «Lo que queda»;
  - el botón dice «Guardar cambios»;
  - en computadora va en una columna de 720;
  - una parte con eventos sigue E3-16.
- **CA-R-14** · Dado la lista abierta, entonces Restaurantes muestra «Disponible −$26.30» en `--problema-texto`. No hay bloque «Antes de guardar» en ningún estado.
- **CA-R-15** · Dado que el servidor responde `suma_lineas_distinta`, entonces su mensaje queda junto al resumen y no se pierde nada de lo escrito.
- **CA-R-16** · Dado teclado y lector de pantalla, entonces:
  - «Una · Varias» y los modos son `radiogroup` con nombre;
  - la lista es un `listbox` con las opciones usadas en `aria-disabled`;
  - cada campo tiene su nombre accesible («Monto para Farmacia», «Quitar Farmacia»).
  
  axe no reporta violaciones en los dos temas.

## 5 · Cómo entregarme el trabajo

Mandame:
- capturas al lado de cada PNG de `referencias/`, en los dos temas;
- la salida de las pruebas y de axe;
- cualquier diferencia que no pudiste resolver, con el motivo.
