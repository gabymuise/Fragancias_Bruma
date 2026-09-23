// Fragancias Bruma — js/pages/registros.js
function records(c) {
  const type = TYPES[view];
  let rows = [],
    headers = [];
  const q = search.toLocaleLowerCase('es');
  let source = data[type].filter(r => JSON.stringify(r).toLocaleLowerCase('es').includes(q) || [r.product, r.target, r.base, r.kit].some(id => {
    const a = c.p.get(id);
    return a && `${a.name} ${a.code}`.toLocaleLowerCase('es').includes(q);
  }));
  if (type !== 'products') source.sort((a, b) => b.date.localeCompare(a.date) || b.order - a.order);
  const total = source.length,
    pages = Math.max(1, Math.ceil(total / pageSize));
  pageNumber = Math.min(pageNumber, pages);
  const visible = source.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  const descriptions = {
    products: 'Un código por producto y lote. Stock y valor actualizados automáticamente.',
    purchases: 'Mercadería e insumos que ingresan al stock.',
    productions: 'Prepará unidades listas para vender a partir de perfume en ml y kits de envase.',
    sales: 'Un registro por producto vendido. Ganancia después de descuento, comisión y envío.',
    expenses: 'Publicidad, plataforma, servicios y otros gastos que no son compras de stock.',
    adjustments: 'Pérdidas, roturas, muestras y correcciones de inventario.'
  };

  const rendered = RECORD_TABLES[type](c, visible);
  headers = rendered.headers;
  rows = rendered.rows;
  if (!headers.length) headers = type === 'products' ? ['Producto'] : ['Fecha', 'Registro', 'Importe', 'Acciones'];
  const tips = {
    purchases: 'Si una reposición tiene otro costo, creá un código/lote nuevo. Para perfume de decants, comprá en ml: 100 ml a $600/ml representan un frasco de $60.000.',
    productions: 'El sistema descuenta perfume y kits, y suma decants. En la primera preparación fija automáticamente el costo del decant si su stock inicial es cero y no tiene movimientos.',
    sales: 'Distribuí los descuentos, comisiones y envíos de un pedido entre sus productos, sin duplicarlos. El envío indicado es el gasto que absorbe Bruma.',
    expenses: 'No vuelvas a cargar compras de stock, kits de decants, ni comisiones o envíos ya registrados en Ventas.',
    adjustments: 'Cantidad negativa: sale stock y se reconoce su costo como pérdida. Cantidad positiva: aumenta stock y se reconoce un ajuste de ganancia.',
    products: 'Los costos, unidades y stock inicial quedan fijos cuando un código ya tiene movimientos. Podés editar nombre, precio y mínimo. Para cambiar de costo, creá otro código/lote.'
  };
  return `<section class="heading"><div><h2>${view==='Decants'?'Preparación de decants':view}</h2><p>${descriptions[type]}</p></div><button class="primary" data-action="add" data-type="${type}">+ ${type==='products'?'Nuevo producto':type==='productions'?'Preparar decants':'Registrar '+LABELS[type]}</button></section><div class="heading"><span class="pill">${total} registros</span><div class="controls"><label for="search">Buscar</label><input id="search" type="search" placeholder="Producto, código o detalle" value="${esc(search)}"></div></div><section class="panel">${table(headers,rows,search?'No se encontraron coincidencias.':'Todavía no hay '+view.toLowerCase()+'.')}${pagination(total,pages)}</section><div class="note">${tips[type]}</div>`;
}
