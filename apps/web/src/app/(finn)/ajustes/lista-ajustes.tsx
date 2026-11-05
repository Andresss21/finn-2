// Lista de `/ajustes` (06 FT-72 a FT-77; export de diseño, pantalla 11 «Índice»): una tarjeta con una fila por sección: círculo
// de ícono de 40, el nombre y la flecha. Solo enlaza a las secciones que existen; cada una conserva el texto de su catálogo.
import { Icono, type NombreIcono } from '../../../componentes/base/icono';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { ajustesApariencia } from '../../../textos/ajustes-apariencia';
import { ajustesCiclo } from '../../../textos/ajustes-ciclo';
import { ajustesExportar } from '../../../textos/ajustes-exportar';
import { ajustesFormatos } from '../../../textos/ajustes-formatos';
import { ajustesWebhook } from '../../../textos/ajustes-webhook';
import { notificaciones } from '../../../textos/notificaciones';

const FILAS: readonly { href: string; icono: NombreIcono; texto: string }[] = [
  { href: '/ajustes/ciclo', icono: 'cal', texto: ajustesCiclo.enlace },
  { href: '/ajustes/webhook', icono: 'sms', texto: ajustesWebhook.titulo },
  { href: '/ajustes/formatos', icono: 'list', texto: ajustesFormatos.enlace },
  { href: '/ajustes/instituciones', icono: 'bank', texto: ajustesFormatos.instituciones },
  { href: '/ajustes/notificaciones', icono: 'bell', texto: notificaciones.enlace },
  { href: '/ajustes/exportar', icono: 'send', texto: ajustesExportar.titulo },
  { href: '/ajustes/apariencia', icono: 'gear', texto: ajustesApariencia.enlace },
];

export function ListaAjustes() {
  return (
    <ul
      data-rol="lista-ajustes"
      className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1"
    >
      {FILAS.map((f) => (
        <li key={f.href}>
          <EnlaceFinn
            href={f.href}
            className="grid min-h-14 grid-cols-[40px_minmax(0,1fr)_16px] items-center gap-3 px-4 py-3 no-underline"
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto-secundario"
            >
              <Icono nombre={f.icono} tamano={20} />
            </span>
            <span className="text-cuerpo font-semibold text-texto">{f.texto}</span>
            <Icono nombre="chevR" tamano={16} className="text-texto-secundario" />
          </EnlaceFinn>
        </li>
      ))}
    </ul>
  );
}
