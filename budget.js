// ============ DOM Elements ============
let totalBudget = document.getElementById('budget-amount');
let totalExpenseAmount = 0;
const remainBudget = document.getElementById('remaining-balance');
const setBudgetBtn = document.getElementById('setBudget');
const addExpenseBtn = document.getElementById('addExpense');
const monthSelect = document.getElementById('month-select');
const expenseDateInput = document.getElementById('expense-date');
const expenseNameInput = document.getElementById('expense-name');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseAmountInput = document.getElementById('expense-budget');
const budgetInput = document.getElementById('budget');
const warningBanner = document.getElementById('warning-message');
const monthSummary = document.getElementById('summary-month');
const emptyState = document.getElementById('empty-state');
const expenseTableBody = document.getElementById('expense-table-body');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortBtn = document.getElementById('sort-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const budgetProgressSection = document.getElementById('budget-progress-section');
const progressBar = document.getElementById('progress-bar');
const budgetPercentage = document.getElementById('budget-percentage');
const filterSection = document.getElementById('filter-section');
const categoryBreakdown = document.getElementById('category-breakdown');
const categoryList = document.getElementById('category-list');
const expenseCountDisplay = document.getElementById('expense-count');
const tipsSection = document.getElementById('tips-section');
const tipsContainer = document.getElementById('tips-container');

// ============ State Variables ============
let currentFilter = 'All';
let sortOrder = 'date-asc';
let currentBudgetMonth = null;
const STORAGE_KEY = 'budgetTrackerData';

// ============ Storage Functions ============
function loadBudgetData(month) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  return data[month] || { budget: 0, expenses: [] };
}

function saveBudgetData(month, budget, expenses) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  data[month] = { budget, expenses };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getExpensesForMonth(month) {
  const data = loadBudgetData(month);
  return data.expenses || [];
}

function addExpenseToStorage(month, expense) {
  const data = loadBudgetData(month);
  data.expenses = data.expenses || [];
  data.expenses.push(expense);
  saveBudgetData(month, data.budget, data.expenses);
}

function removeExpenseFromStorage(month, index) {
  const data = loadBudgetData(month);
  data.expenses.splice(index, 1);
  saveBudgetData(month, data.budget, data.expenses);
}

// ============ Utility Functions ============
function showWarning(message) {
  warningBanner.textContent = message;
  warningBanner.classList.add('show');
  setTimeout(() => {
    warningBanner.classList.remove('show');
  }, 5000);
}

function clearExpenseForm() {
  expenseDateInput.value = '';
  expenseNameInput.value = '';
  expenseAmountInput.value = '';
  expenseCategoryInput.value = 'Food';
}

function clearExpenseTable() {
  expenseTableBody.innerHTML = '';
  totalExpenseAmount = 0;
  updateRemainingBalance();
  updateEmptyState();
}

function updateRemainingBalance() {
  const estimatedBudget = parseFloat(totalBudget.textContent) || 0;
  const remaining = Math.max(0, estimatedBudget - totalExpenseAmount);
  remainBudget.textContent = remaining.toFixed(2);
  updateBudgetProgress();
}

function updateBudgetProgress() {
  const budget = parseFloat(totalBudget.textContent) || 0;
  if (budget === 0) return;
  
  const remaining = Math.max(0, budget - totalExpenseAmount);
  const percentage = (totalExpenseAmount / budget) * 100;
  const clampedPercentage = Math.min(percentage, 100);
  
  progressBar.style.width = clampedPercentage + '%';
  budgetPercentage.textContent = Math.round(clampedPercentage) + '%';
  
  // Update spent and remaining labels dynamically
  document.getElementById('spent-label').textContent = `Spent: Rs. ${totalExpenseAmount.toFixed(2)}`;
  document.getElementById('remaining-label').textContent = `Remaining: Rs. ${remaining.toFixed(2)}`;
  
  if (clampedPercentage >= 90) {
    progressBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
  } else if (clampedPercentage >= 75) {
    progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
  } else {
    progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)';
  }
}

function updateEmptyState() {
  if (expenseTableBody.children.length === 0) {
    emptyState.classList.add('show');
  } else {
    emptyState.classList.remove('show');
  }
}

function updateExpenseCount() {
  const allExpenses = getExpensesForMonth(currentBudgetMonth);
  expenseCountDisplay.textContent = allExpenses.length;
}

function updateDateRange(month) {
  const monthRanges = {
    January: { start: "01-01", end: "01-31" },
    February: { start: "02-01", end: "02-28" },
    March: { start: "03-01", end: "03-31" },
    April: { start: "04-01", end: "04-30" },
    May: { start: "05-01", end: "05-31" },
    June: { start: "06-01", end: "06-30" },
    July: { start: "07-01", end: "07-31" },
    August: { start: "08-01", end: "08-31" },
    September: { start: "09-01", end: "09-30" },
    October: { start: "10-01", end: "10-31" },
    November: { start: "11-01", end: "11-30" },
    December: { start: "12-01", end: "12-31" }
  };
  
  const range = monthRanges[month];
  if (range) {
    const currentYear = new Date().getFullYear();
    const [startMonth, startDay] = range.start.split("-");
    const [endMonth, endDay] = range.end.split("-");
    expenseDateInput.min = `${currentYear}-${startMonth}-${startDay}`;
    expenseDateInput.max = `${currentYear}-${endMonth}-${endDay}`;
  }
}

function getCategoryStats(expenses) {
  const stats = {};
  expenses.forEach(expense => {
    if (!stats[expense.category]) {
      stats[expense.category] = { amount: 0, count: 0 };
    }
    stats[expense.category].amount += expense.amount;
    stats[expense.category].count += 1;
  });
  return stats;
}

function sortExpenses(expenses) {
  const sorted = [...expenses];
  
  if (sortOrder === 'date-asc') {
    sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortOrder === 'date-desc') {
    sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortOrder === 'amount-asc') {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (sortOrder === 'amount-desc') {
    sorted.sort((a, b) => b.amount - a.amount);
  }
  
  return sorted;
}

function getFilteredExpenses(expenses) {
  if (currentFilter === 'All') return expenses;
  return expenses.filter(exp => exp.category === currentFilter);
}

function updateCategoryBreakdown(expenses) {
  const stats = getCategoryStats(expenses);
  categoryList.innerHTML = '';
  
  if (Object.keys(stats).length === 0) {
    categoryBreakdown.style.display = 'none';
    return;
  }
  
  categoryBreakdown.style.display = 'block';
  
  Object.entries(stats).forEach(([category, data]) => {
    const percentage = (data.amount / totalExpenseAmount * 100).toFixed(1);
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.innerHTML = `
      <div class="category-item-header">
        <span class="category-name">${category}</span>
        <span class="category-count">${data.count}</span>
      </div>
      <div class="category-amount">Rs. ${data.amount.toFixed(2)}</div>
      <div class="category-percentage">${percentage}% of total</div>
    `;
    categoryList.appendChild(categoryItem);
  });
}

function generateSmartTips(expenses) {
  const tips = [];
  
  if (totalExpenseAmount === 0) {
    tips.push({
      icon: '💰',
      title: 'Start Tracking',
      description: 'Add your first expense to see insights and tips.'
    });
  } else {
    const budget = parseFloat(totalBudget.textContent) || 0;
    const percentage = (totalExpenseAmount / budget) * 100;
    
    if (percentage > 90) {
      tips.push({
        icon: '⚠️',
        title: 'Budget Alert',
        description: 'You\'ve spent over 90% of your budget. Be careful with remaining funds.'
      });
    } else if (percentage > 75) {
      tips.push({
        icon: '📊',
        title: 'Approaching Limit',
        description: 'You\'ve used 75% of your budget. Monitor your spending closely.'
      });
    }
    
    const categoryStats = getCategoryStats(expenses);
    const topCategory = Object.entries(categoryStats).sort((a, b) => b[1].amount - a[1].amount)[0];
    
    if (topCategory) {
      tips.push({
        icon: '🎯',
        title: `Top Category: ${topCategory[0]}`,
        description: `You spent Rs. ${topCategory[1].amount.toFixed(2)} on ${topCategory[0]}.`
      });
    }
    
    const avgSpending = totalExpenseAmount / expenses.length;
    tips.push({
      icon: '📈',
      title: 'Average Expense',
      description: `Your average expense is Rs. ${avgSpending.toFixed(2)}.`
    });
  }
  
  displayTips(tips);
}

function displayTips(tips) {
  tipsContainer.innerHTML = '';
  
  if (tips.length === 0) {
    tipsSection.style.display = 'none';
    return;
  }
  
  tipsSection.style.display = 'block';
  
  tips.forEach(tip => {
    const tipCard = document.createElement('div');
    tipCard.className = 'tip-card';
    tipCard.innerHTML = `
      <div class="tip-icon">${tip.icon}</div>
      <div class="tip-title">${tip.title}</div>
      <div class="tip-description">${tip.description}</div>
    `;
    tipsContainer.appendChild(tipCard);
  });
}

function sortExpensesDisplay() {
  const options = ['date-asc', 'date-desc', 'amount-asc', 'amount-desc'];
  const currentIndex = options.indexOf(sortOrder);
  sortOrder = options[(currentIndex + 1) % options.length];
  
  const labels = {
    'date-asc': 'Sort: Date ↑',
    'date-desc': 'Sort: Date ↓',
    'amount-asc': 'Sort: Amount ↑',
    'amount-desc': 'Sort: Amount ↓'
  };
  
  sortBtn.innerHTML = `<i class="fas fa-sort"></i> ${labels[sortOrder]}`;
  renderAllExpenses();
}

function renderAllExpenses() {
  const allExpenses = getExpensesForMonth(currentBudgetMonth);
  const filteredExpenses = getFilteredExpenses(allExpenses);
  const sortedExpenses = sortExpenses(filteredExpenses);
  
  expenseTableBody.innerHTML = '';
  
  sortedExpenses.forEach((expense, index) => {
    const allExpenseIndex = allExpenses.findIndex(e => 
      e.date === expense.date && e.name === expense.name && e.amount === expense.amount
    );
    renderExpenseRow(expense, allExpenseIndex, currentBudgetMonth);
  });
  
  updateEmptyState();
  updateExpenseCount();
  updateCategoryBreakdown(allExpenses);
  generateSmartTips(allExpenses);
}

function renderExpenseRow(expense, index, month) {
  const newRow = document.createElement('tr');
  const dateCell = document.createElement('td');
  const nameCell = document.createElement('td');
  const categoryCell = document.createElement('td');
  const amountCell = document.createElement('td');
  const actionCell = document.createElement('td');

  dateCell.textContent = expense.date;
  nameCell.textContent = expense.name;
  categoryCell.textContent = expense.category || 'Other';
  amountCell.textContent = expense.amount.toFixed(2);

  const editBtn = document.createElement('button');
  const deleteBtn = document.createElement('button');
  
  editBtn.className = 'btn-edit';
  editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
  deleteBtn.className = 'btn-delete';
  deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';

  deleteBtn.addEventListener('click', () => {
    totalExpenseAmount -= expense.amount;
    document.getElementById('total-expenses').textContent = totalExpenseAmount.toFixed(2);
    updateRemainingBalance();
    expenseTableBody.removeChild(newRow);
    removeExpenseFromStorage(month, index);
    renderAllExpenses();
  });

  editBtn.addEventListener('click', () => {
    totalExpenseAmount -= expense.amount;
    document.getElementById('total-expenses').textContent = totalExpenseAmount.toFixed(2);
    updateRemainingBalance();
    expenseDateInput.value = dateCell.textContent;
    expenseNameInput.value = nameCell.textContent;
    expenseCategoryInput.value = categoryCell.textContent;
    expenseAmountInput.value = amountCell.textContent;
    expenseTableBody.removeChild(newRow);
    removeExpenseFromStorage(month, index);
    renderAllExpenses();
  });

  actionCell.className = 'table-actions';
  actionCell.appendChild(editBtn);
  actionCell.appendChild(deleteBtn);

  newRow.appendChild(dateCell);
  newRow.appendChild(nameCell);
  newRow.appendChild(categoryCell);
  newRow.appendChild(amountCell);
  newRow.appendChild(actionCell);

  expenseTableBody.appendChild(newRow);
}

// ============ Event Listeners ============
setBudgetBtn.addEventListener('click', () => {
  const selectedMonth = monthSelect.value;
  const estimatedBudget = parseFloat(budgetInput.value);
  currentBudgetMonth = selectedMonth;

  if (isNaN(estimatedBudget) || estimatedBudget <= 0) {
    showWarning('⚠️ Please enter a valid budget amount!');
    return;
  }

  monthSummary.textContent = `📅 Budget Summary of ${selectedMonth}`;
  monthSummary.classList.add('show');
  totalBudget.textContent = estimatedBudget.toFixed(2);
  totalExpenseAmount = 0;
  
  saveBudgetData(selectedMonth, estimatedBudget, []);
  updateRemainingBalance();
  clearExpenseForm();
  clearExpenseTable();
  warningBanner.classList.remove('show');
  
  budgetProgressSection.style.display = 'block';
  filterSection.style.display = 'block';
  clearAllBtn.style.display = 'inline-flex';
  
  document.getElementById('total-expenses').textContent = '0';
  updateExpenseCount();
  
  localStorage.setItem('selectedMonth', selectedMonth);
  updateDateRange(selectedMonth);
  
  tipsSection.style.display = 'none';
  categoryBreakdown.style.display = 'none';
});

monthSelect.addEventListener('change', () => {
  const selectedMonth = monthSelect.value;
  currentBudgetMonth = selectedMonth;
  updateDateRange(selectedMonth);
  
  const monthData = loadBudgetData(selectedMonth);
  if (monthData.budget > 0) {
    totalBudget.textContent = monthData.budget.toFixed(2);
    budgetInput.value = monthData.budget;
    monthSummary.textContent = `📅 Budget Summary of ${selectedMonth}`;
    monthSummary.classList.add('show');
    
    totalExpenseAmount = 0;
    expenseTableBody.innerHTML = '';
    
    monthData.expenses.forEach((expense, index) => {
      totalExpenseAmount += expense.amount;
      renderExpenseRow(expense, index, selectedMonth);
    });
    
    document.getElementById('total-expenses').textContent = totalExpenseAmount.toFixed(2);
    updateRemainingBalance();
    
    budgetProgressSection.style.display = 'block';
    filterSection.style.display = 'block';
    clearAllBtn.style.display = 'inline-flex';
    
    renderAllExpenses();
  } else {
    clearExpenseForm();
    clearExpenseTable();
    monthSummary.classList.remove('show');
    totalBudget.textContent = '0';
    budgetProgressSection.style.display = 'none';
    filterSection.style.display = 'none';
    clearAllBtn.style.display = 'none';
    categoryBreakdown.style.display = 'none';
    tipsSection.style.display = 'none';
  }
});

addExpenseBtn.addEventListener('click', handleAddExpense);

[expenseDateInput, expenseNameInput, expenseAmountInput].forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddExpense();
    }
  });
});

function handleAddExpense() {
  const expenseDate = expenseDateInput.value;
  const expenseName = expenseNameInput.value.trim();
  const expenseAmount = parseFloat(expenseAmountInput.value);
  const expenseCategory = expenseCategoryInput.value;
  const currentBudget = parseFloat(totalBudget.textContent) || 0;

  if (!expenseDate) {
    showWarning('⚠️ Please select an expense date!');
    return;
  }
  if (!expenseName) {
    showWarning('⚠️ Please enter an expense name!');
    return;
  }
  if (isNaN(expenseAmount) || expenseAmount <= 0) {
    showWarning('⚠️ Please enter a valid expense amount!');
    return;
  }
  if (currentBudget === 0) {
    showWarning('⚠️ Please set a budget first!');
    return;
  }
  if (totalExpenseAmount + expenseAmount > currentBudget) {
    showWarning('❌ Insufficient budget! This expense exceeds your remaining balance.');
    return;
  }

  const expense = {
    date: expenseDate,
    name: expenseName,
    category: expenseCategory,
    amount: expenseAmount
  };

  totalExpenseAmount += expenseAmount;
  document.getElementById('total-expenses').textContent = totalExpenseAmount.toFixed(2);
  updateRemainingBalance();

  addExpenseToStorage(currentBudgetMonth, expense);
  renderAllExpenses();
  clearExpenseForm();
}

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.category;
    renderAllExpenses();
  });
});

sortBtn.addEventListener('click', sortExpensesDisplay);

clearAllBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all expenses for this month?')) {
    clearExpenseTable();
    saveBudgetData(currentBudgetMonth, parseFloat(totalBudget.textContent), []);
    document.getElementById('total-expenses').textContent = '0';
    currentFilter = 'All';
    filterButtons.forEach(b => b.classList.remove('active'));
    filterButtons[0].classList.add('active');
    updateExpenseCount();
    renderAllExpenses();
    showWarning('✓ All expenses cleared!');
  }
});

// ============ Initialize ============
document.addEventListener('DOMContentLoaded', () => {
  const savedMonth = localStorage.getItem('selectedMonth') || 'January';
  monthSelect.value = savedMonth;
  currentBudgetMonth = savedMonth;
  updateDateRange(savedMonth);
  
  const monthData = loadBudgetData(savedMonth);
  if (monthData.budget > 0) {
    totalBudget.textContent = monthData.budget.toFixed(2);
    budgetInput.value = monthData.budget;
    monthSummary.textContent = `📅 Budget Summary of ${savedMonth}`;
    monthSummary.classList.add('show');
    
    totalExpenseAmount = 0;
    expenseTableBody.innerHTML = '';
    
    monthData.expenses.forEach((expense, index) => {
      totalExpenseAmount += expense.amount;
      renderExpenseRow(expense, index, savedMonth);
    });
    
    document.getElementById('total-expenses').textContent = totalExpenseAmount.toFixed(2);
    updateRemainingBalance();
    
    budgetProgressSection.style.display = 'block';
    filterSection.style.display = 'block';
    clearAllBtn.style.display = 'inline-flex';
    
    renderAllExpenses();
  }
});
