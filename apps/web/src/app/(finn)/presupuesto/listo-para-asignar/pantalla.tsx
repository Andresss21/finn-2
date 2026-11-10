// `/presupuesto/listo-para-asignar` (FT-15): cómo se compone Listo para asignar hoy, lo que va a reducir al cierre del período y
// su valor al cierre de cada período, con el gráfico y su tabla equivalente (P5-13) tras el selector Gráfico / Tabla de
// 05 §10.8.1 (`VistaGrafico`, CH-81). Dibuja lo que trae el DTO: no calcula montos (PF-3); la descomposición llega partida y
// cada línea dice si suma o resta por el grupo en que está.
import type { DetalleLpaDto } from '@finn/aplicacion/consultas/detalle-lpa';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { ResumenListoParaAsignar } from '../../../../componentes/dominio/billete';
import { Monto } from '../../../../componentes/dominio/monto';
import { GraficoLineas } from '../../../../componentes/graficos/grafico-lineas';
import { TablaEquivalente } from '../../../../componentes/graficos/tabla-equivalente';
import { VistaGrafico } from '../../../../componentes/graficos/vista-grafico';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearMonto, formatearPeriodoCorto } from '../../../../formato';
import { inicio } from '../../../../textos/inicio';
import { listoParaAsignar as t } from '../../../../textos/listo-para-asignar';

const ENLACE =
  'inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const LISTA = 'flex flex-col divide-y divide-borde-sutil';
const TARJETA = 'flex flex-col gap-3 rounded-contenedor bg-superficie p-4 shadow-elevacion-1';

function Seccion({
  titulo,
  atributo,
  sinTitulo = false,
  tarjeta = false,
  children,
}: {
  readonly titulo: string;
  readonly atributo: string;
  /** El título lo dibuja el contenido: el contenedor de gráfico lo lleva en su encabezado. */
  readonly sinTitulo?: boolean;
  /** Dentro de una tarjeta con el título como rótulo (export 05). */
  readonly tarjeta?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <section data-seccion={atributo} className={tarjeta ? TARJETA : 'flex flex-col gap-3'}>
      {sinTitulo ? null : (
        <h2 className={tarjeta ? 'text-rotulo text-texto-secundario' : 'text-titulo-seccion'}>
          {titulo}
        </h2>
      )}
      {children}
    </section>
  );
}

function Linea({ etiqueta, monto }: { readonly etiqueta: string; readonly monto: Centavos }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-3">
      <dt>{etiqueta}</dt>
      <dd>
        <Monto centavos={monto} rol="cuerpo" />
      </dd>
    </div>
  );
}

function Grupo({
  titulo,
  lineas,
}: {
  readonly titulo: string;
  readonly lineas: readonly (readonly [string, Centavos])[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-rotulo text-texto-secundario">{titulo}</h3>
      <dl className={LISTA}>
        {lineas.map(([etiqueta, monto]) => (
          <Linea key={etiqueta} etiqueta={etiqueta} monto={monto} />
        ))}
      </dl>
    </div>
  );
}

function Reduccion({ dto }: { readonly dto: DetalleLpaDto }) {
  const { total, categorias, tarjetas } = dto.reduccionProyectadaAlCierre;
  return (
    <Seccion titulo={t.reduccion.titulo} atributo="reduccion" tarjeta>
      {total === 0 ? (
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.reduccion.ninguna}</p>
      ) : (
        <>
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.reduccion.texto}</p>
          <p data-reduccion-total className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">{t.reduccion.titulo}</span>
            <Monto centavos={total} rol="cifra" />
          </p>
          {categorias.length === 0 ? null : (
            <Grupo
              titulo={t.reduccion.categorias}
              lineas={categorias.map((c) => [c.categoria.nombre, c.monto] as const)}
            />
          )}
          {tarjetas.length === 0 ? null : (
            <Grupo
              titulo={t.reduccion.tarjetas}
              lineas={tarjetas.map((c) => [c.tarjeta.nombre, c.monto] as const)}
            />
          )}
        </>
      )}
    </Seccion>
  );
}

function Historial({ dto }: { readonly dto: DetalleLpaDto }) {
  const puntos = dto.historial.map((h) => ({
    clave: h.periodo.inicio,
    etiqueta: formatearPeriodoCorto(h.periodo),
    valor: h.lpaAlCierre,
  }));
  const ultimo = puntos.at(-1);
  return (
    <Seccion titulo={t.historial.titulo} atributo="historial" sinTitulo={ultimo !== undefined}>
      {ultimo === undefined ? (
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.historial.vacio}</p>
      ) : (
        <VistaGrafico
          titulo={t.historial.titulo}
          cifra={<Monto centavos={ultimo.valor} rol="cifra-principal" />}
          nota={ultimo.etiqueta}
          tablaAlLado
          grafico={
            <GraficoLineas
              titulo={t.historial.grafico}
              resumen={`${t.historial.resumen(puntos.length)}, el último ${formatearMonto(ultimo.valor)}`}
              puntos={puntos}
            />
          }
          tabla={<TablaEquivalente titulo={t.historial.grafico} puntos={puntos} />}
        />
      )}
      <div data-nota-historial={dto.notaHistorial}>
        <AvisoEnLinea estado="informacion">{t.historial.nota}</AvisoEnLinea>
      </div>
    </Seccion>
  );
}

export function PantallaListoParaAsignar({ dto }: { readonly dto: DetalleLpaDto }) {
  const { entradas: e, ...d } = dto.descomposicion;
  const x = t.descomposicion;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      {/* A5: en teléfono «Volver» va en la barra (CH-109); acá solo desde computadora */}
      <div className="hidden md:block">
        <EnlaceFinn href="/presupuesto" className={ENLACE}>
          {t.volver}
        </EnlaceFinn>
      </div>
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <ResumenListoParaAsignar
        variante="billete"
        lpa={dto.lpa}
        enCamino={d.enCamino}
        lpaNegativo={dto.lpaNegativo}
        {...(dto.lpa === 0
          ? {}
          : {
              accion: {
                href: '/presupuesto',
                texto:
                  dto.lpa < 0
                    ? inicio.quitar(formatearMonto(Math.abs(dto.lpa) as typeof dto.lpa))
                    : inicio.asignar(formatearMonto(dto.lpa)),
              },
            })}
      />
      <Seccion titulo={x.titulo} atributo="descomposicion" tarjeta>
        <Grupo
          titulo={x.suma}
          lineas={[
            [x.ingresos, e.ingresos],
            [x.otrasEntradas, e.otrasEntradas],
            [x.restituciones, e.restituciones],
            [x.saldosIniciales, e.saldosIniciales],
          ]}
        />
        <Grupo
          titulo={x.resta}
          lineas={[
            [x.asignadoCerrados, d.asignadoPeriodosCerrados],
            [x.asignadoActivo, d.asignadoPeriodoActivo],
            [x.asignadoFuturos, d.asignadoPeriodosFuturos],
            [x.sobregiroDebito, d.reduccionesSobregiroDebito],
            [x.pagoExcedente, d.reduccionesPagoExcedente],
            [x.enCamino, d.enCamino],
          ]}
        />
      </Seccion>
      <Reduccion dto={dto} />
      <Historial dto={dto} />
    </main>
  );
}
