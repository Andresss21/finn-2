# Anexos: índice

Contenido de los zips de `C:\finn\_entrada\` (TU-04, DT-36), extraídos sin cambios en `docs/anexos/<zip>/` (TA-002).
Cada zip se comparó byte a byte con su carpeta: mismos archivos y mismo contenido. Los zips anidados (`finn-marca.zip`
dentro de `finn-entrega.zip`) quedan como archivo; `finn-marca.zip` también está extraído en `finn-marca/`.
`.gitattributes` marca `docs/anexos/**` como `-text` para que git no cambie fines de línea.

**Columnas.** *Lo cita*: documento de `docs/` que nombra el archivo por su ruta dentro del zip o por su nombre
(si el nombre es único entre los anexos); si ninguno lo nombra, entre paréntesis, los documentos que citan su zip.
*Tareas*: las de las tablas "Archivos de los zips que cita …" de `08-tareas` (§8.2, §16.4, §23.2), que lee `pnpm plan:anexos`.

| Zip | Archivos | Documentos que citan el zip |
|---|---|---|
| `04-backend-verificacion.zip` | 36 | 03-base-de-datos, 04-backend, 08-tareas |
| `05-frontend-verificacion-A.zip` | 47 | 05-frontend, 08-tareas |
| `05-frontend-verificacion-B.zip` | 43 | 05-frontend, 08-tareas |
| `05-frontend-verificacion-C.zip` | 51 | 05-frontend, 08-tareas |
| `05-frontend-verificacion-D.zip` | 66 | 05-frontend, 08-tareas |
| `06-features-verificacion.zip` | 43 | 06-features |
| `07-pruebas-verificacion.zip` | 140 | 05-frontend, 07-pruebas |
| `08-tareas-verificacion.zip` | 38 | 08-tareas |
| `finn-entrega.zip` | 132 | 06-identidad-visual, 08-tareas |
| `finn-fase3-base-de-datos.zip` | 18 | 03-base-de-datos, 04-backend, 08-tareas |
| `finn-marca.zip` | 13 | 06-identidad-visual, 08-tareas |
| **Total** | **627** | |

| Archivo | Lo cita | Tareas |
|---|---|---|
| `04-backend-verificacion/LEEME.md` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/comun.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/conc/decodificar.ts` | 04-backend, 08-tareas | — |
| `04-backend-verificacion/migraciones/20261014000000_m_purgar_eliminaciones/migration.sql` | 03-base-de-datos, 04-backend | — |
| `04-backend-verificacion/package-lock.json` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/package.json` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/prisma/schema.prisma` | 03-base-de-datos, 04-backend, 08-tareas | — |
| `04-backend-verificacion/prisma.config.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/sms/interpretar.ts` | 04-backend, 08-tareas | — |
| `04-backend-verificacion/sql/00_subconjunto.sql` | 04-backend | — |
| `04-backend-verificacion/sql/01_secuencia.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/sql/02_eliminaciones_subconjunto.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/sql/03_regla_r14.sql` | 03-base-de-datos, 08-tareas | TA-051 |
| `04-backend-verificacion/sql/04_prueba_purga.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/sql/05_sms_subconjunto.sql` | 04-backend | — |
| `04-backend-verificacion/sql/06_volumen.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t1.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t10.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t11.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t12.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t13.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t14.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t15.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t16.sh` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t17.py` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | TA-252 |
| `04-backend-verificacion/t18.sh` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t2.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t3.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t4.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t5.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t6.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t7.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t8.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/t9.ts` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/v18.mjs` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `04-backend-verificacion/webhook/cuerpo.ts` | 04-backend, 08-tareas | TA-177 |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/LEEME.md` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/@superpuesto/(.)asignar/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/@superpuesto/[...todo]/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/@superpuesto/default.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/asignar/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/default.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/layout.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/otra/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/app/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/componentes/form-asignar.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/componentes/form-crear.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/componentes/refrescar.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/componentes/sugerencia.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/componentes/use-operacion.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/lib/acciones.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/lib/estado.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/lib/tipos.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/next.config.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/package-lock.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/package.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/app/tsconfig.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/lint/apps/web/src/componentes/dominio/monto.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/lint/apps/web/src/componentes/formularios/falta-repartir.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/lint/apps/web/src/componentes/formularios/usa-motor.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/lint/eslint.config.mjs` | 08-tareas | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/lint/v5-12.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/medicion/d3.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/medicion/rhf.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/medicion/zod.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/medicion/zod2.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/medicion/zod3.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/medicion/zodmini.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/medicion/zodmini2.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/centavos.ts` | 08-tareas | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/entrada-monto.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/formato.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/reloj.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/v5-01-02.salida-chromium.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/v5-01-02.salida-node24.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/v5-01-02.test.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/v5-10.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/v5-10.test.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/proto/v5_chromium.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/pruebas/v5_03.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/pruebas/v5_03.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/pruebas/v5_11.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-A/05-frontend-verificacion-A/pruebas/v5_11.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/LEEME.md` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/@superpuesto/(.)asignar/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/@superpuesto/(.)lento/loading.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/@superpuesto/(.)lento/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/@superpuesto/[...todo]/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/@superpuesto/default.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/asignar/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/cosas/[id]/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/default.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/error.tsx` | 05-frontend, 07-pruebas, 08-tareas | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/fallo/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/fallo-normal/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/ingresar/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/layout.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/lento/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/lento2/loading.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/lento2/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/not-found.tsx` | 05-frontend, 08-tareas | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/otra/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/app/protegida/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/componentes/enlace-con-estado.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/componentes/form-asignar.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/componentes/form-crear.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/componentes/refrescar.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/componentes/sugerencia.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/componentes/use-operacion.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/lib/acciones.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/lib/consultar.ts` | 05-frontend, 08-tareas | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/lib/estado.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/lib/tipos.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/next.config.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/package-lock.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/package.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/proxy.ts` | 04-backend, 05-frontend, 08-tareas | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/app/tsconfig.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/pruebas/cobertura.py` | — (el zip: 05-frontend, 08-tareas) | TA-252 |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/pruebas/control_negativo.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/pruebas/v5_15.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/pruebas/v5_15.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/pruebas/v5_18.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/pruebas/v5_19.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-B/05-frontend-verificacion-B/pruebas/v5_19.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/05-frontend.md` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/LEEME.md` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/base/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/control-axe/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/destino/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario-es/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario-es/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario-llaves/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario-llaves/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario-z/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/formulario-z/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/globals.css` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/grafico-cliente/grafico.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/grafico-cliente/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/grafico-servidor/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/inicio-nav/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/layout.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/tokens/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/app/tokens.css` | — (el zip: 05-frontend, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `05-frontend-verificacion-C/app-prueba-c/componentes/enlace-finn.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/componentes/grafico-barras.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/componentes/grafico.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/componentes/indicador-estado.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/componentes/monto.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/lib/formato.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/next.config.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/package-lock.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/package.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/postcss.config.mjs` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/app-prueba-c/tsconfig.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/prototipos/tokens.css` | — (el zip: 05-frontend, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `05-frontend-verificacion-C/prototipos/tokens.json` | — (el zip: 05-frontend, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `05-frontend-verificacion-C/prototipos/tokens.py` | 08-tareas | TA-201 (PRU-DOM-PWA-001), que lo porta como `tools/pruebas/contraste.py` **[CH-09]** |
| `05-frontend-verificacion-C/prototipos/tokens.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/cobertura.py` | — (el zip: 05-frontend, 08-tareas) | TA-252 |
| `05-frontend-verificacion-C/pruebas/control_negativo.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_18.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_21b.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_21b.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_24_control.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_24_control.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_26.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_26.sh` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_27.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_27.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_28.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_28.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_parte_c.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-C/pruebas/v5_parte_c.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/05-anexo-encargo-claude-design.md` | 08-tareas | — |
| `05-frontend-verificacion-D/05-frontend.md` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/LEEME.md` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/base/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/con-datos/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/con-provider/layout.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/con-provider/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/control-axe/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/destino/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario-es/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario-es/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario-llaves/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario-llaves/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario-z/formulario.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/formulario-z/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/globals.css` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/grafico-cliente/grafico.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/grafico-cliente/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/grafico-servidor/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/inicio-nav/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/layout.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/manifest.ts` | 02-tecnologias, 05-frontend, 08-tareas | — |
| `05-frontend-verificacion-D/app-prueba-d/app/serwist/[path]/route.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/sin-conexion/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/tokens/page.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/app/tokens.css` | — (el zip: 05-frontend, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `05-frontend-verificacion-D/app-prueba-d/app/tokens.json` | — (el zip: 05-frontend, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `05-frontend-verificacion-D/app-prueba-d/cliente/registro-sw.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/componentes/enlace-finn.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/componentes/grafico-barras.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/componentes/grafico.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/componentes/indicador-estado.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/componentes/monto.tsx` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/componentes/navegacion/destinos.ts` | 05-frontend | — |
| `05-frontend-verificacion-D/app-prueba-d/lib/formato.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/next.config.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/package-lock.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/package.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/postcss.config.mjs` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/public/marca/icono-192.png` | 05-frontend | — |
| `05-frontend-verificacion-D/app-prueba-d/public/marca/icono-512.png` | 05-frontend | — |
| `05-frontend-verificacion-D/app-prueba-d/public/marca/icono-maskable-512.png` | 05-frontend | — |
| `05-frontend-verificacion-D/app-prueba-d/public/marca/insignia-96.png` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/sw/sw.ts` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/app-prueba-d/tsconfig.json` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/cierre/aplicar_cp.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/prototipos/tokens.css` | — (el zip: 05-frontend, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `05-frontend-verificacion-D/prototipos/tokens.json` | — (el zip: 05-frontend, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `05-frontend-verificacion-D/prototipos/tokens.py` | 08-tareas | TA-201 (PRU-DOM-PWA-001), que lo porta como `tools/pruebas/contraste.py` **[CH-09]** |
| `05-frontend-verificacion-D/prototipos/tokens.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/cobertura.py` | — (el zip: 05-frontend, 08-tareas) | TA-252 |
| `05-frontend-verificacion-D/pruebas/control_negativo.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/control_negativo_15.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/trazabilidad.py` | — (el zip: 05-frontend, 08-tareas) | TA-252; TA-135, TA-252 |
| `05-frontend-verificacion-D/pruebas/v5_18.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_29.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_29.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_30c.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_30c.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_34.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_34.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_35.py` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_35.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `05-frontend-verificacion-D/pruebas/v5_36.salida.txt` | — (el zip: 05-frontend, 08-tareas) | — |
| `06-features-verificacion/06-verificacion/cierre_enmiendas/aplicar.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/cierre_enmiendas/enm_03.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/cierre_enmiendas/enm_04.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/cierre_enmiendas/enm_05.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/cierre_enmiendas/r5_06.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/cierre_enmiendas/r5_enm.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/enmiendas_f6.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/prueba_reportes.py` | — (el zip: 06-features) | TA-135, TA-252 |
| `06-features-verificacion/06-verificacion/recorridos/cf25.py` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/recorridos/motor_min.py` | — (el zip: 06-features) | TA-112; TA-147 |
| `06-features-verificacion/06-verificacion/recorridos/recorridos.py` | 06-features | TA-135, TA-252 |
| `06-features-verificacion/06-verificacion/reportes.py` | — (el zip: 06-features) | TA-135, TA-252 |
| `06-features-verificacion/06-verificacion/revisar_fichas.py` | — (el zip: 06-features) | TA-135, TA-252 |
| `06-features-verificacion/06-verificacion/trazabilidad.py` | 06-features | TA-252; TA-135, TA-252 |
| `06-features-verificacion/06-verificacion/v6_04_catalogo_notificaciones.sql` | 06-features | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/acciones.ts` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/almacen.ts` | 05-frontend, 06-features | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/bandeja/acciones.ts` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/bandeja/arrastre.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/bandeja/datos.ts` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/bandeja/lista.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/bandeja/page.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/control/page.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/layout.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/plantilla/aplicar.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/plantilla/page.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/app/plantilla/plantilla.ts` | 05-frontend, 06-features, 08-tareas | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/medir.mjs` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/medir2.mjs` | 06-features | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/medir3.mjs` | 06-features | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/next.config.ts` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/package.json` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_05_plantilla/tsconfig.json` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_07_arrastre/entrada.jsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_07_arrastre/medir.sh` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/bandeja/acciones.ts` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/bandeja/arrastre.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/bandeja/datos.ts` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/bandeja/lista.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/bandeja/page.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/control/page.tsx` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/medir-arrastre.mjs` | — (el zip: 06-features) | — |
| `06-features-verificacion/06-verificacion/v6_08_arrastre/package.json` | — (el zip: 06-features) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/LEEME.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/a7/coherencia_a7.py` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/a7/semilla/comparar.py` | 07-pruebas, 08-tareas | TA-147 |
| `07-pruebas-verificacion/07-pruebas-verificacion/a7/semilla/estado_a7.py` | 07-pruebas, 08-tareas | TA-147 |
| `07-pruebas-verificacion/07-pruebas-verificacion/a7/semilla/motor_min.py` | — (el zip: 05-frontend, 07-pruebas) | TA-112; TA-147 |
| `07-pruebas-verificacion/07-pruebas-verificacion/a7/semilla/reportes.py` | — (el zip: 05-frontend, 07-pruebas) | TA-135, TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/arnes-c4/diff.mjs` | 07-pruebas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/ci/preparar-base.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/ci/v7_02.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/migraciones/20261017000000_g_conciliaciones_modo/migration.sql` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/migraciones/20261017000100_g_notificaciones_aviso_nulo/migration.sql` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/migraciones/20261017000200_g_programadas_reactivada_desde/migration.sql` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/migraciones/20261022000000_m_reloj/migration.sql` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/tools/db/regla-r15.sql` | 07-pruebas, 08-tareas | TA-056 |
| `07-pruebas-verificacion/07-pruebas-verificacion/base/tools/pruebas/reloj-simulado.sql` | 07-pruebas, 08-tareas | TA-056 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/aplicar_f7.py` | 07-pruebas, 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/base.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/cob05.py` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/control.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/correr.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enm.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enm09.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/00-decisiones.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/01-dominio.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/02-tecnologias.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/03-base-de-datos.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/04-backend.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/05-frontend.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/06-features.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmendados/06-identidad-visual.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmiendas_f6.py` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/enmiendas_f7.py` | 07-pruebas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/fase5/cobertura.py` | — (el zip: 05-frontend, 07-pruebas) | TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/fase5/trazabilidad.py` | — (el zip: 05-frontend, 07-pruebas) | TA-252; TA-135, TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/00-decisiones.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/01-dominio.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/02-tecnologias.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/03-base-de-datos.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/04-backend.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/05-frontend.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/06-features.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/originales/06-identidad-visual.md` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/prueba_reportes.py` | — (el zip: 05-frontend, 07-pruebas) | TA-135, TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/recorridos/cf25.py` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/recorridos/motor_min.py` | — (el zip: 05-frontend, 07-pruebas) | TA-112; TA-147 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/recorridos/recorridos.py` | — (el zip: 05-frontend, 07-pruebas) | TA-135, TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/reportes.py` | — (el zip: 05-frontend, 07-pruebas) | TA-135, TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/revisar_fichas.py` | — (el zip: 05-frontend, 07-pruebas) | TA-135, TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/t17.py` | — (el zip: 05-frontend, 07-pruebas) | TA-252 |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/traz05.py` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cierre/traz06.py` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cmp/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cmp/src/componentes.cmp.test.tsx` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cmp/src/componentes.tsx` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cmp/tsconfig.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/cmp/vitest.config.ts` | 07-pruebas, 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/firmas/escenarios.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/firmas/escenarios2.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/firmas/verificar-firmas.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/pruebas/inventario-prototipos.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/ci/minutos.fixture.json` | 07-pruebas, 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/ci/minutos.ts` | 07-pruebas, 08-tareas | TA-013 |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/pruebas/control-matriz.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/pruebas/firmas-escenarios.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/pruebas/firmas.sh` | 07-pruebas, 08-tareas | TA-009 |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/pruebas/listar.ts` | 07-pruebas, 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/matriz/tools/pruebas/matriz.ts` | 07-pruebas, 08-tareas | TA-006, TA-007 |
| `07-pruebas-verificacion/07-pruebas-verificacion/monorepo-medicion/apps/web/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/monorepo-medicion/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/monorepo-medicion/packages/aplicacion/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/monorepo-medicion/packages/db/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/monorepo-medicion/packages/dominio/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/monorepo-medicion/pnpm-workspace.yaml` | 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/oraculo/motor_min.py` | 02-tecnologias, 07-pruebas, 08-tareas | TA-112; TA-147 |
| `07-pruebas-verificacion/07-pruebas-verificacion/oraculo/oraculo.py` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/pool04/correr.sh` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/pool04/marca.sql` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/pool04/v7_14.sql` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/pooler/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/pooler/pgbouncer.ini` | 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/pooler/pool.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/dominio/diferencial.prop.test.ts` | 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/dominio/generadores.ts` | 07-pruebas, 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/dominio/nucleo.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/dominio/propiedades.prop.test.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/control.test.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/control.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-05.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-06.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-07.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-08.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-09.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-10.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-17.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/datos/esc-18.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/ejecutar.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/escenarios.int.test.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/escenarios.motor.test.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/int.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/motor.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/tipos.ts` | — (el zip: 05-frontend, 07-pruebas) | TA-130, TA-188 |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/escenarios/todos.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/int/base.ts` | 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/int/protocolo.int.test.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/proto/semillas/recorridos.test.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_01.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_02.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_03.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_04.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_05.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_06.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_07.salida.txt` | 07-pruebas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_08.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_09.salida.txt` | 07-pruebas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_10.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_11.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_12.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_13.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_14.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_15.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_16.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_17.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_18.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_19.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/salidas/v7_20.salida.txt` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/app/api/eco/route.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/app/layout.tsx` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/app/page.tsx` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/cliente/refresco.tsx` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/e2e/reloj.e2e.ts` | 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/e2e/reloj.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/instrumentation.ts` | 04-backend, 07-pruebas, 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/lib/reloj-permitido.ts` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/lib/reloj-prueba.ts` | 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/next.config.ts` | 04-backend | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/package.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/playwright.config.ts` | 08-tareas | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/seg/barreras.mjs` | — (el zip: 05-frontend, 07-pruebas) | — |
| `07-pruebas-verificacion/07-pruebas-verificacion/web/tsconfig.json` | — (el zip: 05-frontend, 07-pruebas) | — |
| `08-tareas-verificacion/08-tareas.md` | 04-backend, 06-features, 07-pruebas, 08-tareas | — |
| `08-tareas-verificacion/LEEME.md` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/arranque/.claude/agents/tarea-opus.md` | 08-tareas | — |
| `08-tareas-verificacion/arranque/.claude/agents/tarea-sonnet.md` | 08-tareas | — |
| `08-tareas-verificacion/arranque/.claude/hooks/aprobar.mjs` | 08-tareas | — |
| `08-tareas-verificacion/arranque/.claude/settings.json` | 08-tareas | — |
| `08-tareas-verificacion/cierre/aplicar_f8.py` | 08-tareas | — |
| `08-tareas-verificacion/cierre/enmiendas_f8.py` | 08-tareas | — |
| `08-tareas-verificacion/cierre/orig/04-backend.md` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/cierre/orig/06-features.md` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/cierre/orig/07-pruebas.md` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/docs/01-dominio.md` | 07-pruebas | — |
| `08-tareas-verificacion/docs/02-tecnologias.md` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/docs/03-base-de-datos.md` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/docs/04-backend.md` | 07-pruebas | — |
| `08-tareas-verificacion/docs/05-frontend.md` | 07-pruebas | — |
| `08-tareas-verificacion/docs/06-features.md` | 07-pruebas | — |
| `08-tareas-verificacion/docs/07-pruebas.md` | 08-tareas | — |
| `08-tareas-verificacion/plan/objetivos-parte-a.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/plan/objetivos.txt` | 08-tareas | — |
| `08-tareas-verificacion/salidas/catalogo.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/encargo-TA-289.md` | 08-tareas | — |
| `08-tareas-verificacion/salidas/v8_01.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_01_parteA.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_01_parteB.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_01_parteC.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_02.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_03.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_04.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_05.salida.txt` | 08-tareas | — |
| `08-tareas-verificacion/salidas/v8_05_vacia.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/salidas/v8_06.salida.txt` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/tools/plan/anexos.ts` | 08-tareas | — |
| `08-tareas-verificacion/tools/plan/anexos_prueba.py` | — (el zip: 08-tareas) | — |
| `08-tareas-verificacion/tools/plan/catalogo.py` | 08-tareas | — |
| `08-tareas-verificacion/tools/plan/encargo.ts` | 08-tareas | — |
| `08-tareas-verificacion/tools/plan/estimacion.ts` | 08-tareas | — |
| `08-tareas-verificacion/tools/plan/verificar.ts` | 08-tareas | — |
| `finn-entrega/AGENTES.md` | 06-identidad-visual | — |
| `finn-entrega/ENTREGA.md` | 06-identidad-visual | — |
| `finn-entrega/PANTALLAS.md` | 06-identidad-visual | — |
| `finn-entrega/finn-marca.zip` | 06-identidad-visual, 08-tareas | TA-203 |
| `finn-entrega/iconos/activity.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/arrowL.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/arrowR.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/bank.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/bell.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/cal.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/card.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/chart.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/check.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/chevD.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/chevR.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/clock.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/coins.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/copy.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/dang.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/edit.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/env.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/estados/advertencia.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/estados/cero.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/estados/deuda-sin-respaldo.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/estados/deuda.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/estados/informacion.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/estados/positivo.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/estados/problema.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/filter.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/gear.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/grid.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/grip.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/home.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/in.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/inbox.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/info.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/list.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/lock.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/menu.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/mic.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/more.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/out.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/plus.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/plusC.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/reconcile.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/refresh.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/repeat.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/search.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/send.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/sms.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/swap.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/target.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/ticket.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/trash.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/trend.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/undo.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/user.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/wallet.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/warn.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/wifioff.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/x.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/zero.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/iconos/zoomout.svg` | — (el zip: 06-identidad-visual, 08-tareas) | TA-202 |
| `finn-entrega/referencia/K1-Navegacion__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K1-Navegacion__mas-secciones-abierto-n5-n7.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K1-Navegacion__notificaciones-abiertas-n7.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K1-Navegacion__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K1-Navegacion__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K2-Base__componentes-base-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K2-Base__componentes-base-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K3-Dominio-A__componentes-dominio-1-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K3-Dominio-A__componentes-dominio-1-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K4-Dominio-B__componentes-dominio-2-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K4-Dominio-B__componentes-dominio-2-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K5-Nuevos__componentes-nuevos-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/K5-Nuevos__componentes-nuevos-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S1-Inicio__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S1-Inicio__computadora-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S1-Inicio__listo-para-asignar-negativo.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S1-Inicio__primer-uso-sin-cuentas.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S1-Inicio__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S1-Inicio__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S1-Inicio__todo-al-dia.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S2-Presupuesto__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S2-Presupuesto__filtro-sobregiradas.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S2-Presupuesto__periodo-cerrado.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S2-Presupuesto__periodo-futuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S2-Presupuesto__sin-resultados.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S2-Presupuesto__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S2-Presupuesto__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__categoria-de-pago-de-tarjeta.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__con-meta.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__historial-como-tabla.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__sin-movimientos.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__sobregiro-con-tarjeta.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S3-Detalle__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__aprobado-con-un-toque.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__bandeja-al-dia.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__descartado.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S4-Bandeja__vista-de-descartados.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__fecha-en-periodo-cerrado.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__guardado.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__guardando.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__monto-mal-escrito.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__sugerencia-al-escribir.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__suma-distinta-del-total.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S5-Registrar__una-linea.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S6-Cuentas__archivadas-visibles.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S6-Cuentas__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S6-Cuentas__computadora-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S6-Cuentas__tarjeta-con-saldo-a-favor-mastercard-al-frente.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S6-Cuentas__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S6-Cuentas__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S7-Semanal__asignado-negativo.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S7-Semanal__categoria-nueva.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S7-Semanal__computadora-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S7-Semanal__telefono-claro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S7-Semanal__telefono-oscuro.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S7-Semanal__varias-categorias-ejemplo.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/S7-Semanal__vista-de-tabla.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-entrega/referencia/prototipo-logica.js` | 06-features, 06-identidad-visual | — |
| `finn-entrega/tokens.css` | — (el zip: 06-identidad-visual, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `finn-entrega/tokens.json` | — (el zip: 06-identidad-visual, 08-tareas) | Parte C (**[C]** detalle en §23.2); TA-201 |
| `finn-fase3-base-de-datos/LEEME.md` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/catalogo-esperado.txt` | 03-base-de-datos, 04-backend, 08-tareas | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/20261011000000_m_inicio/migration.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/20261011000100_g_tablas/migration.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/20261011000200_m_restricciones/migration.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/20261011000300_m_funciones/migration.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/20261011000400_m_triggers/migration.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/20261011000500_m_seguridad/migration.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/20261011000600_m_datos_iniciales/migration.sql` | — (el zip: 03-base-de-datos, 04-backend, 08-tareas) | — |
| `finn-fase3-base-de-datos/packages/db/prisma/migrations/migration_lock.toml` | 08-tareas | — |
| `finn-fase3-base-de-datos/packages/db/prisma/schema.prisma` | 03-base-de-datos, 08-tareas | — |
| `finn-fase3-base-de-datos/packages/db/prisma.config.ts` | 03-base-de-datos, 08-tareas | — |
| `finn-fase3-base-de-datos/tools/db/bootstrap.sql` | 03-base-de-datos, 04-backend, 07-pruebas, 08-tareas | — |
| `finn-fase3-base-de-datos/tools/db/catalogo.sql` | 03-base-de-datos, 04-backend, 07-pruebas, 08-tareas | TA-051 |
| `finn-fase3-base-de-datos/tools/db/reglas-catalogo.sql` | 03-base-de-datos, 04-backend, 08-tareas | TA-051 |
| `finn-fase3-base-de-datos/tools/db/verificar-migraciones.mjs` | 03-base-de-datos, 08-tareas | TA-011 |
| `finn-fase3-base-de-datos/tools/respaldo/respaldar.mjs` | 03-base-de-datos, 04-backend, 08-tareas | TA-251 |
| `finn-fase3-base-de-datos/tools/respaldo/restaurar.sh` | 03-base-de-datos, 04-backend, 08-tareas | TA-251 |
| `finn-marca/LEEME.md` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/apple-touch-icon-180.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/favicon-16.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/favicon-32.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/favicon.ico` | 05-frontend | — |
| `finn-marca/favicon.svg` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/finn-logotipo.svg` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/finn-simbolo.svg` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/icon-192.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/icon-512.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/icon-adaptable-512.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/insignia-96.png` | — (el zip: 06-identidad-visual, 08-tareas) | — |
| `finn-marca/manifest-icons.json` | 06-identidad-visual, 08-tareas | TA-203 |
