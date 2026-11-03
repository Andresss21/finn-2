'use client';
// Lo que se ve al aprobar o confirmar desde el flujo (FT-35, CP-15): lo aprobado según el servidor, «Ver transacción» y volver.
// Se carga cuando hace falta: la pantalla de revisión no lo necesita para dibujarse (05 §13.1).
import { Resultado } from '../../componentes/base/resultado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { bandeja as t } from '../../textos/bandeja';
import { textoAprobado, type ValorAprobado } from './aprobado';

export default function ResultadoDeAprobar({ valor }: { readonly valor: ValorAprobado }) {
  return (
    <div className="flex flex-col gap-4">
      <Resultado
        texto={textoAprobado(valor)}
        enlace={
          <EnlaceFinn href={`/actividad/${valor.transaccionId}`}>{t.verTransaccion}</EnlaceFinn>
        }
      />
      <EnlaceFinn
        href="/bandeja"
        className="inline-flex min-h-11 items-center font-bold text-enlace underline"
      >
        {t.revisar.volver}
      </EnlaceFinn>
    </div>
  );
}
