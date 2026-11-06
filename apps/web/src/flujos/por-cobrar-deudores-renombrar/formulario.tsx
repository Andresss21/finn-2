'use client';
// `/por-cobrar/deudores/[deudorId]/renombrar` (FT-48, OP-52; 05 §2, §4.7): el flujo corto de corregir el nombre de un deudor.
// Envía el nombre nuevo con el que vio la persona como `esperado` (4.6.2). No calcula montos (PF-3): el nombre no toca ninguno.
import { useCallback, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { porCobrarRenombrar as t } from '../../textos/por-cobrar';

const RUTA_PADRE = '/por-cobrar';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

export interface PropsFormularioPorCobrarRenombrar {
  /** `renombrarDeudor` (OP-52): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly deudorId: string;
  /** El nombre que vio la persona al abrir: es el `esperado`. */
  readonly nombre: string;
}

const CONTRATO = z.object({
  nombre: z.string().refine((v) => v.trim() !== '', { error: t.obligatorio }),
});
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & { modo: string; esperado: { nombre: string } };

interface PropsCuerpo extends PropsFormularioPorCobrarRenombrar {
  readonly inicial: string;
  readonly alUsarActual: (actual: string, escrito: string) => void;
}

function Cuerpo({ accion, deudorId, nombre: visto, inicial, alUsarActual }: PropsCuerpo) {
  const enviar = useCallback<AccionEscritura>(
    (payload) => {
      const { modo, esperado, nombre } = payload as Cruda;
      return accion({ deudorId, nombre: nombre.trim(), esperado, modo });
    },
    [accion, deudorId],
  );
  const operacion = useOperacion({ accion: enviar, esperado: { nombre: visto } });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: { nombre: inicial },
    operacion,
  });
  const { estado, error: fallo } = operacion;
  const actuales = fallo?.datos?.['actuales'] as { nombre?: string } | undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado' && actuales !== undefined;
  // Un rechazo cuyo mensaje ya está en su campo (`nombre_repetido`) no se repite como aviso del formulario.
  const enSuCampo = Object.values(fallo?.campos ?? {}).includes(fallo?.mensaje ?? '');
  const escrito = formulario.watch('nombre');
  const error = formulario.formState.errors.nombre?.message;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.guardado} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  const motivo = !operacion.enLinea
    ? operacion.motivoSinEnvio
    : escrito.trim() === visto
      ? t.sinCambios
      : undefined;
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={RUTA_PADRE}>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        <EntradaTexto
          etiqueta={t.nombre}
          requerido
          autoComplete="off"
          {...(error === undefined ? {} : { error })}
          {...formulario.register('nombre')}
        />
        {estado === 'error' && fallo !== undefined && !enSuCampo ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(conflicto || REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton
                      variante="secundaria"
                      onClick={() => {
                        if (conflicto) alUsarActual(actuales.nombre ?? visto, escrito);
                        else void operacion.reintentar();
                      }}
                    >
                      {conflicto ? t.usarValorActual : formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {fallo.mensaje}
          </AvisoEnLinea>
        ) : null}
        <Boton
          tipo="submit"
          enviando={estado === 'enviando'}
          textoEnviando={t.guardando}
          deshabilitado={motivo !== undefined}
          {...(motivo === undefined ? {} : { motivoDeshabilitado: motivo })}
        >
          {t.guardar}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}

export function FormularioPorCobrarRenombrar(p: PropsFormularioPorCobrarRenombrar) {
  // "Usar el valor actual" (05 §4.7): `esperado` pasa al nombre que hay ahora y se conserva lo escrito. `useOperacion` copia
  // `esperado` una sola vez, así que el cuerpo se vuelve a montar con la copia nueva.
  const [base, setBase] = useState({ visto: p.nombre, escrito: p.nombre, version: 0 });
  return (
    <Cuerpo
      key={base.version}
      {...p}
      nombre={base.visto}
      inicial={base.escrito}
      alUsarActual={(actual, escrito) => {
        setBase((b) => ({ visto: actual, escrito, version: b.version + 1 }));
      }}
    />
  );
}
