// Fragancias Bruma — js/components/ui.js
function importNotice() {
  return !data.products.length ? '<div class="note">La base compartida está vacía. Podés crear productos o importar tu respaldo desde Guía.</div>' : '';
}

function toast(message) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 4200);
}

function download(name, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], {
    type
  }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function backup() {
  download(`Bruma_respaldo_${today()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast('Respaldo descargado. Guardalo en un lugar seguro.');
}

function confirmChange(message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirmDialog');
    document.getElementById('confirmText').textContent = message;
    modal.showModal();
    let done = false;
    const finish = v => {
      if (done) return;
      done = true;
      modal.close();
      resolve(v);
    };
    document.getElementById('confirmNo').onclick = () => finish(false);
    document.getElementById('confirmYes').onclick = () => finish(true);
    modal.oncancel = e => {
      e.preventDefault();
      finish(false);
    };
  });
}

function actionButtons(type, id) {
  return `<div class="row-actions"><button data-action="edit" data-type="${type}" data-id="${esc(id)}">Editar</button><button class="danger" data-action="delete" data-type="${type}" data-id="${esc(id)}" aria-label="Eliminar registro">Eliminar</button></div>`;
}
// Cells keep their column labels when mobile CSS presents each row as a card.
function table(headers, rows, empty = 'No hay registros todavía.') {
  const labels = headers.map(h => h.replace(/^#/, ''));
  const annotated = rows.map(row => {
    let col = 0;
    return row.replace(/<td([^>]*)>([\s\S]*?)<\/td>/g, (_, attrs, value) => `<td${attrs} data-label="${esc(labels[col++]||'')}"><div class="cell-value">${value}</div></td>`);
  });
  const wide = headers.length >= 7;
  return `<div class="table-tools"><span class="desktop-tip">${wide?'Deslizá horizontalmente para ver todas las columnas.':'Todos los datos del registro.'}</span><span class="mobile-tip">Cada tarjeta muestra un registro completo.</span></div>
 <div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de ${esc(view)}. Desplazamiento horizontal disponible.">
 <table class="${wide?'wide-table':''}"><caption class="sr-only">${esc(view)}</caption><thead><tr>${headers.map(h=>`<th scope="col"${h[0]==='#'?' class="right"':''}>${esc(h.replace(/^#/,''))}</th>`).join('')}</tr></thead>
 <tbody>${rows.length?annotated.join(''):`<tr><td colspan="${headers.length}" class="empty"><h3>${esc(empty)}</h3><p>Cargá el primer registro para empezar.</p></td></tr>`}</tbody></table></div>`;
}

function pagination(total, pages) {
  return `<div class="pagination"><span>${total?`${(pageNumber-1)*pageSize+1}–${Math.min(pageNumber*pageSize,total)} de ${total}`:'0 registros'}</span>
 <label>Por página <select id="pageSize" aria-label="Registros por página">${[10,25,50].map(n=>`<option value="${n}" ${n===pageSize?'selected':''}>${n}</option>`).join('')}</select></label>
 <div class="pagination-buttons"><button data-action="prev-page" ${pageNumber<=1?'disabled':''}>Anterior</button><span>Página ${pageNumber} de ${pages}</span><button data-action="next-page" ${pageNumber>=pages?'disabled':''}>Siguiente</button></div></div>`;
}
const cell = (v, cls = '') => `<td class="${cls}">${v}</td>`;

function productLabel(a) {
  return `<strong>${esc(a.name)}</strong><small>${esc(a.code)}</small>`;
}

function render() {
  const c = calculate(data);
  document.title = `${view} · Fragancias Bruma`;
  document.getElementById('pageTitle').textContent = view;
  document.getElementById('nav').innerHTML = VIEWS.map((n, i) => `<button data-action="go" data-view="${n}" ${view===n?'aria-current="page"':''}><span class="num">0${i+1}</span>${n}</button>`).join('');
  const st = document.getElementById('storageStatus');
  st.className = 'storage' + (storageError ? ' bad' : '');
  st.textContent = storageError || `Guardado compartido en Supabase · ${currentEmail} · Versión ${revision}${data.updatedAt?' · Último cambio: '+new Date(data.updatedAt).toLocaleString('es-AR'):''}.`;
  document.getElementById('content').innerHTML = importNotice() + (PAGE_RENDERERS[view](c));
}
