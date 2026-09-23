// Fragancias Bruma — js/pages/productos.js
function productsTable(c, source) {
  const type = 'products';
  let headers = [],
    rows = [];
  headers = ['Producto / lote', 'Categoría', '#Costo unitario', '#Precio sugerido', '#Stock actual', '#Mínimo', '#Valor stock', 'Estado', 'Acciones'];
  rows = source.map(a => '<tr>' + cell(productLabel(a)) + cell(esc(a.category)) + cell(money(a.cost), 'right') + cell(money(a.price), 'right') + cell(`${fmt(c.stocks.get(a.id))} <small>${esc(a.unit)}</small>`, 'right') + cell(fmt(a.min), 'right') + cell(money(a.cost * c.stocks.get(a.id)), 'right') + cell(c.stocks.get(a.id) <= a.min ? '<span class="badge low">Reponer</span>' : '<span class="badge">Disponible</span>') + cell(actionButtons(type, a.id)) + '</tr>');
  return {
    headers,
    rows
  };
}
