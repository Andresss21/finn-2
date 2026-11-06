// El `RESPALDO_SECRET` del servidor de la E2E (FT-76): un valor de prueba, de 32 caracteres o más, que solo vale en la pila local.
// Lo comparten `playwright.config.ts` (lo pone en el entorno del servidor) y las pruebas que informan un respaldo por
// `POST /api/respaldo/[evento]` como lo haría GitHub Actions (04 §3.10).
export const SECRETO_RESPALDO_E2E = 'secreto-de-prueba-e2e-no-es-real-0123456789';
