// Resumen de la meta de una categoría (05 §10.8 `ResumenMeta`, 10.3; 06-identidad-visual §6 «Con meta»): el estado con su
// indicador, lo pedido y lo que falta con `Monto`, y la barra de progreso solo si el DTO trae `progresoBp` (metas de ahorro).
// Dibuja lo que trae el DTO: no calcula montos ni el progreso (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { formatearPorcentaje } from '../../formato';
import { categoriaDetalle } from '../../textos/categoria-detalle';
import { dominio } from '../../textos/dominio';
import { IndicadorEstado, type EstadoFinanciero } from './indicador-estado';
import { Monto } from './monto';

export interface MetaDto {
  readonly monto: Centavos;
  readonly pedido: Centavos;
  readonly falta: Centavos;
  readonly estado: string;
  readonly progresoBp?: number | undefined;
}

const t = categoriaDetalle.meta;

/** El estado de 10.3 de una meta: vencida es advertencia; cumplida y completada, positivo. */
export function indicadorDeMeta(meta: MetaDto): { estado: EstadoFinanciero; etiqueta: string } {
  if (meta.estado === 'vencida') return { estado: 'advertencia', etiqueta: dominio.metaVencida };
  if (meta.estado === 'cumplida') return { estado: 'positivo', etiqueta: dominio.metaCumplida };
  if (meta.estado === 'completada') return { estado: 'positivo', etiqueta: dominio.metaCompletada };
  return meta.falta === 0
    ? { estado: 'positivo', etiqueta: dominio.metaCubierta }
    : { estado: 'advertencia', etiqueta: dominio.faltaParaLaMeta };
}

export function ResumenMeta({
  meta,
  conseguido,
}: {
  readonly meta: MetaDto;
  /** Lo que ya hay en la categoría (su Disponible), para decir «$1,350.00 de $3,000.00». */
  readonly conseguido: Centavos;
}) {
  const { estado, etiqueta } = indicadorDeMeta(meta);
  const bp = meta.progresoBp;
  return (
    <div data-resumen-meta={meta.estado} className="flex flex-col gap-2">
      <IndicadorEstado estado={estado} etiqueta={etiqueta} />
      {bp === undefined ? null : (
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo-pequeno">
            <Monto centavos={conseguido} /> {t.de} <Monto centavos={meta.monto} />
            <span data-progreso> · {formatearPorcentaje(bp)}</span>
          </p>
          <div
            role="progressbar"
            aria-label={t.progreso}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={bp / 100}
            aria-valuetext={formatearPorcentaje(bp)}
            className="relative h-2 overflow-hidden rounded-pastilla bg-superficie-hundida"
          >
            <span
              style={{ width: `${bp / 100}%` }}
              className="absolute inset-y-0 left-0 bg-positivo-borde"
            />
          </div>
        </div>
      )}
      <p className="text-cuerpo-pequeno text-texto-secundario">
        {t.pide}{' '}
        <span data-pedido>
          <Monto centavos={meta.pedido} />
        </span>{' '}
        {t.enElPeriodo} · {t.falta}{' '}
        <span data-falta>
          <Monto centavos={meta.falta} />
        </span>
      </p>
    </div>
  );
}
