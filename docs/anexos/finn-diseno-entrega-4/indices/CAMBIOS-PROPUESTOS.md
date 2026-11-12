# Cambios propuestos a 04, 05 y 06 · sin aplicar

Borradores para que el dueño los apruebe y se apliquen en los documentos. Ninguno está aplicado. Vienen de las decisiones del diseño de la entrega 4 y de las respuestas del dueño del 11/11/2026. Al aplicarlos, cada uno lleva la marca que corresponda en el documento.

## CH-E5-1 · 06 FT-60: navegación entre reportes

**Origen.** E5-1, aprobado con condición por el dueño (11/11/2026).

**Dice hoy** (FT-60, Flujo, paso 4): «Navegación entre reportes con `Pestanas` como enlaces (05 §10.7).» Y en Piezas, Componentes: «… `Pestanas`, …».

**Pasa a decir:**
- Paso 4: «Navegación entre reportes con `SelectorReportes` (05 §10.7): los tipos agrupados en Tu dinero, Tu presupuesto y Hábitos y tarjetas. Cada opción es un enlace a `/reportes/[tipo]` con `aria-current` en el actual; «atrás» del navegador vuelve al reporte anterior. En el teléfono, el selector abre una hoja; desde 1024 px, la lista está siempre a la vista a la izquierda del reporte.»
- Piezas, Componentes: `Pestanas` se reemplaza por `SelectorReportes`.

**Por qué.** Con 15 tipos (los 8 de 05 §2.10 y los 7 de la Fase 6), las pestañas no entran ni en 1440 px. Lo que pedía el paso 4 (enlaces con URL y «atrás») se conserva.

**Alternativas descartadas.** Pestañas con desplazamiento horizontal, porque con 15 no se encuentra nada. Un `<select>` nativo, porque no muestra grupos y su opción no es un enlace.

## CH-E5-2 · 05 §10.7: componente `SelectorReportes`

**Origen.** E5-1.

**Agrega una fila** a la tabla de componentes base, junto a `Pestanas`:

| Componente | Props principales | Estados que debe mostrar | Requisitos fijos |
|---|---|---|---|
| `SelectorReportes` | `grupos: { etiqueta; tipos: { tipo; etiqueta; href }[] }[]`, `actual` | cerrado, abierto (teléfono), opción actual, foco | Cada opción es un **enlace** (`EnlaceFinn`) con `aria-current="page"` en el actual, nunca un `radio` ni una pestaña de ARIA. En el teléfono, el disparador es un botón con `aria-haspopup="dialog"` que abre un `Superpuesto` `desde: 'abajo'`; al elegir, navega y la hoja se cierra. Desde 1024 px, la lista es un `<nav aria-label="Reportes">` fijo de 232 px. Opciones de 48 px de alto en el teléfono y 44 en computadora |

## CH-E5-3 · 05 §1.3 y §2.11: clase de las rutas de Ajustes

**Origen.** FALTANTES `ajustes-clases-de-ruta`. El dueño decidió corregir 05 y no los dibujos (11/11/2026).

**Dice hoy** (§1.3):
```
  ajustes/webhook/                                    [C] OPT-01
  ajustes/formatos/page.tsx                           [L] lista de formatos bancarios
  ajustes/instituciones/page.tsx                      [L] lista de instituciones
```

**Pasa a decir:**
```
  ajustes/webhook/page.tsx                            [S] estado de la conexión de los SMS
  ajustes/webhook/token/                              [C] OPT-01 (generar un token nuevo)
  ajustes/formatos/page.tsx                           [S] lista de formatos bancarios
  ajustes/instituciones/page.tsx                      [S] lista de instituciones
```
`ajustes/formatos/nuevo/` y `ajustes/formatos/[formatoId]/` siguen [L]. `ajustes/instituciones/nueva/` y `ajustes/instituciones/[institucionId]/` siguen [C].

**En §2.11**, las filas de `/ajustes/webhook`, `/ajustes/formatos` e `/ajustes/instituciones` cambian de clase a [S]:
- `/ajustes/webhook` [S]: muestra el estado de la conexión y el último SMS. No muestra ningún sufijo del token (04 §8.8 guarda solo el SHA-256).
- `/ajustes/webhook/token` [C]: es OPT-01, se abre con la advertencia y el botón de peligro. El token nuevo se muestra **una sola vez**, con «Copiar», y nunca se guarda en el borrador ni en el cliente después de cerrar el flujo. El texto pasa de la fila de webhook a esta.

**Por qué.** Las tres son páginas de consulta hijas de Ajustes: llevan «←», campana y barra inferior, como las demás [S] de Ajustes. Los flujos son lo que se abre desde ellas. El nombre de la ruta `token/` es una propuesta.

**Alternativa descartada.** Redibujar las tres como flujos sin campana ni barra. La lista de formatos se consulta seguido y no es un trámite.

## CH-E5-4 · 04 §7.10: textos nuevos del catálogo del servidor

**Origen.** Textos aprobados por el dueño (11/11/2026). Van al catálogo de mensajes del servidor, no a los textos de la interfaz.

| Código | Texto |
|---|---|
| `patron_lento` | «Este patrón tarda demasiado con algunos textos: retroceso de grado {grado} (se trabó con {cadena}). Finn acepta hasta grado 2: simplificá las partes que se repiten.» |
| `patron_invalido` | «Este patrón no es una expresión regular válida: {detalle}.» |
| `banderas_no_permitidas` | «Solo se permiten las banderas i, m, s y u.» |
| `grupos_obligatorios` | «Al patrón le faltan los grupos {grupos}: siempre ultimos4 y monto, y fecha si elegís formatos de fecha.» |
| `nombre_repetido` en OPT-07 | «Ya hay una institución llamada {nombre}.» El código se mantiene; el texto depende de la operación, como ya pasa con los textos por operación del catálogo. Alternativa: un código nuevo `institucion_repetida` |

`{cadena}` se recorta a 40 caracteres y describe la repetición (««en» seguido de 2,000 espacios»), no la cadena literal.
