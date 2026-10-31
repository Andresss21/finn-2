'use client';
// `useFormularioFinn` (05 §4.2, FE-16): React Hook Form con el contrato Zod de la operación. Los nombres de los
// campos son las rutas del contrato, así los `campos` de un error del servidor van a `setError(ruta)` sin traducir.
// Valida al enviar y al salir de un campo tocado; si no pasa, no se envía.
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import type * as z from 'zod';
import type { Operacion } from './use-operacion';

export interface OpcionesFormulario<Campos extends FieldValues> {
  /** El contrato de `@finn/aplicacion/contratos` sin `modo`, `revisionVista`, `huellaImpacto` ni `id` (`.omit()`). */
  readonly contrato: z.ZodType<Campos, Campos>;
  readonly valoresIniciales: DefaultValues<Campos>;
  readonly operacion: Operacion;
}

export function useFormularioFinn<Campos extends FieldValues>({
  contrato,
  valoresIniciales,
  operacion,
}: OpcionesFormulario<Campos>) {
  const formulario = useForm<Campos, unknown, Campos>({
    resolver: zodResolver(contrato),
    defaultValues: valoresIniciales,
    mode: 'onTouched',
  });
  const { setError } = formulario;
  const campos = operacion.error?.campos;

  // 05 §4.7: cada mensaje del servidor en su campo y el foco al primero.
  useEffect(() => {
    if (campos === undefined) return;
    Object.entries(campos).forEach(([ruta, message], i) => {
      setError(ruta as Path<Campos>, { type: 'servidor', message }, { shouldFocus: i === 0 });
    });
  }, [campos, setError]);

  /** Mensaje del formulario: el de un error sin campos, o el resumen cuando hay campos (VALIDACION, DOMINIO). */
  const mensajeDelFormulario = operacion.error?.mensaje;

  const enviar = formulario.handleSubmit((valores) => operacion.enviar(valores));

  return { ...formulario, enviar, mensajeDelFormulario };
}
