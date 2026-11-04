'use client';
// «Desactivar» y «Reactivar» una programada (OP-42 `activa`; 05 §2, §4.14; 06 FT-40): una acción de un toque, sin URL ni confirmación [1T].
// Al terminar queda el `Resultado` en el lugar, con la operación inversa como salida (sin tiempo límite). La página se vuelve a leer
// sola porque la Server Action revalida el marco; por eso el estado inicial se guarda al montar. No calcula nada (PF-3).
import { useState } from 'react';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { programadas as t } from '../../textos/programadas';

export function Activar({
  programadaId,
  nombre,
  activa,
  accion,
  ofrecerDesactivar = true,
}: {
  readonly programadaId: string;
  readonly nombre: string;
  readonly activa: boolean;
  /** `gestionarProgramada` (OP-42): la pasa el lector, así el componente se prueba sin servidor. */
  readonly accion: AccionEscritura;
  /** En la lista solo se ofrece reactivar; el componente sigue montado para conservar su resultado. */
  readonly ofrecerDesactivar?: boolean;
}) {
  const [inicial] = useState(activa);
  const cambio = useOperacion({ accion });
  const inversa = useOperacion({ accion });
  const falla = cambio.error ?? inversa.error;
  const enviar = (operacion: typeof cambio, nueva: boolean) =>
    operacion.enviar({ accion: 'activar', programadaId, activa: nueva });
  const hecho = cambio.estado === 'listo';
  if (!hecho && inicial && !ofrecerDesactivar) return null;
  const revertido = inversa.estado === 'listo';
  return (
    <div data-accion="activar" className="flex flex-col gap-2">
      {hecho ? (
        <Resultado
          texto={
            revertido
              ? inicial
                ? t.reactivadaResultado(nombre)
                : t.desactivadaResultado(nombre)
              : inicial
                ? t.desactivadaResultado(nombre)
                : t.reactivadaResultado(nombre)
          }
          {...(revertido
            ? {}
            : {
                salida: {
                  etiqueta: inicial ? t.reactivar : t.desactivar,
                  ejecutar: () => {
                    void enviar(inversa, inicial);
                  },
                },
              })}
        />
      ) : (
        <Boton
          variante="secundaria"
          enviando={cambio.estado === 'enviando'}
          textoEnviando={inicial ? t.desactivar : t.reactivar}
          deshabilitado={!cambio.enLinea}
          {...(cambio.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: cambio.motivoSinEnvio })}
          onClick={() => {
            void enviar(cambio, !inicial);
          }}
        >
          {inicial ? t.desactivar : t.reactivar}
        </Boton>
      )}
      {falla === undefined ? null : (
        <p role="alert" className="text-cuerpo-pequeno text-problema-texto">
          {falla.mensaje}
        </p>
      )}
    </div>
  );
}
