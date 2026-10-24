"""Aplica CP-1 a CP-18 de 05-frontend.md a 04-backend.md (enmiendas de la Fase 5, marca [F5]).
Uso: python3 aplicar_cp.py 04-original.md 04-backend.md"""
import sys
s = open(sys.argv[1], encoding='utf-8').read()
cambios = []
def rep(a, b, n=1, cp=''):
    global s
    c = s.count(a)
    assert c == n, f'{cp}: se esperaban {n} apariciones y hay {c}: {a[:70]!r}'
    s = s.replace(a, b); cambios.append(cp)
def despues_de(ancla_bloque, linea, nuevo, cp):
    """Inserta `nuevo` después de la primera aparición de `linea` que sigue a `ancla_bloque`."""
    global s
    i = s.index(ancla_bloque); j = s.index(linea, i) + len(linea)
    s = s[:j] + nuevo + s[j:]; cambios.append(cp)
F5 = '**[F5]**'

# --- Encabezado ---------------------------------------------------------------
rep("Los cambios de cada revisión están marcados con **[R1]**, **[R2]**, **[R3]** y **[R4]**, y se listan en 0.10.",
    "Los cambios de cada revisión están marcados con **[R1]**, **[R2]**, **[R3]** y **[R4]**, y se listan en 0.10.\n\n"
    "**Enmiendas de la Fase 5** **[F5]**: los cambios CP-1 a CP-18 de `05-frontend.md` (§0.9, §2.13 y §8 de ese documento), aprobados en su revisión, se aplicaron a este documento al cerrar la Fase 5 (15 de octubre de 2026). Cada sección afectada lleva la marca **[F5]** con el número del cambio; la lista está en 0.9 y en \"Enmiendas posteriores\", al final.", cp='encabezado')

# --- 0.9 ----------------------------------------------------------------------
rep("### 0.10 Registro de cambios de las revisiones\n",
"""#### 0.9.1 Enmiendas de la Fase 5 a este documento **[F5]**

Aprobadas en la Fase 5 (`05-frontend.md`) y aplicadas aquí al cerrarla. No cambian el esquema de 03 ni el dominio de 01. CP-6 aplica aquí la precisión PF-3, que es de `02-tecnologias.md` ADR-07 (anotada en su sección \"Enmiendas posteriores\").

| CP | Qué cambia | Secciones de este documento |
|---|---|---|
| CP-1 | Catálogo cerrado de destinos de las notificaciones (`DestinoNotificacion`) y carga útil del push (`CargaPush`) | 6.12.5, 11.1, 11.4 |
| CP-2 | `bandejaPorRevisar` en el `Encabezado` | 6.0.2 |
| CP-3 | Lecturas interactivas por Server Action (lista cerrada: `sugerencia` y búsqueda de compras), con valor precargado (precisión de CP-16) | 2.2.1, 6.14.3 |
| CP-4 | `estadoSeguridad()` para Ajustes > Seguridad | 6.11, 12.2 |
| CP-5 | El permiso de notificaciones se pide solo tras un gesto | 11.1 |
| CP-6 | La interfaz importa `@finn/dominio/valores` solo en los formularios y puede sumar lo que el usuario escribe como ayuda visual (PF-3) | 1.3, 13.3 |
| CP-7 | `import * as z from 'zod'` y configuración regional aparte | 2.6 |
| CP-8 | Forma de `Propuesta` | 3.0.3, 6.0.3 |
| CP-9 | `navegacion` en las consultas con período | 6.3, 6.6, 6.9.3 |
| CP-10 | `formulario`: asignado en el catálogo (`asignar`), ocurrencia de una programada, variante `regla` | 6.14.1, 6.14.2, 6.14.4 |
| CP-11 | Funciones de autenticación de la interfaz | 12.2 |
| CP-12 | `filtros` en los DTO de reportes; `GastoSemanalDto` y `DatosBaseDto` extienden `Encabezado` | 6.9 |
| CP-13 | Una consulta lanza `ExcepcionFinn` | 2.3.2, 6.0.1 |
| CP-14 | `proxy.ts`: cabecera `x-finn-ruta`; no redirige `/ingresar` | 12.4 |
| CP-15 | `aprobado` en la salida de OP-37 y OP-50 | 3.0.3, OP-37 |
| CP-16 | Variante `formulario({ operacion: 'conciliar' })`; la previsualización de OP-46 es la de la operación que ejecuta | 6.14.1, 6.14.4, OP-46 |
| CP-17 | Route Handler `GET /serwist/[path]` (service worker) y su exclusión en `proxy.ts` | 1.2, 2.2.1, 12.4 |
| CP-18 | `etiqueta` en `CargaPush` | 11.4 |

### 0.10 Registro de cambios de las revisiones
""", cp='0.9')

# --- 0.10 (registro de cambios) -----------------------------------------------
rep("| Estado: Aprobado — Fase 4 cerrada | Aprobación del usuario | Encabezado, 19.5 |",
    "| Estado: Aprobado — Fase 4 cerrada | Aprobación del usuario | Encabezado, 19.5 |\n"
    "| **[F5]** Enmiendas CP-1 a CP-18 de la Fase 5 y precisión PF-3; sección \"Enmiendas posteriores\" | Cierre de la Fase 5 (`05-frontend.md`) | 0.9.1 y las secciones de su tabla |", cp='0.10')

# --- 1.2 árbol (CP-17) --------------------------------------------------------
rep("        notificaciones/accion/route.ts acciones desde el service worker (§11)\n",
    "        notificaciones/accion/route.ts acciones desde el service worker (§11)\n"
    "      serwist/[path]/route.ts     **[F5]** service worker compilado por Serwist, estático (CP-17)\n", cp='CP-17')

# --- 1.3 (CP-6) ---------------------------------------------------------------
rep("| `apps/web` (cliente: `'use client'`, `sw/`) | solo tipos | sí | nunca |",
    "| `apps/web` (cliente: `'use client'`, `sw/`) | solo tipos | **[F5]** solo en `src/formularios/**` y `src/componentes/formularios/**`; en el resto, solo `import type` (CP-6) | nunca |", cp='CP-6')

# --- 2.2.1 (CP-3, CP-17) ------------------------------------------------------
rep("| Acciones desde una notificación | **Route Handler** `POST /api/notificaciones/accion` | El service worker no puede invocar Server Actions; usa `fetch` con la cookie de sesión (P4-11) |\n",
    "| Acciones desde una notificación | **Route Handler** `POST /api/notificaciones/accion` | El service worker no puede invocar Server Actions; usa `fetch` con la cookie de sesión (P4-11) |\n"
    "| **[F5]** Lecturas interactivas (lista cerrada): `consultas.sugerencia({ comercio })` (6.14.3) y `consultas.formulario({ operacion: 'devolver', busqueda })` (6.14.4) | **Server Action de solo lectura**, con el envoltorio `lectura(definicion)`: `exigirSesionLectura()`, contrato Zod, `leer()`, sin `revalidatePath` y sin escrituras. Devuelve `ResultadoAccion` | Responden mientras el usuario escribe, o una vez con un valor precargado (conciliación); un Server Component obligaría a volver a pintar el formulario. Requisitos del cliente: espera de 300 ms, mínimo 2 caracteres, cancelación de la anterior y límite de resultados. Deben quedar en ≤ 30 ms en el servidor, porque Next despacha las Server Actions de una en una (CP-3) |\n"
    "| **[F5]** Servir el service worker compilado | **Route Handler** `GET /serwist/[path]` (`createSerwistRoute` de `@serwist/turbopack`), estático (`dynamic = 'force-static'`, `dynamicParams = false`) | `@serwist/turbopack` compila el service worker en `next build` y lo sirve desde una ruta, con `Service-Worker-Allowed: /`. No lee la sesión, no lee la base y no recibe datos (CP-17) |\n", cp='CP-3/CP-17')

# --- 2.3.2 (CP-13) ------------------------------------------------------------
rep("Una consulta **no** calcula montos: solo selecciona, filtra, ordena y pagina lo que devuelven los selectores (inv. 27).\n",
    "Una consulta **no** calcula montos: solo selecciona, filtra, ordena y pagina lo que devuelven los selectores (inv. 27).\n\n"
    "**[F5] Errores de una consulta (CP-13).** Una consulta devuelve su DTO o **lanza** `ExcepcionFinn` (de `@finn/aplicacion/errores`), que lleva un `ErrorFinn` completo (7.1). Para `INTERNO`, el `idError` ya está registrado en `eventos_sistema` (7.8) antes de lanzar. `NO_AUTORIZADO` lleva `datos.aal` (`'ninguna'` o `'aal1'`) para que la interfaz elija entre `/ingresar` y `/ingresar/verificar` (12.3). `ExcepcionFinn` se puede importar en el servidor de `apps/web`; la interfaz la traduce en un solo lugar (`consultar()`, 05 §7.3).\n", cp='CP-13')

# --- 2.6 (CP-7) ---------------------------------------------------------------
rep("- Los mensajes de Zod se traducen a español con un mapa de errores propio (7.6).\n",
    "- Los mensajes de Zod se traducen a español con un mapa de errores propio (7.6).\n"
    "- **[F5] Forma de importar (CP-7).** Todo esquema de `@finn/aplicacion/contratos` y de `apps/web` usa `import * as z from 'zod'`; la configuración regional en español se importa aparte (`import { es } from 'zod/locales'`). Una regla de lint prohíbe `import { z } from 'zod'`. Se mantiene Zod clásico (ADR-18); `zod/mini` queda descartado. 05 midió que en la compilación de Next las dos formas de importar pesan lo mismo; la regla se conserva por coherencia.\n", cp='CP-7')

# --- 3.0.3 (CP-8, CP-15) ------------------------------------------------------
rep("Con `ResultadoAccion<T>` de 7.1 (`yaAplicada` indica idempotencia).\n",
"""Con `ResultadoAccion<T>` de 7.1 (`yaAplicada` indica idempotencia).

**[F5] Forma de `Propuesta` (CP-8).** Trae la entrada completa, calculada por el servidor, para que la interfaz no calcule montos:

```ts
interface Propuesta {
  aviso: 'AV-08' | 'AV-14' | 'AV-22' | 'regla_comercio';
  texto: string;                                       // en voseo (7.10)
  operacion: 'OP-14' | 'OP-11' | 'OP-41';
  entrada: Record<string, unknown>;                    // entrada completa de la operación, validada por su contrato,
                                                       // sin id, modo, revisionVista ni huellaImpacto
}
```

| Propuesta | Operación | Entrada que arma el servidor |
|---|---|---|
| AV-08 "devolver la reserva excedente" | OP-14 sobre pago(t) en A | `montoNuevo` = Asig − RE(t) como texto, `esperado.monto` = Asig |
| AV-14 "sacar el Disponible de una archivada" | OP-11 | `monto` = Disp(c, A), `destino: 'lpa'`, `esperado` |
| AV-22 después de un cobro sin asignar | OP-14 sobre pago(t) en A | `montoNuevo` = Asig + R, `esperado.monto` = Asig |
| "Recordar esta categoría para este comercio" | OP-41 crear | `patron`, `categoriaId` (el `id` lo agrega el cliente) |

La interfaz ejecuta la propuesta tal cual (un toque) o abre el flujo correspondiente con la entrada como valores iniciales.

**[F5] Salida de OP-37 y OP-50 (CP-15):** además de `SalidaOperacion`, `aprobado` (ver OP-37).
""", cp='CP-8/CP-15')

# --- OP-37 (CP-15) ------------------------------------------------------------
despues_de("#### OP-37 Aprobar movimiento", "- **Avisos:** los de la operación ejecutada.",
"""
- **[F5] Salida (CP-15).** Además de `SalidaOperacion` (3.0.3), lo que se aprobó según el servidor, para que la interfaz no lo tome de la fila que mostraba:
  ```ts
  aprobado: {
    total: Centavos; comercio: string | null; fecha: FechaLocal;
    cuenta: Ref;
    destino: { categoria: Ref } | { deudor: Ref } | { partes: number };   // partes: más de una línea
  }
  ```
  Es un cambio de la salida, no de la entrada (sin `esperado`). Vale también para OP-50, que es la misma operación.""", cp='CP-15')

# --- OP-46 (CP-16) ------------------------------------------------------------
rep("- **Nota.** La conciliación nunca crea transacciones sola (inv. 14): cada alta es una acción explícita.\n",
    "- **Nota.** La conciliación nunca crea transacciones sola (inv. 14): cada alta es una acción explícita.\n"
    "- **[F5] Previsualización (CP-16).** Es la de la operación que ejecuta: con tipo `cuota_prestamo`, devuelve el desglose del modelo a la fecha del movimiento, como OP-24. Los datos del formulario los entrega `formulario({ operacion: 'conciliar' })` (6.14).\n", cp='CP-16')

# --- 6.0.1 (CP-13) ------------------------------------------------------------
rep("- Los parámetros se validan con Zod (`@finn/aplicacion/contratos/consultas.ts`). Un parámetro inválido es `VALIDACION`; un id inexistente, `NO_ENCONTRADO`.\n",
    "- Los parámetros se validan con Zod (`@finn/aplicacion/contratos/consultas.ts`). Un parámetro inválido es `VALIDACION`; un id inexistente, `NO_ENCONTRADO`. **[F5]** Se señalan lanzando `ExcepcionFinn` (2.3.2, CP-13).\n", cp='CP-13')

# --- 6.0.2 (CP-2) -------------------------------------------------------------
rep("""  notificacionesNoLeidas: number;
}
interface PeriodoDto {""", """  notificacionesNoLeidas: number;
  bandejaPorRevisar: number;   // [F5] CP-2: movimientos en pendiente, con_coincidencia, posible_duplicado, no_reconocido o error
}
interface PeriodoDto {""", cp='CP-2')
despues_de("#### 6.0.2 Encabezado común", "```\n",
"""
**[F5] `bandejaPorRevisar` (CP-2).** Es la suma de los cinco contadores de `InicioDto.atencion.bandeja` (6.1) y usa el mismo índice `ix_movimientos_estado`, en la misma instantánea de `leer()`. Agrega a toda consulta una lectura de [H]; el presupuesto de 6.0.7 (≤ 30 ms) se mantiene.
""", cp='CP-2')

# --- 6.0.3 (CP-8) -------------------------------------------------------------
rep("| `AvisoEstadoDto` | `{ aviso: 'AV-nn'; texto: string; datos: Record<string, Centavos \\| FechaLocal \\| string>; accion?: Propuesta }` | Texto en voseo (7.10) |",
    "| `AvisoEstadoDto` | `{ aviso: 'AV-nn'; texto: string; datos: Record<string, Centavos \\| FechaLocal \\| string>; accion?: Propuesta }` | Texto en voseo (7.10). **[F5]** `Propuesta` está definida en 3.0.3 (CP-8) |", cp='CP-8')

# --- 6.3 y 6.6 (CP-9) ---------------------------------------------------------
NAV = "  navegacion: { anterior?: FechaLocal; siguiente?: FechaLocal };   // [F5] CP-9: inicios de los períodos vecinos (selector periodos)\n"
rep("  categoria: Ref; grupo: Ref; clase: 'normal';\n  periodo: PeriodoDto;\n", "  categoria: Ref; grupo: Ref; clase: 'normal';\n  periodo: PeriodoDto;\n" + NAV, cp='CP-9')
rep("  categoria: Ref; tarjeta: Ref; clase: 'pago';\n  periodo: PeriodoDto;\n", "  categoria: Ref; tarjeta: Ref; clase: 'pago';\n  periodo: PeriodoDto;\n" + NAV, cp='CP-9')
rep("  saldo: Centavos; saldoConfirmado: Centavos;\n", "  saldo: Centavos; saldoConfirmado: Centavos;\n" + NAV.replace('inicios de los períodos vecinos', 'vecinos de periodoInicio, o del activo'), cp='CP-9')

# --- 6.9 (CP-12, CP-9) --------------------------------------------------------
rep("`consultas.reporte({ tipo, ventana?: 'actual' | 'ultimos_1' | 'ultimos_3' | 'ultimos_6' | 'ultimos_12', cuentaIds?: Uuid[], ... })` — un tipo por llamada.\n",
    "`consultas.reporte({ tipo, ventana?: 'actual' | 'ultimos_1' | 'ultimos_3' | 'ultimos_6' | 'ultimos_12', cuentaIds?: Uuid[], ... })` — un tipo por llamada.\n\n"
    "**[F5] Filtros (CP-12).** Todo DTO de reporte extiende `Encabezado` (6.0.2) y agrega `filtros: { cuentas: Ref[]; grupos: Ref[]; categorias: Ref[] }`, con las archivadas que tuvieron actividad en la ventana, para que la pantalla muestre los filtros por nombre. Vale también para `GastoSemanalDto` (6.9.3) y `DatosBaseDto` (6.9.4).\n", cp='CP-12')
rep("interface GastoSemanalDto {\n  periodo: PeriodoDto;\n",
    "interface GastoSemanalDto extends Encabezado {          // [F5] CP-12\n  periodo: PeriodoDto;\n" + NAV + "  filtros: { cuentas: Ref[]; grupos: Ref[]; categorias: Ref[] };   // [F5] CP-12\n", cp='CP-9/CP-12')
rep("interface DatosBaseDto {\n", "interface DatosBaseDto extends Encabezado {             // [F5] CP-12; más filtros\n", cp='CP-12')

# --- 6.11 (CP-4) --------------------------------------------------------------
rep("- El estado de los factores TOTP lo da Supabase Auth, no la base; lo define §12 (Parte C).\n",
    "- El estado de los factores TOTP lo da Supabase Auth, no la base; lo define §12 (Parte C). **[F5]** La pantalla lo lee con `estadoSeguridad()` (12.2, CP-4); `AjustesDto` no cambia.\n", cp='CP-4')

# --- 6.12.5 (CP-1) ------------------------------------------------------------
rep("destino?: { pantalla: string; id?: Uuid }; leida: boolean;",
    "destino?: DestinoNotificacion /* [F5] CP-1, 11.4 */; leida: boolean;", cp='CP-1')
rep("- `existeDestino`: si la entidad de `datos` ya no existe, la interfaz lo indica (03 §7.4).\n",
    "- `existeDestino`: si la entidad de `datos` ya no existe, la interfaz lo indica (03 §7.4).\n"
    "- **[F5]** `destino` es el tipo cerrado `DestinoNotificacion` de 11.4 (CP-1). Un destino que no valida con el contrato se trata como ausente: la interfaz abre el centro de notificaciones.\n", cp='CP-1')

# --- 6.14 (CP-10, CP-16) ------------------------------------------------------
rep("  | { operacion: 'programada'; programadaId?: Uuid }                 // OP-42\n",
    "  | { operacion: 'programada'; programadaId?: Uuid; fechaEsperada?: FechaLocal }  // OP-42; [F5] CP-10b: con fecha, OP-43 y OP-44\n", cp='CP-10')
rep("  | { operacion: 'meta'; categoriaId?: Uuid; metaId?: Uuid };        // OP-18\n",
    "  | { operacion: 'meta'; categoriaId?: Uuid; metaId?: Uuid }         // OP-18\n"
    "  | { operacion: 'regla'; reglaId?: Uuid }                           // [F5] CP-10c: OP-41\n"
    "  | { operacion: 'conciliar'; cuentaId: Uuid };                     // [F5] CP-16: OP-45, OP-46, OP-47\n", cp='CP-10/CP-16')
rep("#### 6.14.5 Revisión de flujos de §3 sin datos\n",
"""#### 6.14.4.1 Enmiendas de la Fase 5 a `formulario` **[F5]**

- **CP-10a. Asignado en el catálogo.** Para `operacion: 'asignar'`, cada entrada de `catalogos.categorias` lleva además `asignado` (Asig(c, p)) y `disponible` del período pedido (`periodoInicio`, o A). Lo necesitan los `esperado` de OP-15 (`asignacionOrigen`, `asignacionDestino`) y de OP-11 (`asignacionDestino`).
- **CP-10b. Ocurrencia de una programada.** Con `fechaEsperada`, el contexto de `programada` agrega `ocurrencia: { fechaEsperada; estado: 'pendiente' | 'emparejada' | 'registrada' | 'omitida'; transaccionId?; monto; cuenta: Ref; lineas; desglosePropuesto? }` (el desglose solo en `cuota_prestamo`, con el selector `desglosePropuesto`). Lo necesita OP-43 de un toque con sus campos editables.
- **CP-10c. Reglas de comercio.** `operacion: 'regla'` → catálogo `categorias` y `contexto: { regla?: { id; patron; categoria: Ref; esperado } }` (6.14.5 asigna a OP-41 el catálogo `categorias`, que ninguna variante entregaba).
- **CP-16. Conciliar.** `operacion: 'conciliar'` → catálogos `cuentas`, `categorias`, `categoriasPago`, `deudores` y `comercios`, y:
  ```ts
  contexto: {
    cuenta: { cuenta: Ref; tipo: TipoCuenta; saldo: Centavos; saldoConfirmado: Centavos;
              ultimaConciliacion?: { fechaEstado: FechaLocal; saldoEstado: Centavos; diferenciaActual: Centavos } };
    tiposAlta: { cargo: TipoTransaccion[]; abono: TipoTransaccion[] };   // tipos que admite un movimiento de esta cuenta según su signo
    origenPropuestoPago?: Ref;                                           // si la cuenta es tarjeta (BE-41)
    prestamos: { cuenta: Ref; tieneModelo: boolean; categoriaPropuesta?: Ref }[];
    porCobrarAbiertos: { lineaId: Uuid; transaccionId: Uuid; deudor: Ref; fechaOrigen: FechaLocal;
                         comercio: string | null; abierto: Centavos; medio: 'tarjeta' | 'debito' }[];
  }
  ```
  Lo que depende de cada movimiento del estado se resuelve sin otra consulta: el desglose de una cuota, con la previsualización de OP-46; las compras candidatas de una devolución, con la búsqueda de CP-3; la categoría sugerida, con `sugerencia` (CP-3) pedida una vez con la descripción del movimiento.

#### 6.14.5 Revisión de flujos de §3 sin datos
""", cp='CP-10/CP-16')

# --- 11.1 (CP-5, CP-1) --------------------------------------------------------
rep("| Suscripción | Al abrir la app con sesión AAL2, el cliente pide permiso (una vez) y llama a OPT-02 con `endpoint`, `p256dh`, `auth` y el agente. OPT-02 inserta o actualiza `renovada_en` |",
    "| Suscripción | **[F5] (CP-5)** El permiso **solo se pide tras un gesto del usuario**, desde la tarjeta \"Activar notificaciones\" (visible mientras el permiso no esté concedido ni denegado, y descartable) o desde Ajustes > Notificaciones; después, el cliente llama a OPT-02 con `endpoint`, `p256dh`, `auth` y el agente. Si el permiso ya está concedido, al abrir la app con sesión AAL2 el cliente renueva la suscripción con OPT-02 sin preguntar. Si está denegado, Ajustes explica cómo habilitarlo en el navegador. OPT-02 inserta o actualiza `renovada_en` |", cp='CP-5')
rep("| Service worker | `push` muestra la notificación; `notificationclick` abre la pantalla de `datos.destino` o ejecuta la acción (11.5) |",
    "| Service worker | `push` muestra la notificación; `notificationclick` abre la pantalla de `datos.destino` o ejecuta la acción (11.5). **[F5]** Se sirve en `/serwist/sw.js` (2.2.1, CP-17); el destino es `DestinoNotificacion` (11.4, CP-1) |", cp='CP-1/CP-17')

# --- 11.4 (CP-1, CP-18) -------------------------------------------------------
rep("- Carga útil ≤ 2 KB (el límite del protocolo es 4 KB).\n",
"""- Carga útil ≤ 2 KB (el límite del protocolo es 4 KB).

**[F5] Destino y carga útil (CP-1, CP-18).** `notificaciones.datos.destino` es un tipo cerrado, que viaja también en la carga útil del push (sin montos ni nombres más allá de 11.4):

```ts
// @finn/aplicacion/contratos/notificaciones.ts (importable por el cliente y el service worker)
type DestinoNotificacion =
  | { pantalla: 'inicio' }
  | { pantalla: 'bandeja' }
  | { pantalla: 'movimiento'; movimientoId: Uuid }
  | { pantalla: 'transaccion'; transaccionId: Uuid }
  | { pantalla: 'programada'; programadaId: Uuid; fechaEsperada?: FechaLocal }
  | { pantalla: 'presupuesto'; periodoInicio: FechaLocal }
  | { pantalla: 'categoria'; categoriaId: Uuid; periodoInicio?: FechaLocal }
  | { pantalla: 'diagnostico' };
interface CargaPush {
  notificacionId: Uuid; titulo: string; cuerpo: string;
  etiqueta?: 'sms' | 'programadas' | 'cierre' | 'sistema';   // CP-18: el tag de 11.2 y 11.3
  destino?: DestinoNotificacion; acciones?: ('confirmar' | 'rechazar')[];
}
```

| Motivo (11.2) | Destino |
|---|---|
| `sms_nuevo`, `sms_coincidencia`, `sms_posible_duplicado`, `sms_no_reconocido`, `sms_error` | `movimiento` |
| Push agrupado de 11.3 | `bandeja` (el registro sigue siendo uno por SMS, con `movimiento`) |
| `registro_automatico` | `transaccion` |
| `registro_automatico_fallido`, `ocurrencia_en_periodo_cerrado` | `programada` con `fechaEsperada` |
| `cierre_periodo` | `presupuesto` con el inicio del período que cerró |
| `meta_vencida` | `categoria` |
| `respaldo_atrasado`, `restauracion_atrasada`, `deriva_catalogo`, `tarea_fallida`, `carga_incremental` | `diagnostico` |
| `cambio_retroactivo` (sin push) | `inicio` |
| Sin destino o un destino que no valida | El centro de notificaciones |

- El backend fija `datos.destino` al registrar la notificación; el service worker y el centro lo validan con el mismo contrato antes de abrirlo. La traducción a rutas es de la interfaz (05 §3.5).
- El `movimientoId` que necesitan las acciones de 11.5 sale de `destino` (`pantalla: 'movimiento'`).
""", cp='CP-1/CP-18')

# --- 12.2 (CP-11, CP-4) -------------------------------------------------------
rep("- La sesión es larga y se renueva sola; el TOTP se pide al ingresar en un dispositivo nuevo o si la sesión se cierra (ADR-08).\n",
"""- La sesión es larga y se renueva sola; el TOTP se pide al ingresar en un dispositivo nuevo o si la sesión se cierra (ADR-08).

**[F5] Funciones que llama la interfaz (CP-4, CP-11)**, en `@finn/aplicacion/autenticacion`. Leen Supabase Auth con el cliente de servidor (cookies); no son consultas de §6:

```ts
// Sin exigir AAL2: la usan las rutas de ingresar.
function estadoAcceso(): Promise<{
  sesion: 'ninguna' | 'aal1' | 'aal2';
  usuarioPermitido: boolean;                       // sub = FINN_USUARIO_ID
  factoresVerificados: { id: string; nombre: string | null }[];
}>;
// exigirSesionLectura(); mfa.listFactors() y mfa.getAuthenticatorAssuranceLevel()
function estadoSeguridad(): Promise<{
  aal: 'aal1' | 'aal2';
  factores: { id: string; nombre: string | null; creadoEn: Instante; estado: 'verificado' | 'sin_verificar' }[];
}>;
// Todas devuelven ResultadoAccion (7.1).
function ingresar(e: { email: string; contrasena: string }): Promise<ResultadoAccion<{ siguiente: 'verificar' | 'inscribir' | 'listo' }>>;
function verificarFactor(e: { factorId?: string; codigo: string }): Promise<ResultadoAccion<{}>>;
function iniciarInscripcion(e: { nombre?: string }): Promise<ResultadoAccion<{ factorId: string; qrSvg: string; secreto: string; uri: string }>>;
function completarInscripcion(e: { factorId: string; codigo: string }): Promise<ResultadoAccion<{}>>;
function quitarFactor(e: { factorId: string }): Promise<ResultadoAccion<{}>>;
function cerrarOtrasSesiones(): Promise<ResultadoAccion<{}>>;
function salir(): Promise<ResultadoAccion<{}>>;
```

- `ingresar` no exige sesión; `verificarFactor`, `iniciarInscripcion` y `completarInscripcion` del primer factor exigen AAL1 del usuario permitido; el resto, `exigirSesionEscritura()` (12.3).
- `iniciarInscripcion` quita antes los factores sin verificar de intentos anteriores (`mfa.unenroll`). Códigos propios: `credenciales_invalidas`, `demasiados_intentos`, `codigo_incorrecto`, `codigo_vencido`, `inscripcion_no_permitida`, `factor_unico` (mensajes en 05 §9.7). Sin idempotencia por id: no crean hechos de Finn.
""", cp='CP-4/CP-11')

# --- 12.4 (CP-14, CP-17) ------------------------------------------------------
rep("- `matcher`: todo salvo `_next/static`, `_next/image`, íconos, `manifest.webmanifest`, el service worker y `/api/sms`, `/api/tareas/*`, `/api/respaldo/*` (estas tienen su propio secreto).\n",
    "- `matcher`: todo salvo `_next/static`, `_next/image`, íconos, `manifest.webmanifest`, el service worker y `/api/sms`, `/api/tareas/*`, `/api/respaldo/*` (estas tienen su propio secreto). **[F5]** El service worker está en `/serwist/` (CP-17); se excluye también `/sin-conexion`.\n"
    "- **[F5] (CP-14)** Agrega a cada petición la cabecera `x-finn-ruta` con la ruta y la búsqueda originales, para que la interfaz arme `?volver=` al pedir la sesión. La cabecera se reemplaza siempre; nunca se toma de la petición entrante.\n"
    "- **[F5] (CP-14)** No redirige las rutas de `/ingresar`: su lógica está en las propias páginas (`estadoAcceso()`, 12.2).\n", cp='CP-14/CP-17')

# --- 13.3 (CP-6, PF-3) --------------------------------------------------------
rep("- La interfaz nunca hace aritmética con montos (ADR-07): envía lo que escribió el usuario y recibe enteros para formatear.\n",
    "- La interfaz nunca hace aritmética con montos (ADR-07): envía lo que escribió el usuario y recibe enteros para formatear. **[F5] Excepción (CP-6, PF-3):** puede sumar y restar, con `@finn/dominio/valores`, los montos **que el usuario está escribiendo** (por ejemplo, la diferencia entre el total y las líneas de un gasto dividido), solo como ayuda visual; nunca envía un valor calculado así ni lo muestra como dato de Finn. Una regla de lint lo limita a los formularios (1.3).\n", cp='CP-6')

# --- Enmiendas posteriores ----------------------------------------------------
s = s.rstrip('\n') + """


---

## Enmiendas posteriores

Aprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle. Los textos de este documento ya están actualizados y marcados **[F5]**.

- **CP-1 a CP-18** (Fase 5, aprobados en las revisiones de `05-frontend.md`): destinos y carga del push, `bandejaPorRevisar`, lecturas interactivas, funciones de autenticación, permiso de notificaciones tras un gesto, Zod, `Propuesta`, navegación entre períodos, ajustes a `formulario` (incluida la variante `conciliar`), filtros de reportes, errores de las consultas, `proxy.ts`, salida de OP-37, Route Handler del service worker y `etiqueta` en `CargaPush`. Tabla en 0.9.1; detalle en `05-frontend.md` §0.9, §2.13 y §8.
- **PF-3** (Fase 5, aprobada en el Paso 1 de `05-frontend.md`). Es una precisión de `02-tecnologias.md` ADR-07 (anotada allí); en este documento se aplica con CP-6 (1.3 y 13.3): la interfaz puede sumar los montos que el usuario escribe solo como ayuda visual y nunca envía un valor calculado así. Detalle en `05-frontend.md` §0.8 y §5.1.
"""
open(sys.argv[2], 'w', encoding='utf-8').write(s)
print('cambios aplicados:', len(cambios))
