'use client';
// `/ingresar` (05 §9.3): email y contraseña. Un solo mensaje para cualquier credencial inválida (CA-01.2).
import { useEffect, useRef, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo, EntradaTexto } from '../../componentes/base/campo';
import { Input } from '../../components/ui/input';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { autenticacion as t } from '../../textos/autenticacion';
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
    operacion.error?.mensaje ?? (usuarioNoPermitido ? t.credenciales_invalidas : undefined);
  return (
    <form onSubmit={formulario.enviar} noValidate className="flex flex-col gap-5">
      <h1 className="text-titulo-pantalla">{t.tituloIngresar}</h1>
      {mensaje === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues={operacion.error !== undefined}>
          {mensaje}
        </AvisoEnLinea>
      )}
      <EntradaTexto
        etiqueta={t.email}
        requerido
        type="email"
        autoComplete="username"
        {...(errorEmail === undefined ? {} : { error: errorEmail })}
        {...register('email')}
      />
      <Campo
        etiqueta={t.contrasena}
        requerido
        {...(errorContrasena === undefined ? {} : { error: errorContrasena })}
      >
        {(control) => (
          <div className="flex items-start gap-2">
            <Input
              {...control}
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('contrasena')}
            />
            <Boton
              variante="discreta"
              aria-pressed={visible}
              onClick={() => {
                setVisible((v) => !v);
              }}
            >
              {visible ? t.ocultarContrasena : t.mostrarContrasena}
            </Boton>
          </div>
        )}
      </Campo>
      <Boton
        tipo="submit"
        enviando={estado === 'enviando' || estado === 'listo'}
        textoEnviando={t.ingresando}
      >
        {t.ingresar}
      </Boton>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinRecuperacion}</p>
    </form>
  );
}
