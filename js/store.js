/**
 * Store - Manages application state and localStorage
 */

const STORAGE_KEY = 'fintrack_data';

export const store = {
  data: {
    transactions: [],
    savingsGoals: [], // {id, name, target, current}
    budgetLimit: 1000
  },

  init() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        this.data = { ...this.data, ...JSON.parse(savedData) };
      } catch (e) {
        console.error("Failed to parse local storage data:", e);
      }
    } else {
      this.save(); // save defaults
    }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  addTransaction(transaction) {
    const newTx = {
      id: crypto.randomUUID(),
      dateCreated: new Date().toISOString(),
      ...transaction
    };
    // Add to beginning of array
    this.data.transactions.unshift(newTx);
    this.save();
    return newTx;
  },

  deleteTransaction(id) {
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.save();
  },

  updateBudget(amount) {
    this.data.budgetLimit = amount;
    this.save();
  },

  // Goals
  addGoal(goal) {
    const newGoal = {
      id: crypto.randomUUID(),
      current: 0,
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
      // Adding funds to a goal acts as an expense to reduce main balance.
      this.addTransaction({
        type: 'expense',
        amount: amount,
        category: 'Savings',
        date: new Date().toISOString().split('T')[0],
        note: `Funded goal: ${goal.name}`,
        isRecurring: false
      });
      this.save();
    }
  },

  // Smart Insights Generation
  generateInsights() {
    const insights = [];
    const expenses = this.data.transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
      insights.push({ icon: 'ph-info', text: "Start adding expenses to see smart insights." });
      return insights;
    }

    // 1. Check budget pacing
    const totalExp = this.getExpenses();
    const budget = this.data.budgetLimit;
    const ratio = totalExp / budget;
    
    if (ratio >= 0.9) {
      insights.push({ icon: 'ph-warning', style: 'danger', text: "You are critically close to exceeding your monthly budget." });
    } else if (ratio >= 0.75) {
      insights.push({ icon: 'ph-warning-circle', style: 'warning', text: "You have used over 75% of your budget." });
    }

    // 2. Highest category
    const catData = this.getTransactionsByCategory('expense');
    let highestCat = '';
    let highestAmt = 0;
    for (const [cat, amt] of Object.entries(catData)) {
      if (amt > highestAmt) {
        highestAmt = amt;
        highestCat = cat;
      }
    }
    
    if (highestCat && highestAmt > 0) {
      insights.push({ icon: 'ph-trend-up', style: 'primary', text: `${highestCat} is currently your highest spending category this month.` });
    }

    // 3. Fallback insight
    if (insights.length === 0) {
      insights.push({ icon: 'ph-check-circle', style: 'success', text: "Your spending is perfectly on track. Keep it up!" });
    }

    return insights;
  },

  // Calculated Getters
  
  getBalance() {
    return this.getIncome() - this.getExpenses();
  },

  getIncome() {
    return this.data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getExpenses() {
    return this.data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getRecentTransactions(limit = 5) {
    // Already sorted descending if unshifted, but let's be safe
    return [...this.data.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },
  
  getFilteredTransactions(search = '', type = 'all', category = 'all') {
    return this.data.transactions.filter(t => {
      const matchSearch = search === '' || (t.note && t.note.toLowerCase().includes(search.toLowerCase()));
      const matchType = type === 'all' || t.type === type;
      const matchCategory = category === 'all' || t.category === category;
      return matchSearch && matchType && matchCategory;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getTransactionsByCategory(type = 'expense') {
    const categories = {};
    this.data.transactions
      .filter(t => t.type === type)
      .forEach(t => {
        if (!categories[t.category]) categories[t.category] = 0;
        categories[t.category] += t.amount;
      });
    return categories;
  },

  getMonthlyData() {
    // Simplified: aggregate by month string "YYYY-MM"
    const monthlyInc = {};
    const monthlyExp = {};

    this.data.transactions.forEach(t => {
      const dateObj = new Date(t.date);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (t.type === 'income') {
        monthlyInc[key] = (monthlyInc[key] || 0) + t.amount;
      } else {
        monthlyExp[key] = (monthlyExp[key] || 0) + t.amount;
      }
    });
    
    // Sort keys and get last 6 months
    const allKeys = Array.from(new Set([...Object.keys(monthlyInc), ...Object.keys(monthlyExp)])).sort();
    
    return {
      labels: allKeys,
      income: allKeys.map(k => monthlyInc[k] || 0),
      expenses: allKeys.map(k => monthlyExp[k] || 0)
    };
  }
};
