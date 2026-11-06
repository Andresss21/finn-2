// El gasto semanal de FT-61 (04 §6.9.3, 05 §2.10): por categoría, las semanas del período con su referencia, el acumulado y las
// mismas semanas de los períodos anteriores. Dibuja lo que trae el DTO (PF-3): la referencia, el porcentaje y la diferencia las
// calcula el motor. Las semanas futuras van sin barra y con su nota (05 §10.8).
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { Centavos } from '@finn/dominio/valores';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Monto } from '../../../../componentes/dominio/monto';
import { GraficoBarras } from '../../../../componentes/graficos/grafico-barras';
import { GraficoLineas } from '../../../../componentes/graficos/grafico-lineas';
import { VistaGrafico } from '../../../../componentes/graficos/vista-grafico';
import { formatearFecha, formatearMonto } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';
import { Tabla, type Nombres } from './vistas-detalle';

type Categoria = ReporteDe<'gasto_semanal'>['categorias'][number];
const g = t.gastoSemanal;
const monto = (c: Centavos) => <Monto centavos={c} rol="cuerpo" />;
const corta = (f: string) => formatearFecha(f).slice(0, 5);

function Resumen({ c }: { readonly c: Categoria }) {
  const pasadas = c.semanas.filter((s) => !s.futura);
  const ultima = pasadas[pasadas.length - 1];
  const hoy = c.semanas.find((s) => s.k === c.semanaActual?.k) ?? ultima;
  const datos: [string, Centavos][] = [
    [g.asignado, c.asignado],
    [g.gastado, ultima?.gastoAcumulado ?? Centavos.cero],
    [g.referenciaHoy, hoy?.referenciaAcumulada ?? Centavos.cero],
  ];
  return (
    <dl data-resumen className="grid grid-cols-3 gap-3 rounded-contenedor bg-superficie p-4">
      {datos.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex flex-col gap-1">
          <dt className="text-rotulo text-texto-secundario">{etiqueta}</dt>
          <dd>{monto(valor)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Estado({ c }: { readonly c: Categoria }) {
  const bp = c.semanaActual?.porcentajeReferenciaBp;
  const dif = c.diferenciaReferencia;
  return (
    <>
      {bp === undefined || bp === null ? null : (
        // Solo redondea a entero los puntos básicos del DTO para el texto: no calcula ningún monto.
        <p data-porcentaje className="text-cuerpo font-semibold">
          {g.porcentaje(Math.round(bp / 100))}
        </p>
      )}
      {dif === undefined ? null : (
        <p data-diferencia className="text-cuerpo-pequeno text-texto-secundario">
          {dif >= 0
            ? g.porDebajo(formatearMonto(dif))
            : g.porEncima(formatearMonto(Centavos.negar(dif)))}
        </p>
      )}
    </>
  );
}

function PorCategoria({ c, nombre }: { readonly c: Categoria; readonly nombre: string }) {
  const acumulados = c.semanas.filter((s) => !s.futura);
  const gastado = acumulados.at(-1)?.gastoAcumulado ?? Centavos.cero;
  return (
    <section data-categoria={c.categoria} className="flex flex-col gap-3">
      <h3 className="text-titulo-seccion">{nombre}</h3>
      {c.asignado < 0 ? (
        <AvisoEnLinea estado="advertencia">{g.asignadoNegativo}</AvisoEnLinea>
      ) : null}
      {c.nueva ? (
        <AvisoEnLinea estado="informacion" titulo={g.categoriaNueva}>
          {g.categoriaNuevaTexto}
        </AvisoEnLinea>
      ) : null}
      <Resumen c={c} />
      <Estado c={c} />
      <VistaGrafico
        titulo={g.porSemana}
        grafico={
          <div className="flex flex-col gap-4">
            <GraficoBarras
              titulo={`${nombre}: ${g.porSemana}`}
              resumen={g.resumenBarras(c.semanas.length)}
              puntos={c.semanas.map((s) => ({
                clave: String(s.k),
                etiqueta: corta(s.desde),
                valor: s.gasto,
                referencia: s.referencia,
                actual: s.k === c.semanaActual?.k,
                futura: s.futura,
                ...(s.futura ? { nota: g.futura(s.dias) } : {}),
              }))}
            />
            <GraficoLineas
              titulo={`${nombre}: ${g.acumulado}`}
              resumen={g.resumenAcumulado(formatearMonto(gastado))}
              etiquetasTodas
              puntos={acumulados.map((s) => ({
                clave: String(s.k),
                etiqueta: `S${s.k}`,
                valor: s.gastoAcumulado,
              }))}
            />
          </div>
        }
        tabla={
          <Tabla
            titulo={`${nombre}: ${g.porSemana}`}
            filas={c.semanas}
            clave={(s) => String(s.k)}
            columnas={[
              {
                id: 'semana',
                celda: (s) =>
                  `S${s.k} ${corta(s.desde)}–${corta(s.hasta)}${
                    s.futura ? ` (${g.futuraTabla})` : s.k === c.semanaActual?.k ? ` (${g.enCurso})` : ''
                  }`,
              },
              { id: 'gastado', celda: (s) => monto(s.gasto) },
              { id: 'referencia', celda: (s) => monto(s.referencia) },
              {
                id: 'anteriores',
                celda: (s) =>
                  s.anteriores.length === 0 ? (
                    g.sinAnteriores
                  ) : (
                    <span className="inline-flex flex-wrap justify-end gap-x-2">
                      {s.anteriores.map((a) => (
                        <span key={a.periodo}>{monto(a.gasto)}</span>
                      ))}
                    </span>
                  ),
              },
            ]}
          />
        }
      />
    </section>
  );
}

export function GastoSemanal({
  dto,
  nombres,
}: {
  readonly dto: ReporteDe<'gasto_semanal'>;
  readonly nombres: Nombres;
}) {
  return (
    <div className="flex flex-col gap-8">
      {dto.categorias.map((c) => (
        <PorCategoria
          key={c.categoria}
          c={c}
          nombre={nombres.categorias.find((r) => r.id === c.categoria)?.nombre ?? c.categoria}
        />
      ))}
    </div>
  );
}
