// Primeros pasos de Inicio (FT-04; 06 §3.15, CF-18; entrega 2 del diseño, bloque 15): sin estado ni cálculo, un paso está hecho porque
// su hecho existe (`inicio().primerosPasos`); hecho, deja de ser enlace y se llama "Hecho: {paso}". "Ocultar por ahora" (CA-04.11) es
// una preferencia del dispositivo: se ofrece con al menos una cuenta y, oculto, el bloque no se dibuja.
'use client';
import type { InicioSel } from '@finn/dominio/selectores';
import { Icono, type NombreIcono } from '../../componentes/base/icono';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { usePrimerosPasosOcultos } from '../../cliente/usePrimerosPasosOcultos';
import { primerosPasos as t } from '../../textos/primeros-pasos';

const PASOS = [
  ['cuenta', '/cuentas/nueva', 'wallet'],
  ['categorias', '/presupuesto/estructura', 'list'],
  ['sms', '/ajustes/webhook', 'sms'],
] as const satisfies readonly (readonly [string, string, NombreIcono])[];

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const FILA = `grid min-h-16 grid-cols-[40px_minmax(0,1fr)_16px] items-center gap-3 px-4 py-2 ${FOCO}`;
const CIRCULO = 'flex size-10 flex-none items-center justify-center rounded-full';
const CIRCULO_HECHO = `${CIRCULO} bg-positivo-fondo text-positivo-texto`;
const CIRCULO_PENDIENTE = `${CIRCULO} bg-accion-tonal text-accion`;
const FILA_PASO = `${FILA} relative`;
const OCULTAR = `inline-flex min-h-11 cursor-pointer items-center text-etiqueta font-bold text-enlace ${FOCO}`;

export function PrimerosPasosDeInicio({
  pasos,
}: {
  readonly pasos: NonNullable<InicioSel['primerosPasos']>;
}) {
  const { oculto, ocultar } = usePrimerosPasosOcultos();
  if (oculto) return null;
  const hechos = PASOS.filter(([paso]) => pasos[paso]).length;
  return (
    <section aria-labelledby="primeros-pasos" className="flex flex-col gap-2">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 id="primeros-pasos" className="text-titulo-seccion">
            {t.titulo}
          </h2>
          <span aria-hidden="true" className="text-titulo-seccion">
            {t.progreso(hechos)}
          </span>
        </div>
        {pasos.cuenta ? (
          <button type="button" onClick={ocultar} className={OCULTAR}>
            {t.ocultar}
          </button>
        ) : null}
      </div>
      <ol className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
        {PASOS.map(([paso, enlace, icono]) => (
          <li key={paso}>
            {pasos[paso] ? (
              <div className={FILA}>
                <span aria-hidden="true" className={CIRCULO_HECHO}>
                  <Icono nombre="positivo" tamano={20} />
                </span>
                <span className="sr-only">{t.hecho(t.pasos[paso])}</span>
                <span aria-hidden="true" className="flex flex-col gap-0.5">
                  <span className="font-semibold text-texto-secundario line-through">
                    {t.pasos[paso]}
                  </span>
                  <span className="text-cuerpo-pequeno text-positivo-texto">{t.hechoCorto}</span>
                </span>
              </div>
            ) : (
              // Fila entera tocable sin meter el subtítulo en el nombre del enlace (que es el del paso): el ::after del enlace la cubre.
              <div className={FILA_PASO}>
                <span aria-hidden="true" className={CIRCULO_PENDIENTE}>
                  <Icono nombre={icono} tamano={20} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <EnlaceFinn
                    href={enlace}
                    className="-my-2.5 flex min-h-11 items-center font-semibold text-texto no-underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-foco"
                  >
                    {t.pasos[paso]}
                  </EnlaceFinn>
                  <span className="text-cuerpo-pequeno text-texto-secundario">
                    {t.detalles[paso]}
                  </span>
                </span>
                <span aria-hidden="true" className="text-accion">
                  <Icono nombre="chevR" tamano={16} />
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
