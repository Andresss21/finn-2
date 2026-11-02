'use client';
// `/presupuesto/mover` (FT-11, OP-15; 05 §2.3, §4.4, §4.7): el flujo corto de pasar dinero de una categoría a otra en un
// período activo o futuro. Muestra lo que trae el servidor y envía `esperado` con las dos asignaciones que vio al abrir
// (CP-10a). Listo para asignar no cambia, así que no hay confirmación; origen igual a destino y los demás rechazos los dice el
// servidor. `conflicto_desactualizado` ofrece los valores actuales. No calcula montos (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Seleccion, type Opcion } from '../../componentes/base/seleccion';
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
type Cruda = Campos & { modo: string };
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
      const { modo, origenId, destinoId, monto } = payload as Cruda;
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
      });
    },
    [periodoInicio, asignados],
  );
  const operacion = useOperacion({ accion: enviar });
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

  if (estado === 'listo')
    return (
      <>
        <p role="status">{t.listo}</p>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} superpuesto={superpuesto} />
      </>
    );

  const opciones: readonly Opcion[] = p.categorias.map((k) => ({
    valor: k.id,
    etiqueta: t.categoriaConDisponible(k.nombre, formatearMonto(k.disponible)),
  }));
  const errores = formulario.formState.errors;
  return (
    <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
      <Seleccion
        etiqueta={t.origen}
        opciones={opciones}
        valor={c.origenId}
        alCambiar={(v) => {
          formulario.setValue('origenId', v, { shouldDirty: true });
        }}
        {...(errores.origenId?.message === undefined ? {} : { error: errores.origenId.message })}
      />
      <Seleccion
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
      />
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
      <Boton
        tipo="submit"
        enviando={estado === 'enviando'}
        textoEnviando={t.moviendo}
        deshabilitado={!operacion.enLinea}
        {...(operacion.motivoSinEnvio === undefined
          ? {}
          : { motivoDeshabilitado: operacion.motivoSinEnvio })}
      >
        {t.mover}
      </Boton>
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
