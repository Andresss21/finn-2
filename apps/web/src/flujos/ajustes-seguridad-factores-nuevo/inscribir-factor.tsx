'use client';
// Inscribir un factor TOTP (05 §9.5, FE-37): lo usan `/ingresar/inscribir` (primero) y `/ajustes/seguridad/factores/nuevo`
// (respaldo). Al abrir llama a `iniciarInscripcion()`; el QR y el secreto viven solo en el estado de este componente: nada
// va al borrador, a `sessionStorage` ni a un evento. Sin envío automático del código (WCAG 3.2.2), como en 9.4.
// [CH-241] Las mismas seis casillas que `/ingresar/verificar`: código incorrecto, el grupo tiembla con el borde de problema y el
// mensaje en línea; confirmado, la cascada, un check y el cierre al terminar la espera del token. Con movimiento reducido, ni
// temblor ni espera. Solo presentación: `completarInscripcion` y la sesión no cambian.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';
import { CodigoTotp, useErrorDeCodigo } from '../../componentes/formularios/codigo-totp';
import { useMovimientoReducido } from '../../componentes/movimiento/use-movimiento-reducido';
import { duracionToken } from '../../componentes/movimiento/use-salida';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { CASILLAS, campoCodigo } from '../../app/ingresar/codigo';
import { codigoTotp } from '../../textos/codigo-totp';
import { ingreso as t } from '../../textos/ingreso';

const CONTRATO = z.object({ factorId: z.string().min(1), codigo: campoCodigo });
type Campos = z.infer<typeof CONTRATO>;

/** Lo que devuelve `iniciarInscripcion()` (CP-11). */
interface Inscripcion {
  readonly factorId: string;
  readonly qrSvg: string;
  readonly secreto: string;
}

export interface PropsInscribirFactor {
  readonly iniciar: AccionEscritura;
  readonly completar: AccionEscritura;
  /** "Autenticador" para el primer factor, "Respaldo" para el siguiente (05 §9.5). */
  readonly nombre: string;
  readonly esRespaldo: boolean;
  /** A dónde sigue el cierre: `volver` en el primer ingreso, Seguridad en el respaldo. */
  readonly destino: string;
  /** La página se abrió con la marca de cierre y AAL2 (acceso.ts): muestra el cierre sin inscribir nada. */
  readonly cerrado?: boolean;
  /** `/ingresar` con `volver`: a donde va la persona si la sesión venció. */
  readonly rutaIngresar: string;
}

/** Grupos de 4 caracteres (05 §9.5, paso 2). */
const agrupar = (secreto: string): string => secreto.replace(/(.{4})(?=.)/g, '$1 ');
/** El SVG (`qrSvg`, sin prefijo: CH-67) como imagen: no se inserta como HTML. */
const urlDeQr = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Un enlace con el aspecto de un botón (05 §10.7): al menos 44 px de alto (05 §11.5). */
const ENLACES = {
  tonal:
    'inline-flex min-h-12 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco',
  principal:
    'inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco',
  discreto:
    'inline-flex min-h-12 items-center justify-center rounded-control px-5 font-semibold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco',
} as const;

function Cierre({ esRespaldo, destino }: Pick<PropsInscribirFactor, 'esRespaldo' | 'destino'>) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-titulo-pantalla">{esRespaldo ? t.tituloRespaldoListo : t.tituloListo}</h1>
      {esRespaldo ? null : (
        <>
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.recomendarRespaldo}</p>
          <EnlaceFinn href="/ajustes/seguridad/factores/nuevo" className={ENLACES.tonal}>
            {t.agregarRespaldo}
          </EnlaceFinn>
        </>
      )}
      <EnlaceFinn href={destino} className={esRespaldo ? ENLACES.principal : ENLACES.discreto}>
        {esRespaldo ? t.volverASeguridad : t.seguir}
      </EnlaceFinn>
    </section>
  );
}

interface PropsPasoCodigo extends Pick<PropsInscribirFactor, 'completar'> {
  readonly alNoAutorizado: () => void;
  readonly titulo: string;
  readonly inscripcion: Inscripcion;
  readonly alTerminar: () => void;
  readonly marcarCierre: boolean;
}

/**
 * El código correcto fija las cookies de AAL2 y Next vuelve a pintar la página en el servidor, que redirigiría a `volver`.
 * Antes de enviar se agrega `?cierre=1` a la URL (sin navegar) para que el servidor muestre el cierre; si el código falla se quita.
 */
function conMarcaDeCierre(completar: AccionEscritura, marcar: boolean): AccionEscritura {
  if (!marcar) return completar;
  const fijar = (con: boolean): void => {
    const url = new URL(window.location.href);
    if (con) url.searchParams.set('cierre', '1');
    else url.searchParams.delete('cierre');
    window.history.replaceState(null, '', url);
  };
  return async (entrada) => {
    fijar(true);
    const resultado = await completar(entrada);
    if (!resultado.ok) fijar(false);
    return resultado;
  };
}

function PasoCodigo({
  completar,
  alNoAutorizado,
  titulo,
  inscripcion,
  alTerminar,
  marcarCierre,
}: PropsPasoCodigo) {
  const accion = useMemo(
    () => conMarcaDeCierre(completar, marcarCierre),
    [completar, marcarCierre],
  );
  const operacion = useOperacion({ accion, alNoAutorizado });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: { factorId: inscripcion.factorId, codigo: '' },
    operacion,
  });
  const [copiado, setCopiado] = useState(false);
  const { formState, setValue, watch } = formulario;
  const { estado, error } = operacion;

  const reducido = useMovimientoReducido();
  const terminar = useRef(alTerminar);
  terminar.current = alTerminar;
  useEffect(() => {
    if (estado !== 'listo') return;
    const reloj = setTimeout(
      () => {
        terminar.current();
      },
      reducido ? 0 : duracionToken('--duracion-confirmacion'),
    );
    return () => {
      clearTimeout(reloj);
    };
  }, [estado, reducido]);

  // Código incorrecto o vencido: las casillas quedan vacías y con el foco, como en 9.4
  const codigo = useErrorDeCodigo(error, () => {
    setValue('codigo', '');
  });
  const valor = watch('codigo');
  const errorCodigo = formState.errors.codigo?.message ?? codigo.mensaje;
  return (
    <form
      onSubmit={(e) => {
        if (valor.length < CASILLAS) codigo.control.current?.enfocar(valor.length);
        void formulario.enviar(e);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <h1 className="text-titulo-pantalla">{titulo}</h1>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.introInscribir}</p>
      <img
        src={urlDeQr(inscripcion.qrSvg)}
        alt={t.altQr}
        width={200}
        height={200}
        className="mx-auto size-50 rounded-control bg-marca-icono-figura p-3"
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm text-texto-secundario">{t.secreto}</span>
        <div className="flex items-center justify-between gap-3">
          <code className="font-mono text-base break-all text-texto" data-testid="secreto">
            {agrupar(inscripcion.secreto)}
          </code>
          <Boton
            variante="secundaria"
            onClick={() => {
              void navigator.clipboard
                .writeText(inscripcion.secreto)
                .then(() => {
                  setCopiado(true);
                })
                .catch(() => {
                  setCopiado(false);
                });
            }}
          >
            {t.copiar}
          </Boton>
        </div>
        <p role="status" className="min-h-5 text-sm text-texto-secundario">
          {copiado ? t.copiado : ''}
        </p>
      </div>
      {error === undefined || codigo.mensaje !== undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {error.mensaje}
        </AvisoEnLinea>
      )}
      <CodigoTotp
        ref={codigo.control}
        etiqueta={codigoTotp.codigoDeLaApp}
        rotuloVisible
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
      <Boton
        tipo="submit"
        enviando={estado === 'enviando' || estado === 'listo'}
        textoEnviando={t.confirmando}
      >
        {t.confirmar}
      </Boton>
    </form>
  );
}

export function InscribirFactor({
  iniciar,
  completar,
  nombre,
  esRespaldo,
  destino,
  cerrado = false,
  rutaIngresar,
}: PropsInscribirFactor) {
  const alNoAutorizado = useCallback((): void => {
    window.location.assign(rutaIngresar);
  }, [rutaIngresar]);
  const inicio = useOperacion({ accion: iniciar, alNoAutorizado });
  const [terminado, setTerminado] = useState(cerrado);
  const { enviar: iniciarInscripcion } = inicio;
  const inscripcion =
    inicio.estado === 'listo' ? (inicio.exito?.valor as Inscripcion | undefined) : undefined;

  // Al abrir: una recarga empieza otra inscripción y el servidor quita la anterior, sin verificar (CA-02.1)
  const pedida = useRef(false);
  useEffect(() => {
    if (pedida.current || cerrado) return;
    pedida.current = true;
    void iniciarInscripcion({ nombre });
  }, [iniciarInscripcion, nombre, cerrado]);

  if (terminado) return <Cierre esRespaldo={esRespaldo} destino={destino} />;
  const titulo = esRespaldo ? t.tituloRespaldo : t.tituloInscribir;
  if (inscripcion !== undefined)
    return (
      <PasoCodigo
        completar={completar}
        alNoAutorizado={alNoAutorizado}
        titulo={titulo}
        inscripcion={inscripcion}
        marcarCierre={!esRespaldo}
        alTerminar={() => {
          setTerminado(true);
        }}
      />
    );
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-titulo-pantalla">{titulo}</h1>
      {inicio.error === undefined ? (
        <p role="status" className="text-cuerpo-pequeno text-texto-secundario">
          {t.preparando}
        </p>
      ) : (
        <>
          <AvisoEnLinea estado="problema" aparecioDespues>
            {inicio.error.mensaje}
          </AvisoEnLinea>
          <Boton
            variante="secundaria"
            onClick={() => {
              void iniciarInscripcion({ nombre });
            }}
          >
            {t.intentarDeNuevo}
          </Boton>
        </>
      )}
    </section>
  );
}
