# Auditoría de diseño · INI (Inicio) y PRE (Presupuesto, Listo para asignar, flujos, estructura y plantilla)

Servidor local en `http://localhost:3100`, semilla A.7 (`escenarioA7()`, hoy 2026-10-15) salvo donde se indica la semilla de las E2E. Archivo de casos: `tools/auditoria/casos/20-ini-pre.cap.ts` (53 casos nuevos × 3 variantes; `inicio__principal` y `presupuesto__principal` los captura `00-humo.cap.ts`). Capturas en `docs/auditoria-diseno/capturas/<id>__<variante>.png` (y `capturas/pliegue/`), análisis en `docs/auditoria-diseno/analisis/<id>.md`.

Notas de método:
- En las capturas completas de teléfono la barra inferior a veces queda cruzada a media altura (artefacto del arnés al estirar la ventana): no es un hallazgo. Para esas pantallas se miró `capturas/pliegue/`.
- Las diferencias de datos (montos, nombres de grupos, «Sin comercio», sin notificaciones sembradas, contadores de la campana y de Bandeja) no se reportan. La semilla A.7 deja todas las categorías en un solo grupo «Gastos»; la referencia tiene Casa, Comida fuera, etc.
- Referencias con `docs/diseno/` como raíz: `E1` = `02-referencias/entrega-1/pantallas`, `E2` = `02-referencias/entrega-2/pantallas`, `T` = `02-referencias/tableros`.
- Se verificaron los cinco datos medidos por el orquestador: (a) confirmado (INI-01); (b) confirmado (INI-02); (c) confirmado y ampliado (INI-03, INI-05, INI-06); (d) confirmado (INI-08); (e) confirmado (INI-09).

## Inventario

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| `inicio__principal` | `/` | `app/(finn)/page.tsx` → `pantalla-inicio.tsx` | `E1/S1-Inicio__telefono-claro` | INI-01, INI-02, INI-03, INI-04, INI-05, INI-06, INI-07, INI-08, INI-09, INI-12 |
| `inicio__al-dia` | `/` | `pantalla-inicio.tsx`, `inicio-secciones.tsx` | `E1/S1-Inicio__todo-al-dia` | INI-10 |
| `inicio__lpa-negativo` | `/` | `billete.tsx` | `E1/S1-Inicio__listo-para-asignar-negativo` | INI-05, INI-11 |
| `inicio__lpa-cero` | `/` | `billete.tsx` | `E1/S1-Inicio__todo-al-dia` (sin PNG propio de cero con atención) | INI-05 |
| `inicio__primer-uso` / `inicio__primeros-pasos-sin-cuentas` | `/` | `primeros-pasos.tsx` | `E2/15-…/primeros-pasos-sin-cuentas` y `E1/S1-Inicio__primer-uso-sin-cuentas` | INI-16 y nota de contradicción en «Sin diseño» |
| `inicio__primeros-pasos` | `/` | `primeros-pasos.tsx` | `E2/15-…/primeros-pasos` | bien |
| `inicio__primeros-pasos-ocultos` | `/` | `primeros-pasos.tsx` | `E2/15-…/primeros-pasos` (sin PNG del estado oculto) | bien |
| `inicio__ritmo` | `/` | `reportes/[tipo]/ritmo-hallazgos.tsx` | `E2/15-…/ritmo-y-tarjetas` | INI-03, INI-04 |
| `inicio__pagos-tarjeta-proximos` | `/` | `pantalla-inicio.tsx`, `reserva-excedente.tsx` | `E2/15-…/ritmo-y-tarjetas` | INI-07 |
| `inicio__cargando` | `/` (navegación retenida) | `app/(finn)/loading.tsx` | `entrega-1/componentes/K2-Base__esqueleto-de-carga` | INI-13, INI-14 |
| `inicio__error` | `/` (`error.tsx`, forzado con `/pruebas/estados/error`) | `app/(finn)/error.tsx` → `error-de-pantalla.tsx` | `E2/14-…/error-de-pantalla` | INI-14, INI-15 |
| `inicio__asignar-boton` | `/` → `/presupuesto?filtro=sin-fondos` | `pantalla-inicio.tsx` | PANTALLAS §2.8 y §11 | INI-02 |
| `inicio__activar-notificaciones` | `/` | `componentes/marco/tarjeta-notificaciones.tsx` | SIN DISEÑO (FALTANTES `permiso-push`) | ver «Sin diseño» |
| `presupuesto__principal` | `/presupuesto` | `presupuesto/pantalla.tsx` | `E1/S2-Presupuesto__telefono-claro` | INI-01, PRE-01, PRE-08, PRE-11, PRE-12, PRE-13, PRE-15, PRE-16, PRE-17 |
| `presupuesto__sobregiradas` | `/presupuesto?filtro=sobregiradas` | `pantalla.tsx` | `E1/S2-Presupuesto__filtro-sobregiradas` | PRE-01 |
| `presupuesto__sin-fondos` | `?filtro=sin-fondos` | `pantalla.tsx` | sin PNG propio (`filtro-sobregiradas` como patrón) | PRE-01 |
| `presupuesto__cubiertas` | `?filtro=cubiertas` | `pantalla.tsx`, `base/pastillas.tsx` | `E2/D3-…/cubiertas` | PRE-01, PRE-02 |
| `presupuesto__filtros-desplazados` | `/presupuesto` | `base/pastillas.tsx` | `E2/D3-…/todas` | PRE-02 (la fila sí sangra y se desplaza: ancho 390, contenido 479) |
| `presupuesto__sin-resultados` | `?filtro=sobregiradas` sin sobregiradas | `base/vacio.tsx` | `E1/S2-Presupuesto__sin-resultados` | PRE-03 |
| `presupuesto__periodo-cerrado` | `?periodo=2026-08-21` | `pantalla.tsx`, `selector-periodo.tsx`, `fila-categoria.tsx` | `E1/S2-Presupuesto__periodo-cerrado` | PRE-05, PRE-07 |
| `presupuesto__periodo-futuro` | `?periodo=2026-10-21` | `pantalla.tsx`, `selector-periodo.tsx` | `E1/S2-Presupuesto__periodo-futuro` | PRE-05, PRE-06 |
| `presupuesto__lpa-negativo` | `/presupuesto` | `billete.tsx` (franja) | `E2/15-…/lpa-negativo` | PRE-09, PRE-10, PRE-11 |
| `presupuesto__herramientas` | `/presupuesto` (ESC-44) | `pantalla.tsx` | `E2/15-…/herramientas` | PRE-04, PRE-11, PRE-14 |
| `presupuesto__pago-tarjeta-excedente` | `/presupuesto` (ESC-13) | `componentes/dominio/fila-pago.tsx` | `entrega-1/componentes/K3-Dominio-A__fila-de-pago-de-tarjeta__claro` | PRE-12 (el $30.00 va en `--informacion-texto`, como pide DECISIONES: bien) |
| `presupuesto__tres-clases` | `/presupuesto` | `fila-categoria.tsx` | `E1/S2-Presupuesto__telefono-claro` | PRE-13 |
| `presupuesto__selector-periodo` | `/presupuesto?periodo=` | `selector-periodo.tsx` | `entrega-1/componentes/K4-Dominio-B__selector-de-periodo__claro` | PRE-05 |
| `lpa__principal` | `/presupuesto/listo-para-asignar` | `listo-para-asignar/pantalla.tsx` | `E2/05-…/principal` | PRE-20, PRE-21, PRE-22, PRE-23, PRE-24 |
| `lpa__tabla` | idem | idem | `E2/05-…/tabla` | PRE-22 |
| `lpa__negativo` | idem (LPA −$86.15) | idem | `E2/05-…/negativo` | PRE-20 |
| `asignar__principal` | hoja desde «Asignar a …» | `flujos/presupuesto-asignar-categoria/formulario.tsx`, `rapida.tsx` | `E2/07-…/asignar` | PRE-30, PRE-31, PRE-32, PRE-33, PRE-34 |
| `asignar__cubrir` | hoja de una sobregirada | `rapida.tsx` | `E2/07-…/asignar` | PRE-30, PRE-31 |
| `asignar__pagina-completa` | `/presupuesto/asignar/[id]` (URL directa) | `app/(finn)/presupuesto/asignar/[categoriaId]/page.tsx` | SIN DISEÑO (el diseño solo trae la hoja) | ver «Sin diseño» |
| `asignar__conflicto` | `/presupuesto/asignar/[id]` | `formulario.tsx` | `E2/07-…/asignar-conflicto` | PRE-36 |
| `asignar__periodo-cerrado` | `/presupuesto/asignar/[id]?periodo=` (redirige al detalle) | `…/page.tsx` | `E2/07-…/asignar-periodo-cerrado` | PRE-37, PRE-38 |
| `asignar__resultado` | `/presupuesto` tras guardar | `pantalla.tsx` | `E2/07-…/asignado` | PRE-35 |
| `mover__principal` | hoja desde «Mover dinero» | `flujos/presupuesto-mover/formulario.tsx` | `E2/07-…/mover-dinero` | PRE-40 |
| `mover__excede` | hoja | idem | `E2/07-…/mover-excede` | PRE-41 |
| `mover__resultado` | `/presupuesto` tras mover | `pantalla.tsx` | SIN DISEÑO del resultado | PRE-42 |
| `auto-asignar__principal` | hoja desde «Auto-asignar» | `flujos/presupuesto-auto-asignar/formulario.tsx` | `E2/07-…/auto-asignar` | PRE-50 |
| `auto-asignar__cubiertas` | hoja | idem | `E2/07-…/auto-asignar-cubiertas` | bien |
| `auto-asignar__pagina-completa` | `/presupuesto/auto-asignar` | `…/auto-asignar/page.tsx` | SIN DISEÑO (URL directa) | ver «Sin diseño» |
| `estructura__lista` | `/presupuesto/estructura` | `flujos/presupuesto-estructura/lista.tsx` | `E2/08-…/estructura` | PRE-60, PRE-61, PRE-62, PRE-63 |
| `estructura__movida` | idem tras «Bajar» | idem | `E2/08-…/estructura-movida` | PRE-65 |
| `estructura__vacia` | idem sin categorías | idem | `E2/08-…/estructura-vacia` | PRE-66 |
| `estructura__editar-categoria` | `/presupuesto/estructura/categorias/[id]` | `flujos/presupuesto-estructura/formulario.tsx` | `E2/08-…/editar-categoria` | PRE-64 |
| `estructura__nueva-categoria` | `/presupuesto/estructura/categorias/nueva` | idem | SIN DISEÑO (se usó `editar-categoria` como patrón) | PRE-64 |
| `estructura__nuevo-grupo` | `/presupuesto/estructura/grupos/nuevo` | idem | SIN DISEÑO | ver «Sin diseño» |
| `estructura__editar-grupo` | `/presupuesto/estructura/grupos/[id]` | idem | SIN DISEÑO (FALTANTES `grupo-editar`) | ver «Sin diseño» |
| `estructura__error-nombre-vacio` | grupo nuevo sin nombre | idem | SIN DISEÑO | bien (error de campo con glifo y `--problema`) |
| `plantilla__sugerida` | `/presupuesto/estructura/plantilla` | `flujos/presupuesto-estructura-plantilla/plantilla.tsx` | `E2/08-…/plantilla` | PRE-70 |
| `plantilla__vacia` | idem, todo quitado | idem | `E2/08-…/plantilla-vacia` | PRE-70, PRE-75 |
| `plantilla__creando` | idem, POST retenido | idem | `E2/08-…/plantilla-creando` | PRE-71 |
| `plantilla__cortada` | idem, 2.ª tanda cortada | idem | `E2/08-…/plantilla-cortada` | PRE-72 |
| `plantilla__resultado` | idem tras crear | idem | `E2/08-…/plantilla-resultado` | PRE-73 |

No capturado, con motivo:
- **Selector de período «Elegir otro período»** (FALTANTES `periodos`): la app no tiene pantalla ni hoja para elegirlo; solo flechas y «Ir al período actual». No hay nada que capturar.
- **Archivadas (lista propia)** (FALTANTES `archivadas`): no existe pantalla; las archivadas se ven dentro de Estructura (etiqueta «Archivada») y «Archivadas con dinero» en Presupuesto.
- **Cierre automático del período** (FALTANTES `cierre-periodo`) e **instalar** (FALTANTES `instalar`, vive en Ajustes): fuera de esta sección o sin pantalla propia.
- **Asignar en la hoja con un valor escrito** (tarjeta «Listo para asignar → …»): no se escribió un valor en la hoja; ver PRE-32.
- **Mover con atajos «Cubrir / Todo»**: no aparecen en la app (PRE-40), no hay estado que forzar.
- **Sin conexión** de estas pantallas: es transversal y lo cubre la sección de globales.

## Hallazgos

### INI-01 · «Registrar» de la barra superior es solo un «+» en teléfono — todas las pestañas · teléfono-claro, teléfono-oscuro · alta
- **Se ve:** `capturas/inicio__principal__telefono-claro.png` y `presupuesto__principal__telefono-claro.png`: un cuadrado azul de 44 × 44 con «+» y sin texto (medida: `medidas/presupuesto__principal__telefono-claro.json`, tocable «Registrar» 44 × 44). La clase `max-[25rem]:sr-only` oculta el texto a 390 px.
- **Debería:** botón «+ Registrar» con texto, alto 44, padding 0 14 0 10, `.t-etiqueta` 700 (PANTALLAS §3.1; `T/S1-Inicio__telefono-claro.png`, `T/S2-Presupuesto__telefono-claro.png`, `E2/D3-…/todas__telefono-claro.png`). El título largo se corta con puntos suspensivos («PRESUPUES…») para dejarle lugar.
- **Arreglo:** en `apps/web/src/componentes/navegacion/acceso-registrar.tsx` quitar `max-[25rem]:sr-only`, `max-[25rem]:w-11` y `max-[25rem]:p-0` de la variante `barra`, y dejar que el título de `titulo-pantalla` trunque (`truncate`, `min-w-0`) en `componentes/marco/marco.tsx`.
- **Cómo verificar:** a 390 px la barra de Inicio y Presupuesto muestra «+ Registrar» (texto visible, 44 de alto) y el título trunca con «…» sin empujarlo fuera.

### INI-02 · «Asignar $312.40» de Inicio navega a Presupuesto en lugar de abrir la hoja Asignar — Inicio · todas · alta
- **Se ve:** `capturas/inicio__asignar-boton__telefono-claro.png`; nota `medidas/_nota__inicio__asignar-boton__telefono-claro.txt`: `url=http://localhost:3100/presupuesto?filtro=sin-fondos dialogo=0`. Es un enlace (`botonLpa` en `pantalla-inicio.tsx`).
- **Debería:** «Asignar $312.40 (abre la hoja Asignar)» (PANTALLAS §2.8 y §11: «Asignar, Más secciones → Hoja inferior»; `T/S1-Inicio__telefono-claro.png`). Con LPA negativo, «Quitar $86.15 de una categoría».
- **Arreglo:** el botón debe abrir un flujo corto de Asignar sin categoría elegida (hoja en teléfono, panel de 440 en computadora) o, si no se quiere ese flujo, decidirlo en DECISIONES. Hoy el código lo resuelve con CA-08.11/P6-26 de los documentos de la app, que contradicen PANTALLAS §2.8. **Contradicción para un CH**: PANTALLAS §2.8 («abre la hoja Asignar») frente a CA-08.11 («lleva a las categorías sin fondos»). Archivos: `apps/web/src/app/(finn)/page.tsx` (`haySinFondos`), `pantalla-inicio.tsx` (`botonLpa`), `componentes/dominio/billete.tsx`.
- **Cómo verificar:** tocar el botón no cambia la URL y abre un `role="dialog"` con la hoja Asignar; con LPA negativo el botón dice «Quitar $X de una categoría».

### INI-03 · Hallazgos de ritmo como tarjetas de problema con botón tonal; la referencia usa un aviso de advertencia — Inicio · teléfono, computadora · alta
- **Se ve:** `capturas/inicio__ritmo__telefono-claro.png`, `inicio__principal__telefono-claro.png` y `inicio__principal__computadora-claro.png`: en «Necesita tu atención», un bloque grande `--problema-fondo`/`--deuda-sin-respaldo-fondo` por hallazgo, con glifo de problema, frase «Ya te pasaste $26.30 en Restaurantes…» y un botón tonal «Asignar $55.56» (alto ≈ 44, ancho ≈ 100). `HallazgosRitmo` pasa `estado={h.estado}` (problema) a `AvisoEnLinea`.
- **Debería:** aviso en línea de **advertencia** (`--advertencia-fondo`, triángulo) con título «Ritmo alto en Restaurantes», texto y una acción de enlace subrayada «Mover dinero» (PANTALLAS §2.14; `E2/15-…/ritmo-y-tarjetas__telefono-claro.png`). Un aviso de problema donde va una advertencia es error.
- **Arreglo:** en `apps/web/src/app/(finn)/reportes/[tipo]/ritmo-hallazgos.tsx` usar `estado="advertencia"` para los hallazgos de ritmo (reservar «problema» para algo ya consumado), título propio y acción como enlace (`AvisoEnLinea` acepta `accion`); mover la acción «Asignar $X» a la fila de detalle o a «Mover dinero».
- **Cómo verificar:** con la semilla de ritmo (`inicio__ritmo`) cada hallazgo es un aviso amarillo con título «Ritmo alto en X» y un enlace «Mover dinero»; no hay botón tonal dentro del aviso.

### INI-04 · Texto y título de los hallazgos de ritmo distintos a la referencia — Inicio · todas · baja
- **Se ve:** «Ya te pasaste $20.00 en Epsilon y, a este ritmo, llegarías a $167.00 el 20/02.» y «Vas camino a pasarte $105.00 en Gama antes del 20/02.» (`capturas/inicio__ritmo__telefono-claro.png`; `apps/web/src/textos/inicio.ts` líneas 50-52). Sin título.
- **Debería:** «Ritmo alto en Restaurantes» + «Llevás $110.30 de $120.00 en Restaurantes y quedan 5 días. A este ritmo cerrás con −$26.30.» (`E2/15-…/ritmo-y-tarjetas__telefono-claro.png`; los textos son «propuestos» según INDICE-entrega-2 §6).
- **Arreglo:** `apps/web/src/textos/inicio.ts`: título y frase de la referencia, con U+2212 en el negativo.
- **Cómo verificar:** el texto coincide con el de la referencia y el monto negativo usa «−».

### INI-05 · Las filas de «Necesita tu atención» no muestran el monto — Inicio · todas · alta
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`, `inicio__lpa-negativo__telefono-claro.png`, `inicio__lpa-cero__telefono-claro.png`: Restaurantes «Sobregiro con débito o efectivo» y Gasolina «Deuda sin reservar» son un `<details>` con chevrón y sin monto; el monto (−$26.30) solo aparece al desplegar. Código: `Sobregiro` en `pantalla-inicio.tsx` («Los sobregiros se ven sin monto (PF-2)»).
- **Debería:** fila de 68 con círculo de 36, nombre, etiqueta del estado, monto `.t-cifra` en el color del estado (−$26.30, $18.75) y chevrón, que enlaza al detalle de la categoría (PANTALLAS §4 punto 2; `T/S1-Inicio__telefono-claro.png`). Las filas de tarjeta sí llevan monto en la app («Te falta reservar $18.75»); las de categoría no.
- **Arreglo:** `apps/web/src/app/(finn)/pantalla-inicio.tsx`: dibujar `Sobregiro` con `FilaAtencion` y `monto` (en `-s.total` con U+2212) y enlace a `/presupuesto/categorias/[id]`. Si la decisión PF-2 («sin monto a la vista») es intencional, **es una contradicción con S1/PANTALLAS §4** para llevar como CH; mientras no se resuelva, el diseño manda.
- **Cómo verificar:** Restaurantes muestra «−$26.30» y Gasolina «$18.75» sin tocar nada; tocar la fila abre el detalle.

### INI-06 · Falta el enlace «Ver las N →» en el encabezado de «Necesita tu atención» — Inicio · todas · media
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`: el título «NECESITA TU ATENCIÓN» está solo (`Seccion` de `pantalla-inicio.tsx` no lleva enlace).
- **Debería:** «Ver las 6 →» a la derecha, hacia Presupuesto filtrado por sobregiradas (PANTALLAS §4; `T/S1-Inicio__telefono-claro.png`).
- **Arreglo:** `pantalla-inicio.tsx`: `Seccion` con `enlace={{ href: '/presupuesto?filtro=sobregiradas', texto: t.verLas(n) }}` y el texto en `textos/inicio.ts`.
- **Cómo verificar:** el encabezado muestra «Ver las N →» con N igual a la cantidad de filas y lleva a `/presupuesto?filtro=sobregiradas`.

### INI-07 · Los pagos de tarjeta próximos van dentro de «Necesita tu atención»; la referencia tiene sección propia con insignia de fecha — Inicio · todas · alta
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`: fila «Visa Oro · Se paga el 15/10 · $370.63» en estado advertencia, mezclada con las de sobregiro; sin insignia de fecha ni segunda tarjeta («Nada que pagar»).
- **Debería:** sección «Pagos de tarjeta próximos» con cada tarjeta como fila de insignia de fecha (NOV 15), «Pago 15/11 · para no generar intereses $512.40» y el indicador «Te falta reservar $18.75» o «Nada que pagar» (`E2/15-…/ritmo-y-tarjetas__telefono-claro.png`, `…__computadora-claro.png`; INDICE-entrega-2 §15).
- **Arreglo:** `pantalla-inicio.tsx`: sacar `a.pagosTarjetaProximos` de la lista de atención y dibujarlos en una `Seccion` nueva con `InsigniaDeFecha` (`componentes/dominio/insignia-fecha.tsx`) y `IndicadorEstado`.
- **Cómo verificar:** `inicio__pagos-tarjeta-proximos` muestra la sección «Pagos de tarjeta próximos» con insignia de fecha y el indicador de estado por tarjeta.

### INI-08 · Las filas de Recientes no llevan insignia de fecha y el subtítulo es el estado bancario — Inicio · todas · media
- **Se ve:** `capturas/inicio__principal__telefono-claro.png`: «Sin comercio / Pendiente» + monto; código `FilaTransaccion` compacta (`componentes/dominio/fila-transaccion.tsx`, columnas sin insignia; subtítulo `dominio.estadoBancario`). («Sin comercio» es dato de la semilla.)
- **Debería:** columnas `[48][1fr][auto]` con insignia de fecha (OCT 15), título 600, subtítulo con la cuenta («Visa Oro») y monto `.t-cifra`, ingresos en `--positivo-texto` con «+» (PANTALLAS §2.16 y §4 punto 4; `T/S1-Inicio__telefono-claro.png`).
- **Arreglo:** `fila-transaccion.tsx`: variante compacta con `InsigniaDeFecha`, cuenta como subtítulo y «+» en ingresos; el DTO ya trae fecha y cuenta de la transacción.
- **Cómo verificar:** cada fila de Recientes tiene insignia «OCT 15», la cuenta debajo del título y «+$925.00» en el ingreso.

### INI-09 · Dice «Patrimonio» y la referencia «Patrimonio neto» — Inicio · todas · baja
- **Se ve:** «Patrimonio» (`capturas/inicio__principal__telefono-claro.png`; `apps/web/src/textos/glosario.ts` línea 24).
- **Debería:** «Patrimonio neto» (PANTALLAS §4 punto 5; `T/S1-Inicio__telefono-claro.png`).
- **Arreglo:** `glosario.patrimonio` → «Patrimonio neto», revisando dónde más se usa el glosario.
- **Cómo verificar:** la fila dice «Patrimonio neto».

### INI-10 · «Todo al día»: el título no usa Big Shoulders — Inicio · todas · media
- **Se ve:** `capturas/pliegue/inicio__al-dia__telefono-claro.png`: «Todo al día» en Archivo 700 (título de `AvisoEnLinea`).
- **Debería:** título en `titulo-seccion` (Big Shoulders, mayúsculas, color de estado), con el glifo grande de 24 (`T/S1-Inicio__todo-al-dia.png`).
- **Arreglo:** `inicio-secciones.tsx` (`TodoAlDia`): variante grande de `componentes/base/aviso.tsx` con rol `titulo-seccion`.
- **Cómo verificar:** el título aparece en la fuente de títulos, en `--positivo-texto`.

### INI-11 · Indicador «Asignaste más de lo que tenés» en blanco; la referencia lo pinta con el color del estado — Inicio y Presupuesto · todas · baja
- **Se ve:** `capturas/inicio__lpa-negativo__telefono-claro.png`: círculo con glifo de problema pero el texto en `--texto-sobre-marca`.
- **Debería:** etiqueta en el color de problema (`T/S1-Inicio__listo-para-asignar-negativo.png`, `E2/15-…/lpa-negativo__telefono-claro.png`).
- **Arreglo:** `componentes/dominio/indicador-estado.tsx` (`sobreMarca`): texto con el token de problema legible sobre `--marca` (comprobar contraste 4.5:1; si no llega, proponer token).
- **Cómo verificar:** la etiqueta se ve en el color de problema con contraste ≥ 4.5:1 en claro y en oscuro.

### INI-12 · El monto del billete en computadora es más chico que el de la referencia — Inicio · computadora-claro · media
- **Se ve:** `capturas/inicio__principal__computadora-claro.png`: «$312.40» ocupa ≈ 160 px de ancho en el billete (medido sobre la captura).
- **Debería:** monto de 3.75rem en computadora (PANTALLAS §4: «monto 3.75rem»), ≈ 185 px en `T/S1-Inicio__computadora-claro.png`.
- **Arreglo:** `componentes/dominio/cifras-billete.tsx`: tamaño `md:` de 3.75rem para la variante `grande` (token `cifra-heroe`).
- **Cómo verificar:** a 1440 px el texto del monto mide 3.75rem de alto de fuente.

### INI-13 · El esqueleto de carga no se parece al del diseño — todas las pantallas de `(finn)` · todas · media
- **Se ve:** `capturas/pliegue/inicio__cargando__telefono-claro.png` (loading real, navegación retenida): una pastilla de 32 px y dos bloques de 96 px con `rounded-pastilla` (cápsulas), padding lateral de 16 px (`p-4`), sin la forma de la pantalla.
- **Debería:** barras de 4 px de radio (10, 14 y 22 px de alto) y un bloque de 120 px, con 20 px laterales y sin números inventados (`entrega-1/componentes/K2-Base__esqueleto-de-carga__claro.html`; INDICE-entrega-1 «Esqueleto de carga»).
- **Arreglo:** `apps/web/src/app/(finn)/loading.tsx`: clases de radio `rounded-fino`/`rounded-control` (token `--radio-fino`) y `px-5`; replicar la estructura de bloques del K2.
- **Cómo verificar:** el esqueleto tiene 20 px de margen lateral, radios de 4 px en las barras y no usa `rounded-pastilla`.

### INI-14 · En cargando y en error la barra superior pierde el título de la pantalla — todas las pantallas de `(finn)` · teléfono · media
- **Se ve:** `capturas/pliegue/inicio__cargando__telefono-claro.png` y `inicio__error__telefono-claro.png`: la barra solo tiene Registrar, campana y ☰; el título («Inicio») no aparece (lo publica la página con `PublicarEncabezado`).
- **Debería:** el título sigue visible («PRESUPUES…» en `E2/14-…/error-de-pantalla__telefono-claro.png`).
- **Arreglo:** que `loading.tsx` y `error-de-pantalla.tsx` (`componentes/navegacion/`) publiquen el título de la sección según la ruta, o que el marco lo derive de `pathname` mientras la página no publica.
- **Cómo verificar:** durante la carga y en el error la barra muestra el nombre de la pestaña activa.

### INI-15 · Error de pantalla: icono y botón distintos a la referencia — todas las pantallas · todas · baja
- **Se ve:** `capturas/pliegue/inicio__error__telefono-claro.png`: icono `informacion` en línea con el texto, referencia «E-PRU-213», botón «Intentar de nuevo» sin icono, tarjeta con 36 de padding.
- **Debería:** icono encima del texto, botón con icono de reintento, tarjeta con 36 px de padding (`E2/14-…/error-de-pantalla__telefono-claro.png`). (La referencia «E-PRU-213» es de la ruta de prueba.)
- **Arreglo:** `apps/web/src/componentes/navegacion/error-de-pantalla.tsx`.
- **Cómo verificar:** coincide con el PNG, con el icono de reintento en el botón.

### INI-16 · Primeros pasos sin cuentas: iconos temáticos y falta la nota — Inicio · todas · baja
- **Se ve:** `capturas/pliegue/inicio__primer-uso__telefono-claro.png`: círculos con cartera, lista y mensaje; sin nota.
- **Debería:** círculos tonales con «+» y una nota neutra con `info`: «Sin cuentas, los Primeros pasos ocupan el lugar de “Necesita tu atención” y no se pueden ocultar.» (`E2/15-…/primeros-pasos-sin-cuentas__telefono-claro.png`).
- **Arreglo:** `apps/web/src/app/(finn)/primeros-pasos.tsx` y `textos/primeros-pasos.ts`.
- **Cómo verificar:** coincide con el PNG.

### INI-17 · «Ver cómo se compone» con la flecha a la derecha — Inicio y Presupuesto · todas · baja
- **Se ve:** Inicio `capturas/inicio__al-dia__telefono-claro.png`: «Ver cómo se compone ›» con chevrón a la derecha; Presupuesto: sin chevrón.
- **Debería:** chevrón a la izquierda del texto, alineado a la derecha (`E2/15-…/ritmo-y-tarjetas__telefono-claro.png`, `herramientas__telefono-claro.png`).
- **Arreglo:** `pantalla-inicio.tsx` (`ENLACE`) y `presupuesto/pantalla.tsx` (`COMO_SE_COMPONE`): icono `chevR` antes del texto en ambos.
- **Cómo verificar:** ambos lugares muestran «› Ver cómo se compone».

### PRE-01 · Pastillas de filtro: 16 px / peso 400 y 44 de alto; la referencia usa 14 px / 500 y 40 — Presupuesto · todas · media
- **Se ve:** `analisis/presupuesto__principal.md` (teléfono y computadora): «Sobregiradas» tamaño 16≠14, peso 400≠500; pastilla de 44 de alto (`capturas/pliegue/presupuesto__cubiertas__telefono-claro.png`).
- **Debería:** `.t-etiqueta` 14, inactiva 500, activa 700, 40 de alto (PANTALLAS §2.3; `E2/D3-…/todas__telefono-claro.png`).
- **Arreglo:** `apps/web/src/componentes/base/pastillas.tsx`: rol `etiqueta`, `min-h-10` con área de toque de 44 por pseudo-elemento.
- **Cómo verificar:** texto 14 px / 500 (activa 700), pastilla de 40 de alto y área de toque ≥ 44.

### PRE-02 · El filtro activo no se desplaza a la vista — Presupuesto · teléfono · media
- **Se ve:** `capturas/pliegue/presupuesto__cubiertas__telefono-claro.png`: «Cubiertas» activa queda cortada («Cu») en el borde derecho; la fila sangra y se desplaza (medida `_nota__presupuesto__filtros-desplazados__x.txt`: scroller 390, contenido 479), pero no se centra en la activa.
- **Debería:** D3 deja la activa visible («Cubi…») y que el último asome (`E2/D3-…/cubiertas__telefono-claro.png`).
- **Arreglo:** `pastillas.tsx`: al montar, `scrollIntoView({ inline: 'nearest' })` de la pastilla con `aria-current`, sin animar con movimiento reducido.
- **Cómo verificar:** con `?filtro=cubiertas` la pastilla activa queda con ≥ 60 % de su ancho visible.

### PRE-03 · «Sin resultados»: componente distinto al del diseño — Presupuesto · todas · media
- **Se ve:** `capturas/pliegue/presupuesto__sin-resultados__telefono-claro.png`: círculo `--positivo-fondo` con check, «Ninguna categoría cumple este filtro», «Probá con otros filtros o quitalos para ver todo.», botón gris.
- **Debería:** caja de borde punteado, icono de filtro en círculo neutro, «Ninguna categoría coincide», «No hay categorías “Cubiertas” con este filtro en el período.» y botón tonal azul «Quitar filtros» (`T/S2-Presupuesto__sin-resultados.png`, `E2/D3-…/cubiertas__telefono-claro.png`).
- **Arreglo:** `apps/web/src/componentes/base/vacio.tsx` (variante `filtro`) y `textos/presupuesto.ts` (`sinResultados`): texto con el nombre del filtro; botón con `TONAL` en lugar de `BOTON`.
- **Cómo verificar:** coincide con el PNG y el botón es tonal `--accion-tonal` / `--accion`.

### PRE-04 · Con solo archivadas con dinero aparece «Ninguna categoría cumple este filtro» sin filtro activo — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__herramientas__telefono-claro.png`: con «Todas» activa se lee el vacío de filtro y «Quitar filtros» (`sinFilas && filtro === undefined && archivadas > 0` cae en `sinResultados`).
- **Debería:** sin filtro activo, el vacío de «Todavía no hay categorías» o ninguno (el diseño muestra las filas de Casa…); «Sin resultados» solo con filtro (PANTALLAS §5 «Estados»).
- **Arreglo:** `presupuesto/pantalla.tsx`: `sinResultados` solo si `filtro !== undefined`; sin filtro y sin categorías activas, el vacío «Todavía no hay categorías» con enlace a Estructura.
- **Cómo verificar:** la semilla ESC-44 no muestra «Quitar filtros» con «Todas».

### PRE-05 · Selector de período: faltan el subtítulo de «Cerrado» y «Futuro» y «Ir al período actual» es un enlace liviano — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__periodo-cerrado__telefono-claro.png`: «🔒 Cerrado»; futuro: «Futuro»; «Ir al período actual» en 14 px, peso 400 (`selector-periodo.tsx`, `estadoVisible` solo usa `dominio.periodo.cerrado/futuro`).
- **Debería:** «Cerrado · Sin acciones de asignar» y «Futuro · Solo asignado, sin gasto»; «Ir al período actual» en enlace discreta 44 de alto, peso 700 (`T/S2-Presupuesto__periodo-cerrado.png`, `T/S2-Presupuesto__periodo-futuro.png`; PANTALLAS §2.15).
- **Arreglo:** `apps/web/src/componentes/navegacion/selector-periodo.tsx` y `textos/dominio.ts` (`periodo`).
- **Cómo verificar:** los subtítulos coinciden y el enlace es `.t-etiqueta` 700.

### PRE-06 · Período futuro: muestra la franja de Listo para asignar y «Mover dinero»; la referencia no — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__periodo-futuro__telefono-claro.png`: franja con «Asignar», «Ver cómo se compone» y «Mover dinero» encima de las categorías.
- **Debería:** solo selector, filtros, categorías (con «+») y totales; sin franja ni pagos de tarjeta (`T/S2-Presupuesto__periodo-futuro.png`; PANTALLAS §5: «solo asignado, sin gasto ni indicadores, sin pagos de tarjeta»). Si la herramienta es deseable en futuro, hay que decidirlo (el PNG manda hasta entonces).
- **Arreglo:** `presupuesto/pantalla.tsx`: ocultar `ResumenListoParaAsignar` y `nav` de acciones cuando `futuro`.
- **Cómo verificar:** en un período futuro no hay franja ni «Mover dinero».

### PRE-07 · Período cerrado: «Período cerrado» en una tercera línea; la referencia lo pone a la derecha — Presupuesto · todas · baja
- **Se ve:** `capturas/presupuesto__periodo-cerrado__telefono-claro.png`: línea propia con candado debajo de «Asignado… · Gastado…», repetida en cada fila.
- **Debería:** candado + «Período cerrado» a la derecha de la línea de montos, en `--texto-terciario` (`T/S2-Presupuesto__periodo-cerrado.png`; PANTALLAS §2.6).
- **Arreglo:** `componentes/dominio/fila-categoria.tsx`: columnas `[1fr][auto]` en la línea de montos cuando `periodoCerrado`.
- **Cómo verificar:** las filas cerradas no crecen una línea.

### PRE-08 · El botón «Asignar» de la franja es un ancla a `#categorias` — Presupuesto · todas · media
- **Se ve:** `presupuesto/pantalla.tsx`: `accion={{ href: '#categorias', texto: t.acciones.asignar }}`; en `capturas/presupuesto__principal__telefono-claro.png` solo desplaza la página.
- **Debería:** abrir la hoja Asignar (PANTALLAS §2.8 «Versión franja» y §5 «“+” y “Asignar” abren la hoja Asignar»).
- **Arreglo:** igual que INI-02; mismo flujo sin categoría elegida.
- **Cómo verificar:** tocar «Asignar» abre `role="dialog"`.

### PRE-09 · Franja con LPA negativo: el botón sigue diciendo «Asignar» y sobresale del relleno — Presupuesto · teléfono · media
- **Se ve:** `capturas/pliegue/presupuesto__lpa-negativo__telefono-claro.png`: «Asignar» llega a 8 px del borde de la franja (el relleno es 14) por el indicador largo.
- **Debería:** botón «Quitar $86.15» con el indicador en dos líneas a la izquierda (`E2/15-…/lpa-negativo__telefono-claro.png`).
- **Arreglo:** `componentes/dominio/billete.tsx` (franja): texto `Quitar $X` cuando `lpaNegativo`, columna de texto `min-w-0` con salto de línea.
- **Cómo verificar:** el botón respeta el padding de 14 y dice «Quitar $86.15».

### PRE-10 · Franja: «En camino» debajo del monto y botón 16/600 — Presupuesto · todas · baja
- **Se ve:** `capturas/presupuesto__principal__telefono-claro.png`: «En camino $40.00» en una línea aparte; botón «Asignar» 16 px peso 600 (`analisis/presupuesto__principal.md`: 16≠14, 600≠700).
- **Debería:** «En camino $40.00» junto al monto (una fila) y botón `.t-etiqueta` 700 de 44 (`E2/15-…/herramientas__telefono-claro.png`).
- **Arreglo:** `billete.tsx` (`franja`): `flex-wrap items-baseline` y botón con rol `etiqueta` 700.
- **Cómo verificar:** la franja mide ≈ 76 px de alto y el botón 14/700.

### PRE-11 · «Mover dinero» y «Auto-asignar» sin iconos — Presupuesto · todas · baja
- **Se ve:** `capturas/presupuesto__principal__telefono-claro.png`: botones tonales con solo texto.
- **Debería:** iconos de intercambio y de actualizar a la izquierda (`E2/15-…/herramientas__telefono-claro.png`).
- **Arreglo:** `presupuesto/pantalla.tsx` (`TONAL`): `Icono nombre="swap"` y el de reintento/actualizar del set.
- **Cómo verificar:** coincide con el PNG.

### PRE-12 · Fila de pago de tarjeta: el indicador baja a una segunda línea — Presupuesto · teléfono · baja
- **Se ve:** `capturas/presupuesto__principal__telefono-claro.png`: «Disponible para pagar $623.43» y, debajo, «Te falta reservar»; el PNG los pone en la misma fila. «Al día» en lugar de «Deuda de tarjeta» para Mastercard con $0.00.
- **Debería:** misma fila: texto en `cuerpo-pequeno` (13) + indicador a la derecha (`T/S2-Presupuesto__telefono-claro.png`). La etiqueta de $0.00 la fija DECISIONES («$0.00 en `--texto`»); «Al día» vs «Deuda de tarjeta» queda a confirmar.
- **Arreglo:** `componentes/dominio/fila-pago.tsx`: texto de 13 px y `flex-nowrap` con `min-w-0`.
- **Cómo verificar:** con Visa Oro («Te falta reservar $18.75») la fila ocupa dos líneas, no tres.

### PRE-13 · Etiquetas de estado en filas: 14 px; la referencia usa 13 — Presupuesto y otras listas · todas · baja
- **Se ve:** `analisis/presupuesto__principal.md`: «Meta cubierta», «Sobregiro con débito o efectivo», «Falta para la meta» 14≠13 (interlineado 18.9≠17.6) en teléfono y computadora.
- **Debería:** versión chica del indicador, etiqueta a .8125rem (PANTALLAS §2.4).
- **Arreglo:** `componentes/dominio/indicador-estado.tsx`: variante `chica` en `fila-categoria.tsx`.
- **Cómo verificar:** etiqueta de 13 px en las filas.

### PRE-14 · Archivadas con dinero: tres elementos donde el diseño tiene una fila con «Sacar» — Presupuesto · todas · media
- **Se ve:** `capturas/presupuesto__herramientas__telefono-claro.png`: título «ARCHIVADAS CON DINERO», párrafo, tarjeta con nombre, «Disponible $25.00», botón tonal largo «Sacar $25.00 a Listo para asignar» y enlace negro subrayado «Sacar el dinero de Gimnasio».
- **Debería:** una fila con nombre, «Archivada el 10/10 · Disponible $62.85» y pastilla tonal «Sacar» a la derecha (`E2/15-…/herramientas__telefono-claro.png`). El enlace subrayado en `--texto` además es un componente que no existe en el juego.
- **Arreglo:** `presupuesto/pantalla.tsx` (bloque `archivadas-con-dinero`) y `presupuesto/sacar-un-toque.tsx`: «Sacar» tonal de 38; el enlace a `…/sacar` pasa a ser la fila entera.
- **Cómo verificar:** cada archivada con dinero ocupa una fila con un solo botón «Sacar».

### PRE-15 · Computadora: la tabla lleva una columna «+» que el diseño no tiene — Presupuesto · computadora-claro · baja
- **Se ve:** `capturas/presupuesto__principal__computadora-claro.png`: círculo «+» de 44 al final de cada fila; «Disponible» termina en x=866 (en la referencia, 953).
- **Debería:** tabla de 4 columnas sin «+» (`T/S2-Presupuesto__computadora-claro.png`; PANTALLAS §2.6 «Computadora: tabla con columnas…»).
- **Arreglo:** `fila-categoria.tsx`: sin botón en `md:`; asignar desde el detalle o desde el hover de la fila (decidir).
- **Cómo verificar:** las columnas Asignado, Gastado y Disponible quedan a 110 px.

### PRE-16 · Computadora: el contenido de Presupuesto es 48 px más angosto que el de la referencia — Presupuesto · computadora-claro · media
- **Se ve:** `capturas/presupuesto__principal__computadora-claro.png`: contenido de x=296 a 1344 (1048); el análisis dice «Márgenes: izq 296 · der 96». El `main` mide 1144 con 48 de relleno.
- **Debería:** contenido de 1096 (x=297 a 1393 en `T/S2-Presupuesto__computadora-claro.png`: relleno de 48 a cada lado dentro del área de 1192) (DECISIONES: «contenido con max-width 1144 y relleno de 48»).
- **Arreglo:** `presupuesto/pantalla.tsx`: `max-w-6xl` (1152) se aplica a la caja con relleno; usar un contenedor sin relleno extra o `max-w-[calc(1144px+96px)]` desde un token de layout.
- **Cómo verificar:** a 1440 px el margen derecho del contenido es 48.

### PRE-17 · Computadora: filas de la tabla con área de toque de 30 px — Presupuesto · computadora-claro · baja
- **Se ve:** `analisis/presupuesto__principal.md`: 4 tocables < 44 (554 × 30): Luz y agua, Internet y teléfono, Farmacia, Cuota del préstamo.
- **Debería:** tocables de al menos 44 × 44 (DECISIONES regla 6).
- **Arreglo:** `fila-categoria.tsx`: el enlace ocupa toda la fila (`min-h-11`, `after:absolute after:inset-0`).
- **Cómo verificar:** `analisis/presupuesto__principal.md` sin «Tocables < 44».

### PRE-20 · Detalle de Listo para asignar: la descomposición no es la de la referencia — Listo para asignar · todas · media
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`, `…__computadora-claro.png`: «DE DÓNDE SALE», «ENTRADAS AL PRESUPUESTO» (4 líneas), «LO QUE YA TIENE UN TRABAJO O LO REDUJO» (6 líneas), dos rótulos apilados.
- **Debería:** «CÓMO SE COMPONE HOY» con 6 líneas: Ingresos del período, Arrastre del período anterior, Otras entradas, Asignado en el período (−), Asignado a futuro (−) y Listo para asignar (`E2/05-…/principal__telefono-claro.png`).
- **Arreglo:** `presupuesto/listo-para-asignar/pantalla.tsx` (`descomposicion`): los términos de la referencia con U+2212 y total en negrita. Si se mantiene el desglose (cumple 03 «Efectivo − (asignado + arrastre) − en camino»), **proponer un CH** para actualizar el diseño.
- **Cómo verificar:** coincide con el PNG o con el diseño actualizado.

### PRE-21 · Reducción proyectada: sin «Al cerrar el 20/10 quedaría $X» y con rótulos de más — Listo para asignar · todas · media
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`: párrafo «Al cierre del período actual…», «Reducción proyectada al cierre $26.30», «CATEGORÍAS» y «Restaurantes $26.30».
- **Debería:** «Restaurantes · sobregiro con débito −$26.30» y «Al cerrar el 20/10 quedaría $286.10» (`E2/05-…/principal__telefono-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx`: fila por categoría con motivo y el total proyectado (el DTO tiene la reducción; el «quedaría» es LPA − reducción, que debe venir del motor, no calcularse en la interfaz: PF-3).
- **Cómo verificar:** aparece «Al cerrar el 20/10 quedaría $286.10» con el monto del motor.

### PRE-22 · Historial: línea con cifra grande donde el diseño tiene barras con eje y selector arriba — Listo para asignar · todas · media
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`: título «HISTORIAL» dentro del contenedor, cifra «$1,165.75», línea de 6 puntos con etiquetas solapadas («$1,165.75» sobre la línea); en computadora (`…__computadora-claro.png`) gráfico y tabla juntos y a todo el ancho.
- **Debería:** «HISTORIAL» fuera del contenedor, a la izquierda del selector Gráfico/Tabla (que alterna), barras con eje $0 · $150 · $300 · $450 y el período actual en `--accion` (`E2/05-…/principal__telefono-claro.png`, `…__computadora-claro.png`, `tabla__telefono-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx` (sección `historial`) y `componentes/graficos/` (barras con eje); `tablaAlLado` solo con la tabla activa.
- **Cómo verificar:** coincide con los PNG de `principal` y `tabla`.

### PRE-23 · Nota permanente de B-4 como aviso azul de información — Listo para asignar · todas · baja
- **Se ve:** `capturas/lpa__principal__telefono-claro.png`: aviso `--informacion-fondo` con texto largo.
- **Debería:** caja `--superficie-hundida` con icono `info` y «Finn no adelanta ingresos futuros: Listo para asignar solo cuenta el dinero que ya entró.» (`E2/05-…/principal__telefono-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx` y `textos/listo-para-asignar.ts`.
- **Cómo verificar:** coincide con el PNG.

### PRE-24 · Computadora: una sola columna a 1048 px; la referencia tiene dos — Listo para asignar · computadora-claro · media
- **Se ve:** `capturas/lpa__principal__computadora-claro.png`: billete, descomposición, reducción e historial uno bajo otro; flecha «←» a la izquierda del título.
- **Debería:** columna izquierda (billete + composición + reducción) y derecha (historial), enlace «← Presupuesto» sobre el título (`E2/05-…/principal__computadora-claro.png`).
- **Arreglo:** `listo-para-asignar/pantalla.tsx`: `md:grid md:grid-cols-2` y el cabezal con `rutaPadre` en `componentes/marco/`.
- **Cómo verificar:** a 1440 px hay dos columnas.

### PRE-30 · Asignar edita un valor absoluto con un selector +/−; el diseño suma un monto con signo — Asignar · todas · alta
- **Se ve:** `capturas/pliegue/asignar__pagina-completa__telefono-claro.png`, `capturas/asignar__principal__telefono-claro.png`: campo «Nuevo valor de Asignado» precargado con 100.00 y un selector «+ / −» en el que el «−» casi no se lee (gris claro sobre gris).
- **Debería:** campo «Asignar» con prefijo «+$», precargado con la opción elegida (75.00), ayuda «Para quitar, escribí el monto con signo menos.» (`E2/07-…/asignar__telefono-claro.png`, `…__computadora-claro.png`).
- **Arreglo:** `flujos/presupuesto-asignar-categoria/formulario.tsx`: el campo muestra el monto a sumar (la acción conserva `esperado` y el valor absoluto), sin el selector de signo; el signo menos se escribe. Si el valor absoluto es una decisión de 04/05 (CA-10.x), **proponer un CH** para el diseño.
- **Cómo verificar:** el campo se llama «Asignar», con «+$», y no hay selector +/−.

### PRE-31 · Las opciones rápidas no son una selección y muestran valores absolutos — Asignar · todas · media
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: tres filas-botón «Lo que falta para la meta $175.00», «Lo mismo que el período pasado $250.00», «Tu promedio de gasto $0.00»; tocarlas guarda.
- **Debería:** grupo de radio (círculo con relleno en la elegida), importe a sumar ($75.00, $100.00) y «Tu promedio de gasto (3 períodos)»; elegir una rellena el campo y no guarda (`E2/07-…/asignar__telefono-claro.png`).
- **Arreglo:** `flujos/presupuesto-asignar-categoria/rapida.tsx`: `role="radiogroup"` y radios de 44; el envío lo hace el botón principal.
- **Cómo verificar:** elegir una opción solo rellena el campo y marca el radio.

### PRE-32 · Falta la tarjeta de impacto «Listo para asignar $312.40 → $237.40» — Asignar · todas · media
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: entre el campo y los botones no hay tarjeta (solo existe el aviso AV-11 con LPA negativo). No se probó con un valor escrito.
- **Debería:** tarjeta con «Listo para asignar $312.40 → $237.40» y «Fondo de emergencia · asignado $100.00 → $175.00» (`E2/07-…/asignar__telefono-claro.png`). Las cifras las da el servidor (PF-3).
- **Arreglo:** `formulario.tsx`: consultar la vista previa (`Vista.impacto`) al cambiar el monto y dibujar la tarjeta (`componentes/formularios/confirmacion-impacto.tsx`).
- **Cómo verificar:** con 75.00 escrito aparece la tarjeta con las dos líneas.

### PRE-33 · Botones «Cancelar / Guardar» en lugar de «Cancelar / Asignar $75.00» — Asignar · todas · media
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: «Cancelar» y «Guardar».
- **Debería:** «Cancelar» (tonal) y «Asignar $75.00» en columnas 1fr 1.4fr (PANTALLAS §2.17; `E2/07-…/asignar__telefono-claro.png`).
- **Arreglo:** `formulario.tsx` y `textos/presupuesto-asignar.ts`: etiqueta con el monto formateado por `formatearMonto`.
- **Cómo verificar:** el botón dice «Asignar $75.00».

### PRE-34 · Encabezado de la hoja sin «Ahorro · meta mensual $175.00» y con «Falta para la meta» en dos líneas — Asignar · todas · baja
- **Se ve:** `capturas/asignar__principal__telefono-claro.png`: «La meta pide $175.00»; rótulo «FALTA PARA LA META» partido en dos líneas.
- **Debería:** subtítulo «Ahorro · meta mensual $175.00» y el rótulo «META» con «falta $75.00» (`E2/07-…/asignar__telefono-claro.png`).
- **Arreglo:** `formulario.tsx` (`Cifra`) y `textos/presupuesto-asignar.ts`; el nombre del grupo debe llegar en el DTO.
- **Cómo verificar:** coincide con el PNG, sin rótulo partido.

### PRE-35 · Después de asignar no aparece el resultado «Asignaste $75.00 a Fondo de emergencia. · Deshacer» — Presupuesto tras Asignar · todas · alta
- **Se ve:** `capturas/pliegue/asignar__resultado__telefono-claro.png` y `medidas/_nota__asignar__resultado__telefono-claro.txt`: `deshacer=0 status=0`; la hoja se cierra y Presupuesto queda sin mensaje ni `role="status"`.
- **Debería:** resultado en el lugar, arriba de la lista, que no desaparece solo y con «Deshacer» (DECISIONES regla 5; PANTALLAS §2.13 «Asignaste $75.00 a Fondo de emergencia. → Deshacer»; `E2/07-…/asignado__computadora-claro.png`).
- **Arreglo:** `flujos/presupuesto-asignar-categoria/formulario.tsx` debe dejar el resultado (por ejemplo en `searchParams` o un estado de la ruta) y `presupuesto/pantalla.tsx` dibujarlo con el componente de resultado (`role="status"`, alto 56, rebote de 300 ms); «Deshacer» invoca la operación inversa.
- **Cómo verificar:** tras guardar aparece el resultado con «Deshacer» y persiste hasta cerrarlo; `role="status"` presente.

### PRE-36 · Conflicto de edición: aviso de problema con botón en lugar de error de campo — Asignar · todas · media
- **Se ve:** `capturas/pliegue/asignar__conflicto__telefono-claro.png` (capturado en la ruta de página completa): bloque `--problema-fondo` con tres líneas y botón tonal «Usar el valor actual».
- **Debería:** borde de 2 px `--problema-borde` en el campo y debajo «Este valor cambió mientras lo editabas. Ahora es $1,180.00.» con glifo (`E2/07-…/asignar-conflicto__telefono-claro.png`).
- **Arreglo:** `formulario.tsx`: error de campo del conflicto y la acción «Usar el valor actual» como enlace en el mismo mensaje.
- **Cómo verificar:** el campo tiene borde `--problema-borde` y el mensaje con una línea.

### PRE-37 · Asignar en un período cerrado redirige al detalle; el diseño es una hoja con el motivo — Asignar · todas · alta
- **Se ve:** `capturas/pliegue/asignar__periodo-cerrado__telefono-claro.png`: la navegación termina en `/presupuesto/categorias/[id]?periodo=…&motivo=periodo_cerrado`, con un aviso de información «Este período está cerrado: solo se puede mirar.». (CA-10.8 lo prescribe.)
- **Debería:** la hoja «Asignar a Supermercado» con aviso de problema «No se puede cambiar lo asignado en un período cerrado.», caja de candado «Período 21/08 – 20/09/2026. Para mover dinero hoy, usá el período actual.» y botones «Cerrar / Ir al período actual» (`E2/07-…/asignar-periodo-cerrado__telefono-claro.png`). En el período cerrado las filas ni siquiera ofrecen «+», así que el estado solo se alcanza por URL.
- **Arreglo:** `app/(finn)/presupuesto/asignar/[categoriaId]/page.tsx` y `flujos/presupuesto-asignar-categoria/lector.tsx`: renderizar la hoja con el motivo en vez de `redirect()`. **Contradicción para un CH** entre CA-10.8 (redirección) y el diseño 07.
- **Cómo verificar:** abrir la URL con `?periodo=` cerrado muestra la hoja con los dos botones.

### PRE-38 · Detalle de categoría (destino de la redirección): el título se solapa con «Disponible» — Categoría · teléfono-claro · alta
- **Se ve:** `capturas/pliegue/asignar__periodo-cerrado__telefono-claro.png`: «RESTAURANTES» pisa la palabra «Disponible» (ejes y= 600 en la captura de 2×); además la barra superior no tiene título.
- **Debería:** el título en su fila y debajo el rótulo del grupo y «Disponible» (`E2/07-…/mover-excede__telefono-claro.png` muestra el detalle).
- **Arreglo:** `app/(finn)/presupuesto/categorias/[categoriaId]/` (fuera de mi sección: pasarlo a quien audite Categoría).
- **Cómo verificar:** sin solapes a 390 px.

### PRE-40 · Mover dinero: rótulos, atajos, impacto y botón distintos — Mover · todas · media
- **Se ve:** `capturas/pliegue/mover__principal__telefono-claro.png`: «Sacar de», «Poner en», «Monto a mover», sin atajos «Cubrir $26.30 / Todo $62.85», sin tarjeta de impacto, botón «Mover» y destino «Elegí una categoría.».
- **Debería:** «Desde», «Hacia», «Monto», atajos de pastilla, tarjeta «Supermercado $62.85 → $36.55 / Restaurantes −$26.30 → $0.00», botón «Mover $26.30», subtítulo «Hacia Restaurantes» cuando viene de una categoría (`E2/07-…/mover-dinero__telefono-claro.png`).
- **Arreglo:** `apps/web/src/flujos/presupuesto-mover/formulario.tsx` y `textos/`.
- **Cómo verificar:** coincide con el PNG.

### PRE-41 · Mover más que el Disponible: la app lo permite; la referencia lo bloquea — Mover · todas · media
- **Se ve:** `capturas/pliegue/mover__excede__telefono-claro.png`: con $200 desde «Super» (Disponible $80.00) el botón queda activo y no hay mensaje de error (CA-11.2/AV-02 aceptan dejar la categoría en negativo).
- **Debería:** campo con borde `--problema-borde`, «Supermercado tiene $62.85.», atajos «Cubrir/Todo» y «Mover $80.00» deshabilitado (`E2/07-…/mover-excede__telefono-claro.png`).
- **Arreglo:** **Contradicción para un CH**: diseño 07 (bloquea) frente a CA-11.2 (acepta y avisa). No se resuelve en el código.
- **Cómo verificar:** queda definido en un CH y la hoja coincide.

### PRE-42 · Mover: sin resultado visible después de mover — Presupuesto tras Mover · todas · media
- **Se ve:** `capturas/pliegue/mover__resultado__telefono-claro.png`: Presupuesto sin mensaje ni `role="status"`.
- **Debería:** resultado en el lugar con «Deshacer» (DECISIONES regla 5; sin PNG propio: seguir PANTALLAS §2.13).
- **Arreglo:** igual que PRE-35, en `flujos/presupuesto-mover/formulario.tsx`.
- **Cómo verificar:** aparece «Moviste $30.00 de Super a Salidas. · Deshacer».

### PRE-50 · Auto-asignar: vista previa con estructura distinta — Auto-asignar · todas · media
- **Se ve:** `capturas/pliegue/auto-asignar__principal__telefono-claro.png`: título «ESTO ASIGNARÍA FINN», lista con divisores insertos, «Listo para asignar cambia −$100.00.», dos avisos de advertencia («Beta quedó sin cubrir por $10.00»), botón «Asignar»; intro en 16 px.
- **Debería:** lista a ancho completo con filas «falta para la meta +$75.00» y «queda sin cubrir −$132.22» (advertencia), tarjeta resumen «Se asigna / Listo para asignar $312.40 → $0.00 / Sin cubrir», botón «Asignar $312.40» e intro de `cuerpo-pequeno` (`E2/07-…/auto-asignar__telefono-claro.png`).
- **Arreglo:** `flujos/presupuesto-auto-asignar/formulario.tsx` y `textos/`.
- **Cómo verificar:** coincide con el PNG; «auto-asignar-cubiertas» ya coincide.

### PRE-60 · El título de Estructura es «Grupos y categorías»; la referencia dice «Estructura» — Estructura · todas · baja
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`.
- **Debería:** «ESTRUCTURA» (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `textos/estructura.ts` (`titulo`).
- **Cómo verificar:** el título es «Estructura».

### PRE-61 · «Pagos de tarjeta» va primero y sin el texto por fila — Estructura · todas · media
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`: el grupo del sistema arriba, rótulo «Lo administra Finn» a la derecha y filas sin texto; en bases sin tarjetas, «Este grupo no tiene categorías.» (`estructura__vacia`, `estructura__movida`).
- **Debería:** al final, con «Del sistema: sin archivar ni eliminar» en la primera fila y «Del sistema» en las demás; sin el bloque si no hay tarjetas (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `flujos/presupuesto-estructura/lista.tsx` y `textos/estructura.ts` (`delSistema`, `sinCategorias`).
- **Cómo verificar:** coincide con el PNG.

### PRE-62 · Las filas no muestran «Meta mensual $350.00» — Estructura · todas · baja
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`: solo el nombre.
- **Debería:** subtítulo «Meta mensual $350.00» cuando hay meta (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `lista.tsx` y el DTO de `lector.tsx`.
- **Cómo verificar:** Supermercado muestra su meta.

### PRE-63 · Cabecera del grupo con un chevrón de más y flechas en azul — Estructura · todas · baja
- **Se ve:** `capturas/pliegue/estructura__lista__telefono-claro.png`: «Editar grupo» más un «⌃» de «Subir grupo»; flechas de fila en `--accion`.
- **Debería:** solo «Editar grupo» en la cabecera; flechas en `--texto` (`E2/08-…/estructura__telefono-claro.png`).
- **Arreglo:** `lista.tsx`: mover grupos en «Editar grupo»; color de las flechas a `text-texto`.
- **Cómo verificar:** coincide con el PNG.

### PRE-64 · Editar categoría y Nueva categoría son hojas inferiores; el diseño es un flujo largo — Estructura · todas · alta
- **Se ve:** `capturas/pliegue/estructura__editar-categoria__telefono-claro.png`: hoja sobre la lista con título «EDITAR CATEGORÍA», «Grupo» como lista de radios, «Guardar» tonal pequeño, «Eliminar categoría» parcial y enlaces subrayados «Archivar» / «Fusionar».
- **Debería:** pantalla completa con «×», título «EDITAR RESTAURANTES», «Grupo» como selección, «Eliminar» deshabilitado a todo el ancho con motivo, «Archivar» y «Fusionar con otra» como enlaces en negrita sin subrayar, y «Guardar» fijo al pie (`E2/08-…/editar-categoria__telefono-claro.png`; INDICE-entrega-2 §08).
- **Arreglo:** `app/(finn)/presupuesto/estructura/categorias/[categoriaId]/page.tsx`, quitando la intercepción de `@superpuesto` para esta ruta, y `flujos/presupuesto-estructura/formulario.tsx`.
- **Cómo verificar:** coincide con el PNG, con «Guardar» en el pie fijo.

### PRE-65 · «Moviste Supermercado.»: aviso informativo en lugar del resultado — Estructura · todas · media
- **Se ve:** `capturas/pliegue/estructura__movida__telefono-claro.png`: aviso azul con «Deshacer» en una segunda línea.
- **Debería:** resultado blanco con check, «Subiste Café al primer lugar de Comida fuera.» y «↶ Deshacer» a la derecha en la misma fila (`E2/08-…/estructura-movida__telefono-claro.png`).
- **Arreglo:** `lista.tsx`: componente de resultado (§2.13) y `textos/estructura.ts` (`movido`).
- **Cómo verificar:** coincide con el PNG.

### PRE-66 · Estructura vacía: bloque vacío más grupos vacíos — Estructura · todas · media
- **Se ve:** `capturas/pliegue/estructura__vacia__telefono-claro.png`: vacío + «Pagos de tarjeta» con «Este grupo no tiene categorías.» + grupo «Gastos» vacío con «Nueva categoría» + «Nuevo grupo». («Gastos» lo crea la semilla del arnés.) Botón «Usar la plantilla de categorías» vs «Empezar con una lista sugerida».
- **Debería:** solo el vacío, «Empezar con una lista sugerida» y «+ Crear un grupo» (`E2/08-…/estructura-vacia__telefono-claro.png`).
- **Arreglo:** `lista.tsx` y `textos/estructura.ts` (`usarPlantilla`): ocultar el grupo del sistema sin tarjetas.
- **Cómo verificar:** con base sin tarjetas no aparece «Pagos de tarjeta».

### PRE-70 · Plantilla sugerida: todos los nombres son campos de texto; el diseño tiene filas con lápiz — Plantilla · todas · media
- **Se ve:** `capturas/pliegue/plantilla__sugerida__telefono-claro.png`: nombre del grupo y de cada categoría como campos con línea inferior, «×» azul, «Agregar categoría» por grupo.
- **Debería:** filas de texto con lápiz y «×» en `--texto`, rótulo de grupo simple, «+ Agregar grupo» (`E2/08-…/plantilla__telefono-claro.png`). Título «LISTA SUGERIDA» y texto «Quitá, renombrá o agregá lo que quieras. No se guarda nada hasta que tocás “Crear”.».
- **Arreglo:** `flujos/presupuesto-estructura-plantilla/plantilla.tsx` (modo edición por fila) y `textos/plantilla.ts`.
- **Cómo verificar:** coincide con el PNG.

### PRE-71 · Creando la plantilla: sin barra de progreso ni pie «Guardando…» — Plantilla · todas · media
- **Se ve:** `capturas/pliegue/plantilla__creando__telefono-claro.png`: «Creando tu plantilla: 0 de 47…» en Archivo 700 y un párrafo; sin barra ni botón.
- **Debería:** título de sección «CREANDO TU PLANTILLA: 9 DE 12…», barra de progreso, aviso `info` «Podés salir…» y pie fijo con «Guardando…» con spinner (`E2/08-…/plantilla-creando__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx`: barra (`role="progressbar"`) y `PieDeHoja` con el botón enviando.
- **Cómo verificar:** coincide con el PNG; `aria-busy` presente.

### PRE-72 · Creación cortada: lista plana de nombres en vez de resumen — Plantilla · todas · media
- **Se ve:** `capturas/pliegue/plantilla__cortada__telefono-claro.png`: aviso amarillo corto y un párrafo «Creadas 12 · Faltan: Ropa y calzado, Transporte, Gasolina, …» con grupos y categorías mezclados; botón «Seguir creando la plantilla (12 de 47 creadas)».
- **Debería:** aviso con título «Seguir creando la plantilla (9 de 12 creadas)», «La creación se cortó. Lo que ya se creó quedó guardado.» y enlace «Seguir creando»; tarjeta «Creadas 9 / Faltan Ahorro: Fondo de emergencia, Viaje · Casa: Alquiler» y botón «Seguir creando» (`E2/08-…/plantilla-cortada__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx` y `reanudar.ts` (agrupar lo que falta por grupo).
- **Cómo verificar:** coincide con el PNG.

### PRE-73 · Resultado de la plantilla: una línea suelta — Plantilla · todas · alta
- **Se ve:** `capturas/pliegue/plantilla__resultado__telefono-claro.png`: «47 creadas.» y botón «Ir al presupuesto».
- **Debería:** resultado con check («11 creadas. 1 no se creó.»), enlace «Ir a Presupuesto» y una tarjeta por elemento no creado con motivo e indicador «Omitida» (`E2/08-…/plantilla-resultado__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx` (resumen), `textos/plantilla.ts`.
- **Cómo verificar:** coincide con el PNG, con `role="status"`.

### PRE-75 · Plantilla: quitar borra la fila sin poder restaurarla — Plantilla · todas · alta
- **Se ve:** `capturas/pliegue/plantilla__vacia__telefono-claro.png`: al quitar todo desaparecen grupos y filas; solo queda «Agregar grupo» y «Crear 0 categorías» (angosto, no a todo el ancho).
- **Debería:** las filas quedan tachadas con un icono «restaurar» y el botón del pie «Crear» deshabilitado a todo el ancho con «Elegí al menos una categoría.» debajo (`E2/08-…/plantilla-vacia__telefono-claro.png`, `plantilla__telefono-claro.png`).
- **Arreglo:** `plantilla.tsx`: estado «quitada» reversible; `PieDeHoja` a todo el ancho.
- **Cómo verificar:** quitar y restaurar vuelve a la fila original; con todo quitado el pie coincide con el PNG.

## Candidatos a global

- INI-01: «Registrar» solo «+» a 390 px (barra superior de todas las pestañas).
- INI-13 / INI-14: esqueleto de carga fuera de forma y barra sin título en cargando y error (toda `(finn)`).
- PRE-01 / PRE-02: pastillas de filtro 16/400 y activa fuera de vista (`componentes/base/pastillas.tsx`, afecta todo filtro).
- PRE-13: etiquetas de estado de 14 px en filas (la referencia, 13).
- PRE-35 / PRE-42 / PRE-65: no hay resultado en el lugar con «Deshacer» tras asignar, mover o reordenar (regla 5); el componente de resultado §2.13 no se usa.
- PRE-33: botones de flujo corto «Guardar» sin el monto («Asignar $75.00»).
- PRE-16: contenido de computadora 48 px más angosto que el de la referencia (revisar el contenedor `max-w-6xl` + relleno).
- INI-02 / PRE-08: botones «Asignar» del billete y de la franja no abren la hoja Asignar.

## Sin diseño

- `inicio__activar-notificaciones` (`capturas/inicio__activar-notificaciones__telefono-claro.png`): tarjeta «Activar notificaciones» de FT-06 (FALTANTES `permiso-push`); se fuerza el permiso en «default». Se ve como una tarjeta blanca con título «ACTIVAR NOTIFICACIONES», texto, botón primario y «Ahora no», con 20 de margen.
- `asignar__pagina-completa` y `auto-asignar__pagina-completa` (`capturas/pliegue/…`): las rutas se pueden abrir por URL como páginas completas (con «×», sin barra inferior ni campana); el diseño solo trae la hoja. Con la hoja del teléfono y el panel de computadora (≈ 420 px de ancho; la referencia, 440) cubierto, la página completa es un estado propio sin referencia.
- `estructura__nuevo-grupo`, `estructura__nueva-categoria`, `estructura__editar-grupo` (FALTANTES `grupo-editar`), `estructura__error-nombre-vacio`: hojas inferiores sin tablero; coherentes con las demás hojas, el botón «Eliminar grupo» es un peligro sólido de ancho completo.
- `mover__resultado`: el resultado de mover no tiene PNG (ver PRE-42).
- Selector de período «Elegir otro período» (FALTANTES `periodos`), archivadas como pantalla propia (`archivadas`), `cierre-periodo` e `instalar`: no hay pantalla en la app en esta sección.
- **Referencias en conflicto (para un CH):** el estado «primer uso sin cuentas» tiene dos diseños: `T/S1-Inicio__primer-uso-sin-cuentas.png` («Empecemos», 3 pasos numerados, botón «Agregar una cuenta»; PANTALLAS §4) y `E2/15-…/primeros-pasos-sin-cuentas__*` («Primeros pasos · 0 de 3» con nota). La app implementa el de la entrega 2 (INI-16).
