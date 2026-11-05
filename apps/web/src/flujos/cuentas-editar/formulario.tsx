'use client';
// `/cuentas/[cuentaId]/editar` (FT-53, OP-02; 05 §2.7, §4.7): el flujo largo de corregir el nombre, la institución, los últimos
// cuatro dígitos y la fecha de apertura. Envía solo lo que cambió, cada campo con el valor que vio la persona (`esperado`); si
// la apertura cambia de período, la confirmación trae AV-01. No calcula montos (PF-3): el impacto lo dice el servidor.
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useCallback, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion } from '../../componentes/base/seleccion';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { useBorrador } from '../../formularios/use-borrador';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { formularios } from '../../textos/formularios';

const t = cuentasGestion.editar;
const n = cuentasGestion.comunes;
const SIN_INSTITUCION = 'ninguna';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

export interface PropsFormularioCuentasEditar {
  /** `editarCuenta` (OP-02): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly cuentaId: string;
  readonly hoy: FechaLocal;
  readonly instituciones: readonly { readonly id: string; readonly nombre: string }[];
  /** Lo que vio la persona al abrir (4.6.2): lo vacío es `null`. */
  readonly esperado: Record<string, string | null>;
}

const CONTRATO = z.object({
  nombre: z.string().refine((v) => v.trim() !== '', { error: n.obligatorio }),
  institucionId: z.string(),
  ultimos4: z.string(), // los cuatro dígitos los valida el servidor y vuelve en su campo (4.7)
  fechaApertura: z.string(),
});
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & {
  modo: string;
  revisionVista?: string;
  huellaImpacto?: string;
  esperado: Record<string, string | null>;
};
interface Vista {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

/** Lo que vio la persona, como los campos del formulario. */
const camposDe = (e: Record<string, string | null>): Campos => ({
  nombre: e['nombre'] ?? '',
  institucionId: e['institucionId'] ?? SIN_INSTITUCION,
  ultimos4: e['ultimos4'] ?? '',
  fechaApertura: e['fechaApertura'] ?? '',
});

interface PropsCuerpo extends PropsFormularioCuentasEditar {
  readonly inicial: Campos;
  readonly alUsarActual: (actuales: Record<string, string | null>, escrito: Campos) => void;
}

function Cuerpo({
  accion,
  cuentaId,
  hoy,
  instituciones,
  inicial,
  esperado,
  alUsarActual,
}: PropsCuerpo) {
  const rutaPadre = `/cuentas/${cuentaId}`;
  const enviar = useCallback<AccionEscritura>(
    (payload) => {
      const { modo, esperado: visto, revisionVista, huellaImpacto, ...c } = payload as Cruda;
      const cambia = (k: keyof Campos, valor: string) => (visto[k] ?? '') !== valor;
      const nombre = c.nombre.trim();
      const ultimos4 = c.ultimos4.trim();
      return accion({
        cuentaId,
        ...(cambia('nombre', nombre) ? { nombre } : {}),
        ...(c.institucionId !== SIN_INSTITUCION && cambia('institucionId', c.institucionId)
          ? { institucionId: c.institucionId }
          : {}),
        ...(ultimos4 !== '' && cambia('ultimos4', ultimos4) ? { ultimos4 } : {}),
        ...(cambia('fechaApertura', c.fechaApertura) ? { fechaApertura: c.fechaApertura } : {}),
        esperado: visto,
        modo,
        ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
      });
    },
    [accion, cuentaId],
  );
  const operacion = useOperacion({ accion: enviar, esperado });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const { reset, setValue, formState } = formulario;
  const c = formulario.watch();
  const borrador = useBorrador({
    campos: c,
    operacion,
    entidad: cuentaId,
    restaurar: useCallback(
      (campos: Campos) => {
        reset(campos);
      },
      [reset],
    ),
    alDescartar: useCallback(() => {
      reset(inicial);
    }, [reset, inicial]),
  });
  const poner = (campo: keyof Campos) => (valor: string) => {
    setValue(campo, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const conError = (campo: keyof Campos): { error?: string } => {
    const error = formState.errors[campo]?.message;
    return error === undefined ? {} : { error };
  };
  const { estado, error: fallo } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Vista;
  const actuales = fallo?.datos?.['actuales'] as Record<string, string | null> | undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado' && actuales !== undefined;
  // Un rechazo cuyo mensaje ya está en su campo no se repite como aviso del formulario.
  const enSuCampo = Object.values(fallo?.campos ?? {}).includes(fallo?.mensaje ?? '');

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} />
      </PaginaFlujoDeRuta>
    );

  if (estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <ConfirmacionImpacto
          titulo={n.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          impacto={
            vista.impacto
              ? [
                  n.impactoLpa(
                    `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa)}`,
                  ),
                ]
              : []
          }
          avisos={(vista.avisos ?? []).map((a) => n.avisos[a.codigo] ?? a.codigo)}
          textoConfirmar={n.confirmar}
          textoVolver={n.volverAEditar}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={operacion.volverAEditar}
        />
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        {borrador.recuperado ? (
          <AvisoEnLinea
            estado="informacion"
            aparecioDespues
            accion={
              <Boton variante="secundaria" onClick={borrador.descartar}>
                {formularios.descartarBorrador}
              </Boton>
            }
          >
            {formularios.borradorRecuperado}
          </AvisoEnLinea>
        ) : null}
        <EntradaTexto
          etiqueta={n.nombre}
          requerido
          autoComplete="off"
          {...conError('nombre')}
          {...formulario.register('nombre')}
        />
        <Seleccion
          etiqueta={n.institucion}
          opciones={[
            { valor: SIN_INSTITUCION, etiqueta: n.sinInstitucion },
            ...instituciones.map((i) => ({ valor: i.id, etiqueta: i.nombre })),
          ]}
          valor={c.institucionId}
          alCambiar={poner('institucionId')}
        />
        <EntradaTexto
          etiqueta={n.ultimos4}
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          {...conError('ultimos4')}
          {...formulario.register('ultimos4')}
        />
        <EntradaFecha
          nombre="fechaApertura"
          etiqueta={n.apertura}
          valor={c.fechaApertura as FechaLocal}
          alCambiar={poner('fechaApertura')}
          maxima={hoy}
          hoy={hoy}
          error={formState.errors.fechaApertura?.message}
          requerido
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
                        if (conflicto) alUsarActual(actuales, formulario.getValues());
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
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {t.guardar}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}

export function FormularioCuentasEditar(p: PropsFormularioCuentasEditar) {
  // "Usar el valor actual" (05 §4.7): `esperado` pasa a lo que hay ahora y se conserva lo escrito. `useOperacion` copia
  // `esperado` una sola vez, así que el cuerpo se vuelve a montar con la copia nueva.
  const [base, setBase] = useState({
    esperado: p.esperado,
    version: 0,
    escrito: camposDe(p.esperado),
  });
  return (
    <Cuerpo
      key={base.version}
      {...p}
      esperado={base.esperado}
      inicial={base.escrito}
      alUsarActual={(actuales, escrito) => {
        setBase((b) => ({
          esperado: { ...b.esperado, ...actuales },
          escrito,
          version: b.version + 1,
        }));
      }}
    />
  );
}
