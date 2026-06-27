import { navigate } from '../main.js';
import { db } from '../db.js';
import { renderNav } from '../components/nav.js';

export async function render(container) {
  const usuarioId = parseInt(localStorage.getItem('usuarioId'));
  if (!usuarioId) { navigate('login'); return; }
  await mostrarLista(container);
}

async function mostrarLista(container) {
  const metas = await db.metas.toArray();
  metas.sort((a, b) => b.id - a.id);

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h1 class="page-title" style="margin-bottom:0;">Metas de ahorro</h1>
        <button class="btn-primary" id="btn-nueva" style="width:auto;padding:10px 20px;font-size:14px;">+ Nueva</button>
      </div>

      ${metas.length === 0 ? `
        <div class="card" style="text-align:center;padding:48px 20px;">
          <p style="font-size:48px;margin-bottom:16px;">🎯</p>
          <h2 style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;margin-bottom:8px;">Sin metas aún</h2>
          <p style="color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;line-height:1.5;">Crea tu primera meta y empieza a ahorrar con propósito</p>
        </div>
      ` : metas.map(m => {
        const pct = Math.min((m.montoActual / m.montoObjetivo) * 100, 100);
        const restante = m.montoObjetivo - m.montoActual;
        const completada = pct >= 100;
        return `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
              <div>
                <span style="font-size:11px;padding:3px 10px;border-radius:999px;font-weight:600;font-family:'Poppins',sans-serif;background:${completada ? '#E8F5E0' : 'var(--fondo)'};color:${completada ? '#2d6a16' : 'var(--texto-suave)'};">
                  ${completada ? 'Completada ✅' : 'En progreso'}
                </span>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="btn-editar" data-id="${m.id}" style="padding:6px 10px;background:var(--fondo);border:none;border-radius:10px;cursor:pointer;font-size:15px;">✏️</button>
                <button class="btn-eliminar" data-id="${m.id}" style="padding:6px 10px;background:#FDECEA;border:none;border-radius:10px;cursor:pointer;font-size:15px;">🗑️</button>
              </div>
            </div>

            <h2 style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;margin-bottom:4px;">${m.nombre}</h2>
            ${m.fechaLimite ? `<p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:12px;">📅 Fecha límite: ${m.fechaLimite}</p>` : '<p style="font-size:12px;color:var(--texto-suave);font-family:\'Inter\',sans-serif;margin-bottom:12px;">Sin fecha límite</p>'}

            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;">Progreso</span>
              <span style="font-size:13px;font-weight:700;font-family:'Poppins',sans-serif;color:var(--verde);">${pct.toFixed(1)}%</span>
            </div>
            <div class="barra-container">
              <div class="barra-fill" style="width:${pct}%;background:var(--verde);"></div>
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:10px;margin-bottom:16px;">
              <div>
                <p style="font-size:11px;color:var(--texto-suave);font-family:'Inter',sans-serif;">Ahorrado</p>
                <p style="font-size:18px;font-weight:700;font-family:'Poppins',sans-serif;color:var(--verde);">S/${m.montoActual.toFixed(2)}</p>
              </div>
              <div style="text-align:right;">
                <p style="font-size:11px;color:var(--texto-suave);font-family:'Inter',sans-serif;">Objetivo</p>
                <p style="font-size:18px;font-weight:700;font-family:'Poppins',sans-serif;">S/${m.montoObjetivo.toFixed(2)}</p>
              </div>
            </div>

            ${!completada ? `
              <p style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:12px;">Faltan <span style="font-weight:700;color:var(--texto);">S/${restante.toFixed(2)}</span> para completar tu meta</p>
              <button class="btn-primary btn-abonar" data-id="${m.id}" style="padding:12px;font-size:14px;">+ Abonar</button>
            ` : `
              <div style="text-align:center;padding:12px;background:#E8F5E0;border-radius:12px;">
                <p style="color:#2d6a16;font-weight:700;font-family:'Poppins',sans-serif;">¡Meta alcanzada!</p>
              </div>
            `}
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('btn-nueva').addEventListener('click', () => mostrarFormulario(container));

  document.querySelectorAll('.btn-abonar').forEach(btn => {
    btn.addEventListener('click', () => mostrarFormAbonar(container, parseInt(btn.dataset.id)));
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => mostrarFormulario(container, parseInt(btn.dataset.id)));
  });

  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta meta?')) {
        await db.metas.delete(parseInt(btn.dataset.id));
        await mostrarLista(container);
      }
    });
  });

  renderNav(container, 'metas');
}

async function mostrarFormulario(container, id = null) {
  const m = id ? await db.metas.get(id) : null;

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">${m ? 'Editar' : 'Nueva'} meta</h1>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Nombre de la meta</label>
          <input type="text" id="nombre" class="input-field" placeholder="Ej: Viaje a la playa" value="${m?.nombre || ''}" />
        </div>

        <div class="form-group">
          <label class="form-label">Monto objetivo (S/)</label>
          <input type="number" id="montoObjetivo" class="input-field" placeholder="0.00" value="${m?.montoObjetivo || ''}" />
        </div>

        <div class="form-group">
          <label class="form-label">Monto inicial ahorrado (S/)</label>
          <input type="number" id="montoActual" class="input-field" placeholder="0.00" value="${m?.montoActual || 0}" />
        </div>

        <div class="form-group">
          <label class="form-label">Fecha límite (opcional)</label>
          <input type="date" id="fechaLimite" class="input-field" value="${m?.fechaLimite || ''}" />
        </div>

        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>

        <button class="btn-primary" id="btn-guardar" style="margin-top:8px;">Guardar meta</button>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => mostrarLista(container));

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value.trim();
    const montoObjetivo = parseFloat(document.getElementById('montoObjetivo').value);
    const montoActual = parseFloat(document.getElementById('montoActual').value) || 0;
    const fechaLimite = document.getElementById('fechaLimite').value || null;
    const errorMsg = document.getElementById('error-msg');

    if (!nombre || !montoObjetivo) {
      errorMsg.textContent = 'Por favor completa los campos obligatorios.';
      errorMsg.style.display = 'block';
      return;
    }

    if (montoObjetivo <= 0) {
      errorMsg.textContent = 'El monto objetivo debe ser mayor a 0.';
      errorMsg.style.display = 'block';
      return;
    }

    if (montoActual > montoObjetivo) {
      errorMsg.textContent = 'El monto ahorrado no puede superar el objetivo.';
      errorMsg.style.display = 'block';
      return;
    }

    if (m) {
      await db.metas.update(id, { nombre, montoObjetivo, montoActual, fechaLimite });
    } else {
      await db.metas.add({ nombre, montoObjetivo, montoActual, fechaLimite });
    }

    await mostrarLista(container);
  });
}

async function mostrarFormAbonar(container, id) {
  const meta = await db.metas.get(id);
  const restante = meta.montoObjetivo - meta.montoActual;
  const pct = Math.min((meta.montoActual / meta.montoObjetivo) * 100, 100);

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">Abonar a meta</h1>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h2 style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;margin-bottom:4px;">${meta.nombre}</h2>
        <p style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:12px;">Te faltan S/${restante.toFixed(2)} para completar tu meta</p>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:var(--texto-suave);">Progreso actual</span>
          <span style="font-size:13px;font-weight:700;color:var(--verde);">${pct.toFixed(1)}%</span>
        </div>
        <div class="barra-container">
          <div class="barra-fill" style="width:${pct}%;background:var(--verde);"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:13px;color:var(--texto-suave);">S/${meta.montoActual.toFixed(2)} ahorrado</span>
          <span style="font-size:13px;font-weight:600;">S/${meta.montoObjetivo.toFixed(2)} objetivo</span>
        </div>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">¿Cuánto vas a abonar? (S/)</label>
          <input type="number" id="abono" class="input-field" placeholder="0.00" />
        </div>

        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>

        <button class="btn-primary" id="btn-abonar" style="margin-top:8px;">Confirmar abono</button>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => mostrarLista(container));

  document.getElementById('btn-abonar').addEventListener('click', async () => {
    const abono = parseFloat(document.getElementById('abono').value);
    const errorMsg = document.getElementById('error-msg');

    if (!abono || abono <= 0) {
      errorMsg.textContent = 'Ingresa un monto válido.';
      errorMsg.style.display = 'block';
      return;
    }

    const nuevoMonto = meta.montoActual + abono;

    if (nuevoMonto > meta.montoObjetivo) {
      errorMsg.textContent = `El abono supera el objetivo. Máximo: S/${restante.toFixed(2)}`;
      errorMsg.style.display = 'block';
      return;
    }

    await db.metas.update(id, { montoActual: nuevoMonto });
    await db.abonosMetas.add({ metaId: id, monto: abono, fecha: new Date().toISOString().split('T')[0] });
    mostrarPantallaCelebracion(container, meta, nuevoMonto, abono);
  });
}

function mostrarPantallaCelebracion(container, meta, nuevoMonto, abono) {
  const motivadores = [
    '¡Excelente! Estás construyendo hábitos financieros saludables.',
    'Cada registro cuenta. ¡Sigue así!',
    'Tu esfuerzo está dando resultados.',
    'Pequeñas decisiones generan grandes cambios.',
    'Tu progreso financiero sigue avanzando.',
    'Estás más cerca de tus objetivos.'
  ];
  const motivador = motivadores[Math.floor(Math.random() * motivadores.length)];
  const completada = nuevoMonto >= meta.montoObjetivo;
  const pct = Math.min((nuevoMonto / meta.montoObjetivo) * 100, 100);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;padding:40px 24px;text-align:center;background:var(--fondo);">
      <div style="font-size:72px;margin-bottom:24px;">
        ${completada ? '🏆' : '💪'}
      </div>
      <h2 style="font-family:'Poppins',sans-serif;font-size:26px;font-weight:800;color:var(--texto);margin-bottom:12px;">
        ${completada ? '¡Meta alcanzada!' : '¡Buen trabajo!'}
      </h2>
      <p style="font-size:15px;color:var(--texto-suave);font-family:'Inter',sans-serif;line-height:1.6;margin-bottom:32px;max-width:280px;">
        ${motivador}
      </p>
      <div style="background:var(--blanco);border-radius:20px;padding:20px;width:100%;max-width:320px;margin-bottom:32px;box-shadow:var(--sombra-card);">
        <p style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:4px;">${meta.nombre}</p>
        <div class="barra-container" style="margin:12px 0;">
          <div class="barra-fill" style="width:${pct}%;background:var(--verde);"></div>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:var(--texto-suave);">+S/${abono.toFixed(2)} abonado</span>
          <span style="font-size:13px;font-weight:600;color:var(--verde);">S/${nuevoMonto.toFixed(2)} / S/${meta.montoObjetivo.toFixed(2)}</span>
        </div>
      </div>
      <button class="btn-primary" id="btn-continuar" style="max-width:320px;">
        ${completada ? '🎉 Ver mis metas' : 'Continuar ahorrando'}
      </button>
    </div>
  `;

  document.getElementById('btn-continuar').addEventListener('click', () => mostrarLista(container));
}