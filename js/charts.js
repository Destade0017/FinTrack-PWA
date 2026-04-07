/**
 * Charts - Wrapper for Chart.js
 */
import { store } from './store.js';

Chart.defaults.color = '#9ca3af';
Chart.defaults.font.family = "'Inter', sans-serif";

let miniCategoryChartInstance = null;
let mainCategoryChartInstance = null;
let incomeExpenseChartInstance = null;

const chartColors = [
  '#3b82f6', // primary blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // warning orange
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
];

export function initCharts() {
  updateCharts();
}

export function updateCharts() {
  renderCategoryCharts();
  renderIncomeExpenseChart();
}

function renderCategoryCharts() {
  const expenseData = store.getTransactionsByCategory('expense');
  const labels = Object.keys(expenseData);
  const data = Object.values(expenseData);

  const emptyStateMini = document.getElementById('mini-chart-empty');
  const miniCanvas = document.getElementById('mini-category-chart');
  
  if (labels.length === 0) {
    emptyStateMini.classList.remove('hidden');
    miniCanvas.classList.add('hidden');
  } else {
    emptyStateMini.classList.add('hidden');
    miniCanvas.classList.remove('hidden');
  }

  const config = {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: chartColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12 }
        }
      },
      cutout: '70%'
    }
  };

  // Mini chart updates
  if (miniCategoryChartInstance) miniCategoryChartInstance.destroy();
  if (labels.length > 0) {
    miniCategoryChartInstance = new Chart(document.getElementById('mini-category-chart'), config);
  }

  // Main chart updates
  const mainCanvas = document.getElementById('main-category-chart');
  if (mainCanvas) {
    if (mainCategoryChartInstance) mainCategoryChartInstance.destroy();
    
    // Slight tweak for main chart layout
    const mainConfig = JSON.parse(JSON.stringify(config));
    mainConfig.options.plugins.legend.position = 'bottom';
    
    if (labels.length > 0) {
      mainCategoryChartInstance = new Chart(mainCanvas, mainConfig);
    }
  }
}

function renderIncomeExpenseChart() {
  const canvas = document.getElementById('income-expense-chart');
  if (!canvas) return;

  const monthlyData = store.getMonthlyData();
  
  // Format labels nicely
  const labelsFormated = monthlyData.labels.map(l => {
    const [yr, mo] = l.split('-');
    const date = new Date(yr, parseInt(mo)-1);
    return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  });

  if (incomeExpenseChartInstance) {
    incomeExpenseChartInstance.destroy();
  }

  incomeExpenseChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labelsFormated,
      datasets: [
        {
          label: 'Income',
          backgroundColor: '#10b981', // success
          data: monthlyData.income,
          borderRadius: 4
        },
        {
          label: 'Expenses',
          backgroundColor: '#ef4444', // danger
          data: monthlyData.expenses,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}
