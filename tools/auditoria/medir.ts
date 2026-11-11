// El medidor de la auditoría: corre dentro de la página (app o HTML de referencia) y devuelve lo que se ve renderizado.
// Todo sale de getComputedStyle y getBoundingClientRect. No interpreta: los juicios los hace `analizar.mjs` y quien audita.
export interface Texto {
  t: string; // el texto (hasta 90 caracteres)
  rol: string; // data-rol (referencias) o la clase text-<rol> / t-<rol> (app)
  tag: string;
  ff: string; // primera familia
  fs: number; // px
  fw: string;
  lh: string;
  st: string; // font-stretch
  fvn: string; // font-variant-numeric
  tt: string; // text-transform
  ls: string; // letter-spacing
  td: string; // text-decoration-line
  c: string; // color #rrggbb(aa)
  bg: string; // fondo efectivo #rrggbb
  cr: number; // contraste
  x: number;
  y: number;
  w: number;
  h: number;
  lineas: number; // líneas que ocupa
  cortado: boolean; // desborda su caja con ellipsis u overflow oculto
  enMain: boolean; // dentro de <main> (no en las barras fijas)
}
export interface Tocable {
  n: string; // nombre accesible aproximado
  tag: string;
  role: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // área real que responde al toque (elementFromPoint alrededor del centro): mide el tocable extendido con ::before/::after
  aw: number;
  ah: number;
  des: boolean; // deshabilitado
  sinNombre: boolean;
}
export interface Caja {
  sel: string;
  tag: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bg: string;
  radio: string;
  sombra: string;
  borde: string;
  pad: string;
  gap: string;
}
export interface Medida {
  url: string;
  titulo: string;
  vw: number;
  vh: number;
  tema: string;
  docW: number;
  docH: number;
  desbordeHorizontal: boolean;
  fuentes: string[];
  textos: Texto[];
  tocables: Tocable[];
  cajas: Caja[];
  fueraDeAncho: { sel: string; x: number; w: number }[];
  margenIzq: number; // el menor x de un texto del contenido principal
  margenDer: number;
  roles: { status: number; alert: number; dialog: number };
  marco: {
    barraSuperior: boolean;
    barraInferior: boolean;
    barraLateral: boolean;
    campana: boolean;
    registrar: boolean;
    masSecciones: boolean;
    volver: string;
    cerrar: boolean;
    main: { x: number; y: number; w: number; h: number; padL: string; padR: string; maxW: string } | null;
  };
  camposSinEtiqueta: string[];
  animaciones: { nombre: string; dur: number; iter: string; sel: string }[];
  menosAscii: string[]; // montos con guion en vez de U+2212
}

export function medir(): Medida {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 1;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })!;
  const rgba = (color: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0]!, d[1]!, d[2]!, d[3]! / 255];
  };
  const hex = (c: [number, number, number, number]): string =>
    '#' +
    c
      .slice(0, 3)
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('') +
    (c[3] < 0.995
      ? Math.round(c[3] * 255)
          .toString(16)
          .padStart(2, '0')
      : '');
  const sobre = (
    a: [number, number, number, number],
    b: [number, number, number, number],
  ): [number, number, number, number] => [
    a[0] * a[3] + b[0] * (1 - a[3]),
    a[1] * a[3] + b[1] * (1 - a[3]),
    a[2] * a[3] + b[2] * (1 - a[3]),
    1,
  ];
  const fondoEfectivo = (el: Element): [number, number, number, number] => {
    const capas: [number, number, number, number][] = [];
    for (let e: Element | null = el; e; e = e.parentElement) {
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c[3] > 0) {
        capas.push(c);
        if (c[3] >= 0.995) break;
      }
    }
    let base: [number, number, number, number] = [255, 255, 255, 1];
    for (const c of capas.reverse()) base = sobre(c, base);
    return base;
  };
  const lum = (c: [number, number, number, number]): number => {
    const f = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const contraste = (a: [number, number, number, number], b: [number, number, number, number]) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
    return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
  };
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible' || cs.display === 'none') return false;
    for (let e: Element | null = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (Number(s.opacity) === 0) return false;
      // sr-only y parecidos
      if (s.clipPath === 'inset(50%)' || s.clip === 'rect(0px, 0px, 0px, 0px)') return false;
      if (e.getAttribute('aria-hidden') === 'true' && e.tagName !== 'svg') {
        /* decorativo pero visible: se mide igual */
      }
    }
    return true;
  };
  const sel = (el: Element): string => {
    const partes: string[] = [];
    for (let e: Element | null = el, i = 0; e && i < 4 && e !== document.body; e = e.parentElement, i++) {
      const id = e.id ? `#${e.id}` : '';
      const dato = ['data-componente', 'data-testid', 'data-rol', 'role', 'aria-label']
        .map((a) => (e!.getAttribute(a) ? `[${a}="${e!.getAttribute(a)!.slice(0, 40)}"]` : ''))
        .join('');
      partes.unshift(`${e.tagName.toLowerCase()}${id}${dato}`);
    }
    return partes.join(' > ');
  };
  const rolDe = (el: Element): string => {
    for (let e: Element | null = el, i = 0; e && i < 3; e = e.parentElement, i++) {
      const d = e.getAttribute('data-rol');
      if (d) return d;
      const c = [...e.classList].find((k) => /^(text|t)-[a-z]+(-[a-z]+)*$/.test(k) && !/^text-(texto|accion|enlace|fondo|positivo|problema|advertencia|informacion|deuda|cero|marca|peligro|left|right|center|current|inherit|transparent|white|black|ellipsis|nowrap|wrap|balance|pretty|start|end|justify)/.test(k));
      if (c) return c.replace(/^(text|t)-/, '');
    }
    return '';
  };

  const vw = document.documentElement.clientWidth;
  const textos: Texto[] = [];
  const todos = [...document.body.querySelectorAll('*')];
  for (const el of todos) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'OPTION'].includes(el.tagName)) continue;
    const propio = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const valor =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el.value || el.placeholder
        : '';
    const t = propio || valor;
    if (!t || !visible(el)) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const color = rgba(cs.color);
    const bg = fondoEfectivo(el);
    const lhPx = cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(cs.lineHeight);
    const rango = document.createRange();
    rango.selectNodeContents(el);
    const altoTexto = propio ? rango.getBoundingClientRect().height : r.height;
    const e = el as HTMLElement;
    textos.push({
      t: t.slice(0, 90),
      rol: rolDe(el),
      tag: el.tagName.toLowerCase(),
      ff: cs.fontFamily.split(',')[0]!.replace(/["']/g, '').trim(),
      fs: r1(parseFloat(cs.fontSize)),
      fw: cs.fontWeight,
      lh: cs.lineHeight === 'normal' ? 'normal' : String(r1(parseFloat(cs.lineHeight))),
      st: cs.fontStretch,
      fvn: cs.fontVariantNumeric,
      tt: cs.textTransform,
      ls: cs.letterSpacing,
      td: cs.textDecorationLine,
      c: hex(color),
      bg: hex(bg),
      cr: contraste(sobre(color, bg), bg),
      x: r1(r.x),
      y: r1(r.y + scrollY),
      w: r1(r.width),
      h: r1(r.height),
      lineas: Math.max(1, Math.round(altoTexto / lhPx)),
      cortado: e.scrollWidth > e.clientWidth + 1 && cs.overflow !== 'visible',
      enMain: !!el.closest('main') && !el.closest('nav'),
    });
  }

  const nombre = (el: Element): string =>
    (
      el.getAttribute('aria-label') ||
      (el.getAttribute('aria-labelledby') || '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' ') ||
      (el as HTMLElement).innerText ||
      el.getAttribute('title') ||
      (el instanceof HTMLInputElement ? el.labels?.[0]?.textContent || el.placeholder : '') ||
      ''
    )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 70);
  const tocables: Tocable[] = [];
  const interactivos = todos.filter((el) =>
    el.matches(
      'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=radio], [role=tab], [role=switch], [role=checkbox], [role=menuitem], [role=option], [tabindex]:not([tabindex="-1"])',
    ),
  );
  for (const el of interactivos) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    // el área que de verdad responde: se camina desde el centro hasta dejar de caer en el elemento (o en un hijo o su label)
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const esMio = (x: number, y: number): boolean => {
      const h = document.elementFromPoint(x, y);
      if (!h) return false;
      if (h === el || el.contains(h)) return true;
      const lab = h.closest('label');
      return !!lab && (lab.contains(el) || (el.id !== '' && lab.getAttribute('for') === el.id));
    };
    let [izq, der, arr, aba] = [0, 0, 0, 0];
    const enVista = cy >= 0 && cy <= innerHeight && cx >= 0 && cx <= innerWidth;
    if (enVista && esMio(cx, cy)) {
      while (izq < 60 && esMio(cx - izq - 1, cy)) izq++;
      while (der < 60 && esMio(cx + der + 1, cy)) der++;
      while (arr < 60 && esMio(cx, cy - arr - 1)) arr++;
      while (aba < 60 && esMio(cx, cy + aba + 1)) aba++;
    }
    const n = nombre(el);
    tocables.push({
      n,
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role') ?? '',
      x: r1(r.x),
      y: r1(r.y + scrollY),
      w: r1(r.width),
      h: r1(r.height),
      aw: enVista ? izq + der + 1 : -1,
      ah: enVista ? arr + aba + 1 : -1,
      des: el.matches(':disabled, [aria-disabled=true]'),
      sinNombre: n === '',
    });
  }

  // Cajas: todo lo que tiene fondo, sombra, radio o borde propios (contenedores, botones, avisos, campos, pastillas)
  const cajas: Caja[] = [];
  for (const el of todos) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const conFondo = rgba(cs.backgroundColor)[3] > 0 || cs.backgroundImage !== 'none';
    const conSombra = cs.boxShadow !== 'none';
    const conBorde = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) > 0;
    if (!conFondo && !conSombra && !conBorde) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 16 || r.height < 4) continue;
    cajas.push({
      sel: sel(el),
      tag: el.tagName.toLowerCase(),
      x: r1(r.x),
      y: r1(r.y + scrollY),
      w: r1(r.width),
      h: r1(r.height),
      bg: cs.backgroundImage !== 'none' ? `img:${hex(rgba(cs.backgroundColor))}` : hex(rgba(cs.backgroundColor)),
      radio: cs.borderRadius,
      sombra: cs.boxShadow === 'none' ? '' : cs.boxShadow.slice(0, 120),
      borde: conBorde ? `${cs.borderTopWidth} ${cs.borderRightWidth} ${cs.borderBottomWidth} ${cs.borderLeftWidth} ${hex(rgba(cs.borderTopColor))}` : '',
      pad: cs.padding,
      gap: cs.gap,
    });
  }

  // Lo que se sale del ancho sin estar dentro de una fila que se desplaza a propósito
  const fueraDeAncho: Medida['fueraDeAncho'] = [];
  for (const el of todos) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right <= vw + 1 && r.left >= -1) continue;
    let desplazable = false;
    for (let e = el.parentElement; e; e = e.parentElement) {
      const o = getComputedStyle(e).overflowX;
      if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') {
        desplazable = true;
        break;
      }
    }
    if (!desplazable && fueraDeAncho.length < 30) fueraDeAncho.push({ sel: sel(el), x: r1(r.x), w: r1(r.width) });
  }

  const main = document.querySelector('main');
  const enMain = main ? textos.filter((t) => t.enMain) : textos;
  const q = (s: string) => {
    const e = document.querySelector(s);
    return !!e && visible(e);
  };
  const volver = [...document.querySelectorAll('a,button')].find(
    (e) => visible(e) && /^Volver/.test(nombre(e)),
  );
  const camposSinEtiqueta = todos
    .filter((el) => el.matches('input:not([type=hidden]), select, textarea') && visible(el))
    .filter((el) => {
      const c = el as HTMLInputElement;
      return !(c.labels && c.labels.length > 0) && !c.getAttribute('aria-label') && !c.getAttribute('aria-labelledby');
    })
    .map(sel);
  const animaciones = document.getAnimations().slice(0, 60).map((a) => {
    const t = a.effect?.getComputedTiming();
    const objetivo = (a.effect as KeyframeEffect | null)?.target;
    return {
      nombre: (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? '',
      dur: Number(t?.duration ?? 0),
      iter: String(t?.iterations ?? ''),
      sel: objetivo ? sel(objetivo) : '',
    };
  });
  const cmain = main ? getComputedStyle(main) : null;
  const rmain = main?.getBoundingClientRect();
  return {
    url: location.pathname + location.search,
    titulo: document.title,
    vw,
    vh: innerHeight,
    tema: document.documentElement.getAttribute('data-theme') ?? '',
    docW: document.documentElement.scrollWidth,
    docH: document.documentElement.scrollHeight,
    desbordeHorizontal: document.documentElement.scrollWidth > vw + 1,
    fuentes: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family}|${f.weight}|${f.stretch}`),
    textos,
    tocables,
    cajas,
    fueraDeAncho,
    margenIzq: enMain.length ? Math.min(...enMain.map((t) => t.x)) : -1,
    margenDer: enMain.length ? r1(vw - Math.max(...enMain.map((t) => t.x + t.w))) : -1,
    roles: {
      status: document.querySelectorAll('[role=status]').length,
      alert: document.querySelectorAll('[role=alert]').length,
      dialog: document.querySelectorAll('[role=dialog],[role=alertdialog]').length,
    },
    marco: {
      barraSuperior: q('header'),
      barraInferior: [...document.querySelectorAll('nav')].some((n) => visible(n) && n.getBoundingClientRect().top > innerHeight - 140 && n.getBoundingClientRect().width > innerWidth * 0.8),
      barraLateral: [...document.querySelectorAll('nav, aside')].some((n) => visible(n) && n.getBoundingClientRect().height > innerHeight * 0.7 && n.getBoundingClientRect().width < 320),
      campana: [...document.querySelectorAll('a,button')].some((e) => visible(e) && /Notificaciones/.test(nombre(e)) && e.getBoundingClientRect().top < 120),
      registrar: [...document.querySelectorAll('a,button')].some((e) => visible(e) && /^Registrar$/.test(nombre(e))),
      masSecciones: [...document.querySelectorAll('a,button')].some((e) => visible(e) && /Más secciones/.test(nombre(e))),
      volver: volver ? nombre(volver) : '',
      cerrar: [...document.querySelectorAll('a,button')].some((e) => visible(e) && /^Cerrar/.test(nombre(e))),
      main: main && cmain && rmain ? { x: r1(rmain.x), y: r1(rmain.y), w: r1(rmain.width), h: r1(rmain.height), padL: cmain.paddingLeft, padR: cmain.paddingRight, maxW: cmain.maxWidth } : null,
    },
    camposSinEtiqueta,
    animaciones,
    menosAscii: textos.filter((t) => /(^|\s)-\s?\$?\d/.test(t.t)).map((t) => t.t),
  };
}
