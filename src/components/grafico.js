import Chart from 'chart.js/auto';

let chartInstance = null;

const coloresCategorias = {
  Comida: '#F97316',
  Transporte: '#3B82F6',
  Entretenimiento: '#A855F7',
  Bebidas: '#06B6D4',
  Compras: '#EC4899',
  Otros: '#6B7280'
};

export function renderGrafico(container, gastos, filtro) {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const categorias = {};
  gastos.forEach(g => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.monto;
  });

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);
  const colores = labels.map(l => coloresCategorias[l] || '#6B7280');

  if (labels.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:var(--texto-suave);font-size:14px;padding:24px 0;">Sin gastos en este período</p>`;
    return;
  }

  container.innerHTML = '<canvas id="chart-categorias" style="max-height:220px;"></canvas>';
  const ctx = document.getElementById('chart-categorias').getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colores,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 }, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` S/${ctx.raw.toFixed(2)} (${((ctx.raw / data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`
          }
        }
      }
    }
  });
}