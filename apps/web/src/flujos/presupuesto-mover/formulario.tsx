'use client';
// `/presupuesto/mover` (FT-11, OP-15; 05 §2.3, §4.4, §4.7): el flujo corto de pasar dinero de una categoría a otra en un
// período activo o futuro. Muestra lo que trae el servidor y envía `esperado` con las dos asignaciones que vio al abrir
// (CP-10a). D-6 (CA-11.2): mover más que el Disponible se acepta; con origen, destino y monto válidos se pide la previsualización
// de OP-15 y el impacto va en la misma pantalla (el aviso con el negativo y los dos Disponibles). Los rechazos los dice el
// servidor al confirmar. `conflicto_desactualizado` ofrece los valores actuales. No calcula montos (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
} from '../../componentes/navegacion/flujo-de-ruta';
import { centavosATextoDecimal, formatearMonto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { moverDinero } from '../../servidor/acciones/presupuesto';
import { formularios } from '../../textos/formularios';
import { presupuestoMover as t } from '../../textos/presupuesto-mover';
import { PieDeHoja } from '../pie-de-hoja';
import { ImpactoMover } from './impacto';

export interface CategoriaParaMover {
  readonly id: string;
  readonly nombre: string;
  readonly asignado: Centavos;
  readonly disponible: Centavos;
}

export interface PropsFormularioMover {
  readonly periodoInicio: string;
  readonly categorias: readonly CategoriaParaMover[];
  readonly origenInicial: string;
  readonly destinoInicial: string;
  /** La pantalla a la que vuelve la página completa al terminar (`cerrarFlujo()`, 05 §1.4). */
  readonly rutaPadre: string;
  readonly superpuesto: boolean;
}

const CONTRATO = z.object({
  origenId: z.string().min(1, { error: t.elegirCategoria }),
  destinoId: z.string().min(1, { error: t.elegirCategoria }),
  monto: z
    .string()
    .refine((v) => normalizarMontoEscrito(v).estado === 'valido', { error: t.obligatorio }),
});
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & { modo: string; revisionVista?: string; huellaImpacto?: string };
interface Vista {
  readonly impacto?: {
    readonly deltaDisponible?: readonly {
      readonly categoriaId: string;
      readonly antes: Centavos;
      readonly despues: Centavos;
    }[];
  } | null;
}
type Asignados = Readonly<Record<string, Centavos>>;
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

interface Actuales {
  readonly asignacionOrigen?: Centavos;
  readonly asignacionDestino?: Centavos;
}

interface PropsCuerpo {
  readonly p: PropsFormularioMover;
  readonly asignados: Asignados;
  readonly inicial: Campos;
  readonly alUsarActuales: (campos: Campos, origen: Centavos, destino: Centavos) => void;
}

function Cuerpo({ p, asignados, inicial, alUsarActuales }: PropsCuerpo) {
  const { periodoInicio, superpuesto, rutaPadre } = p;
  const enviar = useCallback<AccionEscritura>(
    (payload) => {
      const { modo, revisionVista, huellaImpacto, origenId, destinoId, monto } = payload as Cruda;
      const normal = normalizarMontoEscrito(monto);
      return moverDinero({
        origenId,
        destinoId,
        periodoInicio,
        monto: normal.estado === 'valido' ? normal.texto : monto,
        esperado: {
          asignacionOrigen: centavosATextoDecimal(asignados[origenId] ?? (0 as Centavos)),
          asignacionDestino: centavosATextoDecimal(asignados[destinoId] ?? (0 as Centavos)),
        },
        modo,
        ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
      });
    },
    [periodoInicio, asignados],
  );
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const { estado, error: fallo } = operacion;
  const c = formulario.watch();
  const actuales = fallo?.datos?.['actuales'] as Actuales | undefined;
  const conflicto =
    fallo?.codigo === 'conflicto_desactualizado' &&
    actuales?.asignacionOrigen !== undefined &&
    actuales.asignacionDestino !== undefined;

  const vista = (operacion.previsualizacion ?? {}) as Vista;
  // D-6: la previsualización se pide con lo elegido apenas el formulario es válido y cada vez que cambia. Si hay una llamada en
  // vuelo se espera a que termine: `useOperacion` ignora el doble envío (FE-12).
  const clave = JSON.stringify([c.origenId, c.destinoId, c.monto]);
  const valido =
    c.origenId !== '' && c.destinoId !== '' && normalizarMontoEscrito(c.monto).estado === 'valido';
  const pedida = useRef<string | null>(null);
  const [confirmo, setConfirmo] = useState(false);
  const { enviar: pedirImpacto } = formulario;
  useEffect(() => {
    if (estado === 'enviando' || estado === 'listo' || !valido || pedida.current === clave) return;
    pedida.current = clave;
    setConfirmo(false);
    void pedirImpacto();
  }, [clave, valido, estado, pedirImpacto]);

  if (estado === 'listo')
    return (
      <>
        <p role="status">{t.listo}</p>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} superpuesto={superpuesto} />
      </>
    );

  const opciones: readonly OpcionNativa[] = p.categorias.map((k) => ({
    valor: k.id,
    etiqueta: k.nombre,
    detalle: t.disponibleDe(formatearMonto(k.disponible)),
  }));
  const nombreDe = (id: string) => p.categorias.find((k) => k.id === id)?.nombre ?? '';
  const errores = formulario.formState.errors;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (estado === 'confirmando' && valido && pedida.current === clave) {
          setConfirmo(true);
          void operacion.confirmar();
        } else void formulario.enviar();
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <SeleccionNativa
        alta
        marcador={t.elegirCategoria}
        etiqueta={t.origen}
        opciones={opciones}
        valor={c.origenId}
        alCambiar={(v) => {
          formulario.setValue('origenId', v, { shouldDirty: true });
        }}
        {...(errores.origenId?.message === undefined ? {} : { error: errores.origenId.message })}
      />
      <SeleccionNativa
        alta
        marcador={t.elegirCategoria}
        etiqueta={t.destino}
        opciones={opciones}
        valor={c.destinoId}
        alCambiar={(v) => {
          formulario.setValue('destinoId', v, { shouldDirty: true });
        }}
        {...(errores.destinoId?.message === undefined ? {} : { error: errores.destinoId.message })}
      />
      <EntradaMonto
        nombre="monto"
        etiqueta={t.monto}
        valor={c.monto}
        alCambiar={(v) => {
          formulario.setValue('monto', v, {
            shouldDirty: true,
            shouldValidate: formulario.formState.isSubmitted,
          });
        }}
        error={errores.monto?.message}
        requerido
        prefijo="$"
        sinVistaPrevia
      />
      {valido && operacion.previsualizacion === undefined && estado === 'enviando' ? (
        <p role="status" className="text-texto-secundario">
          {t.calculando}
        </p>
      ) : null}
      {valido && vista.impacto?.deltaDisponible !== undefined ? (
        <ImpactoMover
          origen={{ id: c.origenId, nombre: nombreDe(c.origenId) }}
          destino={{ id: c.destinoId, nombre: nombreDe(c.destinoId) }}
          deltas={vista.impacto.deltaDisponible}
          impactoCambio={operacion.impactoCambio}
        />
      ) : null}
      {estado === 'error' && fallo !== undefined ? (
        <AvisoEnLinea
          estado="problema"
          aparecioDespues
          {...(conflicto
            ? {
                accion: (
                  <Boton
                    variante="secundaria"
                    onClick={() => {
                      alUsarActuales(
                        formulario.getValues(),
                        actuales.asignacionOrigen as Centavos,
                        actuales.asignacionDestino as Centavos,
                      );
                    }}
                  >
                    {t.usarValoresActuales}
                  </Boton>
                ),
              }
            : REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                      {formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
        >
          {fallo.mensaje}
          {conflicto
            ? ` ${t.valoresActuales(
                formatearMonto(actuales.asignacionOrigen),
                formatearMonto(actuales.asignacionDestino),
              )}`
            : ''}
        </AvisoEnLinea>
      ) : null}
      <PieDeHoja rutaPadre={rutaPadre} superpuesto={superpuesto}>
        <Boton
          tipo="submit"
          enviando={estado === 'enviando' && confirmo}
          textoEnviando={t.moviendo}
          deshabilitado={!operacion.enLinea || (estado === 'enviando' && !confirmo)}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {t.mover}
        </Boton>
      </PieDeHoja>
    </form>
  );
}

export function FormularioMover(p: PropsFormularioMover) {
  // "Usar los valores actuales": las asignaciones que se envían como `esperado` pasan a lo que hay ahora y se conserva lo
  // escrito. `useOperacion` copia la entrada una sola vez, así que el cuerpo se vuelve a montar.
  const [base, setBase] = useState<{ asignados: Asignados; inicial: Campos; version: number }>({
    asignados: Object.fromEntries(p.categorias.map((k) => [k.id, k.asignado])),
    inicial: { origenId: p.origenInicial, destinoId: p.destinoInicial, monto: '' },
    version: 0,
  });
  const cuerpo = (
    <Cuerpo
      key={base.version}
      p={p}
      asignados={base.asignados}
      inicial={base.inicial}
      alUsarActuales={(campos, origen, destino) => {
        setBase((b) => ({
          asignados: { ...b.asignados, [campos.origenId]: origen, [campos.destinoId]: destino },
          inicial: campos,
          version: b.version + 1,
        }));
      }}
    />
  );
  return p.superpuesto ? (
    <SuperpuestoDeRuta titulo={t.titulo}>{cuerpo}</SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={p.rutaPadre}>
      {cuerpo}
    </PaginaFlujoDeRuta>
  );
}
