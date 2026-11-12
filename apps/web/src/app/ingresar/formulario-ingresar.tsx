'use client';
// `/ingresar` (05 §9.3): email y contraseña. Un solo mensaje para cualquier credencial inválida (CA-01.2).
import { useEffect, useId, useRef, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Icono } from '../../componentes/base/icono';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { autenticacion } from '../../textos/autenticacion';
import { ingreso as t } from '../../textos/ingreso';
import type { RutasAcceso } from './acceso';

const CONTRATO = z.object({
  email: z.string().trim().min(1, { error: t.escribiEmail }),
  contrasena: z.string().min(1, { error: t.escribiContrasena }),
});
type Campos = z.infer<typeof CONTRATO>;

export interface PropsFormularioIngresar {
  readonly accion: AccionEscritura;
  /** `salir()`: se llama una vez si la sesión que quedó es la de un usuario no permitido. */
  readonly cerrarSesion: AccionEscritura;
  readonly rutas: RutasAcceso;
  readonly usuarioNoPermitido: boolean;
}

export function FormularioIngresar({
  accion,
  cerrarSesion,
  rutas,
  usuarioNoPermitido,
}: PropsFormularioIngresar) {
  const operacion = useOperacion({
    accion,
    alNoAutorizado: () => {
      window.location.assign(rutas.ingresar);
    },
  });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: { email: '', contrasena: '' },
    operacion,
  });
  const [visible, setVisible] = useState(false);
  const { estado, exito } = operacion;

  const cerrada = useRef(false);
  useEffect(() => {
    if (!usuarioNoPermitido || cerrada.current) return;
    cerrada.current = true;
    void cerrarSesion({}).catch(() => undefined);
  }, [usuarioNoPermitido, cerrarSesion]);

  useEffect(() => {
    if (estado !== 'listo') return;
    const { siguiente } = exito?.valor as { siguiente: 'verificar' | 'inscribir' | 'listo' };
    const destinos = {
      verificar: rutas.verificar,
      inscribir: rutas.inscribir,
      listo: rutas.destino,
    };
    window.location.assign(destinos[siguiente]);
  }, [estado, exito, rutas]);

  const { register, formState } = formulario;
  const errorEmail = formState.errors.email?.message;
  const errorContrasena = formState.errors.contrasena?.message;
  const mensaje =
    operacion.error?.mensaje ??
    (usuarioNoPermitido ? autenticacion.credenciales_invalidas : undefined);
  // ACC-11: con credenciales inválidas, la contraseña toma el borde de error (sin un segundo mensaje)
  const credencialesInvalidas =
    operacion.error?.codigo === 'credenciales_invalidas' || usuarioNoPermitido;
  const demasiados = operacion.error?.codigo === 'demasiados_intentos';
  const idMensaje = useId();
  const idSinConexion = useId();
  const sinConexion = !operacion.enLinea;
  return (
    <form
      onSubmit={(e) => {
        void formulario.enviar(e);
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <h1 className="text-titulo-seccion">{t.tituloIngresar}</h1>
      {mensaje === undefined ? null : (
        <div id={idMensaje}>
          <AvisoEnLinea estado="problema" aparecioDespues={operacion.error !== undefined}>
            {mensaje}
          </AvisoEnLinea>
        </div>
      )}
      <EntradaTexto
        etiqueta={t.email}
        requerido
        type="email"
        autoComplete="username"
        {...(errorEmail === undefined ? {} : { error: errorEmail })}
        {...register('email')}
      />
      <EntradaTexto
        etiqueta={t.contrasena}
        requerido
        type={visible ? 'text' : 'password'}
        autoComplete="current-password"
        className="pr-12"
        {...(credencialesInvalidas ? { 'aria-invalid': true } : {})}
        {...(errorContrasena === undefined ? {} : { error: errorContrasena })}
        {...register('contrasena')}
        acciones={
          // E2-3: el ojo dentro del campo; no envía el formulario ni le quita el foco al campo (el clic no lo roba)
          <button
            type="button"
            aria-pressed={visible}
            aria-label={visible ? t.ocultarContrasena : t.mostrarContrasena}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              setVisible((v) => !v);
            }}
            className="absolute inset-y-0 right-0 inline-flex size-11 items-center justify-center rounded-control text-texto-secundario focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <Icono nombre={visible ? 'eyeoff' : 'eye'} tamano={22} />
          </button>
        }
      />
      <div className="flex flex-col gap-2">
        <Boton
          tipo="submit"
          enviando={estado === 'enviando' || estado === 'listo'}
          textoEnviando={t.ingresando}
          deshabilitado={sinConexion || demasiados}
          {...(sinConexion
            ? { 'aria-describedby': idSinConexion }
            : demasiados
              ? { 'aria-describedby': idMensaje }
              : {})}
        >
          {t.ingresar}
        </Boton>
        {sinConexion ? (
          <p
            id={idSinConexion}
            className="flex items-center gap-1.5 text-cuerpo-pequeno text-texto-secundario"
          >
            <Icono nombre="wifioff" tamano={16} />
            {t.sinConexionIngresar}
          </p>
        ) : null}
      </div>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinRecuperacion}</p>
    </form>
  );
}
