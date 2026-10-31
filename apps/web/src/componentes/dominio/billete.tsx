// Billete "Listo para asignar" y su franja (05 §10.8.1, CF-13; 06-identidad-visual 2.8). Solo presenta: el DTO trae
// los montos y el signo (PF-3). Tres señales en cero y negativo: color, glifo y texto.
import type { Centavos } from '@finn/dominio/valores';
import { dominio } from '../../textos/dominio';
import { Icono } from '../base/icono';
import { Monto } from './monto';

interface PropsBillete {
  readonly lpa: Centavos;
  readonly enCamino: Centavos;
  readonly lpaNegativo: boolean;
  readonly variante: 'billete' | 'franja';
  /** Enlace principal ("Asignar $312.40"); el texto lo arma quien lo pasa. */
  readonly accion?: { readonly href: string; readonly texto: string };
}

const GRABADO =
  'pointer-events-none absolute inset-0 ' +
  'bg-[repeating-radial-gradient(circle_at_0_0,var(--marca-grabado)_0_7px,transparent_7px_15px),repeating-radial-gradient(circle_at_100%_100%,var(--marca-grabado)_0_9px,transparent_9px_19px)]';

function EstadoLpa({ lpa, lpaNegativo }: Pick<PropsBillete, 'lpa' | 'lpaNegativo'>) {
  if (lpaNegativo) {
    return (
      <p data-estado="problema" className="flex items-center gap-2 text-etiqueta font-semibold">
        <Icono nombre="problema" tamano={16} />
        {dominio.asignasteDeMas}
      </p>
    );
  }
  if (lpa === 0) {
    return (
      <p data-estado="cero" className="flex items-center gap-2 text-etiqueta font-semibold">
        <Icono nombre="cero" tamano={16} />
        {dominio.todoAsignado}
      </p>
    );
  }
  return null;
}

export function Billete({ lpa, enCamino, lpaNegativo, variante, accion }: PropsBillete) {
  const franja = variante === 'franja';
  const estadoLpa = lpaNegativo ? 'negativo' : lpa === 0 ? 'cero' : 'positivo';
  return (
    <section
      data-variante={variante}
      data-estado-lpa={estadoLpa}
      aria-label={dominio.listoParaAsignar}
      className={[
        'relative overflow-hidden rounded-contenedor bg-marca text-texto-sobre-marca',
        franja ? 'flex items-center gap-3 px-3.5 py-3' : 'px-5 pb-5 pt-5.5',
      ].join(' ')}
    >
      <div aria-hidden="true" className={GRABADO} />
      <div className="relative min-w-0 flex-1">
        <p className="text-rotulo opacity-80">{dominio.listoParaAsignar}</p>
        <p>
          <Monto centavos={lpa} rol={franja ? 'cifra' : 'cifra-principal'} />
        </p>
        <EstadoLpa lpa={lpa} lpaNegativo={lpaNegativo} />
        {enCamino > 0 ? (
          <p className="flex items-center gap-2 text-cuerpo-pequeno">
            <Icono nombre="informacion" tamano={16} />
            <span>{dominio.enCamino}</span>
            <Monto centavos={enCamino} />
          </p>
        ) : null}
      </div>
      {accion === undefined ? null : (
        <a
          href={accion.href}
          className={[
            'relative inline-flex items-center justify-center rounded-control bg-accion font-bold text-texto-sobre-accion',
            franja ? 'min-h-11 shrink-0 px-4' : 'mt-3 min-h-13 w-full',
          ].join(' ')}
        >
          {accion.texto}
        </a>
      )}
    </section>
  );
}
