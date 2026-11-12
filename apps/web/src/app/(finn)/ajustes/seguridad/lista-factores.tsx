// La lista de factores de `/ajustes/seguridad` (FT-74, 05 §9.6): nombre, fecha de alta y estado de cada uno, con «Quitar»; los
// sin verificar dicen «Inscripción sin terminar». Es de servidor: la lee `estadoSeguridad()` (CP-4) en su propio `Suspense`.
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Icono } from '../../../../componentes/base/icono';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearInstante } from '../../../../formato/instante-texto';
import { autenticacion } from '../../../../textos/autenticacion';
import { seguridad as t } from '../../../../textos/seguridad';

export interface FactorEnLista {
  readonly id: string;
  readonly nombre: string | null;
  readonly creadoEn: string;
  readonly estado: 'verificado' | 'sin_verificar';
}

const SIN_HORA = /^(\d{2}\/\d{2}\/\d{4})/;
const fechaDeAlta = (iso: string): string => SIN_HORA.exec(formatearInstante(iso))?.[1] ?? '';

export function ListaFactores({ factores }: { readonly factores: readonly FactorEnLista[] }) {
  // Con un solo factor verificado no hay flujo de quitar (AJU-14, AJU-15): el aviso lo explica y el botón agrega otro (04 §12.2)
  const unico = factores.filter((f) => f.estado === 'verificado').length < 2;
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="titulo-factores">
      <h2 id="titulo-factores" className="text-titulo-seccion">
        {t.factores}
      </h2>
      <ul
        data-rol="lista-factores"
        className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1"
      >
        {factores.map((f) => {
          const nombre = f.nombre ?? t.sinNombre;
          return (
            <li
              key={f.id}
              data-factor={f.id}
              className="grid min-h-14 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto-secundario"
              >
                <Icono nombre="lock" tamano={20} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-cuerpo font-semibold">{nombre}</span>
                <span className="text-cuerpo-pequeno text-texto-secundario">
                  {f.estado === 'verificado'
                    ? `${t.alta(fechaDeAlta(f.creadoEn))} · ${t.verificado}`
                    : t.sinTerminar}
                </span>
              </span>
              {unico && f.estado === 'verificado' ? (
                <span />
              ) : (
                <EnlaceFinn
                  href={`/ajustes/seguridad/factores/${f.id}/quitar`}
                  aria-label={`${t.quitar} ${nombre}`}
                  className="inline-flex min-h-11 items-center px-2 text-etiqueta font-bold text-peligro"
                >
                  {t.quitar}
                </EnlaceFinn>
              )}
            </li>
          );
        })}
      </ul>
      {unico ? (
        <AvisoEnLinea estado="advertencia" aparecioDespues>
          {autenticacion.factor_unico}
        </AvisoEnLinea>
      ) : null}
      <EnlaceFinn
        href="/ajustes/seguridad/factores/nuevo"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accion-tonal px-5 font-semibold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
      >
        <Icono nombre="plus" tamano={18} />
        {t.agregar}
      </EnlaceFinn>
    </section>
  );
}
