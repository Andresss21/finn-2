import { configurar } from '@finn/config/eslint';
import { pruebas } from '@finn/config/eslint/pruebas';

export default [...configurar(), ...pruebas];
