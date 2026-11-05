'use client';
// El encabezado de `/bandeja/[movimientoId]` (S4 del export, CH-136): el estado del movimiento, el comercio, el monto y una línea con
// la cuenta, la fecha y de dónde salió la categoría sugerida. Todo viene del servidor tal cual (PF-3): no calcula ni deduce signos.
import type { Centavos } from '@finn/dominio/valores';
import { Icono } from '../../componentes/base/icono';
import { COLOR_CIRCULO, COLOR_TEXTO } from '../../componentes/dominio/indicador-estado';
import { Monto } from '../../componentes/dominio/monto';
import type { VistaMovimiento } from '../../componentes/dominio/vista-movimiento';
import { formatearFecha } from '../../formato';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas as c } from '../../textos/cuentas';

const ESTADO = {
  listo: 'positivo',
  falta: 'advertencia',
  faltaOtro: 'advertencia',
  coincidencia: 'informacion',
  duplicado: 'advertencia',
  noReconocido: 'cero',
  error: 'problema',
} as const;

const FINAL = { aprobado: 'positivo', descartado: 'cero' } as const;

export interface ResumenDelMovimiento {
  readonly vista: VistaMovimiento;
  /** Un movimiento que ya no se revisa: el estado que dice el encabezado en lugar de la vista (CH-137). */
  readonly final?: 'aprobado' | 'descartado';
  readonly comercio: string | null;
  readonly monto: Centavos | null;
  /** Un gasto o un pago de tarjeta sale dinero: el tipo lo dice el servidor (FE-44). */
  readonly sale: boolean;
  readonly cuenta: string | null;
  readonly fecha: string | null;
  readonly sugerida: { readonly nombre: string; readonly porRegla: boolean } | null;
}

export default function Encabezado({ resumen: r }: { readonly resumen: ResumenDelMovimiento }) {
  const estado = r.final === undefined ? ESTADO[r.vista] : FINAL[r.final];
  const linea = [
    r.cuenta,
    r.fecha === null ? null : formatearFecha(r.fecha),
    r.sugerida === null
      ? null
      : t.revisar.categoriaSugerida(r.sugerida.nombre, r.sugerida.porRegla),
  ].filter((x) => x !== null);
  return (
    <header className="flex flex-col gap-2" data-encabezado-movimiento>
      <span
        data-estado={estado}
        className={[
          'inline-flex items-center gap-2 text-etiqueta font-semibold',
          COLOR_TEXTO[estado],
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'inline-flex size-5 flex-none items-center justify-center rounded-full',
            COLOR_CIRCULO[estado],
          ].join(' ')}
        >
          <Icono nombre={estado} tamano={13} />
        </span>
        {r.final === 'aprobado'
          ? t.aprobadoSinDatos
          : r.final === 'descartado'
            ? t.descartados.descartado
            : c.bandeja.estados[r.vista]}
      </span>
      <p className="text-titulo-seccion break-words">{r.comercio ?? c.bandeja.sinComercio}</p>
      {r.monto === null ? null : (
        <Monto
          centavos={r.monto}
          rol="cifra-principal"
          presentacion={r.sale ? 'salida' : 'absoluto'}
        />
      )}
      {linea.length === 0 ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">{linea.join(' · ')}</p>
      )}
    </header>
  );
}
