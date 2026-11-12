// Lector de `/ajustes/webhook/token` (05 §2.11, §4.1): `ajustes()` (04 §6.11) dice si ya hay token (`webhook.configurado`); nunca
// trae el token ni su hash. La acción es la de OPT-01, sin cambios.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { rotarTokenWebhook } from '../../servidor/acciones/ajustes';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { PaginaToken } from './pagina';

export async function LectorToken({ superpuesto = false }: { readonly superpuesto?: boolean }) {
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  return (
    <PaginaToken
      configurado={dto.webhook.configurado}
      rotar={rotarTokenWebhook}
      superpuesto={superpuesto}
    />
  );
}
