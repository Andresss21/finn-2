// El reporte `tarjetas` (FT-66; 05 §2.10, 06 §3.5.10): «Tarjetas en el tiempo». Por tarjeta, sus ciclos ya vencidos (deuda del estado,
// pagado o acreditado a tiempo y arrastre) y sus períodos (cargos, pagos y deuda al fin) con el gráfico y su tabla equivalente. Dibuja
// lo que trae el DTO: no calcula montos (PF-3). Un ciclo cuya fecha de pago no pasó no viene en el DTO y no se muestra.
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Monto } from '../../../../componentes/dominio/monto';
import { GraficoBarras } from '../../../../componentes/graficos/grafico-barras';
import { VistaGrafico } from '../../../../componentes/graficos/vista-grafico';
import { formatearFecha, formatearMesCorto } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';
import { CifraReporte } from './cifra';
import { HallazgosTarjetas, type AccionesTarjetas } from './tarjetas-hallazgos';
import { Tabla } from './vistas-detalle';

type Fila = ReporteDe<'tarjetas'>['tarjetas'][number];

const monto = (c: Parameters<typeof Monto>[0]['centavos']) => <Monto centavos={c} rol="cuerpo" />;

function PorTarjeta({ fila }: { readonly fila: Fila }) {
  const nombre = fila.tarjeta.nombre;
  return (
    <section data-tarjeta={fila.tarjeta.id} className="flex flex-col gap-3">
      <h3 className="text-titulo-seccion">{nombre}</h3>
      {fila.ciclos.length === 0 ? (
        <p data-sin-ciclos className="text-cuerpo-pequeno text-texto-secundario">
          {t.tarjetas.sinCiclos(nombre)}
        </p>
      ) : (
        <Tabla<Fila['ciclos'][number]>
          enfocable
          titulo={t.tarjetas.ciclos(nombre)}
          clave={(c) => c.corte}
          filas={fila.ciclos}
          columnas={[
            { id: 'corte', celda: (c) => formatearFecha(c.corte) },
            { id: 'fechaPago', celda: (c) => formatearFecha(c.fechaPago) },
            { id: 'deudaEstado', celda: (c) => monto(c.deudaEstado) },
            { id: 'pagadoATiempo', celda: (c) => monto(c.pagadoATiempo) },
            { id: 'arrastre', celda: (c) => monto(c.arrastre) },
          ]}
        />
      )}
      {fila.pagaElTotal ? (
        <AvisoEnLinea estado="informacion">{t.tarjetas.pagaElTotal(nombre)}</AvisoEnLinea>
      ) : null}
      <VistaGrafico
        titulo={t.tarjetas.periodos(nombre)}
        grafico={
          <GraficoBarras
            titulo={t.tarjetas.periodos(nombre)}
            resumen={t.tarjetas.resumenBarras(fila.periodos.length)}
            puntos={fila.periodos.map((p) => ({
              clave: p.periodo,
              etiqueta: formatearMesCorto(p.periodo),
              valor: p.cargos,
              referencia: p.pagos,
            }))}
          />
        }
        tabla={
          <Tabla<Fila['periodos'][number]>
            enfocable
            titulo={t.tarjetas.periodos(nombre)}
            clave={(p) => p.periodo}
            filas={fila.periodos}
            columnas={[
              { id: 'periodo', celda: (p) => formatearFecha(p.periodo) },
              { id: 'cargos', celda: (p) => monto(p.cargos) },
              { id: 'pagos', celda: (p) => monto(p.pagos) },
              { id: 'deudaAlFin', celda: (p) => monto(p.deudaAlFin) },
            ]}
          />
        }
      />
    </section>
  );
}

export function Tarjetas({
  dto,
  periodoInicio,
  acciones,
}: {
  readonly dto: ReporteDe<'tarjetas'>;
  /** El período activo: OP-14 «Reservar» asigna en él. */
  readonly periodoInicio: string;
  readonly acciones?: AccionesTarjetas;
}) {
  // El arrastre del último ciclo vencido de la primera tarjeta que tiene (un campo del DTO, no una suma).
  const ultimo = dto.tarjetas
    .map((f) => ({ nombre: f.tarjeta.nombre, ciclo: f.ciclos.at(-1) }))
    .find((x) => x.ciclo !== undefined && x.ciclo.arrastre > 0);
  return (
    <div className="flex flex-col gap-6">
      {ultimo?.ciclo === undefined ? null : (
        <CifraReporte
          centavos={ultimo.ciclo.arrastre}
          estado="deuda-sin-respaldo"
          frase={t.cifras.tarjetas(ultimo.nombre, formatearFecha(ultimo.ciclo.corte))}
        />
      )}
      {/* Siempre montada: la salida «Deshacer» sigue en su lugar cuando la revalidación cambia el hallazgo. */}
      <HallazgosTarjetas
        hallazgos={dto.hallazgos}
        periodoInicio={periodoInicio}
        {...(acciones === undefined ? {} : { acciones })}
      />
      {dto.tarjetas.map((fila) => (
        <PorTarjeta key={fila.tarjeta.id} fila={fila} />
      ))}
    </div>
  );
}
