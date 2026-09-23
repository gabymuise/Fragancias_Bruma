// Fragancias Bruma — js/pages/compras.js
function purchasesTable(c, source) {
  const type = 'purchases';
  let headers = [],
    rows = [];
  for (const r of source) {
    const a = c.p.get(r.product),
      m = c.metrics.get(r.id);
    let cells = [cell(showDate(r.date))];
    headers = ['Fecha', 'Producto / lote', '#Cantidad', '#Costo unitario', '#Total', 'Proveedor / detalle', 'Acciones'];
    cells.push(cell(productLabel(a)), cell(`${fmt(r.qty)} ${esc(a.unit)}`, 'right'), cell(money(r.unitCost), 'right'), cell(money(m.total), 'right'), cell(esc(r.note)));
    cells.push(cell(actionButtons(type, r.id)));
    rows.push('<tr>' + cells.join('') + '</tr>');
  }
  return {
    headers,
    rows
  };
}
