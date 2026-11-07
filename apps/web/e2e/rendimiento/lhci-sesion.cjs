// Inicio de sesión de Lighthouse CI (05 §13.4): el puppeteerScript de lighthouserc.json. Hace lo mismo que
// e2e/configuracion/inicio-sesion.setup.ts, con el usuario de prueba que crea tools/pruebas/e2e/usuario.ts.
// TA-550: cada paso espera por estado con `waitForSelector`, que sigue a través de una navegación; `waitForNavigation` después
// de Enter perdía la carrera con la navegación del cliente y el `type` siguiente moría con «Execution context was destroyed».
const { TOTP } = require('otpauth');

const variable = (n) => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: la crea tools/pruebas/e2e/usuario.ts al arrancar`);
  return v;
};

const HIDRATADO = 'html[data-hidratado="si"]';

module.exports = async (browser, { url }) => {
  const page = await browser.newPage();
  await page.goto(new URL('/ingresar', url).href);
  if (new URL(page.url()).pathname !== '/ingresar') return page.close(); // ya hay sesión
  await page.waitForSelector(HIDRATADO);
  await page.type('[autocomplete="username"]', variable('E2E_EMAIL'));
  await page.type('[autocomplete="current-password"]', variable('E2E_CLAVE'));
  await page.keyboard.press('Enter');
  await page.waitForSelector('[autocomplete="one-time-code"]');
  await page.waitForSelector(HIDRATADO);
  const codigo = new TOTP({ secret: variable('E2E_TOTP_SECRETO') }).generate();
  await page.type('[autocomplete="one-time-code"]', codigo);
  await page.keyboard.press('Enter');
  // Con AAL2 se sale de /ingresar: el marco de `(finn)` hidratado ya no tiene el campo del código
  await page.waitForFunction(() => !globalThis.location.pathname.startsWith('/ingresar'));
  await page.waitForSelector(HIDRATADO);
  await page.close();
};
