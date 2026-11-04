# Finn 2.0 · exportación del diseño · entrega 2

Completa el diseño con lo que faltaba después de la auditoría: la **Parte 1** (diferencias D1–D4, EntradaFecha, estados de cargando y error, medidas fuera de escala y "Más acciones") y las **15 pantallas de la Parte 2**, todas con estilo v2. Cada estado está en **teléfono claro, teléfono oscuro y computadora claro**, un archivo por estado y variante, como PNG + HTML con `data-rol`.

**Se entregó todo lo pedido**, en el orden de prioridad 1, 2, 3, 6, 7, 4 y después el resto. Ninguna pantalla quedó diferida (ver §6 para lo que se resolvió con criterio propio).

| | Cantidad |
|---|---|
| Pantallas (incluye 3 de la Parte 1) | 21 |
| Estados | 161 |
| Archivos de pantalla (estado × 3 variantes) | 483 HTML + 483 PNG |
| Hojas de componentes (Parte 1, claro y oscuro) | 10 HTML + 10 PNG |

## 1 · Cómo abrirlo

- Abrí cualquier `.html` con doble clic; las fuentes se cargan de `fuentes/` por ruta relativa (mantené las carpetas). Cada archivo lleva dentro `tokens.css`, `finn.css` y las fuentes; el tema lo fija `<html data-theme>`.
- Los colores son siempre `var(--token)` de `tokens.css`. `data-rol="<rol>"` marca cada texto con un rol tipográfico de A.5.
- El PNG tiene el mismo nombre que su HTML: teléfono a 2×, computadora a 1×, con "reducir movimiento" activo (el estado final de cada animación).
- Mismo marco que la entrega 1: teléfono de 390 px con barra superior e inferior, computadora de 1440 px con la barra lateral.

```
finn-diseno-export-2/
├── INDICE.md
├── pantallas/<id>-<pantalla>/<estado>__telefono-claro|telefono-oscuro|computadora-claro.(html|png)
├── componentes/P1-0n-<hoja>__claro|oscuro.(html|png)   hojas de la Parte 1
├── estilos/      tokens.css, tokens.json, finn.css, fuentes.css (sin cambios) + tokens-propuesta.css (§3.3)
└── fuentes/
```

## 2 · Cómo se verificó

- Las 493 páginas se generaron con los mismos componentes v2 de la entrega 1 (K2–K5) y se tokenizaron con el mismo proceso.
- **Ningún valor nuevo**: se compararon todos los colores, espaciados, radios y tamaños de letra de esta entrega con el registro de la entrega 1. **No apareció ninguno que no estuviera ya**: los fuera de escala que quedan vienen de componentes ya aprobados (se tratan en §3.3).
- La única diferencia en movimiento es la entrada del menú de acciones (`.22s`, que es `--duracion-normal`) y el velo de las hojas (`.28s`, la misma clase `fz-v-in` que ya usaba el prototipo).
- Se revisaron a ojo los PNG de cada pantalla en los dos temas: textos que no se cortan, el pie fijo que no tapa contenido y la lectura en oscuro.

## 3 · Parte 1

### 3.1 · Diferencias de la entrega 1

| | Qué era | Cómo quedó | Dónde verlo |
|---|---|---|---|
| D1 | El botón secundario tonal solo tenía el estado normal | Estados completos: **hover** (texto `accion-hover` + `elevacion-1`), **presionado** (texto `accion-presionada`, escala .98), **foco** (contorno `foco` 2 px, separado 2 px), **enviando** (indicador + "Guardando…", `aria-busy`), **deshabilitado** (`superficie-hundida`, `texto-deshabilitado`, sin borde, con motivo) y **error** | `componentes/P1-01-…` |
| D2 | Gasto semanal usaba la paleta vieja en el selector de categorías | Usa `grafico-serie-1…8` (paleta validada) | `pantallas/D2-…` |
| D3 | Los filtros del Presupuesto cortaban "Cubiertas" | Fila con desplazamiento horizontal que sangra hasta el borde del teléfono, sin barra visible; el último filtro asoma | `pantallas/D3-…`, `componentes/P1-05-…` |
| D4 | La barra lateral usaba la letra F | Símbolo "F apilada" en `texto-sobre-marca` sobre `marca`, 32 px | todas las pantallas de computadora, `componentes/P1-05-…` |

### 3.2 · EntradaFecha, estados de carga y error, Más acciones

- **EntradaFecha: campo dd/mm/aaaa con calendario.** Se escribe con teclado numérico y las barras se agregan solas. Al lado hay un botón de calendario y los atajos **Hoy** y **Ayer**. El calendario es un superpuesto con la grilla de 7 columnas: el día elegido en `accion`, hoy con anillo y los días fuera de mínimo y máximo tachados y deshabilitados. Al pie se ven hoy y el período. Por defecto toma "hoy" del Encabezado. Estados: cerrada, escribiendo, calendario abierto, con mínimo, error de formato, posterior a hoy, período cerrado (aviso, no error) y solo lectura. Motivo: escribir es lo más rápido en computadora y el calendario evita errores en el teléfono. El selector nativo queda como respaldo (05 §5.3). `componentes/P1-03-…`
- **Cargando y error** en campos, selecciones y botones. El control conserva su etiqueta y su lugar. **Cargando:** indicador + "Cargando…", sin escritura. **Error al cargar:** guion largo, motivo y "Intentar de nuevo". Error de validación y de conflicto (`conflicto_desactualizado`), en botones cargando = enviando, y error con el motivo debajo. `componentes/P1-02-…`
- **Más acciones** en una pantalla hija = menú de acciones de K2. En teléfono se abre con el botón de tres puntos de la barra superior; en computadora, con "Más acciones" junto a la campana. Lo no disponible va deshabilitado y con su motivo; Eliminar va al final, separado, en `peligro`. Aplicado a **Detalle de categoría** (editar, meta, mover dinero, archivar, fusionar, eliminar deshabilitado por historial: `pantallas/MA-…`), a **Detalle de cuenta** (efectivo y tarjeta, con archivar y eliminar bloqueados con los textos de `cuenta_con_saldo` y `cuenta_con_movimientos`: `pantallas/06-…/mas-acciones*`) y a **Detalle de transacción** (`pantallas/03-…/mas-acciones`, `conciliada`).

### 3.3 · Medidas y duraciones fuera de escala: qué pasa a token y qué se redondea

Recuento sumando las dos entregas. La regla: se vuelve token lo que se repite mucho **y** tiene una función propia; lo demás se redondea al token más cercano. Los tokens propuestos están en `estilos/tokens-propuesta.css`; `tokens.css` no se tocó.

| Valor | Usos | Decisión |
|---|---|---|
| 6px (espaciado) | 3905 | **Token** `--espacio-1-5`: etiqueta ↔ control, glifo ↔ texto |
| 2px (espaciado) | 3476 | **Token** `--espacio-0-5`: separación de segmentos en barras |
| 10px · 11px | 2383 · 627 | Redondear a 12 (`espacio-3`) |
| 3px · 5px | 2022 · 420 | Redondear a 4 (`espacio-1`) |
| 14px · 18px | 1492 · 963 | Redondear a 16 (`espacio-4`) |
| 7px | 538 | Redondear a 8 (`espacio-2`) |
| 22px · 26px · 28px | 448 · 94 · 211 | 22 y 26 → 24 (`espacio-6`); 28 → 32 (`espacio-8`) |
| 36px · 50px · 52px · 56px | 10 · 7 · 21 · 4 | 36 → 40; 50 y 52 → 48; 56 = `calc(espacio-10 + espacio-4)` (sangría de 40 + 16) |
| 44px (espaciado) | 350 | Usar `--tactil-minimo` (es la sangría igual al tocable) |
| 110px · 120px | 92 · 237 | **Token** `--despeje-barra-inferior: 120px`; 110 → 120 |
| −26px · ±1px | 257 · 443 | Constantes de componente (botón central que sobresale, compensar bordes): sin token |
| 4px (radio) | 2081 | **Token** `--radio-fino`; 1, 2 y 3 px → 4 |
| 8px · 12px (radio) | 428 · 172 | Redondear a 10 (`radio-control`) |
| 28px (radio) | 16 | Redondear a 24 (`radio-superpuesto`) |
| 44px · 14px · 22px · 7px (radio) | 372 · 178 · 246 · 44 | Maqueta (marco del teléfono y de la computadora), halo de la Bandeja (18 + 4) y chip de la tarjeta: sin token, no son interfaz |
| .8125rem · .6875rem | 523 · 140 | Redondear a .875rem (`cuerpo-pequeno`) y .75rem (`rotulo`) |
| 12px · 11px · 10.5px | 421 · 322 · 217 | Números de las insignias: redondear a .75rem (tamaño de `rotulo`, peso 800) |
| 1.625rem · 2.5rem | 231 · 162 | **Roles** `titulo-pantalla-hija` y `titulo-pantalla-computadora` |
| 1.75rem · 1.5rem | 78 · 140 | **Rol** `cifra-destacada` (1.75rem); 1.5 → 1.75 |
| 2.25rem | 56 | Redondear a 2.75rem (`cifra-principal`) |
| 3.25rem · 3rem · 52px | 5 · 24 · 20 | **Rol** `cifra-heroe` (3.25rem); 3rem y 52px → 3.25rem |
| 1.125rem | 52 | Redondear a 1.375rem (`titulo-seccion`) |
| 22px · 60px (letra) | 10 · 3 | 22px era la letra F de la barra lateral (desaparece con D4); 60px es del logotipo: sin token |
| .6s · .7s · .8s · .9s · 1s | ~900 | **Token** `--duracion-grafico: 800ms` (entrada de barras, anillos y números) |
| 1.2s · 1.4s | ~190 | **Token** `--duracion-bucle: 1400ms` (esqueletos y dibujos); el indicador giratorio (.8s) usa `--duracion-grafico` |
| 2.6s · 2.8s | 257 | **Token** `--duracion-pulso: 2800ms` (halo de la Bandeja) |
| 5s · 6s · 7s · 8s | ~96 | Redondear a `--duracion-ambiental` (5000ms); el brillo de las tarjetas se desfasa con retraso, no con otra duración |
| 40s | 23 | Deriva decorativa del billete: queda fija (o `8 × duracion-ambiental`) |
| .4s · .5s | ~280 | Redondear a `--duracion-lenta` (400ms) |
| .3s · .36s | ~46 | Redondear a `--duracion-transicion` (340ms) |
| .28s · .22s | 102 | `--duracion-normal` (220ms) |

## 4 · Pantallas

Las rutas y las fichas son las de 05 y 06. Cada estado tiene tres archivos: `<estado>__telefono-claro`, `__telefono-oscuro` y `__computadora-claro`.

### 01 · Revisar movimiento

`/bandeja/[movimientoId]` · FT-35 · FT-37 · FT-38 · carpeta `pantallas/01-revisar-movimiento/`

Flujo largo a pantalla completa en teléfono; en computadora es el panel derecho de la Bandeja, con la lista a la izquierda y el movimiento elegido resaltado.

| Estado | Archivo |
|---|---|
| Listo para aprobar | `listo__*` |
| Falta la categoría | `falta-categoria__*` |
| Dividido en partes | `dividido__*` |
| Parte sin destino (error) | `parte-sin-destino__*` |
| Con coincidencia | `coincidencia__*` |
| Posible duplicado | `posible-duplicado__*` |
| No reconocido | `no-reconocido__*` |
| Con error y referencia copiable | `con-error__*` |
| Ya aprobado | `ya-aprobado__*` |
| Ya descartado | `ya-descartado__*` |
| Aprobado (resultado y propuesta de regla) | `aprobado__*` |
| Pago de tarjeta (origen preseleccionado) | `pago-de-tarjeta__*` |
| Devolución (elegir la compra) | `devolucion__*` |

### 02 · Actividad

`/actividad` · FT-24 · carpeta `pantallas/02-actividad/`

Lista por día con búsqueda (espera 300 ms) y filtros. En teléfono los filtros van en hoja inferior; en computadora, en una columna fija a la izquierda.

| Estado | Archivo |
|---|---|
| Lista por día | `lista__*` |
| Búsqueda con resultados | `buscando__*` |
| Filtros abiertos | `filtros__*` |
| Con filtros activos | `filtrado__*` |
| Cargando | `cargando__*` |
| Cargar más (incluye período cerrado) | `cargar-mas__*` |
| Vacío | `vacio__*` |
| Sin resultados | `sin-resultados__*` |

### 03 · Detalle de transacción

`/transacciones/[transaccionId]` · FT-25 · FT-26 · FT-28 · carpeta `pantallas/03-detalle-de-transaccion/`

Datos, partes con lo cubierto y no cubierto, efectos, eventos, origen, conciliación y cambios posteriores. Las acciones viven en “Más acciones”; editar y devolver son flujos largos; estado, eliminar y eliminar evento son flujos cortos.

| Estado | Archivo |
|---|---|
| Principal | `principal__*` |
| Más acciones abierto | `mas-acciones__*` |
| Conciliada (acciones restringidas) | `conciliada__*` |
| Editar (flujo largo) | `editar__*` |
| Editar con la cuenta archivada | `editar-cuenta-archivada__*` |
| Editar · conflicto al guardar | `editar-conflicto__*` |
| Devolver (flujo largo) | `devolver__*` |
| Devolver · más de lo que queda | `devolver-excede__*` |
| Devolver · sin nada por devolver | `devolver-sin-capacidad__*` |
| Cambiar el estado bancario | `cambiar-estado__*` |
| Eliminar (confirmación) | `eliminar__*` |
| Eliminar · bloqueado por eventos | `eliminar-bloqueado__*` |
| Eliminar un evento (cobro) | `eliminar-evento__*` |
| Eliminada (resultado en Actividad) | `eliminada__*` |

### D2 · Gasto semanal · paleta validada

`/reportes/gasto-semanal` · FT-61 · carpeta `pantallas/D2-gasto-semanal-paleta-validada/`

D2 resuelta: el selector de categorías y las series usan grafico-serie-1…8 (paleta validada).

| Estado | Archivo |
|---|---|
| Varias categorías | `varias__*` |
| Una categoría | `una__*` |

### D3 · Presupuesto · filtros que se desplazan

`/presupuesto` · FT-09 · carpeta `pantallas/D3-presupuesto-filtros-que-se-desplazan/`

D3 resuelta: los filtros se desplazan en horizontal y sangran hasta el borde; "Cubiertas" asoma. D4: la barra lateral usa el símbolo.

| Estado | Archivo |
|---|---|
| Filtro Todas (Cubiertas asoma al borde) | `todas__*` |
| Desplazado hasta Cubiertas | `cubiertas__*` |

### MA · Detalle de categoría · Más acciones

`/presupuesto/categorias/[categoriaId]` · FT-14 · FT-17 · FT-19 · FT-20 · carpeta `pantallas/MA-detalle-de-categoria-mas-acciones/`

El tres puntos de la barra superior abre el menú de acciones (K2) con archivar, fusionar y meta. Eliminar queda deshabilitado con el motivo.

| Estado | Archivo |
|---|---|
| Menú cerrado | `cerrado__*` |
| Menú abierto | `abierto__*` |
| Menú abierto · categoría con meta | `abierto-con-meta__*` |

### 06 · Detalle de cuenta

`/cuentas/[cuentaId]` · FT-50 · FT-52 · FT-53 · FT-54 · FT-55 · FT-30 · FT-43 · FT-44 · carpeta `pantallas/06-detalle-de-cuenta/`

Cabecera con la identidad del tipo (libreta, tarjeta, boleto, escalones), movimientos con el saldo después de cada uno, conciliaciones y programadas. Acciones en “Más acciones”.

| Estado | Archivo |
|---|---|
| Efectivo · cuenta corriente con diferencia | `corriente__*` |
| Tarjeta de crédito | `tarjeta__*` |
| Préstamo con amortización | `prestamo__*` |
| Inversión | `inversion__*` |
| Sin movimientos | `vacia__*` |
| Archivada (solo lectura) | `archivada__*` |
| Más acciones · efectivo | `mas-acciones__*` |
| Más acciones · tarjeta | `mas-acciones-tarjeta__*` |
| Nueva cuenta · elegir el tipo | `nueva-tipo__*` |
| Nueva cuenta · tarjeta de crédito | `nueva-tarjeta__*` |
| Nueva cuenta · nombre repetido | `nueva-nombre-repetido__*` |
| Editar cuenta | `editar__*` |
| Condiciones y amortización | `condiciones__*` |
| Condiciones · sin modelo | `condiciones-sin-modelo__*` |
| Pagar tarjeta | `pagar-tarjeta__*` |
| Pagar tarjeta · más que la deuda | `pagar-saldo-a-favor__*` |
| Pagar cuota | `cuota__*` |
| Pagar cuota · el desglose no cuadra | `cuota-no-cuadra__*` |
| Archivar · bloqueado por saldo | `archivar-bloqueado__*` |
| Archivar (cuenta en cero) | `archivar__*` |
| Eliminar · tiene movimientos | `eliminar-bloqueado__*` |
| Verificar saldo · coincide | `verificar-saldo__*` |
| Verificar saldo · con diferencia | `verificar-diferencia__*` |
| Conciliar CSV · subir el archivo | `conciliar-subir__*` |
| Conciliar CSV · resultado | `conciliar-resultado__*` |
| Conciliar CSV · formato no reconocido | `conciliar-error__*` |
| Ordenar cuentas | `ordenar__*` |

### 07 · Flujos del presupuesto

`/presupuesto/asignar · /mover · /auto-asignar · categorías` · FT-10 · FT-11 · FT-12 · FT-13 · FT-19 · FT-20 · carpeta `pantallas/07-flujos-del-presupuesto/`

Asignar con opciones rápidas, mover dinero y auto-asignar son flujos cortos (hoja inferior en teléfono, panel a la derecha en computadora). Archivar y fusionar son flujos largos.

| Estado | Archivo |
|---|---|
| Asignar con opciones rápidas | `asignar__*` |
| Asignar · cambió mientras editabas | `asignar-conflicto__*` |
| Asignar · período cerrado | `asignar-periodo-cerrado__*` |
| Asignado (resultado con Deshacer) | `asignado__*` |
| Mover dinero | `mover-dinero__*` |
| Mover · más que el Disponible | `mover-excede__*` |
| Auto-asignar (vista previa) | `auto-asignar__*` |
| Auto-asignar · metas cubiertas | `auto-asignar-cubiertas__*` |
| Archivar categoría (flujo largo) | `archivar-categoria__*` |
| Sacar el dinero de una archivada | `sacar-de-archivada__*` |
| Fusionar categorías (flujo largo) | `fusionar__*` |
| Fusionar · destino archivado | `fusionar-destino-archivado__*` |

### 04 · Reportes

`/reportes/[tipo]` · FT-60 · FT-61–FT-68 · carpeta `pantallas/04-reportes/`

Plantilla común: pestañas de tipo como enlaces que se desplazan, selector de ventana (?ventana=), cifra, gráfico con leyenda y selector Gráfico / Tabla.

| Estado | Archivo |
|---|---|
| Tendencia | `tendencia__*` |
| Tendencia como tabla | `tendencia-tabla__*` |
| Categorías (dona) | `categorias__*` |
| Ingresos y gastos | `ingresos-gastos__*` |
| Top de comercios | `top-comercios__*` |
| Hallazgos | `hallazgos__*` |
| Hallazgos · todo en orden | `hallazgos-vacio__*` |
| Sin movimientos | `sin-movimientos__*` |

### 05 · Detalle de Listo para asignar

`/presupuesto/listo-para-asignar` · FT-15 · carpeta `pantallas/05-detalle-de-listo-para-asignar/`

Descomposición, reducción proyectada al cierre e historial con gráfico y tabla, con la nota permanente de B-4.

| Estado | Archivo |
|---|---|
| Principal | `principal__*` |
| Historial como tabla | `tabla__*` |
| Negativo | `negativo__*` |

### 08 · Estructura y plantilla inicial

`/presupuesto/estructura · /presupuesto/estructura/plantilla` · FT-18 · FT-04 · carpeta `pantallas/08-estructura-y-plantilla-inicial/`

Estructura como flujo largo con subir y bajar (con Deshacer); “Pagos de tarjeta” sin acciones. Plantilla: nada se guarda hasta “Crear {n} categorías”.

| Estado | Archivo |
|---|---|
| Estructura | `estructura__*` |
| Categoría movida (Deshacer) | `estructura-movida__*` |
| Sin categorías (ofrece la plantilla) | `estructura-vacia__*` |
| Editar categoría (eliminar deshabilitado) | `editar-categoria__*` |
| Plantilla sugerida | `plantilla__*` |
| Plantilla con todo quitado | `plantilla-vacia__*` |
| Creando la plantilla | `plantilla-creando__*` |
| Creación cortada | `plantilla-cortada__*` |
| Resultado de la plantilla | `plantilla-resultado__*` |

### 09a · Metas

`/metas` · FT-17 · carpeta `pantallas/09a-metas/`

Lista de metas con lo que falta; nueva y editar como flujo corto.

| Estado | Archivo |
|---|---|
| Lista | `lista__*` |
| Con meta vencida | `vencida__*` |
| Sin metas | `vacia__*` |
| Nueva meta | `nueva__*` |

### 09b · Programadas

`/programadas` · FT-40 · FT-41 · FT-42 · carpeta `pantallas/09b-programadas/`

Próximas y atrasadas con horizonte; una ocurrencia se registra con un toque u omite (flujo corto); nueva y editar son flujos largos.

| Estado | Archivo |
|---|---|
| Lista con atrasada y aviso sin modelo | `lista__*` |
| Sin programadas | `vacia__*` |
| Ocurrencia: registrar u omitir | `ocurrencia__*` |
| Ocurrencia ya resuelta | `ocurrencia-resuelta__*` |
| Editar programada (calendario bloqueado) | `editar__*` |

### 09c · Por cobrar

`/por-cobrar` · FT-45 · FT-46 · FT-47 · FT-48 · carpeta `pantallas/09c-por-cobrar/`

Por deudor, con sus partidas; cobrar, condonar y renombrar son flujos cortos.

| Estado | Archivo |
|---|---|
| Lista por deudor | `lista__*` |
| Nadie te debe nada | `vacia__*` |
| Cobrar (reservar preseleccionado) | `cobrar__*` |
| Condonar | `condonar__*` |
| Renombrar · nombre repetido | `renombrar-repetido__*` |

### 09d · Reglas

`/reglas` · FT-39 · carpeta `pantallas/09d-reglas/`

Patrón y categoría; nueva y editar como flujo corto.

| Estado | Archivo |
|---|---|
| Lista (una regla no se aplica) | `lista__*` |
| Sin reglas | `vacia__*` |
| Nueva regla | `nueva__*` |
| Nueva regla · patrón repetido | `nueva-repetida__*` |

### 10 · Notificaciones

`/notificaciones` · FT-69 · carpeta `pantallas/10-notificaciones/`

Página completa del centro de notificaciones (desde la campana se abre como panel, ver K5).

| Estado | Archivo |
|---|---|
| Con 2 sin leer | `lista__*` |
| Todo leído | `todo-leido__*` |
| Sin notificaciones | `vacia__*` |

### 11 · Ajustes

`/ajustes y subpáginas` · FT-72 · FT-03 · FT-73 · FT-74 · FT-75 · FT-76 · FT-77 · carpeta `pantallas/11-ajustes/`

Índice con un resumen por sección y cada subpágina.

| Estado | Archivo |
|---|---|
| Índice (Primeros pasos ocultos) | `indice__*` |
| Ciclo con aviso antes de confirmar | `ciclo__*` |
| Conectar los SMS | `conectar-sms__*` |
| Formatos e instituciones | `formatos__*` |
| Notificaciones | `notificaciones__*` |
| Seguridad con TOTP | `seguridad__*` |
| Seguridad · único factor | `seguridad-factor-unico__*` |
| Exportar | `exportar__*` |
| Respaldo atrasado | `respaldo__*` |
| Diagnóstico con referencia | `diagnostico__*` |
| Apariencia | `apariencia__*` |

### 12 · Registrar · tipos y flujos cortos

`/registrar · /registrar/[tipo]` · FT-22 · FT-23 · FT-27 · FT-28 · FT-32 · FT-56 · FT-57 · carpeta `pantallas/12-registrar-tipos-y-flujos-cortos/`

Selector de tipo; cada tipo distinto de gasto es un flujo corto sobre el selector (hoja en teléfono, panel en computadora).

| Estado | Archivo |
|---|---|
| Selector de tipo | `selector__*` |
| Registrar ingreso | `ingreso__*` |
| Transferencia | `transferencia__*` |
| Transferencia · cuentas iguales | `transferencia-misma-cuenta__*` |
| Devolución | `devolucion__*` |
| Inversión | `inversion__*` |
| Desembolso de préstamo | `desembolso__*` |
| Avance de efectivo | `avance__*` |
| Transferencia de deuda | `transferencia-deuda__*` |
| Fecha en período cerrado (impacto antes de confirmar) | `retroactivo__*` |

### 13 · Acceso

`/ingresar · /ingresar/verificar · /ingresar/inscribir` · FT-01 · FT-02 · carpeta `pantallas/13-acceso/`

Sin marco de la app: símbolo y nombre arriba, formulario centrado (tarjeta en computadora).

| Estado | Archivo |
|---|---|
| Ingresar | `ingresar__*` |
| Credenciales incorrectas | `credenciales-invalidas__*` |
| Demasiados intentos | `demasiados-intentos__*` |
| Código TOTP | `verificar__*` |
| Código con varios factores | `verificar-varios-factores__*` |
| Código incorrecto | `codigo-incorrecto__*` |
| Código vencido | `codigo-vencido__*` |
| Inscribir el primer factor (QR) | `inscribir__*` |
| Inscripción terminada | `inscribir-cierre__*` |

### 14 · Sin conexión, 404 y error de pantalla

`/sin-conexion · not-found · error` · 05 §7.3 · §7.4 · §8 · carpeta `pantallas/14-sin-conexion-404-y-error-de-pantalla/`

La página sin conexión es estática (sin marco ni datos); sin conexión dentro de la app, la pantalla queda con el aviso global y los envíos deshabilitados.

| Estado | Archivo |
|---|---|
| Página sin conexión | `sin-conexion-pagina__*` |
| Sin conexión dentro de la app | `sin-conexion-en-la-app__*` |
| No encontrado (404) | `no-encontrado__*` |
| Error de pantalla con referencia | `error-de-pantalla__*` |

### 15 · Inicio y Presupuesto · piezas nuevas

`/ · /presupuesto` · §3.15 · FT-04 · FT-08 · FT-09 · FT-62 · FT-19 · carpeta `pantallas/15-inicio-y-presupuesto-piezas-nuevas/`

Primeros pasos con “Ocultar por ahora”, hallazgos de ritmo, pagos de tarjeta próximos, “Ver cómo se compone”, “Mover dinero” y “Auto-asignar” bajo la franja, archivadas con dinero y la franja con Listo para asignar negativo.

| Estado | Archivo |
|---|---|
| Inicio · Primeros pasos con Ocultar por ahora | `primeros-pasos__*` |
| Inicio · Primeros pasos sin cuentas | `primeros-pasos-sin-cuentas__*` |
| Inicio · ritmo y pagos de tarjeta próximos | `ritmo-y-tarjetas__*` |
| Presupuesto · Mover dinero, Auto-asignar y archivadas con dinero | `herramientas__*` |
| Presupuesto · franja con Listo para asignar negativo | `lpa-negativo__*` |

## 5 · Hojas de componentes (Parte 1)

| Hoja | Archivos | Qué muestra |
|---|---|---|
| P1-01 · Botón secundario tonal · todos los estados (D1) | `componentes/P1-01-boton-secundario-tonal-todos-los-estados__claro|oscuro` | Fondo accion-tonal y texto accion. Hover: texto accion-hover y elevacion-1. Presionado: texto accion-presionada y escala .98. Foco: contorno foco de 2 px separado 2 px. Enviando: indicador giratorio y "Guardando…", aria-busy. Deshabilitado: superficie-hundida y texto-deshabilitado, sin borde. Error: vuelve a normal con el motivo en problema-texto debajo. |
| P1-02 · Cargando y error en campos, selecciones y botones | `componentes/P1-02-cargando-y-error-en-campos-selecciones-y__claro|oscuro` | Cargando: el control conserva su lugar y su etiqueta, muestra el indicador y "Cargando…" con aria-busy; no se puede escribir. Error al cargar: guion largo, el motivo en problema-texto y "Intentar de nuevo". Error de validación y de conflicto: borde problema-borde de 2 px y el mensaje con glifo. En botones, cargando = enviando; el error deja el botón activo con el motivo debajo. |
| P1-03 · EntradaFecha · campo dd/mm/aaaa con calendario | `componentes/P1-03-entradafecha-campo-dd-mm-aaaa-con-calend__claro|oscuro` | Decisión: campo de texto dd/mm/aaaa (teclado numérico, barras automáticas) con botón de calendario y atajos Hoy y Ayer. El calendario es un superpuesto con la grilla de 7 columnas de 40 px, el día elegido en accion, hoy con anillo accion y los días fuera de mínimo y máximo tachados y deshabilitados. Por defecto toma "hoy" del Encabezado. El selector nativo queda como respaldo si el diseño no carga. |
| P1-04 · Más acciones de una pantalla hija · menú de acciones (K2) | `componentes/P1-04-mas-acciones-de-una-pantalla-hija-menu-d__claro|oscuro` | En teléfono, el botón de tres puntos de la barra superior abre el menú anclado arriba a la derecha; en computadora, el botón "Más acciones" junto a la campana. Las acciones no disponibles se ven deshabilitadas con su motivo debajo; Eliminar va al final separado por una línea, en peligro. |
| P1-05 · Filtros que se desplazan (D3) y símbolo en la barra lateral (D4) | `componentes/P1-05-filtros-que-se-desplazan-d3-y-simbolo-en__claro|oscuro` | Los filtros del Presupuesto son una fila con desplazamiento horizontal que sangra hasta el borde del teléfono (sin barra visible); el último filtro asoma para indicar que hay más. La barra lateral de computadora usa el símbolo "F apilada" sobre marca en lugar de la letra. |

## 6 · Decisiones y notas (para revisar)

- **Textos propuestos.** Cuando la ficha no trae el texto, se escribió uno en voseo siguiendo el tono de A.7. Ejemplos: títulos de hallazgos ("Ritmo alto en Restaurantes"), la explicación de la coincidencia, el aviso de devolución, los textos de la plantilla que no son de FT-04 y los resúmenes de Ajustes. Los textos de error de 04/05 se usaron tal cual: `linea_sin_destino`, `movimiento_estado_no_valido`, `transaccion_con_eventos`, `devolucion_mayor_que_linea`, `cuenta_con_saldo`, `cuenta_con_movimientos`, `periodo_cerrado`, `conflicto_desactualizado`, `formato_no_reconocido`, `fusion_destino_archivado`, `monto_mayor_que_disponible`, `desglose_no_cuadra`, los de §9.7 de acceso, "Esto ya no existe." y "No hay movimientos en estos períodos".
- **Revisar movimiento en computadora** es el panel derecho de la Bandeja, con flechas anterior/siguiente y cerrar. En los estados que no salen de la lista (ya aprobado, ya descartado, pago, devolución) no hay fila resaltada.
- **Flujos cortos y largos.** Los cortos van en hoja inferior en el teléfono y en panel lateral de 440 px sobre velo en la computadora; los largos van a pantalla completa con "Cerrar" y el pie fijo. Se trató como corto: pagar tarjeta, cuota, verificar saldo, archivar/eliminar, ordenar, asignar, mover, auto-asignar, sacar, estado bancario, eliminar, eliminar evento, cobrar, condonar, renombrar, metas, reglas, ocurrencias y los tipos de Registrar. Como largo: revisar, editar, devolver, nueva cuenta, editar cuenta, condiciones, conciliar CSV, estructura, plantilla, archivar y fusionar categoría, y editar programada.
- **Eliminar** va en el botón `peligro` y siempre muestra el efecto antes de confirmar. Fusionar también usa `peligro` porque no se puede deshacer.
- **Ordenar** tiene asa para arrastrar y además flechas de subir y bajar, para no obligar a un gesto.
- **Reportes en el teléfono** marcan Presupuesto en la barra inferior, igual que Gasto semanal en la entrega 1 (Reportes no tiene pestaña propia).
- **El código QR** de la inscripción es una ilustración; el real lo genera la app.
- **El canvas no se actualizó**: esta entrega es la exportación. Si querés, se suben los tableros nuevos al canvas en otra pasada.

