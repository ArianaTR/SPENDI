import { navigate } from '../main.js';
import { db } from '../db.js';
import { renderNav } from '../components/nav.js';

export async function render(container) {
  const usuarioId = parseInt(localStorage.getItem('usuarioId'));
  if (!usuarioId) { navigate('login'); return; }
  await mostrarLista(container);
}

async function mostrarLista(container) {
  const grupos = await db.grupos.toArray();
  grupos.sort((a, b) => b.id - a.id);

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h1 class="page-title" style="margin-bottom:0;">Grupos</h1>
        <button class="btn-primary" id="btn-nuevo" style="width:auto;padding:10px 20px;font-size:14px;">+ Nuevo</button>
      </div>

      ${grupos.length === 0 ? `
        <div class="card" style="text-align:center;padding:48px 20px;">
          <p style="font-size:48px;margin-bottom:16px;">👥</p>
          <h2 style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;margin-bottom:8px;">Sin grupos aún</h2>
          <p style="color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;line-height:1.5;">Crea un grupo para dividir gastos con amigos</p>
        </div>
      ` : grupos.map(g => `
        <div class="card" style="cursor:pointer;" data-id="${g.id}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
              <div style="width:32px;height:32px;border-radius:50%;background:${g.gradiente || 'linear-gradient(135deg,#55BB2F,#3d8a22)'};flex-shrink:0;"></div>
              <div style="min-width:0;">
                <h2 style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.nombre}</h2>
                <p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="resumen-${g.id}">Cargando...</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <span style="font-size:18px;color:var(--texto-suave);">›</span>
              <button class="btn-eliminar" data-id="${g.id}" style="padding:6px 10px;background:#FDECEA;border:none;border-radius:10px;cursor:pointer;font-size:14px;">🗑️</button>
            </div>
          </div>
        </div>
            
      `).join('')}
    </div>
  `;

  for (const g of grupos) {
    const participantes = await db.participantes.where('grupoId').equals(g.id).toArray();
    const gastosGrupales = await db.gastosGrupales.where('grupoId').equals(g.id).toArray();
    const totalGastado = gastosGrupales.reduce((sum, gasto) => sum + gasto.montoTotal, 0);
    const el = document.getElementById(`resumen-${g.id}`);
    if (el) el.textContent = `${participantes.length} personas · S/${totalGastado.toFixed(2)} total`;
  }

  document.getElementById('btn-nuevo').addEventListener('click', () => mostrarFormGrupo(container));

  document.querySelectorAll('.card[data-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-eliminar') || e.target.closest('.btn-eliminar')) return;
      mostrarDetalle(container, parseInt(card.dataset.id));
    });
  });

  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('¿Eliminar este grupo?')) {
        const id = parseInt(btn.dataset.id);
        await db.grupos.delete(id);
        await db.participantes.where('grupoId').equals(id).delete();
        await db.gastosGrupales.where('grupoId').equals(id).delete();
        await mostrarLista(container);
      }
    });
  });

  renderNav(container, 'grupos');
}

async function mostrarFormGrupo(container, id = null) {
  const g = id ? await db.grupos.get(id) : null;
  const participantesExistentes = id
    ? await db.participantes.where('grupoId').equals(id).toArray()
    : [];
  let colorSeleccionado = g?.color || 'verde';
  let gradienteSeleccionado = g?.gradiente || 'linear-gradient(135deg,#55BB2F,#3d8a22)';
  let participantes = participantesExistentes.map(p => p.nombre);
  if (participantes.length === 0) participantes = [''];

  function renderParticipantes() {
    return participantes.map((p, i) => `
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input type="text" class="input-field participante-input" data-index="${i}"
          placeholder="Nombre del participante" value="${p}" style="flex:1;" />
        ${participantes.length > 1 ? `<button class="btn-eliminar-p" data-index="${i}" style="padding:0 14px;background:#FDECEA;border:none;border-radius:12px;cursor:pointer;font-size:18px;color:var(--rojo);">×</button>` : ''}
      </div>
    `).join('');
  }

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">${g ? 'Editar' : 'Nuevo'} grupo</h1>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Nombre del grupo</label>
          <input type="text" id="nombre-grupo" class="input-field" placeholder="Ej: Salida del sábado" value="${g?.nombre || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Color del grupo</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${[
              { id: 'verde', gradiente: 'linear-gradient(135deg,#55BB2F,#3d8a22)' },
              { id: 'azul', gradiente: 'linear-gradient(135deg,#3B82F6,#1d4ed8)' },
              { id: 'morado', gradiente: 'linear-gradient(135deg,#A855F7,#7e22ce)' },
              { id: 'naranja', gradiente: 'linear-gradient(135deg,#FF8963,#ea580c)' },
              { id: 'rosa', gradiente: 'linear-gradient(135deg,#EC4899,#be185d)' },
              { id: 'celeste', gradiente: 'linear-gradient(135deg,#06B6D4,#0e7490)' }
            ].map(c => `
              <div class="color-option" data-color="${c.id}" data-gradiente="${c.gradiente}"
                style="width:36px;height:36px;border-radius:50%;background:${c.gradiente};cursor:pointer;
                border:3px solid ${(g?.color || 'verde') === c.id ? 'var(--texto)' : 'transparent'};
                transition:transform 0.2s,border 0.2s;">
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Participantes</label>
          <div id="lista-participantes">${renderParticipantes()}</div>
          <button id="btn-agregar-p" style="margin-top:8px;padding:12px 16px;background:var(--fondo);border:2px dashed var(--borde);border-radius:12px;width:100%;cursor:pointer;color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;">+ Agregar participante</button>
        </div>

        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>

        <button class="btn-primary" id="btn-guardar" style="margin-top:8px;">Guardar grupo</button>
      </div>
    </div>
  `;

  function reRenderParticipantes() {
    document.getElementById('lista-participantes').innerHTML = renderParticipantes();
    attachParticipantesEvents();
  }

  function attachParticipantesEvents() {
    document.querySelectorAll('.participante-input').forEach(input => {
      input.addEventListener('input', (e) => {
        participantes[parseInt(e.target.dataset.index)] = e.target.value;
      });
    });
    document.querySelectorAll('.btn-eliminar-p').forEach(btn => {
      btn.addEventListener('click', () => {
        participantes.splice(parseInt(btn.dataset.index), 1);
        reRenderParticipantes();
      });
    });
  }

  attachParticipantesEvents();
  document.querySelectorAll('.color-option').forEach(el => {
    el.addEventListener('click', () => {
      colorSeleccionado = el.dataset.color;
      gradienteSeleccionado = el.dataset.gradiente;
      document.querySelectorAll('.color-option').forEach(o => o.style.border = '3px solid transparent');
      el.style.border = '3px solid var(--texto)';
    });
  });
  document.getElementById('btn-back').addEventListener('click', () => mostrarLista(container));
  document.getElementById('btn-agregar-p').addEventListener('click', () => {
    participantes.push('');
    reRenderParticipantes();
  });

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const nombre = document.getElementById('nombre-grupo').value.trim();
    const errorMsg = document.getElementById('error-msg');
    const nombresValidos = participantes.filter(p => p.trim() !== '');

    if (!nombre) {
      errorMsg.textContent = 'Ingresa un nombre para el grupo.';
      errorMsg.style.display = 'block';
      return;
    }

    if (nombresValidos.length < 2) {
      errorMsg.textContent = 'Agrega al menos 2 participantes.';
      errorMsg.style.display = 'block';
      return;
    }

    if (g) {
      await db.grupos.update(id, { nombre, color: colorSeleccionado, gradiente: gradienteSeleccionado });
      await db.participantes.where('grupoId').equals(id).delete();
    } else {
      id = await db.grupos.add({ nombre, color: colorSeleccionado, gradiente: gradienteSeleccionado });
    }

    for (const nombre of nombresValidos) {
      await db.participantes.add({ grupoId: id, nombre: nombre.trim() });
    }

    await mostrarLista(container);
  });
}

async function mostrarDetalle(container, grupoId) {
  const grupo = await db.grupos.get(grupoId);
  const participantes = await db.participantes.where('grupoId').equals(grupoId).toArray();
  const gastosGrupales = await db.gastosGrupales.where('grupoId').equals(grupoId).toArray();
  gastosGrupales.sort((a, b) => b.id - a.id);

  const totalGastado = gastosGrupales.reduce((sum, g) => sum + g.montoTotal, 0);

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">${grupo.nombre}</h1>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
        ${participantes.map(p => `
          <span style="padding:6px 14px;background:var(--fondo);border-radius:999px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;">${p.nombre}</span>
        `).join('')}
      </div>

      <div id="resumen-deudas" style="margin-bottom:16px;"></div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;">Gastos del grupo</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-primary" id="btn-nuevo-gasto" style="width:auto;padding:8px 16px;font-size:13px;">+ Gasto</button>
          <button class="btn-secondary" id="btn-compartir" style="width:auto;padding:8px 16px;font-size:13px;">Compartir</button>
        </div>
      </div>

      ${gastosGrupales.length === 0 ? `
        <div class="card" style="text-align:center;padding:32px;">
          <p style="font-size:32px;margin-bottom:8px;">🧾</p>
          <p style="color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;">Sin gastos registrados aún</p>
        </div>
      ` : gastosGrupales.map(g => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
            <div>
              <p style="font-family:'Poppins',sans-serif;font-size:15px;font-weight:700;">${g.descripcion}</p>
              <p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-top:2px;">${g.fecha}</p>
            </div>
            <p style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;color:var(--rojo);">S/${g.montoTotal.toFixed(2)}</p>
          </div>
          <div id="deudas-${g.id}"></div>
        </div>
      `).join('')}
    </div>
  `;

  for (const g of gastosGrupales) {
    const deudas = await db.gastosParticipante.where('gastoGrupalId').equals(g.id).toArray();
    const el = document.getElementById(`deudas-${g.id}`);
    if (el) {
      el.innerHTML = deudas.map(d => {
        const p = participantes.find(p => p.id === d.participanteId);
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--borde);">
            <span style="font-size:13px;font-family:'Inter',sans-serif;">${p?.nombre || 'Desconocido'}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:13px;font-weight:600;font-family:'Poppins',sans-serif;">S/${d.monto.toFixed(2)}</span>
              <span class="btn-toggle-pago" data-id="${d.id}" data-pagado="${d.pagado}"
                style="font-size:12px;padding:4px 12px;border-radius:999px;cursor:pointer;font-weight:600;font-family:'Inter',sans-serif;
                background:${d.pagado ? '#E8F5E0' : '#FDECEA'};
                color:${d.pagado ? '#2d6a16' : '#8B1A14'};">
                ${d.pagado ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
          </div>
        `;
      }).join('');

      el.querySelectorAll('.btn-toggle-pago').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pagado = btn.dataset.pagado === 'true';
          await db.gastosParticipante.update(parseInt(btn.dataset.id), { pagado: !pagado });
          await mostrarDetalle(container, grupoId);
        });
      });
    }
  }

  const deudaPorPersona = {};
  const pendientePorPersona = {};
  participantes.forEach(p => {
    deudaPorPersona[p.id] = 0;
    pendientePorPersona[p.id] = 0;
  });

  for (const g of gastosGrupales) {
    const deudas = await db.gastosParticipante.where('gastoGrupalId').equals(g.id).toArray();
    deudas.forEach(d => {
      if (deudaPorPersona[d.participanteId] !== undefined) {
        deudaPorPersona[d.participanteId] += d.monto;
        if (!d.pagado) pendientePorPersona[d.participanteId] += d.monto;
      }
    });
  }

  const resumenEl = document.getElementById('resumen-deudas');
  if (resumenEl) {
    resumenEl.innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#FAF9F6,#fff);margin-bottom:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-family:'Poppins',sans-serif;font-size:15px;font-weight:700;">Lo que debe cada uno</h2>
          <span style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;">Total: S/${totalGastado.toFixed(2)}</span>
        </div>
        ${participantes.map(p => {
          const pendiente = pendientePorPersona[p.id] || 0;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--borde);">
              <span style="font-size:14px;font-weight:600;font-family:'Inter',sans-serif;">${p.nombre}</span>
              ${pendiente > 0
                ? `<span style="font-size:14px;font-weight:700;color:var(--rojo);font-family:'Poppins',sans-serif;">S/${pendiente.toFixed(2)} pendiente</span>`
                : `<span style="font-size:14px;font-weight:700;color:var(--verde);font-family:'Poppins',sans-serif;">Pagado ✅</span>`
              }
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  const deudaResumenComp = {};
  const pendienteComp = {};
  participantes.forEach(p => {
    deudaResumenComp[p.id] = 0;
    pendienteComp[p.id] = 0;
  });

  let lineasGastosComp = '';
  for (const g of gastosGrupales) {
    const deudas = await db.gastosParticipante.where('gastoGrupalId').equals(g.id).toArray();
    lineasGastosComp += `\n${g.descripcion} (S/${g.montoTotal.toFixed(2)})\n`;
    for (const d of deudas) {
      const p = participantes.find(p => p.id === d.participanteId);
      if (p) {
        lineasGastosComp += `- ${p.nombre}: S/${d.monto.toFixed(2)} ${d.pagado ? '✅' : '❌'}\n`;
        deudaResumenComp[p.id] += d.monto;
        if (!d.pagado) pendienteComp[p.id] += d.monto;
      }
    }
  }

  const lineasTotalComp = participantes.map(p => {
    const pendiente = pendienteComp[p.id] || 0;
    const total = deudaResumenComp[p.id] || 0;
    if (pendiente === 0) return `- ${p.nombre}: S/${total.toFixed(2)} (pagado ✅)`;
    return `- ${p.nombre}: S/${pendiente.toFixed(2)} pendiente ❌`;
  }).join('\n');

  const textoCompartir = `👥 Grupo: ${grupo.nombre}\n${lineasGastosComp}\nTotal por persona:\n${lineasTotalComp}\n\n_Cuida tus finanzas con Spendí 💚_`;

  document.getElementById('btn-back').addEventListener('click', () => mostrarLista(container));
  document.getElementById('btn-nuevo-gasto').addEventListener('click', () => mostrarFormGastoGrupal(container, grupoId, participantes));
  document.getElementById('btn-compartir').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ text: textoCompartir });
    } else {
      navigator.clipboard.writeText(textoCompartir);
      alert('Texto copiado al portapapeles');
    }
  });
}

async function mostrarFormGastoGrupal(container, grupoId, participantes) {
  const hoy = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">Nuevo gasto grupal</h1>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <input type="text" id="descripcion" class="input-field" placeholder="Ej: Cena en restaurante" />
        </div>

        <div class="form-group">
          <label class="form-label">Monto total (S/)</label>
          <input type="number" id="monto" class="input-field" placeholder="0.00" />
        </div>

        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="date" id="fecha" class="input-field" value="${hoy}" />
        </div>

        <div class="form-group">
          <label class="form-label">Participantes involucrados</label>
          ${participantes.map(p => `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:10px;background:var(--fondo);border-radius:12px;">
              <input type="checkbox" class="check-participante" data-id="${p.id}" id="p-${p.id}" checked style="width:20px;height:20px;accent-color:var(--verde);" />
              <label for="p-${p.id}" style="font-size:15px;font-family:'Inter',sans-serif;cursor:pointer;">${p.nombre}</label>
            </div>
          `).join('')}
        </div>

        <div id="preview-division" class="alerta alerta-verde" style="display:none;"></div>
        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>

        <button class="btn-primary" id="btn-guardar" style="margin-top:8px;">Registrar gasto</button>
      </div>
    </div>
  `;

  function actualizarPreview() {
    const monto = parseFloat(document.getElementById('monto').value) || 0;
    const seleccionados = document.querySelectorAll('.check-participante:checked');
    const preview = document.getElementById('preview-division');
    if (monto > 0 && seleccionados.length > 0) {
      const porPersona = monto / seleccionados.length;
      preview.textContent = `S/${porPersona.toFixed(2)} por persona (${seleccionados.length} personas)`;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }

  document.getElementById('monto').addEventListener('input', actualizarPreview);
  document.querySelectorAll('.check-participante').forEach(c => c.addEventListener('change', actualizarPreview));
  document.getElementById('btn-back').addEventListener('click', () => mostrarDetalle(container, grupoId));

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const descripcion = document.getElementById('descripcion').value.trim();
    const montoTotal = parseFloat(document.getElementById('monto').value);
    const fecha = document.getElementById('fecha').value;
    const seleccionados = [...document.querySelectorAll('.check-participante:checked')];
    const errorMsg = document.getElementById('error-msg');

    if (!descripcion || !montoTotal || !fecha) {
      errorMsg.textContent = 'Completa todos los campos.';
      errorMsg.style.display = 'block';
      return;
    }

    if (seleccionados.length < 2) {
      errorMsg.textContent = 'Selecciona al menos 2 participantes.';
      errorMsg.style.display = 'block';
      return;
    }

    const gastoId = await db.gastosGrupales.add({ grupoId, descripcion, montoTotal, fecha });
    const montoPorPersona = montoTotal / seleccionados.length;

    for (const check of seleccionados) {
      await db.gastosParticipante.add({
        gastoGrupalId: gastoId,
        participanteId: parseInt(check.dataset.id),
        monto: montoPorPersona,
        pagado: false
      });
    }

    await mostrarDetalle(container, grupoId);
  });
}