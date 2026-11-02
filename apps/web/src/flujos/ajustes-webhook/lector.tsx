// Lector de `/ajustes/webhook` (05 §4.1): `ajustes()` (04 §6.11) trae si hay token (`webhook`), nunca el token ni su hash.
// La variante del cuerpo de `POST /api/sms` la fija `FINN_WEBHOOK_FORMATO` (BE-61): se le pasa al flujo para las instrucciones.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { rotarTokenWebhook } from '../../servidor/acciones/ajustes';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { ConexionMacroDroid } from './pagina';

export async function LectorWebhook() {
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  return (
    <ConexionMacroDroid
      configurado={dto.webhook.configurado}
      {...(dto.webhook.rotadoEn === undefined ? {} : { rotadoEn: dto.webhook.rotadoEn })}
      rotar={rotarTokenWebhook}
      formato={process.env['FINN_WEBHOOK_FORMATO'] === 'texto' ? 'texto' : 'json'}
    />
  );
}
