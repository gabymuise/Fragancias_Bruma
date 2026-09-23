// Fragancias Bruma — js/core/state.js
'use strict';
const KEY = 'fragancias-bruma-local-v1';
const VIEWS = ['Resumen', 'Productos', 'Compras', 'Decants', 'Ventas', 'Gastos', 'Ajustes', 'Guía'];
const CATS = ['Perfume', 'Cosmético', 'Decant', 'Perfume para decantar', 'Insumo', 'Desodorante', 'Otro'];
const CHANNELS = ['WhatsApp', 'Instagram', 'Tiendanube', 'Presencial', 'Otro'];
const EXPENSES = ['Publicidad', 'Plataforma', 'Embalaje consumido', 'Servicios', 'Transporte', 'Impuestos y tasas', 'Jeringas', 'Otros'];
const REASONS = ['Rotura', 'Pérdida', 'Muestra / regalo', 'Corrección conteo', 'Transferencia'];
const TYPES = {
  Productos: 'products',
  Compras: 'purchases',
  Decants: 'productions',
  Ventas: 'sales',
  Gastos: 'expenses',
  Ajustes: 'adjustments'
};
const LABELS = {
  products: 'producto',
  purchases: 'compra',
  productions: 'preparación',
  sales: 'venta',
  expenses: 'gasto',
  adjustments: 'ajuste'
};
const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
});
const number = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 4
});
const money = v => currency.format(v),
  fmt = v => number.format(v),
  esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const showDate = s => s.split('-').reverse().join('/');
const clone = x => JSON.parse(JSON.stringify(x));
const fresh = () => ({
  app: 'Fragancias Bruma',
  version: 1,
  updatedAt: null,
  products: [],
  purchases: [],
  productions: [],
  sales: [],
  expenses: [],
  adjustments: []
});
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let data = fresh(),
  view = 'Resumen',
  year = new Date().getFullYear(),
  search = '',
  editing = null,
  storageError = '',
  rawLoaded = null;

let pageNumber = 1,
  pageSize = 25;
