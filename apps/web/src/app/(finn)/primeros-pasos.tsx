// Primeros pasos de Inicio (FT-04; 06 §3.15, CF-18): sin estado ni cálculo, un paso está hecho porque su hecho existe
// (`inicio().primerosPasos`); hecho, deja de ser enlace y se llama "Hecho: {paso}". "Ocultar por ahora" (CA-04.11) es una preferencia
// del dispositivo: se ofrece con al menos una cuenta y, oculto, el bloque no se dibuja.
'use client';
import type { InicioSel } from '@finn/dominio/selectores';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { usePrimerosPasosOcultos } from '../../cliente/usePrimerosPasosOcultos';
import { primerosPasos as t } from '../../textos/primeros-pasos';

const PASOS = [
  ['cuenta', '/cuentas/nueva'],
  ['categorias', '/presupuesto/estructura'],
  ['sms', '/ajustes/webhook'],
] as const;

export function PrimerosPasosDeInicio({
  pasos,
}: {
  readonly pasos: NonNullable<InicioSel['primerosPasos']>;
}) {
  const { oculto, ocultar } = usePrimerosPasosOcultos();
  if (oculto) return null;
  return (
    <section aria-labelledby="primeros-pasos" className="flex flex-col gap-2">
      <h2 id="primeros-pasos" className="text-titulo-seccion">
        {t.titulo}
      </h2>
      <ol>
        {PASOS.map(([paso, enlace]) => (
          <li key={paso} className="flex min-h-11 items-center gap-3">
            {pasos[paso] ? (
              <>
                <span className="text-positivo-texto">
                  <Icono nombre="positivo" />
                </span>
                <span className="sr-only">{t.hecho(t.pasos[paso])}</span>
                <span aria-hidden="true">{t.pasos[paso]}</span>
              </>
            ) : (
              <>
                <span className="size-5 rounded-pastilla border-2 border-borde-control" />
                <EnlaceFinn
                  href={enlace}
                  className="inline-flex min-h-11 items-center font-semibold text-enlace underline"
                >
                  {t.pasos[paso]}
                </EnlaceFinn>
              </>
            )}
          </li>
        ))}
      </ol>
      {pasos.cuenta ? (
        <div>
          <Boton variante="discreta" onClick={ocultar}>
            {t.ocultar}
          </Boton>
        </div>
      ) : null}
    </section>
  );
}
