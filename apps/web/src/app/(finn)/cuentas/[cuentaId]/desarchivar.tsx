'use client';
// "Desarchivar" (OP-05; 05 §2.7, 06 FT-52): una acción de un toque, sin URL ni confirmación [1T]. Al terminar queda el
// `Resultado` en el lugar; la página se vuelve a leer sola porque la Server Action revalida el marco. No calcula nada (PF-3).
import { Boton } from '../../../../componentes/base/boton';
import { Resultado } from '../../../../componentes/base/resultado';
import { useOperacion, type AccionEscritura } from '../../../../formularios/use-operacion';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';

export function Desarchivar({
  cuentaId,
  accion,
}: {
  readonly cuentaId: string;
  /** La Server Action de OP-05: la pasa el lector. */
  readonly accion: AccionEscritura;
}) {
  const op = useOperacion({ accion });
  if (op.estado === 'listo') return <Resultado texto={t.desarchivada} />;
  return (
    <div className="flex flex-col gap-2">
      <Boton
        variante="secundaria"
        enviando={op.estado === 'enviando'}
        deshabilitado={!op.enLinea}
        {...(op.motivoSinEnvio === undefined ? {} : { motivoDeshabilitado: op.motivoSinEnvio })}
        onClick={() => {
          void op.enviar({ cuentaId });
        }}
      >
        {t.desarchivar}
      </Boton>
      {op.estado === 'error' && op.error !== undefined ? (
        <p role="alert" className="text-cuerpo-pequeno text-problema-texto">
          {op.error.mensaje}
        </p>
      ) : null}
    </div>
  );
}
