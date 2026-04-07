/**
 * App - Main controller and event listener setup
 */
import { store } from './store.js';
import { ui } from './ui.js';
import { initCharts, updateCharts } from './charts.js';

class App {
  static init() {
    store.init();
    
    // Initial renders
    ui.updateFilterCategories();
    this.refreshAllDashboards();
    initCharts();

    this.setupEventListeners();
    this.registerServiceWorker();
  }

  static registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }

  static refreshAllDashboards() {
    ui.updateDashboardSummary();
    ui.renderInsights();
    ui.renderRecentTransactions();
    ui.renderFullTransactionsList();
    ui.renderGoals();
  }

  static setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        ui.switchView(item.dataset.view);
        // If analytics, we might need to chart.update() to fix sizes
        if (item.dataset.view === 'analytics') {
          setTimeout(updateCharts, 50);
        }
      });
    });

    // Dashboard View All link
    document.getElementById('link-view-all').addEventListener('click', (e) => {
      e.preventDefault();
      ui.switchView('transactions');
    });

    // Modal Triggers
    document.getElementById('btn-open-modal').addEventListener('click', () => ui.openModal());
    
    // FAB Trigger
    const fabBtn = document.getElementById('btn-fab-open-modal');
    if (fabBtn) fabBtn.addEventListener('click', () => ui.openModal());

    document.getElementById('btn-close-modal').addEventListener('click', () => ui.closeModal());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => ui.closeModal());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.getElementById('transaction-modal').classList.contains('hidden')) {
        ui.closeModal();
      }
    });

    // Budget Alert Close
    document.getElementById('btn-close-alert').addEventListener('click', () => ui.hideBudgetAlert());

    // Edit Budget feature
    document.getElementById('btn-edit-budget').addEventListener('click', () => {
      const newBudgetStr = prompt("Set new monthly budget ($):", store.data.budgetLimit);
      if (newBudgetStr !== null) {
        const amt = parseFloat(newBudgetStr);
        if (!isNaN(amt) && amt > 0) {
          store.updateBudget(amt);
          ui.updateDashboardSummary();
        }
      }
    });

    // Form Event
    document.querySelectorAll('input[name="type"]').forEach(radio => {
      radio.addEventListener('change', () => ui.toggleCategoryOptgroups());
    });

    document.getElementById('form-transaction').addEventListener('submit', (e) => {
      e.preventDefault();

      const type = document.querySelector('input[name="type"]:checked').value;
      const amount = parseFloat(document.getElementById('form-amount').value);
      const category = document.getElementById('form-category').value;
      const date = document.getElementById('form-date').value;
      const note = document.getElementById('form-note').value;
      const recurringFrequency = document.getElementById('form-recurring').value;

      store.addTransaction({
        type, amount, category, date, note, recurringFrequency
      });

      ui.closeModal();
      this.refreshAllDashboards();
      updateCharts();
    });

    // Filters
    document.getElementById('filter-search').addEventListener('input', () => ui.renderFullTransactionsList());
    document.getElementById('filter-type').addEventListener('change', () => {
      ui.updateFilterCategories();
      ui.renderFullTransactionsList();
    });
    document.getElementById('filter-category').addEventListener('change', () => ui.renderFullTransactionsList());

    // Delegate Delete Action
    document.getElementById('full-transactions-list').addEventListener('click', (e) => {
      const btn = e.target.closest('.delete');
      if (btn) {
        if (confirm('Are you sure you want to delete this transaction?')) {
          store.deleteTransaction(btn.dataset.id);
          this.refreshAllDashboards();
          updateCharts();
        }
      }
    });

    ui.toggleCategoryOptgroups(); // Set initial state
    
    // --- GOALS EVENT LISTENERS ---
    document.getElementById('btn-open-goal-modal').addEventListener('click', () => ui.openGoalModal());
    document.getElementById('btn-close-goal-modal').addEventListener('click', () => ui.closeGoalModal());
    document.getElementById('btn-cancel-goal-modal').addEventListener('click', () => ui.closeGoalModal());

    document.getElementById('form-goal').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('goal-name').value;
      const target = parseFloat(document.getElementById('goal-target').value);
      store.addGoal({ name, target });
      ui.closeGoalModal();
      this.refreshAllDashboards();
    });

    document.getElementById('btn-close-fund-modal').addEventListener('click', () => ui.closeFundModal());
    document.getElementById('btn-cancel-fund-modal').addEventListener('click', () => ui.closeFundModal());

    document.getElementById('form-fund').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('fund-goal-id').value;
      const amount = parseFloat(document.getElementById('fund-amount').value);
      store.fundGoal(id, amount);
      ui.closeFundModal();
      this.refreshAllDashboards();
      updateCharts();
    });

    // Delegate Goal Fund Action
    document.getElementById('goals-list').addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-fund-goal');
      if (btn) {
        ui.openFundModal(btn.dataset.id, btn.dataset.name);
      }
    });

  }
}

// Start App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
