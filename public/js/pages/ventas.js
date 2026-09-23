// Fragancias Bruma — js/pages/ventas.js
function salesTable(c, source) {
  const type = 'sales';
  let headers = [],
    rows = [];
  for (const r of source) {
    const a = c.p.get(r.product),
      m = c.metrics.get(r.id);
    let cells = [cell(showDate(r.date))];
    headers = ['Fecha', 'Producto / lote', 'Canal', '#Cantidad', '#Venta neta', '#Costo', '#Comisión / envío', '#Ganancia', '#Margen', 'Pedido / cliente', 'Acciones'];
    cells.push(cell(productLabel(a)), cell(esc(r.channel)), cell(fmt(r.qty), 'right'), cell(money(m.revenue), 'right'), cell(money(m.cogs), 'right'), cell(money(m.fees), 'right'), cell(money(m.profit), 'right ' + (m.profit < 0 ? 'neg' : 'positive')), cell(m.revenue ? fmt(m.profit / m.revenue * 100) + ' %' : '—', 'right'), cell(esc(r.note)));
    cells.push(cell(actionButtons(type, r.id)));
    rows.push('<tr>' + cells.join('') + '</tr>');
  }
  return {
    headers,
    rows
  };
}
