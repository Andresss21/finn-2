# Procedimientos manuales

Los 15 procedimientos de `docs/07-pruebas.md` §22.1, con los pasos de §29.2, §31.4, §31.5 y 04 §8.8 y §17.2 (DP-20). La matriz (`pnpm pruebas:matriz`, M10) exige en cada uno **Disparador**, **Pasos** numerados y **Resultado esperado**.

- Cada ejecución se registra como una fila en `pruebas/manuales/resultados.md` (formato de 07 §22.2), con un commit firmado por el usuario (P7-18, P7-20). Los agentes no escriben ese archivo y un PR no puede tocarlo.
- Vale el último resultado de cada manual. Una falla posterior reabre el pendiente (M16).
- Los manuales complementan a las pruebas automáticas de los mismos CA; no las reemplazan.
- iPhone, iPad y VoiceOver no tienen procedimiento: son riesgo aceptado (P7-9).

### PRU-MAN-ACCESO-001 [CA-02.5] Inscripción TOTP con Google Authenticator y un gestor de contraseñas

**Dispositivo:** Android con Google Authenticator, y un gestor de contraseñas que lea TOTP.

**Disparador:** antes de terminar FT-02; al cambiar la inscripción del segundo factor.

**Pasos:**

1. Abrir la pantalla de inscripción del segundo factor en la app (FT-02) en una sesión nueva.
2. Con Google Authenticator, escanear el QR. Anotar el código de 6 dígitos que genera.
3. Escribir ese código en la app y confirmar la inscripción. Debe verificar.
4. Cerrar la sesión, repetir la inscripción con un usuario de prueba y esta vez copiar el secreto en texto (no el QR).
5. Pegar el secreto en el gestor de contraseñas que lee TOTP y esperar el código que genera.
6. Escribir ese código en la app y confirmar. Debe verificar.
7. Comprobar que, al ingresar de nuevo, los códigos de ambos generadores se aceptan.

**Resultado esperado:** el QR y el secreto copiado generan códigos que verifican, con Google Authenticator y con el gestor de contraseñas.

**Registro:** fila firmada en `resultados.md` con el dispositivo, la versión de la app y el resultado.

### PRU-MAN-OPER-001 [DP-24, M17, P7-20] Firma de los resultados manuales en Windows

**Dispositivo:** la PC con Windows, con Git for Windows instalado.

**Disparador:** una vez, antes del primer resultado manual. Repetir si cambias de PC o de clave.

**Pasos:**

1. **Crear la clave dedicada, con contraseña.** En PowerShell: `ssh-keygen -t ed25519 -C "finn-resultados-manuales" -f "$env:USERPROFILE\.ssh\finn_resultados"`. Contraseña nueva y larga, guardada en el gestor de contraseñas. No se agrega con `ssh-add`.
2. **Comprobar que el agente de Windows no la tiene.** `ssh-add -l` no debe listar `finn-resultados-manuales`. Si el servicio "OpenSSH Authentication Agent" está activo por otras claves, puede seguir así, pero esta clave no se agrega nunca.
3. **Configurar Git solo en el repositorio de Finn**, sin `--global`, desde la carpeta del repositorio:
   - `git config gpg.format ssh`
   - `git config gpg.ssh.program "C:/Windows/System32/OpenSSH/ssh-keygen.exe"`, o el `ssh-keygen` de Git for Windows (`C:/Program Files/Git/usr/bin/ssh-keygen.exe`)
   - `git config user.signingkey "$env:USERPROFILE/.ssh/finn_resultados"` (la ruta de la clave **privada**, para que pida la contraseña en vez de buscar el agente)
   - `git config commit.gpgsign false` (no firmar todo; solo estos commits)
4. **Registrar la clave pública.** Agregar a `pruebas/firmantes-permitidos` una sola línea: `<email> ssh-ed25519 AAAA… finn-resultados-manuales`, con el contenido de `finn_resultados.pub`. Commit firmado y push directo a `main`: `git commit -S -m "firmantes"`. Pide la contraseña.
5. **Registrar un resultado.** Editar `pruebas/manuales/resultados.md` (una fila por ejecución); `git add pruebas/manuales/resultados.md`; `git commit -S -m "resultado PRU-MAN-…"`, con la contraseña; `git push` a `main`. Los PR no pueden tocar ese archivo (M16).
6. **Verificar en la PC.** `git -c gpg.ssh.allowedSignersFile=pruebas/firmantes-permitidos verify-commit HEAD` debe decir `Good "git" signature`.

**Resultado esperado:**

- el paso 6 da firma válida;
- `rapido` en `main` pasa PRU-SEG-OPER-001;
- un commit de prueba sin `-S` que toque `resultados.md` en una rama hace fallar `rapido`.

**Registro:** esta primera ejecución se registra como la primera fila de `resultados.md`, firmada.

**No verificado aquí:** Windows. V7-12 y V7-17 probaron el mecanismo con OpenSSH 9 y Git 2.43 en Linux. **Si la firma desde Windows no funciona en la práctica, se avisa al usuario antes de buscar otra alternativa** (P7-20). El punto con más riesgo es el paso 3: qué `ssh-keygen` usa Git y si pide la contraseña en la terminal.

### PRU-MAN-OPER-002 [DP-34, CT-09, §31.5] Despliegue de emergencia sin GitHub Actions

**Dispositivo:** la PC con Windows, con Git; Node 24 y pnpm; Docker Desktop (la suite de integración usa Testcontainers); la CLI de Vercel (`pnpm dlx vercel@<versión fijada en package.json>`).

**Disparador:** solo en una emergencia, cuando se cumplen las dos condiciones: (1) `desplegar` no puede correr (minutos de Actions agotados, o Actions caído según su página de estado) y (2) hay en producción un error de dinero (§31) o de seguridad que `vercel rollback` no resuelve. Además, un ensayo antes de abrir la puerta (condición 6 de §30, vigente por CT-09), con el motivo `ensayo`. No se usa para features, cambios que pueden esperar al mes siguiente ni correcciones que necesitan una migración.

**Pasos:**

1. **Descartar `vercel rollback`.** Si el error llegó con el último despliegue y volver al anterior lo evita, hacer `vercel rollback` y detenerse aquí.
2. **Llevar la corrección a `main`.** Con Actions detenido no corren los checks ni `pr:mergear`. El usuario revisa el diff y hace push a `main` de la rama de corrección, que debe ser un solo commit firmado (`git commit -S`, con la clave de §29). `rapido` exige la firma solo para `resultados.md`; aquí la firma identifica que el push lo hizo el usuario.
3. **Estado limpio en ese commit.** `git switch main && git pull --ff-only`; `git status` sin cambios; anotar `git rev-parse HEAD`.
4. **Sin migraciones nuevas.** `git diff --name-only <commit desplegado>..HEAD -- packages/db/prisma/migrations` vacío. El commit desplegado se ve en `/ajustes/diagnostico` (FT-76). Si no está vacío, detenerse: este procedimiento no aplica.
5. **Las mismas suites, en local.** `pnpm install --frozen-lockfile`, y después `pnpm ci:rapido`, `pnpm ci:integracion` y `pnpm ci:politica-patrones` (requisito de `desplegar`, 04 §14.1). Los tres deben quedar en verde. No corren las E2E: el registro lo dice.
6. **Token temporal de Vercel.** Crear en el panel de Vercel (Account Tokens) un token limitado al proyecto de Finn (alcance Project) y con el vencimiento más corto que ofrezca el panel, idealmente 1 día. En una ventana nueva de PowerShell: `$env:VERCEL_TOKEN = "<token>"`, `$env:VERCEL_ORG_ID = "<id>"`, `$env:VERCEL_PROJECT_ID = "<id>"`. No usar `vercel login`, que dejaría una sesión guardada en la PC.
7. **Barrera 1b.** `node tools/ci/barrera-1b.mjs`: comprueba con `vercel env ls` que `FINN_ENTORNO`, `FINN_RELOJ_ARCHIVO` y `FINN_HOY_SIMULADO` no existan en ningún entorno de Vercel (CT-01).
8. **Desplegar.** `vercel deploy --prod --token $env:VERCEL_TOKEN`. La compilación ocurre en Vercel y no usa minutos de Actions.
9. **Comprobar.** `/ajustes/diagnostico` muestra el commit del paso 3; el caso que reproducía el error (el escenario `PRU-ESC-REG-nn` de §31.2) ya no se ve en la app; "Verificar saldo" (FT-44) de la cuenta afectada da diferencia cero o la explicada.
10. **Revocar el token** en el panel de Vercel y cerrar esa ventana de PowerShell.
11. **Registrar.** En el editor SQL de Supabase: `INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos) VALUES ('aviso', 'app', 'despliegue_emergencia', jsonb_build_object('commit', '<sha>', 'motivo', '<texto>', 'suites', 'rapido, integracion, politica-patrones', 'e2e', false));`. Además, una fila firmada en `resultados.md` con `PRU-MAN-OPER-002`, el commit y el motivo.

**Resultado esperado:**

- producción corre el commit corregido;
- el error ya no se reproduce;
- el token está revocado;
- quedan dos registros: `eventos_sistema` y `resultados.md`.

**Registro:** fila firmada en `resultados.md` con `PRU-MAN-OPER-002`, el commit y el motivo (`ensayo` en el ensayo previo a la puerta). La de `eventos_sistema` se purga a los 90 días (ADR-23); la de `resultados.md` es el registro permanente. Para el ensayo se hacen los pasos 3 a 11 con el commit que ya está en producción.

**No verificado aquí:** Docker Desktop y Testcontainers en Windows; la CLI de Vercel con un token de vencimiento corto.

### PRU-MAN-OPER-003 [§31.4, P7-22] Apagar la 1.0

**Dispositivo:** paneles de Supabase y de Vercel de la 1.0.

**Disparador:** el día `fin_primeras_semanas` (`F + 56 días`, con `F` registrada en `resultados.md`), sin incidentes de integridad.

**Pasos:**

1. Comprobar en `resultados.md` que no hay filas `incidente de integridad` entre `F` y `fin_primeras_semanas`. Si las hay, detenerse: la 1.0 no se apaga y la decisión vuelve al usuario.
2. Exportar los datos de la 1.0 con su mecanismo de exportación, o con un volcado `pg_dump` del proyecto, y guardarlos fuera del repositorio.
3. Pausar el proyecto de Supabase de la 1.0 desde su panel.
4. Quitar el despliegue de producción de la 1.0 en Vercel.

**Resultado esperado:** la 1.0 no responde; la 2.0 sigue igual; queda libre el segundo cupo de Supabase.

**Registro:** fila firmada en `resultados.md`.

### PRU-MAN-BAND-001 [CA-03.5, SP-04] Prueba del teléfono con MacroDroid

**Dispositivo:** Android con MacroDroid.

**Disparador:** antes de terminar FT-03; al cambiar `/api/sms` o `FINN_WEBHOOK_FORMATO`.

**Pasos:**

1. Configurar la macro según 04 §8.8 (disparador SMS recibido, acción HTTP `POST` a `https://<proyecto>.vercel.app/api/sms`, cabeceras, cuerpo y tiempo de espera de 30 s), con la variante A o la B de la tabla.
2. Ejecutar "Probar acción" de MacroDroid, o enviar un SMS de prueba desde otro teléfono con un remitente agregado temporalmente al filtro. Debe aparecer en la Bandeja como `no_reconocido`.
3. Enviar un SMS con comillas dobles y un salto de línea (por ejemplo `Prueba "Finn"` + salto de línea + `segunda línea`). Debe llegar completo; así se elige la variante del cuerpo (regla de 8.1.1).
4. Cambiar la URL de la macro a una ruta inexistente (responde 404) y verificar que la macro reintenta según el plan elegido (reintento propio de la acción HTTP ante códigos distintos de 2xx, o el ciclo del plan B con 1 envío y hasta 3 reintentos cada 30 s). Si se usa el reintento propio, confirmar en su configuración que cubre los 5xx.
5. Volver la URL a la correcta.
6. Quitar el remitente temporal del filtro.

**Resultado esperado:** la prueba del teléfono de 04 §8.8 llega como no reconocido, con la variante y el plan de reintentos de SP-04 registrados.

**Registro:** fila firmada en `resultados.md`; en la Nota, la variante (A o B) y el plan de reintentos elegido (condición 4 de §30).

### PRU-MAN-BAND-002 [CA-78.15, CT-03] Pulsación larga sobre el asa de arrastre

**Dispositivo:** Android real.

**Disparador:** antes de terminar FT-78.

**Pasos:**

1. Abrir una lista con asas de arrastre (la Bandeja, FT-78) en Chrome para Android.
2. Mantener pulsada el asa de un movimiento durante un segundo. Observar si se abre el menú contextual del navegador o si se selecciona texto.
3. Con el dedo sobre la lista, desplazarla hacia arriba y hacia abajo, y también empezando el gesto sobre un asa.
4. Mantener pulsada el asa y arrastrar hasta una categoría para soltar (paso del panel de destinos).

**Resultado esperado:** la pulsación larga sobre el asa no abre el menú contextual ni selecciona texto; desplazar la lista sigue funcionando.

**Registro:** fila firmada en `resultados.md` con el modelo de Android y la versión de Chrome. iPhone queda como riesgo aceptado (P7-9). Si falla, se apaga el arrastre sin tocar FT-35 (R6-2).

### PRU-MAN-NOTIF-001 [CA-70.7, CT-03] Entrega real del push

**Dispositivo:** Android con la app instalada (PWA).

**Disparador:** antes de terminar FT-70; al cambiar el service worker.

**Pasos:**

1. Instalar la app en Android y conceder el permiso de notificaciones.
2. Con la app cerrada, provocar una notificación real (por ejemplo, desde "Ejecutar tareas ahora" o un evento que el catálogo de notificaciones genere).
3. Comprobar que el push llega a la bandeja de notificaciones del teléfono, con su título, su texto y sus acciones.
4. Tocar una acción y comprobar que se ejecuta como en el service worker.
5. Provocar otra y tocar la notificación misma: debe abrir la app en la ruta de destino.

**Resultado esperado:** el push real llega, con sus acciones, y el toque abre la ruta.

**Registro:** fila firmada en `resultados.md` con el modelo de Android y la versión de la app.

### PRU-MAN-BAND-003 [CA-34.14, S6-1] Intérprete de SMS con muestras reales

**Dispositivo:** ninguno: se usan las muestras reales de SMS (07 §23).

**Disparador:** cuando lleguen las muestras de SP-01.

**Pasos:**

1. Tomar las muestras reales anonimizadas de SMS de depósito, pago a tarjeta y devolución (07 §23) de cada institución usada.
2. Pasar cada muestra por el intérprete de SMS (la misma ruta que `POST /api/sms`, en local con la semilla correspondiente).
3. Anotar el tipo propuesto de cada una y compararlo con el esperado: ingreso, pago de tarjeta y devolución.
4. Si alguna no coincide, anotar la muestra (anonimizada) y el formato afectado; el formato se corrige (OPT-05), no la ficha.
5. Reescribir las pruebas automáticas de CA-34.14 con las muestras reales.

**Resultado esperado:** el tipo propuesto de depósito, pago a tarjeta y devolución es el esperado con los SMS reales.

**Registro:** fila firmada en `resultados.md`, con la institución y la cantidad de muestras. Cuenta para la condición 2 de la puerta (§30).

### PRU-MAN-CONC-001 [CA-43.10, S6-1] Detección de formato de CSV con muestras reales

**Dispositivo:** ninguno: se usan las muestras reales de estados de cuenta en CSV (07 §23).

**Disparador:** cuando lleguen las muestras de SP-01.

**Pasos:**

1. Tomar los CSV anonimizados de cada formato de ADR-17 de las instituciones usadas.
2. Cargar cada CSV en la conciliación (FT-43) y anotar el formato que elige la detección.
3. Comparar con el formato esperado de cada archivo.
4. Si alguno no coincide, anotar el archivo (anonimizado) y el formato afectado.
5. Reescribir las pruebas automáticas de CA-43.10 con las muestras anonimizadas.

**Resultado esperado:** la detección elige el formato correcto con los CSV anonimizados.

**Registro:** fila firmada en `resultados.md`. Cuenta para la condición 2 de la puerta (§30); las exclusiones llevan su fila firmada.

### PRU-MAN-BAND-004 [CA-73.6, S6-1] Formatos reescritos con muestras reales

**Dispositivo:** ninguno: se usan las muestras reales de SMS (07 §23).

**Disparador:** cuando lleguen las muestras de SP-01 (FX-1).

**Pasos:**

1. Reescribir cada formato de SMS activo con las muestras reales de su institución.
2. Pasar cada formato por la política de patrones (QC-3) y comprobar que la acepta.
3. Comprobar que cada formato reconoce todas sus muestras reales.
4. Si un formato no reconoce una muestra, corregir el formato (OPT-05) y repetir desde el paso 2.

**Resultado esperado:** cada formato reescrito pasa la política y reconoce sus muestras.

**Registro:** fila firmada en `resultados.md`, con la institución y la cantidad de muestras. Cuenta para la condición 2 de la puerta (§30).

### PRU-MAN-CTA-001 [CA-55.1, CA-55.2] Tabla de amortización contra un estado de cuenta real

**Dispositivo:** un estado de cuenta real de Banco Agrícola.

**Disparador:** antes de terminar FT-55.

**Pasos:**

1. Con los datos del préstamo del estado de cuenta (monto, tasa, seguro, cuota y fecha de apertura), abrir la tabla de amortización (FT-55).
2. Comparar fila por fila con el estado de cuenta: interés, seguro, capital y saldo de cada cuota.
3. Registrar un abono a capital como el del estado de cuenta y comparar las cuotas siguientes (CA-55.2).
4. Anotar cada diferencia: cuota, concepto, monto del estado de cuenta y monto de Finn.

**Resultado esperado:** el modelo de A.2 coincide con el estado de cuenta, o se registra cada diferencia (01 Anexo A).

**Registro:** fila firmada en `resultados.md`, con las diferencias en la Nota. Cuenta para la puerta porque FT-55 es [M].

### PRU-MAN-CTA-002 [CH-04, §31.1] Verificar saldo semanal con cada banco

**Dispositivo:** Android o PC con la app de cada banco.

**Disparador:** semanal, entre `F` y `fin_primeras_semanas` (§31.4).

**Pasos:**

1. Abrir en la app del banco el saldo de cada cuenta que Finn lleva.
2. Abrir "Verificar saldo" (FT-44) en Finn para la misma cuenta, con la fecha de hoy, y escribir el saldo del banco.
3. Anotar la diferencia que muestra Finn. Una diferencia distinta de cero se investiga antes de ajustar.
4. Repetir con cada cuenta.
5. Si hay una diferencia que no se explica con un movimiento propio, es un error de dinero (§31): seguir §31.2.

**Resultado esperado:** diferencia cero en cada cuenta, o explicada en FT-44.

**Registro:** una fila firmada en `resultados.md` por semana, con las cuentas verificadas y las diferencias explicadas en la Nota.

### PRU-MAN-PWA-001 [05 §11.10, CT-03] Lector de pantalla TalkBack

**Dispositivo:** Android con TalkBack y Chrome.

**Disparador:** antes de cerrar cada entrega de la Fase 8.

**Pasos:**

1. Activar TalkBack y abrir la app en Chrome.
2. Registrar un gasto sin ayuda visual: llegar al formulario, llenar monto y categoría, y confirmar.
3. Asignar dinero a una categoría.
4. Aprobar un movimiento en la Bandeja.
5. Conciliar una cuenta.
6. Cerrar sesión e ingresar con TOTP.
7. En cada paso, comprobar que el foco, los nombres y los anuncios se entienden y se puede completar sin ver la pantalla.

**Resultado esperado:** registrar un gasto, asignar, aprobar en la Bandeja, conciliar e ingresar con TOTP se completan con TalkBack.

**Registro:** fila firmada en `resultados.md` con la versión de Android y de Chrome; un fallo abre un defecto.

### PRU-MAN-PWA-002 [05 §11.10, CT-03] Lector de pantalla NVDA

**Dispositivo:** Windows con NVDA, en Chrome o Firefox.

**Disparador:** antes de cerrar cada entrega de la Fase 8.

**Pasos:**

1. Iniciar NVDA y abrir la app en Chrome o Firefox.
2. Registrar un gasto con el teclado y el lector.
3. Asignar dinero a una categoría.
4. Aprobar un movimiento en la Bandeja.
5. Conciliar una cuenta.
6. Cerrar sesión e ingresar con TOTP.
7. En cada paso, comprobar que el foco, los nombres y los anuncios se entienden y se puede completar sin ver la pantalla.

**Resultado esperado:** lo mismo que con TalkBack: los cinco flujos se completan con NVDA.

**Registro:** fila firmada en `resultados.md` con la versión de NVDA y del navegador; un fallo abre un defecto.

### PRU-MAN-ESQ-001 [H-01 a H-12, SP-02] Prueba de humo de infraestructura

**Dispositivo:** el proyecto real de Supabase y Vercel.

**Disparador:** antes del primer despliegue a producción (04 §17.3), y antes de cargar datos reales.

**Pasos:**

1. Crear el proyecto de Supabase y definir las variables de entorno de la ejecución: `HUMO_ADMIN_URL`, `HUMO_REF`, `HUMO_POOLER_HOST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` (solo H-10) y `VERCEL_TOKEN` (solo H-09). Nada de esto se commitea.
2. Ejecutar `tools/humo/humo.sh`. Imprime una línea JSON por paso (`pasa`, `falla` u `omitido`), sin secretos.
3. Comprobar cada paso de 04 §17.2: H-01 versión de PostgreSQL (15, 16 o 17); H-02 bootstrap con `postgres` no superusuario y atributos de roles; H-03 `CREATE` en la base para `finn_migraciones`; H-04 conexión de los tres roles por Supavisor (6543 y 5432); H-05 migraciones con la CLI nativa de Prisma 7 y `migrate diff` vacío; H-06 patrón transaccional por el pooler; H-07 zona horaria de la sesión; H-08 respaldo por el pooler en modo sesión; H-09 carga del motor desde `iad1` (p95 ≤ 500 ms); H-10 Auth (claves asimétricas, TOTP, recuperación, registro deshabilitado); H-11 Data API desactivada; H-12 limpieza.
4. Si un paso falla, aplicar su alternativa documentada en 04 §17.2 y registrarla. Si el diff de H-05 no queda vacío por `dbgenerated("finn.ahora()")`, es el disparador de P7-12 b) (§32.1).
5. Pegar la salida de `humo.sh` en la conversación y anotar los resultados.

**Resultado esperado:** cada paso de 04 §17.2 con su resultado; H-01 a H-11 pasan o tienen su alternativa aplicada y registrada, y H-12 no deja nada.

**Registro:** fila firmada en `resultados.md` (condición 3 de la puerta, §30), con las alternativas aplicadas y la resolución del disparador de P7-12.
