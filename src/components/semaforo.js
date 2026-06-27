export function renderSemaforo(container, presupuesto) {
  const porcentajeGastado = (presupuesto.gastado / presupuesto.monto) * 100;
  const porcentajeRestante = 100 - porcentajeGastado;
  const restante = presupuesto.monto - presupuesto.gastado;

  let color = 'var(--verde)';
  if (porcentajeRestante <= 30) color = 'var(--rojo)';
  else if (porcentajeRestante <= 60) color = 'var(--amarillo)';

  container.innerHTML = `
    <div class="barra-container">
      <div class="barra-fill" style="width:${Math.min(porcentajeGastado, 100)}%;background:${color};"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;">
      <div style="text-align:left;">
        <p style="font-size:11px;color:var(--texto-suave);">Gastado</p>
        <p style="font-size:16px;font-weight:700;color:${color};">S/${presupuesto.gastado?.toFixed(2) || '0.00'}</p>
      </div>
      <div style="text-align:center;">
        <p style="font-size:11px;color:var(--texto-suave);">Restante</p>
        <p style="font-size:16px;font-weight:700;">S/${restante.toFixed(2)}</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:11px;color:var(--texto-suave);">Total</p>
        <p style="font-size:16px;font-weight:700;">S/${presupuesto.monto.toFixed(2)}</p>
      </div>
    </div>
  `;
}