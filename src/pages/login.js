import { navigate } from '../main.js';
import { db } from '../db.js';

export function render(container) {
  container.innerHTML = `
    <div style="min-height:100vh;background:var(--fondo);display:flex;flex-direction:column;justify-content:center;padding:32px 24px;">
      
      <!-- Logo -->
      <div style="text-align:center;margin-bottom:40px;">
        <img src="/src/assets/logo.png" alt="Spendí" style="width:120px;height:auto;margin-bottom:12px;" />
        <p style="color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;letter-spacing:0.3px;">Tu dinero en equilibrio</p>
      </div>

      <!-- Card formulario -->
      <div style="background:var(--blanco);border-radius:24px;padding:28px;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        <h2 style="font-family:'Poppins',sans-serif;font-size:22px;font-weight:700;margin-bottom:6px;color:var(--texto);">Bienvenido de vuelta</h2>
        <p style="font-size:13px;color:var(--texto-suave);font-family:'Inter',sans-serif;margin-bottom:24px;">Ingresa a tu cuenta para continuar</p>
        
        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input type="email" id="correo" class="input-field" placeholder="tu@correo.com" />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" id="password" class="input-field" placeholder="••••••••" />
        </div>

        <div id="error-msg" style="display:none;" class="alerta alerta-rojo"></div>

        <div class="form-group" style="margin-top:20px;">
          <button class="btn-primary" id="btn-login">Iniciar sesión</button>
        </div>

        <p style="text-align:center;color:var(--texto-suave);font-size:13px;font-family:'Inter',sans-serif;">
          ¿Olvidaste tu contraseña? 
          <span id="btn-recuperar" style="color:var(--verde);cursor:pointer;font-weight:600;">Recupérala</span>
        </p>
      </div>

      <p style="text-align:center;color:var(--texto-suave);font-size:14px;font-family:'Inter',sans-serif;margin-top:24px;">
        ¿No tienes cuenta? 
        <span id="btn-register" style="color:var(--verde);cursor:pointer;font-weight:700;">Regístrate gratis</span>
      </p>

    </div>
  `;

  document.getElementById('btn-register').addEventListener('click', () => navigate('register'));

  document.getElementById('btn-login').addEventListener('click', async () => {
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('error-msg');

    if (!correo || !password) {
      errorMsg.textContent = 'Por favor completa todos los campos.';
      errorMsg.style.display = 'block';
      return;
    }

    const usuario = await db.usuarios.where('correo').equals(correo).first();

    if (!usuario || usuario.password !== btoa(password)) {
      errorMsg.textContent = 'Correo o contraseña incorrectos.';
      errorMsg.style.display = 'block';
      return;
    }

    localStorage.setItem('usuarioId', usuario.id);
    localStorage.setItem('usuarioNombre', usuario.nombre);
    navigate('dashboard');
  });

  document.getElementById('btn-recuperar').addEventListener('click', () => {
    alert('Función de recuperación próximamente.');
  });
}