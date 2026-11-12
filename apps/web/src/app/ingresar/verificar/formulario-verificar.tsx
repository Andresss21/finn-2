'use client';
// `/ingresar/verificar` (05 §9.4, FE-38 [CH-241]): el código en seis casillas. Sin envío automático al completarlo (WCAG
// 3.2.2): se envía con el botón o con Enter. Con varios factores se elige por su nombre, con el primero preseleccionado.
// Código incorrecto: el grupo tiembla con el borde de problema y el mensaje en línea bajo las casillas (ACC-03). Verificado: las
// casillas en cascada, un check y la navegación al terminar la espera del token. Con movimiento reducido, ni temblor ni espera.
import { useEffect } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Boton } from '../../../componentes/base/boton';
import { Icono } from '../../../componentes/base/icono';
import { SeleccionNativa } from '../../../componentes/base/seleccion-nativa';
import { CodigoTotp, useErrorDeCodigo } from '../../../componentes/formularios/codigo-totp';
import { useMovimientoReducido } from '../../../componentes/movimiento/use-movimiento-reducido';
import { duracionToken } from '../../../componentes/movimiento/use-salida';
import { useFormularioFinn } from '../../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../../formularios/use-operacion';
import { codigoTotp } from '../../../textos/codigo-totp';
import { ingreso as t } from '../../../textos/ingreso';
import type { RutasAcceso } from '../acceso';
import { CASILLAS, campoCodigo } from '../codigo';

const CONTRATO = z.object({ factorId: z.string().min(1), codigo: campoCodigo });
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
  const { formState, setValue, watch } = formulario;
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

  // CA-01.3: con un código incorrecto o vencido, las casillas quedan vacías y con el foco.
  const codigo = useErrorDeCodigo(error, () => {
    setValue('codigo', '');
  });
  const valor = watch('codigo');
  const errorCodigo = formState.errors.codigo?.message ?? codigo.mensaje;
  const opciones = factores.map((f, i) => ({
    valor: f.id,
    etiqueta: f.nombre ?? `${t.factor} ${String(i + 1)}`,
    icono: 'lock' as const,
  }));
  return (
    <form
      onSubmit={(e) => {
        if (valor.length < CASILLAS) codigo.control.current?.enfocar(valor.length);
        void formulario.enviar(e);
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <h1 className="text-titulo-seccion">{codigoTotp.tituloVerificar}</h1>
      <p className="text-cuerpo-pequeno text-texto-secundario">{codigoTotp.introVerificar}</p>
      {error === undefined || codigo.mensaje !== undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {error.mensaje}
        </AvisoEnLinea>
      )}
      {factores.length > 1 ? (
        <SeleccionNativa
          etiqueta={t.factor}
          opciones={opciones}
          valor={watch('factorId')}
          marcador={t.factor}
          alCambiar={(id) => {
            setValue('factorId', id);
          }}
        />
      ) : null}
      <CodigoTotp
        ref={codigo.control}
        etiqueta={t.codigo}
        valor={valor}
        alCambiar={(nuevo) => {
          setValue('codigo', nuevo, { shouldValidate: formState.isSubmitted });
        }}
        error={errorCodigo}
        todasConProblema={codigo.mensaje !== undefined && formState.errors.codigo === undefined}
        temblores={codigo.temblores}
        correcto={estado === 'listo'}
      />
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
