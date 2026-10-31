'use client';
// Error de la consulta (05 §7.3, FE-28): por debajo del layout de `(finn)`, así que el marco sigue visible. En
// producción Next entrega solo el `digest` (el `idError` de `consultar()`, o el numérico de Next) y un mensaje genérico.
import { ErrorDeLaPantalla } from '../../componentes/navegacion/error-de-pantalla';

export default ErrorDeLaPantalla;
