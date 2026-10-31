// `/ajustes/seguridad/factores/nuevo` (05 §9.5, FT-02): un factor de respaldo con AAL2. Sin borrador: el secreto nunca se guarda.
import type { Metadata } from 'next';
import { InscribirFactor } from '../../../../../../flujos/ajustes-seguridad-factores-nuevo/inscribir-factor';
import {
  completarInscripcion,
  iniciarInscripcion,
} from '../../../../../../servidor/acciones/autenticacion';
import { ingreso } from '../../../../../../textos/ingreso';

export const metadata: Metadata = { title: ingreso.tituloRespaldo };

export default function PaginaFactorNuevo() {
  return (
    <InscribirFactor
      iniciar={iniciarInscripcion}
      completar={completarInscripcion}
      nombre="Respaldo"
      esRespaldo
      destino="/ajustes/seguridad"
      rutaIngresar="/ingresar?volver=%2Fajustes%2Fseguridad%2Ffactores%2Fnuevo"
    />
  );
}
