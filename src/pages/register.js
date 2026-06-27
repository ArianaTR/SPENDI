import { navigate } from '../main.js';
import { db } from '../db.js';

export function render(container) {
  container.innerHTML = `
    <div style="min-height:100vh;background:var(--fondo);display:flex;flex-direction:column;justify-content:center;padding:32px 24px;">
      
      <!-- Logo -->
      <div style="text-align:center;margin-bottom:32px;">
        <img src="/src/assets/logo.png" alt="Spendí" style="width:100px;height:auto;margin-bottom:12px;" />
        <p style="color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;">Crea tu cuenta gratis</p>
      </div>

      <!-- Card formulario -->
      <div style="background:var(--blanco);border-radius:24px;padding:28px;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        <h2 style="font-family:'Poppins',sans-serif;font-size:22px;font-weight:700;margin-bottom:6px;color:var(--texto);">Crea tu cuenta</h2>
        <p style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:24px;">Empieza a controlar tus finanzas hoy</p>

        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" id="nombre" class="input-field" placeholder="¿Cómo te llamas?" />
        </div>

        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input type="email" id="correo" class="input-field" placeholder="tu@correo.com" />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" id="password" class="input-field" placeholder="Mínimo 6 caracteres" />
        </div>

        <div class="form-group">
          <label class="form-label">Confirmar contraseña</label>
          <input type="password" id="password2" class="input-field" placeholder="Repite tu contraseña" />
        </div>

        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>
        <div id="success-msg" style="display:none;" class="alerta alerta-verde"></div>

        <div class="form-group" style="margin-top:20px;">
          <button class="btn-primary" id="btn-register">Crear cuenta</button>
        </div>
      </div>

      <p style="text-align:center;color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;margin-top:24px;">
        ¿Ya tienes cuenta? 
        <span id="btn-login" style="color:var(--verde);cursor:pointer;font-weight:700;">Inicia sesión</span>
      </p>

    </div>
  `;

  document.getElementById('btn-login').addEventListener('click', () => navigate('login'));

  document.getElementById('btn-register').addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value.trim();
    const password2 = document.getElementById('password2').value.trim();
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    if (!nombre || !correo || !password || !password2) {
      errorMsg.textContent = 'Por favor completa todos los campos.';
      errorMsg.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorMsg.textContent = 'La contraseña debe tener mínimo 6 caracteres.';
      errorMsg.style.display = 'block';
      return;
    }

    if (password !== password2) {
      errorMsg.textContent = 'Las contraseñas no coinciden.';
      errorMsg.style.display = 'block';
      return;
    }

    const existente = await db.usuarios.where('correo').equals(correo).first();
    if (existente) {
      errorMsg.textContent = 'Ya existe una cuenta con ese correo.';
      errorMsg.style.display = 'block';
      return;
    }

    await db.usuarios.add({ nombre, correo, password: btoa(password) });

    successMsg.textContent = '¡Cuenta creada! Redirigiendo...';
    successMsg.style.display = 'block';

    setTimeout(() => navigate('login'), 1500);
  });
}