'use client';
// «Elegí la compra» de una devolución en Revisar (CH-226, A12 y D8): las compras candidatas del movimiento (04 §6.14.4, CH-30) o las de la
// búsqueda de compras de CP-3 mientras se escribe; al elegir una, sus líneas con lo que queda en cada una, para repartir el monto. Una sola
// línea lleva el monto del movimiento, copiado tal cual (PF-3). Se carga solo con el tipo Devolución (05 §13.1).
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useEffect, useState } from 'react';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { formatearMonto } from '../../formato';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import { useLecturaInteractiva } from '../../formularios/use-lectura-interactiva';
import { bandeja as t } from '../../textos/bandeja';
import { transaccion as tr } from '../../textos/transaccion';
import { aCandidata, type CandidataDto, type CompraCandidata, type Devuelta } from './campos';

interface LineaDto {
  readonly lineaId: string;
  readonly destino: { readonly nombre: string; readonly tipo: 'categoria' | 'deudor' };
  readonly capacidad: number;
}

/** `buscarComprasDevolucion` (CP-3): la pone el flujo, así el componente se prueba sin servidor. */
export type BuscarCompras = (entrada: {
  readonly busqueda?: string;
  readonly transaccionOriginalId?: string;
}) => Promise<ResultadoAccion<{ readonly contexto: unknown }>>;

export interface PropsEleccionCompra {
  readonly buscarCompras: BuscarCompras;
  readonly candidatas: readonly CompraCandidata[];
  readonly compraId: string;
  readonly compraNombre: string;
  readonly devueltas: readonly Devuelta[];
  /** El monto del movimiento tal como está escrito: va entero a la única línea de la compra. */
  readonly total: string;
  readonly alElegir: (compraId: string, nombre: string, devueltas: Devuelta[]) => void;
  readonly alCambiar: () => void;
  readonly alCambiarMonto: (i: number, monto: string) => void;
  readonly error: (i: number) => string | undefined;
}

export default function EleccionCompra(p: PropsEleccionCompra) {
  const { buscarCompras } = p;
  const buscar = useCallback(
    async ({ texto }: { readonly texto: string }) => {
      const r = await buscarCompras({ busqueda: texto });
      if (!r.ok) return r;
      const { candidatas } = r.valor.contexto as { candidatas?: readonly CandidataDto[] };
      return { ...r, valor: (candidatas ?? []).map(aCandidata) };
    },
    [buscarCompras],
  );
  const { resultado, consultar } = useLecturaInteractiva(buscar);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState<string | null>(null);
  useEffect(() => {
    consultar(busqueda);
  }, [busqueda, consultar]);

  async function elegir(c: CompraCandidata) {
    setCargando(c.id);
    const r = await buscarCompras({ transaccionOriginalId: c.id });
    setCargando(null);
    if (!r.ok) return;
    const { lineas = [] } = r.valor.contexto as { lineas?: readonly LineaDto[] };
    p.alElegir(
      c.id,
      c.titulo,
      lineas.map((l) => ({
        lineaOriginalId: l.lineaId,
        nombre:
          l.destino.tipo === 'deudor' ? tr.deudorPorCobrar(l.destino.nombre) : l.destino.nombre,
        queda: formatearMonto(l.capacidad as Centavos),
        monto: lineas.length === 1 ? p.total : '',
      })),
    );
  }

  if (p.compraId !== '')
    return (
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1.5 text-etiqueta">{t.revisar.compra}</legend>
        <div className="flex min-h-11 items-center justify-between gap-2 rounded-contenedor bg-superficie px-3.5">
          <span className="min-w-0 truncate font-bold">{p.compraNombre}</span>
          <Boton variante="secundaria" onClick={p.alCambiar}>
            {t.revisar.cambiarCompra}
          </Boton>
        </div>
        {p.devueltas.map((d, i) => (
          <EntradaMonto
            key={d.lineaOriginalId}
            nombre={`devueltas.${i}.monto`}
            etiqueta={d.nombre}
            descripcion={t.revisar.queda(d.queda)}
            valor={d.monto}
            alCambiar={(m) => {
              p.alCambiarMonto(i, m);
            }}
            error={p.error(i)}
            prefijo="$"
            sinVistaPrevia
          />
        ))}
      </fieldset>
    );

  const lista = resultado ?? p.candidatas;
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1.5 text-etiqueta">{t.revisar.elegirCompra}</legend>
      <EntradaTexto
        etiqueta={t.revisar.buscarCompra}
        etiquetaOculta
        type="search"
        autoComplete="off"
        placeholder={t.revisar.buscarCompra}
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
        }}
      />
      {lista.length === 0 ? (
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.revisar.sinCompras}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {lista.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-busy={cargando === c.id}
                className="flex min-h-11 w-full cursor-pointer flex-col items-start rounded-contenedor bg-superficie px-3.5 py-2 text-left focus-visible:outline-3 focus-visible:outline-foco"
                onClick={() => void elegir(c)}
              >
                <span className="font-bold">{c.titulo}</span>
                <span className="text-cuerpo-pequeno text-texto-secundario">{c.detalle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.revisar.sinCompra}</p>
    </fieldset>
  );
}
