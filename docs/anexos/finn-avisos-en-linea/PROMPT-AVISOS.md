Implementá en Finn 2.0 la nueva forma de los **avisos en línea**, la **línea compacta**. Es la decisión C-51: enmienda la forma del aviso en línea y la del aviso del marco (E6-3), y corrige cómo están hoy la versión nueva (E6-8) y el borrador recuperado (E3-17). La entrega está en `docs/diseno/avisos-en-linea/`; si la dejaste en otra carpeta, ajustá las rutas.

**Hoy hay dos desvíos respecto de lo aprobado, y C-51 los reemplaza:**
- «Hay una versión nueva de Finn.» se muestra como caja de información con ⓘ y el botón debajo.
- El borrador recuperado no tiene su descripción, y «Descartar borrador» es un botón con fondo `--accion-tonal`.

Implementá exactamente lo entregado. **Los textos aprobados no cambian** y las operaciones tampoco.

## 1 · Qué manda

En este orden:

1. `DECISIONES.md`: C-51. Siguen vigentes:
   - C-50: la etiqueta de resultado, sus bandas y `--duracion-aviso`;
   - E6-5: dónde va el error de formulario;
   - D-5, D-6, E2-5 y E4-7: dónde va cada aviso de estado;
   - FT-08: el orden de «Necesita tu atención».
2. `AVISOS-EN-LINEA.md`: anatomía, los cuatro tipos de permanencia, el borrador, Inicio y accesibilidad. Si un dibujo y el documento difieren, manda el documento.
3. Los HTML de `referencias/`, con su PNG:
   - `pantallas/`: 6 estados en teléfono y computadora, de día y de noche (versión nueva, sin conexión, borrador que aparece, que se va, que ya se fue y descartado). Los campos del formulario y la barra lateral son esquemáticos: usá los reales de C-48 y de la sección.
   - `catalogo/`: un aviso de cada tipo y tono, y uno dentro de una superficie.
4. `logica/borrador.js`: cuándo sale el aviso del borrador, con sus pruebas (`node logica/borrador.test.js`). `logica/aviso.js` es el reloj de C-50.

## 2 · Antes de escribir código

1. Leé el documento entero.
2. Ubicá en el código:
   - el componente del aviso en línea y todos los lugares donde se usa;
   - el aviso del marco (sin conexión y versión nueva);
   - el aviso del borrador y dónde se guarda `finn:borrador:v1:*`;
   - el aviso de «cosas por revisar» que hoy aparece en Inicio.
3. Mandame un plan corto con los archivos que vas a tocar y esperá mi confirmación.

## 3 · Reglas que no se rompen

- Solo tokens. Tres señales por tono: color del glifo, forma del glifo y título. Tocables de 44 × 44. Voseo. Sin subrayados.
- **Un componente para toda la familia.** No se dibuja un aviso por pantalla.
- **Ninguna caja teñida** con `--{tono}-fondo` y **ningún botón con fondo** dentro de un aviso: la acción es siempre un enlace de texto.
- **Solo el aviso del borrador se va solo.** Los demás se quedan mientras sean ciertos.
- Los 3 s salen de `--duracion-aviso`: ningún número de tiempo en el código.

## 4 · Criterios de aceptación

- **CA-L-1** · Dado Inicio con una versión nueva, entonces:
  - arriba del contenido hay una pastilla `--superficie-elevada` de 48 px con el glifo `refresh` en `--informacion-texto`, «Hay una versión nueva de Finn.» y el enlace «Recargar» a la derecha;
  - no hay caja teñida ni botón con fondo;
  - la pastilla se queda hasta recargar.
- **CA-L-2** · Dado Inicio sin conexión, entonces «Estás sin conexión» es la misma pastilla, con `wifioff` en `--advertencia-texto`. Ya no es una franja `--marca`. Si también hay una versión nueva, sin conexión va primero.
- **CA-L-3** · Dado un aviso con descripción (período cerrado, D-6), entonces:
  - es un rectángulo `--radio-contenedor`;
  - la descripción va en su propia línea en `--texto-secundario`;
  - la acción, si la tiene, es un enlace debajo del texto.
- **CA-L-4** · Dado un error de formulario (E6-5), entonces el aviso tiene un borde interior de 1 px `--problema-borde`, el glifo `dang` y `role="alert"`.
- **CA-L-5** · Dado un aviso dentro de una hoja o un panel, entonces su fondo es `--superficie-hundida` y se distingue del panel en día y en noche.
- **CA-L-6** · Dado que salí de «Nueva programada» sin guardar, cuando la vuelvo a abrir, entonces:
  - los campos traen lo que escribí;
  - aparece «Recuperamos lo que estabas escribiendo» con su descripción, sin acción;
  - se anuncia una vez;
  - al pie, a la izquierda de «Guardar», está el enlace «Descartar borrador».
- **CA-L-7** · Dado CA-L-6, cuando pasan 3 s, entonces el aviso se va con una transición de opacidad de `--duracion-normal`. Con el puntero encima, espera. Al sacar el puntero, cuenta 3 s otra vez.
- **CA-L-8** · Dado CA-L-6, cuando escribo en cualquier campo, entonces el aviso se quita en ese momento.
- **CA-L-9** · Dado CA-L-6, cuando cierro con × y vuelvo a abrir (una o varias veces), entonces el formulario trae lo escrito, **el aviso no vuelve a salir** y «Descartar borrador» sigue al pie.
- **CA-L-10** · Dado un formulario con borrador, cuando toco «Descartar borrador», entonces:
  - los campos quedan vacíos;
  - el enlace desaparece;
  - se anuncia «Descartaste el borrador.»;
  - si después escribo, salgo y vuelvo, el borrador nuevo avisa una vez.
- **CA-L-11** · Dado Inicio con movimientos por revisar, entonces no hay ningún aviso: la Bandeja es la primera fila de «Necesita tu atención», con «{n} por revisar» y su flecha, y lleva a `/bandeja`.
- **CA-L-12** · Dado cualquier aviso, entonces:
  - el lector de pantalla oye el tono antes del título («Información:», «Advertencia:», «Problema:»);
  - la acción mide 44 px de alto;
  - los contrastes de §6 se cumplen en claro y oscuro.
- **CA-L-13** · Dado `prefers-reduced-motion: reduce`, entonces el aviso del borrador aparece y se quita sin animación. Los 3 s no cambian.

## 5 · Al terminar

Mandame:
- capturas de CA-L-1, CA-L-3, CA-L-4, CA-L-6 y CA-L-9, en el teléfono y en la computadora, de día y de noche;
- la lista de los lugares donde cambió el aviso.
