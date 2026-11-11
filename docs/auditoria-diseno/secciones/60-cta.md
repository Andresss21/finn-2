# Auditoría de diseño · CTA — Cuentas (lista, detalle por tipo, nueva cuenta y flujos)

Alcance: `/cuentas`, `/cuentas/[cuentaId]` (los 5 tipos), `/cuentas/nueva`, editar, condiciones, pagar tarjeta, pagar cuota, archivar, eliminar, verificar saldo, conciliar CSV y ordenar.
Casos: `tools/auditoria/casos/60-cta.cap.ts` (57 entradas, 89 capturas distintas; las 3 variantes pasan: 183 pruebas verdes). No hizo falta agregar casos: el archivo ya cubría todos los estados del inventario salvo el de carga (ver «No capturado»).
Capturas en `docs/auditoria-diseno/capturas/<id>__<variante>.png`; análisis en `docs/auditoria-diseno/analisis/<id>.md`.
Referencias: `docs/diseno/02-referencias/entrega-1/pantallas/S6-Cuentas*` y `entrega-2/pantallas/06-detalle-de-cuenta/*`.
Datos: las diferencias de solo datos (montos, banco «Cuscatlán», Mastercard sin color propio, «Sin comercio», cuota 14, notificaciones, contador de Bandeja) no se reportan. Los «contrastes < 4.5» del medidor sobre las caras de tarjeta son falsos positivos (texto sobre degradado medido contra el fondo de página).

## Inventario

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

## Hallazgos

### CTA-01 · Editar tarjeta no permite cambiar límite, tasa, corte ni pago — Editar cuenta (tarjeta) · telefono-claro, computadora-claro · crítica
- **Se ve:** `capturas/cuenta-editar__tarjeta__telefono-claro.png`: solo Nombre, Institución, Últimos 4 y Fecha de apertura, y «Guardar cambios». No hay Límite, Tasa anual, Día de corte ni Día de pago (`flujos/cuentas-editar/formulario.tsx` no los tiene) y la ruta `/condiciones` de una tarjeta redirige al detalle (CTA-03). Esos datos no se corrigen desde ninguna pantalla.
- **Debería:** el menú de la tarjeta dice «Editar · Nombre, límite, tasa, corte y pago» (`docs/diseno/02-referencias/entrega-2/pantallas/06-detalle-de-cuenta/mas-acciones-tarjeta__telefono-claro.png`) y `editar__telefono-claro.png` de la misma carpeta es la pantalla donde se editan.
- **Arreglo:** agregar a `flujos/cuentas-editar/formulario.tsx` (y su `lector.tsx`) los campos Límite, Tasa anual, Día de corte y Día de pago con los mismos componentes de campo de `flujos/cuentas-nueva/formulario.tsx`, solo para tarjetas.
- **Cómo verificar:** editar la Visa Oro desde «Más acciones › Editar», cambiar y guardar los 4 datos; el detalle muestra los valores nuevos.

### CTA-02 · Nueva cuenta no tiene el paso «¿Qué tipo de cuenta es?» — Nueva cuenta · telefono-claro, computadora-claro · alta
- **Se ve:** `capturas/cuenta-nueva__inicial__telefono-claro.png`: el tipo es una lista de 4 radios («Efectivo o ahorro, Tarjeta de crédito, Préstamo, Inversión») dentro del mismo formulario, con Efectivo ya elegido y «Crear cuenta» al final.
- **Debería:** `06-detalle-de-cuenta/nueva-tipo__telefono-claro.png`: primero cuatro tarjetas 2 × 2 (disco con ícono, título y descripción), un aviso informativo sobre el saldo inicial y «Continuar» deshabilitado con «Elegí un tipo de cuenta.». Luego `nueva-tarjeta__telefono-claro.png` muestra las 4 tarjetas compactas arriba con la elegida resaltada.
- **Arreglo:** en `flujos/cuentas-nueva/formulario.tsx`, reemplazar el radiogroup por el selector de tarjetas de tipo (radios con aspecto de tarjeta, `--radio-contenedor`, `--superficie`; elegido con `--accion-fondo` y borde `--accion`) y agregar el paso inicial con «Continuar».
- **Cómo verificar:** `/cuentas/nueva` abre sin tipo elegido y «Continuar» deshabilitado con motivo; al elegir un tipo aparece el formulario con las 4 tarjetas arriba.

### CTA-03 · «Condiciones» en el menú de una tarjeta no abre nada y falta «Pagar tarjeta» — Más acciones (tarjeta) · telefono-claro · alta
- **Se ve:** `capturas/cuenta__mas-acciones-tarjeta__telefono-claro.png`: Editar, Condiciones, Verificar saldo, Conciliar, Ordenar cuentas, Archivar, Eliminar. `cuenta-condiciones__tarjeta` documenta que «Condiciones» redirige al detalle de la misma tarjeta.
- **Debería:** `mas-acciones-tarjeta__telefono-claro.png`: Editar, **Pagar tarjeta**, Verificar saldo, Conciliar con estado de cuenta, Archivar, Eliminar; sin «Condiciones» ni «Ordenar cuentas».
- **Arreglo:** `componentes/marco/mas-acciones.tsx` y `app/(finn)/cuentas/[cuentaId]/acciones.tsx`: quitar «Condiciones» en tarjetas, sumar «Pagar tarjeta» y dejar «Ordenar cuentas» solo donde la referencia lo muestra; `flujos/cuentas-condiciones/lector.tsx` ya no necesita la redirección.
- **Cómo verificar:** el menú de la Visa Oro coincide fila por fila con la referencia y toda entrada abre una pantalla.

### CTA-04 · Los flujos cortos de Cuentas son páginas completas, no hoja inferior (teléfono) ni panel lateral (computadora) — Pagar tarjeta, Pagar cuota, Archivar, Eliminar, Verificar saldo, Ordenar · telefono-claro, computadora-claro · alta
- **Se ve:** `capturas/cuenta-pagar__principal__telefono-claro.png` y `…__computadora-claro.png`, `cuenta-cuota__principal`, `cuenta-archivar__bloqueado`, `cuenta-eliminar__bloqueado`, `cuenta-verificar-saldo__datos`, `cuentas-ordenar__principal`: pantalla completa con «X» y título, sin el detalle detrás. En computadora, Pagar es una página de 720 px.
- **Debería:** las referencias son una **hoja inferior** con tirador, título, «X» y botones al pie sobre el detalle atenuado (p. ej. `pagar-tarjeta__telefono-claro.png`, `archivar-bloqueado__telefono-claro.png`) y en computadora un **panel lateral** (`pagar-tarjeta__computadora-claro.png`; PANTALLAS §3.2: «Los flujos cortos se abren como panel lateral»). Conciliar sí es flujo largo.
- **Arreglo:** abrir esas rutas con la hoja/panel que usa Asignar (rutas interceptadas o hoja controlada por la ruta) en `app/(finn)/cuentas/[cuentaId]/{pagar,cuota,archivar,eliminar,verificar-saldo}` y `app/(finn)/cuentas/ordenar`; el contenido de `flujos/cuentas-*/formulario.tsx` se conserva.
- **Cómo verificar:** al abrir cada flujo se ve el detalle atenuado detrás y, en computadora, un panel a la derecha.

### CTA-05 · Archivar con saldo no ofrece «Transferir el saldo» y «Volver a la cuenta» es un enlace subrayado — Archivar bloqueado · telefono-claro · alta
- **Se ve:** `capturas/cuenta-archivar__bloqueado__telefono-claro.png`: aviso de problema y el enlace subrayado «Volver a la cuenta»; ninguna acción para resolverlo.
- **Debería:** `archivar-bloqueado__telefono-claro.png`: título «No se puede archivar», aviso, texto «Pasá el saldo a otra cuenta con una transferencia y volvé a intentarlo.» y botones «Cerrar» (tonal) y «Transferir el saldo» (principal).
- **Arreglo:** `flujos/cuentas-archivar/formulario.tsx` y `textos/cuentas-gestion.ts`: texto guía y dos botones del sistema (el principal abre la transferencia con el saldo precargado).
- **Cómo verificar:** con saldo, el bloqueo muestra los dos botones y «Transferir el saldo» abre la transferencia con $1,284.60.

### CTA-06 · Eliminar con movimientos usa un enlace subrayado donde la referencia pone botones — Eliminar bloqueado · telefono-claro · alta
- **Se ve:** `capturas/cuenta-eliminar__bloqueado__telefono-claro.png`: aviso de problema y el enlace subrayado «Archivar en lugar de eliminar».
- **Debería:** `eliminar-bloqueado__telefono-claro.png`: título «No se puede eliminar», aviso y botones «Cerrar» (tonal) + «Archivar» (principal).
- **Arreglo:** `flujos/cuentas-eliminar/formulario.tsx`: `Boton` tonal y principal en lugar del enlace.
- **Cómo verificar:** coincide con la referencia y «Archivar» abre el flujo de archivar.

### CTA-07 · Verificar saldo: dos pantallas con lista de movimientos en lugar del cálculo en el lugar — Verificar saldo · telefono-claro · alta
- **Se ve:** `capturas/cuenta-verificar-saldo__datos__telefono-claro.png`: Fecha y «Saldo que muestra tu banco», «20 transacciones hasta esa fecha.» y «Ver diferencia»; luego (`__diferencia`) una lista de las 20 transacciones con casilla («Marcar como conciliadas»).
- **Debería:** `verificar-saldo__telefono-claro.png` y `verificar-diferencia__telefono-claro.png`: una hoja con Fecha y «Saldo según el banco» lado a lado, tarjeta «Saldo en Finn al 15/10 · Diferencia» que se actualiza al escribir y el resultado en el lugar: «Sin diferencia» con «Marcar como conciliadas», o «¿Alguna de estas explica la diferencia?» con solo los candidatos y «Registrar ajuste $12.40».
- **Arreglo:** `flujos/cuentas-verificar-saldo/formulario.tsx`: un solo paso con tarjeta de diferencia (`--superficie`, filas con `--borde-sutil`, diferencia en `--advertencia-texto` o `--positivo-texto`) y lista reducida a candidatos; textos en `textos/verificar-saldo.ts`.
- **Cómo verificar:** escribir 1,272.20 muestra $12.40 sin cambiar de pantalla y ofrece «Registrar ajuste $12.40».

### CTA-08 · Verificar saldo: los datos van como párrafos sueltos y el aviso sin título — Verificar saldo · telefono-claro · media
- **Se ve:** `capturas/cuenta-verificar-saldo__diferencia__telefono-claro.png`: «Saldo de Finn al 15/10/2026: $1,284.60» y «Diferencia: −$12.40» como texto; el aviso amarillo en `cuerpo-pequeno` sin título.
- **Debería:** `verificar-diferencia__telefono-claro.png`: tarjeta con dos filas (nombre `cuerpo`, monto 700 a la derecha) y avisos con título `etiqueta` 700.
- **Arreglo:** componente de aviso en línea con `titulo` y la tarjeta de filas de CTA-07.
- **Cómo verificar:** título del aviso 700 en `--advertencia-texto`.

### CTA-09 · Conciliar: el archivo se elige con el control nativo en inglés y faltan fecha de corte y saldo final — Conciliar · subir y error · telefono-claro, computadora-claro · alta
- **Se ve:** `capturas/cuenta-conciliar__subir__telefono-claro.png`: «Archivo CSV» y el texto nativo «Choose File No file chosen»; sin zona de arrastre ni campos de corte; «Revisar» activo dentro del flujo, sin pie fijo ni motivo. Con archivo (`__error`) el nombre también sale como texto nativo.
- **Debería:** `conciliar-subir__telefono-claro.png`: campos «Fecha de corte» y «Saldo final del estado», zona punteada con ícono, «Subí el estado de cuenta», «Archivo CSV que descargás del portal del banco.» y botón tonal «Elegir archivo»; pie fijo con «Revisar» deshabilitado y «Subí el archivo CSV.». `conciliar-error__telefono-claro.png`: nombre, tamaño, «Elegir otro archivo» y borde `--problema-borde`.
- **Arreglo:** `flujos/cuentas-conciliar/formulario.tsx`: ocultar el `<input type=file>` tras un botón tonal, zona con borde punteado y `--radio-contenedor`, los dos campos y `flujos/pie-de-hoja.tsx` para «Revisar».
- **Cómo verificar:** no aparece texto en inglés y sin archivo «Revisar» está deshabilitado con motivo visible.

### CTA-10 · Conciliar resultado: saldos como texto, sin tarjeta, y «Terminar» no es pie fijo — Conciliar · resultado · telefono-claro · media
- **Se ve:** `capturas/cuenta-conciliar__resultado__telefono-claro.png`: tres líneas de texto («Saldo del estado… Saldo de Finn… Diferencia»); «Agregar» como botón tonal a todo el ancho con el select de categoría en el bloque; «Terminar» y «Elegir otro archivo» al final del contenido.
- **Debería:** `conciliar-resultado__telefono-claro.png`: tarjeta con tres filas (diferencia en `--advertencia-texto`), «Coinciden · 42 / Ver todas», filas compactas con «Agregar» tonal a la derecha, aviso informativo sobre el ajuste y «Terminar» principal en pie fijo.
- **Arreglo:** `flujos/cuentas-conciliar/formulario.tsx` con la tarjeta de filas de CTA-07 y `flujos/pie-de-hoja.tsx`.
- **Cómo verificar:** «Terminar» queda fijo al pie con 52 px de alto.

### CTA-11 · Ordenar cuentas: grupos con «Subir/Bajar» de texto y «Guardar orden», sin asas ni guardado automático — Ordenar · telefono-claro · media
- **Se ve:** `capturas/cuentas-ordenar__principal__telefono-claro.png`: cuatro grupos por tipo con dos botones tonales por fila y «Guardar orden» al final.
- **Debería:** `ordenar__telefono-claro.png`: una lista en tarjeta con asa, flechas ↑ ↓ de 44 px, fila activa resaltada, «Arrastrá desde el asa o usá las flechas. Cada cambio se guarda solo y se puede deshacer.» y «Listo». DECISIONES transversal 5: el resultado queda en el lugar.
- **Arreglo:** `flujos/cuentas-ordenar/formulario.tsx`: lista única con íconos de flecha y asa, guardado por cambio con «Deshacer» y «Listo».
- **Cómo verificar:** mover una cuenta guarda sin otro botón y muestra el resultado en el lugar.

### CTA-12 · Cuenta archivada: cuatro botones deshabilitados con el mismo texto repetido y aviso informativo en vez del bloque «Archivada» — Detalle archivada · telefono-claro · media
- **Se ve:** `capturas/cuenta__archivada__telefono-claro.png`: aviso azul «Esta cuenta está archivada: solo podés mirarla.», luego Pagar, Cuota, Conciliar y Registrar deshabilitados, cada uno con «La cuenta está archivada. Desarchivala para usar esta acción.», y «Desarchivar».
- **Debería:** `archivada__telefono-claro.png`: bloque «Archivada» con ícono, «Esta cuenta está archivada: se puede consultar pero no recibe movimientos nuevos.» y «Desarchivar»; la cuenta debajo con candado y «BAC · archivada el 02/09/2026»; sin botones de acción.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/acciones.tsx`: en archivada no renderizar los botones deshabilitados y mostrar el bloque de la referencia; fecha en `componentes/dominio/identidad-cuenta.tsx`.
- **Cómo verificar:** un único aviso con «Desarchivar» y ningún botón deshabilitado.

### CTA-13 · La cara de la tarjeta no dice la red («Visa · crédito») — Lista y detalle de tarjeta · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png` y `cuenta__tarjeta__telefono-claro.png`: bajo «•••• 4821» no hay nada; el análisis marca «Visa · crédito» y «Mastercard · crédito» como ausentes. (En la vista previa de nueva tarjeta sí aparece: `cuenta-nueva__color-zafiro`.)
- **Debería:** PANTALLAS §2.9: «•••• 4821» + «Visa · crédito» `.t-rotulo`; `S6-Cuentas__telefono-claro.png`, `tarjeta__telefono-claro.png`.
- **Arreglo:** `componentes/dominio/cara-tarjeta.tsx`: mostrar el rótulo de la red también en lista y detalle.
- **Cómo verificar:** la cara de la Visa Oro dice «VISA · CRÉDITO».

### CTA-14 · Cara de tarjeta: monto de 20 px (debe ser 28), nombre de 22 (debe ser 20) y sin tabular-nums — Lista y detalle de tarjeta · telefono-claro · media
- **Se ve:** `analisis/cuentas__principal.md`: «$642.18» 20 px / interlineado 25; «Visa Oro» 22 px; «•••• 4821» con tnum normal.
- **Debería:** PANTALLAS §2.9: nombre `.t-titulo-seccion` 1.25rem, monto `.t-cifra` 1.75rem, últimos 4 con `tabular-nums` (la referencia mide 28 y `tabular-nums`).
- **Arreglo:** `cara-tarjeta.tsx`: roles `cifra` (1.75rem) y `titulo-seccion` (1.25rem), `tabular-nums` en los últimos 4.
- **Cómo verificar:** medir 28 / 20 px y tnum.

### CTA-15 · Detalle de la tarjeta al frente: «Confirmado» en línea aparte y fechas con año — Lista de Cuentas · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png`: «Te falta reservar $18.75», una línea «Confirmado $0.00» debajo y rejilla «Corte 25/10/2026 · Pago 15/10/2026 · Sin intereses».
- **Debería:** `S6-Cuentas__telefono-claro.png`: indicador y «Confirmado $607.18» en la misma fila y rejilla «Corte 25/10 · Pago 15/11 · Sin intereses $512.40» sin año (PANTALLAS §2.9).
- **Arreglo:** bloque de detalle de `componentes/dominio/billetera.tsx`: fila del indicador con el confirmado a la derecha y fechas `dd/mm`.
- **Cómo verificar:** el indicador ocupa una línea y las fechas no llevan año.

### CTA-16 · «Ordenar» y «Nueva cuenta» como fila de botones bajo el título — Lista de Cuentas · telefono-claro, computadora-claro · baja
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png`: fila con dos botones tonales debajo del título (en computadora, en el encabezado). Ninguna referencia de Cuentas los incluye.
- **Debería:** `S6-Cuentas__telefono-claro.png`: del título cuelga la posición neta. El acceso a «Nueva cuenta» y «Ordenar» no tiene diseño (ver Sin diseño).
- **Arreglo:** decidir con diseño; si se mantienen, `app/(finn)/cuentas/pantalla.tsx` debería llevarlos a la barra superior o «Más acciones» para no desplazar 56 px el contenido.
- **Cómo verificar:** la posición neta empieza donde la referencia.

### CTA-17 · Barra superior del teléfono: «Registrar» es solo un «+» sin texto — Todas las pestañas · telefono-claro · media
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png` y la medida: botón de 44 × 44 con «+»; el análisis marca «Registrar» como texto ausente.
- **Debería:** PANTALLAS §3.1: botón de 44 de alto, padding 0 14 0 10, ícono `plus` 18 y `.t-etiqueta` 700 «Registrar» (`S6-Cuentas__telefono-claro.png`).
- **Arreglo:** barra superior en `componentes/marco`: mostrar «Registrar» a 390 px.
- **Cómo verificar:** pastilla «+ Registrar» junto a la campana.

### CTA-18 · Posición neta: fila «En camino $40.00» que el diseño no tiene — Lista de Cuentas · telefono-claro · baja
- **Se ve:** `capturas/cuentas__principal__telefono-claro.png`: bajo la cifra «ⓘ En camino $40.00»; en el desglose «Saldos a favor $0.00».
- **Debería:** PANTALLAS §2.11 y `S6-Cuentas__telefono-claro.png`: cifra y dos filas (Activos / Deudas) con «Efectivo · Inversiones · Por cobrar».
- **Arreglo:** `componentes/dominio/posicion-neta.tsx`: confirmar con diseño si «En camino» queda; si no, retirarla.
- **Cómo verificar:** la tarjeta coincide con §2.11.

### CTA-19 · Posición neta: montos de Activos y Deudas en peso 400 (debe ser 700) — Lista de Cuentas · telefono-claro, computadora-claro · baja
- **Se ve:** `analisis/cuentas__principal.md`: «$6,520.20» y «$4,852.18» peso 400.
- **Debería:** referencia `S6-Cuentas__telefono-claro.html`: peso 700.
- **Arreglo:** `posicion-neta.tsx`: peso 700 en los montos de fila.
- **Cómo verificar:** medida 700.

### CTA-20 · Totales de cada grupo en 16 px / 400 (debe ser 14 px / 600) — Lista de Cuentas · telefono-claro, computadora-claro · media
- **Se ve:** «$642.18», «$4,404.60», «$4,210.00», «$2,075.60»: tamaño 16, peso 400, interlineado 24.
- **Debería:** PANTALLAS §9: total `.t-cuerpo-pequeno` 600 (14 px, interlineado 20.3).
- **Arreglo:** encabezado de grupo en `app/(finn)/cuentas/pantalla.tsx`: rol `cuerpo-pequeno`, peso 600.
- **Cómo verificar:** medida 14 / 600.

### CTA-21 · Billetera apilada con tres tarjetas: las de atrás no muestran el banco — Lista de Cuentas · telefono-claro · baja
- **Se ve:** `capturas/cuentas__subtipos-y-tres-tarjetas__telefono-claro.png`: la franja de la tarjeta de atrás muestra solo el nombre.
- **Debería:** PANTALLAS §2.9: de la de atrás se ve «su franja con nombre y banco» (`S6-Cuentas__telefono-claro.png`).
- **Arreglo:** `componentes/dominio/billetera.tsx`: banco a la derecha de cada franja apilada.
- **Cómo verificar:** cada franja visible muestra nombre y banco.

### CTA-22 · Cabecera de cuenta: línea «Saldo confirmado $0.00» que el diseño no tiene — Detalle de efectivo, préstamo y archivada · telefono-claro, computadora-claro · baja
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`: bajo el saldo, «Saldo confirmado $0.00» (también préstamo, ahorro, billetera, archivada).
- **Debería:** `corriente__telefono-claro.png`: Saldo y nada más.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/cabecera.tsx`: mostrarlo solo si difiere del saldo.
- **Cómo verificar:** sin esa línea cuando coinciden.

### CTA-23 · Aviso de diferencia: solo «Ver conciliación» subrayado, sin «Verificar saldo» — Detalle de efectivo · telefono-claro · baja
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`: un enlace subrayado «Ver conciliación».
- **Debería:** `corriente__telefono-claro.png`: dos acciones en `--advertencia-texto` 700 («Verificar saldo», «Ver conciliación»; PANTALLAS §2.14).
- **Arreglo:** aviso en `app/(finn)/cuentas/[cuentaId]/conciliaciones.tsx` o `cabecera.tsx`: ambas acciones sin subrayado de enlace común.
- **Cómo verificar:** dos acciones.

### CTA-24 · Detalle: selector de período y filtros Tipo/Estado/Filtrar donde la referencia no los muestra — Detalle de efectivo, tarjeta, inversión, vacía · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`, `cuenta__tarjeta`, `cuenta__inversion`, `cuenta__vacia`: tarjeta de período, dos `select` nativos y «Filtrar» antes de la lista. En la vacía los filtros aparecen sobre «Esta cuenta todavía no tiene movimientos».
- **Debería:** `corriente`, `tarjeta`, `inversion` y `vacia` (carpeta `06-detalle-de-cuenta`): los movimientos siguen directo al título; solo `prestamo__telefono-claro.png` muestra período y filtros.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/movimientos.tsx`: período y filtros solo cuando hay lista (nunca con la lista vacía) y detrás de una acción donde la referencia no los dibuja.
- **Cómo verificar:** vacía sin controles; corriente y tarjeta como la referencia.

### CTA-25 · Lista de movimientos del detalle muestra todo el historial — Detalle · telefono-claro · baja
- **Se ve:** `capturas/cuenta__corriente__telefono-claro.png`: ~30 filas «Sin comercio» sin tope.
- **Debería:** `corriente__telefono-claro.png`: 4 filas y «Ver en Actividad».
- **Arreglo:** `movimientos.tsx`: tope de filas con el enlace a Actividad.
- **Cómo verificar:** el detalle muestra un tope y «Ver en Actividad».

### CTA-26 · Detalle de tarjeta: falta la barra «Reservado $623.43 de $642.18 · 97.10 %» y la rejilla es otra — Detalle de tarjeta · telefono-claro, computadora-claro · alta
- **Se ve:** `capturas/cuenta__tarjeta__telefono-claro.png`: indicador «Te falta reservar $18.75», botón «Reservar $18.75», filas «Reservado / Deuda» y rejilla «Saldo a favor · Límite · Uso del límite · Ciclo de facturación»; sin barra.
- **Debería:** `tarjeta__telefono-claro.png`: barra de 8 px con «Reservado $623.43 de $642.18» y 97.10 % (parte sin reservar con `--patron-sin-reservar`) y rejilla de 3 «Corte · Pago · Límite».
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/por-tipo.tsx`: bloque de tarjeta con la barra y la rejilla de 3.
- **Cómo verificar:** coincide con la referencia en teléfono y computadora.

### CTA-27 · «Reservar $18.75» como botón en fila propia — Detalle de tarjeta · telefono-claro · baja
- **Se ve:** pastilla principal bajo el indicador.
- **Debería:** `tarjeta__telefono-claro.png`: enlace «Reservar $18.75» a la derecha del indicador en `--enlace` 700.
- **Arreglo:** `por-tipo.tsx`: acción en la misma fila que el indicador.
- **Cómo verificar:** el indicador ocupa una fila.

### CTA-28 · «Para no generar intereses»: rótulo partido y sin la fila final «Pagá antes del 15/11» — Detalle de tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta__tarjeta__telefono-claro.png`: encabezado en dos líneas («PARA NO GENERAR / INTERESES» + «Pagá antes del 15/10» en dos líneas) y cuatro filas sin total final destacado.
- **Debería:** `tarjeta__telefono-claro.png`: rótulo en una línea y fila final «Pagá antes del 15/11 · $512.40» en 700.
- **Arreglo:** `por-tipo.tsx` y `textos/cuenta-detalle.ts`.
- **Cómo verificar:** rótulo en una línea y total en negrita al pie.

### CTA-29 · Préstamo: tabla de amortización de 6 columnas desborda la pantalla — Detalle de préstamo · telefono-claro · media
- **Se ve:** `capturas/cuenta__prestamo-con-amortizacion__telefono-claro.png`: N.º, Fecha, Capital, Interés, Seguro, Saldo; «Saldo» recortado al borde derecho (`desbordeHorizontal` verdadero en `medidas/cuenta__prestamo-con-amortizacion__telefono-claro.json`).
- **Debería:** `prestamo__telefono-claro.png`: 5 columnas (Cuota, Fecha, Capital, Interés, Saldo) que entran en 350 px, fila actual resaltada.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/filas-amortizacion.tsx`: quitar Seguro de la tabla en teléfono (queda en el detalle de la cuota) o contener el desplazamiento en la tabla.
- **Cómo verificar:** `scrollWidth` de la página = 390.

### CTA-30 · Inversión: aportado/retirado/ajustes dentro de la tarjeta de identidad y sin las barras grandes — Detalle de inversión · telefono-claro, computadora-claro · media
- **Se ve:** `capturas/cuenta__inversion__telefono-claro.png`: VALOR y la rejilla Aportado · Retirado · Ajustes dentro del fondo violeta, sin motivo de barras.
- **Debería:** `inversion__telefono-claro.png`: la tarjeta lleva «Depósito a plazo», VALOR y las seis barras; la rejilla va afuera, sobre los botones.
- **Arreglo:** `por-tipo.tsx` y `identidad-cuenta.tsx` (variante de detalle con las barras).
- **Cómo verificar:** coincide con la referencia.

### CTA-31 · Inversión: «Aporte» sin ícono «+» — Detalle de inversión · telefono-claro · baja
- **Se ve:** botones «Aporte · Retiro · Ajuste» sin ícono.
- **Debería:** `inversion__telefono-claro.png`: «+ Aporte» con ícono `plus`.
- **Arreglo:** `por-tipo.tsx`.
- **Cómo verificar:** ícono visible.

### CTA-32 · Cuenta sin movimientos: ícono y CTA distintos de la referencia — Detalle vacía · telefono-claro · media
- **Se ve:** `capturas/cuenta__vacia__telefono-claro.png`: círculo verde con anillo punteado, título pequeño, «Cuando registres algo con esta cuenta, lo vas a ver acá.» y «Registrar con esta cuenta» tonal.
- **Debería:** `vacia__telefono-claro.png`: círculo neutro con ícono `activity`, título más grande, «Los gastos e ingresos que registres con ella van a aparecer aquí con el saldo después de cada uno.» y botón principal «+ Registrar con esta cuenta».
- **Arreglo:** vacío de `movimientos.tsx` según PANTALLAS §2.19.
- **Cómo verificar:** botón principal y texto de la referencia.

### CTA-33 · «Cuenta desarchivada» es texto con enlace subrayado sin contenedor — Detalle (resultado) · telefono-claro · baja
- **Se ve:** `capturas/cuenta__desarchivada__telefono-claro.png`: ícono + «Cuenta desarchivada.» y el enlace subrayado «↶ Archivar de nuevo» sin contenedor.
- **Debería:** PANTALLAS §2.13: contenedor sin borde de 56 px con ícono, texto y enlace 700 `--enlace`, con rebote `--curva-enfasis`.
- **Arreglo:** `app/(finn)/cuentas/[cuentaId]/desarchivar.tsx`: componente de resultado de §2.13.
- **Cómo verificar:** contenedor `--superficie`, sin subrayado.

### CTA-34 · Menú «Más acciones» sin los subtítulos de la referencia — Más acciones · telefono-claro · baja
- **Se ve:** `capturas/cuenta__mas-acciones__telefono-claro.png`: títulos de una línea.
- **Debería:** `mas-acciones__telefono-claro.png`: «Conciliar con estado de cuenta · Archivo CSV del banco»; `mas-acciones-tarjeta__telefono-claro.png`: «Editar · Nombre, límite, tasa, corte y pago».
- **Arreglo:** `componentes/marco/mas-acciones.tsx` y `textos/cuenta-detalle.ts`: subtítulo `cuerpo-pequeno` en `--texto-secundario`.
- **Cómo verificar:** subtítulos visibles.

### CTA-35 · Institución y Red como listas de radios; formulario largo y sin pie fijo — Nueva cuenta y Editar · telefono-claro · media
- **Se ve:** `capturas/cuenta-nueva__tarjeta__telefono-claro.png`, `cuenta-editar__tarjeta`: Institución son 4 radios de 52 px y Red 3 radios; Límite, Tasa, Corte y Pago a todo el ancho; «Crear cuenta» al final del contenido (página de ~2 000 px).
- **Debería:** `nueva-tarjeta__telefono-claro.png` y `editar__telefono-claro.png`: Institución (select) + Últimos 4, Límite + Tasa, Corte + Pago y Red + Color en dos columnas; «Crear Visa Oro» / «Guardar cambios» en pie fijo.
- **Arreglo:** `flujos/cuentas-nueva/formulario.tsx` y `flujos/cuentas-editar/formulario.tsx`: rejilla de 2 columnas, select de institución y `flujos/pie-de-hoja.tsx`; el color puede seguir con las 8 muestras (DECISIONES).
- **Cómo verificar:** el formulario de tarjeta entra en ~2 pantallas y el botón queda fijo.

### CTA-36 · Saldo inicial: «Debo / Tengo a favor» debajo del saldo y sin prefijo `$` — Nueva cuenta (tarjeta) · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__tarjeta__telefono-claro.png`: «Saldo de la tarjeta», «Se entiende como $642.18» y el segmentado después.
- **Debería:** `nueva-tarjeta__telefono-claro.png`: «Saldo inicial» (segmentado) y luego «Saldo» con prefijo `$`.
- **Arreglo:** orden y prefijo en `formulario.tsx`.
- **Cómo verificar:** mismo orden y prefijo.

### CTA-37 · Muestras de color de la tarjeta sin nombre ni marca de selección más que el borde — Nueva cuenta (tarjeta) · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__color-zafiro__telefono-claro.png`: 8 cuadrados de 44; el elegido solo se distingue por el borde, y ninguno dice su nombre.
- **Debería:** DECISIONES regla 2 (tres señales por estado: color, glifo y texto) y «Tarjetas de crédito» (8 colores).
- **Arreglo:** `flujos/cuentas-nueva/color-tarjeta.tsx`: nombre del color elegido junto a «Color de la tarjeta» y check en la muestra elegida.
- **Cómo verificar:** al elegir aparece el nombre y un check.

### CTA-38 · Nombre repetido: aviso sin título ni dato de la otra tarjeta — Nueva cuenta · telefono-claro · baja
- **Se ve:** `capturas/cuenta-nueva__nombre-repetido__telefono-claro.png`: «Ya tenés una tarjeta llamada Visa Oro.».
- **Debería:** `nueva-nombre-repetido__telefono-claro.png`: título «Nombre repetido» y «Ya tenés una tarjeta llamada Visa Oro (BAC ***4821). Podés guardar igual; te conviene un nombre distinto para reconocerlas.».
- **Arreglo:** `textos/cuentas-nueva.ts` (`nombreEnUso`) y aviso con título.
- **Cómo verificar:** texto y título iguales.

### CTA-39 · Editar efectivo: fecha de apertura editable y sin saldo ni aviso — Editar cuenta · telefono-claro · media
- **Se ve:** `capturas/cuenta-editar__principal__telefono-claro.png`: Fecha de apertura editable; no hay saldo.
- **Debería:** `editar__telefono-claro.png`: «Fecha de apertura» y «Saldo» de solo lectura (borde punteado, «Solo lectura») y aviso «El saldo cambia con los movimientos. Para corregir una diferencia con el banco, usá “Verificar saldo”.».
- **Arreglo:** `flujos/cuentas-editar/formulario.tsx`: campos de solo lectura y aviso informativo.
- **Cómo verificar:** ambos no editables y con el aviso.

### CTA-40 · Condiciones del préstamo: campos y orden distintos de la referencia — Condiciones · telefono-claro · media
- **Se ve:** `capturas/cuenta-condiciones__sin-modelo__telefono-claro.png`: «Quién te prestó, Monto original, Tasa, Seguro, Comisión, Tipo de tasa (radios), Frecuencia (5 radios), Cuota pactada, Cantidad de cuotas, Modelo» en una columna larga.
- **Debería:** `condiciones-sin-modelo__telefono-claro.png`: Monto original + Tasa, Plazo + Cuotas pagadas, Primera cuota y «Modelo de cálculo» (select con «Solo se registra lo que pagás») con el aviso «Este préstamo no tiene un modelo de cálculo…»; pie fijo «Guardar condiciones».
- **Arreglo:** `flujos/cuentas-condiciones/formulario.tsx` y `campos.ts`: campos y orden de la referencia; el resto solo según el modelo elegido.
- **Cómo verificar:** con «Ninguno» solo se ven los campos de la referencia.

### CTA-41 · Pagar tarjeta: la fila de chips no envuelve y «Lo reservado» queda fuera de pantalla — Pagar tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta-pagar__principal__telefono-claro.png`: «Para no generar intereses» y «Toda la deuda» en una fila que sobresale del borde derecho; «Lo reservado» no se ve (sí en computadora).
- **Debería:** `pagar-tarjeta__telefono-claro.png`: tres chips que envuelven en dos filas.
- **Arreglo:** `flujos/cuentas-pagar/formulario.tsx`: `flex-wrap`.
- **Cómo verificar:** los tres chips dentro de los 20 px de margen.

### CTA-42 · Pagar tarjeta: subtítulo sin la fecha de pago — Pagar tarjeta · telefono-claro · baja
- **Se ve:** «Deuda $642.18».
- **Debería:** «Deuda $642.18 · pago 15/11» (`pagar-tarjeta__telefono-claro.png`).
- **Arreglo:** `textos/cuentas-pagar.ts`.
- **Cómo verificar:** texto igual.

### CTA-43 · Flujos de Cuentas en computadora llevan campana — Pagar y demás flujos · computadora-claro · media
- **Se ve:** `capturas/cuenta-pagar__principal__computadora-claro.png`: campana arriba a la derecha.
- **Debería:** regla de marco de DECISIONES: los flujos no llevan campana (la referencia es un panel lateral sin ella).
- **Arreglo:** marco de los flujos de `app/(finn)/cuentas/[cuentaId]/{pagar,cuota,archivar,eliminar,verificar-saldo,conciliar,editar,condiciones}` y `ordenar`.
- **Cómo verificar:** `marco.campana` falso en los flujos.

### CTA-44 · Pagar más que la deuda: paso extra «Revisá el pago» y aviso duplicado — Pagar tarjeta · telefono-claro · media
- **Se ve:** `capturas/cuenta-pagar__mas-que-la-deuda__telefono-claro.png`: pantalla intermedia con cuatro frases de impacto y dos avisos amarillos («Pagás $76.57 más…» y «Pagás más que la deuda…»).
- **Debería:** `pagar-saldo-a-favor__telefono-claro.png`: mismo formulario con el aviso «Pago mayor que la deuda» en línea y «Pagar $700.00»; el paso de revisión no tiene diseño (ver Sin diseño).
- **Arreglo:** `flujos/cuentas-pagar/formulario.tsx`: un solo aviso con título.
- **Cómo verificar:** un aviso y pago desde el formulario.

### CTA-45 · Pagar cuota: origen como radios, título sin número, sin subtítulo y botón «Guardar pago» — Pagar cuota · telefono-claro · media
- **Se ve:** `capturas/cuenta-cuota__principal__telefono-claro.png`: «PAGAR CUOTA», «Capital pendiente: $4,210.00», radios de 4 cuentas (incluye tarjetas), campos en una columna y «Guardar pago».
- **Debería:** `cuota__telefono-claro.png`: «Pagar cuota 14», «Préstamo personal · vence 20/10», «Desde» (select con saldo), Fecha + Total, Categoría («Cuota del préstamo · Disponible $210.00»), Desglose Capital · Interés · Seguro y «Pagar $210.00».
- **Arreglo:** `flujos/cuentas-cuota/formulario.tsx`, `textos/cuentas-cuota.ts`.
- **Cómo verificar:** título, subtítulo y botón con monto.

### CTA-46 · Cuota que no cuadra: «Guardar pago» activo y el campo sin borde de error — Pagar cuota · telefono-claro · media
- **Se ve:** `capturas/cuenta-cuota__no-cuadra__telefono-claro.png`: aviso «Capital, interés y seguro suman $209.00; el pago es de $210.00.» pero el botón sigue habilitado y ningún campo marca el error.
- **Debería:** `cuota-no-cuadra__telefono-claro.png`: campo en error con borde `--problema-borde`, el aviso y «Pagar $210.00» deshabilitado.
- **Arreglo:** `formulario.tsx` de cuota: `disabled` con motivo y `aria-invalid` en el campo.
- **Cómo verificar:** el botón no se activa hasta que la suma cuadra.

### CTA-47 · Archivar (cuenta en cero): sin título con el nombre, sin saldo y con un solo botón — Archivar · telefono-claro · baja
- **Se ve:** `capturas/cuenta-archivar__tarjeta__telefono-claro.png`: frase «¿Archivar Mastercard Clásica? …» y un solo botón «Archivar».
- **Debería:** `archivar__telefono-claro.png`: título «¿Archivar Cuenta de ahorro?», «Saldo $0.00», explicación y «Cancelar» (tonal) + «Archivar» (principal).
- **Arreglo:** `flujos/cuentas-archivar/formulario.tsx`.
- **Cómo verificar:** dos botones y título con saldo.

## Sin diseño

- **Nueva cuenta · préstamo** (`capturas/cuenta-nueva__prestamo__telefono-claro.png`) y **inversión** (`cuenta-nueva__inversion`): FALTANTES `prestamo-alta` e `inversion-alta`.
- **Billetera**: identidad visual (`capturas/cuenta__billetera__telefono-claro.png`, y en la lista `cuentas__subtipos-y-tres-tarjetas`). FALTANTES `billetera`: hoy `--cuenta-banco` con ícono `wallet` provisorio y sin motivo.
- **Nueva cuenta · revisá el impacto** (`cuenta-nueva__revisar-impacto`).
- **Pagar tarjeta · revisá el pago y resultado «listo»** (`cuenta-pagar__mas-que-la-deuda`, `cuenta-pagar__listo*`).
- **Cuentas sin ninguna cuenta** (`cuentas__sin-cuentas`): vacío «Agregá tu primera cuenta» (PANTALLAS §2.19 da la forma, no hay tablero).
- **Una sola tarjeta** (`cuentas__una-tarjeta`): billetera sin apilar.
- **«Nueva cuenta» y «Ordenar»** como botones de la lista (`cuentas__principal`) y «Ordenar cuentas» en el menú.
- **Préstamo en la lista sin modelo**: talón «Sin modelo» (`cuentas__principal`).
- **Estado de carga de Cuentas** (`cuentas__cargando`): sin `loading` propio ni esqueleto.
- **Filtro sin resultados** (`cuenta__filtro-sin-resultados`) y **período cerrado** (`cuenta__periodo-anterior`).
- **Resultados «listo»** de verificar saldo, cuota, conciliar y desarchivar.
- **Archivar tarjeta con asignaciones futuras** («Devolverlas a Listo para asignar / Dejarlas como están»).
- **Verificar saldo de tarjeta** («Deuda que muestra tu banco»).
- **Cuenta no encontrada** (`cuenta__no-encontrada`): el 404 general con otro texto.

## Candidatos a global

- Barra superior del teléfono: «Registrar» sin texto (CTA-17).
- Flujos cortos como página y no como hoja inferior / panel lateral de 440 px (CTA-04); Asignar ya lo hace bien.
- Campana en los flujos en computadora (CTA-43).
- Computadora: falta el enlace «← <padre>» sobre el título de pantallas hijas; la app solo muestra la flecha junto al título (`capturas/cuenta__tarjeta__computadora-claro.png` frente a `tarjeta__computadora-claro.png`).
- Pie fijo de flujo (`flujos/pie-de-hoja.tsx`) no usado en los formularios largos (CTA-35, CTA-09, CTA-10).
- `<input type=file>` nativo con texto en inglés (CTA-09): revisar cualquier otro flujo con carga de archivo.
- Enlaces subrayados donde la referencia pone botón tonal o principal (CTA-05, CTA-06, CTA-33).
- Avisos y resultados en `cuerpo-pequeno` sin título 700 (CTA-08, CTA-38).
- Casillas de 20 px (verificar saldo y conciliar): el área real de toque es 85 × 48, pero conviene confirmar el tamaño visible.
