'use client';
// Asignación rápida (FT-12, OP-16; 06 FT-12): las opciones de `contexto.rapida` (04 §6.14.4) de `/presupuesto/asignar/[categoriaId]`,
// cada una con su monto. Tocar una envía OP-16 con su `variante`: el valor lo calcula el servidor y la interfaz solo lo dibuja (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { Boton } from '../../componentes/base/boton';
import { Monto } from '../../componentes/dominio/monto';
import { presupuestoAsignar as t } from '../../textos/presupuesto-asignar';

export type VarianteRapida =
  'falta_meta' | 'igual_periodo_anterior' | 'promedio_gasto' | 'cubrir_sobregiro';

/** El `rapida` del contexto de `formulario({ operacion: 'asignar' })`: una variante que no se ofrece no viene. */
export interface DatosRapida {
  readonly faltaMeta?: Centavos;
  readonly igualPeriodoAnterior: Centavos;
  readonly promedioGasto?: { readonly monto: Centavos; readonly periodos: 1 | 2 | 3 };
  readonly cubrirSobregiro?: Centavos;
}

export interface PropsOpcionesRapidas {
  readonly rapida: DatosRapida;
  /** Falta(c, p) de la meta: con $0.00 "lo que falta para la meta" no se ofrece (06 FT-12, Estados). */
  readonly faltaDeLaMeta?: Centavos;
  readonly deshabilitado: boolean;
  readonly alElegir: (variante: VarianteRapida) => void;
}

interface Opcion {
  readonly variante: VarianteRapida;
  readonly texto: string;
  readonly monto: Centavos;
}

export function OpcionesRapidas({
  rapida,
  faltaDeLaMeta,
  deshabilitado,
  alElegir,
}: PropsOpcionesRapidas) {
  const opciones: Opcion[] = [];
  if (rapida.faltaMeta !== undefined && faltaDeLaMeta !== undefined && faltaDeLaMeta > 0)
    opciones.push({ variante: 'falta_meta', texto: t.rapida.faltaMeta, monto: rapida.faltaMeta });
  opciones.push({
    variante: 'igual_periodo_anterior',
    texto: t.rapida.periodoPasado,
    monto: rapida.igualPeriodoAnterior,
  });
  if (rapida.promedioGasto !== undefined)
    opciones.push({
      variante: 'promedio_gasto',
      texto: t.rapida.promedio(rapida.promedioGasto.periodos),
      monto: rapida.promedioGasto.monto,
    });
  if (rapida.cubrirSobregiro !== undefined)
    opciones.push({
      variante: 'cubrir_sobregiro',
      texto: t.rapida.cubrirSobregiro,
      monto: rapida.cubrirSobregiro,
    });
  return (
    <div
      role="group"
      aria-label={t.rapida.titulo}
      data-asignacion-rapida
      className="flex flex-col gap-2"
    >
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.rapida.titulo}</p>
      {opciones.map((o) => (
        <Boton
          key={o.variante}
          variante="secundaria"
          deshabilitado={deshabilitado}
          data-variante={o.variante}
          onClick={() => {
            alElegir(o.variante);
          }}
        >
          <span className="flex w-full items-center justify-between gap-3">
            <span>{o.texto}</span>
            <Monto centavos={o.monto} />
          </span>
        </Boton>
      ))}
    </div>
  );
}
