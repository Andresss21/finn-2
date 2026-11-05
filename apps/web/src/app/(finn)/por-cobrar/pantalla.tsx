// `/por-cobrar` (FT-45; 06-identidad-visual §3, 09c): lo que te deben por deudor, con cada compra y su saldo, y el dinero en
// camino (AV-09). Dibuja lo que trae el DTO: no calcula montos (PF-3). Cobrar (FT-46), condonar (FT-47) y renombrar (FT-48) son
// enlaces a sus rutas; una partida cerrada no los ofrece (no tiene saldo abierto).
import type { PorCobrarDto } from '@finn/aplicacion/consultas/por-cobrar';
import type { Centavos } from '@finn/dominio/valores';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { InterruptorEnlace } from '../../../componentes/base/interruptor-enlace';
import { Vacio } from '../../../componentes/base/vacio';
import {
  IndicadorEstado,
  type EstadoFinanciero,
} from '../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { formatearFecha } from '../../../formato';
import { dominio } from '../../../textos/dominio';
import { porCobrar as t } from '../../../textos/por-cobrar';

type Deudor = PorCobrarDto['deudores'][number];
type Partida = Deudor['items'][number];

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const TONAL = `inline-flex min-h-11 min-w-11 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion ${FOCO}`;
const ENLACE = `inline-flex min-h-11 min-w-11 items-center justify-center rounded-control px-4 font-semibold text-enlace ${FOCO}`;
const ESTADO: Readonly<Record<Partida['estado'], EstadoFinanciero>> = {
  abierto: 'informacion',
  parcial: 'advertencia',
  cerrado: 'positivo',
};

function Dato({ rotulo, monto }: { readonly rotulo: string; readonly monto: Centavos }) {
  return (
    <span className="whitespace-nowrap">
      {rotulo} <Monto centavos={monto} rol="cuerpo" presentacion="absoluto" />
    </span>
  );
}

function FilaPartida({ x }: { readonly x: Partida }) {
  const nombre = x.comercio ?? dominio.sinComercio;
  return (
    <li
      data-partida={x.lineaId}
      data-partida-estado={x.estado}
      className="flex flex-col gap-2 border-t border-borde-sutil py-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-cuerpo font-semibold">{nombre}</p>
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {formatearFecha(x.fechaOrigen)} · <span data-medio={x.medio}>{t.medios[x.medio]}</span>
          </p>
        </div>
        <span data-abierto className="font-bold">
          <Monto centavos={x.abierto} rol="cuerpo" presentacion="absoluto" />
        </span>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-cuerpo-pequeno text-texto-secundario">
        <IndicadorEstado estado={ESTADO[x.estado]} etiqueta={t.estados[x.estado]} />
        <Dato rotulo={t.montos.compartido} monto={x.monto} />
        {x.restituido > 0 ? <Dato rotulo={t.montos.cobrado} monto={x.restituido} /> : null}
        {x.condonado > 0 ? <Dato rotulo={t.montos.condonado} monto={x.condonado} /> : null}
        {x.devuelto > 0 ? <Dato rotulo={t.montos.devuelto} monto={x.devuelto} /> : null}
      </p>
      {x.abierto > 0 ? (
        <div className="flex flex-wrap gap-2">
          <EnlaceFinn
            href={`/por-cobrar/cobrar?linea=${x.lineaId}`}
            aria-label={t.cobrarA(nombre)}
            className={TONAL}
          >
            {t.cobrar}
          </EnlaceFinn>
          <EnlaceFinn
            href={`/por-cobrar/condonar/${x.lineaId}`}
            aria-label={t.condonarA(nombre)}
            className={ENLACE}
          >
            {t.condonar}
          </EnlaceFinn>
        </div>
      ) : null}
    </li>
  );
}

function TarjetaDeudor({ d }: { readonly d: Deudor }) {
  const primera = d.items[0];
  return (
    <section
      data-deudor={d.deudor.id}
      aria-labelledby={`deudor-${d.deudor.id}`}
      className="flex flex-col gap-2 rounded-contenedor bg-superficie p-4 shadow-elevacion-1"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={`deudor-${d.deudor.id}`} className="text-titulo-seccion">
          {d.deudor.nombre}
        </h2>
        <EnlaceFinn
          href={`/por-cobrar/deudores/${d.deudor.id}/renombrar`}
          aria-label={t.renombrarA(d.deudor.nombre)}
          className={ENLACE}
        >
          {t.renombrar}
        </EnlaceFinn>
      </div>
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-cuerpo-pequeno text-texto-secundario">
          {t.teDebe}
          {primera === undefined ? '' : ` · ${t.desde(formatearFecha(primera.fechaOrigen))}`}
        </span>
        <span data-deuda-abierta>
          <Monto centavos={d.abierto} rol="cifra" estado="informacion" presentacion="absoluto" />
        </span>
      </p>
      <ul className="flex flex-col">
        {d.items.map((x) => (
          <FilaPartida key={x.lineaId} x={x} />
        ))}
      </ul>
    </section>
  );
}

export function PantallaPorCobrar({
  dto,
  cerrados,
}: {
  readonly dto: PorCobrarDto;
  readonly cerrados: boolean;
}) {
  const hayDeudores = dto.deudores.length > 0;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      {hayDeudores ? (
        <>
          <section
            data-resumen-por-cobrar
            className="grid grid-cols-2 gap-3 rounded-contenedor bg-superficie p-4 shadow-elevacion-1"
          >
            <p className="flex flex-col">
              <span className="text-rotulo text-texto-secundario">{t.teDeben}</span>
              <span data-total-abierto>
                <Monto centavos={dto.totalAbierto} rol="cifra" presentacion="absoluto" />
              </span>
            </p>
            <p className="flex flex-col">
              <span className="text-rotulo text-texto-secundario">{t.enCamino}</span>
              <span data-en-camino>
                <Monto centavos={dto.enCamino} rol="cifra" estado="informacion" />
              </span>
            </p>
          </section>
          <AvisoEnLinea estado="informacion" titulo={t.enCamino}>
            {dto.enCamino > 0 ? t.avisoEnCamino : t.avisoSinEnCamino}
          </AvisoEnLinea>
          <div className="flex flex-col gap-4">
            {dto.deudores.map((d) => (
              <TarjetaDeudor key={d.deudor.id} d={d} />
            ))}
          </div>
        </>
      ) : (
        <Vacio titulo={t.vacioTitulo} texto={t.vacioTexto} icono="cero" />
      )}
      {/* Cada estado del interruptor tiene su URL y funciona sin hidratar. */}
      <InterruptorEnlace
        href={cerrados ? '/por-cobrar' : '/por-cobrar?cerrados=1'}
        activo={cerrados}
        etiqueta={t.verCerrados}
      />
    </main>
  );
}
