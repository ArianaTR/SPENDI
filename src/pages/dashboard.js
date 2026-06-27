import { navigate } from '../main.js';
import { db } from '../db.js';
import { renderNav } from '../components/nav.js';
import { renderSemaforo } from '../components/semaforo.js';
import { renderGrafico } from '../components/grafico.js';
import spendiLogo from '../assets/spendisinletra.png';

const iconosCategorias = {
  Comida: '🍔',
  Transporte: '🚌',
  Entretenimiento: '🎉',
  Bebidas: '🥤',
  Compras: '🛍️',
  Otros: '📦'
};

export async function render(container) {
  const usuarioId = parseInt(localStorage.getItem('usuarioId'));
  const usuarioNombre = localStorage.getItem('usuarioNombre');

  if (!usuarioId) {
    navigate('login');
    return;
  }

  const presupuestos = await db.presupuestos.toArray();
  const presupuesto = presupuestos
    .filter(p => p.activo)
    .sort((a, b) => b.id - a.id)[0] || null;

  const todosGastos = await db.gastos.toArray();

  const hoy = new Date().toISOString().split('T')[0];
  const totalHoy = todosGastos
    .filter(g => g.fecha === hoy)
    .reduce((sum, g) => sum + g.monto, 0);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const totalSemana = todosGastos
    .filter(g => new Date(g.fecha) >= inicioSemana)
    .reduce((sum, g) => sum + g.monto, 0);

  const mesActual = new Date().toISOString().slice(0, 7);
  const gastosMes = todosGastos.filter(g => g.fecha.startsWith(mesActual));
  const totalMes = gastosMes.reduce((sum, g) => sum + g.monto, 0);

  const recientes = [...todosGastos].sort((a, b) => b.id - a.id).slice(0, 5);

  const metas = await db.metas.toArray();
  const meta = metas.sort((a, b) => b.id - a.id)[0] || null;

  function renderPresupuesto() {
    if (!presupuesto) {
      return `
        <div style="text-align:center;padding:10px 0;">
          <p style="font-size:32px;margin-bottom:8px;">💰</p>
          <p style="color:var(--texto-suave);font-size:14px;margin-bottom:12px;">No tienes presupuesto activo</p>
          <button class="btn-primary" id="btn-crear-presupuesto" style="width:auto;padding:10px 24px;">Crear presupuesto</button>
        </div>
      `;
    }
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <h2 style="font-size:16px;font-weight:700;">${presupuesto.nombre}</h2>
        <span style="font-size:12px;color:var(--texto-suave);">Presupuesto activo</span>
      </div>
      <div id="semaforo-container"></div>
    `;
  }

  function renderMeta() {
    if (!meta) return '';
    const pct = Math.min((meta.montoActual / meta.montoObjetivo) * 100, 100);
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h2 style="font-size:16px;font-weight:700;">Meta: ${meta.nombre}</h2>
          <span style="font-size:12px;color:var(--texto-suave);">Meta activa</span>
        </div>
        <div class="barra-container">
          <div class="barra-fill" style="width:${pct}%;background:var(--verde);"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <span style="font-size:13px;color:var(--texto-suave);">S/${meta.montoActual} ahorrado</span>
          <span style="font-size:13px;font-weight:600;">S/${meta.montoObjetivo} objetivo</span>
        </div>
      </div>
    `;
  }

  function renderRecientes() {
    if (recientes.length === 0) {
      return '<p style="text-align:center;color:var(--texto-suave);font-size:14px;padding:16px 0;">Sin gastos registrados aun</p>';
    }
    return recientes.map(g => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--borde);">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;">${iconosCategorias[g.categoria] || '📦'}</span>
          <div>
            <p style="font-size:14px;font-weight:600;">${g.categoria}</p>
            <p style="font-size:12px;color:var(--texto-suave);">${g.descripcion || 'Sin descripcion'} - ${g.fecha}</p>
          </div>
        </div>
        <p style="font-size:15px;font-weight:700;color:var(--rojo);">-S/${g.monto.toFixed(2)}</p>
      </div>
    `).join('');
  }

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${spendiLogo}" alt="Spendí" style="width:46px;height:46px;object-fit:contain;" />
          <div>
            <p style="color:var(--texto-suave);font-size:13px;font-family:'Inter',sans-serif;">Hola,</p>
            <h1 style="font-size:20px;font-weight:800;font-family:'Poppins',sans-serif;">${usuarioNombre} 👋</h1>
          </div>
        </div>
        <div id="btn-config" style="width:38px;height:38px;border-radius:50%;background:var(--blanco);box-shadow:var(--sombra-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;">⚙️</div>
      </div>

      <div class="card" id="card-presupuesto">
        ${renderPresupuesto()}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
        <div class="card" style="padding:14px;margin-bottom:0;text-align:center;">
          <p style="font-size:11px;color:var(--texto-suave);margin-bottom:4px;">Hoy</p>
          <p style="font-size:16px;font-weight:700;">S/${totalHoy.toFixed(2)}</p>
        </div>
        <div class="card" style="padding:14px;margin-bottom:0;text-align:center;">
          <p style="font-size:11px;color:var(--texto-suave);margin-bottom:4px;">Semana</p>
          <p style="font-size:16px;font-weight:700;">S/${totalSemana.toFixed(2)}</p>
        </div>
        <div class="card" style="padding:14px;margin-bottom:0;text-align:center;">
          <p style="font-size:11px;color:var(--texto-suave);margin-bottom:4px;">Mes</p>
          <p style="font-size:16px;font-weight:700;">S/${totalMes.toFixed(2)}</p>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-size:16px;font-weight:700;">Gastos por categoria</h2>
          <select id="filtro-grafico" style="font-size:12px;padding:4px 8px;border:1px solid var(--borde);border-radius:8px;background:var(--fondo);">
            <option value="mes">Este mes</option>
            <option value="semana">Esta semana</option>
            <option value="hoy">Hoy</option>
            <option value="todo">Todo</option>
          </select>
        </div>
        <div id="grafico-container"></div>
      </div>

      ${renderMeta()}

      <div class="card">
        <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;">Gastos recientes</h2>
        ${renderRecientes()}
      </div>
    </div>
  `;

  if (presupuesto) {
    renderSemaforo(document.getElementById('semaforo-container'), presupuesto);
  }

  renderGrafico(document.getElementById('grafico-container'), gastosMes, 'mes');

  document.getElementById('filtro-grafico').addEventListener('change', async (e) => {
    const filtro = e.target.value;
    const todos = await db.gastos.toArray();
    let gastosFiltrados = [];

    if (filtro === 'hoy') {
      gastosFiltrados = todos.filter(g => g.fecha === hoy);
    } else if (filtro === 'semana') {
      gastosFiltrados = todos.filter(g => new Date(g.fecha) >= inicioSemana);
    } else if (filtro === 'mes') {
      gastosFiltrados = todos.filter(g => g.fecha.startsWith(mesActual));
    } else {
      gastosFiltrados = todos;
    }

    renderGrafico(document.getElementById('grafico-container'), gastosFiltrados, filtro);
  });

  document.getElementById('btn-config').addEventListener('click', () => navigate('configuracion'));
  document.getElementById('btn-crear-presupuesto')?.addEventListener('click', () => navigate('presupuestos'));

  renderNav(container, 'dashboard');
}