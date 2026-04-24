/**
 * Charts - Wrapper for Chart.js
 */
import { store } from './store.js';

Chart.defaults.color = '#9ca3af';
Chart.defaults.font.family = "'Inter', sans-serif";

let categoryChartInstance = null;
let balanceTrendChartInstance = null;

const chartColors = [
  '#4f46e5', // primary indigo
  '#10b981', // green
  '#f59e0b', // warning
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export function initCharts() {
  updateCharts();
}

export function updateCharts() {
  renderCategoryChart();
  renderBalanceTrendChart();
}

function renderCategoryChart() {
  const expenseData = store.getTransactionsByCategory('expense');
  const labels = Object.keys(expenseData);
  const data = Object.values(expenseData);

  const emptyState = document.getElementById('mini-chart-empty');
  const canvas = document.getElementById('mini-category-chart');
  if (!canvas) return;
  
  if (labels.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    canvas.classList.add('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    canvas.classList.remove('hidden');
  }

  if (categoryChartInstance) categoryChartInstance.destroy();

  if (labels.length > 0) {
    categoryChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: chartColors,
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { 
              boxWidth: 8,
              padding: 20,
              font: { size: 11 }
            }
          }
        },
        cutout: '75%'
      }
    });
  }
}

function renderBalanceTrendChart() {
  const canvas = document.getElementById('income-expense-chart');
  if (!canvas) return;

  const monthlyData = store.getMonthlyData();
  
  // Calculate Balance Trend (Cumulative)
  let cumulative = 0;
  const balanceTrend = monthlyData.income.map((inc, i) => {
    cumulative += (inc - monthlyData.expenses[i]);
    return cumulative;
  });

  const labelsFormated = monthlyData.labels.map(l => {
    const [yr, mo] = l.split('-');
    const date = new Date(yr, parseInt(mo)-1);
    return date.toLocaleDateString('default', { month: 'short' });
  });

  if (balanceTrendChartInstance) {
    balanceTrendChartInstance.destroy();
  }

  balanceTrendChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labelsFormated,
      datasets: [{
        label: 'Balance Trend',
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        data: balanceTrend,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}
