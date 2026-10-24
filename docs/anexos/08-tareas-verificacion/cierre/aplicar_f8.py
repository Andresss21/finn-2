# Aplica CH-01 a CH-08 de 08-tareas.md §7 a 04, 06 y 07, con la marca [F8] y su línea en "Enmiendas posteriores".
# Cada ancla debe aparecer exactamente una vez; si no, no escribe nada (como aplicar_f7.py).
# Uso: python3 -I aplicar_f8.py <orig> <salida>
import os, re, sys
ORIG, SAL = sys.argv[1], sys.argv[2]
os.makedirs(SAL, exist_ok=True)
docs = {n: open(os.path.join(ORIG, n), encoding='utf8').read() for n in ('04-backend.md', '06-features.md', '07-pruebas.md')}
cambios = {n: [] for n in docs}

def rep(doc, viejo, nuevo, ch):
    t = docs[doc]
    if t.count(viejo) != 1:
        raise SystemExit(f'ANCLA {doc} ({ch}): aparece {t.count(viejo)} veces: {viejo[:90]!r}')
    docs[doc] = t.replace(viejo, nuevo)
    cambios[doc].append(ch)

D7 = '07-pruebas.md'; D6 = '06-features.md'; D4 = '04-backend.md'
FECHA = '23 de octubre de 2026'

# ── 07 ──
rep(D7, "**Verificación:** V7-01 a V7-06 (Parte A, §9), V7-07 a V7-10 (ajustes de la Parte A y Parte B, §14) V7-11 a V7-15 (ajustes de la Parte B y Parte C, §24) y V7-16 a V7-20 (Parte D y cierre, §35), con los archivos en `07-pruebas-verificacion.zip`.\n",
    "**Verificación:** V7-01 a V7-06 (Parte A, §9), V7-07 a V7-10 (ajustes de la Parte A y Parte B, §14) V7-11 a V7-15 (ajustes de la Parte B y Parte C, §24) y V7-16 a V7-20 (Parte D y cierre, §35), con los archivos en `07-pruebas-verificacion.zip`.\n\n"
    f"**Enmiendas de la Fase 8** **[F8]**: los cambios CH-01 a CH-06 y CH-08 de `08-tareas.md` (§7 de ese documento), aprobados en sus revisiones, se aplicaron a este documento al cerrar la Fase 8 ({FECHA}). Cada sección afectada lleva la marca **[F8]** con el número del cambio; la lista está en \"Enmiendas posteriores\", al final.\n", 'encabezado')
# CH-01
rep(D7, "1. **Por las Piezas de 06.** Cada ficha lista sus operaciones, consultas y rutas. Por convención de nombres de la Fase 8, una operación vive en `packages/aplicacion/src/operaciones/op-nn-*.ts`, una consulta en `packages/aplicacion/src/consultas/<nombre>.ts` y una ruta en `apps/web/src/app/(finn)/<ruta>/**`.",
    "1. **Por las Piezas de 06.** Cada ficha lista sus operaciones, consultas y rutas. Por la estructura de 04 §1.2, una operación vive en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts`, una consulta en `packages/aplicacion/src/consultas/<pantalla>.ts` y una ruta en `apps/web/src/app/(finn)/<ruta>/**`; el script resuelve la operación por el patrón `**/OP-nn-*.ts` **[F8]** (CH-01).", 'CH-01')
rep(D7, "2. La Fase 8 nombra las operaciones `op-nn-*.ts` y las consultas por su nombre de 04 §6, para que 13.6 funcione sin mapa.",
    "2. Una operación vive en `packages/aplicacion/src/operaciones/<area>/OP-nn-*.ts` y una consulta en `packages/aplicacion/src/consultas/<pantalla>.ts` (04 §1.2), para que 13.6 funcione sin mapa **[F8]** (CH-01).", 'CH-01')
# CH-02
rep(D7, "| **`main` rojo visible** | Que nadie se entere | Si `ci.yml` falla en `main`, el último paso llama al endpoint de eventos del sistema (ADR-23) y la tarea diaria envía un push \"`main` en rojo: no se despliega\" |",
    "| **`main` rojo visible** | Que nadie se entere | Si `ci.yml` falla en `main`, GitHub envía el correo de workflow fallido (TU-01, paso 4, de `08-tareas.md`); no hay push ni evento **[F8]** (CH-02) |", 'CH-02')
rep(D7, "El primer mes de la Fase 8 sirve de calibración: el nocturno guarda el uso real por job en `eventos_sistema` (origen `app`, ADR-23) y la Parte D fija los valores definitivos con esos datos.",
    "El primer mes de la Fase 8 sirve de calibración: el nocturno sube el uso real por job como artefacto `minutos-AAAAMM` (90 días), y la Parte D fija los valores con esos datos **[F8]** (CH-02).", 'CH-02')
# CH-03
rep(D7, "| 2 | **SP-01:** muestras reales recibidas, anonimizadas (§23) y con PRU-MAN-BAND-003, PRU-MAN-BAND-004 y PRU-MAN-CONC-001 en \"pasa\"; los CA ⚠ (S6-1) con sus pruebas automáticas reescritas | `resultados.md` y M11 |",
    "| 2 | **SP-01:** muestras reales recibidas, anonimizadas (§23) y con PRU-MAN-BAND-003, PRU-MAN-BAND-004 y PRU-MAN-CONC-001 en \"pasa\"; los CA ⚠ (S6-1) con sus pruebas automáticas reescritas. **[F8] (CH-03):** (a) **SMS:** un formato activo reescrito con muestras reales por cada institución de 03 §9.4 que se use: el BAC y Banco Agrícola; Cuscatlán excluido con la fila firmada `exclusión SP-01 \\| institucion:Cuscatlán \\| sin cuentas` y F-3 inactivo. (b) **CSV:** muestras de cada formato de ADR-17 de las instituciones usadas, o su exclusión firmada: los del BAC con muestras; los de Banco Agrícola con muestras si el banco ofrece CSV, y si no, excluidos con su fila firmada y verificados con FT-44; el de Cuscatlán, excluido | `resultados.md`, M11 y `pruebas:puerta`, que cruza `pruebas/muestras-cobertura.json` con las filas de exclusión |", 'CH-03')
rep(D7, "- **Riesgo RS-03 de 04 sin cambios:** si las muestras no llegan, la decisión de desactivar F-1..F-3 es de la Fase 8. La Parte D lo registra en los riesgos de salida.",
    "- **Riesgo RS-03 de 04 sin cambios:** si las muestras no llegan, la decisión de desactivar F-1..F-3 es de la Fase 8. La Parte D lo registra en los riesgos de salida.\n- **Cobertura verificable [F8] (CH-03).** `anonimizar.ts` genera `pruebas/muestras-cobertura.json` (institución, tipo de SMS y formato de CSV con muestras). La condición 2 de §30 lo cruza con las filas de exclusión firmadas.", 'CH-03')
# CH-04
rep(D7, "| PRU-MAN-PWA-001 | 05 §11.10 (CT-03) |",
    "| PRU-MAN-CTA-002 **[F8]** (CH-04) | §31.1 | Android o PC con la app de cada banco | Semanal, entre `F` y `fin_primeras_semanas` (§31.4) | Verificar saldo (FT-44) de cada cuenta con su banco: diferencia cero, o explicada en FT-44 |\n| PRU-MAN-PWA-001 | 05 §11.10 (CT-03) |", 'CH-04')
# CH-05
for k in range(1, 6):
    rep(D7, f"\n| POOL-0{k} | {'50 escrituras' if k == 1 else 'Las transacciones' if k == 2 else 'Control: un `SET`' if k == 3 else 'Control: un bloqueo asesor' if k == 4 else 'Control: una sentencia'}", f"\n| PRU-INT-POOL-00{k} (POOL-0{k}) **[F8]** | {'50 escrituras' if k == 1 else 'Las transacciones' if k == 2 else 'Control: un `SET`' if k == 3 else 'Control: un bloqueo asesor' if k == 4 else 'Control: una sentencia'}", 'CH-05')
rep(D7, "**PRU-INT-POOL (V7-05).** Corre en `integracion`, con PgBouncer como servicio del job:",
    "**PRU-INT-POOL (V7-05).** Corre en `integracion`, con PgBouncer como servicio del job. **[F8]** (CH-05): cada prueba tiene su identificador completo, PRU-INT-POOL-001 a 005; PRU-INT-POOL-006 (V-05) no cambia:", 'CH-05')
# CH-06
rep(D7, "La carga firmada de las acciones (HMAC, vencimiento, versión de clave; V-26); la prueba de catálogo de CF-16",
    "Las acciones de notificación exigen `Origin` de la app, la cabecera `X-Finn-Accion` y AAL2 (BE-54), sin firma **[F8]** (CH-06); la prueba de catálogo de CF-16", 'CH-06')
rep(D7, "Una conciliación nunca crea transacciones (inv. 14); el signo de la diferencia (ESC-47) en efectivo y en tarjeta (CF-01)",
    "Una conciliación nunca crea transacciones (inv. 14); el signo de la diferencia (ESC-47) en efectivo y en tarjeta (CF-01); la carga firmada de la conciliación (HMAC, vencimiento, versión de clave; BE-49, V-26) **[F8]** (CH-06)", 'CH-06')
rep(D7, "| PRU-SEG-NOTIF-001 | `X-Finn-Accion` con firma alterada, vencida o de clave retirada: rechazada (V-26) | `RH` |",
    "| PRU-SEG-NOTIF-001 | Acción de notificación sin `Origin` de la app, sin `X-Finn-Accion` o sin AAL2: rechazada (BE-54) **[F8]** (CH-06) | `RH` |\n| PRU-SEG-CONC-001 **[F8]** (CH-06) | Carga firmada de la conciliación válida, de otra cuenta, alterada, vencida, con la clave anterior y con una versión retirada (BE-49, V-26) | `INT` |", 'CH-06')
rep(D7, "| V-26 | Carga firmada con HMAC | PRU-SEG-NOTIF-001 |", "| V-26 | Carga firmada con HMAC (de la conciliación) | PRU-SEG-CONC-001 **[F8]** (CH-06) |", 'CH-06')
# CH-08
rep(D7, "| `pruebas/mapa-codigo.json` | Patrones de archivos → features, o `marco` (13.6) | La Fase 8; M12 obliga a que esté completo |",
    "| `pruebas/mapa-codigo.json` | Patrones de archivos → features, o `marco` (13.6) | La Fase 8; M12 obliga a que esté completo |\n| `pruebas/pendientes-e2e.json` **[F8]** (CH-08) | CA de una ficha [I] probados con el estado sembrado porque la ficha que produce ese estado todavía no existe, con la ficha que los completa (\"pendientes de punta a punta\") | La tarea de la Fase 8 que cubre el CA; la que completa la ficha los cierra |", 'CH-08')
rep(D7, "| M17 | Todo commit que toca `resultados.md` o `firmantes-permitidos` está firmado con una clave de `firmantes-permitidos` leída de la rama base; un PR no puede tocar esos dos archivos | Siempre (`tools/pruebas/firmas.sh`) |",
    "| M17 | Todo commit que toca `resultados.md` o `firmantes-permitidos` está firmado con una clave de `firmantes-permitidos` leída de la rama base; un PR no puede tocar esos dos archivos | Siempre (`tools/pruebas/firmas.sh`) |\n| M18 **[F8]** (CH-08) | Cada CA de `pendientes-e2e.json` cita una ficha que existe; una ficha que completa pendientes no pasa a `terminada` sin una E2E que cite cada uno; `features.json` marca esos CA como `pendiente_e2e` hasta entonces; en modo puerta, un pendiente cuya ficha no es [P] es una falta | Siempre; la falta, en modo puerta |", 'CH-08')
rep(D7, "| 7 | `pr:mergear` mostró el resumen de cambios de estado y de manuales pendientes, y el PR se mergeó con él | `pr:mergear` |",
    "| 7 | `pr:mergear` mostró el resumen de cambios de estado y de manuales pendientes, y el PR se mergeó con él | `pr:mergear` |\n| 8 **[F8]** (CH-08) | Si la ficha completa CA pendientes de punta a punta de otras fichas, cada uno tiene su E2E en verde (M18) | `rapido` (matriz) y `cierre` |", 'CH-08')
rep(D7, "| 6 | Ensayo de PRU-MAN-OPER-002 (§31.5) en \"pasa\". El ensayo despliega el mismo commit que ya está en producción | `resultados.md` |",
    "| 6 | Ensayo de PRU-MAN-OPER-002 (§31.5) en \"pasa\". El ensayo despliega el mismo commit que ya está en producción | `resultados.md` |\n| 7 **[F8]** (CH-08) | Ningún CA pendiente de punta a punta, salvo los de fichas [P] | `matriz --puerta` (M18) |", 'CH-08')
docs[D7] = docs[D7].rstrip('\n') + f"""

---

## Enmiendas posteriores

Aprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle; en el texto, las marcas **[F8]** señalan dónde rige.

- **CH-01 a CH-06 y CH-08** (Fase 8, aprobados en las revisiones de `08-tareas.md`, aplicados al cerrarla el {FECHA}). CH-01: rutas de operaciones y consultas por la estructura de 04 §1.2 (13.6, 16.2). CH-02: `main` en rojo avisa con el correo de GitHub y el uso por job queda como artefacto (6.3, 6.5). CH-03: cobertura verificable de SP-01 en la puerta (23, 30). CH-04: PRU-MAN-CTA-002 en la lista manual (22.1). CH-05: identificadores completos de la suite del pooler (5.3). CH-06: las acciones de notificación sin firma (BE-54) y V-26 a PRU-SEG-CONC-001 (18, 19.1, 20.1). CH-08: CA pendientes de punta a punta, M18 y su condición en el terminado y en la puerta (13.2, 13.3, 27, 30). Texto de cada cambio en `08-tareas.md` §7.
"""
cambios[D7].append('enmiendas')

# ── 06 (CH-07) ──
rep(D6, "| **Dependencias** | Features que tienen que existir antes |",
    "| **Dependencias** | Features que tienen que existir antes. **[F8]** (CH-07): **de construcción**, la ficha no se puede construir sin ellas; **de datos**, la ficha se construye y se prueba con el estado sembrado por operaciones, y los CA afectados quedan pendientes de punta a punta hasta que exista la ficha que produce ese estado (07 §13, M18). Cada ficha marca las suyas de datos |", 'CH-07')
DATOS = {'FT-03': 'FT-34, FT-38', 'FT-04': 'FT-77', 'FT-08': 'FT-16, FT-27, FT-41, FT-62', 'FT-16': 'FT-71', 'FT-19': 'FT-40', 'FT-34': 'FT-73', 'FT-35': 'FT-41', 'FT-54': 'FT-55'}
for ft, dd in DATOS.items():
    t = docs[D6]
    i = t.index(f'\n#### {ft} ')
    j = t.index('**Dependencias.**', i)
    k = t.index('\n', j)
    assert t.index('\n#### FT-', i + 5) > j, ft
    docs[D6] = t[:k] + f" **[F8]** (CH-07): de datos, {dd}; las demás, de construcción." + t[k:]
    cambios[D6].append('CH-07 ' + ft)
docs[D6] = docs[D6].rstrip('\n') + f"\n- **CH-07** (Fase 8, aprobado en la revisión de la Parte C de `08-tareas.md`, aplicado al cerrarla el {FECHA}). Dependencias de construcción y de datos (2.0) y las de datos de FT-03, FT-04, FT-08, FT-16, FT-19, FT-34, FT-35 y FT-54. Los CA no cambian. Marcas **[F8]**.\n"
cambios[D6].append('enmiendas')

# ── 04 (CH-03: solo la línea de enmiendas) ──
docs[D4] = docs[D4].rstrip('\n') + f"\n- **CH-03** (Fase 8, aprobado en la revisión de la Parte A de `08-tareas.md`, aplicado al cerrarla el {FECHA}). SP-01 se verifica en la puerta de 07 §30 con `pruebas/muestras-cobertura.json` y las filas de exclusión firmadas: el BAC y Banco Agrícola con muestras; Cuscatlán excluido y F-3 inactivo. El requisito de SP-01 no cambia. Sin marcas en el texto.\n"
cambios[D4].append('enmiendas')

for n, t in docs.items():
    open(os.path.join(SAL, n), 'w', encoding='utf8').write(t)
for n, c in cambios.items(): print(n, len(c), 'cambios:', ', '.join(sorted(set(c))))
