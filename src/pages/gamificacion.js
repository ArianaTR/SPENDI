import { navigate } from '../main.js';
import { db } from '../db.js';
import { renderNav } from '../components/nav.js';

const INSIGNIAS = [
  { id: 'primer_gasto', nombre: 'Primer paso', descripcion: 'Registraste tu primer gasto', emoji: '👣' },
  { id: 'primer_presupuesto', nombre: 'Ahorrador Inicial', descripcion: 'Creaste tu primer presupuesto', emoji: '💰' },
  { id: 'primera_meta', nombre: 'Soñador Financiero', descripcion: 'Creaste tu primera meta de ahorro', emoji: '🎯' },
  { id: 'meta_completada', nombre: 'Meta Cumplida', descripcion: 'Completaste una meta de ahorro', emoji: '🏆' },
  { id: 'sin_exceso_semana', nombre: 'Controlador Financiero', descripcion: 'No excediste tu presupuesto', emoji: '🛡️' },
  { id: 'cinco_gastos', nombre: 'Registrador Activo', descripcion: 'Registraste 5 gastos', emoji: '📝' },
  { id: 'tres_metas', nombre: 'Maestro del Presupuesto', descripcion: 'Creaste 3 metas de ahorro', emoji: '⭐' },
  { id: 'mes_sin_exceso', nombre: 'Mes sin Excesos', descripcion: 'Hiciste 3 abonos a tus metas', emoji: '🌟' }
];

const RETOS = [
  { id: 'reto_7dias', nombre: 'Semana sin excesos', descripcion: 'No superes tu presupuesto durante 7 dias', emoji: '📅', meta: 7 },
  { id: 'reto_5gastos', nombre: 'Registrador constante', descripcion: 'Registra 5 gastos esta semana', emoji: '✍️', meta: 5 },
  { id: 'reto_meta', nombre: 'Ahorro activo', descripcion: 'Haz 3 abonos a tus metas', emoji: '💪', meta: 3 }
];

export async function render(container) {
  const usuarioId = parseInt(localStorage.getItem('usuarioId'));
  if (!usuarioId) { navigate('login'); return; }

  await verificarLogros();

  const insigniasObtenidas = await db.insignias.toArray();
  const todosGastos = await db.gastos.toArray();
  const puntosTotales = todosGastos.length * 10;
  const insigniasIds = insigniasObtenidas.map(i => i.insigniaId);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const gastosSemana = todosGastos.filter(g => new Date(g.fecha) >= inicioSemana);

  const todosAbonos = await db.abonosMetas.toArray();
  const totalAbonos = todosAbonos.length;

  const nivel = puntosTotales < 50 ? 'Principiante' : puntosTotales < 150 ? 'Intermedio' : 'Experto';
  const siguienteNivel = puntosTotales < 50 ? 50 : puntosTotales < 150 ? 150 : 300;
  const pctNivel = Math.min((puntosTotales / siguienteNivel) * 100, 100);

  container.innerHTML = `
    <div class="page">
      <h1 class="page-title">Logros</h1>

      <!-- Card de puntos -->
      <div class="card" style="background:linear-gradient(135deg,#55BB2F,#3d8a22);color:white;padding:24px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
          <div>
            <p style="font-size:13px;opacity:0.85;font-family:'Inter',sans-serif;margin-bottom:4px;">Puntos acumulados</p>
            <p style="font-family:'Poppins',sans-serif;font-size:42px;font-weight:800;line-height:1;">${puntosTotales}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:13px;opacity:0.85;font-family:'Inter',sans-serif;margin-bottom:4px;">Nivel</p>
            <p style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;">${nivel}</p>
          </div>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.2);border-radius:999px;overflow:hidden;">
          <div style="width:${pctNivel}%;height:100%;background:white;border-radius:999px;transition:width 0.6s ease;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <p style="font-size:11px;opacity:0.75;font-family:'Inter',sans-serif;">${insigniasObtenidas.length} de ${INSIGNIAS.length} insignias</p>
          <p style="font-size:11px;opacity:0.75;font-family:'Inter',sans-serif;">${puntosTotales}/${siguienteNivel} para siguiente nivel</p>
        </div>
      </div>

      <!-- Retos activos -->
      <h2 style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;margin-bottom:12px;">Retos activos</h2>
      ${RETOS.map(r => {
        let progreso = 0;
        if (r.id === 'reto_5gastos') progreso = Math.min(gastosSemana.length, r.meta);
        if (r.id === 'reto_meta') progreso = Math.min(totalAbonos, r.meta);
        const pct = (progreso / r.meta) * 100;
        const completado = progreso >= r.meta;
        return `
          <div class="card">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">
                ${r.emoji}
              </div>
              <div style="flex:1;">
                <p style="font-family:'Poppins',sans-serif;font-size:15px;font-weight:700;">${r.nombre}</p>
                <p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;">${r.descripcion}</p>
              </div>
              ${completado ? '<span style="font-size:18px;">✅</span>' : ''}
            </div>
            <div class="barra-container">
              <div class="barra-fill" style="width:${pct}%;background:${completado ? 'var(--verde)' : 'var(--naranja)'};"></div>
            </div>
            <p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-top:6px;">${progreso} de ${r.meta} ${completado ? '— ¡Completado!' : ''}</p>
          </div>
        `;
      }).join('')}

      <!-- Insignias -->
      <h2 style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;margin-bottom:12px;margin-top:8px;">Insignias</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-bottom:8px;">
        ${INSIGNIAS.map(i => {
          const obtenida = insigniasIds.includes(i.id);
          return `
            <div class="card" style="text-align:center;padding:20px 12px;${obtenida ? '' : 'opacity:0.45;'}">
              <div style="width:52px;height:52px;border-radius:50%;background:${obtenida ? 'linear-gradient(135deg,#ECF39E,#55BB2F)' : 'var(--fondo)'};display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 10px;">
                ${i.emoji}
              </div>
              <p style="font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;margin-bottom:4px;">${i.nombre}</p>
              <p style="font-size:11px;color:var(--texto-suave);font-family:'Inter',sans-serif;line-height:1.4;">${i.descripcion}</p>
              ${obtenida
                ? '<p style="font-size:11px;color:var(--verde);font-weight:700;font-family:\'Poppins\',sans-serif;margin-top:8px;">Obtenida ✓</p>'
                : '<p style="font-size:11px;color:var(--texto-suave);font-family:\'Inter\',sans-serif;margin-top:8px;">Bloqueada</p>'
              }
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  renderNav(container, 'gamificacion');
}

async function verificarLogros() {
  const gastos = await db.gastos.toArray();
  const presupuestos = await db.presupuestos.toArray();
  const metas = await db.metas.toArray();
  const insigniasObtenidas = await db.insignias.toArray();
  const obtenidas = insigniasObtenidas.map(i => i.insigniaId);

  async function otorgar(id) {
    if (!obtenidas.includes(id)) {
      await db.insignias.add({ insigniaId: id, fecha: new Date().toISOString() });
      obtenidas.push(id);
    }
  }

  if (gastos.length >= 1) await otorgar('primer_gasto');
  if (gastos.length >= 5) await otorgar('cinco_gastos');
  if (presupuestos.length >= 1) await otorgar('primer_presupuesto');
  if (metas.length >= 1) await otorgar('primera_meta');
  if (metas.length >= 3) await otorgar('tres_metas');

  const metaCompletada = metas.find(m => m.montoActual >= m.montoObjetivo);
  if (metaCompletada) await otorgar('meta_completada');

  const presupuestosSinExceso = presupuestos.filter(p => (p.gastado || 0) <= p.monto);
  if (presupuestosSinExceso.length >= 1) await otorgar('sin_exceso_semana');

  const todosAbonos = await db.abonosMetas.toArray();
  if (todosAbonos.length >= 3) await otorgar('mes_sin_exceso');
}