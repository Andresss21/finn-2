// OP-48 Registrar o editar las condiciones de un préstamo (01 §5.9, 04 §3.9). Función pura sin
// efecto presupuestario: solo escribe la fila de `prestamos`; la tabla de amortización es un
// derivado (Anexo A). La conecta al despacho de `aplicar` TA-113. El valor esperado (4.6.2) lo
// resuelve la aplicación bajo el bloqueo, antes de llamar aquí.
import type { CamposPrestamo, Cambio, ComandoOp48, Prestamo, Rechazo } from '../hechos';

export function op48(
  prestamos: readonly Prestamo[],
  comando: ComandoOp48,
): readonly Cambio[] | Rechazo {
  const actual = prestamos.find((p) => p.cuentaId === comando.prestamoId);
  if (actual === undefined)
    return {
      codigo: 'cuenta_tipo_no_valido',
      campo: 'prestamoId',
      datos: { prestamoId: comando.prestamoId },
    };
  const campos: Partial<Record<keyof CamposPrestamo, unknown>> = {};
  for (const clave of Object.keys(comando.campos) as (keyof CamposPrestamo)[])
    if (comando.campos[clave] !== actual[clave]) campos[clave] = comando.campos[clave];
  if (Object.keys(campos).length === 0) return [];
  return [
    {
      tipo: 'actualizar',
      tabla: 'prestamos',
      id: actual.cuentaId,
      campos: campos as Partial<Prestamo>,
    },
  ];
}
