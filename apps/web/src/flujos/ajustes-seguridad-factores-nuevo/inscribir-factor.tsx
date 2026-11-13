'use client';
// Inscribir un factor TOTP (05 §9.5, FE-37): lo usan `/ingresar/inscribir` (primero) y `/ajustes/seguridad/factores/nuevo`
// (respaldo). Al abrir llama a `iniciarInscripcion()`; el QR y el secreto viven solo en el estado de este componente: nada
// va al borrador, a `sessionStorage` ni a un evento. Sin envío automático del código (WCAG 3.2.2), como en 9.4.
// [CH-241] Las mismas seis casillas que `/ingresar/verificar`: código incorrecto, el grupo tiembla con el borde de problema y el
// mensaje en línea; confirmado, la cascada, un check y el cierre al terminar la espera del token. Con movimiento reducido, ni
// temblor ni espera. Solo presentación: `completarInscripcion` y la sesión no cambian.
// [CH-240, E2-6, E2-7] Preparando (esqueleto con `aria-busy` y el envío deshabilitado con su motivo), copiado en el botón, error
// con «Intentar de nuevo»; el respaldo pide su nombre antes del QR y vuelve a Seguridad con el resultado, sin pantalla de cierre.
import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Icono } from '../../componentes/base/icono';
import { CodigoTotp, useErrorDeCodigo } from '../../componentes/formularios/codigo-totp';
import { useMovimientoReducido } from '../../componentes/movimiento/use-movimiento-reducido';
import { duracionToken } from '../../componentes/movimiento/use-salida';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { Barra } from '../../componentes/navegacion/esqueleto';
import { useIrA } from '../../componentes/navegacion/use-ir-a';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { CASILLAS, campoCodigo } from '../../app/ingresar/codigo';
import { codigoTotp } from '../../textos/codigo-totp';
import { ingreso as t } from '../../textos/ingreso';

const CONTRATO = z.object({ codigo: campoCodigo });
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
  /** Los nombres de los factores que ya existen: un nombre repetido se rechaza en el campo, antes del QR (E2-7). */
  readonly nombresUsados?: readonly string[];
  /** `salir()` (CH-257): si viene, el primer factor ofrece «Usar otra cuenta» bajo el botón de confirmar. */
  readonly accionSalir?: AccionEscritura;
}

/** Grupos de 4 caracteres (05 §9.5, paso 2). */
const agrupar = (secreto: string): string => secreto.replace(/(.{4})(?=.)/g, '$1 ');
/** El SVG (`qrSvg`, sin prefijo: CH-67) como imagen: no se inserta como HTML. */
const urlDeQr = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Un enlace con el aspecto de un botón tonal (05 §10.7): al menos 44 px de alto (05 §11.5). */
const ENLACE_TONAL =
  'inline-flex min-h-12 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const TITULO = 'text-titulo-seccion';
// Clases literales (L13): la tarjeta de `--superficie` con elevación, en las tres composiciones de esta pantalla.
const TARJETA = {
  qr: 'flex justify-center rounded-contenedor bg-superficie p-4 shadow-elevacion-1',
  esqueleto: 'flex flex-col gap-2 rounded-contenedor bg-superficie px-4 py-3 shadow-elevacion-1',
  clave:
    'flex items-center justify-between gap-3 rounded-contenedor bg-superficie px-4 py-3 shadow-elevacion-1',
} as const;

function Cierre({ destino }: Pick<PropsInscribirFactor, 'destino'>) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className={TITULO}>{t.tituloListo}</h1>
      <AvisoEnLinea estado="positivo" titulo={t.factorVerificado} aparecioDespues>
        {t.autenticadorInscrito}
      </AvisoEnLinea>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.recomendarRespaldo}</p>
      <EnlaceFinn href="/ajustes/seguridad/factores/nuevo" className={ENLACE_TONAL}>
        {t.agregarRespaldo}
      </EnlaceFinn>
      <Boton
        onClick={() => {
          window.location.assign(destino);
        }}
      >
        {t.seguirAFinn}
      </Boton>
    </section>
  );
}

/** El nombre del respaldo, antes del QR (E2-7): «Respaldo» ya escrito; después de «Seguir» no se puede cambiar. */
function PasoNombre({
  nombre,
  usados,
  alSeguir,
}: {
  readonly nombre: string;
  readonly usados: readonly string[];
  readonly alSeguir: (nombre: string) => void;
}) {
  const [valor, setValor] = useState(nombre);
  const [error, setError] = useState<string | undefined>(undefined);
  const enviar = (e: SyntheticEvent): void => {
    e.preventDefault();
    const limpio = valor.trim();
    const repetido = usados.some((u) => u.trim().toLowerCase() === limpio.toLowerCase());
    if (limpio === '' || repetido) {
      setError(limpio === '' ? t.escribiNombre : t.nombreRepetido);
      return;
    }
    setError(undefined);
    alSeguir(limpio);
  };
  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <h1 className={TITULO}>{t.tituloFactorRespaldo}</h1>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.introFactorRespaldo}</p>
      <EntradaTexto
        etiqueta={t.nombreDelFactor}
        requerido
        descripcion={t.nombreNoSeCambia}
        autoComplete="off"
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
        }}
        {...(error === undefined ? {} : { error })}
      />
      <Boton tipo="submit">{t.seguir}</Boton>
    </form>
  );
}

interface PropsPasoCodigo extends Pick<PropsInscribirFactor, 'completar'> {
  readonly alNoAutorizado: () => void;
  readonly titulo: string;
  /** `undefined` mientras se prepara (o falló): el esqueleto y el envío deshabilitado con su motivo. */
  readonly inscripcion: Inscripcion | undefined;
  /** El nombre que va a tener el factor; en el respaldo se muestra de solo lectura. */
  readonly nombreFijo: string | undefined;
  readonly errorDeInicio: { readonly mensaje: string } | undefined;
  readonly reintentar: () => void;
  readonly alTerminar: () => void;
  readonly marcarCierre: boolean;
  readonly etiquetaEnviar: string;
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

/** «Usar otra cuenta» (CH-257): cierra la sesión con `salir()` y vuelve a `/ingresar`. Botón tonal de ancho completo. */
function BotonSalir({
  accion,
  rutaIngresar,
}: {
  readonly accion: AccionEscritura;
  readonly rutaIngresar: string;
}) {
  const alNoAutorizado = useCallback((): void => {
    window.location.assign(rutaIngresar);
  }, [rutaIngresar]);
  const salida = useOperacion({ accion, alNoAutorizado });
  useEffect(() => {
    if (salida.estado === 'listo') window.location.assign(rutaIngresar);
  }, [salida.estado, rutaIngresar]);
  return (
    <Boton
      variante="secundaria"
      className="min-h-12 w-full"
      enviando={salida.estado === 'enviando' || salida.estado === 'listo'}
      textoEnviando={t.saliendo}
      onClick={() => {
        void salida.enviar({});
      }}
    >
      {t.usarOtraCuenta}
    </Boton>
  );
}

function Preparando() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className={TARJETA.qr} aria-hidden="true">
        <span className="block size-50 rounded-control bg-superficie-hundida" />
      </div>
      <div className={TARJETA.esqueleto} aria-hidden="true">
        <Barra ancho="w-1/4" />
        <Barra ancho="w-3/4" />
      </div>
      <p role="status" className="text-cuerpo-pequeno text-texto-secundario">
        {t.preparando}
      </p>
    </div>
  );
}

function PasoCodigo({
  completar,
  alNoAutorizado,
  titulo,
  inscripcion,
  nombreFijo,
  errorDeInicio,
  reintentar,
  alTerminar,
  marcarCierre,
  etiquetaEnviar,
}: PropsPasoCodigo) {
  const factorId = useRef<string | undefined>(undefined);
  factorId.current = inscripcion?.factorId;
  const accion = useMemo(() => {
    const base = conMarcaDeCierre(completar, marcarCierre);
    const conFactor: AccionEscritura = (entrada) =>
      base({ ...(entrada as object), factorId: factorId.current });
    return conFactor;
  }, [completar, marcarCierre]);
  const operacion = useOperacion({ accion, alNoAutorizado });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: { codigo: '' },
    operacion,
  });
  const [copiada, setCopiada] = useState(false);
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
        if (inscripcion === undefined) {
          e.preventDefault();
          return;
        }
        if (valor.length < CASILLAS) codigo.control.current?.enfocar(valor.length);
        void formulario.enviar(e);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <h1 className={TITULO}>{titulo}</h1>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.introInscribir}</p>
      {nombreFijo === undefined ? null : (
        <EntradaTexto
          etiqueta={t.nombreDelFactor}
          requerido
          readOnly
          value={nombreFijo}
          onChange={() => undefined}
        />
      )}
      {errorDeInicio !== undefined ? (
        <>
          <AvisoEnLinea estado="problema" titulo={t.errorPreparar} aparecioDespues>
            {errorDeInicio.mensaje}
          </AvisoEnLinea>
          <Boton variante="secundaria" onClick={reintentar}>
            {t.intentarDeNuevo}
          </Boton>
        </>
      ) : inscripcion === undefined ? (
        <Preparando />
      ) : (
        <>
          <div className={TARJETA.qr}>
            <img
              src={urlDeQr(inscripcion.qrSvg)}
              alt={t.altQr}
              width={200}
              height={200}
              className="size-50 rounded-control bg-marca-icono-figura p-3"
            />
          </div>
          <div className={TARJETA.clave}>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm text-texto-secundario">{t.secreto}</span>
              <span
                className="text-cuerpo font-semibold tracking-widest break-all text-texto"
                data-testid="secreto"
              >
                {agrupar(inscripcion.secreto)}
              </span>
            </div>
            <Boton
              variante="secundaria"
              className="min-h-11 shrink-0"
              onClick={() => {
                void navigator.clipboard
                  .writeText(inscripcion.secreto)
                  .then(() => {
                    setCopiada(true);
                  })
                  .catch(() => {
                    setCopiada(false);
                  });
              }}
            >
              <Icono nombre={copiada ? 'check' : 'copy'} tamano={18} />
              {copiada ? t.copiado : t.copiar}
            </Boton>
            <span role="status" className="sr-only">
              {copiada ? t.copiado : ''}
            </span>
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
        </>
      )}
      <Boton
        tipo="submit"
        enviando={estado === 'enviando' || estado === 'listo'}
        textoEnviando={t.confirmando}
        deshabilitado={inscripcion === undefined}
        {...(inscripcion === undefined ? { motivoDeshabilitado: t.esperaCodigo } : {})}
      >
        {etiquetaEnviar}
      </Boton>
    </form>
  );
}

/** Pide el QR al abrir y arma el paso del código. Una recarga empieza otra inscripción (CA-02.1). */
function PasoInscripcion({
  iniciar,
  completar,
  nombre,
  esRespaldo,
  destino,
  rutaIngresar,
  accionSalir,
  alTerminarPrimero,
}: Omit<PropsInscribirFactor, 'cerrado' | 'nombresUsados'> & {
  readonly alTerminarPrimero: () => void;
}) {
  const irA = useIrA();
  const alNoAutorizado = useCallback((): void => {
    window.location.assign(rutaIngresar);
  }, [rutaIngresar]);
  const inicio = useOperacion({ accion: iniciar, alNoAutorizado });
  const { enviar: iniciarInscripcion } = inicio;
  const inscripcion =
    inicio.estado === 'listo' ? (inicio.exito?.valor as Inscripcion | undefined) : undefined;

  const pedida = useRef(false);
  useEffect(() => {
    if (pedida.current) return;
    pedida.current = true;
    void iniciarInscripcion({ nombre });
  }, [iniciarInscripcion, nombre]);

  const paso = (
    <PasoCodigo
      completar={completar}
      alNoAutorizado={alNoAutorizado}
      titulo={esRespaldo ? t.tituloFactorRespaldo : t.tituloInscribir}
      inscripcion={inscripcion}
      nombreFijo={esRespaldo ? nombre : undefined}
      errorDeInicio={inicio.error}
      reintentar={() => {
        void iniciarInscripcion({ nombre });
      }}
      marcarCierre={!esRespaldo}
      etiquetaEnviar={esRespaldo ? t.verificar : t.confirmar}
      alTerminar={() => {
        // El respaldo no tiene pantalla de cierre: Seguridad muestra el resultado en su lugar (E2-7)
        if (esRespaldo) irA(`${destino}?agregado=${encodeURIComponent(nombre)}`, true);
        else alTerminarPrimero();
      }}
    />
  );
  if (accionSalir === undefined || esRespaldo) return paso;
  return (
    <div className="flex flex-col gap-5">
      {paso}
      <BotonSalir accion={accionSalir} rutaIngresar={rutaIngresar} />
    </div>
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
  nombresUsados = [],
  accionSalir,
}: PropsInscribirFactor) {
  const [terminado, setTerminado] = useState(cerrado);
  const [elegido, setElegido] = useState<string | undefined>(esRespaldo ? undefined : nombre);

  if (terminado) return <Cierre destino={destino} />;
  if (elegido === undefined)
    return <PasoNombre nombre={nombre} usados={nombresUsados} alSeguir={setElegido} />;
  return (
    <PasoInscripcion
      iniciar={iniciar}
      completar={completar}
      nombre={elegido}
      esRespaldo={esRespaldo}
      destino={destino}
      rutaIngresar={rutaIngresar}
      {...(accionSalir === undefined ? {} : { accionSalir })}
      alTerminarPrimero={() => {
        setTerminado(true);
      }}
    />
  );
}
