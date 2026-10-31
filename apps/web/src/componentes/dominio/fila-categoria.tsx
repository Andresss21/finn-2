// Fila de categoría del Presupuesto (05 §10.8; 06-identidad-visual 2.6). Los montos y la barra salen del DTO.
import type { Centavos } from '@finn/dominio/valores';
import { dominio } from '../../textos/dominio';
import { Icono } from '../base/icono';
import { BarraGastado, type BarraDto } from './barra-gastado';
import { IndicadorEstado, type EstadoFinanciero } from './indicador-estado';
import { Monto } from './monto';

export interface FilaCategoriaDto {
  readonly categoria: { readonly id: string; readonly nombre: string };
  readonly asignado: Centavos;
  readonly gastado: Centavos;
  readonly disponible: Centavos;
  readonly sobregiro: { readonly tipo: 'debito' | 'tarjeta' | 'mixto' } | null;
  readonly meta: { readonly falta: Centavos; readonly estado: string } | null;
  readonly barra: BarraDto | null;
}

interface PropsFilaCategoria {
  readonly fila: FilaCategoriaDto;
  readonly periodoCerrado?: boolean;
  readonly hrefDetalle: string;
  /** Sin él (período cerrado, 7.7) la fila no ofrece asignar. */
  readonly hrefAsignar?: string;
}

interface Indicador {
  readonly estado: EstadoFinanciero;
  readonly etiqueta: string;
}

function indicadores(fila: FilaCategoriaDto): Indicador[] {
  const lista: Indicador[] = [];
  const tipo = fila.sobregiro?.tipo;
  if (tipo === 'debito' || tipo === 'mixto') {
    lista.push({ estado: 'problema', etiqueta: dominio.sobregiroDebito });
  }
  if (tipo === 'tarjeta' || tipo === 'mixto') {
    lista.push({ estado: 'deuda-sin-respaldo', etiqueta: dominio.deudaSinReservar });
  }
  if (fila.meta !== null) {
    // 05 §10.3: vencida es advertencia; cumplida y completada, positivo.
    const { estado, falta } = fila.meta;
    if (estado === 'vencida') {
      lista.push({ estado: 'advertencia', etiqueta: dominio.metaVencida });
    } else if (estado === 'cumplida') {
      lista.push({ estado: 'positivo', etiqueta: dominio.metaCumplida });
    } else if (estado === 'completada') {
      lista.push({ estado: 'positivo', etiqueta: dominio.metaCompletada });
    } else if (falta === 0) {
      lista.push({ estado: 'positivo', etiqueta: dominio.metaCubierta });
    } else {
      lista.push({ estado: 'advertencia', etiqueta: dominio.faltaParaLaMeta });
    }
  }
  return lista;
}

function estadoDisponible(fila: FilaCategoriaDto): EstadoFinanciero | undefined {
  if (fila.sobregiro === null) return undefined;
  return fila.sobregiro.tipo === 'tarjeta' ? 'deuda-sin-respaldo' : 'problema';
}

export function FilaCategoria({
  fila,
  periodoCerrado = false,
  hrefDetalle,
  hrefAsignar,
}: PropsFilaCategoria) {
  const nombre = fila.categoria.nombre;
  const estado = estadoDisponible(fila);
  return (
    <div data-fila-categoria={fila.categoria.id} className="flex items-center gap-3.5 px-4 py-3.5">
      <a href={hrefDetalle} className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-cuerpo font-semibold text-texto">{nombre}</span>
          <span>
            <span className="sr-only">{dominio.disponible} </span>
            <Monto centavos={fila.disponible} rol="cifra" {...(estado ? { estado } : {})} />
          </span>
        </span>
        <BarraGastado barra={fila.barra} />
        <span className="text-cuerpo-pequeno text-texto-secundario">
          {periodoCerrado ? (
            <span className="mr-2 inline-flex items-center gap-1.5 text-texto-terciario">
              <Icono nombre="lock" tamano={14} />
              {dominio.periodoCerrado}
            </span>
          ) : null}
          {dominio.asignado} <Monto centavos={fila.asignado} /> · {dominio.gastado}{' '}
          <Monto centavos={fila.gastado} />
        </span>
        <span className="flex flex-wrap gap-3">
          {indicadores(fila).map((i) => (
            <IndicadorEstado key={i.etiqueta} estado={i.estado} etiqueta={i.etiqueta} />
          ))}
        </span>
      </a>
      {hrefAsignar === undefined || periodoCerrado ? null : (
        <a
          href={hrefAsignar}
          aria-label={dominio.asignar(nombre)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla bg-accion-tonal text-accion"
        >
          <Icono nombre="plus" />
        </a>
      )}
    </div>
  );
}
