"""Cierre de la Fase 7: aplica CT-01 a CT-09 con la marca [F7] y una línea en "Enmiendas posteriores".

Uso: python3 -I aplicar_f7.py <dir_originales> <dir_enmendados> [--sin-ct09]
- 00 y 01 no cambian (ningún CT los toca).
- 02 y 03 ("este documento no se modifica"): solo se agregan líneas al final, en "Enmiendas posteriores" (como F4 a F6).
- 04, 05, 06 y 06-identidad-visual: nota [F7] en cada sección afectada y línea en "Enmiendas posteriores".
Cada inserción exige que su ancla exista exactamente una vez; si no, el script falla sin escribir nada."""
import sys, pathlib, re, subprocess, tempfile

ORI, ENM = map(pathlib.Path, sys.argv[1:3]); CT09 = '--sin-ct09' not in sys.argv   # CT-09 aprobado (P7-24 a)); --sin-ct09 reproduce el estado anterior
DET = 'Detalle en `07-pruebas.md`'

# ---- notas en el lugar: (archivo, línea ancla exacta o prefijo, nota que se inserta DESPUÉS de esa línea) ----
NOTAS = {
'04-backend.md': [
  ('#### 13.1.4 Reloj simulado de pruebas (BE-30)', f'**[F7]** **CT-01.** Rige esta nota sobre el texto de esta sección. `FINN_HOY_SIMULADO` se reemplaza por **`FINN_RELOJ_ARCHIVO`**: un archivo `{{ instante, fijadoEn }}` que el servidor relee en cada petición, así el reloj se cambia sin reiniciar. **Lista de permitidos:** el reloj de prueba solo se activa si `FINN_ENTORNO === \'pruebas\'` y `VERCEL_ENV` no está definida (con cualquier valor); en cualquier otro caso, si existe `FINN_RELOJ_ARCHIVO` o `FINN_HOY_SIMULADO`, la app no arranca (`instrumentation.ts`) y `relojDePrueba()` devuelve `null`. `NODE_ENV` no decide (`next start` corre con `NODE_ENV=production`). `escribir()`, `leer()` y la transacción de guardado del webhook fijan, además de `finn.hoy`, `finn.desfase_ms`, que solo tiene efecto en bases de prueba (CT-02). {DET} §4.3.'),
  ('### 4.2 Secuencia de una escritura (BE-12)', f'**[F7]** **CT-01 y CT-02.** En el paso 3, el instante del estado base es `finn.instante()` (en producción, `clock_timestamp()`), no `clock_timestamp()` directo; los pasos 2 y 3 fijan también `finn.desfase_ms` cuando el reloj de prueba está permitido (13.1.4). Donde esta sección explica BE-27 "con `clock_timestamp()`, no con `now()`", léase "con `finn.instante()` (`clock_timestamp()` en producción), no con `finn.ahora()`"; la justificación no cambia. **CT-06:** `finn.tomar_bloqueo()` deja además una marca local de la transacción que `finn.tiene_bloqueo()` exige; para la aplicación no cambia nada. {DET} §4.4 y §19.5.'),
  ('### 8.2 Flujo de una petición (BE-44)', f'**[F7]** **CT-01 y CT-02.** `recibido_en` es `finn.ahora()` de la base (antes "`now()` de la base"); la transacción de guardado fija `finn.desfase_ms` cuando el reloj de prueba está permitido. {DET} §4.4.'),
  ('### 8.6 SMS sin resultado y reproceso', f'**[F7]** **CT-02.** Las comparaciones `recibido_en < now() − 2 min` de esta sección usan `finn.ahora()`. {DET} §4.4.'),
  ('### 10.1 Disparadores', f'**[F7]** **CT-02.** La ejecución en curso se detecta con `ocurrido_en > finn.ahora() − 5 min`. {DET} §4.4.'),
  ('### 10.2 Pasos de la tarea diaria, en orden', f'**[F7]** **CT-02.** `finn.purgar_eliminaciones()` (EN-2) compara con `finn.ahora() - interval \'30 days\'`. {DET} §4.4.'),
  ('### 13.1 Fuentes de tiempo', f'**[F7]** **CT-02.** Los instantes que escribe la aplicación (`leida_en`, `push_enviada_en`, `renovada_en` al actualizar, `terminada_en`) salen siempre del instante del paso 3 de 4.2 o de `finn.ahora()`, nunca de `Date.now()` del servidor. Regla de lint nueva **L20** en `@finn/aplicacion` y `apps/web/src/app`: prohíbe `Date.now()` y `new Date()` sin argumentos fuera de los módulos de formato y del reloj de prueba. En la tabla de instantes técnicos, "`DEFAULT now()` de 03" pasa a "`DEFAULT finn.ahora()` de 03". {DET} §4.4.'),
  ('### 13.6 Zona horaria de la sesión de base de datos (BE-33) **[R1]**', f'**[F7]** **CT-02.** Donde BE-33 dice "`DEFAULT now()`", léase "`DEFAULT finn.ahora()`". {DET} §4.4.'),
  ('### 14.1 Entornos (P4-1)', f'**[F7]** **CT-01.** Variables nuevas solo en CI y en local: `FINN_ENTORNO=pruebas` y `FINN_RELOJ_ARCHIVO`. **Ninguna** de las dos, ni `FINN_HOY_SIMULADO`, existe en ningún entorno de Vercel: el job `desplegar` lo comprueba con `vercel env ls` antes de `vercel deploy --prod` (PRU-SEG-RELOJ-006, barrera 1b). {DET} §4.3.'),
],
'05-frontend.md': [
  ('### 14.1 Estructura y configuración (FE-50)', f'**[F7]** **CT-01.** El reloj de la E2E es el de 04 §13.1.4 enmendado: el `webServer` de Playwright arranca `next start` con `FINN_ENTORNO=pruebas` y `FINN_RELOJ_ARCHIVO`; el ayudante fija el instante en el archivo y, con el mismo instante, `page.clock.install()` en el navegador. **CT-04:** se agrega el nivel **componentes** (`*.cmp.test.tsx`) con el modo navegador de Vitest y el Chromium de Playwright, con axe por componente. {DET} §3.1, §4 y §19.8.'),
  ('### 11.10 Verificación (FE-46)', f'**[F7]** **CT-03.** En la fila "Lector de pantalla" de la tabla siguiente rige: lista de comprobación manual con **TalkBack** (Android, Chrome) y **NVDA** (Windows, Chrome o Firefox); VoiceOver queda como riesgo aceptado (P7-9). **Lo registra el usuario** en `pruebas/manuales/resultados.md`, con un commit firmado con su clave (P7-18, P7-20), no el agente; un fallo abre un defecto. La primera versión se declara probada en Android y en Chrome de escritorio, con WebKit de Playwright como cobertura parcial en el nocturno. {DET} §22.'),
  ('### A.7 Pantallas clave, con sus datos reales', f'**[F7]** **CT-07.** A.7 es el estado que produce la semilla `estado-a7` (`07-pruebas-verificacion.zip`, `a7/semilla/`) pasada por el motor, **después del paso 3 del recorrido 4.2** de 06 (SUPER SELECTOS ya aprobado). La pantalla Bandeja muestra el estado **anterior** al paso 3. Ningún número de A.7 se escribe a mano. Los números que citan los CA no cambian. Cambian, por coherencia con 01: Farmacia aparece en Casa con asignado y gastado $12.35 y Disponible $0.00 (Registrar: $0.00, no $27.65); Mascota (archivada) queda en $0.00 (Inicio: sin "archivadas con Disponible"); categoría nueva **Cuota del préstamo** (grupo Deudas, asignado y Disponible $210.00); totales $997.84 · $647.95 · $1,784.51; Pago Visa Oro: arrastre $456.83, actividad $166.60, Disponible $623.43; historial de Restaurantes: abril $102.00 asignados y $12.30 de Disponible, mayo $15.90, junio $3.70, julio $18.95, agosto $99.95 asignados y $0.00; Visa Oro "para no generar intereses" **$370.63** (antes $512.40); `bandejaPorRevisar` 2 y `atencion.bandeja` 1 pendiente y 1 con coincidencia fuera de la Bandeja. Tabla completa (anterior → nuevo → dónde) en `07-pruebas.md` §28.2.'),
],
'06-features.md': [
  ('- **CA-78.15 (manual)** En un Android real y en un iPhone,', '  - **[F7]** **CT-03.** Rige: "En un Android real, la pulsación larga sobre el asa…". iPhone: riesgo aceptado (P7-9); WebKit parcial no lo cubre. Procedimiento PRU-MAN-BAND-002 (`07-pruebas.md` §22).'),
  ('- **CA-70.7 (manual)** La entrega real del push en Android y en un iPhone', '  - **[F7]** **CT-03.** Rige: "La entrega real del push en Android con la app instalada (05 §8.8)". iPhone: riesgo aceptado (P7-9). Procedimiento PRU-MAN-NOTIF-001 (`07-pruebas.md` §22).'),
  ('A.7 no da el detalle de los consumos de Supermercado y Gasolina;', f'**[F7]** **CT-07.** Los consumos de Supermercado y Gasolina ya no se suponen: los define la semilla `estado-a7` (Supermercado: $92.40, $88.60 y $35.00 con Visa Oro y $71.15 con débito; Gasolina: $21.40, $24.10, $23.25 y $30.00 con Visa Oro). V6-01 se repitió sobre la semilla completa (V7-16): todos los números de esta tabla y de CA-62.1, CA-62.2 y CA-63.3 salen iguales. {DET} §28.'),
  ('**Precondición:** el estado de A.7 del diseño (período 21/09 – 20/10/2026, hoy 15/10)', f'**[F7]** **CT-07.** La precondición es la semilla `estado-a7` **antes del paso 3**: SUPER SELECTOS no existe todavía; el paso 1 lo crea como movimiento pendiente y el paso 3 lo aprueba. Los números de 3.5.12 valen después del paso 3. {DET} §12.4 y §28.'),
],
'06-identidad-visual.md': [
  ('  - Visa Oro: indicador `deuda-sin-respaldo` "Te falta reservar $18.75"', '    **[F7]** **CT-07:** "Sin intereses" es **$370.63** (antes $512.40), calculado por el motor sobre la semilla `estado-a7` (`07-pruebas.md` §28.2).'),
  ('**Estados**: *Historial como tabla* · *Sobregiro con tarjeta*', '**[F7]** **CT-07:** en el estado *Categoría de pago de tarjeta*, Visa Oro muestra deuda **$642.18** y reservado $623.43 (el texto decía "deuda $623.43"), y "Para no generar intereses · Pagá antes del 15/11 · **$370.63**". El historial de Restaurantes usa los valores nuevos de A.7 (abril $102.00 asignados; agosto $99.95 y Disponible $0.00); sigue "Se pasó 2 de 6". Las pantallas toman los números nuevos al implementarse en la Fase 8; el diseño no se rehace (`07-pruebas.md` §28.2).'),
],
}

ENMIENDA = {
'02-tecnologias.md': f'- **CT-01, CT-04 y CT-05** (Fase 7, aprobados en las revisiones de las partes A y C de `07-pruebas.md`). **ADR-01:** TypeScript estricto en todo el código de la aplicación; los activos de prueba fuera de `apps/` y `packages/` pueden usar otro lenguaje (primer caso: el oráculo `tools/pruebas/oraculo/motor_min.py`). **ADR-19, "Reloj inyectable":** el reloj de prueba solo se activa con `FINN_ENTORNO === \'pruebas\'` y `VERCEL_ENV` sin definir (lista de permitidos); fuera de eso, con la variable del reloj la app no arranca y la función lo ignora; `NODE_ENV` no decide. **ADR-19, niveles:** se agrega el nivel de componentes con el modo navegador de Vitest y el Chromium de Playwright. {DET} §3.1, §4.3 y §10.',
'03-base-de-datos.md': f'- **CT-02 y CT-06** (Fase 7, aprobados en las revisiones de las partes A y C de `07-pruebas.md`). **§4.1:** funciones nuevas `finn.ahora()` (`SELECT now()`) y `finn.instante()` (`SELECT clock_timestamp()`), que en producción no leen ningún ajuste; solo las bases de prueba instalan, en la siembra de CI, una versión que suma `finn.desfase_ms`. `finn.hoy()` no cambia. **§3.17–§3.28 y §10.3:** los 9 `DEFAULT now()` de instantes técnicos (`sms_recibidos.recibido_en`, `sms_procesamientos.procesado_en`, `cambios_posteriores.registrado_en`, `eliminaciones.eliminada_en`, `suscripciones_push.creada_en` y `renovada_en`, `notificaciones.creada_en`, `eventos_sistema.ocurrido_en`, `token_webhook.creado_en`) pasan a `DEFAULT finn.ahora()` y `@default(dbgenerated("finn.ahora()"))`; si C4 o H-05 no quedan vacíos con eso, las 9 columnas se escriben siempre explícitamente con `finn.ahora()` y conservan su `DEFAULT` de producción (respaldo b de P7-12). **§4.1, CT-06:** `finn.tomar_bloqueo()` hace además `set_config(\'finn.bloqueo_xact\', pg_current_xact_id()::text, true)` y `finn.tiene_bloqueo()` exige `coalesce(current_setting(\'finn.bloqueo_xact\', true), \'\') = pg_current_xact_id()::text` además del bloqueo; protege contra un bloqueo de sesión olvidado detrás del pooler (errores accidentales), no contra código que ponga la marca a propósito, que la prueba estática prohíbe en `@finn/db` y `@finn/aplicacion`. **§10.1:** migraciones manuales nuevas `m_reloj` y `m_bloqueo_marca` y generada `g_instantes_ahora`. **§11.6:** regla **R15** (cuerpos exactos de `ahora()` e `instante()`; ningún reloj directo fuera de `ahora`, `instante` y `hoy`; ningún `DEFAULT` con reloj directo; ausencia de `finn.desfase()`); la instantánea de C6 cambia en las funciones citadas. {DET} §4.4, §5.3 y §19.5.',
'04-backend.md': f'- **CT-01, CT-02 y CT-06** (Fase 7, aprobados en las revisiones de las partes A y C de `07-pruebas.md`). Reloj de prueba con `FINN_RELOJ_ARCHIVO` y lista de permitidos (13.1.4, 14.1); `finn.ahora()` y `finn.instante()` en lugar de `now()` y `clock_timestamp()` (4.2, 8.2, 8.6, 10.1, 10.2, 13.1, 13.6) y regla de lint L20; marca local del bloqueo, sin cambios para la aplicación (4.2). Marcas **[F7]** en cada sección. {DET} §4 y §19.5.',
'05-frontend.md': f'- **CT-01, CT-03, CT-04, CT-07 y CT-08** (Fase 7, aprobados en las revisiones de las partes A a D de `07-pruebas.md`). Reloj de E2E (14.1); lector de pantalla con TalkBack y NVDA, registrado por el usuario (11.10); nivel de componentes con el modo navegador de Vitest (14.1); A.7 como semilla ejecutada por el motor, con los números corregidos (A.7). **CT-08:** fila de `/presupuesto/estructura/plantilla` en §2.3, que CF-08 citaba y faltaba, y tablas 15.1 y 15.2 regeneradas con `trazabilidad.py` actualizado (marcas en la celda de la ruta, OP-53 y `verificar_saldo`); con eso pasan `trazabilidad.py --comprobar` y `cobertura.py`. Marcas **[F7]** en cada sección. {DET} §3, §4, §22, §28 y §34.',
'06-features.md': f'- **CT-03 y CT-07** (Fase 7, aprobados en las revisiones de las partes C y D de `07-pruebas.md`). CA-78.15 y CA-70.7 sin iPhone (riesgo aceptado, P7-9); 3.5.12 y el recorrido 4.2 sobre la semilla `estado-a7`, sin cambio en ningún número citado por los CA. Marcas **[F7]** en cada lugar. {DET} §22 y §28.',
'06-identidad-visual.md': f'- **CT-07** (Fase 7, aprobado en la revisión de la Parte C de `07-pruebas.md`). Los datos de las pantallas son los de A.7 corregido en `05-frontend.md` (semilla `estado-a7` pasada por el motor). Cambian "Sin intereses" ($370.63), la deuda del estado *Categoría de pago de tarjeta* ($642.18) y el historial de Restaurantes. El diseño no se rehace: las pantallas usan los números nuevos al implementarse (Fase 8). Marcas **[F7]** en §2.9 y §6. {DET} §28.2.',
}
CABECERA = '## Enmiendas posteriores\n\nAprobadas en fases posteriores. Este documento no se modifica; cada línea indica qué cambia y dónde está el detalle.\n\n'
CABECERA_VIVO = '## Enmiendas posteriores\n\nAprobadas en fases posteriores. Cada línea indica qué cambia y dónde está el detalle; en el texto, las marcas **[F7]** señalan dónde rige.\n\n'

# ---- CT-08 (05): fila que faltaba en §2.3 y tablas 15.1 y 15.2 regeneradas por el script de la Fase 5 actualizado ----
FILA_PLANTILLA = ('| `/presupuesto/estructura/plantilla` | [L] | `estructura()` | OP-07 en lote (`{ elementos }`, CF-19), en tandas (06 §3.9.1) | — | '
                  '**[F7]** **CT-08.** Fila que CF-08 citaba en §2.3 y faltaba. Se ofrece desde los Primeros pasos y desde `/presupuesto/estructura` sin categorías normales; '
                  'textos en `src/textos/plantilla.ts`; ids de creación en el borrador (4.11) |')
ANCLA_PLANTILLA = '| `/presupuesto/estructura/categorias/[categoriaId]` |'
NOTA_15 = ('**[F7]** **CT-08.** Las tablas 15.1 y 15.2 y el resultado se regeneraron con `trazabilidad.py` actualizado (lee la ruta aunque la celda lleve una marca **[Fn]**, '
           'y conoce OP-53). Las filas que la Fase 6 había agregado a mano (OP-07 en lote, OP-53) salen ahora del mapa; las acciones de un toque de CF-05 (4.14) '
           'aparecen en 15.2. Detalle en `07-pruebas.md` §34.')
def bloque(texto, cabecera):
    ls = texto.split('\n'); i = [k for k, l in enumerate(ls) if l == cabecera]; assert len(i) == 1, cabecera
    j = i[0]
    while j < len(ls) and ls[j].startswith('|'): j += 1
    return i[0], j
def ct08(t):
    ls = t.split('\n'); idx = [k for k, l in enumerate(ls) if l.startswith(ANCLA_PLANTILLA)]; assert len(idx) == 1
    ls.insert(idx[0] + 1, FILA_PLANTILLA); t = '\n'.join(ls)
    with tempfile.NamedTemporaryFile('w', suffix='.md', delete=False, encoding='utf-8') as f: f.write(t)
    gen = subprocess.run([sys.executable, '-I', str(pathlib.Path(__file__).parent / 'fase5' / 'trazabilidad.py'), f.name], capture_output=True, text=True, check=True).stdout
    t1 = gen.split('<!-- 15.1 -->\n')[1].split('\n<!-- 15.2 -->')[0]
    t2 = gen.split('<!-- 15.2 -->\n')[1].split('\n<!-- resumen -->')[0]
    res = gen.split('<!-- resumen -->\n')[1].split('\n')[0]
    for cab, nueva in (('| Consulta (04 §6) | Rutas | Cantidad |', t1), ('| Operación | Ruta o lugar | Clase | Componente |', t2)):
        ls = t.split('\n'); a, b = bloque(t, cab); ls[a:b] = nueva.split('\n'); t = '\n'.join(ls)
    r = re.findall(r'^Resultado actual: .*$', t, re.M); assert len(r) == 1
    t = t.replace(r[0], f'Resultado actual: {res}.')
    ls = t.split('\n'); h = [k for k, l in enumerate(ls) if l == '## 15. Trazabilidad']; assert len(h) == 1
    ls[h[0] + 1:h[0] + 1] = ['', NOTA_15]
    return '\n'.join(ls)

# ---- CT-09 (aprobado, P7-24 a)): despliegue de emergencia y restauración semanal de las primeras 8 semanas ----
NOTAS_CT09 = {
'04-backend.md': [
  ('- Configuración: el proyecto de Vercel **no** se conecta a GitHub con la integración automática;',
   f'- **[F7]** **CT-09.** Única excepción: el **despliegue de emergencia** desde la PC del usuario con `vercel deploy --prod` (PRU-MAN-OPER-002), solo si `desplegar` no puede correr (minutos de Actions agotados o Actions caído) y hay un error de dinero o de seguridad que `vercel rollback` no resuelve. Exige en local los mismos scripts de `rapido`, `integracion` y `politica-patrones` (`pnpm ci:<job>`), la barrera 1b y ninguna migración nueva; usa un token de Vercel limitado al proyecto y de vencimiento corto, revocado al terminar, nunca `vercel login`. {DET} §31.5.'),
  ('### 15.2 Catálogo de eventos',
   f'**[F7]** **CT-09.** El catálogo agrega `app` · `aviso` · `despliegue_emergencia` · `{{ commit, motivo, suites, e2e }}`. La fila la inserta el usuario desde el editor SQL de Supabase al terminar PRU-MAN-OPER-002; la aplicación no la escribe. {DET} §31.5.'),
],
}
ENMIENDA_CT09 = {
'02-tecnologias.md': f'- **CT-09** (Fase 7, aprobado en la revisión de la Parte D de `07-pruebas.md`). **ADR-10:** el despliegue a producción sigue siendo desde GitHub Actions; única excepción, el despliegue de emergencia desde la PC del usuario con `vercel deploy --prod` (PRU-MAN-OPER-002), solo si `desplegar` no puede correr y hay un error de dinero o de seguridad que `vercel rollback` no resuelve, con los mismos scripts de `rapido`, `integracion` y `politica-patrones` en local y **sin migraciones** (la regla de que una migración precede al código no tiene excepción). **ADR-22:** durante las primeras 8 semanas desde la apertura de la puerta, la prueba de restauración corre cada semana; después vuelve a ser mensual. {DET} §31.',
'04-backend.md': f'- **CT-09** (Fase 7, aprobado en la revisión de la Parte D de `07-pruebas.md`). Despliegue de emergencia como única excepción al despliegue desde el job de `main` (14.1) y evento `despliegue_emergencia` en el catálogo (15.2). Marcas **[F7]** en cada sección. {DET} §31.5.',
}

def aplicar():
    salida = {}
    for f in sorted(p.name for p in ORI.glob('*.md')):
        t = (ORI / f).read_text(encoding='utf-8')
        for ancla, nota in NOTAS.get(f, []) + (NOTAS_CT09.get(f, []) if CT09 else []):
            lineas = t.split('\n'); idx = [i for i, l in enumerate(lineas) if l.startswith(ancla)]
            assert len(idx) == 1, f'{f}: ancla {ancla[:50]!r} aparece {len(idx)} veces'
            i = idx[0]
            if lineas[i].startswith('#'): lineas[i + 1:i + 1] = ['', nota]          # encabezado: nota como primer párrafo
            else: lineas[i + 1:i + 1] = [nota]                                       # línea de lista o párrafo: justo debajo
            t = '\n'.join(lineas)
        if f == '05-frontend.md': t = ct08(t)
        if f in ENMIENDA:
            if '## Enmiendas posteriores' in t: t = t.rstrip('\n') + '\n' + ENMIENDA[f] + '\n'
            else: t = t.rstrip('\n') + '\n\n---\n\n' + (CABECERA_VIVO if f in NOTAS else CABECERA) + ENMIENDA[f] + '\n'
        if CT09 and f in ENMIENDA_CT09: t = t.rstrip('\n') + '\n' + ENMIENDA_CT09[f] + '\n'
        salida[f] = t
    ENM.mkdir(exist_ok=True)
    for f, t in salida.items(): (ENM / f).write_text(t, encoding='utf-8')
    print('\n'.join(f'{f}: {len(NOTAS.get(f, [])) + (len(NOTAS_CT09.get(f, [])) if CT09 else 0)} notas [F7], enmienda {"sí" if f in ENMIENDA else "no"}' for f in salida))

aplicar()
