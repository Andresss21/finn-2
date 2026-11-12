'use client';
// `ErrorDeFlujo` (E6-5, `T3-errores-de-flujo`; 05 §4.7, 04 §7.7): el error de un formulario, arriba del pie, en una caja
// `--problema-fondo` con `dang` y `role="alert"`, con el texto del servidor (`mensaje`). Un patrón por tipo de flujo:
// - corto: `OCUPADO` e `INCIERTO` (después del reintento automático) con «Intentar de nuevo»;
// - largo: `VALIDACION` en el campo y UN solo resumen aquí, `INTERNO` con la referencia e «Intentar de nuevo»,
//   `conflicto_id` con «Ver lo guardado» y «Guardar como nuevo».
// Lo escrito se conserva siempre: este componente no toca el formulario. En el teléfono, el llamador lo pone justo antes de la
// barra fija del pie.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { formularios } from '../../textos/formularios';
import { Boton } from '../base/boton';
import { Icono } from '../base/icono';

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
  return (
    <div
      role="alert"
      data-error-de-flujo={tipo}
      className="flex flex-col items-start gap-3 rounded-contenedor bg-problema-fondo p-3.5 text-problema-texto"
    >
      <p className="flex items-start gap-2.5 font-semibold">
        <span className="mt-0.5 shrink-0">
          <Icono nombre="dang" tamano={20} />
        </span>
        <span>{error.mensaje}</span>
      </p>
      {tipo === 'largo' && conflictoId ? (
        <div className="flex flex-wrap gap-2">
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
        </div>
      ) : reintentable && alReintentar !== undefined ? (
        <Boton variante="secundaria" onClick={alReintentar}>
          {formularios.intentarDeNuevo}
        </Boton>
      ) : null}
    </div>
  );
}
