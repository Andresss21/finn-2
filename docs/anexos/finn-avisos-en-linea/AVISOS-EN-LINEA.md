# Finn 2.0 · Avisos en línea: línea compacta (C-51)

Elegida por el dueño el 14/11/2026: **propuesta 2, línea compacta**, con sus dos ajustes: la descripción va en su propia línea y el problema suma un borde de su tono. Reemplaza la forma del aviso en línea (caja teñida con `--{tono}-fondo`) y la del aviso del marco (franja `--marca`, E6-3). Corrige cómo están hoy en la app la versión nueva (E6-8) y el borrador recuperado (E3-17). Los textos aprobados no cambian.

## 1. Por qué

- La caja teñida (`--informacion-fondo` y sus pares) pesa y chirría en noche.
- El botón con fondo (`--accion-tonal`) dentro de la caja no va.
- Un aviso que solo informa no debe quedarse para siempre: el de borrador recuperado salía cada vez que se abría el formulario.

## 2. Anatomía

| Pieza | Valor |
|---|---|
| Contenedor | Sobre `--fondo` (pantallas): `--superficie-elevada`. **Dentro de una superficie** (hojas, paneles, tarjetas, pasos de «Revisá el impacto»): `--superficie-hundida`, porque en día `--superficie-elevada` y `--superficie` son el mismo blanco. Sin borde; alto mínimo 48 px |
| Forma | **Pastilla** (`--radio-pastilla`) si es una sola línea: título sin descripción y acción corta o sin acción. **Rectángulo** (`--radio-contenedor`) si tiene descripción o una acción larga |
| Relleno | Pastilla: `--espacio-2` arriba y abajo, `--espacio-4` a los lados. Rectángulo: `--espacio-3` y `--espacio-4` |
| Glifo | 18 px, trazo 1.7, en `--{tono}-texto`: `info`, `warn`, `dang`, `check`, o uno propio del caso (`refresh`, `wifioff`, `undo`, `lock`). En el rectángulo se alinea con la primera línea (2 px abajo) |
| Título | Archivo 600, .875rem, alto de línea 1.45, `--texto` |
| Descripción | En **su propia línea**, debajo del título: Archivo 400, .875rem, `--texto-secundario`; 2 px entre título y descripción |
| Acción | **Enlace de texto**: `--enlace`, 700, .875rem, alto 44 px, sin subrayado (C-33), sin fondo. En la pastilla, a la derecha; en el rectángulo, debajo del texto, alineada con él. **Nunca un botón con fondo** |
| Problema | Además, borde interior de 1 px `--problema-borde` (`box-shadow: inset 0 0 0 1px`) |
| Cerrar | Solo las bandas de C-50 §9: × de 44 × 44 a la derecha, glifo `x` 18 px en `--texto-secundario`, `aria-label` «Cerrar aviso» |
| Separación | `--espacio-3` entre glifo y texto; el aviso no lleva margen propio: lo pone la pantalla |

Tres señales por tono: color del glifo, forma del glifo y título. El tono se nombra para el lector de pantalla al principio del aviso, oculto a la vista: «Información:», «Advertencia:», «Problema:», «Listo:».

Tonos: información para lo del sistema que no limita nada (versión nueva) y lo que explica; advertencia para lo que limita o tiene consecuencia (sin conexión, sobregiro, sesión vencida); problema para errores y lo que no se pudo hacer.

## 3. Cuánto dura: cuatro tipos

| Tipo | Cuándo se va | Ejemplos (decisión) |
|---|---|---|
| **Del sistema** | Cuando se resuelve | «Hay una versión nueva de Finn.» con «Recargar» (E6-8), «Estás sin conexión» y sus variantes (E6-3) |
| **Estado** | Mientras sea cierto; sin × | Período cerrado (D-5), mover más que el Disponible (D-6), sesión vencida (E2-5), un solo factor, archivada con Disponible (AV-14, E4-7), AV-01 y AV-16 en los pasos de impacto |
| **Momentáneo** (nuevo) | Se va solo a los 3 s (`--duracion-aviso`, C-50), espera con el puntero encima o el foco adentro, o se quita al escribir en un campo. **Sale una sola vez** por borrador | «Recuperamos lo que estabas escribiendo» (E3-17) |
| **Problema o pide algo** | Cuando se resuelve, o con × si es banda | Errores de formulario (E6-5), AV-19, «Esto ya no existe.» (E6-7), SMS sin reconocer (E5-13) y los resultados con información de C-50 §9 |

Lo del sistema va **arriba del contenido o del flujo**, como hoy (E6-3); si hay dos, sin conexión va primero. Los demás van donde ya los pone su decisión.

## 4. Borrador recuperado (enmienda E3-17)

1. Al abrir un flujo largo con borrador guardado **por primera vez**, sale el aviso: glifo `undo`, «Recuperamos lo que estabas escribiendo» y, en su línea, «Lo guardamos en este dispositivo cuando saliste sin guardar.». **Sin acción.**
2. Se va a los 3 s. Espera mientras el puntero está encima. Si escribís en cualquier campo, se quita en ese momento.
3. El borrador queda marcado (`avisoVisto`): si cerrás con × y volvés a abrir, el formulario trae lo escrito **sin aviso**.
4. **«Descartar borrador»** se muda al pie del formulario: enlace de texto a la izquierda de «Guardar», visible mientras haya borrador. Al tocarlo, el formulario se vacía, el enlace desaparece y se anuncia «Descartaste el borrador.».
5. Un borrador nuevo (después de guardar o descartar) vuelve a avisar una vez.
6. En computadora, igual, sobre las dos columnas del formulario a 720 px.

Lógica de referencia: `logica/borrador.js` (con `node logica/borrador.test.js`) y el reloj de C-50 en `logica/aviso.js`.

## 5. Inicio: «cosas por revisar»

No es un aviso. Según FT-08, la Bandeja es la **primera fila de «Necesita tu atención»**: glifo `inbox` en una insignia `--informacion-fondo`, «Bandeja» y «{n} por revisar», con su flecha. Se queda mientras haya algo por revisar y lleva a `/bandeja`.

## 6. Accesibilidad

- Estado y sistema: `role="status"`; problema: `role="alert"`. El aviso momentáneo se anuncia una vez al aparecer, con su título y su descripción.
- El tono se nombra antes del título (texto oculto), además del glifo y el color (WCAG 1.4.1).
- Acción y × de 44 px de alto (2.5.8); el foco de la acción con el anillo `--foco`.
- **2.2.1:** el único aviso que se va solo es el del borrador, que no tiene acción; el borrador sigue a la vista en los campos y «Descartar borrador» tiene su lugar fijo al pie.
- Contraste medido sobre `--superficie-elevada` y `--superficie-hundida`, en claro y oscuro: descripción ≥ 6.87:1, enlace ≥ 5.53:1, glifos de tono ≥ 4.55:1, borde de problema ≥ 3.65:1 (objeto gráfico, 1.4.11).
- `prefers-reduced-motion`: el momentáneo aparece y se quita sin animación.

## 7. Textos

No cambian: cada aviso usa el texto de su decisión. Lo único nuevo es el anuncio «Descartaste el borrador.» y los nombres ocultos de tono («Información:», «Advertencia:», «Problema:», «Listo:»).

## 8. Alternativas descartadas

- **Propuesta 1, tarjeta tranquila** (recomendada por diseño): superficie con borde y la insignia de color. El dueño prefirió la línea compacta, más baja.
- **Propuesta 3, nota sin caja:** un problema sin contenedor se pierde y lo del sistema necesita otra forma.
- **Línea compacta con la descripción corrida en la misma línea:** se lee peor.
- **Problema sin borde:** se confunde con una información.
- **Mantener el aviso del marco en `--marca`:** dos formas para la misma familia; en noche es una franja casi blanca que choca igual.
- **Borrador: aviso que se queda con «Descartar borrador» adentro:** es lo que molestaba. **Que salga cada vez que se abre:** era el problema. **Quitar el aviso:** el que vuelve no sabría por qué el formulario ya tiene datos.
