# Finn 2.0 · exportación del diseño · entrega 4 · etapa 5 · Reportes y Ajustes

Fecha: 11/11/2026. Diseña los ítems 14, 15, 16, 19 y 25 de `docs/auditoria-diseno/PROMPT-DISENO.md` y la tabla de Gasto semanal de `heredados-menores`. El dueño dejó las decisiones a criterio del diseño; se tomaron las recomendaciones que se le presentaron. Las decisiones están en `DECISIONES.md`, sección «Entrega 4 · etapa 5» (E5-1 a E5-22), con su justificación, las alternativas descartadas, los textos nuevos propuestos y lo que sustituyen.

Esta etapa se suma a las etapas 1 a 4: el paquete trae solo lo nuevo y lo corregido.

## 1 · Qué hay

145 HTML (con `data-rol` y `var(--token)`) y sus 145 PNG (teléfono a 2×, computadora a 1×, con «reducir movimiento»).

**Estados nuevos** (cada uno en `__telefono-claro`, `__telefono-oscuro` y `__computadora-claro`):

| Carpeta | Estados |
|---|---|
| `pantallas/04-reportes` | `selector-de-tipos` (en computadora, Ritmo con su lista),  `filtro-de-cuentas`, `ritmo`, `realidad`, `hormiga`, `hormiga-vacio`, `suscripciones`, `suscripciones-sin-historia`, `tarjetas`, `flujo-efectivo`, `flujo-efectivo-una-cuenta`, `remanente`, `cumplimiento`, `patrimonio`, `patrimonio-tabla` |
| `pantallas/11-ajustes` | `indice-instalar`, `indice-instalar-iphone` (solo teléfono), `notificaciones-sin-pedir`, `notificaciones-denegado`, `notificaciones-iphone-sin-instalar` (solo teléfono), `conectar-sms-cambiar-token`, `conectar-sms-token-nuevo`, `diagnostico-sin-eventos`, `diagnostico-sin-resultados`, `respaldo-sin-respaldo`, `formato-nuevo`, `formato-editar`, `formato-prueba-falla`, `formato-patron-lento`, `formatos-guardado`, `instituciones`, `institucion-nueva`, `institucion-nombre-repetido`, `institucion-renombrar` |
| `pantallas/S1-inicio` | `activar-notificaciones` |

**Correcciones de referencias aprobadas** (mismo nombre de archivo; sustituyen al anterior):
- `04-reportes`: los 8 estados de la entrega 2 con el selector de reportes, los filtros, la barra inferior sin ítem activo y, en computadora, la fila activa de la barra lateral y los gráficos sin estirar (E5-1 a E5-4, E5-8, E5-9); `tendencia`, `tendencia-tabla`, `ingresos-gastos` y `categorias` con la ventana de períodos cerrados (E5-21); `hallazgos` rehecho con los datos de esta etapa (E5-22).
- `11-ajustes/conectar-sms`: sin el sufijo del token ni «Copiar» (E5-18).
- `S7-semanal`: los 5 estados, con la barra inferior sin ítem activo, el período anterior y el siguiente como enlaces y la muestra de color con token; en el teléfono, `vista-de-tabla` con el patrón de tabla ancha (E5-4, E5-8, E5-9).

Cada estado parte de una referencia aprobada y cambia solo lo que cambia el estado: Reportes y Ajustes, de la entrega 2; el índice de Ajustes, de la entrega 3 («Salir» a la vista); Inicio y Gasto semanal, de la etapa 1; el marco de flujo largo de Formato, de Programadas › Editar (etapa 4).

Otros archivos:
- `DECISIONES.md`: sección «Entrega 4 · etapa 5», con la tabla de textos nuevos propuestos.
- `FALTANTES.md`: lo de esta etapa marcado como diseñado y once filas nuevas: cuatro para decidir (`textos-ajustes`, `d1-formatos`, `reportes-pestanas`, `ajustes-clases-de-ruta`), un criterio para desarrollo (`reprocesar-conteo`), cinco para la etapa 6 (`propuestas-deshacer`, `categorias-dona`, `tendencia-datos`, `filtros-reportes`, más Reportes en `filtros-enlaces`) y `formato-historial`, solo si el dueño lo pide.
- `prompt/etapa-5.md`: la semilla de criterios (CA-E5-1 a CA-E5-23) para el PROMPT-DESARROLLO único del cierre.
- `herramientas/`: generadores (`lib5.py`, `gen_reportes.py`, `gen_reportes2.py`, `gen_ajustes.py`, `gen_s7.py`, `post3.py`, más los de las etapas anteriores), `renderizar.py`, `contraste_dom.py`, `barra_lateral3.py` y el armador de tableros con su `spec5.json` y `colocar5.py`.

## 1b · Para aprobar

1. **Textos nuevos** de `patron_lento`, `patron_invalido`, `banderas_no_permitidas`, `grupos_obligatorios` y `nombre_repetido` de una institución (DECISIONES, tabla de textos; FALTANTES `textos-ajustes`).
2. **E5-11**: Formato nuevo y editar en dos columnas en computadora, que extiende D-1 (FALTANTES `d1-formatos`).
3. **E5-1**: el selector de reportes cambia la navegación con pestañas de 06 FT-60 y 05 §10.7 (FALTANTES `reportes-pestanas`).
4. **Contradicción de 05 §2.11**: Conectar los SMS, Formatos e Instituciones son flujos en la tabla de rutas y secciones en los tableros (FALTANTES `ajustes-clases-de-ruta`).

## 2 · Componentes

Piezas nuevas, todas con tokens:
- **Selector de reportes**: botón ancho con el grupo y el nombre que abre una hoja agrupada; en computadora, lista fija de 232 px con la marca de 3 px (E5-1).
- **Botón desplegable de filtro** («Cuentas · Todas ▾», `aria-haspopup="dialog"`) y la hoja de casillas de 48 px (E5-2).
- **Segmentado compacto** de Períodos con nombres accesibles completos (E5-3).
- **Tabla ancha**: primera columna fija, `region` con `tabindex`, degradado del borde y «Desplazá para ver más columnas.» (E5-4).
- **Cifra del reporte** (`cifra-principal` y su frase) (E5-5).
- **Casilla** de 48 px con caja de 22 px e **interruptor**: botón `role="switch"` de toda la fila (48 px), nombrado por su texto y descrito por su ayuda (E5-10).
- **Área de texto del patrón** de 4 líneas y la **tabla de grupos capturados**, con el grupo que falló marcado (E5-10, CA-73.3).
- **Tarjeta de invitación** con ícono en `--accion-tonal` (instalar y activar notificaciones) (E5-15, E5-17).
- **Lista de pasos** numerada dentro de un aviso (E5-16, E5-17).

Se usan además: hoja y panel lateral de 440 px, aviso en línea, resultado en el lugar, vacío punteado, SelectorPeriodo con enlaces (E4-10), chips de estado y la marca «Deuda sin reservar».

## 3 · Movimiento

Sin movimiento nuevo. Las hojas y el panel entran como en la referencia (`fz-sh-in`); el resultado, con `fz-pop-in`. Con «reducir movimiento» no se anima nada.

## 4 · Contraste de los pares nuevos

Medido con los valores de `tokens.css`, en claro y en oscuro. Además se midió cada texto renderizado contra su fondo real en los 145 archivos (`herramientas/contraste_dom.py`): todo pasa. Ningún valor suelto nuevo (hex, rgb o ms) frente a las referencias aprobadas.

| Qué | Par | Claro | Oscuro | Mínimo | |
|---|---|---|---|---|---|
| Avisos de advertencia: título y enlace | `advertencia-texto` sobre `advertencia-fondo` | 5.40:1 | 8.62:1 | 4.5:1 | ✓ |
| Avisos de advertencia: pasos | `texto` sobre `advertencia-fondo` | 16.29:1 | 12.64:1 | 4.5:1 | ✓ |
| Aviso de información: título | `informacion-texto` sobre `informacion-fondo` | 6.07:1 | 7.67:1 | 4.5:1 | ✓ |
| Aviso de información: pasos | `texto` sobre `informacion-fondo` | 15.85:1 | 13.02:1 | 4.5:1 | ✓ |
| «Generar un token nuevo» | `texto-sobre-peligro` sobre `peligro` | 6.57:1 | 7.51:1 | 4.5:1 | ✓ |
| Botones tonales y fila elegida | `accion` sobre `accion-tonal` | 6.02:1 | 5.37:1 | 4.5:1 | ✓ |
| Error del patrón y del nombre | `problema-texto` sobre `superficie` | 5.56:1 | 7.48:1 | 4.5:1 | ✓ |
| Borde del campo con error | `problema-borde` sobre `superficie` | 4.46:1 | 5.43:1 | 3:1 | ✓ |
| «Verlos en la Bandeja», «Ver N cuentas» | `enlace` sobre `superficie` | 7.29:1 | 6.20:1 | 4.5:1 | ✓ |
| «El formato reconoce este SMS» | `positivo-texto` sobre `superficie` | 6.40:1 | 9.27:1 | 4.5:1 | ✓ |
| Cifra de Tarjetas | `deuda-sin-respaldo-texto` sobre `fondo` | 6.56:1 | 7.91:1 | 4.5:1 | ✓ |
| Texto del SMS de prueba | `texto` sobre `superficie-hundida` | 15.12:1 | 17.19:1 | 4.5:1 | ✓ |
| «Desplazá para ver más columnas.» | `texto-secundario` sobre `fondo`/`superficie` | 8.40:1 | 8.45:1 | 4.5:1 | ✓ |
| Casilla y vacío punteado | `borde-control` sobre `fondo` | 3.70:1 | 4.46:1 | 3:1 | ✓ |
| Interruptor encendido, marca activa | `accion` sobre `superficie` | 7.29:1 | 6.20:1 | 3:1 | ✓ |

## 5 · Canvas

Tableros nuevos al final de su fila: en «Actividad y Reportes», E4-E5-Reportes-Marco (a, b), E4-E5-Reportes-Presupuesto, E4-E5-Reportes-Dinero y E4-E5-Reportes-Habitos (a, b); en «Más secciones y Ajustes», E4-E5-Formatos (a, b), E4-E5-Instituciones-y-SMS (a, b) y E4-E5-Instalar-y-Notificaciones (a, b). No se movió nada a Historial: 5 notas naranjas dicen qué parte de cada tablero anterior sustituye, corrige o completa esta etapa (E2-04 Reportes, E2-11 Ajustes, E4-S7 Semanal, E4-S1 Inicio y E3-02 Ajustes y Seguridad).

## 6 · Demo

La demo navegable se actualiza al cierre, con todas las etapas juntas (lo acordado).

## 7 · Revisión independiente

Un agente que no participó revisó la etapa completa (PNG, HTML, DECISIONES, FALTANTES y el INDICE, contra 04, 05, 06 y las referencias). Encontró 3 bloqueantes, 19 importantes y 20 menores; esto es lo que se hizo.

| Hallazgo | Qué se hizo |
|---|---|
| **Bloqueante.** «Últimos n» incluía el período activo (CA-60.4) en Tendencia, Ingresos y gastos, Categorías, Lo que te quedó, Patrimonio y Tarjetas | Las mismas cifras pasan a los 6 períodos cerrados (abr–sep), sin el activo marcado; cada frase dice su período (E5-21) |
| **Bloqueante.** Hallazgos (entrega 2) con tipos y textos que 06 no tiene | Rehecho con los hallazgos de esta etapa, una fila por clave, por impacto, con el texto del servidor (E5-22) |
| **Bloqueante.** Lo que te quedó e Ingresos y gastos con cifras distintas para la misma fórmula | Lo que te quedó del último cerrado = $289.40, igual que Ingresos y gastos; la cifra es el `acumulado` del servidor |
| Textos de hallazgos reescritos por la interfaz (Ritmo, Realidad, Tarjetas, Suscripciones, Hormiga); comparación inventada en Hormiga | El texto de 06 tal cual, sin título agregado (E5-22) |
| Promedios y totales calculados en la interfaz (PF-3) | Fuera; cada cifra es un campo del DTO (E5-5). Los de Tendencia y Comercios heredados, a `tendencia-datos` |
| Pegar un SMS para probar e historial del formato, que 04 no ofrece | Fuera (E5-10); el historial queda en `formato-historial` por si el dueño lo pide |
| Sufijo y «Copiar» del token, que 04 §8.8 no guarda; token de 23 caracteres | Sin sufijo ni «Copiar»; token de 43 caracteres; `conectar-sms` corregido (E5-18) |
| Clases de ruta de 05 §2.11 para Conectar los SMS, Formatos e Instituciones; Pestañas de FT-60 | Anotadas para decidir (`ajustes-clases-de-ruta`, `reportes-pestanas`) |
| Períodos como botones | A `filtros-enlaces`, etapa 6 |
| Filtro de cuentas de Flujo con tarjetas | Solo cuentas de efectivo (06 §3.3) |
| «Se pasó» en una columna fuera de la vista | Debajo del nombre; Gasolina con «Deuda sin reservar» |
| `selector-de-tipos` vacío en computadora | Es Ritmo con su lista (en computadora no hay estado abierto) |
| S7 con Presupuesto activo y período con botones | Los 5 estados con la barra sin ítem activo y enlaces; muestra de color con token |
| Interruptor sin nombre y de 26 px | Botón `role="switch"` de toda la fila, nombrado y descrito |
| Botón «Activar» de Inicio | «Activar notificaciones» (CA-06.1, CA-06.2) |
| Suscripciones mezcladas | «Detectadas» y «Ya programadas» con «Revisar» (3.5.9) |
| Textos de 06 sin usar | «Pagado o acreditado a tiempo», la explicación de Flujo, títulos «Suscripciones» y «Tarjetas» |
| Estados faltantes | `formato-prueba-falla` dibujado (CA-73.3); propuestas con «Deshacer», «Ajustar a $X» y «Reactivarla» a `propuestas-deshacer`, etapa 6 |
| Dona de Categorías con 5 porciones | A `categorias-dona`, etapa 6 |
| Diálogos con `aria-label`, tablas con el mismo nombre, `role=status` en contenido fijo, ayudas sin enlazar | `aria-labelledby` al título; cada tabla nombrada por su sección; sin `role=status` fijo; ayudas del interruptor y de las fechas enlazadas |
| Gráficos a 800 px, patrón lento distinto del de editar, estados de iPhone en computadora, Promerica sin cuenta en el filtro, frase de Flujo equivocada, Ritmo sin todas las categorías, comentario «etapa 4» | Máximo 720 px; mismo patrón con `\s+`; iPhone solo en teléfono; «sin cuentas»; frase corregida; Internet y teléfono y Viaje en la tabla (el sobrante cierra en $1,546.64); comentario «etapa 5» |
| Tocables chicos heredados, datos cruzados de Ajustes, filtros `?grupo=` y `?limite=` | A `heredados-menores`, `datos-ejemplo` y `filtros-reportes` |

Después de los cambios: los 145 archivos se volvieron a renderizar, el contraste pasa en todos, no hay valores sueltos nuevos y todo `aria-*` y `for` apunta a un id que existe.
