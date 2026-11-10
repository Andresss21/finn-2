// [CH-220 C3] Un monto que destella si su valor cambió desde el dibujo anterior (Disponible, pagos de tarjeta y totales). Va
// aparte de `Monto` para que las rutas que no lo usan no carguen el componente de cliente del destello (05 §13.1).
import type { ComponentProps } from 'react';
import { Destello } from '../movimiento/destello';
import { Monto } from './monto';

export function MontoDestello(props: ComponentProps<typeof Monto>) {
  return (
    <Destello valor={props.centavos}>
      <Monto {...props} />
    </Destello>
  );
}
