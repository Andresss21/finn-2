'use client';
// [CH-277] «¿En qué categorías?» de `/registrar/gasto` (C-49, cierra P-1 de C-45): «Una · Varias». Con «Una», una fila de categoría
// con su Disponible; con «Varias», qué se reparte, los modos, una fila por categoría (lista, monto y × desde tres filas), «+ Agregar
// categoría» y el resumen. La primera fila es «Lo que queda» hasta que se escribe. Una categoría no se repite: en la lista, la usada
// está deshabilitada. Sin «Antes de guardar» (E4-2): el Disponible es el del catálogo, sin cálculos (PF-3).
import { useId, useState } from 'react';
import { EstiloV3, GrupoCampos, MensajeError } from '../../componentes/base/campo';
import { Icono } from '../../componentes/base/icono';
import { SeleccionFila, type OpcionFila } from '../../componentes/base/seleccion-fila';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { formatearMonto } from '../../formato';
import type { ModoReparto } from '../../formularios/reparto';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { filaVacia, type CamposDeRegistro as Campos, type FilaDeCategoria } from './campos';
import { CifraDeParte, ResumenReparto } from './entrada-parte';
import { propuesta, type EstadoDelGasto } from './estado';
import { MODOS } from './quien-paga';

/** Una categoría del catálogo con su Disponible ya formateado (S5): `negativo` lo pinta en problema. */
export interface CategoriaDelCampo {
  readonly id: string;
  readonly nombre: string;
  readonly grupo: string;
  readonly disponible: string;
  readonly negativo: boolean;
}

export interface PropsCategorias {
  readonly c: Campos;
  readonly e: EstadoDelGasto;
  readonly categorias: readonly CategoriaDelCampo[];
  /** El mensaje de `suma_lineas_distinta`: queda junto al resumen (CA-R-15). */
  readonly errorServidor: string | undefined;
  /** «Lo de {persona} va a Por cobrar.» con una sola persona; con más, «Lo de las demás personas». */
  readonly personaUnica: string | undefined;
  readonly poner: (parcial: Partial<Campos>) => void;
  readonly alSalir: () => void;
  readonly anunciar: (texto: string) => void;
}

export function Categorias({
  c,
  e,
  categorias,
  errorServidor,
  personaUnica,
  poner,
  alSalir,
  anunciar,
}: PropsCategorias) {
  const id = useId();
  // La fila recién agregada abre su lista (C-49 §1).
  const [abrir, setAbrir] = useState<number>();
  const varias = c.varias && c.filas.length > 1;
  const nombre = (categoriaId: string) => categorias.find((x) => x.id === categoriaId)?.nombre;
  const opciones = (i: number): OpcionFila[] =>
    categorias.map((x) => ({
      valor: x.id,
      etiqueta: x.nombre,
      grupo: x.grupo,
      detalle: t.disponible(x.disponible),
      negativo: x.negativo,
      deshabilitada: c.filas.some((f, k) => k !== i && f.categoriaId === x.id)
        ? t.yaEstaEnOtraFila
        : undefined,
    }));
  const cambiarFilas = (filas: FilaDeCategoria[]) => {
    poner({ filas });
  };
  const agregar = (filas: readonly FilaDeCategoria[]) => {
    setAbrir(filas.length);
    const nuevas = [...filas, filaVacia()];
    cambiarFilas(c.modoCategorias === 'porcentaje' ? propuesta('porcentaje', e.mia, nuevas) : nuevas);
  };
  const primera = c.filas[0] ?? filaVacia();
  const quitar = (i: number) => {
    setAbrir(undefined);
    cambiarFilas(c.filas.filter((_, k) => k !== i));
    anunciar(t.anuncioQuitada);
  };
  const resumen = varias ? e.resumenCategorias : undefined;
  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-t`} className="text-titulo-seccion">
          {c.conAlguien ? t.enQueCategoriasTuParte : t.enQueCategorias}
        </h2>
        <EstiloV3>
          <div className="w-42 shrink-0">
            <SelectorSegmentado
              etiqueta={t.cuantasCategorias}
              opciones={[
                { valor: 'una', etiqueta: t.una },
                { valor: 'varias', etiqueta: t.varias },
              ]}
              valor={varias ? 'varias' : 'una'}
              llena
              alCambiar={(v) => {
                if (v === 'varias') {
                  setAbrir(1);
                  poner({
                    varias: true,
                    modoCategorias: 'montos',
                    filas: [{ ...primera, monto: '', pct: '', auto: true }, filaVacia()],
                  });
                  anunciar(t.anuncioVarias);
                } else {
                  poner({ varias: false, filas: [{ ...primera, auto: false }] });
                  anunciar(t.anuncioUna(nombre(primera.categoriaId) ?? t.elegiUnaCategoria));
                }
              }}
            />
          </div>
        </EstiloV3>
      </div>
      {varias ? (
        <>
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {c.conAlguien
              ? t.repartisTuParte(
                  formatearMonto(e.mia),
                  personaUnica,
                )
              : t.repartisElTotal(formatearMonto(e.total))}
          </p>
          <EstiloV3>
            <SelectorSegmentado
              etiqueta={t.comoRepartir}
              opciones={MODOS()}
              valor={c.modoCategorias}
              llena
              alCambiar={(v) => {
                const modo = v as ModoReparto;
                poner({ modoCategorias: modo, filas: propuesta(modo, e.mia, c.filas) });
                anunciar(t.anuncioModo(MODOS().find((m) => m.valor === modo)?.etiqueta ?? ''));
              }}
            />
          </EstiloV3>
        </>
      ) : null}
      <GrupoCampos>
        {(varias ? c.filas : [primera]).map((f, i) => {
          const cual = nombre(f.categoriaId) ?? t.filaN(i + 1);
          const pct = c.modoCategorias === 'porcentaje';
          const monto = formatearMonto(e.categorias.montos[i] ?? e.mia);
          const escribir = (v: string) => {
            cambiarFilas(
              c.filas.map((x, k) =>
                k === i ? { ...x, ...(pct ? { pct: v } : { monto: v, auto: false }) } : x,
              ),
            );
          };
          return (
            <SeleccionFila
              key={`${String(i)}-${String(c.filas.length)}`}
              etiqueta={t.categoria}
              etiquetaOculta={varias}
              abiertaAlMontar={varias && abrir === i}
              marcador={t.elegiUnaCategoria}
              opciones={opciones(i)}
              valor={f.categoriaId}
              error={e.errorFilas[i]}
              alCambiar={(v) => {
                cambiarFilas(c.filas.map((x, k) => (k === i ? { ...x, categoriaId: v } : x)));
                if (varias) anunciar(t.anuncioEnFila(nombre(v) ?? '', i + 1));
              }}
              derecha={
                varias ? (
                  <>
                    <CifraDeParte
                      modo={c.modoCategorias}
                      etiqueta={pct ? t.porcentajePara(cual) : t.montoPara(cual)}
                      valor={pct ? f.pct : i === 0 && f.auto ? '' : f.monto}
                      monto={monto}
                      nota={pct ? monto : i === 0 && f.auto ? t.loQueQueda : undefined}
                      notaInformativa={!pct}
                      error={e.errorFilas[i] === t.cadaParte || resumen?.error === true}
                      alCambiar={escribir}
                      alSalir={alSalir}
                    />
                    {c.filas.length >= 3 ? (
                      <button
                        type="button"
                        className="parte-quitar"
                        aria-label={t.quitarCategoria(cual)}
                        onClick={() => {
                          quitar(i);
                        }}
                      >
                        <Icono nombre="x" tamano={18} />
                      </button>
                    ) : null}
                  </>
                ) : undefined
              }
            />
          );
        })}
        {varias ? (
          <div className="campo-fila reparto-agregar">
            <button
              type="button"
              disabled={e.enElMaximo}
              onClick={() => {
                agregar(c.filas);
                anunciar(t.anuncioAgregada);
              }}
            >
              <Icono nombre="plus" tamano={18} />
              {t.agregarCategoria}
            </button>
          </div>
        ) : null}
      </GrupoCampos>
      {e.enElMaximo ? (
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.maximoLineas}</p>
      ) : null}
      {resumen === undefined ? null : <ResumenReparto {...resumen} />}
      {errorServidor === undefined ? null : <MensajeError>{errorServidor}</MensajeError>}
    </section>
  );
}
