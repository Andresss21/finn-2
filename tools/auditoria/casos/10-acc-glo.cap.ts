// Auditoría de diseño · ACC (acceso) y GLO (marco y estados globales).
// Un caso por entrada del inventario de docs/auditoria-diseno/secciones/10-acc-glo.md.
// Las credenciales salen del arnés (`variable`, `codigoTotp`): nunca se imprimen ni se escriben.
// El usuario de prueba conserva siempre su factor original: lo que agrega un caso (un respaldo, un factor sin verificar)
// se quita en el mismo caso y, por si un caso muere, otra vez en `afterAll`.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  caso,
  capturar,
  codigoTotp,
  entrar,
  escenarioA7,
  expect,
  quieta,
  SALIDA,
  test,
  variable,
  type BrowserContext,
  type Page,
  type TestInfo,
} from '../lib.ts';
import { clienteConFrasco, factorPrincipal } from '../../../apps/web/e2e/ayudas/sesion.ts';
import { codigoDe } from '../../../apps/web/e2e/ayudas/totp.ts';
import {
  completarInscripcion,
  ingresar,
  iniciarInscripcion,
  verificarFactor,
} from '../../../packages/aplicacion/src/autenticacion/supabase.ts';

const ACC = '02-referencias/entrega-2/pantallas/13-acceso';
const E14 = '02-referencias/entrega-2/pantallas/14-sin-conexion-404-y-error-de-pantalla';
const E3 = 'entrega-3/pantallas/16-salir';
const K1 = '02-referencias/entrega-1/pantallas/K1-Navegacion';
const COMP = '02-referencias/entrega-1/componentes';

const F_INGRESAR = 'apps/web/src/app/ingresar/formulario-ingresar.tsx';
const F_VERIFICAR = 'apps/web/src/app/ingresar/verificar/formulario-verificar.tsx';
const F_INSCRIBIR = 'apps/web/src/flujos/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx';
const F_MARCO = 'apps/web/src/componentes/marco/marco.tsx';
const F_NAV = 'apps/web/src/componentes/navegacion/navegacion-app.tsx';
const F_NOTIF = 'apps/web/src/app/(finn)/notificaciones/contenido.tsx';
const F_SESIONES = 'apps/web/src/app/(finn)/ajustes/seguridad/sesiones.tsx';

const esTelefono = (info: TestInfo): boolean => info.project.name.startsWith('telefono');

// ── Sesiones ────────────────────────────────────────────────────────────────────────────────────────────────────────

type Cliente = ReturnType<typeof clienteConFrasco>['cliente'];

/** Cliente con sesión AAL1 real (contraseña sin el segundo factor) y su frasco de cookies. */
async function sesionAal1(): Promise<{ cliente: Cliente; frasco: Map<string, string> }> {
  const { cliente, frasco } = clienteConFrasco();
  const paso = await ingresar(cliente.auth, variable('FINN_USUARIO_ID'), {
    email: variable('E2E_EMAIL'),
    contrasena: variable('E2E_CLAVE'),
  });
  if (!paso.ok) throw new Error('el usuario de prueba no pudo ingresar');
  return { cliente, frasco };
}

async function entrarAal1(context: BrowserContext, baseURL: string | undefined): Promise<void> {
  const { frasco } = await sesionAal1();
  await context.clearCookies();
  await context.addCookies(
    [...frasco].map(([name, value]) => ({ name, value, url: baseURL ?? 'http://localhost:3100' })),
  );
}

/** Cliente AAL2 con el factor original del usuario de prueba. */
async function clienteAal2(): Promise<Cliente> {
  const { cliente } = await sesionAal1();
  const r = await verificarFactor(cliente.auth, variable('FINN_USUARIO_ID'), {
    factorId: await factorPrincipal(cliente.auth),
    codigo: codigoTotp(),
  });
  if (!r.ok) throw new Error('el factor del usuario de prueba no se verificó');
  return cliente;
}

/** Deja al usuario solo con su factor original: quita respaldos y factores sin verificar que haya agregado un caso. */
async function soloElFactorOriginal(): Promise<void> {
  const cliente = await clienteAal2();
  const principal = await factorPrincipal(cliente.auth);
  const { data } = await cliente.auth.mfa.listFactors();
  for (const f of data?.all ?? []) {
    if (f.id === principal) continue;
    await cliente.auth.mfa.unenroll({ factorId: f.id });
  }
}

test.afterAll(async () => {
  await soloElFactorOriginal().catch(() => undefined);
});

// ── Server Actions simuladas ────────────────────────────────────────────────────────────────────────────────────────

/** El id de compilación que Next pone en cada respuesta de acción (`"b"`), leído del documento. */
async function idCompilacion(page: Page): Promise<string> {
  const html = await page.content();
  const m = /\\"b\\":\\"([^"\\]+)\\"/.exec(html) ?? /"b":"([^"]+)"/.exec(html);
  if (m?.[1] === undefined) throw new Error('no se encontró el id de compilación');
  return m[1];
}

const esAccion = (peticion: { method(): string; headers(): Record<string, string> }): boolean =>
  peticion.method() === 'POST' && peticion.headers()['next-action'] !== undefined;

/**
 * Responde la próxima Server Action (o todas) con `resultado`, con el mismo formato que el servidor
 * (`0:{"a":"$@1",…}\n1:<resultado>`). Solo para estados que no se pueden provocar sin dañar al usuario de prueba
 * (límite de intentos, código vencido, fallo al salir).
 */
async function simularAccion(
  page: Page,
  resultado: unknown | ((n: number) => unknown),
  opciones: { retener?: Promise<void> } = {},
): Promise<void> {
  const b = await idCompilacion(page);
  let n = 0;
  await page.route('**/*', async (ruta) => {
    if (!esAccion(ruta.request())) return ruta.fallback();
    const r =
      typeof resultado === 'function' ? (resultado as (n: number) => unknown)(n) : resultado;
    n += 1;
    if (opciones.retener !== undefined) await opciones.retener;
    await ruta
      .fulfill({
        status: 200,
        contentType: 'text/x-component',
        body: `0:{"a":"$@1","q":"","i":false,"b":"${b}"}\n1:${JSON.stringify(r)}\n`,
      })
      .catch(() => undefined);
  });
}

const errorDe = (codigo: string, mensaje: string) => ({
  ok: false,
  error: { categoria: 'DOMINIO', codigo, mensaje },
});
const ERROR_INTERNO = {
  ok: false,
  error: {
    categoria: 'INTERNO',
    codigo: 'interno',
    mensaje: 'Algo salió mal y no se guardó nada. Referencia: E-7K2M9QXD.',
    idError: 'E-7K2M9QXD',
  },
};

/** Una compuerta: la promesa queda pendiente hasta `abrir()`. */
function compuerta(): { espera: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined;
  const espera = new Promise<void>((r) => {
    abrir = r;
  });
  return { espera, abrir };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ACC · /ingresar
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const ING = { ruta: '/ingresar', comp: F_INGRESAR, sesion: false } as const;

async function llenarIngresar(page: Page, email: string, clave: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
}

caso({
  ...ING,
  id: 'acceso__ingresar-vacio',
  ref: `${ACC}/ingresar`,
  nota: 'La referencia muestra los campos llenos; este caso es la pantalla recién abierta.',
});

caso({
  ...ING,
  id: 'acceso__ingresar',
  ref: `${ACC}/ingresar`,
  nota: 'Campos llenos como en la referencia (correo y contraseña de ejemplo, sin enviar).',
  pasos: async (page) => {
    await llenarIngresar(page, 'jose@finn.sv', 'contrasena');
    await page.locator('body').click({ position: { x: 5, y: 5 } });
  },
});

caso({
  ...ING,
  id: 'acceso__ingresar-foco',
  ref: 'PANTALLAS §2.2 (foco del campo)',
  nota: 'Foco en el campo Email: inset 0 -3px 0 --foco + 0 0 0 3px --accion-tonal.',
  pasos: async (page) => {
    await page.getByLabel('Email').focus();
  },
});

caso({
  ...ING,
  id: 'acceso__ingresar-validacion',
  ref: 'SIN DISEÑO',
  nota: 'Enviar con los campos vacíos. Componente de referencia: PANTALLAS §2.2 (error de campo) y P1-02.',
  pasos: async (page) => {
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText('Escribí tu email.')).toBeVisible();
  },
});

caso({
  ...ING,
  id: 'acceso__ingresar-contrasena-visible',
  ref: 'SIN DISEÑO',
  nota: '«Mostrar contraseña» activado: el diseño de 13-acceso/ingresar no tiene este control.',
  pasos: async (page) => {
    await llenarIngresar(page, 'jose@finn.sv', 'contrasena');
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  },
});

caso({
  ...ING,
  id: 'acceso__credenciales-invalidas',
  ref: `${ACC}/credenciales-invalidas`,
  nota: 'Respuesta real del servidor con un correo que no existe.',
  pasos: async (page) => {
    await llenarIngresar(page, 'jose@finn.sv', 'contrasena-incorrecta');
    const respuesta = page.waitForResponse((r) => r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await respuesta;
    await expect(page.getByText('El email o la contraseña no son correctos.')).toBeVisible();
  },
});

caso({
  ...ING,
  id: 'acceso__demasiados-intentos',
  ref: `${ACC}/demasiados-intentos`,
  nota: 'Respuesta de la acción simulada (`demasiados_intentos`): provocarla de verdad bloquearía al usuario de prueba.',
  pasos: async (page) => {
    await simularAccion(
      page,
      errorDe(
        'demasiados_intentos',
        'Hiciste demasiados intentos. Esperá unos minutos y volvé a intentar.',
      ),
    );
    await llenarIngresar(page, 'jose@finn.sv', 'contrasena');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText(/demasiados intentos/)).toBeVisible();
  },
});

test('acceso__ingresar-enviando', async ({ page }, info) => {
  await page.goto('/ingresar');
  await quieta(page);
  const c = compuerta();
  await simularAccion(page, errorDe('credenciales_invalidas', 'x'), { retener: c.espera });
  await llenarIngresar(page, 'jose@finn.sv', 'contrasena');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('button', { name: /Ingresando/ })).toBeVisible();
  await capturar(
    page,
    info,
    'acceso__ingresar-enviando',
    {
      ruta: '/ingresar',
      comp: F_INGRESAR,
      ref: 'PANTALLAS §2.1 (enviando)',
      nota: 'Botón principal ocupado: «Ingresando…». Sin PNG propio en 13-acceso.',
    },
    { carga: true },
  );
  c.abrir();
});

test('acceso__ingresar-sin-conexion', async ({ page, context }, info) => {
  await page.goto('/ingresar');
  await quieta(page);
  await llenarIngresar(page, 'jose@finn.sv', 'contrasena');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForTimeout(300);
  await capturar(page, info, 'acceso__ingresar-sin-conexion', {
    ruta: '/ingresar',
    comp: F_INGRESAR,
    ref: 'SIN DISEÑO',
    nota: 'Enviar sin conexión. El acceso no tiene el aviso global (no hay marco).',
  });
  await context.setOffline(false);
});

test('acceso__sesion-vencida', async ({ page, context, baseURL }, info) => {
  // Como PRU-E2E-ACCESO-001: JWT vencido y refresh token que Auth rechaza.
  const base64url = (t: string): string => Buffer.from(t).toString('base64url');
  const host = new URL(variable('NEXT_PUBLIC_SUPABASE_URL')).hostname.split('.')[0];
  const carga = base64url(
    JSON.stringify({ sub: variable('FINN_USUARIO_ID'), aal: 'aal2', exp: 1 }),
  );
  const vencida = {
    access_token: `${base64url('{"alg":"ES256","typ":"JWT"}')}.${carga}.firma`,
    refresh_token: 'rechazado',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 1,
    user: { id: variable('FINN_USUARIO_ID') },
  };
  await context.addCookies([
    {
      name: `sb-${host}-auth-token`,
      value: `base64-${base64url(JSON.stringify(vencida))}`,
      url: baseURL ?? 'http://localhost:3100',
    },
  ]);
  await page.goto('/presupuesto');
  await quieta(page);
  await capturar(page, info, 'acceso__sesion-vencida', {
    ruta: '/ingresar?volver=…',
    comp: F_INGRESAR,
    ref: 'SIN DISEÑO',
    nota: 'FALTANTES `sesion-vencida`: una consulta con la sesión vencida redirige a /ingresar?volver=….',
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ACC · /ingresar/verificar
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const VER = { ruta: '/ingresar/verificar', comp: F_VERIFICAR } as const;

async function abrirVerificar(page: Page, context: BrowserContext, baseURL: string | undefined) {
  await entrarAal1(context, baseURL);
  await page.goto('/ingresar/verificar');
  await quieta(page);
  await expect(page.getByRole('button', { name: 'Verificar' })).toBeVisible();
}

test('acceso__verificar', async ({ page, context, baseURL }, info) => {
  await abrirVerificar(page, context, baseURL);
  await capturar(page, info, 'acceso__verificar-vacio', {
    ...VER,
    ref: `${ACC}/verificar`,
    nota: 'DECISIONES: 6 casillas de 44 × 52. Recién abierta, sin dígitos.',
  });
  await page.locator('input').first().focus();
  await capturar(page, info, 'acceso__verificar-foco', {
    ...VER,
    ref: `${ACC}/verificar`,
    nota: 'Foco en el código (en la referencia, la quinta casilla lleva la línea de 3 px en --accion).',
  });
  await page.keyboard.type('4821');
  await capturar(page, info, 'acceso__verificar-a-medio', {
    ...VER,
    ref: `${ACC}/verificar`,
    nota: 'Cuatro dígitos escritos, como en la referencia (4 8 2 1 y dos casillas vacías).',
  });
  // Validación del cliente: enviar con menos de 6 dígitos
  await page.getByRole('button', { name: 'Verificar' }).click();
  await page.waitForTimeout(200);
  await capturar(page, info, 'acceso__verificar-incompleto', {
    ...VER,
    ref: 'SIN DISEÑO',
    nota: 'Enviar con 4 dígitos: el diseño verifica solo al sexto dígito y no tiene este estado.',
  });
});

test('acceso__verificar-comportamiento', async ({ page, context, baseURL }, info) => {
  // (8) Comportamiento del código: escribir avanza, pegar reparte, Retroceso vuelve, se verifica sola al sexto dígito.
  await abrirVerificar(page, context, baseURL);
  const envios: string[] = [];
  page.on('request', (r) => {
    if (esAccion(r)) envios.push(r.url());
  });
  const campos = page.locator('form input:not([type=hidden])');
  const cuantos = await campos.count();
  const cajas = await campos.evaluateAll((es) =>
    es.map((e) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return {
        ancho: Math.round(r.width),
        alto: Math.round(r.height),
        maxlength: e.getAttribute('maxlength'),
        inputmode: e.getAttribute('inputmode'),
        autocomplete: e.getAttribute('autocomplete'),
        etiqueta: (e as HTMLInputElement).labels?.[0]?.textContent ?? e.getAttribute('aria-label'),
        radio: s.borderRadius,
        sombra: s.boxShadow,
        fuente: `${s.fontFamily.split(',')[0]} ${s.fontSize} ${s.fontWeight}`,
      };
    }),
  );
  await campos.first().focus();
  await page.keyboard.type('123');
  const trasEscribir3 = {
    valores: await campos.evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value)),
    focoEn: await page.evaluate(() =>
      [...document.querySelectorAll('form input:not([type=hidden])')].indexOf(
        document.activeElement as Element,
      ),
    ),
  };
  await page.keyboard.press('Backspace');
  const trasRetroceso = await campos.evaluateAll((es) =>
    es.map((e) => (e as HTMLInputElement).value),
  );
  await campos.first().fill('');
  // Pegar «123 456»
  await campos.first().focus();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData('text/plain', '123 456');
    document.activeElement?.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  });
  const trasPegarEvento = await campos.evaluateAll((es) =>
    es.map((e) => (e as HTMLInputElement).value),
  );
  await campos.first().fill('');
  await campos.first().focus();
  await page.keyboard.insertText('123 456');
  const trasPegarTexto = await campos.evaluateAll((es) =>
    es.map((e) => (e as HTMLInputElement).value),
  );
  // ¿Se verifica sola al sexto dígito? Se escribe un código de 6 dígitos y se espera sin tocar el botón.
  await campos.first().fill('');
  await campos.first().focus();
  await simularAccion(
    page,
    errorDe('codigo_incorrecto', 'El código no es correcto. Revisá que sea el de Finn en tu app.'),
  );
  await page.keyboard.type('000000');
  await page.waitForTimeout(1500);
  const enviosSinBoton = envios.length;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const enviosConEnter = envios.length;
  writeFileSync(
    join(SALIDA, 'medidas', `_comportamiento-codigo__${info.project.name}.txt`),
    JSON.stringify(
      {
        nota: 'Comportamiento del código TOTP en /ingresar/verificar (DECISIONES: 6 casillas)',
        cantidadDeCampos: cuantos,
        cajas,
        trasEscribir3,
        trasRetroceso,
        trasPegarEvento,
        trasPegarTexto,
        seVerificaSolaAlSextoDigito: enviosSinBoton > 0,
        enviosSinBoton,
        enviosConEnter,
      },
      null,
      1,
    ),
  );
});

test('acceso__verificar-errores', async ({ page, context, baseURL }, info) => {
  await abrirVerificar(page, context, baseURL);
  // Código incorrecto: respuesta real del servidor (un intento por variante).
  await page.locator('form input:not([type=hidden])').first().fill('000000');
  const respuesta = page.waitForResponse((r) => esAccion(r.request()));
  await page.getByRole('button', { name: 'Verificar' }).click();
  await respuesta;
  await expect(page.getByText(/El código no es correcto/)).toBeVisible();
  // Durante el temblor: medidas del grupo y del borde
  const temblor = await page.evaluate(() => {
    const g = document.querySelector('[data-temblor]');
    const campo = document.querySelector('form input:not([type=hidden])');
    const anim = g?.getAnimations().map((a) => ({
      nombre: (a as CSSAnimation).animationName,
      duracion: a.effect?.getComputedTiming().duration,
    }));
    const s = campo === null ? null : getComputedStyle(campo);
    return {
      clase: g?.className,
      animaciones: anim,
      bordeDelCampo:
        s === null ? null : `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      sombraDelCampo: s?.boxShadow,
      focoEnElCampo: document.activeElement === campo,
      valor: (campo as HTMLInputElement | null)?.value,
    };
  });
  writeFileSync(
    join(SALIDA, 'medidas', `_comportamiento-error__${info.project.name}.txt`),
    JSON.stringify(temblor, null, 1),
  );
  await capturar(page, info, 'acceso__codigo-incorrecto', {
    ...VER,
    ref: `${ACC}/codigo-incorrecto`,
    nota: 'Respuesta real del servidor a 000000.',
  });
  // Código vencido: simulado (el reto de Auth vence a los minutos; no se puede esperar).
  await simularAccion(
    page,
    errorDe('codigo_vencido', 'El código venció. Escribí el que muestra ahora tu app.'),
  );
  await page.locator('form input:not([type=hidden])').first().fill('482193');
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByText(/El código venció/)).toBeVisible();
  await capturar(page, info, 'acceso__codigo-vencido', {
    ...VER,
    ref: `${ACC}/codigo-vencido`,
    nota: 'Respuesta de la acción simulada (`codigo_vencido`).',
  });
});

test('acceso__verificar-enviando-y-correcto', async ({ page, context, baseURL }, info) => {
  await abrirVerificar(page, context, baseURL);
  // Línea de tiempo de lo que pasa entre tocar «Verificar» y llegar al destino (DECISIONES: check con pop y sigue a los 650 ms).
  const linea: { ms: number; que: string }[] = [];
  let t0 = 0;
  const anotar = (que: string): void => {
    linea.push({ ms: t0 === 0 ? 0 : Date.now() - t0, que });
  };
  await page.exposeFunction('__anotar', anotar);
  page.on('request', (r) => {
    const ruta = new URL(r.url()).pathname;
    if (esAccion(r)) anotar('acción enviada');
    else if (r.isNavigationRequest()) anotar(`documento pedido: ${ruta}`);
    else if (r.headers()['rsc'] === '1' && r.headers()['next-router-prefetch'] === undefined)
      anotar(`RSC pedido: ${ruta}`);
  });
  page.on('response', (r) => {
    if (esAccion(r.request())) anotar(`acción respondida (${r.status()})`);
  });
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) anotar(`navegó a ${new URL(f.url()).pathname}`);
  });
  await page.evaluate(() => {
    const w = window as unknown as { __ultimo?: string; __anotar: (q: string) => void };
    const ver = (): void => {
      const v = document.querySelector('[data-verificado]');
      const b = [...document.querySelectorAll('form button')].map((x) => x.textContent).join(' | ');
      const estado = `${v === null ? '' : '«Código correcto» visible; '}botones: ${b}`;
      if (estado !== w.__ultimo) {
        w.__ultimo = estado;
        w.__anotar(estado);
      }
    };
    new MutationObserver(ver).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
  });
  // Verificando…: la acción queda retenida
  const c = compuerta();
  let retener = true;
  await page.route('**/*', async (ruta) => {
    if (!esAccion(ruta.request()) || !retener) return ruta.fallback();
    await c.espera;
    return ruta.fallback();
  });
  await page.locator('form input:not([type=hidden])').first().fill(codigoTotp());
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByRole('button', { name: /Verificando/ })).toBeVisible();
  await capturar(
    page,
    info,
    'acceso__verificar-enviando',
    {
      ...VER,
      ref: 'PANTALLAS §2.1 (enviando)',
      nota: 'Botón «Verificando…». En el diseño no hay botón que esperar: se verifica sola al sexto dígito.',
    },
    { carga: true },
  );
  retener = false;
  linea.length = 0;
  t0 = Date.now();
  anotar('se suelta la acción');
  c.abrir();
  // Si «Código correcto» llega a verse, se le saca una foto en el acto (no hay tiempo de medir: sigue a los 650 ms).
  const visto = await page
    .locator('[data-verificado]')
    .waitFor({ state: 'visible', timeout: 6000 })
    .then(() => true)
    .catch(() => false);
  if (visto) {
    const medida = await page
      .evaluate(() => {
        const p = document.querySelector('[data-verificado]');
        const campo = document.querySelector('form input:not([type=hidden])');
        const s = campo === null ? null : getComputedStyle(campo);
        const r = p?.getBoundingClientRect();
        return {
          texto: p?.textContent,
          cajaDelMensaje:
            r === undefined
              ? null
              : [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
          fondoDelCampo: s?.backgroundColor,
          valorDelCampo: (campo as HTMLInputElement | null)?.value,
        };
      })
      .catch(() => null);
    anotar(`medida en el estado correcto: ${JSON.stringify(medida)}`);
    await page
      .screenshot({
        path: join(SALIDA, 'capturas', `acceso__verificar-correcto__${info.project.name}.png`),
        animations: 'disabled',
        caret: 'hide',
      })
      .catch(() => undefined);
  }
  await page.waitForURL((u) => !u.pathname.startsWith('/ingresar'), { timeout: 20_000 });
  anotar('llegó al destino');
  writeFileSync(
    join(SALIDA, 'medidas', `_comportamiento-correcto__${info.project.name}.txt`),
    JSON.stringify({ seVioCodigoCorrecto: visto, linea }, null, 1),
  );
});

test('acceso__verificar-varios-factores', async ({ page, context, baseURL }, info) => {
  // Un respaldo real, agregado por la API y quitado al terminar: el factor original no se toca.
  const finn = variable('FINN_USUARIO_ID');
  const cliente = await clienteAal2();
  const inicio = await iniciarInscripcion(cliente.auth, finn, { nombre: 'Respaldo' });
  if (!inicio.ok) throw new Error(`no se pudo iniciar el respaldo: ${inicio.error.codigo}`);
  try {
    const fin = await completarInscripcion(cliente.auth, finn, {
      factorId: inicio.valor.factorId,
      codigo: codigoDe(inicio.valor.secreto),
    });
    if (!fin.ok) throw new Error(`no se pudo verificar el respaldo: ${fin.error.codigo}`);
    await abrirVerificar(page, context, baseURL);
    await capturar(page, info, 'acceso__verificar-varios-factores', {
      ...VER,
      ref: `${ACC}/verificar-varios-factores`,
      nota: 'Dos factores verificados (el original y un respaldo agregado para la captura).',
    });
    const factor = page.getByLabel('Factor');
    if ((await factor.count()) > 0) {
      await factor
        .first()
        .click()
        .catch(() => undefined);
      await page.waitForTimeout(300);
      await capturar(page, info, 'acceso__verificar-varios-factores-abierto', {
        ...VER,
        ref: 'PANTALLAS §2.2 (selección abierta)',
        nota: 'La selección de factor abierta.',
      });
    }
  } finally {
    await cliente.auth.mfa.unenroll({ factorId: inicio.valor.factorId });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ACC · /ingresar/inscribir
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// La página solo se muestra con AAL1 y cero factores verificados, y eso no se puede provocar sin quitar el factor original
// del usuario de prueba. Lo que sí se puede: con AAL2 y `?cierre=1` el servidor entrega la misma página con `cerrado`;
// se cambia ese dato del documento (`cerrado: false`) y las dos acciones (`iniciarInscripcion`, `completarInscripcion`) se
// responden simuladas. El marcado, los estilos y el componente son los reales de `/ingresar/inscribir`.

const INS = { ruta: '/ingresar/inscribir', comp: F_INSCRIBIR } as const;
const SECRETO_REF = 'JBSWY3DPEHPK3PXP';

/** Un QR real de Auth (SVG), de un factor sin verificar que se quita en el acto. */
async function qrReal(): Promise<string> {
  const cliente = await clienteAal2();
  const r = await iniciarInscripcion(cliente.auth, variable('FINN_USUARIO_ID'), {
    nombre: 'Captura de auditoría',
  });
  if (!r.ok) throw new Error(`no se pudo pedir un QR: ${r.error.codigo}`);
  await cliente.auth.mfa.unenroll({ factorId: r.valor.factorId });
  return r.valor.qrSvg;
}

async function abrirInscribir(
  page: Page,
  context: BrowserContext,
  baseURL: string | undefined,
  respuestas: (n: number) => unknown,
  retener?: Promise<void>,
): Promise<void> {
  await entrar(context, baseURL);
  let b = '';
  let n = 0;
  await page.route('**/*', async (ruta) => {
    const p = ruta.request();
    if (esAccion(p)) {
      const r = respuestas(n);
      n += 1;
      if (n === 1 && retener !== undefined) await retener;
      return ruta
        .fulfill({
          status: 200,
          contentType: 'text/x-component',
          body: `0:{"a":"$@1","q":"","i":false,"b":"${b}"}\n1:${JSON.stringify(r)}\n`,
        })
        .catch(() => undefined);
    }
    if (p.isNavigationRequest() && new URL(p.url()).pathname === '/ingresar/inscribir') {
      const real = await ruta.fetch();
      const html = await real.text();
      b = /\\"b\\":\\"([^"\\]+)\\"/.exec(html)?.[1] ?? '';
      return ruta.fulfill({
        response: real,
        body: html.replaceAll('\\"cerrado\\":true', '\\"cerrado\\":false'),
      });
    }
    return ruta.fallback();
  });
  await page.goto('/ingresar/inscribir?cierre=1');
}

test('acceso__inscribir', async ({ page, context, baseURL }, info) => {
  const qrSvg = await qrReal();
  const inscripcion = { ok: true, valor: { factorId: 'f-auditoria', qrSvg, secreto: SECRETO_REF } };
  await abrirInscribir(page, context, baseURL, (n) =>
    n === 0
      ? inscripcion
      : n === 1
        ? errorDe(
            'codigo_incorrecto',
            'El código no es correcto. Revisá que sea el de Finn en tu app.',
          )
        : { ok: true, valor: {} },
  );
  await expect(page.getByAltText('Código QR para tu app de autenticación')).toBeVisible();
  await quieta(page);
  await capturar(page, info, 'acceso__inscribir', {
    ...INS,
    ref: `${ACC}/inscribir`,
    nota: 'Página real de /ingresar/inscribir con `cerrado` cambiado en el documento y `iniciarInscripcion` simulada (QR real de Auth, clave de la referencia).',
  });
  // Copiar la clave
  await context.grantPermissions(['clipboard-write']).catch(() => undefined);
  await page.getByRole('button', { name: 'Copiar' }).click();
  await page.waitForTimeout(300);
  await capturar(page, info, 'acceso__inscribir-copiado', {
    ...INS,
    ref: 'SIN DISEÑO',
    nota: 'Después de tocar «Copiar»: aparece «Copiado» bajo la clave. El diseño no muestra el resultado de copiar.',
  });
  // Código incorrecto
  await page.getByLabel('Código').fill('000000');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText(/El código no es correcto/)).toBeVisible();
  await capturar(page, info, 'acceso__inscribir-codigo-incorrecto', {
    ...INS,
    ref: `${ACC}/codigo-incorrecto`,
    nota: 'Código incorrecto al inscribir (acción simulada). La referencia más cercana es la de verificar.',
  });
  // Código correcto → cierre a los 650 ms
  await page.getByLabel('Código').fill('482193');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('heading', { name: 'Tu cuenta quedó protegida' })).toBeVisible();
  await capturar(page, info, 'acceso__inscribir-cierre-tras-confirmar', {
    ...INS,
    ref: `${ACC}/inscribir-cierre`,
    nota: 'El cierre al que llega el componente después de confirmar (acción simulada).',
  });
});

test('acceso__inscribir-preparando', async ({ page, context, baseURL }, info) => {
  const c = compuerta();
  await abrirInscribir(page, context, baseURL, () => ERROR_INTERNO, c.espera);
  await expect(page.getByText('Preparando tu código…')).toBeVisible();
  await capturar(
    page,
    info,
    'acceso__inscribir-preparando',
    {
      ...INS,
      ref: 'SIN DISEÑO',
      nota: 'Mientras responde `iniciarInscripcion`: solo el título y «Preparando tu código…».',
    },
    { carga: true },
  );
  c.abrir();
  await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
  await capturar(page, info, 'acceso__inscribir-error', {
    ...INS,
    ref: 'SIN DISEÑO',
    nota: '`iniciarInscripcion` falló (simulada): aviso de problema y «Intentar de nuevo».',
  });
});

caso({
  ...INS,
  id: 'acceso__inscribir-cierre',
  ref: `${ACC}/inscribir-cierre`,
  nota: 'Página real: /ingresar/inscribir?cierre=1 con sesión AAL2.',
  url: '/ingresar/inscribir?cierre=1',
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// GLO · marco
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const HOY_A7 = '2026-10-15';
const N = (motivo: string, titulo: string, cuerpo: string, creadaEn: string, leida = false) => ({
  aviso: null,
  motivo,
  titulo,
  cuerpo,
  creadaEn,
  leida,
});
const NOTIF = [
  N(
    'pago_tarjeta_proximo',
    'Visa Oro corta el 25/10',
    'Te falta reservar $18.75 para que la deuda quede cubierta antes del corte.',
    '2026-10-15T08:00:00-06:00',
  ),
  N(
    'cuota_proxima',
    'Cuota del préstamo el 20/10',
    'Cuota 14 · $210.00 desde Cuenta de ahorro. Se registra sola.',
    '2026-10-15T07:55:00-06:00',
  ),
  N(
    'meta_vencida',
    'Netflix tiene su meta cubierta',
    'Ya está asignado lo que pide este período.',
    '2026-10-14T12:00:00-06:00',
    true,
  ),
  N(
    'registro_automatico',
    'La regla PIZZA HUT se aplicó',
    '1 movimiento quedó en Restaurantes.',
    '2026-10-13T12:00:00-06:00',
    true,
  ),
  N(
    'cierre_periodo',
    'Se cerró el período 21/08 – 20/09',
    'Sobregiros cubiertos: Listo para asignar no cambió.',
    '2026-09-21T06:00:00-06:00',
    true,
  ),
] as const;

const A7N = {
  escenario: escenarioA7(),
  hoyServidor: HOY_A7,
  notificaciones: NOTIF,
  soloLectura: true,
} as const;
const A7_LEIDAS = {
  escenario: escenarioA7(),
  hoyServidor: HOY_A7,
  notificaciones: NOTIF.map((n) => ({ ...n, leida: true })),
  soloLectura: true,
} as const;
const A7_SIN = { escenario: escenarioA7(), hoyServidor: HOY_A7, soloLectura: true } as const;

const campana = (page: Page) =>
  page.locator('header[data-marco-barra]').getByRole('link', { name: /^Notificaciones/ });

caso({
  ...A7N,
  id: 'marco__pestana',
  ruta: '/',
  comp: F_MARCO,
  ref: K1,
  nota: 'El marco en una pestaña: barra superior (Registrar, campana con 2, ☰) y barra inferior; en computadora, barra lateral.',
});

caso({
  ...A7N,
  id: 'marco__pestana-bandeja',
  ruta: '/bandeja',
  comp: F_NAV,
  ref: K1,
  nota: 'Bandeja activa: el botón central pasa a --accion (PANTALLAS §3.1).',
});

caso({
  ...A7N,
  id: 'marco__pantalla-hija',
  ruta: '/presupuesto/categorias/[categoriaId]',
  comp: F_MARCO,
  ref: '02-referencias/entrega-1/pantallas/S3-Detalle',
  nota: 'Pantalla hija: flecha «Volver a Presupuesto», título de 1.625rem, campana y Más acciones.',
  url: async (page) => {
    await page.goto('/presupuesto');
    await quieta(page);
    const id = await page
      .locator('[data-fila-categoria]')
      .first()
      .getAttribute('data-fila-categoria');
    return `/presupuesto/categorias/${id ?? ''}`;
  },
});

caso({
  ...A7N,
  id: 'marco__mas-acciones-abierto',
  ruta: '/presupuesto/categorias/[categoriaId]',
  comp: 'apps/web/src/componentes/marco/mas-acciones.tsx',
  ref: '02-referencias/entrega-2/pantallas/MA-detalle-de-categoria-mas-acciones/mas-acciones',
  nota: 'Menú «Más acciones» del marco, abierto. La pantalla la audita la sección de categorías; acá solo el menú.',
  url: async (page) => {
    await page.goto('/presupuesto');
    await quieta(page);
    const id = await page
      .locator('[data-fila-categoria]')
      .first()
      .getAttribute('data-fila-categoria');
    return `/presupuesto/categorias/${id ?? ''}`;
  },
  pasos: async (page) => {
    await page.getByRole('button', { name: 'Más acciones' }).first().click();
    await page.waitForTimeout(400);
  },
});

caso({
  ...A7N,
  id: 'marco__seccion-de-mas',
  ruta: '/metas',
  comp: F_MARCO,
  ref: '02-referencias/entrega-2/pantallas/09a-metas/lista',
  nota: 'Pantalla de Más secciones: en teléfono solo la campana; en computadora, «Metas» activa en la barra lateral.',
});

caso({
  ...A7N,
  id: 'marco__ajustes',
  ruta: '/ajustes',
  comp: F_MARCO,
  ref: `${E3}/ajustes-indice`,
  nota: 'Entrega 3: campana en Ajustes, «Ajustes» activa en la barra lateral y tarjeta Salir bajo la lista.',
});

caso({
  ...A7N,
  id: 'marco__flujo-largo',
  ruta: '/registrar/gasto',
  comp: 'apps/web/src/componentes/marco/pagina-flujo.tsx',
  ref: '02-referencias/entrega-1/pantallas/S5-Registrar',
  nota: 'Flujo largo: sin campana ni barra inferior, «Cerrar» a la izquierda y pie fijo.',
});

caso({
  ...A7N,
  id: 'marco__foco-saltar',
  ruta: '/',
  comp: F_MARCO,
  ref: 'SIN DISEÑO',
  nota: 'Enlace «Saltar al contenido» con foco (primer Tab). Accesibilidad: no tiene referencia.',
  pasos: async (page) => {
    await page.keyboard.press('Tab');
  },
});

// ── Hoja Más secciones ──────────────────────────────────────────────────────────────────────────────────────────────

async function abrirMas(page: Page, info: TestInfo): Promise<void> {
  if (!esTelefono(info)) return; // en computadora no hay ☰: la referencia es la barra lateral
  await page.getByRole('button', { name: 'Más secciones' }).click();
  await expect(page.getByRole('dialog', { name: 'Más secciones' })).toBeVisible();
}

caso({
  ...A7N,
  id: 'marco__mas-secciones-abierta',
  ruta: '/',
  comp: F_NAV,
  ref: `${E3}/mas-secciones`,
  nota: 'Teléfono: hoja abierta desde ☰, por encima de la barra inferior, con Salir al final. Computadora: pie de la barra lateral con el correo y Salir.',
  pasos: abrirMas,
});

caso({
  ...A7_SIN,
  id: 'marco__mas-secciones-sin-contador',
  ruta: '/',
  comp: F_NAV,
  ref: `${E3}/mas-secciones`,
  nota: 'La misma hoja sin notificaciones sin leer: sin contador en la fila ni en la campana.',
  pasos: abrirMas,
});

caso({
  ...A7N,
  id: 'marco__mas-secciones-sin-conexion',
  ruta: '/',
  comp: F_NAV,
  ref: `${E3}/mas-secciones-sin-conexion`,
  nota: 'Sin conexión con la hoja abierta: el diseño deshabilita Salir con su motivo y muestra el aviso global.',
  pasos: async (page, info) => {
    await abrirMas(page, info);
    await page.context().setOffline(true);
    await expect(page.locator('[data-sin-conexion]')).toBeVisible();
  },
});

// ── Salir: la app solo lo tiene en /ajustes/seguridad ───────────────────────────────────────────────────────────────

const SEG = { ruta: '/ajustes/seguridad', comp: F_SESIONES } as const;

caso({
  ...A7N,
  ...SEG,
  id: 'salir__seguridad',
  ref: `${E3}/seguridad`,
  nota: 'Único lugar donde la app tiene «Salir». En el diseño (entrega 3) Seguridad ya no lo lleva.',
});

caso({
  ...A7N,
  ...SEG,
  id: 'salir__saliendo',
  ref: `${E3}/mas-secciones-saliendo`,
  nota: 'Saliendo… (acción retenida). La referencia es la fila de la hoja y el pie de la barra lateral.',
  carga: true,
  pasos: async (page) => {
    await simularAccion(page, ERROR_INTERNO, { retener: new Promise(() => undefined) });
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(page.getByRole('button', { name: /Saliendo/ })).toBeVisible();
  },
});

caso({
  ...A7N,
  ...SEG,
  id: 'salir__error',
  ref: `${E3}/mas-secciones-error`,
  nota: 'No se pudo salir (acción simulada con un error interno).',
  pasos: async (page) => {
    await simularAccion(page, ERROR_INTERNO);
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(page.locator('[data-estado="problema"]').last()).toBeVisible();
  },
});

caso({
  ...A7N,
  ...SEG,
  id: 'salir__sin-conexion',
  ref: `${E3}/mas-secciones-sin-conexion`,
  nota: 'Sin conexión: el diseño deshabilita Salir y muestra «Sin conexión: no se puede salir ahora.».',
  pasos: async (page) => {
    await page.context().setOffline(true);
    await expect(page.locator('[data-sin-conexion]')).toBeVisible();
  },
});

caso({
  ...A7N,
  ...SEG,
  id: 'salir__sin-conexion-tras-tocar',
  ref: `${E3}/mas-secciones-sin-conexion`,
  nota: 'Sin conexión y después de tocar «Salir».',
  pasos: async (page) => {
    await page.context().setOffline(true);
    await expect(page.locator('[data-sin-conexion]')).toBeVisible();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await page.waitForTimeout(400);
  },
});

test('salir__con-borradores', async ({ page, context, baseURL }, info) => {
  // Entrega 3: con borradores, Salir abre «Tenés N cambios sin enviar». Se siembran dos borradores en la pestaña y se toca Salir.
  await entrar(context, baseURL);
  await page.goto('/ajustes/seguridad');
  await quieta(page);
  await page.evaluate(() => {
    const b = (campos: unknown) =>
      JSON.stringify({
        version: 1,
        guardadoEn: '2026-10-15T09:41:00-06:00',
        campos,
        id: null,
        revisionAlAbrir: null,
      });
    sessionStorage.setItem(
      'finn:borrador:v1:/registrar/gasto',
      b({ comercio: 'Super Selectos', monto: '35.00' }),
    );
    sessionStorage.setItem('finn:borrador:v1:/cuentas/nueva', b({ nombre: 'Cuenta de ahorro' }));
  });
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  // ¿Aparece una hoja o un panel? Se espera a ver un diálogo o a salir de la pantalla.
  const dialogo = page.getByRole('dialog');
  const resultado = await Promise.race([
    dialogo.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'dialogo'),
    page.waitForURL('**/ingresar**', { timeout: 8000 }).then(() => 'ingresar'),
  ]).catch(() => 'nada');
  await quieta(page);
  const quedan = await page.evaluate(
    () => Object.keys(sessionStorage).filter((k) => k.startsWith('finn:borrador:v1:')).length,
  );
  writeFileSync(
    join(SALIDA, 'medidas', `_salir-con-borradores__${info.project.name}.txt`),
    JSON.stringify(
      { trasTocarSalirConDosBorradores: resultado, url: page.url(), borradoresQueQuedan: quedan },
      null,
      1,
    ),
  );
  await capturar(page, info, 'salir__con-borradores', {
    ruta: '/ajustes/seguridad',
    comp: F_SESIONES,
    ref: `${E3}/cambios-sin-enviar`,
    nota: 'Lo que se ve después de tocar «Salir» con dos borradores en la pestaña.',
  });
});

// ── Panel de notificaciones desde la campana ────────────────────────────────────────────────────────────────────────

const PANEL = {
  ruta: '/ (campana → @superpuesto/(.)notificaciones)',
  comp: F_NOTIF,
  url: '/',
} as const;

async function abrirPanel(page: Page): Promise<void> {
  await campana(page).click();
  await expect(page.getByRole('dialog', { name: 'Notificaciones' })).toBeVisible();
  await quieta(page);
}

caso({
  ...A7N,
  ...PANEL,
  id: 'notificaciones-panel__con-sin-leer',
  ref: `${K1}__notificaciones-abiertas-n7`,
  nota: 'También K5-Nuevos__panel-de-notificaciones. Dos sin leer y tres anteriores, como en la referencia.',
  pasos: abrirPanel,
});

caso({
  ...A7_LEIDAS,
  ...PANEL,
  id: 'notificaciones-panel__todo-leido',
  ref: `${COMP}/K5-Nuevos__panel-de-notificaciones__claro`,
  nota: 'Todo leído: check en --positivo-texto + «Todo leído»; sin contador en la campana.',
  pasos: abrirPanel,
});

caso({
  ...A7_SIN,
  ...PANEL,
  id: 'notificaciones-panel__vacio',
  ref: '02-referencias/entrega-2/pantallas/10-notificaciones/vacia',
  nota: 'Sin notificaciones. La referencia es la de la página completa: el panel vacío no tiene PNG propio.',
  pasos: abrirPanel,
});

caso({
  ...A7N,
  ...PANEL,
  id: 'notificaciones-panel__marcado',
  ref: `${COMP}/K5-Nuevos__panel-de-notificaciones__claro`,
  nota: 'Después de «Marcar todo como leído» dentro del panel: «Todo leído» y los contadores desaparecen.',
  soloLectura: false,
  pasos: async (page) => {
    await abrirPanel(page);
    await page.getByRole('button', { name: 'Marcar todo como leído' }).click();
    await expect(page.getByText('Todo leído')).toBeVisible();
  },
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// GLO · estados globales
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

caso({
  ...A7N,
  id: 'estado__sin-conexion-en-la-app',
  ruta: '/',
  comp: F_MARCO,
  ref: `${E14}/sin-conexion-en-la-app`,
  nota: 'DECISIONES entrega 3: el aviso global dice solo «Estás sin conexión».',
  pasos: async (page) => {
    await page.context().setOffline(true);
    await expect(page.locator('[data-sin-conexion]')).toBeVisible();
  },
});

caso({
  ...A7N,
  id: 'estado__sin-conexion-navegacion-bloqueada',
  ruta: '/',
  comp: F_MARCO,
  ref: 'SIN DISEÑO',
  nota: 'Sin conexión y después de tocar un enlace: el aviso cambia a «Estás sin conexión. No se puede abrir esta pantalla.».',
  pasos: async (page, info) => {
    await page.context().setOffline(true);
    await expect(page.locator('[data-sin-conexion]')).toBeVisible();
    const destino = esTelefono(info)
      ? page.locator('nav[data-marco-barra]').getByRole('link', { name: 'Presupuesto' })
      : page.locator('aside').getByRole('link', { name: 'Presupuesto' });
    await destino.click();
    await expect(page.locator('[data-sin-conexion]')).toContainText('No se puede abrir');
  },
});

caso({
  id: 'estado__sin-conexion-pagina',
  ruta: '/sin-conexion',
  comp: 'apps/web/src/app/sin-conexion/page.tsx',
  ref: `${E14}/sin-conexion-pagina`,
  sesion: false,
});

caso({
  id: 'estado__sin-conexion-pagina-con-borrador',
  ruta: '/sin-conexion',
  comp: 'apps/web/src/componentes/marco/reintentar-sin-conexion.tsx',
  ref: 'SIN DISEÑO',
  nota: 'Con un borrador en la pestaña la página agrega «Lo que estabas registrando sigue guardado en esta pestaña.».',
  sesion: false,
  antes: async (page) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'finn:borrador:v1:/registrar/gasto',
        JSON.stringify({
          version: 1,
          guardadoEn: '2026-10-15T09:41:00-06:00',
          campos: {},
          id: null,
          revisionAlAbrir: null,
        }),
      );
    });
  },
});

caso({
  ...A7N,
  id: 'estado__404-fuera',
  ruta: '/(una ruta que no existe)',
  comp: 'apps/web/src/app/not-found.tsx',
  ref: `${E14}/no-encontrado`,
  nota: 'Una URL que no es ninguna ruta: la app la muestra sin el marco.',
  url: '/esta-ruta-no-existe',
});

caso({
  ...A7N,
  id: 'estado__404-dentro',
  ruta: '/cuentas/[cuentaId] (id que no existe)',
  comp: 'apps/web/src/app/(finn)/not-found.tsx',
  ref: `${E14}/no-encontrado`,
  nota: '`notFound()` de una consulta: dentro del marco, con el enlace a la sección.',
  url: '/cuentas/00000000-0000-4000-8000-000000000001',
});

caso({
  ...A7N,
  id: 'estado__error',
  ruta: '/pruebas/estados/error',
  comp: 'apps/web/src/componentes/navegacion/error-de-pantalla.tsx',
  ref: `${E14}/error-de-pantalla`,
  nota: 'Página de desarrollo que lanza un error de consulta con referencia E-PRU-213.',
});

caso({
  ...A7N,
  id: 'estado__error-copiada',
  ruta: '/pruebas/estados/error',
  comp: 'apps/web/src/componentes/navegacion/error-de-pantalla.tsx',
  ref: `${E14}/error-de-pantalla`,
  nota: 'Después de tocar «Copiar referencia».',
  pasos: async (page) => {
    await page
      .context()
      .grantPermissions(['clipboard-write'])
      .catch(() => undefined);
    await page.getByRole('button', { name: 'Copiar referencia' }).click();
    await page.waitForTimeout(300);
  },
});

test('estado__cargando', async ({ page, context, baseURL }, info) => {
  // El primer envío del documento trae el marco y el `loading.tsx`; el resto llega después por el mismo flujo. Para verlo
  // quieto se corta el documento antes del primer bloque diferido y no se ejecuta JS (no hay hidratación que lo reemplace).
  await entrar(context, baseURL);
  await page.route('**/*', async (ruta) => {
    const p = ruta.request();
    if (p.resourceType() === 'script') return ruta.abort();
    if (p.isNavigationRequest() && new URL(p.url()).pathname === '/presupuesto') {
      const real = await ruta.fetch();
      const html = await real.text();
      const corte = html.search(/<div hidden id="S:0"|<template id="P:|<script>\$RC|<script>\$RS/);
      const cuerpo = (corte > 0 ? html.slice(0, corte) : html).replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/g,
        '',
      );
      return ruta.fulfill({ response: real, body: `${cuerpo}</body></html>` });
    }
    return ruta.fallback();
  });
  await page.goto('/presupuesto');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await capturar(
    page,
    info,
    'estado__cargando',
    {
      ruta: '/presupuesto (primer envío)',
      comp: 'apps/web/src/app/(finn)/presupuesto/loading.tsx',
      ref: `${COMP}/K2-Base__esqueleto-de-carga__claro`,
      nota: 'Documento cortado antes del primer bloque diferido y sin JS: lo que se pinta mientras carga.',
    },
    { carga: true },
  );
});

test('estado__cargando-generico', async ({ page, context, baseURL }, info) => {
  await entrar(context, baseURL);
  await page.route('**/*', async (ruta) => {
    const p = ruta.request();
    if (p.resourceType() === 'script') return ruta.abort();
    if (p.isNavigationRequest() && new URL(p.url()).pathname === '/pruebas/estados/carga') {
      const real = await ruta.fetch();
      const html = await real.text();
      const corte = html.search(/<div hidden id="S:0"|<template id="P:|<script>\$RC|<script>\$RS/);
      const cuerpo = (corte > 0 ? html.slice(0, corte) : html).replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/g,
        '',
      );
      return ruta.fulfill({ response: real, body: `${cuerpo}</body></html>` });
    }
    return ruta.fallback();
  });
  await page.goto('/pruebas/estados/carga');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await capturar(
    page,
    info,
    'estado__cargando-generico',
    {
      ruta: '/pruebas/estados/carga (primer envío)',
      comp: 'apps/web/src/app/(finn)/loading.tsx',
      ref: `${COMP}/K2-Base__esqueleto-de-carga__claro`,
      nota: 'El `loading.tsx` genérico de (finn): tres bloques. Documento cortado y sin JS.',
    },
    { carga: true },
  );
});

caso({
  ...A7N,
  id: 'estado__navegacion-en-curso',
  ruta: '/ → /presupuesto (navegación retenida)',
  comp: F_MARCO,
  ref: `${COMP}/K2-Base__navegacion-en-curso__claro`,
  nota: 'Se toca la pestaña Presupuesto con su respuesta retenida: indicador global y enlace ocupado.',
  url: '/',
  carga: true,
  pasos: async (page, info) => {
    await page.waitForTimeout(1200); // que termine el prefetch de los enlaces visibles
    await page.route(
      (url) => url.pathname === '/presupuesto',
      async (ruta) => {
        const h = ruta.request().headers();
        if (h['rsc'] === '1' && h['next-router-prefetch'] === undefined) return; // retenida: nunca responde
        await ruta.fallback();
      },
    );
    const destino = esTelefono(info)
      ? page.locator('nav[data-marco-barra]').getByRole('link', { name: 'Presupuesto' })
      : page.locator('aside').getByRole('link', { name: 'Presupuesto' });
    await destino.click();
    await expect(page.getByRole('progressbar', { name: 'Navegando' })).toBeVisible();
  },
});

test('estado__actualizacion-pwa', async ({ page, context, baseURL }, info) => {
  // El aviso de versión nueva (05 §7.6) aparece cuando hay un service worker instalado esperando. El arnés bloquea los
  // service workers, así que se sustituye `navigator.serviceWorker` por uno que dice tener una versión en espera.
  await entrar(context, baseURL);
  await page.addInitScript(() => {
    const espera = { postMessage() {}, state: 'installed', addEventListener() {} };
    const registro = {
      waiting: espera,
      installing: null,
      active: espera,
      addEventListener() {},
      removeEventListener() {},
      pushManager: { getSubscription: () => Promise.resolve(null) },
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: espera,
        ready: Promise.resolve(registro),
        register: () => Promise.resolve(registro),
        getRegistration: () => Promise.resolve(registro),
        getRegistrations: () => Promise.resolve([registro]),
        addEventListener() {},
        removeEventListener() {},
      },
    });
  });
  await page.goto('/');
  await quieta(page);
  await expect(page.getByRole('button', { name: 'Recargar' })).toBeVisible();
  await capturar(page, info, 'estado__actualizacion-pwa', {
    ruta: '/ (cualquier pantalla)',
    comp: 'apps/web/src/componentes/marco/registro-service-worker.tsx',
    ref: `${COMP}/K4-Dominio-B__avisos-globales__claro`,
    nota: 'Aviso global «Hay una versión nueva.» con «Recargar» (K4, avisos globales). Service worker simulado (el arnés los bloquea).',
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// GLO · comportamiento de las hojas (accesibilidad y movimiento): no captura, deja medidas en `_hojas__<variante>.txt`
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

test('marco__hojas-comportamiento', async ({ page, context, baseURL }, info) => {
  await entrar(context, baseURL);
  await page.goto('/');
  await quieta(page);
  const r: Record<string, unknown> = {};
  const medirDialogo = () =>
    page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]') as HTMLElement | null;
      const velo = document.querySelector('[data-testid="velo"]') as HTMLElement | null;
      const nav = document.querySelector('nav[data-marco-barra]') as HTMLElement | null;
      if (d === null) return null;
      const s = getComputedStyle(d);
      const sv = velo === null ? null : getComputedStyle(velo);
      const caja = (e: Element | null) => {
        if (e === null) return null;
        const b = e.getBoundingClientRect();
        return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
      };
      const filas = [...d.querySelectorAll('li')].slice(0, 8).map((li) => {
        const sl = getComputedStyle(li);
        return {
          t: (li.textContent ?? '').trim().slice(0, 22),
          animacion: `${sl.animationName} ${sl.animationDuration} retraso ${sl.animationDelay}`,
          alto: Math.round(li.getBoundingClientRect().height),
        };
      });
      const titulo = d.querySelector('h1, h2, [id^="radix-"]') as HTMLElement | null;
      const st = titulo === null ? null : getComputedStyle(titulo);
      return {
        rol: d.getAttribute('role'),
        ariaModal: d.getAttribute('aria-modal'),
        ariaLabelledby: d.getAttribute('aria-labelledby') !== null,
        ariaDescribedby: d.getAttribute('aria-describedby'),
        caja: caja(d),
        barraInferior: caja(nav),
        zHoja: s.zIndex,
        zVelo: sv?.zIndex,
        zBarraInferior: nav === null ? null : getComputedStyle(nav).zIndex,
        fondo: s.backgroundColor,
        radio: `${s.borderTopLeftRadius} ${s.borderTopRightRadius} ${s.borderBottomRightRadius} ${s.borderBottomLeftRadius}`,
        sombra: s.boxShadow,
        relleno: s.padding,
        altoMaximo: s.maxHeight,
        animacionHoja: `${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`,
        animacionVelo:
          sv === null
            ? null
            : `${sv.animationName} ${sv.animationDuration} ${sv.animationTimingFunction}`,
        fondoVelo: sv?.backgroundColor,
        titulo:
          titulo === null
            ? null
            : `${titulo.textContent} · ${st?.fontFamily.split(',')[0]} ${st?.fontSize}/${st?.lineHeight} ${st?.fontWeight}`,
        filas,
        focoAlAbrir:
          document.activeElement?.getAttribute('aria-label') ??
          (document.activeElement?.textContent ?? '').trim().slice(0, 30),
      };
    });
  const recorrerConTab = async (veces: number) => {
    let fuera = false;
    const pasos: string[] = [];
    for (let i = 0; i < veces; i += 1) {
      await page.keyboard.press('Tab');
      const x = await page.evaluate(() => {
        const a = document.activeElement;
        return {
          dentro:
            a?.closest('[role="dialog"]') !== null && a?.closest('[role="dialog"]') !== undefined,
          n: a?.getAttribute('aria-label') ?? (a?.textContent ?? '').trim().slice(0, 24),
        };
      });
      pasos.push(x.n);
      if (!x.dentro) fuera = true;
    }
    return { elFocoSaleDelDialogo: fuera, pasos };
  };

  if (esTelefono(info)) {
    const boton = page.getByRole('button', { name: 'Más secciones' });
    await boton.click();
    const hoja = page.getByRole('dialog', { name: 'Más secciones' });
    await hoja.waitFor();
    r.masSecciones = await medirDialogo();
    await quieta(page);
    r.masSeccionesTab = await recorrerConTab(12);
    await page.keyboard.press('Escape');
    const cerro = await hoja
      .waitFor({ state: 'detached', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    r.masSeccionesEscape = {
      cierra: cerro,
      elFocoVuelveA: await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
      ),
    };
    await boton.click();
    await hoja.waitFor();
    await quieta(page);
    await page.mouse.click(195, 90); // sobre el velo, arriba de la hoja
    r.masSeccionesVelo = {
      tocarElVeloCierra: await hoja
        .waitFor({ state: 'detached', timeout: 3000 })
        .then(() => true)
        .catch(() => false),
    };
  }

  await campana(page).click();
  const panel = page.getByRole('dialog', { name: 'Notificaciones' });
  await panel.waitFor();
  r.panel = await medirDialogo();
  await quieta(page);
  r.panelUrl = new URL(page.url()).pathname;
  r.panelTab = await recorrerConTab(10);
  await page.keyboard.press('Escape');
  r.panelEscape = {
    cierra: await panel
      .waitFor({ state: 'detached', timeout: 3000 })
      .then(() => true)
      .catch(() => false),
    urlDespues: new URL(page.url()).pathname,
    elFocoVuelveA: await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
    ),
  };
  writeFileSync(
    join(SALIDA, 'medidas', `_hojas__${info.project.name}.txt`),
    JSON.stringify(r, null, 1),
  );
});
