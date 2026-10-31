'use client';
// Inscribir un factor TOTP (05 §9.5, FE-37): lo usan `/ingresar/inscribir` (primero) y `/ajustes/seguridad/factores/nuevo`
// (respaldo). Al abrir llama a `iniciarInscripcion()`; el QR y el secreto viven solo en el estado de este componente: nada
// va al borrador, a `sessionStorage` ni a un evento. Sin envío automático del código (WCAG 3.2.2), como en 9.4.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ingreso as t } from '../../textos/ingreso';

const CONTRATO = z.object({
  factorId: z.string().min(1),
  codigo: z.string().regex(/^\d{6}$/, { error: t.codigoSeisDigitos }),
});
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

const CODIGOS_DE_CODIGO = ['codigo_incorrecto', 'codigo_vencido'];
const quitarEspacios = (texto: string): string => texto.replace(/[\s-]/g, '');
/** Grupos de 4 caracteres (05 §9.5, paso 2). */
const agrupar = (secreto: string): string => secreto.replace(/(.{4})(?=.)/g, '$1 ');
/** El SVG de Supabase como imagen: no se inserta como HTML. */
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
  const { register, formState, setValue, setFocus } = formulario;
  const { estado, error } = operacion;

  useEffect(() => {
    if (estado === 'listo') alTerminar();
  }, [estado, alTerminar]);

  // Código incorrecto o vencido: el campo queda vacío y con el foco, como en 9.4
  useEffect(() => {
    if (error === undefined || !CODIGOS_DE_CODIGO.includes(error.codigo)) return;
    setValue('codigo', '');
    setFocus('codigo');
  }, [error, setValue, setFocus]);

  const errorCodigo = formState.errors.codigo?.message;
  return (
    <form
      onSubmit={(e) => {
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
        className="mx-auto size-50 rounded-control"
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
      {error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {error.mensaje}
        </AvisoEnLinea>
      )}
      <EntradaTexto
        etiqueta={t.codigo}
        requerido
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        {...(errorCodigo === undefined ? {} : { error: errorCodigo })}
        {...register('codigo', {
          setValueAs: quitarEspacios,
          onChange: (e: { target: HTMLInputElement }) => {
            e.target.value = quitarEspacios(e.target.value);
          },
        })}
      />
      <Boton tipo="submit" enviando={estado === 'enviando'} textoEnviando={t.confirmando}>
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
