'use client';
// «Omitir» de un pago atrasado (OP-44; 05 §2; MAS-103): la misma operación que la hoja de la ocurrencia, de un toque desde la
// lista. Al terminar la Server Action revalida el marco y el pago deja de estar atrasado. No calcula nada (PF-3).
import { Boton } from '../../../componentes/base/boton';
import { useOperacion, type AccionEscritura } from '../../../formularios/use-operacion';
import { programadas as t } from '../../../textos/programadas';

export function Omitir({
  programadaId,
  fechaEsperada,
  accion,
}: {
  readonly programadaId: string;
  readonly fechaEsperada: string;
  /** `omitirOcurrencia` (OP-44): la pasa la pantalla, así el componente se prueba sin servidor. */
  readonly accion: AccionEscritura;
}) {
  const omitir = useOperacion({ accion });
  return (
    <span data-accion="omitir" className="flex flex-col gap-1">
      <Boton
        variante="secundaria"
        enviando={omitir.estado === 'enviando'}
        textoEnviando={t.ocurrencia.omitiendo}
        deshabilitado={!omitir.enLinea}
        {...(omitir.motivoSinEnvio === undefined
          ? {}
          : { motivoDeshabilitado: omitir.motivoSinEnvio })}
        onClick={() => {
          void omitir.enviar({ programadaId, fechaEsperada });
        }}
      >
        {t.ocurrencia.omitir}
      </Boton>
      {omitir.error === undefined ? null : (
        <span role="alert" className="text-cuerpo-pequeno text-problema-texto">
          {omitir.error.mensaje}
        </span>
      )}
    </span>
  );
}
