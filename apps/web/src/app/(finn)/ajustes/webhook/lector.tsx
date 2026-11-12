// Lector de `/ajustes/webhook` (05 §4.1): `ajustes()` (04 §6.11) trae si hay token (`webhook`), nunca el token ni su hash.
// La variante del cuerpo de `POST /api/sms` la fija `FINN_WEBHOOK_FORMATO` (BE-61): se le pasa al panel para las instrucciones.
// Pantalla [S] (CH-E5-3): `main` con su `h1` y la flecha «Volver a Ajustes» en computadora; el marco pone la barra, la campana y la
// barra inferior (E5-20).
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { VolverEnTitulo } from '../../../../componentes/navegacion/volver-en-titulo';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { ajustesWebhook as t } from '../../../../textos/ajustes-webhook';
import { navegacion } from '../../../../textos/navegacion';
import { PanelConexion } from './conexion';

export async function LectorWebhook() {
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <div className="-ml-2 flex items-center gap-1">
        <VolverEnTitulo
          href="/ajustes"
          etiqueta={navegacion.volverA(navegacion.secciones.ajustes)}
        />
        <h1 className="min-w-0 flex-1 text-titulo-pantalla">{t.titulo}</h1>
      </div>
      <PanelConexion
        configurado={dto.webhook.configurado}
        {...(dto.webhook.rotadoEn === undefined ? {} : { rotadoEn: dto.webhook.rotadoEn })}
        {...(dto.webhook.ultimoSmsEn === undefined ? {} : { ultimoSmsEn: dto.webhook.ultimoSmsEn })}
        hoy={dto.hoy}
        formato={process.env['FINN_WEBHOOK_FORMATO'] === 'texto' ? 'texto' : 'json'}
      />
    </main>
  );
}
