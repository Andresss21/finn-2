'use client';
// `/cuentas/[cuentaId]/condiciones` (FT-55, OP-48; 05 §2.7, §4.7): el flujo largo de registrar o corregir la tasa, el seguro, la
// cuota y el plazo de un préstamo. Envía solo lo que cambió, cada campo con el valor que vio la persona (`esperado`). No
// calcula montos (PF-3): la tabla de amortización la dibuja el detalle con lo que dice el servidor.
import { useCallback, useMemo, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion } from '../../componentes/base/seleccion';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useBorrador } from '../../formularios/use-borrador';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { editarCondicionesPrestamo } from '../../servidor/acciones/cuentas';
import { cuentasCondiciones as t } from '../../textos/cuentas-condiciones';
import { formularios } from '../../textos/formularios';
import {
  DESCRIPTORES,
  aEntradaDeAccion,
  actualesDe,
  contratoDe,
  esperadoDe,
  visible,
  type Campos,
  type Clave,
  type Descriptor,
} from './campos';

export interface PropsFormularioCuentasCondiciones {
  readonly prestamoId: string;
  /** Lo que vio la persona al abrir, como texto de formulario. */
  readonly visto: Campos;
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const opciones = (m: Readonly<Record<string, string>>) =>
  Object.entries(m).map(([valor, etiqueta]) => ({ valor, etiqueta }));

function Cuerpo({
  prestamoId,
  visto,
  inicial,
  alUsarActual,
}: PropsFormularioCuentasCondiciones & {
  readonly inicial: Campos;
  readonly alUsarActual: (actuales: Partial<Campos>, escrito: Campos) => void;
}) {
  const rutaPadre = `/cuentas/${prestamoId}`;
  const enviar = useCallback<AccionEscritura>(
    (payload) => editarCondicionesPrestamo(aEntradaDeAccion(prestamoId, visto, payload)),
    [prestamoId, visto],
  );
  const operacion = useOperacion({ accion: enviar, esperado: esperadoDe(visto) });
  const contrato = useMemo(() => contratoDe(visto), [visto]);
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: inicial,
    operacion,
  });
  const { reset, setValue, formState } = formulario;
  const c = formulario.watch();
  const borrador = useBorrador({
    campos: c,
    operacion,
    entidad: prestamoId,
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
  const poner = (n: Clave) => (valor: string) => {
    setValue(n, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const { estado, error: fallo } = operacion;
  const actuales = fallo?.datos?.['actuales'] as Record<string, unknown> | undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado' && actuales !== undefined;
  // Un rechazo cuyo mensaje ya está en su campo no se repite como aviso del formulario.
  const enSuCampo = Object.values(fallo?.campos ?? {}).includes(fallo?.mensaje ?? '');

  function campo(x: Descriptor) {
    if (!visible(x, c)) return null;
    const mensaje = formState.errors[x.n]?.message;
    const conError = mensaje === undefined ? {} : { error: mensaje };
    if (x.clase === 'monto')
      return (
        <EntradaMonto
          key={x.n}
          nombre={x.n}
          etiqueta={x.etiqueta}
          valor={c[x.n]}
          alCambiar={poner(x.n)}
          error={mensaje}
          requerido={x.requerido}
        />
      );
    if (x.clase === 'opciones')
      return (
        <Seleccion
          key={x.n}
          etiqueta={x.etiqueta}
          opciones={opciones(x.opciones ?? {})}
          valor={c[x.n]}
          alCambiar={poner(x.n)}
          {...conError}
        />
      );
    return (
      <EntradaTexto
        key={x.n}
        etiqueta={x.etiqueta}
        requerido={x.requerido}
        inputMode={x.clase === 'texto' ? 'text' : x.clase === 'entero' ? 'numeric' : 'decimal'}
        autoComplete="off"
        {...conError}
        {...formulario.register(x.n)}
      />
    );
  }

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} />
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.nota}</p>
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
        {DESCRIPTORES.map(campo)}
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
                        if (conflicto) alUsarActual(actualesDe(actuales), formulario.getValues());
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

export function FormularioCuentasCondiciones(p: PropsFormularioCuentasCondiciones) {
  // "Usar el valor actual" (05 §4.7): lo visto pasa a lo que hay ahora y se conserva lo escrito. `useOperacion` copia `esperado`
  // una sola vez, así que el cuerpo se vuelve a montar con la copia nueva.
  const [base, setBase] = useState({ visto: p.visto, version: 0, escrito: p.visto });
  return (
    <Cuerpo
      key={base.version}
      prestamoId={p.prestamoId}
      visto={base.visto}
      inicial={base.escrito}
      alUsarActual={(actuales, escrito) => {
        setBase((b) => ({ visto: { ...b.visto, ...actuales }, escrito, version: b.version + 1 }));
      }}
    />
  );
}
