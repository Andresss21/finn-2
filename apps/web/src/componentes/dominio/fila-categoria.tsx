// Fila de categoría del Presupuesto (05 §10.8; 06-identidad-visual 2.6). Los montos y la barra salen del DTO.
import type { Centavos } from '@finn/dominio/valores';
import { dominio } from '../../textos/dominio';
import { Icono } from '../base/icono';
import { EnlaceFinn } from '../navegacion/enlace-finn';
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

// 06 §1: Disponible positivo en `--positivo-texto`; cero en `--texto`; negativo, según con qué se pasó.
function estadoDisponible(fila: FilaCategoriaDto): EstadoFinanciero | undefined {
  if (fila.sobregiro === null) return fila.disponible > 0 ? 'positivo' : undefined;
  return fila.sobregiro.tipo === 'tarjeta' ? 'deuda-sin-respaldo' : 'problema';
}

// La meta cubierta es la del indicador `metaCubierta` (falta 0 y sin otro estado): lo dice el DTO, no se calcula.
function metaCubierta(fila: FilaCategoriaDto): boolean {
  return (
    fila.sobregiro === null &&
    fila.meta !== null &&
    fila.meta.falta === 0 &&
    fila.meta.estado !== 'vencida'
  );
}

// Cada celda de la tabla de computadora (md) tiene su columna; en el teléfono (06 2.6) la fila apila nombre y Disponible,
// la barra, el Asignado y Gastado y los indicadores. Es el mismo marcado: solo cambia la rejilla.
const FILA_GRID =
  'grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1.6fr)_repeat(3,110px)] md:gap-y-1.5';
const C2 =
  'md:col-start-2 md:row-span-2 md:row-start-1 md:self-center md:text-right md:text-cuerpo';
const C3 =
  'md:col-start-3 md:row-span-2 md:row-start-1 md:self-center md:text-right md:text-cuerpo';
const C4 = 'text-right md:col-start-4 md:row-span-2 md:row-start-1 md:self-center';

export function FilaCategoria({
  fila,
  periodoCerrado = false,
  hrefDetalle,
  hrefAsignar,
}: PropsFilaCategoria) {
  const nombre = fila.categoria.nombre;
  const estado = estadoDisponible(fila);
  const lista = indicadores(fila);
  return (
    <div
      data-fila-categoria={fila.categoria.id}
      className="flex items-center gap-3.5 px-4 py-3.5 md:min-h-14 md:gap-3 md:px-3 md:py-2"
    >
      <a href={hrefDetalle} className={FILA_GRID}>
        <span className="text-cuerpo font-semibold text-texto md:col-start-1 md:row-start-1">
          {nombre}
        </span>
        <span className={C4}>
          <span className="sr-only">{dominio.disponible} </span>
          <Monto centavos={fila.disponible} rol="cifra" {...(estado ? { estado } : {})} />
        </span>
        <div className="col-span-2 empty:hidden md:hidden">
          <BarraGastado barra={fila.barra} metaCubierta={metaCubierta(fila)} />
        </div>
        <span className="col-span-2 text-cuerpo-pequeno text-texto-secundario md:contents">
          <span className={C2}>
            <span className="md:sr-only">{dominio.asignado} </span>
            <Monto centavos={fila.asignado} />
          </span>
          <span className="md:sr-only">{' · '}</span>
          <span className={C3}>
            <span className="md:sr-only">{dominio.gastado} </span>
            <Monto centavos={fila.gastado} />
          </span>
        </span>
        {periodoCerrado || lista.length > 0 ? (
          <span className="col-span-2 flex flex-wrap gap-x-3 gap-y-1 md:col-span-1 md:col-start-1 md:row-start-2">
            {periodoCerrado ? (
              <span className="inline-flex items-center gap-1.5 text-cuerpo-pequeno text-texto-terciario">
                <Icono nombre="lock" tamano={14} />
                {dominio.periodoCerrado}
              </span>
            ) : null}
            {lista.map((i) => (
              <IndicadorEstado key={i.etiqueta} estado={i.estado} etiqueta={i.etiqueta} />
            ))}
          </span>
        ) : null}
      </a>
      {hrefAsignar === undefined || periodoCerrado ? null : (
        <EnlaceFinn
          href={hrefAsignar}
          aria-label={dominio.asignar(nombre)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla bg-accion-tonal text-accion"
        >
          <Icono nombre="plus" />
        </EnlaceFinn>
      )}
    </div>
  );
}
