/**
 * UI - Handles DOM manipulations
 */
import { store } from './store.js';

// Formatters
const currFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const ui = {
  
  updateDashboardSummary() {
    const balance = store.getBalance();
    const transactions = store.data.transactions;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter transactions for the current month
    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const budget = store.data.budgetLimit;

    // Update Hero Balance (Total)
    document.getElementById('sum-balance').textContent = currFormatter.format(balance);
    
    // Update Monthly Summaries
    document.getElementById('sum-income').textContent = currFormatter.format(monthlyIncome);
    document.getElementById('sum-expenses').textContent = currFormatter.format(monthlyExpenses);
    
    // Update Status Indicator
    this.updateStatusIndicator(monthlyExpenses, budget);
  },

  updateStatusIndicator(spent, budget) {
    const statusEl = document.getElementById('status-indicator');
    if (!statusEl) return;

    const ratio = spent / budget;
    let statusClass = 'on-track';
    let statusText = 'Financial Status: On Track';
    let icon = 'ph-check-circle';

    if (ratio >= 1.0) {
      statusClass = 'overspending';
      statusText = 'Financial Status: Overspending';
      icon = 'ph-warning';
    } else if (ratio >= 0.8) {
      statusClass = 'warning';
      statusText = 'Financial Status: Warning';
      icon = 'ph-warning-circle';
    }

    statusEl.className = `status-badge ${statusClass}`;
    statusEl.querySelector('span').textContent = statusText;
    statusEl.querySelector('i').className = `ph-fill ${icon}`;
    
    // Auto-show budget alert banner if overspending
    if (ratio >= 0.9) {
      this.showBudgetAlert((ratio * 100));
    } else {
      this.hideBudgetAlert();
    }
  },

  showBudgetAlert(percentage) {
    const alertEl = document.getElementById('budget-alert');
    if (alertEl && alertEl.classList.contains('hidden')) {
      alertEl.querySelector('.alert-text strong').nextSibling.textContent = ` You have spent ${percentage.toFixed(0)}% of your monthly budget!`;
      alertEl.classList.remove('hidden');
    }
  },

  hideBudgetAlert() {
    const alertEl = document.getElementById('budget-alert');
    if (alertEl) alertEl.classList.add('hidden');
  },

  renderInsights() {
    // Hidden as per simplification rules, but kept for logic if needed
    const container = document.getElementById('insights-container');
    if (container) container.innerHTML = '';
  },

  renderRecentTransactions() {
    const container = document.getElementById('recent-transactions-list');
    const recentTx = store.getRecentTransactions(5);
    
    if (recentTx.length === 0) {
      container.innerHTML = `<div class="empty-state text-center text-muted py-8">No transactions yet.</div>`;
      return;
    }

    container.innerHTML = recentTx.map(tx => this.createTransactionRow(tx)).join('');
  },

  renderFullTransactionsList() {
    const search = document.getElementById('filter-search').value;
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;

    const filtered = store.getFilteredTransactions(search, type, category);
    const container = document.getElementById('full-transactions-list');
    
    const countText = document.getElementById('transaction-count-text');
    if (countText) countText.textContent = `Showing ${filtered.length} transactions`;

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state text-center text-muted py-8">No matching transactions found.</div>`;
      return;
    }

    container.innerHTML = filtered.map(tx => this.createTransactionRow(tx)).join('');
  },

  createTransactionRow(tx) {
    const isIncome = tx.type === 'income';
    const sign = isIncome ? '+' : '';
    const typeClass = isIncome ? 'tx-income' : 'tx-expense';
    const amountClass = isIncome ? 'income' : 'expense';
    const iconClass = isIncome ? 'ph-trend-up' : 'ph-trend-down';
    
    return `
      <div class="tx-card ${typeClass}">
        <div class="tx-card-icon ${isIncome ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}">
          <i class="ph ${iconClass}"></i>
        </div>
        <div class="tx-card-details">
          <div class="tx-title">${tx.note || tx.category}</div>
          <div class="tx-meta">
            <span class="tx-category">${tx.category}</span>
            <span class="tx-dot mx-1">•</span>
            <span class="tx-date">${dateFormatter.format(new Date(tx.date))}</span>
          </div>
        </div>
        <div class="tx-card-amount">
          <div class="tx-amount ${amountClass}">${sign}${currFormatter.format(tx.amount)}</div>
          <button class="action-btn delete" data-id="${tx.id}" aria-label="Delete">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </div>
    `;
  },

  updateFilterCategories() {
    const typeSelect = document.getElementById('filter-type');
    const catSelect = document.getElementById('filter-category');
    const currentType = typeSelect.value;
    
    // Clear existing
    catSelect.innerHTML = '<option value="all">All Categories</option>';
    
    const expenseCategories = ["Food", "Transport", "Airtime/Data", "School Fees", "Entertainment", "Miscellaneous"];
    const incomeCategories = ["Allowance", "Salary", "Side Hustle", "Gift"];
    
    let toAdd = [];
    if (currentType === 'expense' || currentType === 'all') toAdd.push(...expenseCategories);
    if (currentType === 'income' || currentType === 'all') toAdd.push(...incomeCategories);

    toAdd.forEach(cat => {
      catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  },

  renderGoals() {
    const goalsList = document.getElementById('goals-list');
    const goals = store.data.savingsGoals;

    if (goals.length === 0) {
      goalsList.innerHTML = `<div class="empty-state text-center text-muted py-8 full-width col-span-2">No savings goals created yet. Start saving today!</div>`;
      return;
    }

    goalsList.innerHTML = goals.map(g => {
      const percentage = Math.min(100, (g.current / g.target) * 100);
      return `
        <div class="goal-card">
          <div class="goal-header">
            <span class="goal-title">${g.name}</span>
            <button class="btn btn-primary btn-icon btn-fund-goal" data-id="${g.id}" data-name="${g.name}" aria-label="Add Funds">
              <i class="ph ph-plus"></i>
            </button>
          </div>
          <div class="goal-amounts">
            <span class="text-muted"><strong class="text-primary">${currFormatter.format(g.current)}</strong> saved</span>
            <span class="text-muted">Target: ${currFormatter.format(g.target)}</span>
          </div>
          <div class="goal-progress-wrap">
            <div class="goal-progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="text-right text-xs text-muted">${percentage.toFixed(0)}% Completed</div>
        </div>
      `;
    }).join('');
  },

  // Modal Handlers
  openModal() {
    document.getElementById('transaction-modal').classList.remove('hidden');
    document.getElementById('form-date').valueAsDate = new Date(); // set default date to today
  },

  closeModal() {
    const modal = document.getElementById('transaction-modal');
    modal.classList.add('hidden');
    document.getElementById('form-transaction').reset();
  },

  openGoalModal() {
    document.getElementById('goal-modal').classList.remove('hidden');
  },

  closeGoalModal() {
    document.getElementById('goal-modal').classList.add('hidden');
    document.getElementById('form-goal').reset();
  },

  openFundModal(id, name) {
    document.getElementById('fund-goal-id').value = id;
    document.getElementById('fund-goal-name').textContent = name;
    document.getElementById('fund-modal').classList.remove('hidden');
  },

  closeFundModal() {
    document.getElementById('fund-modal').classList.add('hidden');
    document.getElementById('form-fund').reset();
  },

  toggleCategoryOptgroups() {
    const isExpense = document.getElementById('type-expense').checked;
    document.getElementById('optgroup-expense').style.display = isExpense ? 'block' : 'none';
    document.getElementById('optgroup-income').style.display = isExpense ? 'none' : 'block';
    
    // Reset selection
    document.getElementById('form-category').value = '';
  },

  // View Navigation
  switchView(viewId) {
    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.view === viewId) item.classList.add('active');
    });

    // Views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active-view');
      if (view.id === `view-${viewId}`) view.classList.add('active-view');
    });
  }

};
