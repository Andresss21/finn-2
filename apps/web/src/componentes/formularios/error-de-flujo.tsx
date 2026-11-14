'use client';
// `ErrorDeFlujo` (E6-5, `T3-errores-de-flujo`; 05 §4.7, 04 §7.7): el error de un formulario, arriba del pie, en el aviso en
// línea de problema ([CH-286] C-51) con `dang` y `role="alert"`, con el texto del servidor (`mensaje`). Un patrón por tipo de flujo:
// - corto: `OCUPADO` e `INCIERTO` (después del reintento automático) con «Intentar de nuevo»;
// - largo: `VALIDACION` en el campo y UN solo resumen aquí, `INTERNO` con la referencia e «Intentar de nuevo»,
//   `conflicto_id` con «Ver lo guardado» y «Guardar como nuevo».
// Lo escrito se conserva siempre: este componente no toca el formulario. En el teléfono, el llamador lo pone justo antes de la
// barra fija del pie.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { formularios } from '../../textos/formularios';
import { AvisoEnLinea } from '../base/aviso';
import { Boton } from '../base/boton';

export interface PropsErrorDeFlujo {
  readonly tipo: 'corto' | 'largo';
  readonly error: ErrorFinn;
  readonly alReintentar?: () => void;
  /** `conflicto_id`: abre lo ya guardado. */
  readonly alVerGuardado?: () => void;
  /** `conflicto_id`: genera un id nuevo y guarda. */
  readonly alGuardarComoNuevo?: () => void;
}

export function ErrorDeFlujo({
  tipo,
  error,
  alReintentar,
  alVerGuardado,
  alGuardarComoNuevo,
}: PropsErrorDeFlujo) {
  const conflictoId = error.codigo === 'conflicto_id';
  const reintentable =
    tipo === 'corto'
      ? error.categoria === 'OCUPADO' || error.categoria === 'INCIERTO'
      : error.categoria === 'INTERNO' ||
        error.categoria === 'OCUPADO' ||
        error.categoria === 'INCIERTO';
  const accion =
    tipo === 'largo' && conflictoId ? (
      <>
        {alVerGuardado === undefined ? null : (
          <Boton variante="secundaria" onClick={alVerGuardado}>
            {formularios.verGuardado}
          </Boton>
        )}
        {alGuardarComoNuevo === undefined ? null : (
          <Boton variante="secundaria" onClick={alGuardarComoNuevo}>
            {formularios.guardarComoNuevo}
          </Boton>
        )}
      </>
    ) : reintentable && alReintentar !== undefined ? (
      <Boton variante="secundaria" onClick={alReintentar}>
        {formularios.intentarDeNuevo}
      </Boton>
    ) : null;
  // [CH-286] C-51: el aviso en línea de problema (borde interior, `dang`, `role="alert"`); las acciones, enlaces de texto.
  return (
    <div data-error-de-flujo={tipo}>
      <AvisoEnLinea estado="problema" aparecioDespues accion={accion}>
        {error.mensaje}
      </AvisoEnLinea>
    </div>
  );
}
