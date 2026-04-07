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
    const income = store.getIncome();
    const expenses = store.getExpenses();
    const budget = store.data.budgetLimit;

    document.getElementById('sum-balance').textContent = currFormatter.format(balance);
    document.getElementById('sum-income').textContent = currFormatter.format(income);
    document.getElementById('sum-expenses').textContent = currFormatter.format(expenses);
    
    // Budget Progress
    const remaining = budget - expenses;
    document.getElementById('sum-budget-remaining').textContent = currFormatter.format(Math.max(0, remaining));
    document.getElementById('budget-spent-text').textContent = currFormatter.format(expenses);
    document.getElementById('budget-limit-text').textContent = currFormatter.format(budget);

    const progressPercentage = Math.min(100, (expenses / budget) * 100);
    const progressBar = document.getElementById('budget-progress');
    progressBar.style.width = `${progressPercentage}%`;
    
    if (progressPercentage >= 90) {
      progressBar.classList.add('warning');
      this.showBudgetAlert(progressPercentage);
    } else {
      progressBar.classList.remove('warning');
      this.hideBudgetAlert();
    }
  },

  showBudgetAlert(percentage) {
    const alertEl = document.getElementById('budget-alert');
    if (alertEl.classList.contains('hidden')) {
      alertEl.querySelector('.alert-text strong').nextSibling.textContent = ` You have spent ${percentage.toFixed(0)}% of your monthly budget!`;
      alertEl.classList.remove('hidden');
    }
  },

  hideBudgetAlert() {
    document.getElementById('budget-alert').classList.add('hidden');
  },

  renderInsights() {
    const insights = store.generateInsights();
    const container = document.getElementById('insights-container');
    
    container.innerHTML = insights.map(ins => `
      <div class="insight-item">
        <i class="ph ${ins.icon} insight-icon ${ins.style}"></i>
        <div class="insight-text">${ins.text}</div>
      </div>
    `).join('');
  },

  renderRecentTransactions() {
    const tbody = document.getElementById('recent-transactions-list');
    const recentTx = store.getRecentTransactions(5);
    
    if (recentTx.length === 0) {
      tbody.innerHTML = `<div class="empty-state text-center text-muted py-8">No transactions yet.</div>`;
      return;
    }

    tbody.innerHTML = recentTx.map(tx => this.createTransactionRow(tx)).join('');
  },

  renderFullTransactionsList() {
    const search = document.getElementById('filter-search').value;
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;

    const filtered = store.getFilteredTransactions(search, type, category);
    const tbody = document.getElementById('full-transactions-list');
    
    document.getElementById('transaction-count-text').textContent = `Showing ${filtered.length} transactions`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<div class="empty-state text-center text-muted py-8">No matching transactions found.</div>`;
      return;
    }

    tbody.innerHTML = filtered.map(tx => this.createTransactionRow(tx)).join('');
  },

  createTransactionRow(tx) {
    const isIncome = tx.type === 'income';
    const amountClass = isIncome ? 'text-success' : 'text-danger';
    const sign = isIncome ? '+' : '-';
    const iconClass = isIncome ? 'ph-arrow-up' : 'ph-arrow-down';
    
    return `
      <div class="tx-card blend pointer">
        <div class="tx-card-icon ${isIncome ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}">
          <i class="ph ${iconClass}"></i>
        </div>
        <div class="tx-card-details flex-1">
          <div class="tx-title font-medium">${tx.note || tx.category}</div>
          <div class="tx-meta text-muted text-xs">
            <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">${tx.category}</span>
            <span class="tx-date ml-2">${dateFormatter.format(new Date(tx.date))}</span>
          </div>
        </div>
        <div class="tx-card-amount text-right">
          <div class="font-semibold ${amountClass}">${sign}${currFormatter.format(tx.amount)}</div>
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
