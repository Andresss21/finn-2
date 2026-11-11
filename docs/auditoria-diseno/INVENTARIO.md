# Inventario de la app

Todas las rutas, pantallas, hojas, menús, diálogos y estados que la app real muestra, con su componente, la referencia de diseño que le corresponde (o **SIN DISEÑO**) y el veredicto de la auditoría: «bien» o los ids de hallazgo de `AUDITORIA-APP.md`.

- Cada id de captura tiene tres archivos: `capturas/<id>__telefono-claro.png`, `__telefono-oscuro.png` y `__computadora-claro.png` (pantalla completa) y lo mismo en `capturas/pliegue/` (lo que se ve al abrir). Sus medidas están en `medidas/<id>__<variante>.json`.
- Abreviaturas de rutas de referencia: `E1/` = `docs/diseno/02-referencias/entrega-1/pantallas/`, `E2/` o `entrega-2/pantallas/` = `docs/diseno/02-referencias/entrega-2/pantallas/`, `E3/` = `docs/diseno/entrega-3/pantallas/`, `tableros/` = `docs/diseno/02-referencias/tableros/`. Abreviaturas de componentes: `B/` = `apps/web/src/app/(finn)/bandeja/`, `APP/` = `apps/web/src/app/(finn)/cuentas/`, rutas relativas = desde `apps/web/src/`.
- Los ids de hallazgo del inventario son los de las secciones; en `AUDITORIA-APP.md` cada hallazgo conserva su id, y los que se consolidaron en un global llevan la nota «→ GLO-nn».

## Acceso y marco (ACC, GLO-1nn)

### Acceso (ACC)

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| `acceso__ingresar`, `acceso__ingresar-vacio` | `/ingresar` | `app/ingresar/formulario-ingresar.tsx`, `layout.tsx` | `entrega-2/pantallas/13-acceso/ingresar` | ACC-04, ACC-06, ACC-07, ACC-08, ACC-09 |
| `acceso__ingresar-foco` | `/ingresar` | idem | PANTALLAS §2.2 (foco) | bien (línea de 3 px `--foco` + halo) |
| `acceso__ingresar-validacion` | `/ingresar` | idem | SIN DISEÑO | ver Sin diseño |
| `acceso__ingresar-contrasena-visible` | `/ingresar` | idem | SIN DISEÑO | ACC-08 |
| `acceso__ingresar-enviando` | `/ingresar` | idem | PANTALLAS §2.1 (enviando) | bien (spinner + texto) |
| `acceso__credenciales-invalidas` | `/ingresar` | idem | `13-acceso/credenciales-invalidas` | ACC-11 |
| `acceso__demasiados-intentos` | `/ingresar` | idem | `13-acceso/demasiados-intentos` | ACC-10 |
| `acceso__ingresar-sin-conexion` | `/ingresar` | idem | SIN DISEÑO | ACC-18 |
| `acceso__sesion-vencida` | `/ingresar?…` | idem | SIN DISEÑO (FALTANTES `sesion-vencida`) | ACC-19 |
| `acceso__verificar-vacio`, `-foco`, `-a-medio`, `-incompleto` | `/ingresar/verificar` | `app/ingresar/verificar/formulario-verificar.tsx` | `13-acceso/verificar` | ACC-01, ACC-05 |
| `acceso__verificar-enviando` | `/ingresar/verificar` | idem | PANTALLAS §2.1 | bien |
| `acceso__codigo-incorrecto` | `/ingresar/verificar` | idem | `13-acceso/codigo-incorrecto` | ACC-03 |
| `acceso__codigo-vencido` | `/ingresar/verificar` | idem | `13-acceso/codigo-vencido` | ACC-03 |
| `acceso__verificar-varios-factores`, `-abierto` | `/ingresar/verificar` | idem | `13-acceso/verificar-varios-factores` | ACC-16, ACC-17 |
| `acceso__inscribir`, `-copiado` | `/ingresar/inscribir` | `flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx` | `13-acceso/inscribir` | ACC-02, ACC-12, ACC-13, ACC-14 |
| `acceso__inscribir-preparando` | `/ingresar/inscribir` | idem | SIN DISEÑO | ver Sin diseño |
| `acceso__inscribir-codigo-incorrecto` | `/ingresar/inscribir` | idem | `13-acceso/codigo-incorrecto` | ACC-02, ACC-03 |
| `acceso__inscribir-error` | `/ingresar/inscribir` | idem | SIN DISEÑO | ver Sin diseño |
| `acceso__inscribir-cierre`, `-tras-confirmar` | `/ingresar/inscribir` | idem | `13-acceso/inscribir-cierre` | ACC-15 |

En computadora, todas las pantallas de acceso: ACC-06.

### Marco (GLO)

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| `marco__pestana`, `marco__pestana-bandeja` | `/`, `/bandeja` | `componentes/marco/marco.tsx`, `navegacion/*` | `entrega-1/pantallas/K1-Navegacion` (+ tablero `tableros/K1-Navegacion__telefono-claro.png`) | GLO-111, GLO-112 |
| `marco__pantalla-hija` | `/presupuesto/categorias/[id]` | `marco.tsx`, `volver-en-titulo.tsx` | PANTALLAS §3.1 | GLO-113 |
| `marco__mas-acciones-abierto` | detalle con menú ⋯ | `marco/mas-acciones.tsx` | `K2` menú (entrega-1) | bien |
| `marco__seccion-de-mas` | `/metas` | `marco.tsx` | PANTALLAS §3.1 (solo campana) | bien (solo campana, sin Registrar ni ☰) |
| `marco__ajustes` | `/ajustes` | `app/(finn)/ajustes/page.tsx` | `entrega-3/pantallas/16-salir/ajustes-indice` | GLO-103, GLO-107 |
| `marco__flujo-largo` | `/registrar/gasto` | `pagina-flujo.tsx` | DECISIONES (flujos) | bien (Cerrar a la izquierda, sin campana ni barra inferior) |
| `marco__foco-saltar` | `/` | `marco.tsx` | sin referencia | bien («Saltar al contenido» aparece con foco) |
| `marco__mas-secciones-abierta`, `-sin-contador` | `/` + ☰ | `navegacion/hoja-diferida.tsx`, `secciones.ts` | `entrega-3/pantallas/16-salir/mas-secciones` | GLO-101, GLO-107 |
| `marco__mas-secciones-sin-conexion` | `/` + ☰ offline | idem | `16-salir/mas-secciones-sin-conexion` | GLO-101, GLO-108, GLO-109 |
| `salir__seguridad` | `/ajustes/seguridad` | `app/(finn)/ajustes/seguridad/sesiones.tsx` | `16-salir/seguridad` | GLO-104 |
| `salir__saliendo` | idem | idem | `16-salir/mas-secciones-saliendo` | GLO-108 |
| `salir__error` | idem | idem | `16-salir/mas-secciones-error` | bien en intención (motivo en el lugar con glifo y color `problema`); la fila no existe en el marco (GLO-101) |
| `salir__sin-conexion`, `-tras-tocar` | idem | idem | `16-salir/mas-secciones-sin-conexion` | GLO-108, GLO-109 |
| `salir__con-borradores` | idem | idem | `16-salir/cambios-sin-enviar` | GLO-105 |
| `notificaciones-panel__con-sin-leer` | `/` + campana (`@superpuesto/(.)notificaciones`) | `…/(.)notificaciones/page.tsx`, `marco/tarjeta-notificaciones.tsx` | `K1-Navegacion__notificaciones-abiertas-n7`, `K5-Nuevos__panel-de-notificaciones` | GLO-114, GLO-115, GLO-116, GLO-117 |
| `notificaciones-panel__todo-leido`, `-marcado` | idem | idem | PANTALLAS §2.17 | GLO-114 (mismo filtro) |
| `notificaciones-panel__vacio` | idem | idem | PANTALLAS §2.19 (vacío) | bien en estructura (círculo + título + texto) |
| `estado__sin-conexion-en-la-app` | `/` offline | `marco.tsx:124` | `14-…/sin-conexion-en-la-app` | GLO-109, GLO-110 |
| `estado__sin-conexion-navegacion-bloqueada` | `/` offline + navegar | idem | SIN DISEÑO | GLO-109 |
| `estado__sin-conexion-pagina`, `-con-borrador` | `/sin-conexion` | `app/sin-conexion/page.tsx` | `14-…/sin-conexion-pagina` | ACC-06 (escritorio), GLO-121 |
| `estado__404-fuera` | ruta inexistente sin marco | `app/not-found.tsx` | `14-…/no-encontrado` | bien (sin barra: no hay marco fuera de la app) |
| `estado__404-dentro` | `/cuentas/[id]` inexistente | `app/(finn)/not-found.tsx` | `14-…/no-encontrado` | GLO-119 |
| `estado__error`, `-copiada` | pantalla con error | `app/(finn)/error.tsx`, `navegacion/error-de-pantalla.tsx` | `14-…/error-de-pantalla`, `K4-Dominio-B__error-de-pantalla` | GLO-120 |
| `estado__cargando`, `-generico` | cualquier pantalla cargando | `app/(finn)/loading.tsx` | `entrega-1/componentes/K2-Base__esqueleto-de-carga` | GLO-122 (`-generico` es la página de desarrollo `/pruebas/estados/carga`: «Página lenta», no es una pantalla real) |
| `estado__navegacion-en-curso` | cualquier cambio de ruta | `marco.tsx:134` | PANTALLAS §11 | bien (raya de 3 px `--accion` arriba) |
| `estado__actualizacion-pwa` | `/` | `marco/registro-service-worker.tsx` | SIN DISEÑO | GLO-124 |

No capturado: el aviso «Ver tarjeta →» del panel (la semilla `A7N` no lo trae, es de datos); la campana con contador en la barra del teléfono de Ajustes aparece sin contador porque la semilla de ese caso no tiene notificaciones (datos).

### Entrega 3, punto por punto (`docs/diseno/entrega-3/DECISIONES.md`, sección «Entrega 3»)

| Punto de la tabla | Estado | Hallazgo |
|---|---|---|
| Salir como última fila de la hoja Más secciones, franja `--superficie-hundida` de 8 px, ícono `logout`, sin flecha, color `--texto` | NO implementado | GLO-101 |
| Salir al pie de la barra lateral con el correo encima y línea `--borde-sutil` | NO implementado | GLO-102 |
| Salir en Ajustes: tarjeta propia con «{correo} · en este dispositivo» | NO implementado | GLO-103 |
| Se quita el enlace «Salir» de Seguridad | NO hecho: sigue ahí | GLO-104 |
| Sin borradores sale directo, sin confirmación | Cumple (solo existe el enlace de Seguridad) | — |
| Con borradores: «Tenés N cambios sin enviar» (hoja inferior / panel de 440 px, lista, Seguir, Quedarme, Salir y borrarlos) | NO implementado: sale directo y borra los borradores | GLO-105 |
| La hoja pasa por encima de la barra inferior (`--capa-superpuesto`) y usa `--superficie-elevada` | Parcial: tapa la barra, pero sin la fila final que justifica el cambio | GLO-101 |
| Filas de 52 px, ícono de 20 sin disco, contador «2» en Notificaciones | Cumple | — |
| Estado «Saliendo…» con spinner y `aria-busy` | Parcial | GLO-108 |
| Estado «No se pudo salir» con motivo en el lugar, glifo y color `problema`, control activo | Cumple en Seguridad (aviso con referencia `E-…`); no existe en hoja ni barra lateral | GLO-101 |
| Sin conexión: Salir deshabilitado con «Sin conexión: no se puede salir ahora.» | NO implementado: sigue activo y, al tocarlo, devuelve un error | GLO-108 |
| Campana en el índice de Ajustes | Cumple | — |
| Barra lateral con «Ajustes» activo en `/ajustes` y subpáginas | Cumple (`marco__ajustes__computadora-claro`) | — |
| Ícono `gear` de 8 dientes, `sun` en Apariencia, `logout` nuevo | NO: «Ajustes» y «Apariencia» siguen usando el dibujo de sol; no hay `logout` | GLO-107 |
| Texto del aviso global «Estás sin conexión» | Cumple (`textos/navegacion.ts:12`) | — |
| Tokens de tiempo del código de 6 casillas (`--duracion-temblor` 380 ms, etc.) | El temblor de 380 ms existe (`fz-jitter`), pero sobre un campo único | ACC-01 |

## Inicio y Presupuesto (INI, PRE)

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

## Detalle de categoría y Metas (CAT, MAS-0nn)

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| categoria__principal | /presupuesto/categorias/[id] | `app/(finn)/presupuesto/categorias/[categoriaId]/pantalla.tsx` | S3-Detalle (telefono/computadora/oscuro) | CAT-01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12, 33 |
| categoria__con-meta | idem (Fondo de emergencia) | pantalla.tsx | S3-Detalle__con-meta | CAT-01, 03, 04 |
| categoria__sobregiro-tarjeta | idem (Gasolina) | pantalla.tsx | S3-Detalle__sobregiro-con-tarjeta | CAT-01, 04, 13 (color del héroe: bien, ver nota de CAT-13) |
| categoria__sin-movimientos | idem (Viaje) | pantalla.tsx | S3-Detalle__sin-movimientos | CAT-01, 02, 14 |
| categoria__historial-tabla | idem, selector en «Tabla» | historial.tsx | S3-Detalle__historial-como-tabla | CAT-08, 11, 12 |
| categoria__sin-historial | idem (Super, sin períodos previos) | historial.tsx | DECISIONES «Gráfico sin datos» · PANTALLAS §2.19 | bien (caja hundida con ícono y texto) |
| categoria__pago-tarjeta | idem (Visa Oro con deuda) | pago.tsx | S3-Detalle__categoria-de-pago-de-tarjeta + DECISIONES | CAT-01, 15, 16, 17 |
| categoria__pago-tarjeta-reservado | idem, todo reservado | pago.tsx | DECISIONES («Pagar la tarjeta») | CAT-15, 17 |
| categoria__periodo-cerrado | idem `?periodo=` cerrado | pantalla.tsx | SIN DISEÑO (PANTALLAS §2.6, §2.15) | CAT-01, 02; ver «Sin diseño» |
| categoria__archivada | idem (Gimnasio archivada) | pantalla.tsx, desarchivar.tsx | SIN DISEÑO (FALTANTES `archivadas`) | CAT-01, 18; ver «Sin diseño» |
| categoria__cargando | idem | `loading.tsx` (re-exporta el de `(finn)`) | 14-…/cargando | **no capturado como carga real** (ver abajo); proxy capturado |
| categoria__no-encontrada | idem con id inexistente | lector.tsx | 14-…/error y 404 | bien en estructura (hija con volver, ícono de búsqueda, «Esto ya no existe.», botón tonal); no se comparó contra el PNG de 14 |
| categoria-mas__cerrado | menú cerrado | pantalla.tsx | MA/cerrado | = categoria__principal |
| categoria-mas__abierto | menú abierto | `componentes/marco/mas-acciones.tsx` | MA/abierto | CAT-19 |
| categoria-mas__abierto-con-meta | menú, categoría con meta | mas-acciones.tsx | MA/abierto-con-meta | CAT-19 (se miró solo el análisis) |
| categoria-mas__periodo-cerrado | menú con período cerrado | mas-acciones.tsx | MA/abierto | sin referencia propia; medido, no mirado |
| categoria-mas__archivada | menú de archivada | mas-acciones.tsx | SIN DISEÑO | medido, no mirado |
| categoria-archivar__formulario | /…/archivar | `flujos/presupuesto-categorias-archivar/formulario.tsx` | 07/archivar-categoria | CAT-20, 21, 23, 32 |
| categoria-archivar__impacto | idem, paso «Revisá el impacto» | idem | 07/archivar-categoria | CAT-22 |
| categoria-archivar__sin-pendientes | idem (Viaje) | idem | 07/archivar-categoria | CAT-20, 21 |
| categoria-sacar__hoja | hoja sobre Presupuesto | `flujos/presupuesto-categorias-sacar/formulario.tsx` | 07/sacar-de-archivada | CAT-24, 25 |
| categoria-sacar__error-monto | idem, monto mayor al disponible | idem | 07/sacar-de-archivada | CAT-24, 26 |
| categoria-sacar__pagina | /…/sacar directo | `…/sacar/page.tsx` | 07/sacar-de-archivada | CAT-24, 27, 32 |
| categoria-sacar__desarchivar | resultado de «Desarchivar» | desarchivar.tsx | SIN DISEÑO | ver «Sin diseño» |
| categoria-fusionar__formulario | /…/fusionar | `flujos/presupuesto-categorias-fusionar/formulario.tsx` | 07/fusionar | CAT-28, 29 |
| categoria-fusionar__impacto | idem, paso «Revisá el impacto» | idem | 07/fusionar | CAT-22, 29, 30 |
| categoria-fusionar__sin-destinos | sin otra categoría activa | idem | 07/fusionar-destino-archivado (lo más cercano) | CAT-31 |
| categoria-fusionar__destino-archivado | rechazo forzado archivando el destino desde otra pestaña | idem | 07/fusionar-destino-archivado | CAT-31 |
| metas__lista | /metas | `app/(finn)/metas/pantalla.tsx` | 09a/lista | MAS-003, 004, 005 |
| metas__lista-varias | idem, rellenar / acumular / semanal | idem | 09a/lista | MAS-003, 004 |
| metas__vencida | idem con meta vencida | idem | 09a/vencida | MAS-004, 006 |
| metas__vacia | idem sin metas | idem | 09a/vacia | MAS-007 |
| metas__cargando | idem | hereda `loading.tsx` de `(finn)` | 14-…/cargando | **no capturado como carga real**; proxy |
| meta__nueva-mensual / semanal / anual / para-fecha / rellenar-hasta | /metas/nueva | `flujos/metas-nueva/formulario.tsx` | 09a/nueva | MAS-001, 002, 008, 009, 010, 011, CAT-32 |
| meta__nueva-error-vacio / error-sin-fecha / error-fecha-pasada | idem con errores | idem | 09a/nueva (sin estado de error) | MAS-012 |
| meta__nueva-sin-categorias | idem, todas con meta | idem | SIN DISEÑO | ver «Sin diseño» |
| meta__nueva-sin-preseleccion | idem sin `?categoria=` | idem | 09a/nueva | MAS-001 |
| meta__editar | /metas/[metaId] | `flujos/metas-meta/formulario.tsx` | SIN DISEÑO propio (09a/nueva) | MAS-001, 013, CAT-32 |
| meta__editar-vencida / editar-extender | idem con meta vencida | idem | 09a/vencida · FALTANTES `meta-vencida` | MAS-006, 014 |
| meta__editar-eliminar | confirmación de eliminar | idem | SIN DISEÑO | ver «Sin diseño» |
| meta__editar-conflicto | «cambió mientras editabas» | idem | 07/asignar-conflicto (lo más cercano) | MAS-015 |
| meta__editar-no-encontrada | /metas/[id] inexistente | `flujos/metas-meta/lector.tsx` | 14 | medido, no mirado |

**No capturado como carga real:** `categoria__cargando` y `metas__cargando`. Se intentó retener la respuesta RSC (antes y después de la
precarga) y el `loading.tsx` no llegó a pintarse (la ruta responde antes de que el navegador lo muestre). Se capturó
`/pruebas/estados/carga`, que dibuja el mismo `loading.tsx` de `(finn)` que la categoría re-exporta (`categorias/[categoriaId]/loading.tsx`)
y que Metas hereda. Es un proxy, no la transición real.

## Bandeja y Registrar (BAN, REG)

Rutas: `B` = `apps/web/src/app/(finn)/bandeja`, `F` = `apps/web/src/flujos`, `R` = `apps/web/src/app/(finn)/registrar`. Veredicto "familia X" = estructura comparada con el análisis, mismos hallazgos que X.

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| bandeja__principal | /bandeja | `B/page.tsx`, `B/lista.tsx`, `B/fila.tsx`, `componentes/dominio/movimiento-bandeja.tsx` | tableros/S4-Bandeja__telefono-claro y __computadora-claro | BAN-01 BAN-02 BAN-03 BAN-04 BAN-05 BAN-09 BAN-10 BAN-11 BAN-13 |
| bandeja__al-dia | /bandeja | `B/lista.tsx` | S4-Bandeja__bandeja-al-dia | BAN-08 (más BAN-02 BAN-03) |
| bandeja__aprobado-con-un-toque | /bandeja | `B/fila.tsx`, `componentes/base/resultado.tsx` | S4-Bandeja__aprobado-con-un-toque | BAN-06 |
| bandeja__descartado | /bandeja | `B/fila.tsx` | S4-Bandeja__descartado | BAN-06 |
| bandeja__vista-de-descartados | /bandeja?vista=descartados | `B/descartados.tsx` | S4-Bandeja__vista-de-descartados | BAN-07 |
| bandeja__descartados-vacio | /bandeja (Descartados) | `B/descartados.tsx` | SIN DISEÑO (vacío de Descartados) | sin diseño |
| bandeja__restaurado | /bandeja | `B/descartados.tsx`, `B/fila.tsx` | SIN DISEÑO (resultado de Restaurar) | sin diseño |
| bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes | /bandeja | `movimiento-bandeja.tsx` | S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes | BAN-04 BAN-12 BAN-05 |
| bandeja__referencia-copiada | /bandeja | `B/fila.tsx`, `F/bandeja-movimiento/error-sms.ts` | SIN DISEÑO (confirmación de copiar la referencia) | sin diseño |
| bandeja__error-al-aprobar | /bandeja | `B/fila.tsx`, `componentes/base/aviso.tsx` | SIN DISEÑO (error de aprobar en la fila; el aviso es el de `problema`) | bien en el aviso; BAN-05 (la fila se parte en tres líneas de acciones) |
| bandeja__sin-conexion | /bandeja sin red | `B/fila.tsx` | SIN DISEÑO (el aviso global está en 14-…/sin-conexion) | sin diseño |
| bandeja__aprobar-todos, bandeja__aprobar-todos-resultado | /bandeja | `B/aprobar-todos.tsx` | SIN DISEÑO (FALTANTES `aprobar-todos`) | sin diseño |
| bandeja__arrastre-destinos | /bandeja (asa con foco) | `B/arrastre.tsx` | SIN DISEÑO (FT-78) | no capturado el estado: la captura muestra solo el asa con foco; los destinos de arrastre no se despliegan sin un arrastre real |
| bandeja__otra-categoria | /bandeja | `B/otra-categoria.tsx` | SIN DISEÑO (CH-220 A10) | sin diseño |
| bandeja__muchos | /bandeja (varias filas) | `B/lista.tsx` | S4-Bandeja__telefono-claro (misma lista) | familia principal |
| revisar__listo | /bandeja/[id] | `F/bandeja-movimiento/formulario.tsx`, `campos-movimiento.tsx`, `encabezado.tsx`, `panel-navegacion.tsx` | 01-revisar-movimiento/listo | BAN-03 BAN-14 BAN-15 BAN-16 BAN-17 BAN-18 BAN-19 BAN-20 |
| revisar__falta-categoria | idem | idem | 01-revisar-movimiento/falta-categoria | familia listo (BAN-14 BAN-15 BAN-19); faltan «Categoría», «Crea una regla…» y «Elegí una categoría o un por cobrar…» (análisis) |
| revisar__dividido | idem | `F/bandeja-movimiento/*` | 01-revisar-movimiento/dividido | BAN-14 BAN-15 (rótulos «Línea» en vez de «Parte 1/2», «Agregar línea», sin la nota de «Recordar») |
| revisar__parte-sin-destino | idem | idem | 01-revisar-movimiento/parte-sin-destino | familia dividido; faltan «Elegí una categoría o por cobrar» (análisis) |
| revisar__coincidencia | idem | `F/bandeja-movimiento/coincidencia.tsx` | 01-revisar-movimiento/coincidencia | BAN-23 |
| revisar__posible-duplicado | idem | `F/bandeja-movimiento/estados.tsx` | 01-revisar-movimiento/posible-duplicado | BAN-26 |
| revisar__no-reconocido | idem | `F/bandeja-movimiento/estados.tsx` | 01-revisar-movimiento/no-reconocido | BAN-21 BAN-18 |
| revisar__no-reconocido-a-mano | idem | idem | SIN DISEÑO (formulario a mano tras «Registrar a mano») | sin diseño |
| revisar__con-error | idem | `F/bandeja-movimiento/detalle-error.tsx` | 01-revisar-movimiento/con-error | BAN-22 |
| revisar__ya-aprobado | idem | `F/bandeja-movimiento/ya-resuelto.tsx` | 01-revisar-movimiento/ya-aprobado | BAN-27 |
| revisar__ya-descartado | idem | idem | 01-revisar-movimiento/ya-descartado | familia ya-aprobado; texto «está descartado» en vez de «ya está descartado» (análisis) |
| revisar__aprobado | idem | `F/bandeja-movimiento/resultado.tsx` | 01-revisar-movimiento/aprobado | BAN-24 |
| revisar__pago-de-tarjeta | idem | `F/bandeja-movimiento/formulario.tsx` | 01-revisar-movimiento/pago-de-tarjeta | BAN-28 |
| revisar__devolucion | idem | `F/bandeja-movimiento/eleccion-compra.tsx` | 01-revisar-movimiento/devolucion | BAN-25 |
| revisar__devolucion-compra-elegida | idem | idem | 01-revisar-movimiento/devolucion | BAN-25 |
| revisar__ingreso | idem | `formulario.tsx` | SIN DISEÑO (tipo Ingreso dentro de Revisar) | sin diseño |
| revisar__datos-faltantes, revisar__validacion, revisar__sin-conexion, revisar__error-de-red, revisar__aprobando, revisar__confirmar-periodo-cerrado, revisar__muchos | idem | `formulario.tsx`, `componentes/formularios/confirmacion-impacto.tsx` | SIN DISEÑO (estados de error/envío de Revisar) | sin diseño; heredan BAN-03 BAN-14 BAN-15 BAN-19 |
| revisar__descartado | idem | `F/bandeja-movimiento/descartado.tsx` | SIN DISEÑO (resultado de descartar a pantalla completa) | sin diseño |
| revisar__no-encontrado, revisar__sin-cuentas | idem | `F/bandeja-movimiento/sin-cuentas-movimiento.tsx` | SIN DISEÑO (404 y sin cuentas de Revisar) | sin diseño; margen 55 px, ver BAN-03 |
| registrar__selector | /registrar | `R/page.tsx`, `F/registrar/lector.tsx` | 12-…/selector | REG-01 |
| registrar__cargando | /registrar al navegar | `R/loading.tsx` | SIN DISEÑO (más cercana: 15-inicio-y-presupuesto-piezas-nuevas/cargando) | sin diseño; «$40.00» sin tabular-nums y dos enlaces sin nombre accesible (REG-03) |
| registrar__ingreso, registrar__ingreso-pagina | /registrar/ingreso (hoja y página) | `F/registrar-tipo/formulario.tsx` | 12-…/ingreso | REG-02 REG-03 REG-04 REG-05 REG-06 REG-07 |
| registrar__ingreso-validacion, registrar__ingreso-sin-conexion, registrar__ingreso-guardado | idem | idem | SIN DISEÑO (estados de error/guardado del flujo corto) | sin diseño; heredan REG-02 REG-03 |
| registrar__transferencia | /registrar/transferencia | `formulario.tsx` | 12-…/transferencia | REG-02 REG-03 REG-04 REG-05 REG-06 REG-08 |
| registrar__transferencia-misma-cuenta | idem | idem | 12-…/transferencia-misma-cuenta | familia transferencia (REG-02 REG-03) |
| registrar__transferencia-una-cuenta | idem | idem | SIN DISEÑO (una sola cuenta de efectivo) | sin diseño |
| registrar__devolucion, registrar__devolucion-compra-elegida, registrar__devolucion-sin-compra | /registrar/devolucion | `F/registrar-tipo/devolucion.tsx`, `lector-devolucion.tsx` | 12-…/devolucion | familia ingreso (REG-02 REG-05 REG-06); margen 16 px en compra-elegida (BAN-03) |
| registrar__inversion | /registrar/inversion | `F/registrar-tipo/inversion-formulario.tsx` | 12-…/inversion | familia ingreso |
| registrar__inversion-retiro, registrar__inversion-ajuste | idem | idem | SIN DISEÑO (el diseño solo tiene el aporte) | sin diseño |
| registrar__desembolso | /registrar/desembolso | `formulario-desembolso.tsx` | 12-…/desembolso | familia ingreso |
| registrar__avance | /registrar/avance | `formulario-tarjeta.tsx` | 12-…/avance | familia ingreso |
| registrar__transferencia-deuda | /registrar/transferencia-deuda | `formulario-tarjeta.tsx` | 12-…/transferencia-deuda | familia transferencia |
| registrar__entrada-tarjeta | /registrar/entrada-tarjeta | `formulario-tarjeta.tsx` | SIN DISEÑO («Dinero que entra a una tarjeta») | sin diseño |
| registrar__avance-confirmar | idem | `componentes/formularios/confirmacion-impacto.tsx` | SIN DISEÑO (confirmación de avance) | sin diseño |
| registrar__retroactivo | idem (fecha en período cerrado) | `confirmacion-impacto-de-vista.tsx` | 12-…/retroactivo | REG-09 |
| registrar__no-encontrado, registrar__sin-cuentas | /registrar/[tipo] | `R/[tipo]/page.tsx` | SIN DISEÑO | sin diseño |
| registrar-gasto__principal, registrar-gasto__inicial, registrar-gasto__otra-persona | /registrar/gasto | `F/registrar-gasto/formulario.tsx`, `lineas.tsx`, `parte.tsx` | entrega-1/referencia/S5-Registrar__telefono-claro y __computadora-claro | REG-10 REG-12 REG-13 REG-14 REG-16 |
| registrar-gasto__una-linea | idem | idem | S5-Registrar__una-linea | familia principal (REG-10 REG-12) |
| registrar-gasto__suma-distinta-del-total | idem | `formulario.tsx`, `lineas.tsx` | S5-Registrar__suma-distinta-del-total | REG-11 |
| registrar-gasto__suma-rechazada | idem | idem | S5-Registrar__suma-distinta-del-total | REG-11 |
| registrar-gasto__monto-mal-escrito | idem | `formulario.tsx` | S5-Registrar__monto-mal-escrito | familia principal (REG-12); sin diferencias propias en el análisis |
| registrar-gasto__fecha-en-periodo-cerrado | idem | idem | S5-Registrar__fecha-en-periodo-cerrado | REG-10 (el aviso de período cerrado va dentro del impacto, que no se muestra antes de guardar) |
| registrar-gasto__confirmar-periodo-cerrado | idem | `confirmacion-impacto-de-vista.tsx` | S5-Registrar__fecha-en-periodo-cerrado | REG-10 |
| registrar-gasto__guardando | idem | `formulario.tsx` | S5-Registrar__guardando | bien en estructura (análisis sin diferencias); REG-14 |
| registrar-gasto__guardado | idem | `resultado-gasto.tsx` | S5-Registrar__guardado | REG-15 |
| registrar-gasto__sugerencia-al-escribir | idem | `sugerencia-comercio.tsx` | S5-Registrar__sugerencia-al-escribir | familia principal; sin diferencias propias en el análisis |
| registrar-gasto__validacion, registrar-gasto__calendario, registrar-gasto__fecha-no-existe, registrar-gasto__fecha-posterior, registrar-gasto__error-de-red, registrar-gasto__sin-conexion | idem | `formulario.tsx`, `componentes/formularios/entrada-fecha.tsx` | SIN DISEÑO (estados de error del formulario) | sin diseño |
| registrar-gasto__borrador | idem | `borrador-gasto.tsx` | SIN DISEÑO (FALTANTES `borrador`) | sin diseño |
| registrar-gasto__sin-cuentas | idem | `sin-cuentas.tsx` | SIN DISEÑO | sin diseño |

## Actividad y Reportes (ACT, REP)

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| actividad__lista | /actividad | `app/(finn)/actividad/pantalla.tsx` | 02-actividad/lista | ACT-01, ACT-02, ACT-03, ACT-14 |
| actividad__buscando | /actividad?texto= | `actividad/buscador.tsx` | 02-actividad/buscando | ACT-01, ACT-04 |
| actividad__filtros-abiertos | /actividad (hoja en teléfono, columna en computadora) | `actividad/filtros.tsx` | 02-actividad/filtros | ACT-05, ACT-06, ACT-07 |
| actividad__filtrado | /actividad?tipo=… | `actividad/chips.tsx` | 02-actividad/filtrado | ACT-05, ACT-08 |
| actividad__cargando | /actividad (carga) | `actividad/loading.tsx` | 02-actividad/cargando | no comparado en detalle (ver ACT-15) |
| actividad__cargar-mas | /actividad (60 filas, períodos cerrados) | `actividad/pantalla.tsx` | 02-actividad/cargar-mas | ACT-01 |
| actividad__vacio | /actividad sin transacciones | `actividad/pantalla.tsx` | 02-actividad/vacio | ACT-09 |
| actividad__sin-resultados | /actividad?texto=zzzz | `actividad/pantalla.tsx` | 02-actividad/sin-resultados | ACT-10 |
| actividad__eliminada | /actividad tras eliminar | `actividad/pantalla.tsx` | 03-detalle-de-transaccion/eliminada | ACT-11 |
| transaccion__principal | /actividad/[id] | `actividad/[transaccionId]/pantalla.tsx` | 03/principal | ACT-16, ACT-17, ACT-18, ACT-19, ACT-20 |
| transaccion__dividida | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-16, ACT-18, ACT-19 |
| transaccion__por-cobrar | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-21 |
| transaccion__por-cobrar-con-cobro | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-21, ACT-22 |
| transaccion__pendiente | /actividad/[id] | ídem | 03/principal | ACT-17 |
| transaccion__conciliada | /actividad/[id] | ídem | 03/conciliada | ACT-23 |
| transaccion__con-devolucion | /actividad/[id] | ídem | 03/principal (sin referencia propia) | ACT-22 |
| transaccion__cuenta-archivada | /actividad/[id] | ídem | 03/editar-cuenta-archivada | bien (el detalle no tiene diseño propio) |
| transaccion__mas-acciones | /actividad/[id] | `componentes/marco/mas-acciones.tsx` | 03/mas-acciones | ACT-24 |
| transaccion__no-encontrada | /actividad/[id] inexistente | `app/(finn)/not-found.tsx` | 14-sin-conexion-404…/no-encontrado | bien |
| transaccion__confirmada-tras-cambiar-estado, __devolucion-registrada, __evento-eliminado | /actividad/[id] | ídem | 03/principal | resultado en el lugar sin aviso: ACT-12 |
| transaccion-editar__principal | /actividad/[id]/editar | `flujos/actividad-editar/formulario.tsx` | 03/editar | V-01 (vacío mientras carga) |
| transaccion-editar__dividida | ídem | ídem | 03/editar | ACT-25 |
| transaccion-editar__con-devolucion | ídem | ídem | 03/editar | bien (cuenta fija con motivo) |
| transaccion-editar__revisar-impacto | ídem (AV-16) | `componentes/formularios/confirmacion-impacto.tsx` | SIN DISEÑO | ACT-26 |
| transaccion-editar__conflicto | ídem | `actividad-editar/formulario.tsx` | 03/editar-conflicto | ACT-27 |
| transaccion-editar__cuenta-archivada | ídem | ídem | 03/editar-cuenta-archivada | ACT-28 |
| transaccion-devolver__principal | /actividad/[id]/devolver | `flujos/actividad-devolver/formulario.tsx` | 03/devolver | ACT-29 |
| transaccion-devolver__dividida | ídem | ídem | 03/devolver | ACT-29 |
| transaccion-devolver__excede | ídem | ídem | 03/devolver-excede | ACT-30 |
| transaccion-devolver__sin-capacidad | ídem | `actividad-devolver/sin-capacidad.tsx` | 03/devolver-sin-capacidad | ACT-31 |
| transaccion-estado__principal, __confirmada | /actividad/[id]/estado | `flujos/actividad-estado/formulario.tsx` | 03/cambiar-estado | ACT-32, ACT-37 |
| transaccion-eliminar__principal | /actividad/[id]/eliminar | `flujos/actividad-eliminar/formulario.tsx` | 03/eliminar | ACT-32, ACT-33 |
| transaccion-eliminar__revisar | ídem (paso 2) | ídem | 03/eliminar | ACT-33, ACT-34 |
| transaccion-eliminar__bloqueado | ídem | ídem | 03/eliminar-bloqueado | ACT-32, ACT-35 |
| transaccion-eliminar-evento__principal, __cobro, __revisar | /actividad/[id]/eventos/eliminar | `flujos/actividad-eventos-eliminar/lector.tsx` | 03/eliminar-evento | ACT-32, ACT-34, ACT-36 |
| reportes__indice | /reportes (redirige a tendencia) | `reportes/page.tsx` | 04-reportes/tendencia | REP-01 a REP-05 |
| reporte-tendencia__principal | /reportes/tendencia | `reportes/[tipo]/pantalla.tsx` | 04/tendencia | REP-01 a REP-08 |
| reporte-tendencia__tabla | ídem (Tabla) | ídem | 04/tendencia-tabla | REP-02, REP-09 |
| reporte-tendencia__ventana-3 | ídem ?ventana=ultimos-3 | ídem | 04/tendencia | REP-04 |
| reporte-categorias__principal | /reportes/categorias | `[tipo]/vistas.tsx` | 04/categorias | REP-01 a REP-05, REP-10 |
| reporte-ingresos-gastos__principal | /reportes/ingresos-gastos | `[tipo]/vistas.tsx` | 04/ingresos-gastos | REP-01 a REP-05 (misma plantilla; no se vio uno por uno) |
| reporte-top-comercios__principal | /reportes/top-comercios | `[tipo]/vistas-detalle.tsx` | 04/top-comercios | REP-01 a REP-05, REP-11 |
| reporte-hallazgos__principal | /reportes/hallazgos | `[tipo]/hallazgos.tsx` | 04/hallazgos | REP-12 |
| reporte-hallazgos__vacio | ídem sin hallazgos | ídem | 04/hallazgos-vacio | REP-13 |
| reportes__sin-movimientos | /reportes/tendencia sin gasto | `[tipo]/pantalla.tsx` | 04/sin-movimientos | REP-14 |
| reporte-flujo-efectivo__principal | /reportes/flujo-efectivo | `[tipo]/flujo.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte-ritmo__principal | /reportes/ritmo | `[tipo]/ritmo.tsx` | SIN DISEÑO | ídem |
| reporte-realidad__principal | /reportes/realidad | `[tipo]/realidad.tsx` | SIN DISEÑO | ídem |
| reporte-tarjetas__principal, __con-ciclos | /reportes/tarjetas | `[tipo]/tarjetas.tsx` | SIN DISEÑO | REP-15 |
| reporte-hormiga__principal | /reportes/hormiga | `[tipo]/hormiga.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte-suscripciones__principal | /reportes/suscripciones | `[tipo]/suscripciones.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte-remanente__principal | /reportes/remanente | `[tipo]/vistas.tsx` | SIN DISEÑO | ídem |
| reporte-cumplimiento__principal | /reportes/cumplimiento | `[tipo]/vistas-detalle.tsx` | SIN DISEÑO | REP-15 |
| reporte-patrimonio__principal | /reportes/patrimonio | `[tipo]/vistas-detalle.tsx` | SIN DISEÑO | ídem |
| reporte-gasto-semanal__una | /reportes/gasto-semanal | `[tipo]/vistas-semanal.tsx` | D2/una | REP-16 a REP-22 |
| reporte-gasto-semanal__varias | ídem | ídem | D2/varias | REP-16 a REP-22 |
| reporte-gasto-semanal__a7 | ídem (A.7: varias categorías) | ídem | D2/varias | REP-16 a REP-22 |
| reporte-gasto-semanal__tabla | ídem (Tabla) | ídem | S7-Semanal__vista-de-tabla | REP-23 |
| reporte-gasto-semanal__asignado-negativo | ídem | ídem | S7-Semanal__asignado-negativo | REP-16 a REP-22 (aviso presente; no se comparó pixel a pixel) |
| reporte-gasto-semanal__categoria-nueva | ídem | ídem | S7-Semanal__categoria-nueva | REP-16 a REP-22 (aviso presente) |
| reporte-gasto-semanal__sin-movimientos | ídem sin gasto | ídem | 04/sin-movimientos | no comparado |
| reportes__selector-de-tipos | /reportes/tendencia | `[tipo]/pantalla.tsx` | 04/tendencia | no es un control desplegable: es la fila de pastillas (REP-05) |
| reportes__cargando | /reportes/[tipo] (carga) | `[tipo]/loading.tsx` | SIN DISEÑO | ver «Sin diseño» |
| reporte__no-encontrada (id `reporte__no-encontrado`) | /reportes/flujo-de-caja | `not-found.tsx` | 14/no-encontrado | bien |

No capturados: el estado «cargar más» en curso («Guardando…» en la referencia) no se puede forzar: el control es un enlace que navega. «Sin conexión» de Actividad y Reportes no se capturó (fuera del encargo). El selector de ventana no es una hoja: son segmentos en línea (REP-04). «Hormiga», «suscripciones», «flujo de efectivo», «ritmo» y «realidad» se capturaron una sola vez cada uno, en su estado principal.

## Cuentas (CTA)

`E1` = `02-referencias/entrega-1/pantallas`; `E2` = `02-referencias/entrega-2/pantallas/06-detalle-de-cuenta`; `APP` = `apps/web/src/app/(finn)/cuentas`; `FLU` = `apps/web/src/flujos`.

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| cuentas__principal | /cuentas | APP/pantalla.tsx, componentes/dominio/{billetera,cara-tarjeta,identidad-cuenta,posicion-neta}.tsx | E1/S6-Cuentas | CTA-13, 14, 15, 16, 17, 18, 19, 20, 21 |
| cuentas__mastercard-al-frente, cuentas__saldo-a-favor | /cuentas | billetera.tsx | E1/S6-Cuentas__tarjeta-con-saldo-a-favor-mastercard-al-frente | CTA-13, 15 (cara «Saldo a favor $25.00»: bien) |
| cuentas__archivadas, cuentas__archivadas-sin-ninguna | /cuentas?archivadas=1 | APP/pantalla.tsx | E1/S6-Cuentas__archivadas-visibles | bien |
| cuentas__prestamo-con-cuota | /cuentas | identidad-cuenta.tsx | E1/S6-Cuentas | bien (boleto con talón de cuota cuando hay modelo; «Sin modelo» sin él: ver Sin diseño) |
| cuentas__subtipos-y-tres-tarjetas | /cuentas | pantalla.tsx, billetera.tsx | E1/S6-Cuentas | ahorro con anillos: bien; billetera SIN DISEÑO; CTA-21 |
| cuentas__una-tarjeta | /cuentas | billetera.tsx | E1/S6-Cuentas | SIN DISEÑO (billetera sin apilar) |
| cuentas__sin-cuentas | /cuentas | pantalla.tsx | SIN DISEÑO (PANTALLAS §2.19) | ver Sin diseño |
| cuentas__sin-conexion | /cuentas | marco | E2/14-sin-conexion-404-y-error-de-pantalla/sin-conexion-en-la-app | bien |
| cuentas__cargando | /cuentas | APP/pantalla.tsx | SIN DISEÑO | no capturado (ver abajo) |
| cuenta__corriente, cuenta__corriente-dos-conciliaciones, cuenta__efectivo-sin-diferencia | /cuentas/[id] | APP/[cuentaId]/{cabecera,por-tipo,movimientos,conciliaciones}.tsx | E2/corriente | CTA-22, 23, 24, 25 |
| cuenta__ahorro | /cuentas/[id] | cabecera.tsx, identidad-cuenta.tsx | E2/corriente (identidad §2.10) | CTA-22, 24 |
| cuenta__billetera | /cuentas/[id] | cabecera.tsx | SIN DISEÑO (FALTANTES `billetera`) | ver Sin diseño |
| cuenta__tarjeta, cuenta__tarjeta-saldo-a-favor, cuenta__tarjeta-sin-deuda, cuenta__tarjeta-zafiro | /cuentas/[id] | APP/[cuentaId]/por-tipo.tsx, cara-tarjeta.tsx | E2/tarjeta | CTA-13, 14, 24, 25, 26, 27, 28 |
| cuenta__prestamo, cuenta__prestamo-con-amortizacion | /cuentas/[id] | por-tipo.tsx, filas-amortizacion.tsx | E2/prestamo | CTA-22, 29 |
| cuenta__inversion | /cuentas/[id] | por-tipo.tsx | E2/inversion | CTA-24, 30, 31 |
| cuenta__vacia | /cuentas/[id] | movimientos.tsx | E2/vacia | CTA-24, 32 |
| cuenta__archivada, cuenta__archivada-mas-acciones | /cuentas/[id] | APP/[cuentaId]/acciones.tsx, componentes/marco/mas-acciones.tsx | E2/archivada, E2/mas-acciones | CTA-12, 22 |
| cuenta__desarchivada | /cuentas/[id] | APP/[cuentaId]/desarchivar.tsx | E2/archivada (resultado §2.13) | CTA-33 |
| cuenta__mas-acciones | /cuentas/[id] | componentes/marco/mas-acciones.tsx | E2/mas-acciones | CTA-34 |
| cuenta__mas-acciones-tarjeta | /cuentas/[id] | mas-acciones.tsx | E2/mas-acciones-tarjeta | CTA-03, 34 |
| cuenta__periodo-anterior | /cuentas/[id] | movimientos.tsx | SIN DISEÑO (selector §2.15, «Cerrado») | bien |
| cuenta__filtro-sin-resultados | /cuentas/[id] | movimientos.tsx | SIN DISEÑO (§2.19) | ver Sin diseño |
| cuenta__no-encontrada | /cuentas/[uuid inexistente] | APP/[cuentaId]/lector.tsx | E2/14-…/404 | bien |
| cuenta-nueva__inicial, __efectivo-ahorro, __efectivo-billetera | /cuentas/nueva | FLU/cuentas-nueva/formulario.tsx | E2/nueva-tipo | CTA-02, 35 (segmentado Corriente · Ahorro · Billetera: bien) |
| cuenta-nueva__tarjeta, __tarjeta-sin-llenar | /cuentas/nueva?tipo-cuenta=tarjeta | formulario.tsx | E2/nueva-tarjeta | CTA-02, 35, 36 |
| cuenta-nueva__color-oro, -plata, -grafito, -zafiro, -rubi, -esmeralda, -amatista, -cobre | idem | FLU/cuentas-nueva/color-tarjeta.tsx, colores-tarjeta.ts | E2/nueva-tarjeta + DECISIONES (8 colores, vista previa en vivo) | CTA-37 (8 colores y vista previa: bien) |
| cuenta-nueva__nombre-repetido, __rechazo-del-servidor | idem | formulario.tsx | E2/nueva-nombre-repetido | CTA-38 |
| cuenta-nueva__campos-con-error | idem | formulario.tsx | E2/nueva-tarjeta | bien (errores por campo con texto) |
| cuenta-nueva__prestamo, __inversion | idem | formulario.tsx | SIN DISEÑO (FALTANTES `prestamo-alta`, `inversion-alta`) | ver Sin diseño |
| cuenta-nueva__revisar-impacto | idem | formulario.tsx | SIN DISEÑO | ver Sin diseño |
| cuenta-nueva__sin-conexion | idem | formulario.tsx | SIN DISEÑO (05 §7.4) | bien |
| cuenta-editar__principal, __billetera | /cuentas/[id]/editar | FLU/cuentas-editar/formulario.tsx | E2/editar | CTA-35, 39 |
| cuenta-editar__tarjeta | idem | formulario.tsx | E2/editar | CTA-01, 35 |
| cuenta-condiciones__sin-modelo, __principal | /cuentas/[id]/condiciones | FLU/cuentas-condiciones/formulario.tsx | E2/condiciones-sin-modelo, E2/condiciones | CTA-40 |
| cuenta-condiciones__tarjeta | /cuentas/[id]/condiciones | FLU/cuentas-condiciones/lector.tsx | E2/mas-acciones-tarjeta | CTA-03 |
| cuenta-pagar__principal, __sin-origen, __sin-deuda | /cuentas/[id]/pagar | FLU/cuentas-pagar/formulario.tsx | E2/pagar-tarjeta | CTA-04, 41, 42, 43 |
| cuenta-pagar__mas-que-la-deuda, __listo, __listo-con-excedente | idem | formulario.tsx | E2/pagar-saldo-a-favor | CTA-04, 44 |
| cuenta-cuota__principal, __con-propuesta, __categoria-abierta, __abono, __listo | /cuentas/[id]/cuota | FLU/cuentas-cuota/formulario.tsx | E2/cuota | CTA-04, 45 |
| cuenta-cuota__no-cuadra | idem | formulario.tsx | E2/cuota-no-cuadra | CTA-04, 45, 46 |
| cuenta-archivar__bloqueado | /cuentas/[id]/archivar | FLU/cuentas-archivar/formulario.tsx | E2/archivar-bloqueado | CTA-04, 05 |
| cuenta-archivar__principal, __tarjeta | idem | formulario.tsx | E2/archivar | CTA-04, 47 |
| cuenta-eliminar__bloqueado, __principal, __confirmar | /cuentas/[id]/eliminar | FLU/cuentas-eliminar/formulario.tsx | E2/eliminar-bloqueado | CTA-04, 06 |
| cuenta-verificar-saldo__datos, __coincide, __diferencia, __revisar, __listo-con-ajuste, __tarjeta | /cuentas/[id]/verificar-saldo | FLU/cuentas-verificar-saldo/formulario.tsx | E2/verificar-saldo, E2/verificar-diferencia | CTA-04, 07, 08 |
| cuenta-conciliar__subir, __falta-archivo, __error, __listo | /cuentas/[id]/conciliar | FLU/cuentas-conciliar/formulario.tsx | E2/conciliar-subir, E2/conciliar-error | CTA-09 |
| cuenta-conciliar__resultado | idem | formulario.tsx | E2/conciliar-resultado | CTA-10 |
| cuentas-ordenar__principal, __sin-cuentas | /cuentas/ordenar | FLU/cuentas-ordenar/formulario.tsx | E2/ordenar | CTA-04, 11 |

### No capturado
- **cuentas__cargando**: la navegación de cliente a /cuentas no deja ver un estado de carga propio de Cuentas. La captura muestra la pantalla de origen (Presupuesto) con la pestaña «Cuentas» atenuada; no hay esqueleto ni diseño de carga. Va como observación en «Sin diseño».

### Método
En teléfono claro miré cada pantalla y flujo contra su referencia; en computadora, la lista, el detalle de tarjeta y Pagar; en teléfono oscuro, la lista. En el resto de variantes revisé el análisis automático (marco, tocables, desbordes) sin encontrar diferencias propias.

## Programadas, Por cobrar, Reglas, Notificaciones y Ajustes (MAS-1nn, AJU)

Ajustes se repasó entero después de la verificación independiente: los hallazgos nuevos (AJU-30 a AJU-40) y las correcciones están en `secciones/71-aju-repaso.md` y en `AUDITORIA-APP.md`.

| id de captura | ruta | componente | referencia | veredicto |
|---|---|---|---|---|
| programadas__lista | /programadas | `(finn)/programadas/pantalla.tsx` | 09b-programadas/lista | MAS-101, 102, 103, 104, 105, 106, 107, 115 |
| programadas__lista-7-dias | /programadas?horizonte=7 | pantalla.tsx | 09b-programadas/lista | MAS-101 |
| programadas__desactivada | /programadas | programadas/activar.tsx | 09b-programadas/lista | MAS-108 |
| programadas__vacia | /programadas | pantalla.tsx | 09b-programadas/vacia | MAS-104, 109 |
| programadas__lista-sin-modelo | /programadas | pantalla.tsx | 09b-programadas/lista | **no capturado**: la «Cuota sin modelo» exige una cuota con registro automático cuyo préstamo no tenga modelo; las operaciones de semilla (OP-42) solo crean gastos y el servidor rechaza crearla (`registro_automatico_sin_modelo`). Por código: el aviso existe (`pantalla.tsx:152`) pero sin la acción «Agregar condiciones» (MAS-110) |
| programada__nueva | /programadas/nueva | `flujos/programadas-nueva/formulario.tsx` | SIN DISEÑO (FALTANTES programada-nueva) | MAS-111, 112, 113, 114, 117, 118 |
| programada__editar | /programadas/[id] | `flujos/programadas-programada/lector.tsx` | 09b-programadas/editar | MAS-111, 112, 113, 114, 115, 116, 117, 118 |
| programada__editar-sin-historial | /programadas/[id] | lector.tsx | 09b-programadas/editar (sin estado propio) | sin diseño del estado editable; mismos MAS-111 a 118 |
| programada__ocurrencia | /programadas/[id]/ocurrencias/[fecha] (hoja desde la lista) | `flujos/programadas-ocurrencias-fecha-esperada/formulario.tsx` | 09b-programadas/ocurrencia | MAS-103, 119, 120 |
| programada__ocurrencia-pagina | ídem, URL directa | `(finn)/programadas/[id]/ocurrencias/[fecha]/page.tsx` | 09b-programadas/ocurrencia | MAS-119, 120, 121 |
| programada__ocurrencia-resuelta | ídem, ya registrada | `…/resuelta.tsx` | 09b-programadas/ocurrencia-resuelta | MAS-121, 122 |
| programada__ocurrencia-registrada | resultado de «Registrar» | formulario.tsx | 09b-programadas/ocurrencia-resuelta | bien (resultado en la hoja con «Ver transacción») |
| programada__ocurrencia-omitida | resultado de «Omitir» | formulario.tsx | SIN DISEÑO | ver Sin diseño |
| por-cobrar__lista | /por-cobrar | `(finn)/por-cobrar/pantalla.tsx` | 09c-por-cobrar/lista | MAS-123, 124, 125, 126, 127 |
| por-cobrar__lista-a7 | /por-cobrar | pantalla.tsx | 09c-por-cobrar/lista | MAS-123, 124, 125 |
| por-cobrar__vacia | /por-cobrar | pantalla.tsx | 09c-por-cobrar/vacia | MAS-123 (la tarjeta de totales no aparece vacía: bien); resto igual |
| por-cobrar__cerrados | /por-cobrar?cerrados=1 | pantalla.tsx | SIN DISEÑO (FALTANTES cerrados) | ver Sin diseño |
| por-cobrar__cobrar | /por-cobrar/cobrar?linea= | `flujos/por-cobrar-cobrar/formulario.tsx` | 09c-por-cobrar/cobrar | MAS-128, 129 |
| por-cobrar__condonar | hoja `@superpuesto/(.)por-cobrar/condonar/[lineaId]` | page.tsx | 09c-por-cobrar/condonar | bien (hoja, campos, botones iguales a la referencia) |
| por-cobrar__renombrar | /por-cobrar/deudores/[id]/renombrar | `por-cobrar/deudores/[deudorId]/renombrar/page.tsx` | 09c-por-cobrar/renombrar-repetido | MAS-128 |
| por-cobrar__renombrar-repetido | ídem con «Ana» | ídem | 09c-por-cobrar/renombrar-repetido | MAS-128; el error tiene las tres señales: bien |
| reglas__lista | /reglas | `(finn)/reglas/pantalla.tsx` | 09d-reglas/lista | MAS-131 |
| reglas__sin-coincidencias | /reglas (buscar) | pantalla.tsx | SIN DISEÑO | ver Sin diseño |
| reglas__vacia | /reglas | pantalla.tsx | 09d-reglas/vacia | bien |
| regla__nueva-vacia | /reglas/nueva | `flujos/reglas-nueva/formulario.tsx` | 09d-reglas/nueva | MAS-129b, 130 |
| regla__nueva | /reglas/nueva (llena) | formulario.tsx | 09d-reglas/nueva | MAS-129b, 130, 133 |
| regla__nueva-repetida | /reglas/nueva | formulario.tsx | 09d-reglas/nueva-repetida | MAS-129b, 130; error con tres señales: bien |
| regla__editar | /reglas/[reglaId] | `flujos/reglas-regla/lector.tsx` | SIN DISEÑO (la referencia más cercana es «nueva») | ver Sin diseño |
| regla__eliminar-confirmar | /reglas/[reglaId] | lector.tsx | SIN DISEÑO | ver Sin diseño |
| notificaciones__lista | /notificaciones | `(finn)/notificaciones/contenido.tsx` | 10-notificaciones/lista | MAS-134, 135, 136, 137, 138 |
| notificaciones__solo-sin-leer | /notificaciones?no-leidas=1 | contenido.tsx | 10-notificaciones/lista | MAS-134, 136 |
| notificaciones__marcar-todo | /notificaciones | marcar-todo.tsx | 10-notificaciones/todo-leido | MAS-134, 136 |
| notificaciones__todo-leido | /notificaciones | contenido.tsx | 10-notificaciones/todo-leido | MAS-134, 135, 136 |
| notificaciones__vacia | /notificaciones | pantalla.tsx | 10-notificaciones/vacia | MAS-134, 138 |
| notificaciones__panel | /notificaciones (panel desde la campana) | `@superpuesto/(.)notificaciones/page.tsx` | K5 panel (es de otro agente) | solo capturado como contexto |
| ajustes__indice | /ajustes | `(finn)/ajustes/page.tsx`, `lista-ajustes.tsx` | entrega-3/16-salir/ajustes-indice | AJU-01, 02, 03, 04, 05 |
| ajustes__indice-primeros-pasos-ocultos | /ajustes | recordatorio-primeros-pasos.tsx | 11-ajustes/indice | bien (tarjeta y botón tonal); AJU-01, 03 en la lista |
| ajustes__indice-sin-cuentas | /ajustes | page.tsx | 11-ajustes/indice | AJU-01 |
| ajustes__indice-respaldo-al-dia / -atrasado | /ajustes | lista-ajustes.tsx | ajustes-indice | AJU-04 |
| ajustes__cargando | proxy `/pruebas/estados/carga` | `ajustes/loading.tsx` (re-exporta el de `(finn)`) | SIN DISEÑO | proxy: el loading de todas las subpáginas es el mismo bloque global; sin referencia en esta sección |
| ajustes__error | proxy `/pruebas/estados/error` | `(finn)/error.tsx` | 14-sin-conexion-404-y-error | es del marco (otro agente) |
| ajustes-ciclo__principal / __aviso | /ajustes/ciclo | `flujos/ajustes-ciclo/panel.tsx` | 11-ajustes/ciclo | AJU-06, 07 |
| ajustes-conectar-sms__sin-token / token-generado / con-token / cambiar | /ajustes/webhook | `ajustes/webhook/page.tsx` | 11-ajustes/conectar-sms | AJU-06, 08, 09 |
| ajustes-formatos__lista | /ajustes/formatos | `ajustes/formatos/lista.tsx` | 11-ajustes/formatos | AJU-06, 10 |
| ajustes-formatos__detalle / __nuevo | /ajustes/formatos/[id], /nuevo | `formatos/[formatoId]/page.tsx`, `nuevo/page.tsx` | SIN DISEÑO (FALTANTES formato-nuevo) | ver Sin diseño |
| ajustes-instituciones__lista | /ajustes/instituciones | `instituciones/lista.tsx` | 11-ajustes/formatos (la referencia las pone al pie de formatos) | AJU-06, 11 |
| ajustes-instituciones__detalle / __nueva / __nueva-repetida | /ajustes/instituciones/… | `instituciones/…/page.tsx` | SIN DISEÑO (FALTANTES institucion) | ver Sin diseño |
| ajustes-notificaciones__concedido | /ajustes/notificaciones | `ajustes/notificaciones/panel.tsx` | 11-ajustes/notificaciones | AJU-12 |
| ajustes-notificaciones__sin-pedir | ídem | panel.tsx | SIN DISEÑO (FALTANTES permiso-push) | ver Sin diseño |
| ajustes-notificaciones__denegado | ídem | panel.tsx | SIN DISEÑO | advertencia con tres señales: bien; ver Sin diseño |
| ajustes-seguridad__un-factor | /ajustes/seguridad | `seguridad/lista-factores.tsx`, `sesiones.tsx` | entrega-3/16-salir/seguridad-factor-unico | AJU-14, 16, 18 |
| ajustes-seguridad__dos-factores | ídem con respaldo verificado | lista-factores.tsx | 11-ajustes/seguridad | AJU-16, 18 |
| ajustes-seguridad__inscripcion-sin-terminar | ídem | lista-factores.tsx | 11-ajustes/seguridad | bien en estructura (texto «Inscripción sin terminar»); AJU-16 |
| ajustes-seguridad__quitar-un-factor | /ajustes/seguridad/factores/[id]/quitar con un factor | `flujos/ajustes-seguridad-factores-quitar/formulario.tsx` | DECISIONES: no existe | AJU-15 |
| ajustes-seguridad__quitar-factor | ídem con dos factores | formulario.tsx | SIN DISEÑO (FALTANTES factor-quitar) | AJU-23; ver Sin diseño |
| ajustes-seguridad__agregar-factor / __agregar-factor-codigo-malo | /ajustes/seguridad/factores/nuevo | `flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx` | SIN DISEÑO (FALTANTES factor-nuevo) + DECISIONES (6 casillas) | AJU-17 |
| ajustes-exportar__principal | /ajustes/exportar | `ajustes/exportar/page.tsx`, `descargas.tsx` | 11-ajustes/exportar | AJU-06, 19 |
| ajustes-respaldo__sin-respaldo / al-dia / atrasado | /ajustes/respaldo | `ajustes/respaldo/page.tsx` | 11-ajustes/respaldo | AJU-06, 20 |
| ajustes-diagnostico__sin-eventos / con-referencia / sin-resultados / tareas-ejecutadas | /ajustes/diagnostico | `diagnostico/panel.tsx` | 11-ajustes/diagnostico | AJU-06, 21 |
| ajustes-apariencia__sistema / claro / oscuro | /ajustes/apariencia | `apariencia/panel.tsx`, `pagina.tsx` | 11-ajustes/apariencia | AJU-06, 22, 24 |
| reprocesar (FALTANTES) | — | — | — | no capturado: no pertenece a estas pantallas (nace del flujo de un movimiento no reconocido) |

No capturado además: estado de error de red / sin conexión de cada pantalla (es el aviso global del marco, ya cubierto por otro agente) y los estados de "cargando" propios (no existe uno propio: todos usan el `loading.tsx` global, ver `ajustes__cargando`).

## Responsive (360, 768 y 1024)

38 pantallas alcanzables por URL, con la semilla de A.7, en los tres anchos: `capturas/resp-<pantalla>__a7__ancho-<n>.png`. Sin desplazamiento horizontal salvo `resp-categoria__a7__ancho-768` (GLO-06). A 768 px todas usan el marco de computadora con 424 px útiles (GLO-05). `resp-transaccion__a7` no se capturó: Actividad no expone el detalle como enlace `/actividad/<id>` en la lista sembrada.

## Movimiento, foco y arrastre

| Qué | Evidencia | Veredicto |
|---|---|---|
| Navegación entre pantallas, Registrar, hojas, panel de notificaciones, Asignar | `videos/navegacion__*.webm`, `movimiento/navegacion__*.json` | GLO-01, GLO-02, GLO-03 |
| Bandeja: entrada y aprobar con un toque | `videos/bandeja__*.webm`, `movimiento/bandeja__*.json` | GLO-04; el resultado en el lugar, bien |
| Código de verificación (escribir, error, pegar) | `videos/codigo__*.webm`, `movimiento/codigo__*.json` | ACC-01 (no hay casillas ni animación) |
| Arrastrar un movimiento a una categoría | `videos/arrastre__*.webm`, `capturas/bandeja__arrastre-*__video*.png` | SIN DISEÑO (GLO-13) |
| `prefers-reduced-motion: reduce` | `movimiento/*__reducido.json` | bien: nada se anima |
| Foco con teclado en 14 pantallas | `foco/*.json` | GLO-07, GLO-08 |
