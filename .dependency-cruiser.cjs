// Control (c) de 04 §1.5 (BE-03): reproduce la matriz de 04 §1.3 sobre el grafo real, con importaciones
// dinámicas, `require` y reexportaciones. Un paquete no resuelto (no declarado) conserva su nombre en `to.path`.
const paquete = (nombre) => `(^@finn/${nombre}($|/)|^packages/${nombre}/)`;
const PRISMA = '(^@prisma/(client|adapter-pg)|^pg$|generado/prisma)';
const DOMINIO_NO_VALORES = '(^@finn/dominio$|^packages/dominio/(src/(?!valores/)|escenarios/))';

const prohibida = (name, comment, from, to, extra = {}) => ({
  name,
  comment,
  severity: 'error',
  from: { path: from },
  to: { path: to, ...extra },
});

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    prohibida(
      'web-no-db-sms-conciliacion',
      'apps/web nunca importa db, sms ni conciliación (04 §1.3)',
      '^apps/web/',
      `${paquete('db')}|${paquete('sms')}|${paquete('conciliacion')}`,
    ),
    prohibida(
      'web-dominio-solo-tipos',
      'apps/web solo importa tipos de la API de dominio (04 §1.3)',
      '^apps/web/',
      DOMINIO_NO_VALORES,
      { dependencyTypesNot: ['type-only'] },
    ),
    prohibida(
      'contratos-sin-servidor',
      'contratos y errores no llegan a código de servidor (04 §1.4)',
      '^packages/aplicacion/src/(contratos|errores)/',
      `${paquete('db')}|${paquete('sms')}|${paquete('conciliacion')}|^packages/aplicacion/src/(?!contratos/|errores/)|^server-only$|^next($|/)`,
    ),
    prohibida(
      'dominio-aislado',
      'dominio no importa otros paquetes, E/S, Next ni Node (ADR-21)',
      '^packages/dominio/',
      `^@finn/(?!dominio)|^packages/(?!dominio/)|^next($|/)|^node:|${PRISMA}`,
    ),
    {
      name: 'dominio-sin-node',
      comment: 'dominio no usa módulos del núcleo de Node',
      severity: 'error',
      from: { path: '^packages/dominio/' },
      to: { dependencyTypes: ['core'] },
    },
    prohibida(
      'db-solo-dominio',
      'db solo depende de dominio (04 §1.3)',
      '^packages/db/',
      `${paquete('sms')}|${paquete('conciliacion')}|${paquete('aplicacion')}|^apps/web/|^@finn/web`,
    ),
    prohibida(
      'sms-solo-dominio',
      'sms solo depende de dominio (04 §1.3)',
      '^packages/sms/',
      `${paquete('db')}|${paquete('conciliacion')}|${paquete('aplicacion')}|^apps/web/|^@finn/web`,
    ),
    prohibida(
      'conciliacion-solo-dominio',
      'conciliación solo depende de dominio (04 §1.3)',
      '^packages/conciliacion/',
      `${paquete('db')}|${paquete('sms')}|${paquete('aplicacion')}|^apps/web/|^@finn/web`,
    ),
    prohibida(
      'aplicacion-no-web',
      'aplicación no importa la web (04 §1.3)',
      '^packages/aplicacion/',
      '^apps/web/|^@finn/web',
    ),
    ...['db', 'sms', 'conciliacion'].map((p) =>
      prohibida(
        `${p}-dominio-solo-tipos`,
        `${p} solo importa tipos de la API de dominio (04 §1.3)`,
        `^packages/${p}/`,
        DOMINIO_NO_VALORES,
        { dependencyTypesNot: ['type-only'] },
      ),
    ),
    prohibida(
      'prisma-solo-db',
      'Solo @finn/db importa Prisma y su cliente (ADR-21)',
      '^(?!packages/db/)',
      PRISMA,
    ),
    prohibida(
      'pruebas-solo-en-pruebas',
      '@finn/dominio/pruebas (generadores) solo lo importan archivos de prueba (07 §12.5)',
      '^(?!.*(\\.test\\.tsx?$|/pruebas/|/test/))',
      '(^@finn/dominio/pruebas$|^packages/dominio/src/pruebas/)',
    ),
    prohibida('prisma-8', 'Prisma 8 (@prisma/orm-*) está prohibido (ADR-21)', '.', '^@prisma/orm-'),
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|generado|\\.next|dist)/' },
    tsPreCompilationDeps: true,
    moduleSystems: ['es6', 'cjs'],
  },
};
