'use client';
// `/cuentas/[cuentaId]/editar` (FT-53, OP-02; 05 §2.7, §4.7): el flujo largo de corregir el nombre, la institución, los últimos
// cuatro dígitos y la fecha de apertura; en una tarjeta, también el límite, la tasa, el día de corte y el de pago (CTA-01). Envía solo lo que cambió, cada campo con el valor que vio la persona (`esperado`); si
// la apertura cambia de período, la confirmación trae AV-01. No calcula montos (PF-3): el impacto lo dice el servidor.
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useCallback, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { cuentasNuevaTipos as tarjeta } from '../../textos/cuentas-nueva-tipos';
import { Seleccion } from '../../componentes/base/seleccion';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { useBorrador } from '../../formularios/use-borrador';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { cuentaSubtipo as s } from '../../textos/cuenta-subtipo';
import { formularios } from '../../textos/formularios';

const t = cuentasGestion.editar;
const n = cuentasGestion.comunes;
const SIN_INSTITUCION = 'ninguna';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const SUBTIPOS = ['corriente', 'ahorro', 'billetera'] as const;

export interface PropsFormularioCuentasEditar {
  /** `editarCuenta` (OP-02): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly cuentaId: string;
  readonly hoy: FechaLocal;
  readonly instituciones: readonly { readonly id: string; readonly nombre: string }[];
  /** Lo que vio la persona al abrir (4.6.2): lo vacío es `null`. */
  readonly esperado: Record<string, string | number | null>;
}

const CONTRATO = z.object({
  nombre: z.string().refine((v) => v.trim() !== '', { error: n.obligatorio }),
  subtipoEfectivo: z.string(), // [CH-224] vacío fuera de efectivo
  institucionId: z.string(),
  ultimos4: z.string(), // los cuatro dígitos los valida el servidor y vuelve en su campo (4.7)
  fechaApertura: z.string(),
  // CTA-01: solo una tarjeta los trae (vacíos en las demás cuentas)
  limiteCredito: z.string(),
  tasaAnual: z.string(),
  diaCorte: z.string(),
  diaPago: z.string(),
});
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & {
  modo: string;
  revisionVista?: string;
  huellaImpacto?: string;
  esperado: Record<string, string | number | null>;
};
interface Vista {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

/** Lo que vio la persona, como los campos del formulario. */
const texto = (v: string | number | null | undefined): string =>
  v === null || v === undefined ? '' : `${v}`;
const camposDe = (e: Record<string, string | number | null>): Campos => ({
  nombre: texto(e['nombre']),
  subtipoEfectivo: texto(e['subtipoEfectivo']),
  institucionId:
    e['institucionId'] === null || e['institucionId'] === undefined
      ? SIN_INSTITUCION
      : `${e['institucionId']}`,
  ultimos4: texto(e['ultimos4']),
  fechaApertura: texto(e['fechaApertura']),
  limiteCredito: texto(e['limiteCredito']),
  tasaAnual: texto(e['tasaAnual']),
  diaCorte: texto(e['diaCorte']),
  diaPago: texto(e['diaPago']),
});

interface PropsCuerpo extends PropsFormularioCuentasEditar {
  readonly inicial: Campos;
  readonly alUsarActual: (
    actuales: Record<string, string | number | null>,
    escrito: Campos,
  ) => void;
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
      const cambia = (k: keyof Campos, valor: string) => texto(visto[k]) !== valor;
      const esTarjeta = 'limiteCredito' in visto;
      // CTA-01: de la tarjeta se envía lo que cambió, con el tipo del contrato (días como número; monto y tasa, en texto)
      const deTarjeta = (k: 'limiteCredito' | 'tasaAnual' | 'diaCorte' | 'diaPago') => {
        const v = c[k].trim().replace(',', '.');
        return esTarjeta && v !== '' && cambia(k, v)
          ? { [k]: k === 'diaCorte' || k === 'diaPago' ? Number(v) : v }
          : {};
      };
      const nombre = c.nombre.trim();
      const ultimos4 = c.ultimos4.trim();
      // [CH-224] pasar a billetera quita la institución y los últimos 4 en la misma edición (OP-02)
      const subtipo = c.subtipoEfectivo !== '' && cambia('subtipoEfectivo', c.subtipoEfectivo);
      const aBilletera = subtipo && c.subtipoEfectivo === 'billetera';
      return accion({
        cuentaId,
        ...(cambia('nombre', nombre) ? { nombre } : {}),
        ...(subtipo ? { subtipoEfectivo: c.subtipoEfectivo } : {}),
        ...(aBilletera
          ? { institucionId: null, ultimos4: null }
          : {
              ...(c.institucionId !== SIN_INSTITUCION && cambia('institucionId', c.institucionId)
                ? { institucionId: c.institucionId }
                : {}),
              ...(ultimos4 !== '' && cambia('ultimos4', ultimos4) ? { ultimos4 } : {}),
            }),
        ...(cambia('fechaApertura', c.fechaApertura) ? { fechaApertura: c.fechaApertura } : {}),
        ...deTarjeta('limiteCredito'),
        ...deTarjeta('tasaAnual'),
        ...deTarjeta('diaCorte'),
        ...deTarjeta('diaPago'),
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
  const actuales = fallo?.datos?.['actuales'] as Record<string, string | number | null> | undefined;
  const esTarjeta = 'limiteCredito' in esperado;
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
        {c.subtipoEfectivo === '' ? null : (
          <div className="flex flex-col gap-2">
            <SelectorSegmentado
              etiqueta={s.etiqueta}
              opciones={SUBTIPOS.map((valor) => ({
                valor,
                etiqueta: s.opciones[valor],
              }))}
              valor={c.subtipoEfectivo}
              alCambiar={poner('subtipoEfectivo')}
              llena
            />
            <p className="text-cuerpo-pequeno text-texto-secundario">
              {s.ayudas[c.subtipoEfectivo as (typeof SUBTIPOS)[number]]}
            </p>
          </div>
        )}
        {c.subtipoEfectivo === 'billetera' ? null : (
          <>
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
              placeholder={s.opcional}
              {...conError('ultimos4')}
              {...formulario.register('ultimos4')}
            />
          </>
        )}
        {esTarjeta ? (
          <>
            <EntradaMonto
              nombre="limiteCredito"
              etiqueta={tarjeta.limiteCredito}
              valor={c.limiteCredito}
              alCambiar={poner('limiteCredito')}
              requerido
            />
            <EntradaTexto
              etiqueta={tarjeta.tasaAnual}
              inputMode="decimal"
              autoComplete="off"
              {...conError('tasaAnual')}
              {...formulario.register('tasaAnual')}
            />
            <EntradaTexto
              etiqueta={tarjeta.diaCorte}
              inputMode="numeric"
              autoComplete="off"
              requerido
              {...conError('diaCorte')}
              {...formulario.register('diaCorte')}
            />
            <EntradaTexto
              etiqueta={tarjeta.diaPago}
              inputMode="numeric"
              autoComplete="off"
              requerido
              {...conError('diaPago')}
              {...formulario.register('diaPago')}
            />
          </>
        ) : null}
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
