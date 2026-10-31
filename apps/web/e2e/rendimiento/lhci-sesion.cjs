// Inicio de sesión de Lighthouse CI (05 §13.4): el puppeteerScript de lighthouserc.json. Hace lo mismo que
// e2e/configuracion/inicio-sesion.setup.ts, con el usuario de prueba que crea tools/pruebas/e2e/usuario.ts.
const { TOTP } = require('otpauth');

const variable = (n) => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: la crea tools/pruebas/e2e/usuario.ts al arrancar`);
  return v;
};

module.exports = async (browser, { url }) => {
  const page = await browser.newPage();
  await page.goto(new URL('/ingresar', url).href);
  if (new URL(page.url()).pathname !== '/ingresar') return page.close(); // ya hay sesión
  await page.waitForSelector('html[data-hidratado="si"]');
  await page.type('[autocomplete="username"]', variable('E2E_EMAIL'));
  await page.type('[autocomplete="current-password"]', variable('E2E_CLAVE'));
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  const codigo = new TOTP({ secret: variable('E2E_TOTP_SECRETO') }).generate();
  await page.type('[autocomplete="one-time-code"]', codigo);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  await page.close();
};
