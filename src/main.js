import './style.css';

// Registrar service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW error:', err);
    });
  });
}
// Router simple
const routes = {
  login: () => import('./pages/login.js'),
  register: () => import('./pages/register.js'),
  dashboard: () => import('./pages/dashboard.js'),
  presupuestos: () => import('./pages/presupuestos.js'),
  metas: () => import('./pages/metas.js'),
  grupos: () => import('./pages/grupos.js'),
  gamificacion: () => import('./pages/gamificacion.js'),
  configuracion: () => import('./pages/configuracion.js'),
};

export function navigate(page, params = {}) {
  window.currentParams = params;
  history.pushState({ page }, '', `#${page}`);
  renderPage(page);
}

async function renderPage(page) {
  const app = document.getElementById('app');
  app.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;">⏳</div>';

  try {
    const module = await routes[page]?.();
    if (module) {
      app.innerHTML = '';
      module.render(app);
    }
  } catch (e) {
    console.error(e);
  }
}

// Manejar botón atrás del navegador
window.addEventListener('popstate', (e) => {
  const page = e.state?.page || 'login';
  renderPage(page);
});

// Página inicial
const hash = window.location.hash.replace('#', '') || 'login';
renderPage(hash);