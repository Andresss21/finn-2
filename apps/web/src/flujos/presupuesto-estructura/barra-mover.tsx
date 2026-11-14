'use client';
// [CH-272] La barra «Mover» (C-46; ESTRUCTURA-Y-COLAPSO §1.4): la vía sin arrastre para teclado, lector de pantalla y quien no
// puede arrastrar (WCAG 2.5.7). Subir y Bajar cruzan de grupo; en el primer o el último lugar quedan con `aria-disabled` (no
// `disabled`), para que el foco no se pierda al llegar al extremo. Cada botón lleva `data-foco`: la lista lo vuelve a enfocar
// después de mover, aunque la fila haya cambiado de grupo.
import { cn } from '../../components/ui/utils';
import { Icono } from '../../componentes/base/icono';
import { estructura as t } from '../../textos/estructura';

const BOTON =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-superficie px-3.5 text-cuerpo-pequeno font-bold text-accion shadow-[0_0_0_1px_var(--borde-sutil)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco aria-disabled:bg-transparent aria-disabled:text-texto-deshabilitado aria-disabled:shadow-none aria-expanded:bg-accion aria-expanded:text-texto-sobre-accion';

export interface PropsBarraMover {
  readonly id: string;
  readonly nombre: string;
  readonly esGrupo: boolean;
  /** «{categoría} es la tercera de Casa.» o «Ahorro es el quinto grupo.» */
  readonly estado: string;
  readonly subir: (() => void) | undefined;
  readonly bajar: (() => void) | undefined;
  readonly listo: () => void;
  /** Solo categorías: «Otro grupo» y los grupos a los que se puede llevar, al final. */
  readonly otro?: {
    readonly abierto: boolean;
    readonly alternar: () => void;
    readonly grupos: readonly { readonly id: string; readonly nombre: string }[];
    readonly elegir: (grupoId: string) => void;
  };
}

export function BarraMover({
  id,
  nombre,
  esGrupo,
  estado,
  subir,
  bajar,
  listo,
  otro,
}: PropsBarraMover) {
  const flecha = (paso: 'subir' | 'bajar', accion: (() => void) | undefined) => (
    <button
      type="button"
      className={BOTON}
      data-foco={`${paso}-${id}`}
      aria-label={(paso === 'subir' ? t.subirA : t.bajarA)(nombre)}
      {...(accion === undefined ? { 'aria-disabled': true } : {})}
      onClick={accion}
    >
      <Icono nombre="chevD" tamano={18} className={paso === 'subir' ? 'rotate-180' : ''} />
      {paso === 'subir' ? t.subir : t.bajar}
    </button>
  );
  return (
    <div
      role="group"
      aria-label={esGrupo ? t.barraMoverGrupo : t.barraMover}
      className={cn(
        'fz-aparece flex flex-col gap-2.5 bg-accion-tonal px-3 pt-2.5 pb-3',
        esGrupo ? 'rounded-[14px]' : 'border-b border-borde-sutil',
      )}
    >
      <span role="status" className="text-cuerpo-pequeno font-semibold text-texto">
        {estado}
      </span>
      <div className="flex flex-wrap gap-2">
        {flecha('subir', subir)}
        {flecha('bajar', bajar)}
        {otro === undefined ? null : (
          <button
            type="button"
            className={BOTON}
            data-foco={`otro-${id}`}
            aria-expanded={otro.abierto}
            onClick={otro.alternar}
          >
            {t.otroGrupo}
          </button>
        )}
        <button type="button" className={BOTON} onClick={listo}>
          {t.listo}
        </button>
      </div>
      {otro?.abierto === true ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] text-texto-secundario">{t.llevarlaA}</span>
          <div className="flex flex-wrap gap-2">
            {otro.grupos.map((g) => (
              <button
                key={g.id}
                type="button"
                className={BOTON}
                onClick={() => {
                  otro.elegir(g.id);
                }}
              >
                {g.nombre}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
