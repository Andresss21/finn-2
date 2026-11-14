Implementá en Finn 2.0 el **colapso de grupos y el orden por arrastre en Estructura**, y el **colapso de grupos en Presupuesto**. Son las decisiones C-46, C-47 y C-48. La entrega está en `docs/diseno/estructura/`; si la dejaste en otra carpeta, ajustá las rutas.

Implementá exactamente lo entregado. No rediseñes ni agregues lo que no está dibujado. **No cambia qué se puede hacer** con grupos y categorías: solo cómo se presenta. Las operaciones siguen siendo OP-07 y OP-08, sin cambios en 04.

## 1 · Qué manda

En este orden:

1. `DECISIONES.md`: C-46, C-47 y C-48. Siguen vigentes E3-3 a E3-7 (hueco, fila levantada, anuncios y movimiento), C-33 (sin subrayado), C-42 (resultado de «Nuevo grupo») y C-45 (los paneles usan campos v3). C-46 difiere de E3-1 solo en Estructura; la Bandeja no cambia. C-48 reemplaza la parte de teléfono de C-43.
2. `ESTRUCTURA-Y-COLAPSO.md`: medidas, estados, textos, anuncios y movimiento. Si un dibujo y el documento difieren, manda el documento.
3. Los HTML de `referencias/`, uno por estado, con su PNG:
   - Estructura: 14 estados × teléfono y computadora × claro y oscuro;
   - Presupuesto: 4 estados × claro y oscuro.
4. `logica/estructura.js`: la especificación de comportamiento de lugares, ordinales y textos. No es código para copiar.

## 2 · Antes de escribir código

1. Leé `ESTRUCTURA-Y-COLAPSO.md` entero.
2. Ubicá la pantalla de Estructura, el aviso «Moviste…» de arriba y las flechas de subir y bajar, y la lista de grupos de Presupuesto.
3. Usá la misma librería de arrastre que la Bandeja (E3-1 a E3-7) y su región de anuncios.
4. Mandame un plan corto con los archivos que vas a tocar y esperá mi confirmación. Un PR para Estructura y otro para Presupuesto.

## 3 · Reglas que no se rompen

- Solo tokens de `tokens.css`. No hace falta ninguno nuevo.
- Tres señales por estado: color, glifo y texto. Tocables de 44 × 44. Voseo y sin subrayados.
- El estado colapsado se guarda en `localStorage`: `finn.colapsados.estructura` y `finn.colapsados.presupuesto`, como listas de ids de grupo. No se agrega nada al servidor.
- **En Presupuesto la interfaz no suma montos:** los totales salen de `grupos[].totales` (PF-3).
- Un solo resultado a la vez, que **no desaparece solo**.
- Con «reducir movimiento» no se anima nada.

## 4 · Qué construir

### Estructura

1. Encabezado de grupo con asa, flecha y nombre (que colapsan o expanden), y «Editar grupo». Al colapsar queda la fila de resumen. Arriba de la lista, «Colapsar todos» o «Expandir todos».
2. Asa siempre visible en cada categoría y cada grupo. El arrastre empieza al mover 4 px y se suelta en cualquier posición de cualquier grupo de usuario. Sobre un grupo colapsado, el grupo se abre a los 650 ms. Al tomar un grupo, todos se colapsan hasta soltar o cancelar. Mientras se arrastra, la lista se desplaza sola cerca de los bordes.
3. La barra «Mover» se abre al tocar el asa sin arrastrarla, o con Enter o Espacio sobre ella. Tiene Subir y Bajar (que cruzan de grupo), Otro grupo y Listo, y su línea de estado. El foco nunca se pierde.
4. El resultado queda en el lugar, con «Deshacer» y ×. Se reemplaza con la siguiente acción y se quita el aviso fijo de arriba.
5. Si OP-08 responde `nombre_repetido`, la fila vuelve a su lugar con el error en línea debajo, como en E3-5.
6. Pagos de tarjeta queda fijo, sin asa y sin colapsar.

### Presupuesto

7. Flecha en cada grupo de usuario.
   - **Teléfono, colapsado:** el resumen con «{n} categorías», el Disponible, «Asignado · Gastado» y los avisos agrupados.
   - **Computadora, colapsado:** los totales en las columnas.
   - **Con un filtro activo,** los grupos se ven abiertos y sin flecha.
   - «Colapsar todos» va al final de la fila de filtros.

## 5 · Criterios de aceptación

**Colapsar en Estructura**

- **CA-E-1** · Dado Estructura con A.7, cuando toco el nombre de Transporte, entonces se colapsa: queda el encabezado y la fila «1 categoría · Gasolina». La flecha gira, `aria-expanded` pasa a `false` y el anuncio dice «Colapsaste Transporte.». Al recargar sigue colapsado. En otro dispositivo, todo está expandido.
- **CA-E-2** · Dado todo expandido, cuando toco «Colapsar todos», entonces todos los grupos de usuario quedan con su resumen, Pagos de tarjeta sigue igual y el botón dice «Expandir todos».

**Arrastrar con el asa**

- **CA-E-3** · Dado Farmacia en Casa, cuando presiono su asa y muevo 4 px, entonces aparecen el hueco punteado y la fila levantada con «→ última en Casa», y se anuncia «Tomaste Farmacia.». Presionar en el cuerpo de la fila no arrastra: al soltar abre «Editar categoría».
- **CA-E-4** · Dado que arrastro Farmacia sobre Comida fuera, debajo de Restaurantes, cuando suelto, entonces:
  - se envía un único OP-08 con `grupoId` = Comida fuera y su `orden`;
  - Farmacia queda segunda en Comida fuera;
  - debajo de ella queda «Moviste Farmacia a Comida fuera: ahora es la segunda.», con «Deshacer» y ×.
- **CA-E-5** · Dado ese resultado, cuando toco «Deshacer», entonces Farmacia vuelve a ser la última de Casa y el resultado dice «Farmacia volvió a su lugar: la última de Casa.», sin «Deshacer». Cuando toco la ×, el resultado desaparece y no vuelve.
- **CA-E-6** · Dado un resultado visible, cuando muevo otra categoría, entonces el resultado anterior desaparece y queda solo el nuevo, debajo de la que moví. Ningún resultado desaparece por tiempo.
- **CA-E-7** · Dado Ahorro colapsado, cuando arrastro Farmacia sobre su encabezado:
  - el encabezado se resalta con «Soltá aquí para dejarla al final · se abre en un momento»;
  - a los 650 ms se abre;
  - si suelto antes, Farmacia queda última en Ahorro y Ahorro se abre con el resultado.
- **CA-E-8** · Dado que arrastro, cuando presiono Escape o suelto fuera de la pantalla, entonces no se envía nada, la fila vuelve a su lugar y se anuncia «Arrastre cancelado. Farmacia volvió a su lugar.».
- **CA-E-9** · Dado que tomo el asa del grupo Ahorro, entonces todos los grupos se colapsan. Cuando lo suelto segundo, queda «Moviste el grupo Ahorro: ahora es el segundo.» y los grupos vuelven a como estaban antes de tomarlo.
- **CA-E-10** · Dado Pagos de tarjeta, entonces no tiene asa ni flecha, y nada se suelta sobre él.
- **CA-E-11** · Dado que suelto una categoría en un grupo con otra del mismo nombre, cuando OP-08 responde `nombre_repetido`, entonces la fila vuelve a su lugar y debajo dice «Ya existe {nombre} en {grupo}.» con `role="alert"`.

**Barra «Mover» y teclado**

- **CA-E-12** · Dado el foco en el asa de Farmacia, cuando presiono Enter, entonces se abre la barra «Mover» con «Farmacia es la última de Casa.» y el foco pasa a «Subir». Cuando toco «Subir»:
  - Farmacia queda tercera y el foco sigue en «Subir»;
  - el resultado dice «Moviste Farmacia: ahora es la tercera de Casa.».
  
  Con «Listo», la barra se cierra y el foco vuelve al asa.
- **CA-E-13** · Dado la primera categoría de Comida fuera con su barra abierta, cuando toco «Subir», entonces pasa a ser la última de Casa. Si Casa estaba colapsado, se abre. En el primer lugar de todos, «Subir» está deshabilitado.
- **CA-E-14** · Dado la barra abierta, cuando toco «Otro grupo» y elijo Ahorro, entonces la categoría queda al final de Ahorro.

**Lo que no se anima ni se toca en la pantalla**

- **CA-E-15** · Dado `prefers-reduced-motion: reduce`, entonces tomar, soltar, colapsar y cancelar ocurren sin animación y sin escala, y las tres señales de cada estado se mantienen.
- **CA-E-16** · Dado un arrastre en el teléfono, entonces la barra inferior y «Listo» quedan `inert` hasta soltar o cancelar.

**Presupuesto**

- **CA-P-1** · Dado Presupuesto con A.7, cuando colapso Comida fuera en el teléfono, entonces su fila muestra:
  - «1 categoría» y −$26.30 en `--problema-texto`;
  - «Asignado $120.00 · Gastado $146.30»;
  - el aviso «Sobregiro con débito o efectivo».
  
  Los montos vienen de `grupos[].totales`.
- **CA-P-2** · Dado Ahorro colapsado, entonces muestra $1,534.62 y «Falta para la meta · 2 categorías». Dado Transporte colapsado, su Disponible −$18.75 va en `--deuda-texto`.
- **CA-P-3** · Dado Presupuesto en computadora con Comida fuera colapsado, entonces su fila de grupo muestra $120.00, $146.30 y −$26.30 en las columnas Asignado, Gastado y Disponible.
- **CA-P-4** · Dado un grupo colapsado, cuando elijo el filtro «Sobregiradas», entonces los grupos se ven abiertos y sin flecha. Al volver a «Todas», el grupo vuelve a estar colapsado.
- **CA-P-5** · Dado lo colapsado en Presupuesto, cuando abro Estructura, entonces sus grupos tienen su propio estado.

## 6 · Cómo entregarme el trabajo

Por cada PR mandame:
- capturas al lado del PNG de `referencias/` de cada estado tocado, en los dos temas;
- un video corto del arrastre en el teléfono y en la computadora;
- la salida de las pruebas y de axe;
- cualquier diferencia que no pudiste resolver, con el motivo.
