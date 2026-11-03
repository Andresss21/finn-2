'use client';
// "Desarchivar" (OP-05; 05 §2.7, §4.14, 06 FT-52 y FT-53): una acción de un toque, sin URL ni confirmación [1T]. Al terminar queda el
// `Resultado` en el lugar, con «Archivar de nuevo» como salida (OP-04 sin devolver asignaciones, 4.14). La página se vuelve a leer
// sola porque la Server Action revalida el marco y la cuenta deja de estar archivada: por eso este componente decide solo si se
// muestra (archivada, o con un resultado a la vista) a partir del estado de sus dos operaciones. No calcula nada (PF-3).
import { Boton } from '../../../../componentes/base/boton';
import { Resultado } from '../../../../componentes/base/resultado';
import { useOperacion, type AccionEscritura } from '../../../../formularios/use-operacion';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';

export function Desarchivar({
  cuentaId,
  archivada,
  accion,
  volver: accionVolver,
}: {
  readonly cuentaId: string;
  readonly archivada: boolean;
  /** La Server Action de OP-05: la pasa el lector. */
  readonly accion: AccionEscritura;
  /** La Server Action de OP-04, para «Archivar de nuevo»: la pasa el lector. */
  readonly volver: AccionEscritura;
}) {
  const desarchivar = useOperacion({ accion });
  const volver = useOperacion({ accion: accionVolver });
  const desarchivada = desarchivar.estado === 'listo';
  if (!archivada && !desarchivada) return null;
  const falla = desarchivar.error ?? volver.error;
  return (
    <li data-accion="desarchivar" className="flex flex-col gap-2">
      {volver.estado === 'listo' ? (
        <Resultado texto={t.archivadaDeNuevo} />
      ) : desarchivada ? (
        <Resultado
          texto={t.desarchivada}
          salida={{
            etiqueta: t.archivarDeNuevo,
            ejecutar: () => {
              void volver.enviar({ cuentaId, devolverAsignacionesFuturas: false });
            },
          }}
        />
      ) : (
        <Boton
          variante="secundaria"
          enviando={desarchivar.estado === 'enviando'}
          deshabilitado={!desarchivar.enLinea}
          {...(desarchivar.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: desarchivar.motivoSinEnvio })}
          onClick={() => {
            void desarchivar.enviar({ cuentaId });
          }}
        >
          {t.desarchivar}
        </Boton>
      )}
      {falla === undefined ? null : (
        <p role="alert" className="text-cuerpo-pequeno text-problema-texto">
          {falla.mensaje}
        </p>
      )}
    </li>
  );
}
