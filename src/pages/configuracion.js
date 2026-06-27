import { navigate } from '../main.js';
import { db } from '../db.js';
import logo from '../assets/logo.png';

export async function render(container) {
  const usuarioId = parseInt(localStorage.getItem('usuarioId'));
  if (!usuarioId) { navigate('login'); return; }

  const usuarioNombre = localStorage.getItem('usuarioNombre');

  const configModoEstricto = await db.configuracion.where('clave').equals('modoEstricto').first();
  const modoEstricto = configModoEstricto?.valor === 'true';

  container.innerHTML = `
    <div class="page">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">Configuración</h1>
      </div>

      <!-- Perfil -->
      <div style="background:linear-gradient(135deg, #55BB2F, #3d8a22);border-radius:20px;padding:24px;margin-bottom:16px;display:flex;align-items:center;gap:16px;">
        <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:white;font-family:'Poppins',sans-serif;">
          ${usuarioNombre?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style="font-size:18px;font-weight:700;color:white;font-family:'Poppins',sans-serif;">${usuarioNombre}</p>
          <p style="font-size:13px;color:rgba(255,255,255,0.8);font-family:'Inter',sans-serif;">Tu dinero en equilibrio</p>
        </div>
      </div>

      <!-- Modo Control Estricto -->
      <div class="card">
        <h2 style="font-size:15px;font-weight:700;font-family:'Poppins',sans-serif;margin-bottom:4px;">Modo Control Estricto</h2>
        <p style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:16px;">Activa el temporizador de reflexión para todos los gastos, sin importar el estado del presupuesto.</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14px;font-weight:600;font-family:'Inter',sans-serif;">${modoEstricto ? 'Activado' : 'Desactivado'}</span>
          <div id="toggle-estricto" style="width:52px;height:28px;border-radius:999px;background:${modoEstricto ? 'var(--verde)' : 'var(--borde)'};cursor:pointer;position:relative;transition:background 0.3s ease;">
            <div style="width:22px;height:22px;border-radius:50%;background:white;position:absolute;top:3px;${modoEstricto ? 'right:3px;' : 'left:3px;'}box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:all 0.3s ease;"></div>
          </div>
        </div>
      </div>

      <!-- Acerca de -->
      <div class="card">
        <h2 style="font-size:15px;font-weight:700;font-family:'Poppins',sans-serif;margin-bottom:16px;">Acerca de Spendí</h2>
        <div style="display:flex;justify-content:center;margin-bottom:12px;">
          <img src="${logo}" alt="Spendí" style="width:80px;height:auto;" />
        </div>
        <p style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;text-align:center;line-height:1.6;">Spendí no busca restringir el gasto, sino promover una relación más saludable y consciente con el dinero.</p>
        <p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;text-align:center;margin-top:12px;">Versión 1.0.0</p>
      </div>

      <!-- Cerrar sesión -->
      <button class="btn-danger" id="btn-logout">Cerrar sesión</button>

    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => navigate('dashboard'));

  document.getElementById('toggle-estricto').addEventListener('click', async () => {
    const nuevoValor = !modoEstricto;
    const existe = await db.configuracion.where('clave').equals('modoEstricto').first();
    if (existe) {
      await db.configuracion.update(existe.id, { valor: nuevoValor.toString() });
    } else {
      await db.configuracion.add({ clave: 'modoEstricto', valor: nuevoValor.toString() });
    }
    await render(container);
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNombre');
    navigate('login');
  });
}