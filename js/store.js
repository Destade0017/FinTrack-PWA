/**
 * Storage Layer - Abstraction for Backend Readiness
 */
class LocalStorageProvider {
  constructor(key) {
    this.key = key;
  }
  load() {
    const data = localStorage.getItem(this.key);
    return data ? JSON.parse(data) : null;
  }
  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }
}

/**
 * Financial Engine - Intelligent Data Processing & Reasoning
 */
export const FinEngine = {
  getMonthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  getCurrentMonthKey() {
    return this.getMonthKey(new Date());
  },

  getPreviousMonthKey() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return this.getMonthKey(d);
  },

  calculateTotal(transactions, type, monthKey = null) {
    return transactions
      .filter(t => (type === 'all' || t.type === type) && (!monthKey || t.monthKey === monthKey))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getMonthlySummary(transactions, monthKey) {
    const income = this.calculateTotal(transactions, 'income', monthKey);
    const expenses = this.calculateTotal(transactions, 'expense', monthKey);
    const savings = income - expenses;
    
    // Category Dominance
    const catTotals = {};
    transactions
      .filter(t => t.type === 'expense' && t.monthKey === monthKey)
      .forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      });
    
    let topCategory = 'None';
    let topAmount = 0;
    for (const [cat, amt] of Object.entries(catTotals)) {
      if (amt > topAmount) {
        topAmount = amt;
        topCategory = cat;
      }
    }

    return { income, expenses, savings, topCategory, topAmount };
  },

  generateSmartInsights(transactions, budgetLimit) {
    const currentKey = this.getCurrentMonthKey();
    const prevKey = this.getPreviousMonthKey();
    
    const current = this.getMonthlySummary(transactions, currentKey);
    const previous = this.getMonthlySummary(transactions, prevKey);
    
    const insights = [];

    // 1. Budget Health & Thresholds
    const budgetUsage = (current.expenses / budgetLimit) * 100;
    if (budgetUsage >= 90) {
      insights.push({ icon: 'ph-warning', style: 'danger', text: `Critical: You've used ${budgetUsage.toFixed(1)}% of your budget.` });
    } else if (budgetUsage >= 75) {
      insights.push({ icon: 'ph-warning-circle', style: 'warning', text: `Warning: ${budgetUsage.toFixed(1)}% budget used.` });
    }

    // 2. Month-over-Month Comparisons
    if (previous.expenses > 0) {
      const expChange = ((current.expenses - previous.expenses) / previous.expenses) * 100;
      const direction = expChange > 0 ? 'increased' : 'decreased';
      const absChange = Math.abs(expChange).toFixed(1);
      
      if (Math.abs(expChange) > 5) {
        insights.push({ 
          icon: direction === 'increased' ? 'ph-trend-up' : 'ph-trend-down',
          style: direction === 'increased' ? 'danger' : 'success',
          text: `Spending has ${direction} by ${absChange}% compared to last month.` 
        });
      }
    }

    // 3. Category Dominance
    if (current.topCategory !== 'None') {
      insights.push({ 
        icon: 'ph-chart-pie-slice', 
        style: 'primary', 
        text: `${current.topCategory} is your primary expense this month (${((current.topAmount / current.expenses) * 100).toFixed(0)}% of spend).` 
      });
    }

    // 4. Savings Logic
    if (current.savings > 0) {
      insights.push({ icon: 'ph-piggy-bank', style: 'success', text: `Great job! You've saved ${((current.savings / current.income) * 100).toFixed(1)}% of your income so far.` });
    }

    return insights;
  }
};

/**
 * Central Store - State Management
 */
const STORAGE_KEY = 'fintrack_data_v2'; // Version bump for data migration
const storage = new LocalStorageProvider(STORAGE_KEY);

export const store = {
  data: {
    transactions: [],
    savingsGoals: [],
    budgetLimit: 1000
  },

  init() {
    const saved = storage.load();
    if (saved) {
      this.data = { ...this.data, ...saved };
      // Migration check: ensure all transactions have monthKey
      let migrated = false;
      this.data.transactions.forEach(t => {
        if (!t.monthKey) {
          t.monthKey = FinEngine.getMonthKey(t.date);
          migrated = true;
        }
      });
      if (migrated) this.save();
    } else {
      this.save();
    }
  },

  save() {
    storage.save(this.data);
  },

  // Transactions
  addTransaction(tx) {
    const newTx = {
      id: crypto.randomUUID(),
      dateCreated: new Date().toISOString(),
      monthKey: FinEngine.getMonthKey(tx.date),
      ...tx
    };
    this.data.transactions.unshift(newTx);
    this.save();
    return newTx;
  },

  deleteTransaction(id) {
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.save();
  },

  updateBudget(limit) {
    this.data.budgetLimit = limit;
    this.save();
  },

  // Savings Goals
  addGoal(goal) {
    const newGoal = {
      id: crypto.randomUUID(),
      current: 0,
      status: 'Not started',
      ...goal
    };
    this.data.savingsGoals.push(newGoal);
    this.save();
    return newGoal;
  },

  fundGoal(id, amount) {
    const goal = this.data.savingsGoals.find(g => g.id === id);
    if (goal) {
      goal.current += amount;
      
      // Update Status
      const pct = (goal.current / goal.target) * 100;
      if (pct >= 100) goal.status = 'Completed';
      else if (pct >= 80) goal.status = 'Near completion';
      else if (pct > 0) goal.status = 'In progress';

      // Create transaction for funding
      this.addTransaction({
        type: 'expense',
        amount: amount,
        category: 'Savings',
        date: new Date().toISOString().split('T')[0],
        note: `Funded Goal: ${goal.name}`
      });
      
      this.save();
    }
  },

  // High-Level Data Getters
  getBalance() {
    return FinEngine.calculateTotal(this.data.transactions, 'income') - 
           FinEngine.calculateTotal(this.data.transactions, 'expense');
  },

  getMonthlyData() {
    // Group all months for trend charts
    const monthlyInc = {};
    const monthlyExp = {};
    
    this.data.transactions.forEach(t => {
      const key = t.monthKey;
      if (t.type === 'income') monthlyInc[key] = (monthlyInc[key] || 0) + t.amount;
      else monthlyExp[key] = (monthlyExp[key] || 0) + t.amount;
    });

    const allKeys = Array.from(new Set([...Object.keys(monthlyInc), ...Object.keys(monthlyExp)])).sort();
    
    return {
      labels: allKeys,
      income: allKeys.map(k => monthlyInc[k] || 0),
      expenses: allKeys.map(k => monthlyExp[k] || 0)
    };
  },

  getRecentTransactions(limit = 5) {
    return this.data.transactions.slice(0, limit);
  },

  getFilteredTransactions(search = '', type = 'all', category = 'all') {
    return this.data.transactions.filter(t => {
      const matchSearch = !search || t.note?.toLowerCase().includes(search.toLowerCase());
      const matchType = type === 'all' || t.type === type;
      const matchCategory = category === 'all' || t.category === category;
      return matchSearch && matchType && matchCategory;
    });
  },

  getTransactionsByCategory(type = 'expense') {
    const totals = {};
    const currentKey = FinEngine.getCurrentMonthKey();
    this.data.transactions
      .filter(t => t.type === type && t.monthKey === currentKey)
      .forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      });
    return totals;
  }
};
