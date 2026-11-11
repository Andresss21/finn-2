# Auditoría de diseño · ACC (acceso) y GLO (marco) · recorrido de usuario nuevo

Casos: `tools/auditoria/casos/10-acc-glo.cap.ts` (153 pruebas, 3 variantes, todas verdes) y `11-recorrido-nuevo.cap.ts` (32 pasos, `telefono-claro`). Capturas en `docs/auditoria-diseno/capturas/<id>__<variante>.png`; análisis en `analisis/<id>.md`. Los ids con `__` van sin variante. Referencias bajo `docs/diseno/`.

Único cambio a un caso: en `11-recorrido-nuevo.cap.ts` el paso 29 buscaba el enlace `/Gasto/` en el selector de Registrar y esperaba 8 minutos; el enlace se llama «Un gasto…». Ahora busca `/Un gasto/`. El recorrido llega al final (32/32). El caso se salta a propósito en `computadora-claro`.

## Inventario

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

## Hallazgos

### ACC-01 · El código de verificación es un campo único, no 6 casillas — Verificar · todas · crítica
- **Se ve:** `capturas/acceso__verificar-vacio__telefono-claro.png`: un solo campo de texto de ancho completo («Código», `EntradaTexto`, `inputMode="numeric"`). No avanza por casilla, no reparte el pegado, no se verifica sola: el recorrido (`recorrido__03-inicio-primeros-pasos`) tuvo que tocar «Verificar» a mano. Hay temblor (`fz-jitter` 380 ms, medido en `acceso__codigo-incorrecto`) pero sobre el campo.
- **Debería:** DECISIONES, fila «Código de verificación (TOTP)»: 6 casillas de 44 × 52; escribir avanza, pegar reparte, Retroceso vuelve, se verifica sola al sexto dígito; casilla llena con línea de 3 px `--accion`, sube 2 px y pop; error: tiembla 380 ms y `--problema-borde`; correcto: `--positivo-fondo` en cascada de 40 ms, check con pop y sigue a los 650 ms. Referencia visual: `02-referencias/entrega-2/pantallas/13-acceso/verificar__telefono-claro.png`.
- **Arreglo:** componente nuevo `CodigoDeSeisCasillas` en `apps/web/src/componentes/formularios/` (un `input` por casilla con `inputMode="numeric"`, `autoComplete="one-time-code"` en la primera, grupo con `role="group"` y etiqueta «Código»), usado por `app/ingresar/verificar/formulario-verificar.tsx` en lugar de `EntradaTexto`. Tiempos como tokens (`--duracion-temblor`, `--retardo-cascada`, `--duracion-confirmacion`, hoy propuestos).
- **Cómo verificar:** pegar «482193» llena las 6 y envía sola; Retroceso en casilla vacía vuelve a la anterior; con código errado el grupo tiembla 380 ms y las 6 casillas quedan en `--problema-borde`; con `prefers-reduced-motion` no se anima.

### ACC-02 · Inscribir y agregar factor tampoco tienen las 6 casillas — Inscribir · todas · crítica
- **Se ve:** `capturas/acceso__inscribir__telefono-claro.png` y `acceso__inscribir-codigo-incorrecto__telefono-claro.png`: campo único «Código» con botón «Confirmar». `/ingresar/inscribir` y «Agregar un factor de respaldo» usan el mismo componente (`flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx:226`, `EntradaTexto`).
- **Debería:** igual que ACC-01 (DECISIONES cita explícitamente inscribir, verificar y agregar factor).
- **Arreglo:** usar el mismo `CodigoDeSeisCasillas` en `inscribir-factor.tsx`.
- **Cómo verificar:** mismos criterios de ACC-01 en `/ingresar/inscribir` y `/ajustes/seguridad/factores/nuevo`.

### ACC-03 · El error del código sale como aviso arriba del campo, no en línea bajo las casillas — Verificar e inscribir · todas · alta
- **Se ve:** `capturas/acceso__codigo-incorrecto__telefono-claro.png` y `acceso__codigo-vencido__…`: aviso en caja `--problema-fondo` entre la introducción y el campo; el campo queda con el anillo de foco azul, sin `--problema-borde`; el código escrito se borra.
- **Debería:** `13-acceso/codigo-incorrecto__telefono-claro.png` y `codigo-vencido__…`: sin caja; mensaje en línea debajo de las casillas con glifo `problema` y texto en `--problema-texto`; las casillas conservan los dígitos y toman `--problema-borde` (DECISIONES, fila TOTP).
- **Arreglo:** el mensaje pasa a `error` del componente de casillas (patrón de campo con error, PANTALLAS §2.2), no a `AvisoEnLinea`; no limpiar los dígitos al fallar. Archivos: `formulario-verificar.tsx`, `inscribir-factor.tsx`.
- **Cómo verificar:** tras un código incorrecto, el texto aparece bajo las casillas en `--problema-texto` con glifo, las casillas con borde `--problema-borde`, sin caja de fondo.

### ACC-04 · El título de Ingresar no usa voseo — Ingresar · todas · media
- **Se ve:** `capturas/acceso__ingresar__telefono-claro.png`: «INGRESAR».
- **Debería:** `13-acceso/ingresar__telefono-claro.png`: «INGRESÁ» (DECISIONES regla 4, voseo).
- **Arreglo:** `apps/web/src/textos/ingreso.ts:3`, `tituloIngresar: 'Ingresá'`.
- **Cómo verificar:** el `h1` de `/ingresar` dice «Ingresá».

### ACC-05 · Título e introducción de Verificar difieren de la referencia — Verificar · todas · baja
- **Se ve:** «VERIFICÁ TU CÓDIGO» / «Escribí el código de 6 dígitos que muestra tu app de autenticación.» y etiqueta visible «Código».
- **Debería:** `13-acceso/verificar__telefono-claro.png`: «CÓDIGO DE VERIFICACIÓN» / «Escribí el código de 6 dígitos de tu app de autenticación.»; sin etiqueta visible sobre las casillas.
- **Arreglo:** `textos/ingreso.ts:14-15`; la etiqueta pasa a `aria-label` del grupo.
- **Cómo verificar:** textos idénticos a la referencia.

### ACC-06 · En computadora el acceso no está en una tarjeta centrada — Acceso y página sin conexión · computadora-claro · alta
- **Se ve:** `capturas/acceso__verificar-vacio__computadora-claro.png`, `acceso__ingresar__computadora-claro.png`, `estado__sin-conexion-pagina__computadora-claro.png`: columna de 448 px alineada arriba (`main` en y≈64) sobre el fondo, sin contenedor.
- **Debería:** `13-acceso/verificar__computadora-claro.png` y `14-…/sin-conexion-pagina__computadora-claro.png`: tarjeta `--superficie` de unos 420 px con radio de contenedor y elevación, centrada en vertical y horizontal (INDICE-entrega-2 «13 · Acceso»: «tarjeta en computadora»).
- **Arreglo:** `app/ingresar/layout.tsx` (hoy `mx-auto flex min-h-dvh max-w-md … pt-16`) y `app/sin-conexion/layout.tsx`: a partir de `md`, centrar y envolver en un contenedor con `bg-superficie rounded-contenedor shadow-elevacion-…` y padding de 40 px (tokens).
- **Cómo verificar:** a 1440 × 900 la tarjeta queda centrada; en teléfono sigue sin tarjeta con 24 px laterales.

### ACC-07 · Marca de acceso distinta a la de la referencia — Acceso · todas · media
- **Se ve:** cuadro oscuro redondeado con la «F» y «FINN» de 22 px, peso 700 (analizar: tamaño 22≠32, peso 700≠800, interlineado 25.3≠33.6), `capturas/acceso__ingresar__telefono-claro.png`.
- **Debería:** `13-acceso/ingresar__telefono-claro.png`: símbolo «F apilada» sin cuadro + «FINN» en Big Shoulders de 32 px, 800 (DECISIONES D1–D4: «barra lateral con el símbolo F apilada»).
- **Arreglo:** `apps/web/src/componentes/marco/marca.tsx` con variante `acceso` (símbolo a 32 px, wordmark con el rol `titulo-pantalla`).
- **Cómo verificar:** wordmark medido a 32 px / 800; símbolo sin cuadro.

### ACC-08 · «Mostrar contraseña» es un enlace centrado inventado — Ingresar · todas · media
- **Se ve:** `acceso__ingresar__telefono-claro.png` y `acceso__ingresar-contrasena-visible__…`: enlace azul «Mostrar contraseña» de ancho completo entre el campo y el botón; empuja el botón 80 px (y=810 contra 700 en la referencia).
- **Debería:** la referencia no tiene control para mostrar la contraseña (SIN DISEÑO para el control).
- **Arreglo:** si se conserva, ícono `eye` de 44 × 44 dentro del campo (patrón PANTALLAS §2.2) con `aria-pressed` y etiqueta «Mostrar contraseña»; `formulario-ingresar.tsx`, `textos/ingreso.ts:6`.
- **Cómo verificar:** botón «Ingresar» a 16 px del campo, como en la referencia.

### ACC-09 · Párrafo de «sin registro ni recuperación» inventado y con jerga técnica — Ingresar · todas · media
- **Se ve:** «Finn no tiene registro ni recuperación de contraseña en la app. Si la perdiste, seguí el procedimiento del repositorio.» bajo el botón en todas las capturas de Ingresar (`textos/ingreso.ts:13`).
- **Debería:** la referencia no tiene el párrafo; «alta de usuario» y «olvidé mi contraseña» están en FALTANTES sin diseño. «Repositorio» no es lenguaje para quien usa la app.
- **Arreglo:** retirar el párrafo o diseñarlo (FALTANTES `alta-usuario`, `olvide`) con voseo y sin jerga.
- **Cómo verificar:** Ingresar coincide con la referencia (título, 2 campos, botón).

### ACC-10 · Con «demasiados intentos» el botón Ingresar sigue activo — Ingresar · todas · media
- **Se ve:** `capturas/acceso__demasiados-intentos__telefono-claro.png`: botón azul activo.
- **Debería:** `13-acceso/demasiados-intentos__telefono-claro.png`: botón deshabilitado (`--superficie-hundida`, texto `--texto-deshabilitado`) (PANTALLAS §2.1).
- **Arreglo:** deshabilitar con `disabled` mientras dure el bloqueo en `formulario-ingresar.tsx` (con el motivo ya visible en el aviso).
- **Cómo verificar:** tras el aviso de demasiados intentos, el botón no responde y se ve deshabilitado.

### ACC-11 · Credenciales inválidas: el campo contraseña no toma el borde de error — Ingresar · todas · media
- **Se ve:** `capturas/acceso__credenciales-invalidas__telefono-claro.png`: el aviso está, ambos campos con la línea gris normal.
- **Debería:** `13-acceso/credenciales-invalidas__telefono-claro.png`: el campo Contraseña con borde de 2 px `--problema-borde` (PANTALLAS §2.2, error).
- **Arreglo:** pasar `invalido` al campo de contraseña cuando el error es de credenciales (`formulario-ingresar.tsx:99`).
- **Cómo verificar:** borde de 2 px `--problema-borde` en Contraseña.

### ACC-12 · Inscribir: QR y secreto sin la composición de la referencia, y secreto en fuente monoespaciada — Inscribir · todas · media
- **Se ve:** `capturas/acceso__inscribir__telefono-claro.png`: QR suelto sobre el fondo (sin tarjeta), rótulo «Secreto» y la clave en `ui-monospace` (el análisis marca familia ajena) con «Copiar» tonal sin ícono, sin contenedor.
- **Debería:** `13-acceso/inscribir__telefono-claro.png`: QR en tarjeta blanca de radio de contenedor, y la clave en un contenedor `--superficie` con elevación, en Archivo con espaciado, con «Copiar» tonal con ícono `copy` (el ícono de «copiado»: `check`).
- **Arreglo:** `inscribir-factor.tsx:188` (`font-mono` → rol tipográfico de cifra/etiqueta con `tracking`), envolver QR y clave en el contenedor estándar.
- **Cómo verificar:** sin fuentes fuera de los tokens; QR y clave en contenedores.

### ACC-13 · Inscribir: textos distintos a la referencia — Inscribir · todas · baja
- **Se ve:** «Escaneá el código QR con tu app de autenticación. También podés copiar el secreto y guardarlo en tu gestor de contraseñas.», etiqueta «Código», botón «Confirmar».
- **Debería:** «Escaneá el código con tu app de autenticación o copiá la clave.», etiqueta «Código de la app» con placeholder «6 dígitos» (hasta que lleguen las casillas) y botón «Verificar y entrar».
- **Arreglo:** `textos/ingreso.ts` (bloque inscribir).
- **Cómo verificar:** textos idénticos.

### ACC-14 · Inscribir y su cierre usan un título más grande que el resto del acceso — Inscribir · todas · media
- **Se ve:** «PROTEGÉ TU CUENTA» y «TU CUENTA QUEDÓ PROTEGIDA» a ≈ 2rem (alto de mayúsculas ≈ 60 px a 2×) frente a «INGRESAR» y «VERIFICÁ TU CÓDIGO» a 1.625rem, en `capturas/acceso__inscribir__…` y `acceso__inscribir-cierre__…`.
- **Debería:** `13-acceso/inscribir__telefono-claro.png`: mismo título que Ingresar y Verificar (`titulo-pantalla-hija`, 1.625rem).
- **Arreglo:** unificar el rol del `h1` en `inscribir-factor.tsx` con el de `formulario-verificar.tsx`.
- **Cómo verificar:** los 4 títulos del acceso miden lo mismo.

### ACC-15 · Cierre de inscripción sin el aviso positivo y con «Seguir» como enlace — Inscribir (cierre) · todas · alta
- **Se ve:** `capturas/acceso__inscribir-cierre__telefono-claro.png`: título «TU CUENTA QUEDÓ PROTEGIDA», texto «Te recomendamos agregar un factor de respaldo…», botón tonal «Agregar un factor de respaldo» y enlace «Seguir».
- **Debería:** `13-acceso/inscribir-cierre__telefono-claro.png`: aviso positivo (`--positivo-fondo`, check) «Factor verificado / Listo: tu autenticador quedó inscrito.», texto «Te conviene agregar un factor de respaldo por si perdés el teléfono.», tonal «Agregar un factor de respaldo» y botón principal «Seguir a Finn». Un enlace donde va el botón principal de la pantalla es el error de componente de §2.1; además el cierre es el momento en que DECISIONES pide el check con pop.
- **Arreglo:** `inscribir-factor.tsx` (rama de cierre) + `textos/ingreso.ts:36`: `AvisoEnLinea estado="positivo"` y `Boton` principal.
- **Cómo verificar:** composición idéntica a la referencia, con `role="status"` en el aviso.

### ACC-16 · Varios factores: lista de radios en lugar del selector de la referencia — Verificar · todas · media
- **Se ve:** `capturas/acceso__verificar-varios-factores__telefono-claro.png`: dos filas con círculo de radio «Factor 1» y «Respaldo», todas visibles; el campo de código debajo con rótulo.
- **Debería:** `13-acceso/verificar-varios-factores__telefono-claro.png`: selector (PANTALLAS §2.2) con ícono `lock` y chevrón, valor «Autenticador», y las casillas debajo.
- **Arreglo:** `formulario-verificar.tsx` (bloque de factor): `Selector` del sistema de campos; nombres de factor con el nombre del factor, no «Factor 1».
- **Cómo verificar:** con 2 factores se ve un selector de 48 px; abierto, lista con `--superficie-elevada` y `check` en la activa.

### ACC-17 · Dos botones sin nombre accesible en «varios factores» — Verificar · todas · baja
- **Se ve:** el análisis `acceso__verificar-varios-factores.md` marca 2 `button` sin nombre accesible (en x = 36, y = 250 y 298).
- **Debería:** DECISIONES regla 6 y PANTALLAS §11: todo control con etiqueta.
- **Arreglo:** dar `aria-label` o asociar la fila al `radiogroup` en `formulario-verificar.tsx`.
- **Cómo verificar:** el análisis ya no marca tocables sin nombre.

### ACC-18 · Ingresar sin conexión muestra un aviso de problema y deja el botón activo — Ingresar · todas · media
- **Se ve:** `capturas/acceso__ingresar-sin-conexion__telefono-claro.png`: «Estás sin conexión. No se envió nada; intentá de nuevo cuando vuelva la conexión.» en aviso de problema con el botón activo.
- **Debería:** SIN DISEÑO propio; DECISIONES (Estados de Salir) fija el patrón para un envío sin conexión: control deshabilitado con el motivo «Sin conexión: no se puede …».
- **Arreglo:** `formulario-ingresar.tsx`: deshabilitar con `useConexion` y motivo bajo el botón (§2.1).
- **Cómo verificar:** offline, el botón queda deshabilitado con su motivo; sin aviso de problema.

### ACC-19 · Sesión vencida: la pantalla es idéntica a Ingresar y no avisa — Ingresar · todas · media
- **Se ve:** `capturas/acceso__sesion-vencida__telefono-claro.png`: Ingresar vacío, sin ninguna indicación de que la sesión venció.
- **Debería:** SIN DISEÑO (FALTANTES `sesion-vencida`); como mínimo, un aviso en línea de advertencia.
- **Arreglo:** diseñar el estado; hasta entonces un `AvisoEnLinea estado="advertencia"` con voseo.
- **Cómo verificar:** al llegar por sesión vencida se ve el motivo.

### GLO-101 · «Salir» no está en la hoja Más secciones — Hoja Más secciones · telefono-claro · telefono-oscuro · crítica
- **Se ve:** `capturas/pliegue/marco__mas-secciones-abierta__telefono-claro.png`: Reportes, Metas, Programadas, Por cobrar, Reglas, Notificaciones (2), Ajustes y nada más.
- **Debería:** `entrega-3/pantallas/16-salir/mas-secciones__telefono-claro.png` y DECISIONES entrega 3 («Salir (cerrar sesión)»): última fila separada por una franja `--superficie-hundida` de 8 px, ícono `logout`, sin flecha, color `--texto`.
- **Arreglo:** `apps/web/src/componentes/navegacion/secciones.ts` y `hoja-diferida.tsx`: fila de acción (no `Link`) que invoca `salir()`; con los estados saliendo/error/sin conexión de GLO-108; ícono `logout` nuevo en el juego de íconos.
- **Cómo verificar:** última fila «Salir» de 52 px tras la franja; sale directo a `/ingresar`.

### GLO-102 · «Salir» no está al pie de la barra lateral — Barra lateral · computadora-claro · crítica
- **Se ve:** `capturas/pliegue/marco__pestana__computadora-claro.png`: la lista termina en «Ajustes»; ni correo ni Salir.
- **Debería:** `entrega-3/pantallas/16-salir/mas-secciones__computadora-claro.png`: al pie, bajo una línea `--borde-sutil`, el correo de la sesión y la fila «Salir».
- **Arreglo:** `componentes/marco/marco.tsx` (barra lateral): pie con el correo (de la sesión, no del cliente) y la misma acción de GLO-101.
- **Cómo verificar:** a 1440 px, el pie queda fijo abajo con correo y Salir.

### GLO-103 · Ajustes no tiene la tarjeta «Salir» — Ajustes · todas · alta
- **Se ve:** `capturas/pliegue/marco__ajustes__telefono-claro.png`: 10 filas y nada debajo.
- **Debería:** `entrega-3/pantallas/16-salir/ajustes-indice__telefono-claro.png`: tarjeta propia debajo de la lista, «Salir» con «{correo} · en este dispositivo».
- **Arreglo:** `app/(finn)/ajustes/page.tsx`: tarjeta con fila de acción.
- **Cómo verificar:** la tarjeta aparece bajo la lista, con el correo de la sesión.

### GLO-104 · El enlace «Salir» sigue en Seguridad — Seguridad · todas · media
- **Se ve:** `capturas/salir__seguridad__telefono-claro.png` y `…__computadora-claro.png`: enlace azul centrado «Salir» al fondo de la página.
- **Debería:** DECISIONES entrega 3: Seguridad ya no lo lleva (`16-salir/seguridad__*`).
- **Arreglo:** quitarlo de `app/(finn)/ajustes/seguridad/sesiones.tsx`.
- **Cómo verificar:** `/ajustes/seguridad` sin «Salir».

### GLO-105 · Con borradores, «Salir» sale directo y los borra sin avisar — Seguridad · todas · crítica
- **Se ve:** `docs/auditoria-diseno/medidas/_salir-con-borradores__telefono-claro.txt`: con 2 borradores (`finn:borrador:v1:/registrar/gasto` y `/cuentas/nueva`) tras tocar «Salir» la URL es `/ingresar` y `borradoresQueQuedan: 0`. No hay hoja ni panel.
- **Debería:** DECISIONES entrega 3, «Tenés N cambios sin enviar»: hoja inferior (teléfono) o panel de 440 px (computadora) con N, lista de borradores (flujo, detalle, hora), «Seguir» por borrador, «Quedarme» (tonal) y «Salir y borrarlos» en `--peligro`; con uno: «Tenés 1 cambio sin enviar» y «Salir y borrarlo». Referencias: `16-salir/cambios-sin-enviar__*`, `cambios-sin-enviar-uno__*`, `cambios-saliendo__*`, `cambios-error__*`.
- **Arreglo:** flujo corto nuevo en `componentes/navegacion/` que lee las claves `finn:borrador:v1:*` y se abre antes de invocar `salir()`; es el único camino destructivo y debe usar `--peligro`.
- **Cómo verificar:** con 2 borradores, Salir abre la hoja; «Quedarme» la cierra sin tocar nada; «Salir y borrarlos» borra y sale.

### GLO-106 · Hoja Más secciones: la superficie y la capa no se pueden confirmar sin la fila de Salir — Hoja Más secciones · telefono-claro · baja
- **Se ve:** la hoja cubre la barra inferior (bien) y sus filas miden 52 px con contador «2» (bien), pero termina en «Ajustes» (`capturas/pliegue/marco__mas-secciones-abierta__telefono-claro.png`); la última fila tiene el espacio bajo ella más ajustado que la referencia (≈ 20 px contra 48 en `mas-secciones__telefono-claro.png`).
- **Debería:** `16-salir/mas-secciones__telefono-claro.png`: 48 px de aire final tras la fila Salir (zona segura).
- **Arreglo:** padding inferior de la hoja en `hoja-diferida.tsx` con `--despeje-barra-inferior`.
- **Cómo verificar:** última fila a 48 px del borde inferior.

### GLO-107 · Íconos: «Ajustes» y «Apariencia» siguen con el dibujo de sol — Hoja Más secciones, barra lateral, Ajustes · todas · media
- **Se ve:** el ícono de «Ajustes» es un sol de rayos (`capturas/pliegue/marco__mas-secciones-abierta__telefono-claro.png`, barra lateral de `marco__pestana__computadora-claro.png`, fila Apariencia de `marco__ajustes__telefono-claro.png`).
- **Debería:** entrega 3, «Íconos»: `gear` redibujado como engranaje de 8 dientes; `sun` queda para Apariencia; `logout` nuevo.
- **Arreglo:** actualizar los SVG del juego de íconos (`docs/diseno/entrega-3/iconos/`) en el sistema de íconos de la app y usar `gear` en Ajustes.
- **Cómo verificar:** «Ajustes» con engranaje en las tres ubicaciones; «Apariencia» con `sun`.

### GLO-108 · Estados de Salir: sin conexión no deshabilita el control — Seguridad (futuro marco) · todas · alta
- **Se ve:** `capturas/salir__sin-conexion-tras-tocar__telefono-claro.png`: offline el enlace «Salir» sigue activo; al tocarlo aparece un aviso de problema «Estás sin conexión. No se envió nada; intentá de nuevo cuando vuelva la conexión.». «Saliendo…» (`salir__saliendo__…`) existe como botón con texto.
- **Debería:** DECISIONES entrega 3, «Estados de Salir»: saliendo con indicador giratorio y «Saliendo…» con `aria-busy`; sin conexión: Salir deshabilitado con «Sin conexión: no se puede salir ahora.»; referencias `16-salir/mas-secciones-sin-conexion__*`, `-saliendo__*`, `-error__*`.
- **Arreglo:** acción de Salir compartida (hoja, barra lateral, Ajustes) con `useConexion` y el motivo.
- **Cómo verificar:** offline, Salir se ve deshabilitado con el texto exacto; el envío no se intenta.

### GLO-109 · El aviso «Estás sin conexión» tapa el contenido — Marco · todas · alta
- **Se ve:** `capturas/estado__sin-conexion-en-la-app__telefono-claro.png`, `salir__sin-conexion-tras-tocar__telefono-claro.png` y `pliegue/marco__mas-secciones-sin-conexion__…`: barra oscura `fixed top-16` (`componentes/marco/marco.tsx:124`) sobre el contenido: oculta la etiqueta «LISTO PARA ASIGNAR» y el título «FACTORES» de Seguridad.
- **Debería:** `14-…/sin-conexion-en-la-app__telefono-claro.png`: el aviso ocupa su lugar en el flujo, bajo el título, y el contenido baja; no tapa nada.
- **Arreglo:** en `marco.tsx:124` pasar de `fixed` a un bloque dentro del flujo (o reservar su alto en el contenido).
- **Cómo verificar:** con el aviso visible ningún texto queda cubierto.

### GLO-110 · El aviso global usa 16 px laterales, no 20 — Marco · telefono-claro · baja
- **Se ve:** `marco.tsx:124`, `inset-x-4`: x = 16 (medido en `estado__sin-conexion-en-la-app__telefono-claro`); lo mismo en el aviso de PWA (GLO-124).
- **Debería:** DECISIONES, Marco: 20 px laterales.
- **Arreglo:** `inset-x-5` o, mejor, dejarlo en el flujo (GLO-109).
- **Cómo verificar:** 20 px a cada lado.

### GLO-111 · «Registrar» pierde su etiqueta a 390 px — Barra superior · telefono-claro · telefono-oscuro · alta
- **Se ve:** `capturas/pliegue/marco__pestana__telefono-claro.png`: el botón es un cuadro de 44 × 44 con «+»; medido `Registrar` 44 × 44.
- **Debería:** PANTALLAS §3.1 y `K1-Navegacion__telefono-claro.png`: ícono `plus` + «Registrar» `.t-etiqueta` 700, 44 de alto, padding `0 14 0 10` (≈ 110 px de ancho).
- **Arreglo:** `componentes/navegacion/acceso-registrar.tsx:19`: el `max-[25rem]:w-11 max-[25rem]:p-0` oculta el texto en 390 px (25 rem = 400 px). Bajar ese corte (p. ej. 22 rem) y, si no cabe el título, abreviar el título, no el botón.
- **Cómo verificar:** a 390 px el botón mide ≈ 110 × 44 con la etiqueta; el título «PRESUPUESTO» sigue en una línea (o con puntos suspensivos como en `error-de-pantalla__telefono-claro.png`).

### GLO-112 · El botón central de la Bandeja es más chico que el diseño — Barra inferior · telefono-claro · media
- **Se ve:** botón de ≈ 54 × 54 en `capturas/pliegue/marco__pestana__telefono-claro.png` (medido: tocable 54 de alto, caja 76 × 80) y sin borde de 4 px `--fondo`.
- **Debería:** PANTALLAS §3.1: 62 × 62, radio 18, borde de 4 px `--fondo`, `--elevacion-2`, sube 26 px; contador de 22 px (`K1-Navegacion__telefono-claro.png`).
- **Arreglo:** `componentes/navegacion/pestanas.tsx`.
- **Cómo verificar:** botón de 62 × 62 con borde, 26 px sobre la barra.

### GLO-113 · En una pantalla hija el título se superpone al contenido y la barra superior no lo lleva — Pantalla hija · telefono-claro · alta
- **Se ve:** `capturas/pliegue/marco__pantalla-hija__telefono-claro.png` (`/presupuesto/categorias/[id]`): la barra tiene flecha, campana y ⋯ pero no título; «SUPERMERCADO» aparece en el cuerpo montado sobre la palabra «Disponible».
- **Debería:** PANTALLAS §3.1: en pantallas hijas la flecha «Volver a <padre>» va a la izquierda del título, en la misma fila (`.t-titulo-pantalla` 1.625rem). Nada se superpone.
- **Arreglo:** `componentes/navegacion/volver-en-titulo.tsx` y `componentes/marco/proveedor-encabezado.tsx`: el título del detalle debe publicarse en la barra; el cuerpo del detalle (`apps/web/src/app/(finn)/presupuesto/categorias/[categoriaId]/`) no repite el `h1` encima del héroe. Repetir con `/cuentas/[id]` y los demás detalles.
- **Cómo verificar:** título junto a la flecha en la barra; sin solapamiento (cajas de `medidas/marco__pantalla-hija__*.json` disjuntas).

### GLO-114 · El panel de notificaciones tiene un filtro «Todas / Sin leer» que el diseño no tiene — Panel de notificaciones · todas · alta
- **Se ve:** `capturas/notificaciones-panel__con-sin-leer__telefono-claro.png`: selector segmentado «Todas | Sin leer · 2» y debajo, aparte, «Marcar todo como leído».
- **Debería:** `K1-Navegacion__notificaciones-abiertas-n7` (tablero) y PANTALLAS §2.17: una barra con «2 SIN LEER» (`.t-rotulo`) a la izquierda y «Marcar todo como leído» (`--enlace` 700) a la derecha, en una sola fila; al marcar, `check` + «Todo leído».
- **Arreglo:** `app/(finn)/@superpuesto/(.)notificaciones/page.tsx` y `marco/tarjeta-notificaciones.tsx`: quitar el segmentado y poner la barra. Si el filtro se quiere, requiere diseño.
- **Cómo verificar:** una sola fila de barra con el rótulo y el enlace.

### GLO-115 · Las notificaciones muestran fecha y hora completas, no relativas — Panel de notificaciones · todas · media
- **Se ve:** «15/10/2026 08:00», «14/10/2026 12:00»; la hora larga ocupa el ancho y parte los títulos en 2-3 líneas («Visa Oro corta el / 25/10»).
- **Debería:** `K1-…notificaciones-abiertas-n7.png`: «Hace 2 h», «Hoy 8:00», «Ayer», «13/10», `--texto-terciario`.
- **Arreglo:** formateo relativo en `tarjeta-notificaciones.tsx` (con el reloj inyectado, no `Date.now()`).
- **Cómo verificar:** títulos de una o dos líneas como la referencia.

### GLO-116 · Notificaciones en tarjetas agrupadas, no en filas planas separadas por línea — Panel de notificaciones · todas · media
- **Se ve:** cada grupo («Nuevas», «Anteriores») dentro de un contenedor `--superficie` con sombra y con el pie en otro bloque gris.
- **Debería:** `K1-…notificaciones-abiertas-n7.png`: filas directas sobre `--superficie-elevada` del panel, grupos separados por una línea `--borde-sutil`; título 700 y texto `.t-cuerpo-pequeno`.
- **Arreglo:** quitar el contenedor de grupo en `tarjeta-notificaciones.tsx`.
- **Cómo verificar:** sin sombras internas; línea de 1 px entre grupos.

### GLO-117 · El pie del panel agrega texto y le falta la agarradera — Panel de notificaciones · todas · baja
- **Se ve:** pie «… Se guardan las notificaciones de los últimos 180 días.» sin agarradera inferior.
- **Debería:** PANTALLAS §2.17: el texto «Acá llegan recordatorios y avisos de Finn. Los movimientos de tus SMS por revisar están en la Bandeja.» y, en `K1-…n7.png`, la agarradera de 40 × 4 al pie.
- **Arreglo:** `textos/navegacion.ts` (pie) y `marco/superpuesto.tsx`.
- **Cómo verificar:** pie con la frase exacta y agarradera.

### GLO-119 · 404 dentro de la app sin título en la barra y con otro texto — 404 · telefono-claro · media
- **Se ve:** `capturas/estado__404-dentro__telefono-claro.png`: barra con flecha y campana, sin título; círculo de 72 px con lupa grande; «…o que el enlace ya no sea válido.»; botón «Ir a Cuentas».
- **Debería:** `14-…/no-encontrado__telefono-claro.png`: título de la pantalla («TRANSACCIÓN») junto a la flecha; lupa chica en círculo; «…o que el enlace esté mal.»; «Ir a Actividad» (el padre).
- **Arreglo:** `app/(finn)/not-found.tsx` y `componentes/navegacion/vacios.tsx`: publicar el título, tamaño de ícono 20 px de la referencia, texto.
- **Cómo verificar:** coincide con la referencia.

### GLO-120 · Error de pantalla: ícono al lado del título y botón sin ícono — Error · telefono-claro · media
- **Se ve:** `capturas/estado__error__telefono-claro.png`: ícono `info` a la izquierda de «Algo salió mal…», tarjeta con el título del marco ausente, botón «Intentar de nuevo» sin ícono.
- **Debería:** `14-…/error-de-pantalla__telefono-claro.png` y `K4-Dominio-B__error-de-pantalla`: ícono arriba, título de la pantalla en la barra (con puntos suspensivos si no cabe), botón con ícono de reintento.
- **Arreglo:** `componentes/navegacion/error-de-pantalla.tsx`.
- **Cómo verificar:** coincide con la referencia.

### GLO-121 · Página sin conexión: texto y botón distintos — `/sin-conexion` · todas · baja
- **Se ve:** «Finn necesita internet para mostrarte tus números al día.» y botón de 168 px de alto 48; `capturas/estado__sin-conexion-pagina__telefono-claro.png`.
- **Debería:** `14-…/sin-conexion-pagina__telefono-claro.png`: «Finn necesita internet para mostrar tus datos. Cuando vuelva la conexión, intentá de nuevo.»; botón de 164 × 44.
- **Arreglo:** `app/sin-conexion/page.tsx` y `textos/navegacion.ts`.
- **Cómo verificar:** textos iguales.

### GLO-122 · El esqueleto de carga no tiene la estructura de la pantalla — Cargando · todas · media
- **Se ve:** `capturas/pliegue/estado__cargando__telefono-claro.png`: 3 bloques genéricos con radio de pastilla (completamente redondeados), 16 px laterales, sin título (`app/(finn)/loading.tsx`, `p-4`, `rounded-pastilla`).
- **Debería:** `entrega-1/componentes/K2-Base__esqueleto-de-carga__claro.html`: bloques con radio de contenedor, 20 px laterales, estructura de la pantalla (título, tarjetas, filas).
- **Arreglo:** `loading.tsx`: `px-5`, `rounded-contenedor`, formas por tipo de pantalla.
- **Cómo verificar:** laterales de 20 px; radios de contenedor.

### GLO-124 · Aviso de actualización de la PWA: sin diseño — Inicio · todas · baja
- **Se ve:** `capturas/pliegue/estado__actualizacion-pwa__telefono-claro.png`: aviso informativo «Hay una versión nueva de Finn. Recargá para continuar.» con botón «Recargar», 16 px laterales, encima del contenido.
- **Debería:** SIN DISEÑO.
- **Arreglo:** diseñarlo y llevarlo a 20 px laterales (GLO-110).
- **Cómo verificar:** con diseño, igual a la referencia.

### GLO-125 · Botón deshabilitado a ancho de contenido — Seguridad · telefono-claro · baja
- **Se ve:** `capturas/salir__sin-conexion-tras-tocar__telefono-claro.png`: «Cerrar las otras sesiones» deshabilitado se encoge a ≈ 220 px y su motivo «Sin conexión» queda debajo.
- **Debería:** PANTALLAS §2.1: el tonal mantiene su ancho (todo el ancho) al deshabilitarse; motivo en `.t-cuerpo-pequeno` (como en `14-…/sin-conexion-en-la-app` con «Guardar»).
- **Arreglo:** `sesiones.tsx`: mismo contenedor del botón en ambos estados.
- **Cómo verificar:** ancho constante.

### Recorrido de usuario nuevo (`recorrido__NN-*`)

Hallazgos de composición vistos en el camino (los otros agentes auditan a fondo esas pantallas):

### GLO-130 · «Todavía no hay categorías» convive con un grupo «Gastos» vacío — Grupos y categorías (paso 15) · telefono-claro · media
- **Se ve:** `capturas/pliegue/recorrido__15-estructura-vacia__telefono-claro.png`: vacío «TODAVÍA NO HAY CATEGORÍAS» y debajo el grupo «GASTOS» con «Este grupo no tiene categorías.» y «Nueva categoría».
- **Debería:** un solo estado vacío coherente (PANTALLAS §2.19); el grupo por defecto no debería mostrarse junto a un vacío que dice que no hay nada.
- **Arreglo:** `app/(finn)/presupuesto/estructura/` (decidir si el vacío cubre todo o se muestra solo la lista).
- **Cómo verificar:** un solo mensaje.

### GLO-131 · Etiqueta de categoría truncada en «Gasto registrado» — Registrar (paso 30) · telefono-claro · baja
- **Se ve:** `capturas/pliegue/recorrido__30-gasto-guardado__telefono-claro.png`: «SUPERMERC…» con espacio libre a la derecha.
- **Debería:** texto completo («SUPERMERCADO»); la tarjeta tiene sitio.
- **Arreglo:** quitar el límite de ancho en el resultado de `app/(finn)/registrar/gasto`.
- **Cómo verificar:** nombre completo.

**Resultado de cada paso** (`telefono-claro`, 32 de 32 pasos, el recorrido llegó al final; un caso por paso):

| Paso | Qué hace | Resultado | Notas |
|---|---|---|---|
| 01 | Ingresar con contraseña | bien | ACC-04, ACC-07, ACC-08, ACC-09 |
| 02 | Verificar el código | bien | campo único, no 6 casillas (ACC-01) |
| 03 | Inicio con Primeros pasos (0 de 3) | bien | no se verifica sola: hubo que tocar «Verificar» (ACC-01) |
| 04 | Formulario de cuenta nueva | bien | otros agentes (Cuentas) |
| 05-07 | Cuenta corriente, ahorro y billetera | bien | idem |
| 08-09 | Tarjeta (formulario y creada) | bien | idem |
| 10-11 | Préstamo (formulario y creado) | bien | idem |
| 12-13 | Inversión y lista con una cuenta de cada tipo | bien | idem |
| 14 | Inicio con 1 paso hecho | bien | — |
| 15 | Grupos y categorías vacío | bien (funciona) | GLO-130 |
| 16-17 | Plantilla de categorías (47 creadas) | bien | — |
| 18 | Presupuesto con categorías | bien | desde la pantalla «creadas» la salida es «Ir al presupuesto» |
| 19-20 | Conectar los SMS (token) | bien | Ajustes: otro agente |
| 21 | Inicio sin Primeros pasos | bien | desaparece al cumplir los tres |
| 22 | Bandeja con el SMS (contador 1) | bien | márgenes de 16 px en la Bandeja (otro agente) |
| 23-24 | Revisar y aprobar | bien | resultado en el lugar: «Aprobado: Super Selectos · $35.00 · Visa Oro · Supermercado» |
| 25 | Bandeja al día | bien | 0 filas |
| 26-27 | Asignar y presupuesto asignado | bien | — |
| 28 | Selector de Registrar | bien (funciona) | lista de 9 tarjetas de texto, la referencia es una rejilla de 2 columnas con íconos (`12-registrar-tipos-y-flujos-cortos/selector`): para el agente de Registrar |
| 29-30 | Registrar un gasto y guardarlo | bien | GLO-131 |
| 31 | Actividad con 8 transacciones | bien | — |
| 32 | Inicio final | bien | — |

Lo inventado o roto en el camino: el párrafo «sin registro» (ACC-09), el control «Mostrar contraseña» (ACC-08), la ausencia de «Salir» en todo el recorrido (GLO-101 a 103) y el aviso de conexión que tapa contenido (GLO-109).

## Candidatos a global

- ACC-01/ACC-02: componente de 6 casillas del código, con sus tiempos como tokens.
- GLO-101 a GLO-105, GLO-107, GLO-108: «Salir» a la vista y «Tenés N cambios sin enviar» (entrega 3 sin implementar).
- GLO-109/GLO-110: el aviso global de conexión como `fixed` tapa contenido y usa 16 px laterales.
- GLO-111: la etiqueta del botón «Registrar» se oculta a 390 px.
- GLO-113: título de pantalla hija solapado y ausente de la barra superior (revisar en todos los detalles).
- ACC-06: a 1440 px el acceso y las pantallas sin marco no van en tarjeta centrada.
- GLO-122: esqueletos con radio de pastilla y 16 px laterales.
- Márgenes de 16 px en Bandeja, avisos y esqueletos, contra los 20 px de DECISIONES.

## Sin diseño

| Pantalla o estado | Captura |
|---|---|
| Validación de campos vacíos en Ingresar | `capturas/acceso__ingresar-validacion__telefono-claro.png` |
| Contraseña visible | `capturas/acceso__ingresar-contrasena-visible__telefono-claro.png` |
| Ingresar sin conexión | `capturas/acceso__ingresar-sin-conexion__telefono-claro.png` |
| Sesión vencida (FALTANTES `sesion-vencida`) | `capturas/acceso__sesion-vencida__telefono-claro.png` |
| Verificar incompleto (6 casillas a medias) | `capturas/acceso__verificar-incompleto__telefono-claro.png` |
| Inscribir: preparando, copiado y error | `capturas/acceso__inscribir-preparando__…`, `acceso__inscribir-copiado__…`, `acceso__inscribir-error__telefono-claro.png` |
| Alta de usuario, olvidé mi contraseña (FALTANTES `alta-usuario`, `olvide`) | sin pantalla; solo el párrafo de ACC-09 |
| Navegación bloqueada sin conexión | `capturas/estado__sin-conexion-navegacion-bloqueada__telefono-claro.png` |
| Aviso de actualización de la PWA | `capturas/estado__actualizacion-pwa__telefono-claro.png` |
| 404 fuera de la app | `capturas/estado__404-fuera__telefono-claro.png` |
| Página sin conexión con borrador | `capturas/estado__sin-conexion-pagina-con-borrador__telefono-claro.png` |
| Panel de notificaciones: vacío y «todo leído» | `capturas/notificaciones-panel__vacio__telefono-claro.png`, `notificaciones-panel__todo-leido__telefono-claro.png` |
| Quitar un factor (FALTANTES `factor-quitar`) | no capturado: es del agente de Ajustes |
