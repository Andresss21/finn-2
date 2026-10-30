// Registro de los 52 íconos y los 7 glifos de estado (06-identidad-visual §2). El contenido de cada dibujo es
// el interior de su .svg en ./ y ./estados, sin cambios; PRU-CMP-VAL-101 lo compara con el archivo.
export const ICONOS = {
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  arrowL: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  arrowR: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8"/><path d="M10 10v8"/><path d="M14 10v8"/><path d="M19 10v8"/><path d="M3 21h18"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.6 2.2H4.4L6 16z"/><path d="M10 21h4"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  card: '<rect x="2.8" y="5.5" width="18.4" height="13" rx="2"/><path d="M2.8 10h18.4"/><path d="M6.8 14.8h3.4"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.2 9.6"/>',
  chevD: '<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>',
  chevR: '<path d="M9.5 6.5l5.5 5.5-5.5 5.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.4V12l3 2"/>',
  coins:
    '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  dang: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3L8.3 3z"/><path d="M8.5 12h7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  env: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="M4.9 4.9l2.1 2.1"/><path d="M17 17l2.1 2.1"/><path d="M4.9 19.1L7 17"/><path d="M17 7l2.1-2.1"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  grip: '<path d="M9 6v.1"/><path d="M15 6v.1"/><path d="M9 12v.1"/><path d="M15 12v.1"/><path d="M9 18v.1"/><path d="M15 18v.1"/>',
  home: '<path d="M4 10.8L12 4l8 6.8V20h-5.2v-5.6H9.2V20H4v-9.2z"/>',
  in: '<path d="M17 7L7 17"/><path d="M7 9.5V17h7.5"/>',
  inbox:
    '<path d="M3 13.2h5l1.6 2.6h4.8l1.6-2.6h5"/><path d="M5.6 5h12.8L21 13.2V19H3v-5.8L5.6 5z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2"/><path d="M12 7.9v.1"/>',
  list: '<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6v.1"/><path d="M4 12v.1"/><path d="M4 18v.1"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3"/>',
  more: '<path d="M5.5 12v.1"/><path d="M12 12v.1"/><path d="M18.5 12v.1"/>',
  out: '<path d="M7 17L17 7"/><path d="M9.5 7H17v7.5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  plusC: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  reconcile: '<path d="M5 12l4 4L19 6"/><path d="M5 19h14"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  repeat:
    '<path d="M4 12a7 7 0 0 1 12-5l2 2"/><path d="M18 4v5h-5"/><path d="M20 12a7 7 0 0 1-12 5l-2-2"/><path d="M6 20v-5h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/>',
  sms: '<path d="M4 5h16v11H9.5L4 20V5z"/><path d="M8 9.5h8"/><path d="M8 12.5h5"/>',
  swap: '<path d="M5 8.5h13"/><path d="M15 5.2l3.3 3.3-3.3 3.3"/><path d="M19 15.5H6"/><path d="M9 12.2l-3.3 3.3L9 18.8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12v.1"/>',
  ticket:
    '<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6z"/><path d="M14 7v2"/><path d="M14 11v2"/><path d="M14 15v2"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  wallet:
    '<path d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H4V7.5z"/><path d="M4 7.5V6a2 2 0 0 1 2-2h10"/><path d="M15.8 13.8v.1"/>',
  warn: '<path d="M12 3.6L21.4 20H2.6L12 3.6z"/><path d="M12 10v4.2"/><path d="M12 17.2v.1"/>',
  wifioff:
    '<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 5-2.6"/><path d="M14 9.9a10 10 0 0 1 5 2.6"/><path d="M12 20v.1"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  zero: '<circle cx="12" cy="12" r="9" stroke-dasharray="3.2 2.6"/>',
  zoomout: '<circle cx="11" cy="11" r="7"/><path d="M8 11h6"/><path d="M16.5 16.5L21 21"/>',
} as const;

// Los glifos de estado llevan trazo 1.8 en vez de 1.5 (06-identidad-visual §2).
export const GLIFOS = {
  advertencia:
    '<path d="M12 3.6L21.4 20H2.6L12 3.6z"/><path d="M12 10v4.2"/><path d="M12 17.2v.1"/>',
  cero: '<circle cx="12" cy="12" r="9" stroke-dasharray="3.2 2.6"/>',
  'deuda-sin-respaldo':
    '<rect x="2.8" y="5.5" width="18.4" height="13" rx="2" stroke-dasharray="3 2.4"/><path d="M5 20.5L19 3.5"/>',
  deuda:
    '<rect x="2.8" y="5.5" width="18.4" height="13" rx="2"/><path d="M2.8 10h18.4"/><path d="M6.8 14.8h3.4"/>',
  informacion: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2"/><path d="M12 7.9v.1"/>',
  positivo: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.2 9.6"/>',
  problema: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3L8.3 3z"/><path d="M8.5 12h7"/>',
} as const;
