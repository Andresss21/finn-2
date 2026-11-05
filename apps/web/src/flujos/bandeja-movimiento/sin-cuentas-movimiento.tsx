'use client';
// `/bandeja/[movimientoId]` sin ninguna cuenta (05 §7.2, primer uso): el texto del SMS a la vista y la guía de crear la primera cuenta,
// la misma de Registrar gasto. Se carga solo cuando hace falta (05 §13.1).
import SinCuentas from '../registrar-gasto/sin-cuentas';
import { TextoDelSms } from './texto-sms';

export default function SinCuentasDeMovimiento({ texto }: { readonly texto: string }) {
  return (
    <div className="flex flex-col gap-4">
      <TextoDelSms texto={texto} />
      <SinCuentas />
    </div>
  );
}
