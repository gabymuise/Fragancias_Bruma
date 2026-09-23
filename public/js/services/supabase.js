// Fragancias Bruma — js/services/supabase.js
let db = null,
  revision = 0,
  currentEmail = '',
  currentUser = null,
  ready = false,
  busy = false;

function setBusy(value) {
  busy = value;
  document.body.classList.toggle('saving', value);
}

function showLogin(message = '') {
  ready = false;
  currentUser = null;
  currentEmail = '';
  data = fresh();
  revision = 0;
  document.querySelectorAll('dialog[open]').forEach(x => x.close());
  document.getElementById('fields').innerHTML = '';
  document.getElementById('content').innerHTML = '';
  document.getElementById('businessApp').hidden = true;
  document.getElementById('loginPanel').hidden = false;
  document.getElementById('loginError').textContent = message;
}

function describeError(err) {
  if (err?.code === 'P0002' || String(err?.message).includes('BRUMA_CONFLICT')) return 'Otra persona guardó cambios. Copiá los datos del formulario, cerralo y tocá Actualizar antes de volver a registrarlos.';
  if (err?.code === '42501' || String(err?.message).includes('BRUMA_FORBIDDEN')) return 'Tu usuario no está autorizado. El administrador debe ejecutar el SQL de autorización para tu correo.';
  if (err?.code === 'PGRST116') return 'No hay acceso al negocio. Revisá que ejecutaste los SQL de instalación y autorización.';
  return err?.message || 'No se pudo conectar. Revisá tu conexión e intentá nuevamente.';
}
async function fetchState() {
  const {
    data: row,
    error
  } = await db.from('bruma_state').select('payload,revision').eq('id', 1).single();
  if (error) throw error;
  calculate(row.payload);
  return row;
}
async function loadAccount(session) {
  if (!session) {
    showLogin();
    return;
  }
  const row = await fetchState();
  currentUser = session.user.id;
  currentEmail = session.user.email || '';
  data = row.payload;
  revision = Number(row.revision);
  storageError = '';
  ready = true;
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginPanel').hidden = true;
  document.getElementById('businessApp').hidden = false;
  render();
}
async function refreshData(manual = false) {
  if (!ready || busy || document.querySelector('dialog[open]')) return;
  setBusy(true);
  const userAtStart = currentUser;
  try {
    const row = await fetchState();
    if (!ready || currentUser !== userAtStart) return;
    const changed = Number(row.revision) !== revision;
    data = row.payload;
    revision = Number(row.revision);
    storageError = '';
    if (changed || manual) render();
    else document.getElementById('storageStatus').textContent = `Conectado · ${currentEmail} · Versión ${revision}`;
    if (manual) toast('Datos actualizados desde Supabase.');
  } catch (err) {
    if (!ready) return;
    storageError = describeError(err);
    render();
    if (manual) toast(storageError);
  } finally {
    setBusy(false);
  }
}
async function save(next) {
  if (!db || !ready) throw Error('Ingresá con un usuario autorizado.');
  if (busy) throw Error('Esperá a que termine la operación anterior.');
  if (storageError) throw Error('Cerrá el formulario y tocá Actualizar antes de guardar. ' + storageError);
  calculate(next);
  setBusy(true);
  const userAtStart = currentUser;
  try {
    const {
      data: result,
      error
    } = await db.rpc('bruma_save', {
      p_payload: next,
      p_expected_revision: revision
    });
    if (error) throw error;
    if (!ready || currentUser !== userAtStart) throw Error('La sesión cambió. Ingresá nuevamente y verificá el registro.');
    next.updatedAt = result.updatedAt;
    data = clone(next);
    revision = Number(result.revision);
    storageError = '';
    render();
    toast('Guardado en Supabase.');
  } catch (err) {
    storageError = describeError(err) + ' Actualizá y verificá los registros antes de reintentar.';
    if (ready) render();
    throw Error(storageError);
  } finally {
    setBusy(false);
  }
}

function exportLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw Error('No hay datos de la versión anterior en este navegador y dirección. Exportá desde el dispositivo donde los cargaste.');
    const previous = JSON.parse(raw);
    calculate(previous);
    download(`Bruma_anterior_${today()}.json`, JSON.stringify(previous, null, 2), 'application/json');
    toast('Respaldo anterior descargado. Ahora podés importarlo.');
  } catch (err) {
    toast(err.message);
  }
}
async function logout() {
  if (busy) return;
  setBusy(true);
  try {
    const {
      error
    } = await db.auth.signOut({
      scope: 'local'
    });
    if (error) throw error;
    showLogin();
    document.getElementById('loginLogout').hidden = true;
  } catch (err) {
    toast(describeError(err));
    document.getElementById('loginError').textContent = describeError(err);
  } finally {
    setBusy(false);
  }
}
document.getElementById('loginLogout').addEventListener('click', logout);
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (busy || !db) return;
  setBusy(true);
  const button = document.getElementById('loginButton');
  button.disabled = true;
  document.getElementById('loginError').textContent = 'Ingresando…';
  try {
    const {
      data: auth,
      error
    } = await db.auth.signInWithPassword({
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value
    });
    if (error) throw error;
    document.getElementById('loginLogout').hidden = false;
    await loadAccount(auth.session);
  } catch (err) {
    showLogin(describeError(err));
  } finally {
    setBusy(false);
    button.disabled = false;
  }
});
async function boot() {
  try {
    if (!window.supabase) throw Error('No se pudo cargar la conexión a Supabase. Revisá Internet y recargá la página.');
    db = window.supabase.createClient(PROJECT_URL, PUBLIC_KEY);
    db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') showLogin('Sesión cerrada.');
    });
    setBusy(true);
    const {
      data: auth,
      error
    } = await db.auth.getSession();
    if (error) throw error;
    document.getElementById('loginLogout').hidden = !auth.session;
    await loadAccount(auth.session);
  } catch (err) {
    showLogin(describeError(err));
  } finally {
    setBusy(false);
  }
}
window.addEventListener('online', () => refreshData());
window.addEventListener('offline', () => {
  if (ready) {
    storageError = 'Sin conexión. No se pueden guardar cambios hasta recuperar Internet y actualizar.';
    render();
  }
});
window.addEventListener('focus', () => refreshData());
setInterval(() => {
  if (!document.hidden) refreshData();
}, 15000);
