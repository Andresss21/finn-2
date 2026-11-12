// `/ajustes/webhook/token` (05 §2.11, FT-03): generar el token del webhook (OPT-01). Flujo corto: desde Ajustes se abre superpuesto.
import type { Metadata } from 'next';
import { LectorToken } from '../../../../../flujos/ajustes-webhook-token/lector';
import { ajustesWebhook } from '../../../../../textos/ajustes-webhook';

export const metadata: Metadata = { title: ajustesWebhook.hoja.tituloCambiar };

export default function PaginaWebhookToken() {
  return <LectorToken />;
}
