// `/ajustes/webhook` (05 §2.11, FT-03): generar o cambiar el token del webhook de MacroDroid (OPT-01).
import type { Metadata } from 'next';
import { LectorWebhook } from '../../../../flujos/ajustes-webhook/lector';
import { ajustesWebhook } from '../../../../textos/ajustes-webhook';

export const metadata: Metadata = { title: ajustesWebhook.titulo };

export default function PaginaWebhook() {
  return <LectorWebhook />;
}
