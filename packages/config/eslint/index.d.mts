import type { Linter } from 'eslint';

export function configurar(opciones?: { controles?: boolean }): Linter.Config[];
