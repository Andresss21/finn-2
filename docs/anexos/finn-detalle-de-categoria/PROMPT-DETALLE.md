Rediseñá en Finn 2.0 el **detalle de categoría** (`/presupuesto/categorias/[categoriaId]`, categoría normal) con la propuesta **«Un recorrido»**. Es la decisión C-52. La entrega está en `docs/diseno/detalle-de-categoria/`; si la dejaste en otra carpeta, ajustá las rutas.

Implementá exactamente lo entregado. **La consulta `detalleCategoria()` (04 §6.3) y las operaciones no cambian:** cambia el orden, la distribución y el movimiento. La interfaz no calcula montos (PF-3).

## 1 · Qué manda

En este orden:

1. `DECISIONES.md`: C-52. Siguen vigentes:
   - C-50 (etiqueta de resultado) y C-51 (forma de los avisos);
   - C-48 (campos);
   - D-5 (período cerrado);
   - E4-8 (Más acciones);
   - E4-29 (archivar con Disponible);
   - PF-2 (sin montos en los indicadores);
   - CA-14.1 a CA-14.9.
2. `DETALLE-DE-CATEGORIA.md`: estructura, consumos, acciones, avisos, calendario e historial, movimiento (§8), accesibilidad y textos nuevos. Si un dibujo y el documento difieren, manda el documento.
3. Los HTML de `referencias/`, con su PNG. Son 9 estados en teléfono y computadora, de día y de noche:
   - con muchos consumos;
   - con un día elegido;
   - la vista «Últimos 6»;
   - con sobregiro con débito;
   - con deuda sin reservar;
   - con meta;
   - sin consumos;
   - en período cerrado;
   - con Más acciones abierto.

   Los montos son ilustrativos: Restaurantes repite los datos aprobados de S3 y Salidas es un caso armado con 45 consumos.
4. `logica/consumos.js`: el orden, los filtros, las semanas y el plegado, con sus pruebas (`node logica/consumos.test.js`).

## 2 · Antes de escribir código

1. Leé el documento entero.
2. Ubicá en el código:
   - la página del detalle de categoría y sus componentes (`Monto`, `IndicadorEstado`, `ResumenMeta`, `SelectorPeriodo`, `GraficoBarras`, `Aviso`);
   - la lista de consumos que hoy muestra 10 y despliega el resto;
   - el paso desde la fila de Presupuesto.
3. Mandame un plan corto con los archivos que vas a tocar y esperá mi confirmación.

## 3 · Reglas que no se rompen

- Solo tokens. Tres señales por estado. Tocables de 44 × 44. Voseo. Sin subrayados.
- **Ningún monto calculado en la interfaz:** sin subtotales por semana y sin animar cifras.
- Todas las duraciones y curvas salen de los tokens (`--duracion-*`, `--curva-*`). Con `prefers-reduced-motion: reduce`, nada se anima.
- **La categoría de pago de tarjeta no cambia.**

## 4 · Criterios de aceptación

- **CA-D-1** · Dado el teléfono, cuando abro una categoría, entonces veo en este orden:
  1. barra con ← y ⋯;
  2. grupo, nombre y selector de período;
  3. Disponible con sus indicadores;
  4. cifras 3 × 2;
  5. avisos y meta;
  6. «¿En qué se fue?»;
  7. consumos;
  8. programadas y reglas.

  Además, la barra de acciones queda fija al pie, sobre la navegación.
- **CA-D-2** · Dado Salidas con 45 consumos, entonces:
  - los consumos van del más reciente al más antiguo, agrupados por semana;
  - solo la semana más reciente está abierta;
  - cada semana muestra «{n} consumos» y ningún monto propio.
- **CA-D-3** · Dado CA-D-2, cuando abro otra semana, entonces se abre con la transición de alto y su flecha gira. Si cambio de filtro y vuelvo a «Todos», sigue abierta.
- **CA-D-4** · Dado una categoría con 10 consumos o menos, o un filtro o un día elegido, entonces todas las semanas están abiertas.
- **CA-D-5** · Dado CA-D-2, cuando toco el 9 de octubre en el calendario, entonces:
  - el día se invierte y su punto crece;
  - aparece la píldora «Viernes 9 de oct» con ×;
  - la lista muestra solo ese día;
  - la página baja suave hasta la lista;
  - se anuncia «Consumos del 9 de oct».

  Cuando toco × o el mismo día, vuelven todos los consumos.
- **CA-D-6** · Dado un día sin gasto, entonces su botón está deshabilitado y su nombre dice «…, sin gasto».
- **CA-D-7** · Dado Restaurantes de A.7 (sobregiro con débito), entonces:
  - el aviso de problema es la forma de C-51, sin botón;
  - el botón principal de la barra es «Cubrir $26.30», y abre Asignar con el monto de `rapida.cubrirSobregiro` (CA-14.7);
  - hay un filtro «No cubiertos · 2»;
  - encima de la lista está la línea del orden de cobertura.
- **CA-D-8** · Dado Ropa con sobregiro con tarjeta, entonces el aviso es «Deuda sin reservar en Ropa · $45.00», con glifo `card` en `--deuda-sin-respaldo-texto`, y el botón principal es «Cubrir $45.00».
- **CA-D-9** · Dado el período cerrado 21/08–20/09, entonces:
  - está el aviso «Período cerrado · 21/08–20/09» con «Ir al período actual»;
  - no hay barra de acciones;
  - el calendario no marca hoy ni días futuros;
  - la flecha › lleva al período actual.
- **CA-D-10** · Dado «Más acciones», entonces «Archivar» está ahí y no al pie. Con Disponible distinto de cero, va deshabilitado y con «No se puede archivar: tiene Disponible distinto de cero.».
- **CA-D-11** · Dado la computadora, entonces:
  - la columna izquierda (380 px: estado, avisos, meta, acciones, programadas, reglas) queda fija mientras se desplaza la derecha;
  - a la derecha, el calendario y el historial van lado a lado, y abajo los consumos;
  - «Más acciones» es el botón con texto de E4-8.
- **CA-D-12** · Dado que vengo de Presupuesto, cuando toco una fila, entonces el nombre y el Disponible viajan a su lugar en el encabezado (`--duracion-transicion`, `--curva-entrada`) y el resto de las secciones entra escalonado. Al volver con ←, hacen el camino inverso. Sin View Transitions, se ve igual con FLIP.
- **CA-D-13** · Dado «¿En qué se fue?», cuando cambio a «Últimos 6», entonces:
  - aparece el historial con el promedio y «Se pasó k de 6»;
  - las barras crecen desde la base la primera vez;
  - las barras de los períodos en que se pasó van en `--problema-texto`.
- **CA-D-14** · Dado `prefers-reduced-motion: reduce`, entonces ninguna de las animaciones de §8 ocurre y el desplazamiento hasta la lista es instantáneo.
- **CA-D-15** · Dado un lector de pantalla, entonces:
  - se anuncian la entrada, el día, el filtro y el cambio de período con los textos de §9;
  - el calendario, los filtros, la vista y las semanas tienen los roles de §9.
- **CA-D-16** · Dado Regalos sin consumos, entonces:
  - «Sin gastos en este período» reemplaza la lista y no hay filtros;
  - el calendario no tiene puntos;
  - el historial muestra sus 3 períodos.

## 5 · Al terminar

Mandame:
- capturas de CA-D-2, CA-D-5, CA-D-7, CA-D-9 y CA-D-11, en el teléfono y en la computadora, de día y de noche;
- un video corto de CA-D-12.
