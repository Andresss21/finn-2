'use client';
// `/ingresar/verificar` (05 §9.4, FE-38): el código de 6 dígitos. Sin envío automático al completarlo (WCAG 3.2.2): se
// envía con el botón o con Enter. Con varios factores se elige por su nombre, con el primero preseleccionado.
// [CH-221 b] Código incorrecto: el campo tiembla (380 ms) con el borde de problema. Verificado: un check y la navegación al
// terminar la espera del token (650 ms). Con movimiento reducido, ni temblor ni espera.
import { useEffect, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Boton } from '../../../componentes/base/boton';
import { EntradaTexto } from '../../../componentes/base/campo';
import { Icono } from '../../../componentes/base/icono';
import { useMovimientoReducido } from '../../../componentes/movimiento/use-movimiento-reducido';
import { duracionToken } from '../../../componentes/movimiento/use-salida';
import { Seleccion } from '../../../componentes/base/seleccion';
import { useFormularioFinn } from '../../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../../formularios/use-operacion';
import { ingreso as t } from '../../../textos/ingreso';
import type { RutasAcceso } from '../acceso';
import { normalizarCodigo } from '../codigo';

const CONTRATO = z.object({
  factorId: z.string().min(1),
  codigo: z.string().regex(/^\d{6}$/, { error: t.codigoSeisDigitos }),
});
type Campos = z.infer<typeof CONTRATO>;

export interface FactorElegible {
  readonly id: string;
  readonly nombre: string | null;
}

export interface PropsFormularioVerificar {
  readonly accion: AccionEscritura;
  /** `salir()`, para "Usar otra cuenta". */
  readonly accionSalir: AccionEscritura;
  readonly factores: readonly FactorElegible[];
  readonly rutas: RutasAcceso;
}

const CODIGOS_DE_CODIGO = ['codigo_incorrecto', 'codigo_vencido'];

export function FormularioVerificar({
  accion,
  accionSalir,
  factores,
  rutas,
}: PropsFormularioVerificar) {
  const alNoAutorizado = (): void => {
    window.location.assign(rutas.ingresar);
  };
  const operacion = useOperacion({ accion, alNoAutorizado });
  const salida = useOperacion({ accion: accionSalir, alNoAutorizado });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: { factorId: factores[0]?.id ?? '', codigo: '' },
    operacion,
  });
  const { register, formState, setValue, setFocus, watch } = formulario;
  const { estado, error } = operacion;
  const pendiente = estado === 'enviando' || estado === 'listo';

  const reducido = useMovimientoReducido();
  useEffect(() => {
    if (estado !== 'listo') return;
    const reloj = setTimeout(
      () => {
        window.location.assign(rutas.destino);
      },
      reducido ? 0 : duracionToken('--duracion-confirmacion'),
    );
    return () => {
      clearTimeout(reloj);
    };
  }, [estado, rutas, reducido]);
  useEffect(() => {
    if (salida.estado === 'listo') window.location.assign(rutas.ingresar);
  }, [salida.estado, rutas]);

  // Cada respuesta de error es un objeto nuevo: cada una vuelve a hacer temblar el campo (alterna dos nombres de animación).
  const errorDeCodigo = error !== undefined && CODIGOS_DE_CODIGO.includes(error.codigo);
  const [errorPrevio, setErrorPrevio] = useState(error);
  const [temblores, setTemblores] = useState(0);
  if (error !== errorPrevio) {
    setErrorPrevio(error);
    if (errorDeCodigo) setTemblores(temblores + 1);
  }

  // CA-01.3: con un código incorrecto o vencido, el campo queda vacío y con el foco.
  useEffect(() => {
    if (error === undefined || !CODIGOS_DE_CODIGO.includes(error.codigo)) return;
    setValue('codigo', '');
    setFocus('codigo');
  }, [error, setValue, setFocus]);

  const errorCodigo = formState.errors.codigo?.message;
  const opciones = factores.map((f, i) => ({
    valor: f.id,
    etiqueta: f.nombre ?? `${t.factor} ${i + 1}`,
  }));
  return (
    <form
      onSubmit={(e) => {
        void formulario.enviar(e);
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <h1 className="text-titulo-seccion">{t.tituloVerificar}</h1>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.introVerificar}</p>
      {error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {error.mensaje}
        </AvisoEnLinea>
      )}
      {factores.length > 1 ? (
        <Seleccion
          etiqueta={t.factor}
          opciones={opciones}
          valor={watch('factorId')}
          alCambiar={(id) => {
            setValue('factorId', id);
          }}
        />
      ) : null}
      <div
        data-temblor={errorDeCodigo && temblores > 0 ? temblores : undefined}
        className={
          errorDeCodigo && temblores > 0 && !reducido
            ? temblores % 2 === 1
              ? 'fz-sacudida'
              : 'fz-sacudida-otra'
            : undefined
        }
      >
        <EntradaTexto
          etiqueta={t.codigo}
          {...(errorDeCodigo ? { className: 'border-2 border-problema-borde' } : {})}
          requerido
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          {...(errorCodigo === undefined ? {} : { error: errorCodigo })}
          {...register('codigo', {
            setValueAs: normalizarCodigo,
            onChange: (e: { target: HTMLInputElement }) => {
              e.target.value = normalizarCodigo(e.target.value);
            },
          })}
        />
      </div>
      {estado === 'listo' ? (
        <p
          role="status"
          data-verificado
          className="flex items-center gap-2 text-cuerpo font-semibold text-positivo-texto"
        >
          <span className="fz-pop-in inline-flex size-8 items-center justify-center rounded-pastilla bg-positivo-fondo">
            <Icono nombre="check" tamano={18} />
          </span>
          {t.verificado}
        </p>
      ) : null}
      <Boton tipo="submit" enviando={pendiente} textoEnviando={t.verificando}>
        {t.verificar}
      </Boton>
      <Boton
        variante="discreta"
        enviando={salida.estado === 'enviando' || salida.estado === 'listo'}
        textoEnviando={t.saliendo}
        onClick={() => {
          void salida.enviar({});
        }}
      >
        {t.usarOtraCuenta}
      </Boton>
    </form>
  );
}
