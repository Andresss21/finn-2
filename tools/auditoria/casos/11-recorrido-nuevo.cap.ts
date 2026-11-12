// Auditoría de diseño · recorrido completo de usuario nuevo, una sola vez (variante telefono-claro).
// Base vacía → ingresar por la interfaz real (contraseña + segundo factor) → Inicio con Primeros pasos → una cuenta de
// cada tipo → categorías con la plantilla → conectar los SMS → recibir un SMS y aprobarlo en la Bandeja → asignar dinero →
// registrar un gasto. Cada paso deja su captura `recorrido__NN-<paso>` y su resultado en
// `docs/auditoria-diseno/medidas/_recorrido__<variante>.txt`. Un paso que falla se anota y el recorrido sigue si puede.
// La app no ofrece registro de usuario (FALTANTES `alta-usuario`): arranca en Ingresar con el usuario de la pila local.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  capturar,
  codigoTotp,
  expect,
  quieta,
  SALIDA,
  sembrarOps,
  test,
  variable,
  type Page,
  type TestInfo,
} from '../lib.ts';
import { registrarGasto as tg } from '../../../apps/web/src/textos/registrar-gasto.ts';

const HOY = '2027-02-05';
const E1 = '02-referencias/entrega-1/pantallas';
const E2 = '02-referencias/entrega-2/pantallas';
const ACC = `${E2}/13-acceso`;

interface Paso {
  n: string;
  paso: string;
  resultado: 'bien' | 'falló';
  detalle?: string;
  url?: string;
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const radio = (page: Page, grupo: string, nombre: string) =>
  page
    .getByRole('radiogroup', { name: grupo, exact: true })
    .getByRole('radio', { name: nombre, exact: true });

async function elegir(page: Page, etiqueta: string, nombre: string | RegExp): Promise<void> {
  const control = campo(page, etiqueta);
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  if (typeof nombre === 'string') await control.selectOption({ label: nombre });
  else {
    const opciones = await control.locator('option').allTextContents();
    const una = opciones.find((o) => nombre.test(o));
    if (una === undefined)
      throw new Error(`sin opción ${String(nombre)} en ${etiqueta}: ${opciones.join(' | ')}`);
    await control.selectOption({ label: una });
  }
}

test('recorrido__usuario-nuevo', async ({ page, context, request }, info: TestInfo) => {
  test.skip(info.project.name !== 'telefono-claro', 'El recorrido se hace una sola vez');
  test.setTimeout(480_000);
  const pasos: Paso[] = [];
  const guardar = (): void => {
    writeFileSync(
      join(SALIDA, 'medidas', `_recorrido__${info.project.name}.txt`),
      JSON.stringify(pasos, null, 1),
    );
  };
  /** Un paso del recorrido: lo hace, lo captura y anota cómo salió. Si falla, captura igual lo que quedó en pantalla. */
  const paso = async (
    n: string,
    nombre: string,
    meta: { ruta: string; comp: string; ref: string; nota?: string },
    hacer: () => Promise<string | void>,
  ): Promise<boolean> => {
    let bien = true;
    let detalle: string | undefined;
    try {
      const d = await hacer();
      if (typeof d === 'string') detalle = d;
    } catch (e) {
      bien = false;
      detalle = (e instanceof Error ? e.message : String(e))
        .split('\n')
        .slice(0, 4)
        .join(' ⏎ ')
        .slice(0, 600);
    }
    await capturar(page, info, `recorrido__${n}-${nombre}`, meta).catch(() => undefined);
    pasos.push({
      n,
      paso: nombre,
      resultado: bien ? 'bien' : 'falló',
      ...(detalle === undefined ? {} : { detalle }),
      url: new URL(page.url()).pathname + new URL(page.url()).search,
    });
    guardar();
    return bien;
  };

  await sembrarOps([], HOY);
  await context.clearCookies();

  // ── Acceso ────────────────────────────────────────────────────────────────────────────────────────────────────────
  await paso(
    '01',
    'ingresar',
    {
      ruta: '/ingresar',
      comp: 'apps/web/src/app/ingresar/formulario-ingresar.tsx',
      ref: `${ACC}/ingresar`,
      nota: 'Sin sesión, abrir la app lleva a /ingresar?volver=%2F. No hay «¿Primera vez?» ni «Olvidé mi contraseña».',
    },
    async () => {
      await page.goto('/');
      await page.waitForURL('**/ingresar**');
      await quieta(page);
    },
  );
  await paso(
    '02',
    'verificar',
    {
      ruta: '/ingresar/verificar',
      comp: 'apps/web/src/app/ingresar/verificar/formulario-verificar.tsx',
      ref: `${ACC}/verificar`,
    },
    async () => {
      await campo(page, 'Email').fill(variable('E2E_EMAIL'));
      await campo(page, 'Contraseña').fill(variable('E2E_CLAVE'));
      // La captura no debe mostrar el correo del usuario de prueba: se toma ya en la pantalla siguiente.
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
      await page.waitForURL('**/ingresar/verificar**');
      await quieta(page);
      const casillas = await page.locator('form input:not([type=hidden])').count();
      return `campos de código en pantalla: ${casillas} (el diseño pide 6 casillas)`;
    },
  );
  await paso(
    '03',
    'inicio-primeros-pasos',
    {
      ruta: '/',
      comp: 'apps/web/src/app/(finn)/primeros-pasos.tsx',
      ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/primeros-pasos-sin-cuentas`,
    },
    async () => {
      const codigo = codigoTotp();
      const casillas = page.locator('form input:not([type=hidden])');
      await casillas.first().click();
      await page.keyboard.type(codigo);
      // El diseño verifica sola al sexto dígito; si la app no lo hace, se toca «Verificar».
      const sola = await page
        .waitForURL((u) => !u.pathname.startsWith('/ingresar'), { timeout: 2500 })
        .then(() => true)
        .catch(() => false);
      if (!sola) await page.getByRole('button', { name: 'Verificar', exact: true }).click();
      await page.waitForURL((u) => !u.pathname.startsWith('/ingresar'), { timeout: 20_000 });
      await quieta(page);
      await expect(page.getByRole('heading', { name: 'Primeros pasos' })).toBeVisible();
      return sola
        ? 'se verificó sola al sexto dígito'
        : 'no se verificó sola: hubo que tocar «Verificar»';
    },
  );

  // ── Cuentas: una de cada tipo ─────────────────────────────────────────────────────────────────────────────────────
  const NUEVA = {
    ruta: '/cuentas/nueva',
    comp: 'apps/web/src/flujos/cuentas-nueva/formulario.tsx',
  };
  const crear = async (): Promise<void> => {
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
    // Si la app pide confirmar el impacto, se confirma
    const confirmar = page.getByRole('button', { name: 'Confirmar', exact: true });
    await Promise.race([
      page.waitForURL(/\/cuentas$/, { timeout: 20_000 }),
      confirmar.waitFor({ state: 'visible', timeout: 20_000 }).then(() => confirmar.click()),
    ]);
    await page.waitForURL(/\/cuentas$/, { timeout: 20_000 });
    await quieta(page);
  };
  const abrirNueva = async (tipo?: string): Promise<void> => {
    await page.getByRole('link', { name: 'Nueva cuenta', exact: true }).first().click();
    await page.waitForURL(/\/cuentas\/nueva/);
    await quieta(page);
    if (tipo !== undefined) {
      await radio(page, 'Tipo de cuenta', tipo).click();
      await page.waitForTimeout(600);
    }
  };

  await paso(
    '04',
    'cuenta-nueva-formulario',
    {
      ...NUEVA,
      ref: `${E2}/06-detalle-de-cuenta/nueva-cuenta`,
      nota: 'Desde «Crear una cuenta» de Primeros pasos.',
    },
    async () => {
      await page.getByRole('link', { name: 'Crear una cuenta', exact: true }).click();
      await page.waitForURL(/\/cuentas\/nueva$/);
      await quieta(page);
    },
  );
  await paso(
    '05',
    'cuenta-corriente-creada',
    {
      ruta: '/cuentas',
      comp: 'apps/web/src/app/(finn)/cuentas/pantalla.tsx',
      ref: `${E1}/S6-Cuentas`,
    },
    async () => {
      await radio(page, 'Tipo de cuenta de efectivo', 'Corriente').click();
      await campo(page, 'Nombre').fill('Cuenta corriente');
      await page
        .getByRole('radio', { name: 'BAC', exact: true })
        .click()
        .catch(() => undefined);
      await campo(page, 'Últimos 4 dígitos')
        .fill('1234')
        .catch(() => undefined);
      await campo(page, 'Saldo de hoy').fill('1000');
      await crear();
    },
  );
  await paso(
    '06',
    'cuenta-ahorro-creada',
    {
      ruta: '/cuentas',
      comp: 'apps/web/src/app/(finn)/cuentas/pantalla.tsx',
      ref: `${E1}/S6-Cuentas`,
    },
    async () => {
      await abrirNueva();
      await radio(page, 'Tipo de cuenta de efectivo', 'Ahorro').click();
      await campo(page, 'Nombre').fill('Cuenta de ahorro');
      await campo(page, 'Saldo de hoy').fill('500');
      await crear();
    },
  );
  await paso(
    '07',
    'billetera-creada',
    {
      ruta: '/cuentas',
      comp: 'apps/web/src/app/(finn)/cuentas/pantalla.tsx',
      ref: `${E1}/S6-Cuentas`,
      nota: 'FALTANTES `billetera`: identidad provisoria.',
    },
    async () => {
      await abrirNueva();
      await radio(page, 'Tipo de cuenta de efectivo', 'Billetera').click();
      await campo(page, 'Saldo de hoy').fill('40');
      await crear();
    },
  );
  await paso(
    '08',
    'tarjeta-formulario',
    {
      ...NUEVA,
      ruta: '/cuentas/nueva (tarjeta)',
      ref: `${E2}/06-detalle-de-cuenta/nueva-cuenta`,
      nota: 'DECISIONES: 8 colores, red y vista previa en vivo.',
    },
    async () => {
      await abrirNueva('Tarjeta de crédito');
      await expect(campo(page, 'Límite de crédito')).toBeVisible();
      await campo(page, 'Nombre').fill('Visa Oro');
      await page.getByRole('radio', { name: 'BAC', exact: true }).click();
      await campo(page, 'Últimos 4 dígitos').fill('4821');
      await campo(page, 'Saldo de la tarjeta').fill('300');
      await campo(page, 'Límite de crédito').fill('2500');
      await campo(page, 'Día de corte').fill('25');
      await campo(page, 'Día de pago').fill('15');
      await radio(page, 'Red', 'Visa').click();
    },
  );
  await paso(
    '09',
    'tarjeta-creada',
    {
      ruta: '/cuentas',
      comp: 'apps/web/src/app/(finn)/cuentas/pantalla.tsx',
      ref: `${E1}/S6-Cuentas`,
    },
    crear,
  );
  await paso(
    '10',
    'prestamo-formulario',
    {
      ...NUEVA,
      ruta: '/cuentas/nueva (préstamo)',
      ref: 'SIN DISEÑO',
      nota: 'FALTANTES `prestamo-alta`.',
    },
    async () => {
      await abrirNueva('Préstamo');
      await expect(campo(page, 'Quién te prestó')).toBeVisible();
      await campo(page, 'Nombre').fill('Préstamo personal');
      await campo(page, 'Capital pendiente').fill('5000');
      await campo(page, 'Quién te prestó').fill('Banco de América Central');
      await campo(page, 'Monto original').fill('6000');
      await radio(page, 'Tipo de tasa', 'Fija').click();
      await radio(page, 'Frecuencia de las cuotas', 'Mensual').click();
      await campo(page, 'Cuota pactada').fill('210');
      await campo(page, 'Cantidad de cuotas').fill('36');
      await campo(page, 'Cuotas que ya pagaste').fill('6');
    },
  );
  await paso(
    '11',
    'prestamo-creado',
    {
      ruta: '/cuentas',
      comp: 'apps/web/src/app/(finn)/cuentas/pantalla.tsx',
      ref: `${E1}/S6-Cuentas`,
    },
    crear,
  );
  await paso(
    '12',
    'inversion-formulario',
    {
      ...NUEVA,
      ruta: '/cuentas/nueva (inversión)',
      ref: 'SIN DISEÑO',
      nota: 'FALTANTES `inversion-alta`.',
    },
    async () => {
      await abrirNueva('Inversión');
      await expect(campo(page, 'Valor de hoy')).toBeVisible();
      await campo(page, 'Nombre').fill('Fondo de inversión');
      await campo(page, 'Valor de hoy').fill('800');
    },
  );
  await paso(
    '13',
    'cuentas-una-de-cada-tipo',
    {
      ruta: '/cuentas',
      comp: 'apps/web/src/app/(finn)/cuentas/pantalla.tsx',
      ref: `${E1}/S6-Cuentas`,
      nota: 'Corriente, ahorro, billetera, tarjeta, préstamo e inversión creadas desde la interfaz.',
    },
    crear,
  );

  // ── Categorías con la plantilla ───────────────────────────────────────────────────────────────────────────────────
  await paso(
    '14',
    'inicio-un-paso-hecho',
    {
      ruta: '/',
      comp: 'apps/web/src/app/(finn)/primeros-pasos.tsx',
      ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/primeros-pasos`,
    },
    async () => {
      await page.locator('nav[data-marco-barra]').getByRole('link', { name: 'Inicio' }).click();
      await page.waitForURL((u) => u.pathname === '/');
      await quieta(page);
      await expect(page.getByRole('heading', { name: 'Primeros pasos' })).toBeVisible();
    },
  );
  await paso(
    '15',
    'estructura-vacia',
    {
      ruta: '/presupuesto/estructura',
      comp: 'apps/web/src/app/(finn)/presupuesto/estructura/page.tsx',
      ref: `${E2}/08-estructura-y-plantilla-inicial/estructura`,
    },
    async () => {
      await page.getByRole('link', { name: 'Crear las categorías', exact: true }).click();
      await page.waitForURL(/\/presupuesto\/estructura$/);
      await quieta(page);
    },
  );
  await paso(
    '16',
    'plantilla',
    {
      ruta: '/presupuesto/estructura/plantilla',
      comp: 'apps/web/src/flujos/presupuesto-estructura-plantilla/plantilla.tsx',
      ref: `${E2}/08-estructura-y-plantilla-inicial/plantilla`,
    },
    async () => {
      await page
        .getByRole('link', { name: 'Usar la plantilla de categorías', exact: true })
        .click();
      await page.waitForURL(/\/presupuesto\/estructura\/plantilla$/);
      await quieta(page);
    },
  );
  await paso(
    '17',
    'plantilla-creada',
    {
      ruta: '/presupuesto/estructura/plantilla',
      comp: 'apps/web/src/flujos/presupuesto-estructura-plantilla/plantilla.tsx',
      ref: `${E2}/08-estructura-y-plantilla-inicial/plantilla-creada`,
    },
    async () => {
      await page.getByRole('button', { name: /^Crear \d+ categorías$/ }).click();
      await expect(page.getByText(/^\d+ creadas\.$/)).toBeVisible({ timeout: 60_000 });
      await quieta(page);
      return (await page.getByText(/^\d+ creadas\.$/).textContent()) ?? undefined;
    },
  );
  await paso(
    '18',
    'presupuesto-con-categorias',
    {
      ruta: '/presupuesto',
      comp: 'apps/web/src/app/(finn)/presupuesto/page.tsx',
      ref: `${E1}/S2-Presupuesto`,
    },
    async () => {
      // ¿Qué salida ofrece la pantalla de «creadas»? Se anota y se sigue por la que haya.
      const salidas = await page.locator('main a, main button').allTextContents();
      await page.goto('/presupuesto');
      await quieta(page);
      return `salidas de la pantalla «creadas»: ${salidas
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' | ')}`;
    },
  );

  // ── Conectar los SMS ──────────────────────────────────────────────────────────────────────────────────────────────
  let token = '';
  await paso(
    '19',
    'conectar-sms',
    {
      ruta: '/ajustes/webhook',
      comp: 'apps/web/src/app/(finn)/ajustes/webhook/page.tsx',
      ref: `${E2}/11-ajustes/conectar-sms`,
    },
    async () => {
      await page.goto('/');
      await quieta(page);
      await page.getByRole('link', { name: 'Conectar los SMS', exact: true }).click();
      await page.waitForURL(/\/ajustes\/webhook$/);
      await quieta(page);
    },
  );
  await paso(
    '20',
    'conectar-sms-token',
    {
      ruta: '/ajustes/webhook',
      comp: 'apps/web/src/app/(finn)/ajustes/webhook/page.tsx',
      ref: `${E2}/11-ajustes/conectar-sms`,
      nota: 'El token se ve una sola vez. En la captura se tapa.',
    },
    async () => {
      await page.getByRole('button', { name: 'Generar token', exact: true }).click();
      const caja = page.getByTestId('token');
      await expect(caja).toBeVisible();
      token = ((await caja.textContent()) ?? '').trim();
      // El token es un secreto de la pila local: no queda en la captura ni en las medidas.
      await caja.evaluate((e) => {
        e.textContent = '•'.repeat(43);
      });
      if (!/^[A-Za-z0-9_-]{43}$/.test(token))
        throw new Error('el token no tiene el formato esperado');
    },
  );
  await paso(
    '21',
    'inicio-sin-primeros-pasos',
    { ruta: '/', comp: 'apps/web/src/app/(finn)/pantalla-inicio.tsx', ref: `${E1}/S1-Inicio` },
    async () => {
      await page.goto('/');
      await quieta(page);
      const quedan = await page.getByRole('heading', { name: 'Primeros pasos' }).count();
      return quedan === 0
        ? 'Primeros pasos desapareció al cumplir los tres'
        : 'Primeros pasos sigue en Inicio';
    },
  );

  // ── Recibir un SMS y aprobarlo en la Bandeja ──────────────────────────────────────────────────────────────────────
  await paso(
    '22',
    'bandeja-con-el-sms',
    { ruta: '/bandeja', comp: 'apps/web/src/app/(finn)/bandeja/page.tsx', ref: `${E1}/S4-Bandeja` },
    async () => {
      if (token === '') throw new Error('sin token: el paso 20 no lo generó');
      const respuesta = await request.post('/api/sms', {
        headers: { authorization: `Bearer ${token}` },
        data: {
          texto: `VISA 4821: has realizado una compra por USD 35.00 en el comercio Super Selectos ${HOY.replaceAll('-', '/')}`,
          remitente: 'BAC',
        },
      });
      if (respuesta.status() !== 200)
        throw new Error(`POST /api/sms respondió ${respuesta.status()}`);
      await expect(async () => {
        await page.goto('/bandeja');
        await quieta(page);
        await expect(page.locator('[data-movimiento]')).toHaveCount(1);
      }).toPass({ timeout: 40_000 });
      const fila = page.locator('[data-movimiento]').first();
      return `vista de la fila: ${(await fila.getAttribute('data-vista')) ?? '?'}; contador de la barra: ${
        (await page
          .locator('nav[data-marco-barra] [data-contador]')
          .getAttribute('data-contador')
          .catch(() => null)) ?? 'sin contador'
      }`;
    },
  );
  await paso(
    '23',
    'revisar-movimiento',
    {
      ruta: '/bandeja/[movimientoId]',
      comp: 'apps/web/src/app/(finn)/bandeja/[movimientoId]/page.tsx',
      ref: `${E2}/01-revisar-movimiento/falta-categoria`,
    },
    async () => {
      const fila = page.locator('[data-movimiento]').first();
      const aprobar = fila.getByRole('button', { name: /^Aprobar/ });
      if ((await aprobar.count()) > 0)
        return 'la fila se puede aprobar de un toque; se abre igual para elegir categoría';
      await fila.getByRole('link').first().click();
      await page.waitForURL(/\/bandeja\/[0-9a-f-]{36}/);
      await quieta(page);
    },
  );
  await paso(
    '24',
    'movimiento-aprobado',
    {
      ruta: '/bandeja/[movimientoId]',
      comp: 'apps/web/src/app/(finn)/bandeja/[movimientoId]/page.tsx',
      ref: `${E2}/01-revisar-movimiento/aprobado`,
    },
    async () => {
      if (!/\/bandeja\/[0-9a-f-]{36}/.test(page.url())) {
        await page.locator('[data-movimiento]').first().getByRole('link').first().click();
        await page.waitForURL(/\/bandeja\/[0-9a-f-]{36}/);
        await quieta(page);
      }
      await elegir(page, tg.categoriaDeParte('1'), /Supermercado/);
      await page.getByRole('button', { name: /^Aprobar/ }).click();
      await expect(page.getByTestId('resultado')).toBeVisible({ timeout: 20_000 });
      await quieta(page);
      return ((await page.getByTestId('resultado').textContent()) ?? '').trim();
    },
  );
  await paso(
    '25',
    'bandeja-al-dia',
    {
      ruta: '/bandeja',
      comp: 'apps/web/src/app/(finn)/bandeja/page.tsx',
      ref: `${E1}/S4-Bandeja__bandeja-al-dia`,
    },
    async () => {
      await page.goto('/bandeja');
      await quieta(page);
      return `filas por revisar: ${await page.locator('[data-movimiento]').count()}`;
    },
  );

  // ── Asignar dinero ────────────────────────────────────────────────────────────────────────────────────────────────
  await paso(
    '26',
    'asignar-hoja',
    {
      ruta: '/presupuesto/asignar/[categoriaId]',
      comp: 'apps/web/src/app/(finn)/@superpuesto/(.)presupuesto/asignar/[categoriaId]/page.tsx',
      ref: `${E2}/07-flujos-del-presupuesto/asignar`,
    },
    async () => {
      await page
        .locator('nav[data-marco-barra]')
        .getByRole('link', { name: 'Presupuesto' })
        .click();
      await page.waitForURL(/\/presupuesto$/);
      await quieta(page);
      await page.getByRole('link', { name: 'Asignar a Supermercado', exact: true }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await quieta(page);
      await page.getByLabel(/Nuevo valor de Asignado/).fill('200');
    },
  );
  await paso(
    '27',
    'presupuesto-asignado',
    {
      ruta: '/presupuesto',
      comp: 'apps/web/src/app/(finn)/presupuesto/page.tsx',
      ref: `${E1}/S2-Presupuesto`,
    },
    async () => {
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^(Guardar|Asignar)/ })
        .click();
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 20_000 });
      await quieta(page);
    },
  );

  // ── Registrar un gasto ────────────────────────────────────────────────────────────────────────────────────────────
  await paso(
    '28',
    'registrar-selector',
    {
      ruta: '/registrar',
      comp: 'apps/web/src/app/(finn)/registrar/page.tsx',
      ref: `${E2}/12-registrar-tipos-y-flujos-cortos/selector`,
    },
    async () => {
      await page
        .locator('header[data-marco-barra]')
        .getByRole('link', { name: 'Registrar' })
        .click();
      await page.waitForURL(/\/registrar/);
      await quieta(page);
    },
  );
  await paso(
    '29',
    'registrar-gasto-lleno',
    {
      ruta: '/registrar/gasto',
      comp: 'apps/web/src/app/(finn)/registrar/gasto/page.tsx',
      ref: `${E1}/S5-Registrar`,
    },
    async () => {
      if (!/\/registrar\/gasto/.test(page.url())) {
        await page
          .getByRole('link', { name: /Un gasto/ })
          .first()
          .click({ timeout: 15_000 });
        await page.waitForURL(/\/registrar\/gasto/);
        await quieta(page);
      }
      await expect(page.locator('[data-campo-lineas]')).toBeVisible({ timeout: 15_000 });
      await elegir(page, tg.cuenta, /Cuenta corriente/);
      await campo(page, tg.total).fill('12.50');
      await campo(page, tg.comercio).fill('Farmacia San Nicolás');
      await campo(page, tg.montoDeParte('1'))
        .fill('12.50')
        .catch(() => undefined);
      await elegir(page, tg.categoriaDeParte('1'), /Supermercado/);
      await page
        .locator('h1')
        .first()
        .click({ force: true })
        .catch(() => undefined);
      await page.waitForTimeout(500);
    },
  );
  await paso(
    '30',
    'gasto-guardado',
    {
      ruta: '/registrar/gasto',
      comp: 'apps/web/src/app/(finn)/registrar/gasto/page.tsx',
      ref: `${E1}/S5-Registrar__guardado`,
    },
    async () => {
      await page.getByRole('button', { name: /^Guardar/ }).click();
      await expect(page.getByText(/^Guardado: /)).toBeVisible({ timeout: 20_000 });
      await quieta(page);
      return (
        (await page
          .getByText(/^Guardado: /)
          .first()
          .textContent()) ?? ''
      ).trim();
    },
  );
  await paso(
    '31',
    'actividad-final',
    {
      ruta: '/actividad',
      comp: 'apps/web/src/app/(finn)/actividad/page.tsx',
      ref: `${E2}/02-actividad/lista`,
    },
    async () => {
      await page.goto('/actividad');
      await quieta(page);
      return `transacciones en la lista: ${await page.locator('[data-transaccion], main li a[href^="/actividad/"]').count()}`;
    },
  );
  await paso(
    '32',
    'inicio-final',
    { ruta: '/', comp: 'apps/web/src/app/(finn)/pantalla-inicio.tsx', ref: `${E1}/S1-Inicio` },
    async () => {
      await page.goto('/');
      await quieta(page);
    },
  );
  guardar();
});
