// Fragancias Bruma — js/router.js
// Hash URLs work on Workers without server-side routes or page reloads.
const ROUTES = {
  'resumen': 'Resumen',
  'productos': 'Productos',
  'compras': 'Compras',
  'decants': 'Decants',
  'ventas': 'Ventas',
  'gastos': 'Gastos',
  'ajustes': 'Ajustes',
  'guia': 'Guía'
};
const RECORD_TABLES = {
  products: productsTable,
  purchases: purchasesTable,
  productions: productionsTable,
  sales: salesTable,
  expenses: expensesTable,
  adjustments: adjustmentsTable
};
const PAGE_RENDERERS = {
  Resumen: dashboard,
  Productos: records,
  Compras: records,
  Decants: records,
  Ventas: records,
  Gastos: records,
  Ajustes: records,
  'Guía': guide
};

function routeFromHash() {
  return ROUTES[location.hash.slice(1).replace(/^\//, '')] || 'Resumen';
}

function navigate(name) {
  const slug = Object.keys(ROUTES).find(k => ROUTES[k] === name) || 'resumen';
  if (location.hash === '#/' + slug) {
    view = ROUTES[slug];
    search = '';
    pageNumber = 1;
    render();
  } else location.hash = '/' + slug;
}
window.addEventListener('hashchange', () => {
  if (location.hash === '#mainContent') return;
  view = routeFromHash();
  search = '';
  pageNumber = 1;
  if (ready) {
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    render();
    document.getElementById('pageTitle').focus();
    window.scrollTo({
      top: 0
    });
  }
});
view = routeFromHash();
