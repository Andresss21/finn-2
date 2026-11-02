'use client';
// Recordatorio de `/ajustes` (FT-04; 06 §3.15): solo mientras los Primeros pasos estén ocultos y queden pasos pendientes
// (`primerosPasos` nulo = los tres hechos: no aparece en ningún lado). "Mostrar en Inicio" borra la preferencia.
import type { InicioSel } from '@finn/dominio/selectores';
import { Boton } from '../../../componentes/base/boton';
import { primerosPasos as t } from '../../../textos/primeros-pasos';
import { usePrimerosPasosOcultos } from '../../../cliente/usePrimerosPasosOcultos';

export function RecordatorioPrimerosPasos({
  pasos,
}: {
  readonly pasos: InicioSel['primerosPasos'];
}) {
  const { oculto, mostrar } = usePrimerosPasosOcultos();
  if (pasos === null || !oculto) return null;
  const hechos = [pasos.cuenta, pasos.categorias, pasos.sms].filter(Boolean).length;
  return (
    <section aria-label={t.titulo} className="flex items-center justify-between gap-3">
      <p>{t.recordatorio(hechos)}</p>
      <Boton variante="secundaria" onClick={mostrar}>
        {t.mostrar}
      </Boton>
    </section>
  );
}
