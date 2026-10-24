'use client';
import * as z from 'zod/mini';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
const esquema = z.object({ monto: z.string().check(z.regex(/^\d{1,8}(\.\d{1,2})?$/, 'Escribí un monto válido')), nota: z.optional(z.string().check(z.maxLength(200))) });
type Valores = z.infer<typeof esquema>;
export function Formulario() {
  const { register, handleSubmit, formState: { errors } } = useForm<Valores>({ resolver: zodResolver(esquema) });
  const [enviado, setEnviado] = useState('');
  return (<form onSubmit={handleSubmit((v) => setEnviado(v.monto))} noValidate>
    <label htmlFor="monto">Monto</label>
    <input id="monto" inputMode="decimal" aria-invalid={!!errors.monto} aria-describedby="monto-error" {...register('monto')} className="border border-borde-control bg-superficie p-2" />
    <p id="monto-error" role="alert">{errors.monto?.message}</p>
    <button type="submit" className="bg-accion text-texto-sobre-accion px-4 py-2 min-h-11">Guardar</button>
    <output data-enviado={enviado}>{enviado}</output></form>);
}
