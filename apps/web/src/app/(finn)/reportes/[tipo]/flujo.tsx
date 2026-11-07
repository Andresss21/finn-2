// El reporte `flujo_efectivo` (FT-68; 05 §2.10, 06 §3.3): por período, el saldo inicial, una fila por efecto en las cuentas de efectivo
// y el saldo final, más lo que se compró con tarjeta. Dibuja lo que trae el DTO: no calcula montos (PF-3); que saldo inicial + filas
// sea el saldo final lo garantiza el selector (V6-03). Termina con la acción de 3.3 (`AccionFlujo`).
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { Monto } from '../../../../componentes/dominio/monto';
import { GraficoBarras } from '../../../../componentes/graficos/grafico-barras';
import { VistaGrafico } from '../../../../componentes/graficos/vista-grafico';
import { formatearFecha, formatearMesCorto, formatearMonto } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';
import { AccionFlujo } from './flujo-accion';
import type { AccionesTarjetas } from './tarjetas-hallazgos';
import { Tabla } from './vistas-detalle';

type Dto = ReporteDe<'flujo_efectivo'>;
type Periodo = Dto['periodos'][number];

interface Linea {
  readonly clave: string;
  readonly etiqueta: string;
  readonly monto: Periodo['saldoInicial'];
  readonly total: boolean;
}

/** El saldo inicial, las filas del DTO tal cual vienen y el saldo final. */
const lineasDe = (p: Periodo): Linea[] => [
  {
    clave: 'saldoInicial',
    etiqueta: t.flujo.filas.saldoInicial,
    monto: p.saldoInicial,
    total: true,
  },
  ...p.filas.map((f) => ({
    clave: f.fila,
    etiqueta: t.flujo.filas[f.fila],
    monto: f.monto,
    total: false,
  })),
  { clave: 'saldoFinal', etiqueta: t.flujo.filas.saldoFinal, monto: p.saldoFinal, total: true },
];

function PorPeriodo({ p }: { readonly p: Periodo }) {
  const inicio = formatearFecha(p.periodo.inicio);
  return (
    <section data-periodo={p.periodo.inicio} className="flex flex-col gap-3">
      <h3 className="text-titulo-seccion">{t.flujo.periodo(inicio)}</h3>
      <Tabla<Linea>
        enfocable
        titulo={t.flujo.filasDe(inicio)}
        clave={(l) => l.clave}
        filas={lineasDe(p)}
        columnas={[
          { id: 'concepto', celda: (l) => l.etiqueta },
          { id: 'monto', celda: (l) => <Monto centavos={l.monto} rol="cuerpo" /> },
        ]}
      />
      <p data-compras-tarjeta className="text-cuerpo-pequeno text-texto-secundario">
        {t.flujo.comprasConTarjetaDe(formatearMonto(p.comprasConTarjeta))}
      </p>
    </section>
  );
}

export function Flujo({
  dto,
  acciones,
}: {
  readonly dto: Dto;
  readonly acciones?: AccionesTarjetas;
}) {
  return (
    <div className="flex flex-col gap-6">
      {dto.periodos.length < 2 ? null : (
        <VistaGrafico
          titulo={t.flujo.porPeriodo}
          grafico={
            <GraficoBarras
              titulo={t.flujo.porPeriodo}
              resumen={t.flujo.resumenBarras(dto.periodos.length)}
              puntos={dto.periodos.map((p) => ({
                clave: p.periodo.inicio,
                etiqueta: formatearMesCorto(p.periodo.inicio),
                valor: p.comprasConTarjeta,
              }))}
            />
          }
          tabla={
            <Tabla<Periodo>
              enfocable
              titulo={t.flujo.porPeriodo}
              clave={(p) => p.periodo.inicio}
              filas={dto.periodos}
              columnas={[
                { id: 'periodo', celda: (p) => formatearFecha(p.periodo.inicio) },
                {
                  id: 'saldoInicial',
                  celda: (p) => <Monto centavos={p.saldoInicial} rol="cuerpo" />,
                },
                { id: 'saldoFinal', celda: (p) => <Monto centavos={p.saldoFinal} rol="cuerpo" /> },
                {
                  id: 'comprasConTarjeta',
                  celda: (p) => <Monto centavos={p.comprasConTarjeta} rol="cuerpo" />,
                },
              ]}
            />
          }
        />
      )}
      {dto.periodos.map((p) => (
        <PorPeriodo key={p.periodo.inicio} p={p} />
      ))}
      <AccionFlujo
        dto={dto}
        periodoInicio={dto.periodoActivo.inicio}
        {...(acciones === undefined ? {} : { acciones })}
      />
    </div>
  );
}
