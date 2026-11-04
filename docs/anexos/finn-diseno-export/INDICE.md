# Finn 2.0 · exportación del diseño (A.10)

Exportación del diseño **tal como está publicado en el canvas** (tableros S1–S7, K1–K5 y el prototipo v2), para portarlo al código real. No se cambió nada del diseño: cada pieza se copió del tablero publicado y solo los colores que existen en `tokens.css` se reescribieron como `var(--token)`. La sección 7 lista lo que no coincide con `PANTALLAS.md` o con las capturas, y la 8, los valores que no están en los tokens.

## 1 · Cómo abrirlo

- Abrí cualquier `.html` con doble clic en Chrome, Edge, Firefox o Safari. No hace falta servidor ni conexión: las fuentes están en `fuentes/` y se cargan por ruta relativa (mantené la estructura de carpetas).
- Cada archivo es autocontenido: lleva dentro `fuentes.css`, `tokens.css` y `finn.css` (base, animaciones y "reducir movimiento"). El tema lo fija `<html data-theme="claro|oscuro">`.
- El atributo `data-rol="<rol>"` marca cada texto que usa uno de los roles tipográficos de A.5 (`cifra-principal`, `cifra`, `titulo-pantalla`, `titulo-seccion`, `cuerpo`, `cuerpo-pequeno`, `etiqueta`, `rotulo`): sus estilos en línea son exactamente los de la clase `.t-<rol>` de `tokens.css`.
- Las medidas (espaciados, alturas, anchos, radios, sombras) están en px o rem tal como se dibujaron, en los estilos en línea de cada elemento.

```
finn-diseno-export/
├── INDICE.md                 este archivo
├── prototipo/                prototipo v2 ejecutable (claro y oscuro) + fuente/ (plantilla, lógica y runtime por separado)
├── pantallas/                un archivo por pantalla, variante y estado de A.7 (mismo nombre que su captura)
├── componentes/              un archivo por componente de A.6 y de K5, en claro y en oscuro, con todos sus estados
├── estilos/                  tokens.css, tokens.json, finn.css (animaciones) y fuentes.css, por separado
├── fuentes/                  Archivo (variable) y Big Shoulders Display 700/800, con su licencia OFL
└── referencia/               capturas de la entrega A.10 (las mismas de finn-entrega.zip)
```

## 2 · Cómo se verificó

- **Tokens sin cambio visual.** Las 153 páginas exportadas (58 pantallas, 93 componentes y los 2 prototipos) se renderizaron dos veces: con los colores como `var(--token)` y con los valores literales originales. Las dos versiones dan **píxeles idénticos en las 153**.
- **Contra el canvas.** Cada pantalla exportada se comparó con su pieza del tablero publicado, a doble resolución y compensando la fracción de píxel en que el tablero ubica cada pieza (0.27–0.97 px). Resultado:
  - 28 de 58 sin diferencias (menos de 0.02 % de píxeles distintos);
  - 20 pantallas claras con 0.03–0.2 % de píxeles distintos, siempre píxeles sueltos de suavizado en bordes de letras e íconos;
  - 10 variantes oscuras con 0.2–0.6 %: es el fondo de la página que asoma por las esquinas redondeadas del marco del teléfono o de la computadora (en el canvas, gris claro; en la exportación, el fondo oscuro). El diseño en sí es idéntico.
- **Prototipo.** Se recorrió entero sin el canvas, en los dos temas: notificaciones (abrir, marcar todo como leído, cerrar), Presupuesto con filtro, Detalle con Gráfico/Tabla, volver, Bandeja (Aprobar → "Ver transacción"), Registrar → Guardar → Volver a Inicio, Más secciones → Reportes (Gasto semanal con Tabla), Cuentas (tarjeta de atrás al frente), hoja Asignar (abrir y cerrar). Sin errores en la consola.

## 3 · Prototipo v2

| Archivo | Qué es | Captura de referencia |
|---|---|---|
| `prototipo/Prototipo-v2-Claro.html` | Prototipo completo, tema claro, ejecutable sin el canvas | `referencia/K1-Navegacion__telefono-claro.png` y las de cada pantalla |
| `prototipo/Prototipo-v2-Oscuro.html` | Lo mismo en oscuro | `referencia/K1-Navegacion__telefono-oscuro.png` |
| `prototipo/fuente/Prototipo-v2-Claro.plantilla.html`, `…-Oscuro.plantilla.html` | La plantilla (HTML con estilos en línea) tal como está en el canvas, ya con tokens | — |
| `prototipo/fuente/componente.js` | La lógica (clase `Component extends DCLogic`): pantallas, hojas, dirección de las transiciones, filtros, aprobar, guardar, notificaciones, billetera | — |
| `prototipo/fuente/runtime.js` | Runtime mínimo que reemplaza al del canvas (ver abajo) | — |

**No usa React ni JSX.** En el canvas, el prototipo es una plantilla HTML con tres construcciones (`<sc-if value="{{…}}">`, `onClick="{{manejador}}"` y atributos con `{{…}}` intercalado, como `class="fz-scr fz-d-{{dir}}"`) más una clase de lógica con `state`, `setState` y `renderVals()`. `runtime.js` (unas 100 líneas, sin dependencias) implementa exactamente eso: monta y desmonta los bloques condicionales, actualiza los atributos y conecta los clics, dejando montado lo que no cambia como hace el canvas, para que las animaciones de entrada solo corran cuando algo aparece. Para portar a React: cada `<sc-if>` es un `{cond && …}`, cada `onClick="{{x}}"` es `onClick={x}`, y `renderVals()` es el cuerpo de render que calcula esos valores a partir de `state`. En la consola, `FinnApp.state` muestra el estado actual.

Qué se puede tocar: las cinco pestañas (Bandeja al centro), Registrar, la campana, el menú ☰ (Más secciones → Reportes y Notificaciones), "Asignar $312.40", Restaurantes (en Inicio y Presupuesto), "Ver las 6", los filtros Todas y Sobregiradas, "Cubrir $26.30", Gráfico/Tabla, "Aprobar", "Guardar $148.60", "Registrar otro", "Volver a Inicio", la tarjeta de atrás en Cuentas, "Marcar todo como leído", "Ver tarjeta" y los atajos del panel lateral. Lo que no responde está en la sección 7 (D5–D8).

## 4 · Pantallas de A.7

Un archivo por pantalla, variante y estado, con el nombre de su captura. Datos de ejemplo de A.7; lo marcado "(ejemplo)" es un estado que el anexo pide sin datos.

| Archivo | Pantalla (A.7) | Variante o estado | Tema | Captura |
|---|---|---|---|---|
| `pantallas/S1-Inicio__telefono-claro.html` | Inicio (`/`) | Teléfono · claro | claro | `referencia/S1-Inicio__telefono-claro.png` |
| `pantallas/S1-Inicio__telefono-oscuro.html` | Inicio (`/`) | Teléfono · oscuro | oscuro | `referencia/S1-Inicio__telefono-oscuro.png` |
| `pantallas/S1-Inicio__computadora-claro.html` | Inicio (`/`) | Computadora · claro | claro | `referencia/S1-Inicio__computadora-claro.png` |
| `pantallas/S1-Inicio__primer-uso-sin-cuentas.html` | Inicio (`/`) | Primer uso (sin cuentas) | claro | `referencia/S1-Inicio__primer-uso-sin-cuentas.png` |
| `pantallas/S1-Inicio__todo-al-dia.html` | Inicio (`/`) | Todo al día | claro | `referencia/S1-Inicio__todo-al-dia.png` |
| `pantallas/S1-Inicio__listo-para-asignar-negativo.html` | Inicio (`/`) | Listo para asignar negativo | claro | `referencia/S1-Inicio__listo-para-asignar-negativo.png` |
| `pantallas/S1-Inicio__computadora-oscuro.html` | Inicio (`/`) | Computadora · oscuro | oscuro | `referencia/S1-Inicio__computadora-oscuro.png` |
| `pantallas/S2-Presupuesto__telefono-claro.html` | Presupuesto (`/presupuesto`) | Teléfono · claro | claro | `referencia/S2-Presupuesto__telefono-claro.png` |
| `pantallas/S2-Presupuesto__telefono-oscuro.html` | Presupuesto (`/presupuesto`) | Teléfono · oscuro | oscuro | `referencia/S2-Presupuesto__telefono-oscuro.png` |
| `pantallas/S2-Presupuesto__computadora-claro.html` | Presupuesto (`/presupuesto`) | Computadora · claro | claro | `referencia/S2-Presupuesto__computadora-claro.png` |
| `pantallas/S2-Presupuesto__periodo-cerrado.html` | Presupuesto (`/presupuesto`) | Período cerrado | claro | `referencia/S2-Presupuesto__periodo-cerrado.png` |
| `pantallas/S2-Presupuesto__periodo-futuro.html` | Presupuesto (`/presupuesto`) | Período futuro | claro | `referencia/S2-Presupuesto__periodo-futuro.png` |
| `pantallas/S2-Presupuesto__filtro-sobregiradas.html` | Presupuesto (`/presupuesto`) | Filtro: sobregiradas | claro | `referencia/S2-Presupuesto__filtro-sobregiradas.png` |
| `pantallas/S2-Presupuesto__sin-resultados.html` | Presupuesto (`/presupuesto`) | Sin resultados | claro | `referencia/S2-Presupuesto__sin-resultados.png` |
| `pantallas/S3-Detalle__telefono-claro.html` | Detalle de categoría · Restaurantes | Teléfono · claro | claro | `referencia/S3-Detalle__telefono-claro.png` |
| `pantallas/S3-Detalle__telefono-oscuro.html` | Detalle de categoría · Restaurantes | Teléfono · oscuro | oscuro | `referencia/S3-Detalle__telefono-oscuro.png` |
| `pantallas/S3-Detalle__computadora-claro.html` | Detalle de categoría · Restaurantes | Computadora · claro | claro | `referencia/S3-Detalle__computadora-claro.png` |
| `pantallas/S3-Detalle__historial-como-tabla.html` | Detalle de categoría · Restaurantes | Historial como tabla | claro | `referencia/S3-Detalle__historial-como-tabla.png` |
| `pantallas/S3-Detalle__sobregiro-con-tarjeta.html` | Detalle de categoría · Restaurantes | Sobregiro con tarjeta | claro | `referencia/S3-Detalle__sobregiro-con-tarjeta.png` |
| `pantallas/S3-Detalle__con-meta.html` | Detalle de categoría · Restaurantes | Con meta | claro | `referencia/S3-Detalle__con-meta.png` |
| `pantallas/S3-Detalle__sin-movimientos.html` | Detalle de categoría · Restaurantes | Sin movimientos | claro | `referencia/S3-Detalle__sin-movimientos.png` |
| `pantallas/S3-Detalle__categoria-de-pago-de-tarjeta.html` | Detalle de categoría · Restaurantes | Categoría de pago de tarjeta | claro | `referencia/S3-Detalle__categoria-de-pago-de-tarjeta.png` |
| `pantallas/S4-Bandeja__telefono-claro.html` | Bandeja (`/bandeja`) | Teléfono · claro | claro | `referencia/S4-Bandeja__telefono-claro.png` |
| `pantallas/S4-Bandeja__telefono-oscuro.html` | Bandeja (`/bandeja`) | Teléfono · oscuro | oscuro | `referencia/S4-Bandeja__telefono-oscuro.png` |
| `pantallas/S4-Bandeja__computadora-claro.html` | Bandeja (`/bandeja`) | Computadora · claro | claro | `referencia/S4-Bandeja__computadora-claro.png` |
| `pantallas/S4-Bandeja__aprobado-con-un-toque.html` | Bandeja (`/bandeja`) | Aprobado con un toque | claro | `referencia/S4-Bandeja__aprobado-con-un-toque.png` |
| `pantallas/S4-Bandeja__descartado.html` | Bandeja (`/bandeja`) | Descartado | claro | `referencia/S4-Bandeja__descartado.png` |
| `pantallas/S4-Bandeja__vista-de-descartados.html` | Bandeja (`/bandeja`) | Vista de descartados | claro | `referencia/S4-Bandeja__vista-de-descartados.png` |
| `pantallas/S4-Bandeja__bandeja-al-dia.html` | Bandeja (`/bandeja`) | Bandeja al día | claro | `referencia/S4-Bandeja__bandeja-al-dia.png` |
| `pantallas/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.html` | Bandeja (`/bandeja`) | No reconocido, con error, duplicado y datos faltantes | claro | `referencia/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.png` |
| `pantallas/S5-Registrar__telefono-claro.html` | Registrar gasto con división (flujo largo) | Teléfono · claro | claro | `referencia/S5-Registrar__telefono-claro.png` |
| `pantallas/S5-Registrar__telefono-oscuro.html` | Registrar gasto con división (flujo largo) | Teléfono · oscuro | oscuro | `referencia/S5-Registrar__telefono-oscuro.png` |
| `pantallas/S5-Registrar__computadora-claro.html` | Registrar gasto con división (flujo largo) | Computadora · claro | claro | `referencia/S5-Registrar__computadora-claro.png` |
| `pantallas/S5-Registrar__una-linea.html` | Registrar gasto con división (flujo largo) | Una línea | claro | `referencia/S5-Registrar__una-linea.png` |
| `pantallas/S5-Registrar__suma-distinta-del-total.html` | Registrar gasto con división (flujo largo) | Suma distinta del total | claro | `referencia/S5-Registrar__suma-distinta-del-total.png` |
| `pantallas/S5-Registrar__sugerencia-al-escribir.html` | Registrar gasto con división (flujo largo) | Sugerencia al escribir | claro | `referencia/S5-Registrar__sugerencia-al-escribir.png` |
| `pantallas/S5-Registrar__monto-mal-escrito.html` | Registrar gasto con división (flujo largo) | Monto mal escrito | claro | `referencia/S5-Registrar__monto-mal-escrito.png` |
| `pantallas/S5-Registrar__fecha-en-periodo-cerrado.html` | Registrar gasto con división (flujo largo) | Fecha en período cerrado | claro | `referencia/S5-Registrar__fecha-en-periodo-cerrado.png` |
| `pantallas/S5-Registrar__guardando.html` | Registrar gasto con división (flujo largo) | Guardando | claro | `referencia/S5-Registrar__guardando.png` |
| `pantallas/S5-Registrar__guardado.html` | Registrar gasto con división (flujo largo) | Guardado | claro | `referencia/S5-Registrar__guardado.png` |
| `pantallas/S6-Cuentas__telefono-claro.html` | Cuentas (`/cuentas`) | Teléfono · claro | claro | `referencia/S6-Cuentas__telefono-claro.png` |
| `pantallas/S6-Cuentas__telefono-oscuro.html` | Cuentas (`/cuentas`) | Teléfono · oscuro | oscuro | `referencia/S6-Cuentas__telefono-oscuro.png` |
| `pantallas/S6-Cuentas__computadora-claro.html` | Cuentas (`/cuentas`) | Computadora · claro | claro | `referencia/S6-Cuentas__computadora-claro.png` |
| `pantallas/S6-Cuentas__tarjeta-con-saldo-a-favor-mastercard-al-frente.html` | Cuentas (`/cuentas`) | Tarjeta con saldo a favor (mastercard al frente) | claro | `referencia/S6-Cuentas__tarjeta-con-saldo-a-favor-mastercard-al-frente.png` |
| `pantallas/S6-Cuentas__archivadas-visibles.html` | Cuentas (`/cuentas`) | Archivadas visibles | claro | `referencia/S6-Cuentas__archivadas-visibles.png` |
| `pantallas/S6-Cuentas__computadora-oscuro.html` | Cuentas (`/cuentas`) | Computadora · oscuro | oscuro | `referencia/S6-Cuentas__computadora-oscuro.png` |
| `pantallas/S7-Semanal__telefono-claro.html` | Gasto semanal (`/reportes/gasto-semanal`) | Teléfono · claro | claro | `referencia/S7-Semanal__telefono-claro.png` |
| `pantallas/S7-Semanal__telefono-oscuro.html` | Gasto semanal (`/reportes/gasto-semanal`) | Teléfono · oscuro | oscuro | `referencia/S7-Semanal__telefono-oscuro.png` |
| `pantallas/S7-Semanal__computadora-claro.html` | Gasto semanal (`/reportes/gasto-semanal`) | Computadora · claro | claro | `referencia/S7-Semanal__computadora-claro.png` |
| `pantallas/S7-Semanal__vista-de-tabla.html` | Gasto semanal (`/reportes/gasto-semanal`) | Vista de tabla | claro | `referencia/S7-Semanal__vista-de-tabla.png` |
| `pantallas/S7-Semanal__varias-categorias-ejemplo.html` | Gasto semanal (`/reportes/gasto-semanal`) | Varias categorías (ejemplo) | claro | `referencia/S7-Semanal__varias-categorias-ejemplo.png` |
| `pantallas/S7-Semanal__asignado-negativo.html` | Gasto semanal (`/reportes/gasto-semanal`) | Asignado negativo | claro | `referencia/S7-Semanal__asignado-negativo.png` |
| `pantallas/S7-Semanal__categoria-nueva.html` | Gasto semanal (`/reportes/gasto-semanal`) | Categoría nueva | claro | `referencia/S7-Semanal__categoria-nueva.png` |
| `pantallas/K1-Navegacion__telefono-claro.html` | Navegación y marco (A.6, N1–N8) | Teléfono · claro | claro | `referencia/K1-Navegacion__telefono-claro.png` |
| `pantallas/K1-Navegacion__telefono-oscuro.html` | Navegación y marco (A.6, N1–N8) | Teléfono · oscuro | oscuro | `referencia/K1-Navegacion__telefono-oscuro.png` |
| `pantallas/K1-Navegacion__mas-secciones-abierto-n5-n7.html` | Navegación y marco (A.6, N1–N8) | “más secciones” abierto (n5, n7) | claro | `referencia/K1-Navegacion__mas-secciones-abierto-n5-n7.png` |
| `pantallas/K1-Navegacion__notificaciones-abiertas-n7.html` | Navegación y marco (A.6, N1–N8) | Notificaciones abiertas (n7) | claro | `referencia/K1-Navegacion__notificaciones-abiertas-n7.png` |
| `pantallas/K1-Navegacion__computadora-claro.html` | Navegación y marco (A.6, N1–N8) | Computadora · claro | claro | `referencia/K1-Navegacion__computadora-claro.png` |

## 5 · Componentes de A.6 (y los agregados de K5)

Un archivo por componente y tema. Cada archivo muestra la sección completa del tablero, con todos los estados que se diseñaron; la columna "Estados en el archivo" los nombra. Captura: la columna entera del tablero en `referencia/<tablero>__componentes-…-<tema>.png`.

| Archivo (claro · oscuro) | Componente | Tablero | Estados en el archivo |
|---|---|---|---|
| `K2-Base__boton__claro.html` · `K2-Base__boton__oscuro.html` | Botón | K2-Base | principal, secundaria, peligro y discreta × normal, hover, presionado, foco, deshabilitado (con motivo "Completá el monto.") y enviando ("Guardando…") |
| `K2-Base__campo-con-etiqueta__claro.html` · `K2-Base__campo-con-etiqueta__oscuro.html` | Campo con etiqueta — incluye EntradaMonto ("Total" con prefijo $) y EntradaFecha ("Fecha") | K2-Base | Comercio (normal); Total con foco; Total con error ("Usá el punto o la coma solo para los centavos…"); Cuenta deshabilitada (con motivo); Fecha solo lectura; Nota opcional vacía |
| `K2-Base__seleccion__claro.html` · `K2-Base__seleccion__oscuro.html` | Selección — incluye SelectorSegmentado | K2-Base | cerrada; con foco; abierta (opción activa con ✓ y una categoría en problema); con error; deshabilitada (con motivo); selector segmentado Efectivo · Visa Oro · Mastercard |
| `K2-Base__buscador-con-sugerencias__claro.html` · `K2-Base__buscador-con-sugerencias__oscuro.html` | Buscador con sugerencias | K2-Base | vacío; buscando; con resultados; sin resultados; con error |
| `K2-Base__casilla-interruptor-opciones__claro.html` · `K2-Base__casilla-interruptor-opciones__oscuro.html` | Casilla, interruptor, opciones | K2-Base | casilla marcada, desmarcada, mixta, con foco, deshabilitada; interruptor encendido, apagado, con foco, deshabilitado; opción marcada, desmarcada, con foco, deshabilitada |
| `K2-Base__pestanas__claro.html` · `K2-Base__pestanas__oscuro.html` | Pestañas o vistas | K2-Base | activa e inactivas; "Sin fondos" con foco |
| `K2-Base__superpuesto-flujo-corto__claro.html` · `K2-Base__superpuesto-flujo-corto__oscuro.html` | Superpuesto (flujo corto) — hoja inferior | K2-Base | abierto (campo Monto con foco, Cancelar y Asignar $75.00); cargando (esqueleto y Asignar deshabilitado); con error ("No se pudo asignar." + Intentar de nuevo) |
| `K2-Base__pagina-de-flujo-flujo-largo__claro.html` · `K2-Base__pagina-de-flujo-flujo-largo__oscuro.html` | Página de flujo (flujo largo) | K2-Base | Cerrar arriba, contenido y Guardar fijo abajo |
| `K2-Base__menu-de-acciones__claro.html` · `K2-Base__menu-de-acciones__oscuro.html` | Menú de acciones | K2-Base | cerrado (disparador "Más acciones"); abierto con elemento activo ("Mover dinero") y de peligro ("Eliminar") |
| `K2-Base__aviso-en-linea__claro.html` · `K2-Base__aviso-en-linea__oscuro.html` | Aviso en línea | K2-Base | uno por estado |
| `K2-Base__resultado-de-una-accion__claro.html` · `K2-Base__resultado-de-una-accion__oscuro.html` | Resultado de una acción | K2-Base | aprobado → "Ver transacción"; descartado → "Restaurar"; asignado → "Deshacer" |
| `K2-Base__insignia-de-contador__claro.html` · `K2-Base__insignia-de-contador__oscuro.html` | Insignia de contador | K2-Base | sin dato; cero; número |
| `K2-Base__esqueleto-de-carga__claro.html` · `K2-Base__esqueleto-de-carga__oscuro.html` | Esqueleto de carga | K2-Base | sin números inventados |
| `K2-Base__navegacion-en-curso__claro.html` · `K2-Base__navegacion-en-curso__oscuro.html` | Indicador de navegación en curso | K2-Base | barra global de carga y pestaña presionada al instante |
| `K3-Dominio-A__monto__claro.html` · `K3-Dominio-A__monto__oscuro.html` | Monto | K3-Dominio-A | negativo, cero y positivo en cifra-principal, cifra y cuerpo |
| `K3-Dominio-A__indicador-de-estado__claro.html` · `K3-Dominio-A__indicador-de-estado__oscuro.html` | Indicador de estado | K3-Dominio-A | los 7 estados con etiqueta visible y la versión solo para lector de pantalla |
| `K3-Dominio-A__fila-de-categoria__claro.html` · `K3-Dominio-A__fila-de-categoria__oscuro.html` | Fila de categoría | K3-Dominio-A | normal · con meta cubierta; sobregirada con débito; sobregirada con tarjeta; sobregirada con ambas (ejemplo); con meta: falta; con meta: vencida (ejemplo); período cerrado (sin asignar); computadora: columnas |
| `K3-Dominio-A__fila-de-pago-de-tarjeta__claro.html` · `K3-Dominio-A__fila-de-pago-de-tarjeta__oscuro.html` | Fila de pago de tarjeta | K3-Dominio-A | con falta; con exceso de reserva (ejemplo); con pago excedente (ejemplo); al día (“Te falta reservar” como número principal) |
| `K3-Dominio-A__resumen-listo-para-asignar__claro.html` · `K3-Dominio-A__resumen-listo-para-asignar__oscuro.html` | Resumen "Listo para asignar" | K3-Dominio-A | positivo con “en camino” y reducción proyectada; cero; negativo (ejemplo) (el billete de Sobres, con grabado y brillo lento) |
| `K3-Dominio-A__tarjeta-de-credito__claro.html` · `K3-Dominio-A__tarjeta-de-credito__oscuro.html` | Tarjeta de crédito | K3-Dominio-A | con falta de reserva; deuda reservada; saldo a favor (ejemplo); sin deuda |
| `K3-Dominio-A__fila-de-cuenta__claro.html` · `K3-Dominio-A__fila-de-cuenta__oscuro.html` | Fila de cuenta | K3-Dominio-A | con diferencia de conciliación; normal; archivada |
| `K3-Dominio-A__barra-de-progreso__claro.html` · `K3-Dominio-A__barra-de-progreso__oscuro.html` | Barra de progreso | K3-Dominio-A | 0 %; parcial con la parte sin reservar rayada (uso del límite); completa (meta cubierta) |
| `K3-Dominio-A__resumen-de-meta__claro.html` · `K3-Dominio-A__resumen-de-meta__oscuro.html` | Resumen de meta | K3-Dominio-A | falta para la meta; cubierta; vencida (ejemplo) |
| `K3-Dominio-A__aviso__claro.html` · `K3-Dominio-A__aviso__oscuro.html` | Aviso | K3-Dominio-A | sin acción; con acción; con su resultado |
| `K4-Dominio-B__fila-de-transaccion__claro.html` · `K4-Dominio-B__fila-de-transaccion__oscuro.html` | Fila de transacción | K4-Dominio-B | agrupadas por día; gasto pendiente; conciliada; con marcas por cobrar y devoluciones; ingreso; transferencia; pago de tarjeta programado; en período cerrado |
| `K4-Dominio-B__movimiento-de-la-bandeja__claro.html` · `K4-Dominio-B__movimiento-de-la-bandeja__oscuro.html` | Movimiento de la bandeja | K4-Dominio-B | un toque; falta; coincidencia; duplicado; no reconocido; error; faltantes |
| `K4-Dominio-B__selector-de-periodo__claro.html` · `K4-Dominio-B__selector-de-periodo__oscuro.html` | Selector de período | K4-Dominio-B | activo; cerrado; futuro; de transición |
| `K4-Dominio-B__confirmacion-del-impacto__claro.html` · `K4-Dominio-B__confirmacion-del-impacto__oscuro.html` | Confirmación del impacto | K4-Dominio-B | con avisos; sin avisos |
| `K4-Dominio-B__lineas-de-un-gasto-dividido__claro.html` · `K4-Dominio-B__lineas-de-un-gasto-dividido__oscuro.html` | Líneas de un gasto dividido | K4-Dominio-B | una línea; varias; con diferencia |
| `K4-Dominio-B__grafico-de-barras-y-lineas__claro.html` · `K4-Dominio-B__grafico-de-barras-y-lineas__oscuro.html` | Gráfico de barras y de líneas | K4-Dominio-B | con datos y semana futura; un solo punto; vacío (la referencia se distingue por su línea discontinua) |
| `K4-Dominio-B__grafico-de-dona__claro.html` · `K4-Dominio-B__grafico-de-dona__oscuro.html` | Gráfico de dona | K4-Dominio-B | con datos; con “Otras”; una porción; sin datos (etiqueta directa + porcentaje; la tabla es la lista) |
| `K4-Dominio-B__estado-vacio__claro.html` · `K4-Dominio-B__estado-vacio__oscuro.html` | Estado vacío | K4-Dominio-B | primer uso; sección vacía; sin resultados |
| `K4-Dominio-B__error-de-pantalla__claro.html` · `K4-Dominio-B__error-de-pantalla__oscuro.html` | Error de pantalla | K4-Dominio-B | en página; en superpuesto (con referencia copiable e "Intentar de nuevo") |
| `K4-Dominio-B__avisos-globales__claro.html` · `K4-Dominio-B__avisos-globales__oscuro.html` | Avisos globales | K4-Dominio-B | "Estás sin conexión"; "Hay una versión nueva" con "Recargar" |
| `K5-Nuevos__barra-de-gastado-sobre-asignado__claro.html` · `K5-Nuevos__barra-de-gastado-sobre-asignado__oscuro.html` | Barra de gastado sobre asignado — agregado en la v2 (A.10) | K5-Nuevos | dentro de lo asignado; sobregiro con débito: el excedente al final; sobregiro con tarjeta; meta: falta; meta vencida (en cada fila de categoría) |
| `K5-Nuevos__selector-en-pastilla-filtros__claro.html` · `K5-Nuevos__selector-en-pastilla-filtros__oscuro.html` | Selector en pastilla · filtros — agregado en la v2 (A.10) | K5-Nuevos | Gráfico / Tabla con Gráfico activo y con Tabla activo; filtros de Presupuesto con "Sobregiradas" activo |
| `K5-Nuevos__acciones-tonales__claro.html` · `K5-Nuevos__acciones-tonales__oscuro.html` | Acciones tonales — agregado en la v2 (A.10) | K5-Nuevos | "+" de asignar (círculo tonal) y botón secundario tonal "Mover dinero" |
| `K5-Nuevos__campana-con-contador__claro.html` · `K5-Nuevos__campana-con-contador__oscuro.html` | Campana con contador — agregado en la v2 (A.10) | K5-Nuevos | campana con contador "2" |
| `K5-Nuevos__billetera-de-tarjetas__claro.html` · `K5-Nuevos__billetera-de-tarjetas__oscuro.html` | Billetera de tarjetas — agregado en la v2 (A.10) | K5-Nuevos | Visa Oro al frente con su detalle (la de atrás pasa al frente al tocarla, ver prototipo) |
| `K5-Nuevos__identidad-por-tipo-de-cuenta__claro.html` · `K5-Nuevos__identidad-por-tipo-de-cuenta__oscuro.html` | Identidad por tipo de cuenta — agregado en la v2 (A.10) | K5-Nuevos | cuenta corriente con diferencia de conciliación; cuenta de ahorro; préstamo (boleto con cuota); inversión |
| `K5-Nuevos__fila-compacta-de-la-bandeja__claro.html` · `K5-Nuevos__fila-compacta-de-la-bandeja__oscuro.html` | Fila compacta de la Bandeja — agregado en la v2 (A.10) | K5-Nuevos | listo para aprobar; falta la categoría; con coincidencia |
| `K5-Nuevos__panel-de-notificaciones__claro.html` · `K5-Nuevos__panel-de-notificaciones__oscuro.html` | Panel de notificaciones — agregado en la v2 (A.10) | K5-Nuevos | abierto con 2 sin leer (el estado "Todo leído" está en el prototipo) |
| `K5-Nuevos__paleta-categorica-de-graficos__claro.html` · `K5-Nuevos__paleta-categorica-de-graficos__oscuro.html` | Paleta categórica de gráficos — agregado en la v2 (A.10) | K5-Nuevos | los 8 colores en orden fijo con su valor y la nota de validación |
| `K5-Nuevos__grafico-acumulado__claro.html` · `K5-Nuevos__grafico-acumulado__oscuro.html` | Gráfico acumulado — agregado en la v2 (A.10) | K5-Nuevos | con datos, punto actual y distancia a la referencia |
| `K5-Nuevos__rango-contra-periodos-anteriores__claro.html` · `K5-Nuevos__rango-contra-periodos-anteriores__oscuro.html` | Rango contra períodos anteriores — agregado en la v2 (A.10) | K5-Nuevos | S1–S5 con la semana futura |
| `K5-Nuevos__tabla-con-estilo__claro.html` · `K5-Nuevos__tabla-con-estilo__oscuro.html` | Tabla con estilo — agregado en la v2 (A.10) | K5-Nuevos | tabla por semana con la semana en curso resaltada |
| `K5-Nuevos__movimiento.html` | Movimiento — agregado en la v2 (A.10) | K5-Nuevos | tabla de duraciones y curvas de cada transición |

### 5.1 · Estados pedidos por componente

Estados de la lista pedida (normal, foco, deshabilitado, error, cargando, abierto, cerrado) en los componentes interactivos. "—" significa que **no existe en el diseño aprobado**: no se inventó.

| Componente | Normal | Foco | Deshabilitado | Error | Cargando | Abierto | Cerrado | Otros estados diseñados | Archivo |
|---|---|---|---|---|---|---|---|---|---|
| Botón (principal, secundaria, peligro, discreta) | ✓ | ✓ | ✓ con motivo | — | ✓ "Guardando…" | n/a | n/a | hover, presionado | `K2-Base__boton__*` |
| Campo con etiqueta | ✓ | ✓ | ✓ con motivo | ✓ con mensaje | — | n/a | n/a | solo lectura, opcional | `K2-Base__campo-con-etiqueta__*` |
| EntradaMonto ("Total", prefijo $, cifras tabulares) | ✓ (Registrar) | ✓ | — | ✓ "1.234,50" | — | n/a | n/a | — | `K2-Base__campo-con-etiqueta__* · S5-Registrar__monto-mal-escrito` |
| EntradaFecha ("Fecha", dd/mm/aaaa) | ✓ (Registrar) | — | — | — | — | — | — | solo lectura | `K2-Base__campo-con-etiqueta__* · S5-Registrar__*` |
| Selección | ✓ cerrada | ✓ | ✓ con motivo | ✓ con mensaje | — | ✓ | ✓ | — | `K2-Base__seleccion__*` |
| SelectorSegmentado (pocas opciones / Gráfico-Tabla) | ✓ | — | — | — | — | n/a | n/a | opción activa / inactiva | `K2-Base__seleccion__* · K5-Nuevos__selector-en-pastilla-filtros__*` |
| Buscador con sugerencias | ✓ vacío | — | — | ✓ | ✓ "buscando" | ✓ con resultados | ✓ vacío | sin resultados | `K2-Base__buscador-con-sugerencias__*` |
| Casilla · interruptor · opciones | ✓ | ✓ | ✓ | — | — | n/a | n/a | marcado, desmarcado, mixto | `K2-Base__casilla-interruptor-opciones__*` |
| Pestañas | ✓ activa / inactiva | ✓ | — | — | — | n/a | n/a | — | `K2-Base__pestanas__*` |
| Hoja · superpuesto (flujo corto) | n/a | ✓ campo con foco | ✓ botón deshabilitado al cargar | ✓ | ✓ | ✓ | — (no se dibuja; ver animación de cierre en el prototipo) | — | `K2-Base__superpuesto-flujo-corto__* · prototipo` |
| Menú de acciones | ✓ cerrado | — | ✓ (motivo en texto) | — | — | ✓ | ✓ | elemento activo, elemento de peligro | `K2-Base__menu-de-acciones__*` |
| Más secciones (hoja) | — | — | — | — | — | ✓ | — (no visible) | — | `K1-Navegacion__mas-secciones-abierto-n5-n7 · prototipo` |
| Panel de notificaciones | — | — | — | — | — | ✓ sin leer | — (no visible) | todo leído (solo en el prototipo) | `K5-Nuevos__panel-de-notificaciones__* · K1-Navegacion__notificaciones-abiertas-n7 · prototipo` |

Sin componente propio: **EntradaFecha** no tiene selector de calendario diseñado; es un Campo con etiqueta con formato dd/mm/aaaa. **EntradaMonto** es el mismo Campo con el prefijo "$" y cifras tabulares.

## 6 · Estilos

| Archivo | Qué es |
|---|---|
| `estilos/tokens.css` | Los tokens de A.3 y los agregados de A.10, en los dos temas, más las clases `.t-<rol>` y "reducir movimiento". Es el mismo de `finn-entrega.zip`. |
| `estilos/tokens.json` | Los mismos valores como datos. |
| `estilos/finn.css` | Lo que el canvas aplica a todas las piezas: `body { margin: 0 }`, los `@keyframes` y las clases de animación (`fz-*`) de PANTALLAS.md §11, y "reducir movimiento". |
| `estilos/fuentes.css` | `@font-face` de Archivo (variable: `wght` 100–900, `wdth` 62–125) y Big Shoulders Display 700 y 800, autohospedadas. |

Cómo se reescribieron los colores a tokens (no cambia ningún píxel, ver §2):
- Un color se reemplaza por `var(--token)` solo si su valor es exactamente el de un token en el tema del archivo. Las sombras `elevacion-1/2/3` y los degradados `tarjeta-oro` / `tarjeta-plata` se reconocen enteros.
- Cuando varios tokens tienen el mismo valor (por ejemplo `#FFFFFF` es `superficie`, `superficie-elevada` y `texto-sobre-accion` en claro), se eligió por la propiedad: `color` → tokens de texto; `background` → superficies y acciones; `border`, `outline`, `box-shadow` → bordes; `fill`, `stroke`, `stop-color` → tokens de gráfico. El texto sobre un fondo `accion`, `peligro` o `marca` usa su `texto-sobre-…`, y sobre `accion-tonal` usa `accion`. Si al portar un nombre no encaja, el valor es el mismo: cambialo por el semántico correcto.
- En SVG, `fill`, `stroke` y `stop-color` pasaron de atributo a estilo (`style="fill: var(--…)"`), porque los atributos de presentación no aceptan `var()`.
- `marca-icono-fondo` y `marca-icono-figura` no se usan en piezas de interfaz (solo en los íconos de la app), aunque coincidan en valor.

## 7 · Diferencias (no se corrigieron)

Lo que en el canvas no coincide con `PANTALLAS.md`, con las capturas o con el resto del diseño. Se exportó tal cual.

| # | Dónde | Diferencia |
|---|---|---|
| D1 | K2 Botón (`K2-Base__boton__*`) y donde se use | Solo el estado **normal** del botón secundario es tonal (`accion-tonal` + texto `accion`, sin borde). Hover, presionado, foco y enviando conservan el estilo anterior: fondo `borde-sutil` / `borde-control` / `superficie-hundida` con borde de 1 px `borde-control` y texto `texto`. PANTALLAS.md §2.1 describe el secundario solo como tonal. |
| D2 | Gasto semanal: todos los archivos `S7-Semanal__*` y los dos prototipos | Las muestras de color de las pastillas de categoría usan la **paleta categórica anterior** (`#2448C9`, `#4D7A12`; en oscuro `#7D96FF`), no `grafico-serie-1…8`. El resto de los gráficos usa la paleta validada. |
| D3 | Presupuesto, filtros (`S2-Presupuesto__*`, teléfono) | La fila de filtros tiene `overflow: hidden`: "Cubiertas" queda cortada. PANTALLAS.md §2.3 dice que la fila se desplaza horizontalmente si no caben. |
| D4 | Barra lateral de computadora (todas las `…__computadora-*`) | La marca es una "F" en Big Shoulders dentro de un cuadro `marca`, no el símbolo "F apilada" de A.9. PANTALLAS.md §3.2 admite "la F o el símbolo". |
| D5 | Prototipo · hoja Asignar | El contenido es fijo: siempre "Asignar a Fondo de emergencia" con $75.00, aunque se abra desde "Cubrir $26.30" o desde "Asignar $312.40". |
| D6 | Prototipo · Gasto semanal | "Volver a Reportes" lleva a Inicio (Reportes no está diseñado). |
| D7 | Prototipo · Actividad | No es una pantalla de A.7: es una lista mínima para que la pestaña tenga destino, con una nota visible que lo dice. |
| D8 | Prototipo · sin acción | No responden: los "+" de cada categoría, los filtros "Sin fondos" y "Cubiertas", las flechas de período, "Revisar", "Descartar", las filas de Bandeja sin acción (la revisión a pantalla completa no está diseñada), "Más acciones" y los enlaces de Próximos 7 días y Recientes. |
| D9 | Prototipo · panel lateral | Es presentación, no parte de la app: dice "Tocá Play" (texto del canvas) y usa siempre colores claros, también en el archivo oscuro. |
| D10 | Variantes oscuras vs. capturas | Alrededor de las esquinas redondeadas del teléfono se ve el fondo de la página: en las capturas era gris claro (fondo del tablero); en la exportación es `superficie-hundida` oscura. Solo afecta a la maqueta. |
| D11 | `tokens.css` vs. canvas | `tokens.css` declara `color-scheme: dark` en el tema oscuro y el canvas no lo hacía. No cambió nada visible en las piezas exportadas (verificado), pero los controles nativos del navegador (barras de desplazamiento, autocompletado) se verán en esquema oscuro. |

Lo que no se pudo exportar porque **no existe en el diseño**: la revisión de un movimiento de la Bandeja a pantalla completa, la pantalla Actividad, Reportes, el selector de fecha y las demás secciones secundarias (Metas, Programadas, Por cobrar, Reglas, Ajustes). Todo lo demás se exportó como código; no hizo falta recurrir a SVG anotado.

## 8 · Valores que no están en los tokens

### 8.1 · Colores

| Valor | Usos | Propiedad | Dónde | Qué es |
|---|---|---|---|---|
| `rgba(0,0,0,.18)` | 94 | box-shadow | K1-Navegacion, K2-Base, K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S1-Inicio, S2-Presupuesto, S3-Detalle, S4-Bandeja, S5-Registrar, S6-Cuentas, S7-Semanal | Sombras de maqueta (marco del teléfono y de la computadora), botón presionado (sombra interior) y líneas del chip de la tarjeta |
| `rgba(0,0,0,.25)` | 92 | background, border, box-shadow | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Líneas del chip de la tarjeta y sombra del teléfono del prototipo |
| `rgba(255,255,255,.2)` | 30 | box-shadow | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Luz interior de la cara de las tarjetas de crédito |
| `rgba(255,255,255,.16)` | 30 | background | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Brillo que cruza la cara de las tarjetas |
| `#000000` | 24 | -webkit-mask-image, mask-image | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Máscara (mask-image) de las líneas de libreta: funcional, no se ve |
| `#1F47D155` | 23 | box-shadow, filter | K4-Dominio-B, K5-Nuevos, Prototipo-v2-Claro, S7-Semanal | Sombra de color `accion` al 33 % (barra de la semana en curso, punto actual del rango) |
| `rgba(16,20,24,.06)` | 16 | box-shadow | Prototipo-v2-Claro, Prototipo-v2-Oscuro | Sombra de los botones del panel lateral del prototipo (presentación, no es la app) |
| `#474E58` | 16 | color, stroke | Prototipo-v2-Oscuro | Panel lateral del prototipo OSCURO: usa siempre colores claros (presentación) |
| `rgba(255,255,255,.07)` | 16 | background | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, S6-Cuentas | Guilloché de anillos de la cara de las tarjetas |
| `rgba(0,0,0,.6)` | 16 | box-shadow | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, S6-Cuentas | Sombra de la cara de las tarjetas |
| `#101418` | 15 | color | Prototipo-v2-Oscuro | Panel lateral del prototipo oscuro (presentación) |
| `#7A93FF55` | 15 | box-shadow, filter | K4-Dominio-B, K5-Nuevos, Prototipo-v2-Oscuro, S7-Semanal | Lo mismo en oscuro |
| `#F3E3B5` | 15 | background | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Chip de la tarjeta dorada (degradado) |
| `#B8975A` | 15 | background | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Chip de la tarjeta dorada (degradado) |
| `#EEF1F4` | 15 | background | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Chip de la tarjeta plateada (degradado) |
| `#9AA3AE` | 15 | background | K3-Dominio-A, K5-Nuevos, Prototipo-v2-Claro, Prototipo-v2-Oscuro, S6-Cuentas | Chip de la tarjeta plateada (degradado) |
| `#FFFFFF` | 8 | background | Prototipo-v2-Oscuro | Panel lateral del prototipo oscuro (presentación) |
| `#1F47D1` | 8 | color, stroke | Prototipo-v2-Oscuro | Panel lateral del prototipo oscuro (presentación) |
| `rgba(31,71,209,.45)` | 7 | background | K1-Navegacion, Prototipo-v2-Claro, S1-Inicio | Resplandor bajo el billete de Listo para asignar (claro) |
| `rgba(241,242,238,.24)` | 7 | background | K1-Navegacion, Prototipo-v2-Claro, S1-Inicio | Brillo que cruza el billete (claro); `marca-grabado` con más opacidad |
| `#2448C9` | 7 | background | Prototipo-v2-Claro, S7-Semanal | Paleta categórica ANTERIOR (ver diferencia D2) |
| `rgba(16,20,24,.22)` | 5 | border-left | K5-Nuevos, Prototipo-v2-Claro, S6-Cuentas | Línea perforada del boleto del préstamo (claro) |
| `rgba(238,240,236,.2)` | 5 | border-left | K5-Nuevos, Prototipo-v2-Oscuro, S6-Cuentas | Línea perforada del boleto (oscuro) |
| `rgba(122,147,255,.35)` | 4 | background | K1-Navegacion, Prototipo-v2-Oscuro, S1-Inicio | Resplandor bajo el billete (oscuro) |
| `rgba(13,16,19,.24)` | 4 | background | K1-Navegacion, Prototipo-v2-Oscuro, S1-Inicio | Brillo que cruza el billete (oscuro) |
| `rgba(241,242,238,.22)` | 3 | background | K3-Dominio-A | Brillo del billete en K3 (claro) |
| `rgba(13,16,19,.22)` | 3 | background | K3-Dominio-A | Brillo del billete en K3 (oscuro) |
| `#7D96FF` | 2 | background | Prototipo-v2-Oscuro, S7-Semanal | Paleta categórica ANTERIOR, oscuro (ver D2) |
| `#4D7A12` | 1 | background | S7-Semanal | Paleta categórica ANTERIOR (ver D2) |
| `#E7E9E3` | 1 | background | Prototipo-v2-Oscuro | Fondo del prototipo oscuro (presentación) |

Sugerencia al portar: los valores de la cara de las tarjetas, el chip, el billete y el boleto son decorativos y pueden ir como tokens locales del componente; las sombras de maqueta (marco del dispositivo) no son parte de la app.

### 8.2 · Espaciados fuera de la escala `espacio-*` (múltiplos de 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

Se usan en `padding`, `margin` y `gap`. Valor (usos): `-26px` (59), `-1px` (98), `1px` (123), `2px` (596), `3px` (551), `5px` (71), `6px` (1115), `7px` (176), `10px` (924), `11px` (246), `14px` (631), `18px` (299), `22px` (84), `26px` (10), `28px` (47), `36px` (5), `44px` (48), `50px` (7), `52px` (21), `56px` (4), `110px` (8), `120px` (39).

### 8.3 · Radios fuera de `radio-*` (10, 16, 24, 18, 20 px y redondo)

Valor (usos): `4px` (462), `1px` (156), `12px` (99), `2px` (65), `3px` (62), `44px` (50), `22px` (48), `7px` (30), `8px` (30), `14px` (17), `28px` (16). Los de 44 px son la maqueta del teléfono; 14 px la de la computadora; 2–7 px son detalles (barritas, chip, insignias); `10px 10px 4px 4px` es el campo relleno.

### 8.4 · Tamaños de letra fuera de los roles

Valor (usos): `0.8125rem` (138), `.6875rem` (72), `1.5rem` (72), `12px` (72), `10.5px` (61), `1.125rem` (48), `1.75rem` (39), `1.625rem` (37), `0.875rem` (26), `2.25rem` (26), `11px` (20), `.8125rem` (16), `2.5rem` (11), `22px` (10), `3rem` (9), `52px` (8), `60px` (3), `3.25rem` (2). Son ajustes de un rol (por ejemplo `cifra-principal` a 3rem en el héroe del detalle) o textos de la navegación y de las insignias en px.

### 8.5 · Movimiento

Las animaciones en línea usan estas duraciones (usos): `.8s` (143), `.4s` (109), `1.4s` (97), `.6s` (95), `.7s` (72), `.5s` (71), `2.8s` (48), `8s` (30), `.3s` (17), `.9s` (16), `.36s` (14), `0ms` (14), `.15s` (11), `6s` (11), `40s` (11), `7s` (11), `200ms` (8), `1s` (8), `2.6s` (8), `5s` (6). Los tokens definen 120, 220, 340, 400 y 5000 ms: las de 0.3–0.9 s y los bucles de 2.6–40 s (halo, brillo, deriva del guilloché) no tienen token propio. Las curvas en línea son `cubic-bezier(.2,.8,.2,1)` (`--curva-estandar`), `cubic-bezier(.2,.9,.25,1)` (`--curva-entrada`), `ease`, `ease-out` y `linear`.

## 9 · Fuentes

Archivo y Big Shoulders Display se distribuyen bajo la SIL Open Font License 1.1 (licencias en `fuentes/`). Los archivos son los subconjuntos "latin" de Fontsource: cubren el español y el signo menos (U+2212); la flecha "→" cae a la fuente del sistema, igual que en el canvas con Google Fonts.
