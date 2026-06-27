import { navigate } from '../main.js';
import { db } from '../db.js';
import { renderNav } from '../components/nav.js';
import { renderSemaforo } from '../components/semaforo.js';

export async function render(container) {
  const usuarioId = parseInt(localStorage.getItem('usuarioId'));
  if (!usuarioId) { navigate('login'); return; }
  await mostrarLista(container);
}

async function mostrarLista(container) {
  const presupuestos = await db.presupuestos.toArray();
  presupuestos.sort((a, b) => b.id - a.id);

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h1 class="page-title" style="margin-bottom:0;">Presupuestos</h1>
        <button class="btn-primary" id="btn-nuevo" style="width:auto;padding:10px 20px;font-size:14px;">+ Nuevo</button>
      </div>

      ${presupuestos.length === 0 ? `
        <div class="card" style="text-align:center;padding:48px 20px;">
          <p style="font-size:48px;margin-bottom:16px;">💰</p>
          <h2 style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;margin-bottom:8px;">Sin presupuestos aún</h2>
          <p style="color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;line-height:1.5;">Crea tu primer presupuesto para empezar a controlar tus gastos</p>
        </div>
      ` : presupuestos.map(p => {
        const gastado = p.gastado || 0;
        const pct = Math.min((gastado / p.monto) * 100, 100);
        const restante = p.monto - gastado;
        const pctRestante = 100 - pct;
        let color = 'var(--verde)';
        let bgEstado = '#E8F5E0';
        let colorEstado = '#2d6a16';
        let estadoTexto = 'Saludable';
        if (pctRestante <= 10) {
          color = 'var(--rojo)';
          bgEstado = '#FDECEA';
          colorEstado = '#8B1A14';
          estadoTexto = 'En exceso';
        } else if (pctRestante <= 30) {
          color = 'var(--rojo)';
          bgEstado = '#FDECEA';
          colorEstado = '#8B1A14';
          estadoTexto = 'Critico';
        } else if (pctRestante <= 60) {
          color = 'var(--naranja)';
          bgEstado = '#FFF0E8';
          colorEstado = '#8a3500';
          estadoTexto = 'Precaucion';
        }
        return `
          <div class="card" style="">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
              <div>
                <h2 style="font-family:'Poppins',sans-serif;font-size:17px;font-weight:700;margin-bottom:4px;">${p.nombre}</h2>
                <p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;">${p.fechaInicio} → ${p.fechaFin}</p>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                <span style="font-size:11px;padding:3px 10px;border-radius:999px;background:${bgEstado};color:${colorEstado};font-weight:600;font-family:'Poppins',sans-serif;">${estadoTexto}</span>
                ${p.activo ? '<span style="font-size:11px;padding:3px 10px;border-radius:999px;background:#E8F5E0;color:#2d6a16;font-weight:600;font-family:\'Poppins\',sans-serif;">Activo</span>' : ''}
              </div>
            </div>

            <div class="barra-container">
              <div class="barra-fill" style="width:${pct}%;background:${color};"></div>
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:10px;margin-bottom:16px;">
              <div style="text-align:left;">
                <p style="font-size:11px;color:var(--texto-suave);font-family:'Inter',sans-serif;">Gastado</p>
                <p style="font-size:16px;font-weight:700;font-family:'Poppins',sans-serif;color:${color};">S/${gastado.toFixed(2)}</p>
              </div>
              <div style="text-align:center;">
                <p style="font-size:11px;color:var(--texto-suave);font-family:'Inter',sans-serif;">Restante</p>
                <p style="font-size:16px;font-weight:700;font-family:'Poppins',sans-serif;">S/${restante.toFixed(2)}</p>
              </div>
              <div style="text-align:right;">
                <p style="font-size:11px;color:var(--texto-suave);font-family:'Inter',sans-serif;">Total</p>
                <p style="font-size:16px;font-weight:700;font-family:'Poppins',sans-serif;">S/${p.monto.toFixed(2)}</p>
              </div>
            </div>

            <div style="display:flex;gap:8px;">
              <button class="btn-primary btn-gasto" data-id="${p.id}" style="padding:10px;font-size:13px;">+ Registrar gasto</button>
              <button class="btn-editar" data-id="${p.id}" style="padding:10px 14px;background:var(--fondo);border:none;border-radius:12px;cursor:pointer;font-size:16px;">✏️</button>
              <button class="btn-eliminar" data-id="${p.id}" style="padding:10px 14px;background:#FDECEA;border:none;border-radius:12px;cursor:pointer;font-size:16px;">🗑️</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('btn-nuevo').addEventListener('click', () => mostrarFormulario(container));

  document.querySelectorAll('.btn-gasto').forEach(btn => {
    btn.addEventListener('click', () => mostrarFormGasto(container, parseInt(btn.dataset.id)));
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => mostrarFormulario(container, parseInt(btn.dataset.id)));
  });

  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar este presupuesto?')) {
        await db.presupuestos.delete(parseInt(btn.dataset.id));
        await mostrarLista(container);
      }
    });
  });

  renderNav(container, 'presupuestos');
}

async function mostrarFormulario(container, id = null) {
  const p = id ? await db.presupuestos.get(id) : null;
  const hoy = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">${p ? 'Editar' : 'Nuevo'} presupuesto</h1>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" id="nombre" class="input-field" placeholder="Ej: Salida del viernes" value="${p?.nombre || ''}" />
        </div>

        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select id="tipo" class="input-field">
            <option value="Salida" ${p?.tipo === 'Salida' ? 'selected' : ''}>Salida especifica</option>
            <option value="Diario" ${p?.tipo === 'Diario' ? 'selected' : ''}>Diario</option>
            <option value="Semanal" ${p?.tipo === 'Semanal' ? 'selected' : ''}>Semanal</option>
            <option value="Mensual" ${p?.tipo === 'Mensual' ? 'selected' : ''}>Mensual</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Monto (S/)</label>
          <input type="number" id="monto" class="input-field" placeholder="0.00" value="${p?.monto || ''}" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Fecha inicio</label>
            <input type="date" id="fechaInicio" class="input-field" value="${p?.fechaInicio || hoy}" />
          </div>
          <div class="form-group">
            <label class="form-label">Fecha fin</label>
            <input type="date" id="fechaFin" class="input-field" value="${p?.fechaFin || hoy}" />
          </div>
        </div>

        <div class="form-group" style="display:flex;align-items:center;gap:10px;padding:14px;background:var(--fondo);border-radius:12px;">
          <input type="checkbox" id="activo" style="width:20px;height:20px;accent-color:var(--verde);" ${p?.activo || !p ? 'checked' : ''} />
          <label for="activo" style="font-size:14px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;">Marcar como presupuesto activo</label>
        </div>

        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>

        <button class="btn-primary" id="btn-guardar" style="margin-top:8px;">Guardar presupuesto</button>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => mostrarLista(container));

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value.trim();
    const tipo = document.getElementById('tipo').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const activo = document.getElementById('activo').checked;
    const errorMsg = document.getElementById('error-msg');

    if (!nombre || !monto || !fechaInicio || !fechaFin) {
      errorMsg.textContent = 'Por favor completa todos los campos.';
      errorMsg.style.display = 'block';
      return;
    }

    if (monto <= 0) {
      errorMsg.textContent = 'El monto debe ser mayor a 0.';
      errorMsg.style.display = 'block';
      return;
    }

    if (fechaFin < fechaInicio) {
      errorMsg.textContent = 'La fecha fin no puede ser anterior a la fecha inicio.';
      errorMsg.style.display = 'block';
      return;
    }

    if (activo) {
      await db.presupuestos.toCollection().modify({ activo: false });
    }

    if (p) {
      await db.presupuestos.update(id, { nombre, tipo, monto, fechaInicio, fechaFin, activo });
    } else {
      await db.presupuestos.add({ nombre, tipo, monto, gastado: 0, fechaInicio, fechaFin, activo });
    }

    await mostrarLista(container);
  });
}

async function mostrarFormGasto(container, presupuestoId) {
  const presupuesto = await db.presupuestos.get(presupuestoId);
  const hoy = new Date().toISOString().split('T')[0];
  const horaActual = new Date().toTimeString().slice(0, 5);
  const fechaDefault = hoy >= presupuesto.fechaInicio && hoy <= presupuesto.fechaFin
    ? hoy
    : presupuesto.fechaInicio;

  const porcentajeRestante = 100 - ((presupuesto.gastado || 0) / presupuesto.monto * 100);
  const enRiesgo = porcentajeRestante <= 60;
  const config = await db.configuracion.where('clave').equals('modoEstricto').first();
  const modoEstricto = config?.valor === 'true';

  let colorSemaforo = 'var(--verde)';
  let mensajeRiesgo = '';
  if (porcentajeRestante <= 10) {
    colorSemaforo = 'var(--rojo)';
    mensajeRiesgo = 'Has superado tu presupuesto. Cada decision cuenta.';
  } else if (porcentajeRestante <= 30) {
    colorSemaforo = 'var(--rojo)';
    mensajeRiesgo = 'Presupuesto critico. Piensa bien antes de gastar.';
  } else if (porcentajeRestante <= 60) {
    colorSemaforo = 'var(--naranja)';
    mensajeRiesgo = 'Estas usando gran parte de tu presupuesto.';
  }

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <span id="btn-back" style="cursor:pointer;font-size:24px;">←</span>
        <h1 class="page-title" style="margin-bottom:0;">Registrar gasto</h1>
      </div>

      <div class="card" style="border-left:4px solid ${colorSemaforo};margin-bottom:16px;">
        <p style="font-size:12px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:4px;">Presupuesto</p>
        <h2 style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px;">${presupuesto.nombre}</h2>
        <div id="semaforo-mini"></div>
      </div>

      ${enRiesgo ? `
        <div class="alerta alerta-amarillo" style="margin-bottom:16px;">
          ⚠️ ${mensajeRiesgo}
        </div>
      ` : ''}

      <div class="card">
        <div class="form-group">
          <label class="form-label">Monto (S/)</label>
          <input type="number" id="monto" class="input-field" placeholder="0.00" />
        </div>

        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select id="categoria" class="input-field">
            <option value="Comida">🍔 Comida</option>
            <option value="Transporte">🚌 Transporte</option>
            <option value="Entretenimiento">🎉 Entretenimiento</option>
            <option value="Bebidas">🥤 Bebidas</option>
            <option value="Compras">🛍️ Compras</option>
            <option value="Otros">📦 Otros</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Descripcion (opcional)</label>
          <input type="text" id="descripcion" class="input-field" placeholder="Ej: Almuerzo con amigos" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" id="fecha" class="input-field"
              value="${fechaDefault}"
              min="${presupuesto.fechaInicio}"
              max="${presupuesto.fechaFin}" />
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input type="time" id="hora" class="input-field" value="${horaActual}" />
          </div>
        </div>

        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>

        <button class="btn-primary" id="btn-guardar" style="margin-top:8px;">Registrar gasto</button>
      </div>
    </div>
  `;

  renderSemaforo(document.getElementById('semaforo-mini'), presupuesto);
  document.getElementById('btn-back').addEventListener('click', () => mostrarLista(container));

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const monto = parseFloat(document.getElementById('monto').value);
    const categoria = document.getElementById('categoria').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const errorMsg = document.getElementById('error-msg');

    if (!monto || monto <= 0) {
      errorMsg.textContent = 'Ingresa un monto valido.';
      errorMsg.style.display = 'block';
      return;
    }

    if (enRiesgo || modoEstricto) {
      await mostrarTemporizador(container, presupuestoId, { monto, categoria, descripcion, fecha, hora }, presupuesto);
      return;
    }

    await guardarGasto(presupuestoId, { monto, categoria, descripcion, fecha, hora });
    await mostrarLista(container);
  });
}

async function mostrarTemporizador(container, presupuestoId, gasto, presupuesto) {
  const porcentajeRestante = 100 - ((presupuesto.gastado || 0) / presupuesto.monto * 100);

  const mensajes = {
    impulsivo: [
      '¿Lo necesitas hoy o lo seguiras queriendo mañana?',
      'Tu meta financiera tambien te esta esperando.',
      'Tomate un momento para decidir.',
      'Tu dinero tambien merece un plan.',
      '¿Esta compra aporta valor a tu dia?',
      'No todo descuento es una oportunidad.'
    ],
    limite: [
      'Estas utilizando gran parte de tu presupuesto disponible.',
      'Aun estas a tiempo de reajustar tus gastos.',
      'Cada decision cuenta para alcanzar tus metas.',
      'Tu bienestar financiero tambien es una prioridad.'
    ],
    exceso: [
      'Esta compra podria afectar tus objetivos financieros actuales.',
      '¿Deseas continuar o revisar tus gastos primero?',
      'Tu presupuesto esta llegando a su limite.',
      'Una decision consciente hoy puede ayudarte mañana.'
    ]
  };

  let listaMensajes = mensajes.impulsivo;
  if (porcentajeRestante <= 10) listaMensajes = mensajes.exceso;
  else if (porcentajeRestante <= 30) listaMensajes = mensajes.limite;

  const mensaje = listaMensajes[Math.floor(Math.random() * listaMensajes.length)];

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;padding:40px 24px;text-align:center;background:var(--fondo);">
      <img src="/src/assets/logo.png" alt="Spendí" style="width:60px;height:auto;margin-bottom:32px;opacity:0.7;" />
      <h2 style="font-family:'Poppins',sans-serif;font-size:22px;font-weight:800;color:var(--texto);margin-bottom:16px;line-height:1.3;">${mensaje}</h2>
      <p style="color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;margin-bottom:40px;">Tomate un momento para reflexionar</p>
      <div style="width:90px;height:90px;border-radius:50%;background:var(--blanco);box-shadow:0 4px 20px rgba(85,187,47,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:40px;">
        <span id="contador" style="font-size:40px;font-weight:800;color:var(--verde);font-family:'Poppins',sans-serif;">10</span>
      </div>
      <div style="width:100%;max-width:320px;display:flex;flex-direction:column;gap:12px;">
        <button class="btn-danger" id="btn-cancelar">Cancelar gasto</button>
        <button class="btn-primary" id="btn-continuar" disabled style="opacity:0.4;">Continuar de todas formas</button>
      </div>
    </div>
  `;

  let segundos = 10;
  const intervalo = setInterval(() => {
    segundos--;
    const el = document.getElementById('contador');
    if (el) el.textContent = segundos;
    if (segundos <= 0) {
      clearInterval(intervalo);
      const btnContinuar = document.getElementById('btn-continuar');
      if (btnContinuar) {
        btnContinuar.disabled = false;
        btnContinuar.style.opacity = '1';
      }
    }
  }, 1000);

  document.getElementById('btn-cancelar').addEventListener('click', () => {
    clearInterval(intervalo);
    mostrarFormGasto(container, presupuestoId);
  });

  document.getElementById('btn-continuar').addEventListener('click', async () => {
    clearInterval(intervalo);
    await guardarGasto(presupuestoId, gasto);
    await mostrarLista(container);
  });
}

async function guardarGasto(presupuestoId, gasto) {
  await db.gastos.add({ presupuestoId, ...gasto });
  const p = await db.presupuestos.get(presupuestoId);
  const nuevoGastado = (p.gastado || 0) + gasto.monto;
  await db.presupuestos.update(presupuestoId, { gastado: nuevoGastado });

  const pct = (nuevoGastado / p.monto) * 100;
  let alerta = null;
  if (pct >= 100) alerta = 'Has alcanzado tu limite de gasto.';
  else if (pct >= 90) alerta = 'Tu presupuesto esta casi agotado.';
  else if (pct >= 75) alerta = 'Estas cerca de alcanzar tu limite.';
  else if (pct >= 50) alerta = 'Ya utilizaste la mitad de tu presupuesto.';

  if (alerta) setTimeout(() => alert(alerta), 300);
}