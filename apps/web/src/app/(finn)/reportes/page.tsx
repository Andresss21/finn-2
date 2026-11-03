// `/reportes` (05 §2.10, FT-60): solo redirige a `/reportes/tendencia`.
import { redirect } from 'next/navigation';

export default function PaginaReportes(): never {
  return redirect('/reportes/tendencia');
}
