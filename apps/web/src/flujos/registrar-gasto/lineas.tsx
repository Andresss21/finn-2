'use client';
// Las líneas de un gasto dividido de `/registrar/gasto` (FT-21; K4 y S5 del export): «Dividir · opcional», la cantidad, una fila
// `[selección 1fr][monto 120][× 44]` por línea, «+ Agregar línea» y la suma contra el total. El destino de cada línea es una sola
// selección, categoría o persona que me debe (`campos.ts`). La suma es la de `sumarMontosEscritos`, la misma de la ayuda de PF-3
// (05 §5.1): no hay cálculo nuevo y la valida el servidor. Revisar movimiento (FT-35) conserva `CampoLineas` y `ParteDeGasto`.
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto, MensajeError } from '../../componentes/base/campo';
import { Icono } from '../../componentes/base/icono';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { sumarMontosEscritos } from '../../formularios/normalizar-monto';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { DEUDOR_NUEVO, destinoDeValor, MAXIMO_PARTES, valorDeDestino, type Parte } from './campos';

type Campo = 'monto' | 'categoriaId' | 'deudorId' | 'deudorNuevo';
interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

export interface PropsLineasDeGasto {
  readonly lineas: readonly Parte[];
  /** Una clave estable por línea (el `id` de `useFieldArray`). */
  readonly claves: readonly string[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  /** El total tal como lo escribió la persona. */
  readonly total: string;
  readonly error: (i: number, campo: Campo) => string | undefined;
  /** El mensaje del servidor o del contrato para el conjunto de líneas. */
  readonly errorDeLasPartes: string | undefined;
  /** La ayuda de PF-3 («Falta repartir $30.00»), ya formateada; no hay cuando todo está repartido. */
  readonly ayuda: string | undefined;
  readonly poner: (nombre: `lineas.${number}.${Campo | 'destino'}`) => (valor: string) => void;
  readonly registroDeudorNuevo: (
    i: number,
  ) => UseFormRegisterReturn<`lineas.${number}.deudorNuevo`>;
  readonly alAgregar: () => void;
  readonly alQuitar: (i: number) => void;
}

export default function LineasDeGasto({
  lineas,
  claves,
  categorias,
  deudores,
  total,
  error,
  errorDeLasPartes,
  ayuda,
  poner,
  registroDeudorNuevo,
  alAgregar,
  alQuitar,
}: PropsLineasDeGasto) {
  const opciones = [
    ...categorias.map((x) => ({
      valor: `c:${x.id}`,
      etiqueta: x.nombre,
      grupo: t.grupoCategorias,
    })),
    ...[...deudores, { id: DEUDOR_NUEVO, nombre: t.otraPersona }].map((x) => ({
      valor: `d:${x.id}`,
      etiqueta: t.porCobrarA(x.nombre),
      grupo: t.grupoPorCobrar,
    })),
  ];
  const suma = sumarMontosEscritos(lineas.map((l) => l.monto));
  return (
    <fieldset className="flex flex-col gap-2.5" data-campo-lineas>
      <legend className="sr-only">{t.partes}</legend>
      <div className="flex min-h-11 items-center justify-between" aria-hidden="true">
        <span className="text-titulo-seccion">{t.dividir}</span>
        <span className="text-cuerpo-pequeno text-texto-terciario">{t.opcional}</span>
      </div>
      <p className="text-rotulo text-texto-secundario" role="status">
        {t.lineas(String(claves.length))}
      </p>
      <div className="flex flex-col gap-2">
        {claves.map((clave, i) => {
          const parte = lineas[i];
          if (parte === undefined) return null;
          const n = String(i + 1);
          return (
            <div key={clave} data-parte={n} className="flex flex-col gap-2">
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_2.75rem] items-start gap-2">
                <SeleccionNativa
                  etiqueta={t.categoriaDeParte(n)}
                  etiquetaOculta
                  marcador={t.elegirDestino}
                  opciones={opciones}
                  valor={valorDeDestino(parte)}
                  alCambiar={(v) => {
                    const d = destinoDeValor(v);
                    poner(`lineas.${i}.destino`)(d.destino);
                    poner(`lineas.${i}.categoriaId`)(d.categoriaId);
                    poner(`lineas.${i}.deudorId`)(d.deudorId);
                  }}
                  error={error(i, parte.destino === 'categoria' ? 'categoriaId' : 'deudorId')}
                />
                <EntradaMonto
                  nombre={`lineas.${i}.monto`}
                  etiqueta={t.montoDeParte(n)}
                  valor={parte.monto}
                  alCambiar={poner(`lineas.${i}.monto`)}
                  error={error(i, 'monto')}
                  requerido
                  compacto
                />
                {claves.length > 1 ? (
                  <button
                    type="button"
                    aria-label={t.quitarParte(n)}
                    onClick={() => {
                      alQuitar(i);
                    }}
                    className="inline-flex size-11 items-center justify-center text-texto-secundario"
                  >
                    <Icono nombre="x" tamano={20} />
                  </button>
                ) : (
                  <span aria-hidden="true" />
                )}
              </div>
              {parte.destino === 'por_cobrar' && parte.deudorId === DEUDOR_NUEVO ? (
                <EntradaTexto
                  etiqueta={t.deudorNuevoDeParte(n)}
                  autoComplete="off"
                  error={error(i, 'deudorNuevo')}
                  {...registroDeudorNuevo(i)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {errorDeLasPartes === undefined ? null : <MensajeError>{errorDeLasPartes}</MensajeError>}
      {claves.length < MAXIMO_PARTES ? (
        <Boton variante="discreta" onClick={alAgregar} className="self-start">
          {t.agregarLinea}
        </Boton>
      ) : null}
      {suma === undefined || total.trim() === '' ? null : (
        <div
          data-testid="suma-lineas"
          className="flex items-center justify-between border-t border-borde-sutil pt-2"
        >
          <span className="text-cuerpo-pequeno text-texto-secundario">{t.sumaDeLineas}</span>
          <span className="flex items-baseline gap-1.5 tabular-nums">
            <span className="font-bold">{formatearMonto(suma)}</span>
            <span className="text-cuerpo-pequeno text-texto-secundario">{t.sumaDe}</span>
            <span className="text-texto-secundario">{formatearMontoTexto(total)}</span>
          </span>
        </div>
      )}
      {ayuda === undefined ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario" data-testid="falta-repartir">
          {ayuda}
        </p>
      )}
    </fieldset>
  );
}
