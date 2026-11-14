Implementá en Finn 2.0 la **etiqueta de resultado**: el aviso liviano que aparece sobre la fila después de una acción y se va solo a los 3 s. Es la decisión C-50, que enmienda el principio 5 y el resultado de C-46. La entrega está en `docs/diseno/aviso-de-resultado/`; si la dejaste en otra carpeta, ajustá las rutas.

Implementá exactamente lo entregado. **Las operaciones y las respuestas del servidor no cambian:** cambia cómo se muestra el resultado, no qué se hace.

## 1 · Qué manda

En este orden:

1. `DECISIONES.md`: el principio 5 enmendado y C-50. Siguen vigentes:
   - C-46: Estructura, salvo la frase del resultado que C-50 reemplaza;
   - FE-25, E3-4, E3-8 y E6-6: los textos de la Bandeja y «Aprobar todos»;
   - E6-14, E4-6, E4-31 y E2-8: los resultados de Más secciones, desarchivar y Seguridad;
   - E6-7, E5-13, E4-2 y E6-15: siguen como banda.
2. `AVISO-DE-RESULTADO.md`: anatomía, dónde se pega, tiempo, ↶, accesibilidad, textos exactos (§8) y alcance (§9). Si un dibujo y el documento difieren, manda el documento.
3. Los HTML de `referencias/`, con su PNG:
   - `estructura/`: 7 estados en teléfono y computadora, de día y de noche (aparece, en pausa por foco, se va, después, después de deshacer, categoría creada, grupo movido);
   - `variantes/`: la fila con monto y la fila que se va, sobre un esquema de la Bandeja (no es la pantalla completa: usá las filas reales de la Bandeja).
4. `logica/aviso.js`: el reloj, la pausa y el ↶, con sus pruebas (`node logica/aviso.test.js`). Es una especificación: adaptala al estado de la app, sin copiar su forma.
5. `estilos/tokens-propuesta.css`: el token nuevo `--duracion-aviso: 3000ms`.

## 2 · Antes de escribir código

1. Leé el documento entero.
2. Ubicá en el código:
   - el componente del resultado en el lugar que usan hoy Estructura, la Bandeja, Programadas, Metas, Reglas y Seguridad;
   - la región de estado (`role="status"`) de cada pantalla;
   - dónde se recoge una fila aprobada o eliminada.
3. Mandame un plan corto con los archivos que vas a tocar y esperá mi confirmación.

## 3 · Reglas que no se rompen

- Solo tokens. Tres señales por estado: fila resaltada, glifo y palabra. Tocables de 44 × 44. Voseo. Sin subrayados.
- **Un componente para toda la app.** No se dibuja una etiqueta por pantalla.
- **Una etiqueta a la vez** por pantalla: la acción siguiente la reemplaza.
- **3000 ms leídos de `--duracion-aviso`**: ningún número de tiempo en el código del componente.
- **Toda acción de la etiqueta tiene otro lugar permanente** (§6). Si un resultado nuevo no lo cumple, no lleva acción en la etiqueta: consultame.
- La etiqueta **no es región viva**; la frase completa va a la región `role="status"` de la pantalla, una sola vez.
- Los avisos de §9 no cambian: siguen siendo banda con ×, sin irse solos.
- Con `prefers-reduced-motion` nada anima.

## 4 · Criterios de aceptación

- **CA-A-1** · Dado Estructura, cuando muevo Farmacia a Comida fuera arrastrando, entonces:
  - Farmacia queda segunda en Comida fuera, con el fondo `--positivo-fondo`;
  - sobre su fila aparece la etiqueta «Movida» con «Deshacer», centrada contra el borde derecho;
  - la región de estado anuncia «Soltaste. Moviste Farmacia a Comida fuera: ahora es la segunda.»;
  - la lista no se desplaza al aparecer la etiqueta.
- **CA-A-2** · Dado CA-A-1, cuando pasan 3000 ms sin tocar nada, entonces:
  - la etiqueta se va con una transición de opacidad de `--duracion-normal`;
  - el resaltado de la fila se apaga;
  - a la derecha de la fila queda ↶, con `aria-label` «Deshacer: Farmacia vuelve a su lugar».
- **CA-A-3** · Dado CA-A-1, cuando dejo el puntero sobre la etiqueta, entonces no se va. Cuando saco el puntero, se va a los 3000 ms contados desde ese momento.
- **CA-A-4** · Dado CA-A-1, cuando llego con Tab a «Deshacer», entonces la etiqueta no se va mientras el foco esté adentro. Cuando el foco sale, se va a los 3000 ms. Escape con el foco adentro la quita en el momento.
- **CA-A-5** · Dado CA-A-1, cuando empiezo a arrastrar otra categoría, entonces la etiqueta espera. Si suelto en el mismo lugar o cancelo, vuelve a contar 3000 ms. Si suelto en otro lugar, la etiqueta nueva reemplaza a la anterior y el ↶ de Farmacia se va.
- **CA-A-6** · Dado CA-A-2, cuando toco ↶, entonces:
  - Farmacia vuelve a ser la última de Casa;
  - su fila muestra «Volvió», sin acción;
  - se anuncia «Farmacia volvió a su lugar: la última de Casa.»;
  - el foco queda en el botón principal de la fila de Farmacia.
- **CA-A-7** · Dado Estructura, cuando uso la barra «Mover» (Subir, Bajar u Otro grupo), entonces cada paso muestra la etiqueta «Movida» con «Deshacer» sobre la fila y anuncia la frase sin «Soltaste.». El foco sigue en el botón que toqué. «Deshacer» devuelve la categoría a donde estaba antes del primer paso.
- **CA-A-8** · Dado Estructura, cuando creo una categoría, entonces la fila nueva muestra «Creada» sin acción y se anuncia «Creaste la categoría {nombre} en {grupo}.». No queda ↶.
- **CA-A-9** · Dado Estructura, cuando muevo un grupo, entonces la etiqueta «Movido» con «Deshacer» va en el encabezado del grupo, que se resalta.
- **CA-A-10** · Dado la Bandeja, cuando apruebo SUPER SELECTOS ESCALON con un toque, entonces:
  - la fila se queda 3000 ms en su lugar, resaltada, con «Aprobado» y «Ver transacción» pegada al **borde de arriba** de la fila, la mitad afuera;
  - el monto −$35.00 se sigue viendo;
  - la región de estado anuncia «Aprobado: SUPER SELECTOS ESCALON · $35.00 · Visa Oro · Supermercado»;
  - a los 3000 ms la fila se recoge y la lista se cierra con `--duracion-normal`;
  - si la fila tenía el foco, el foco pasa a la fila siguiente (o a la anterior si era la última).
- **CA-A-11** · Dado CA-A-10 en la primera o en la única fila de la tarjeta, entonces la etiqueta se ve entera: la tarjeta no la recorta y sus esquinas siguen redondeadas.
- **CA-A-12** · Dado la Bandeja, cuando descarto un movimiento, entonces su fila muestra «Descartado» con «Restaurar» y se recoge a los 3000 ms. Restaurar sigue disponible en Descartados.
- **CA-A-13** · Dado Programadas, Metas, Reglas y Seguridad, cuando hago las acciones de §8, entonces cada una muestra su palabra y anuncia su frase exacta:
  - desactivar: «Desactivada», con la fila ya en pausadas;
  - eliminar: «Eliminada», y la fila se recoge;
  - ajustar: «Ajustada»;
  - quitar un factor: «Quitado», y la fila se recoge.
- **CA-A-14** · Dado «Aprobar todos» con un rechazo, «Esto ya no existe.», «Repartido en», el resultado de Formatos o una propuesta de Reportes, entonces se ven como hoy: banda con ×, que no se va sola.
- **CA-A-15** · Dado cualquier etiqueta, entonces:
  - la palabra y la acción tienen contraste de 4.5:1 sobre `--positivo-fondo`, en claro y oscuro;
  - la acción mide al menos 44 px de alto, y ↶ mide 44 × 44;
  - Tab llega a la acción justo después del contenido de su fila.
- **CA-A-16** · Dado `prefers-reduced-motion: reduce`, entonces la etiqueta aparece y se quita sin transición, el resaltado no se desvanece y la fila que sale se quita sin recogerse. Los 3000 ms y la pausa no cambian.
- **CA-A-17** · Dado `--duracion-aviso` cambiado a 5000ms en el CSS, entonces la etiqueta dura 5000 ms sin tocar el código.

## 5 · Al terminar

Mandame:
- capturas de CA-A-1, CA-A-2, CA-A-10 y CA-A-11, en el teléfono y en la computadora, de día y de noche;
- la lista de pantallas donde quedó la etiqueta y de las que siguen con banda.
