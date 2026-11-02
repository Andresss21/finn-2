// `endpointCorto` (04 §6.11, [CH-73]): el dominio del servicio de push y los últimos 8 caracteres del endpoint; nunca las
// claves. Pura, para que el servidor (`ajustes()`) y la web (comparar con `getSubscription()`) usen la misma función.
const SERVIDOR = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i;

export function endpointCorto(endpoint: string): string {
  const host = SERVIDOR.exec(endpoint)?.[1]?.toLowerCase() ?? '';
  return `${host}…${endpoint.slice(-8)}`;
}
