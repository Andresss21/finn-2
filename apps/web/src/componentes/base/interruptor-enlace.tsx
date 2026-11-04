// Interruptor de un estado que vive en la URL (K2, 06-identidad-visual): un enlace de servidor con el aspecto de un
// interruptor y `role="switch"`. Cada estado tiene su dirección y funciona sin hidratar. La etiqueta no cambia con el
// estado: lo dice `aria-checked`.
import { EnlaceFinn } from '../navegacion/enlace-finn';
import { Icono } from './icono';

export function InterruptorEnlace({
  href,
  activo,
  etiqueta,
}: {
  readonly href: string;
  readonly activo: boolean;
  readonly etiqueta: string;
}) {
  return (
    <EnlaceFinn
      href={href}
      replace
      role="switch"
      aria-checked={activo}
      className="flex min-h-11 items-center gap-2.5 rounded-control focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
    >
      <span
        aria-hidden="true"
        className={[
          'relative h-[26px] w-11 flex-none rounded-pastilla',
          activo ? 'bg-accion' : 'bg-borde-control',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-[3px] flex size-5 items-center justify-center rounded-pastilla bg-superficie text-accion',
            activo ? 'left-[21px]' : 'left-[3px]',
          ].join(' ')}
        >
          {activo ? <Icono nombre="check" tamano={12} /> : null}
        </span>
      </span>
      <span className="text-cuerpo text-texto">{etiqueta}</span>
    </EnlaceFinn>
  );
}
