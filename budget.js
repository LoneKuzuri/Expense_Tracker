// ============ DOM Elements ============
let totalBudget = null;
let availableAmount = null;
let totalExpenseDisplay = null;
let remainBudget = null;
let setBudgetBtn = null;
let addExpenseBtn = null;
let monthSelect = null;
let yearSelect = null;
let expenseDateInput = null;
let expenseNameInput = null;
let expenseCategoryInput = null;
let expenseAmountInput = null;
let budgetInput = null;
let addBudgetBtn = null;
let warningBanner = null;
let monthSummary = null;
let emptyState = null;
let expenseTableBody = null;
let filterButtons = null;
let recurringExpenseInput = null;
let sortBtn = null;
let clearAllBtn = null;
let budgetProgressSection = null;
let progressBar = null;
let budgetPercentage = null;
let filterSection = null;
let categoryBreakdown = null;
let categoryList = null;
let expenseCountDisplay = null;
let tipsSection = null;
let tipsContainer = null;
let searchExpense = null;
let dateFromInput = null;
let dateToInput = null;
let recurringOnlyInput = null;
let exportBtn = null;
let importBtn = null;
let importFileInput = null;
let resetMonthBtn = null;
let historyGrid = null;
let historyList = null;
let refreshHistoryBtn = null;
let yearLabel = null;
let historySection = null;

const BS = window.budgetSystem || null;
const USER_ID = 1;
const CURRENT_BS_YEAR = Number(localStorage.getItem('bsYear') || '2083');
const STORAGE_KEY = 'budgetTrackerData';

let currentFilter = 'All';
let sortOrder = 'date-asc';
let currentBudgetMonth = 'Baishakh';
let currentYear = CURRENT_BS_YEAR;
let searchQuery = '';
let dateFrom = '';
let dateTo = '';
let showRecurringOnly = false;
let totalExpenseAmount = 0;

function getMonthKey(month, year) {
  return `${year}-${month}`;
}

function loadBudgetData(month, year) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return data[getMonthKey(month, year)] || { budget: 0, expenses: [] };
}

function saveBudgetData(month, year, budget, expenses) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  data[getMonthKey(month, year)] = { budget, expenses };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getExpensesForMonth(month, year) {
  return loadBudgetData(month, year).expenses || [];
}

function addExpenseToStorage(month, year, expense) {
  const data = loadBudgetData(month, year);
  data.expenses = data.expenses || [];
  data.expenses.push(expense);
  saveBudgetData(month, year, data.budget, data.expenses);
}

function updateExpenseInStorage(month, year, index, expense) {
  const data = loadBudgetData(month, year);
  if (!data.expenses || !data.expenses[index]) return;
  data.expenses[index] = expense;
  saveBudgetData(month, year, data.budget, data.expenses);
}

function removeExpenseFromStorage(month, year, index) {
  const data = loadBudgetData(month, year);
  data.expenses = data.expenses || [];
  data.expenses.splice(index, 1);
  saveBudgetData(month, year, data.budget, data.expenses);
}

function getYearlyHistory(year) {
  if (BS) {
    const rawHistory = BS.getBudgetHistory(USER_ID, year) || [];
    return rawHistory.map(record => ({
      month: record.bs_month || record.month || '',
      budgetRecord: record,
      expenses: typeof BS.sumExpenses === 'function'
        ? BS.sumExpenses(USER_ID, year, record.bs_month || record.month)
        : 0,
    }));
  }

  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return Object.entries(data)
    .filter(([key]) => key.startsWith(`${year}-`))
    .map(([key, value]) => ({
      month: key.split('-')[1],
      budgetRecord: { ...value, initial_budget: value.budget, added_budget: 0, carry_forward: 0, adjustments: [] },
      expenses: value.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    }));
}

function showWarning(message) {
  if (!warningBanner) return;
  warningBanner.textContent = message;
  warningBanner.classList.add('show');
  setTimeout(() => warningBanner.classList.remove('show'), 4500);
}

function clearExpenseForm() {
  expenseDateInput.value = '';
  expenseNameInput.value = '';
  expenseAmountInput.value = '';
  expenseCategoryInput.value = 'Food';
  if (recurringExpenseInput) {
    recurringExpenseInput.checked = false;
  }
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

function updateRemainingBalance() {
  const budget = parseFloat(totalBudget.textContent) || 0;
  const remaining = Math.max(0, budget - totalExpenseAmount);
  remainBudget.textContent = remaining.toFixed(2);
  availableAmount.textContent = remaining.toFixed(2);
  updateBudgetProgress();
}

function updateBudgetProgress() {
  const budget = parseFloat(totalBudget.textContent) || 0;
  const used = parseFloat(totalExpenseAmount) || 0;
  const percentage = budget === 0 ? 0 : Math.min((used / budget) * 100, 100);
  if (budgetPercentage) {
    budgetPercentage.textContent = `${Math.round(percentage)}%`;
  }
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    if (percentage >= 90) {
      progressBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
    } else if (percentage >= 75) {
      progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
    } else {
      progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)';
    }
  }
}

function updateEmptyState() {
  if (!emptyState) return;
  if (expenseTableBody.children.length === 0) {
    emptyState.classList.add('show');
  } else {
    emptyState.classList.remove('show');
  }
}

function updateExpenseCount(expenses = []) {
  expenseCountDisplay.textContent = expenses.length;
}

function updateAverageExpense(expenses = []) {
  const average = expenses.length === 0 ? 0 : expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) / expenses.length;
  const averageDisplay = document.getElementById('average-expense');
  if (averageDisplay) {
    averageDisplay.textContent = average.toFixed(2);
  }
}

function getCategoryStats(expenses) {
  return expenses.reduce((stats, expense) => {
    const category = expense.category || 'Other';
    stats[category] = stats[category] || { amount: 0, count: 0 };
    stats[category].amount += Number(expense.amount || 0);
    stats[category].count += 1;
    return stats;
  }, {});
}

function applyFilters(expenses) {
  return expenses.filter(expense => {
    if (currentFilter !== 'All' && expense.category !== currentFilter) {
      return false;
    }
    if (searchQuery && !(`${expense.name}`.toLowerCase().includes(searchQuery) || `${expense.category}`.toLowerCase().includes(searchQuery))) {
      return false;
    }
    if (dateFrom && expense.date < dateFrom) {
      return false;
    }
    if (dateTo && expense.date > dateTo) {
      return false;
    }
    if (showRecurringOnly && !expense.recurring) {
      return false;
    }
    return true;
  });
}

function sortExpenses(expenses) {
  const sorted = [...expenses];
  if (sortOrder === 'date-asc') {
    sorted.sort((a, b) => a.date.localeCompare(b.date));
  } else if (sortOrder === 'date-desc') {
    sorted.sort((a, b) => b.date.localeCompare(a.date));
  } else if (sortOrder === 'amount-asc') {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (sortOrder === 'amount-desc') {
    sorted.sort((a, b) => b.amount - a.amount);
  }
  return sorted;
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
    const percentage = totalExpenseAmount === 0 ? 0 : ((data.amount / totalExpenseAmount) * 100).toFixed(1);
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div class="category-item-header">
        <span class="category-name">${category}</span>
        <span class="category-count">${data.count} items</span>
      </div>
      <div class="category-amount">Rs. ${data.amount.toFixed(2)}</div>
      <div class="category-percentage">${percentage}% of total</div>
    `;
    categoryList.appendChild(item);
  });
}

function generateSmartTips(expenses) {
  const tips = [];
  const budget = parseFloat(totalBudget.textContent) || 0;
  if (expenses.length === 0) {
    tips.push({ icon: '💡', title: 'Start tracking', description: 'Add expenses to get monthly insights and warnings.' });
  } else {
    const ratio = budget === 0 ? 0 : (totalExpenseAmount / budget) * 100;
    if (ratio >= 95) {
      tips.push({ icon: '🚨', title: 'Almost over budget', description: 'Your spending is at 95% or more of your available monthly budget.' });
    } else if (ratio >= 75) {
      tips.push({ icon: '⚠️', title: 'Watch spending', description: 'You have used more than 75% of your budget.' });
    } else {
      tips.push({ icon: '✅', title: 'Budget is healthy', description: 'You still have room to spend responsibly this month.' });
    }
    const categoryStats = getCategoryStats(expenses);
    const topCategory = Object.entries(categoryStats).sort((a, b) => b[1].amount - a[1].amount)[0];
    if (topCategory) {
      tips.push({ icon: '🎯', title: `Top spending: ${topCategory[0]}`, description: `You spent Rs. ${topCategory[1].amount.toFixed(2)} on ${topCategory[0]}.` });
    }
    const recurringCount = expenses.filter(exp => exp.recurring).length;
    if (recurringCount > 0) {
      tips.push({ icon: '🔄', title: 'Recurring expenses', description: `You have ${recurringCount} recurring expense${recurringCount > 1 ? 's' : ''}.` });
    }
    const average = expenses.length === 0 ? 0 : totalExpenseAmount / expenses.length;
    tips.push({ icon: '📊', title: 'Average expense', description: `Your average expense is Rs. ${average.toFixed(2)}.` });
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
    const card = document.createElement('div');
    card.className = 'tip-card';
    card.innerHTML = `
      <div class="tip-icon">${tip.icon}</div>
      <div class="tip-title">${tip.title}</div>
      <div class="tip-description">${tip.description}</div>
    `;
    tipsContainer.appendChild(card);
  });
}

function formatMonthName(month) {
  return month;
}

function renderHistory(year) {
  const history = getYearlyHistory(year);
  historyGrid.innerHTML = '';
  historyList.innerHTML = '';
  if (history.length === 0) {
    historyGrid.innerHTML = '<p class="history-empty">No monthly budgets found for this year.</p>';
    return;
  }
  history.forEach(item => {
    const available = item.budgetRecord.initial_budget + Number(item.budgetRecord.added_budget || 0) + Number(item.budgetRecord.carry_forward || 0);
    const remaining = available - Number(item.expenses || 0);
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <h4>${formatMonthName(item.month)}</h4>
      <p>Budget Rs. ${formatCurrency(available)}</p>
      <small>Spent Rs. ${formatCurrency(item.expenses)}</small>
    `;
    historyGrid.appendChild(card);
    const line = document.createElement('div');
    line.className = 'history-line';
    line.innerHTML = `
      <span>${formatMonthName(item.month)}</span>
      <span>Remaining Rs. ${formatCurrency(remaining)}</span>
    `;
    historyList.appendChild(line);
  });
}

function renderExpenseRow(expense) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${expense.date}</td>
    <td>${expense.name}</td>
    <td>${expense.category}</td>
    <td>Rs. ${formatCurrency(expense.amount)}</td>
    <td class="table-actions"></td>
  `;
  const actionCell = row.querySelector('.table-actions');
  const editBtn = document.createElement('button');
  const deleteBtn = document.createElement('button');
  editBtn.className = 'btn-edit';
  deleteBtn.className = 'btn-delete';
  editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
  deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
  editBtn.addEventListener('click', () => handleEditExpense(expense.id));
  deleteBtn.addEventListener('click', () => handleDeleteExpense(expense.id));
  actionCell.appendChild(editBtn);
  actionCell.appendChild(deleteBtn);
  expenseTableBody.appendChild(row);
}

function renderAllExpenses() {
  const allExpenses = getExpensesForMonth(currentBudgetMonth, currentYear);
  const filteredExpenses = applyFilters(allExpenses);
  const sortedExpenses = sortExpenses(filteredExpenses);
  expenseTableBody.innerHTML = '';
  sortedExpenses.forEach(expense => renderExpenseRow(expense));
  totalExpenseAmount = allExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  totalExpenseDisplay.textContent = formatCurrency(totalExpenseAmount);
  updateExpenseCount(allExpenses);
  updateAvailableAmount();
  updateRemainingBalance();
  updateCategoryBreakdown(allExpenses);
  generateSmartTips(allExpenses);
  updateAverageExpense(allExpenses);
  updateEmptyState();
  filterSection.style.display = allExpenses.length ? 'block' : 'none';
  clearAllBtn.style.display = allExpenses.length ? 'inline-flex' : 'none';
}

function updateAvailableAmount() {
  const budgetValue = parseFloat(totalBudget.textContent) || 0;
  const available = Math.max(0, budgetValue - totalExpenseAmount);
  if (availableAmount) {
    availableAmount.textContent = available.toFixed(2);
  }
}

function loadMonthData(month, year) {
  currentBudgetMonth = month;
  currentYear = year;
  if (yearLabel) {
    yearLabel.textContent = `${year}`;
  }
  const monthData = loadBudgetData(month, year);
  if (totalBudget) {
    totalBudget.textContent = formatCurrency(monthData.budget);
  }
  if (budgetInput) {
    budgetInput.value = formatCurrency(monthData.budget);
  }
  if (monthSummary) {
    monthSummary.textContent = `${month} ${year}`;
  } else {
    console.warn('monthSummary element not found when loading month data', { month, year });
  }
  const expenses = monthData.expenses || [];
  totalExpenseAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  if (totalExpenseDisplay) {
    totalExpenseDisplay.textContent = formatCurrency(totalExpenseAmount);
  }
  updateRemainingBalance();
  renderAllExpenses();
  renderHistory(currentYear);
}

function handleSetBudget() {
  console.log('handleSetBudget fired');
  const selectedMonth = monthSelect.value;
  const selectedYear = parseInt(yearSelect.value, 10);
  const estimatedBudget = parseFloat(budgetInput.value);
  console.log('setBudget values', { selectedMonth, selectedYear, estimatedBudget });
  if (isNaN(estimatedBudget) || estimatedBudget < 0) {
    showWarning('⚠️ Please enter a valid budget amount.');
    return;
  }
  if (BS) {
    BS.updateInitialBudget(USER_ID, selectedYear, selectedMonth, estimatedBudget);
  }
  const monthData = loadBudgetData(selectedMonth, selectedYear);
  saveBudgetData(selectedMonth, selectedYear, estimatedBudget, monthData.expenses || []);
  loadMonthData(selectedMonth, selectedYear);
  showWarning('✓ Budget updated successfully.');
}

function handleTopUpBudget() {
  console.log('handleTopUpBudget fired');
  const amount = parseFloat(budgetInput.value);
  const selectedMonth = monthSelect.value;
  const selectedYear = parseInt(yearSelect.value, 10);
  console.log('topUp values', { selectedMonth, selectedYear, amount });
  if (isNaN(amount) || amount <= 0) {
    showWarning('⚠️ Enter a valid amount to top up.');
    return;
  }
  const monthData = loadBudgetData(selectedMonth, selectedYear);
  const newBudget = monthData.budget + amount;
  if (BS) {
    BS.addBudgetAdjustment(USER_ID, selectedYear, selectedMonth, amount, 'Manual top-up');
  }
  saveBudgetData(selectedMonth, selectedYear, newBudget, monthData.expenses || []);
  loadMonthData(selectedMonth, selectedYear);
}

function handleResetMonth() {
  if (!confirm('Reset this month? This clears the budget and all expenses for the selected month.')) {
    return;
  }
  const key = getMonthKey(currentBudgetMonth, currentYear);
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  delete data[key];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  totalBudget.textContent = '0';
  budgetInput.value = '';
  totalExpenseAmount = 0;
  totalExpenseDisplay.textContent = '0';
  remainBudget.textContent = '0';
  updateBudgetProgress();
  expenseTableBody.innerHTML = '';
  updateEmptyState();
  filterSection.style.display = 'none';
  categoryBreakdown.style.display = 'none';
  tipsSection.style.display = 'none';
  clearAllBtn.style.display = 'none';
  showWarning('✓ Month reset successfully.');
}

function handleAddExpense() {
  const expenseDate = expenseDateInput.value.trim();
  const expenseName = expenseNameInput.value.trim();
  const expenseAmount = parseFloat(expenseAmountInput.value);
  const expenseCategory = expenseCategoryInput.value;
  const recurring = recurringExpenseInput ? recurringExpenseInput.checked : false;
  const currentBudget = parseFloat(totalBudget.textContent) || 0;

  const bsDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!expenseDate || !bsDatePattern.test(expenseDate)) {
    showWarning('⚠️ Please enter a valid Nepali date in YYYY-MM-DD format.');
    return;
  }
  if (!expenseName) {
    showWarning('⚠️ Please enter an expense name.');
    return;
  }
  if (isNaN(expenseAmount) || expenseAmount <= 0) {
    showWarning('⚠️ Please enter a valid expense amount.');
    return;
  }
  if (currentBudget === 0) {
    showWarning('⚠️ Please set a budget before adding expenses.');
    return;
  }
  const remaining = currentBudget - totalExpenseAmount;
  if (expenseAmount > remaining) {
    showWarning('❌ This expense exceeds your remaining budget.');
    return;
  }

  const expense = {
    id: Date.now(),
    date: expenseDate,
    name: expenseName,
    category: expenseCategory,
    amount: expenseAmount,
    recurring,
  };
  if (BS) {
    BS.addTransaction({
      id: expense.id,
      user_id: USER_ID,
      amount: expense.amount,
      transaction_type: 'expense',
      bs_year: currentYear,
      bs_month: currentBudgetMonth,
      bs_date: expense.date,
      ad_date: new Date().toISOString(),
      category: expense.category,
      name: expense.name,
      recurring: expense.recurring,
    });
  }
  addExpenseToStorage(currentBudgetMonth, currentYear, expense);
  clearExpenseForm();
  renderAllExpenses();
  showWarning('✓ Expense added successfully.');
}

function handleEditExpense(expenseId) {
  const expenses = getExpensesForMonth(currentBudgetMonth, currentYear);
  const index = expenses.findIndex(expense => expense.id === expenseId);
  if (index === -1) return;
  const expense = expenses[index];
  expenseDateInput.value = expense.date;
  expenseNameInput.value = expense.name;
  expenseCategoryInput.value = expense.category;
  expenseAmountInput.value = expense.amount;
  recurringOnlyInput.checked = expense.recurring;
  removeExpenseFromStorage(currentBudgetMonth, currentYear, index);
  renderAllExpenses();
}

function handleDeleteExpense(expenseId) {
  const expenses = getExpensesForMonth(currentBudgetMonth, currentYear);
  const index = expenses.findIndex(expense => expense.id === expenseId);
  if (index === -1) return;
  removeExpenseFromStorage(currentBudgetMonth, currentYear, index);
  renderAllExpenses();
  showWarning('✓ Expense deleted successfully.');
}

function handleSortToggle() {
  const options = ['date-asc', 'date-desc', 'amount-asc', 'amount-desc'];
  const labels = {
    'date-asc': 'Date ↑',
    'date-desc': 'Date ↓',
    'amount-asc': 'Amount ↑',
    'amount-desc': 'Amount ↓',
  };
  const nextIndex = (options.indexOf(sortOrder) + 1) % options.length;
  sortOrder = options[nextIndex];
  sortBtn.innerHTML = `<i class="fas fa-sort"></i> Sort: ${labels[sortOrder]}`;
  renderAllExpenses();
}

function handleExport() {
  const data = localStorage.getItem(STORAGE_KEY) || '{}';
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `budget-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (typeof imported !== 'object' || imported === null) {
        throw new Error('Invalid format');
      }
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...imported }));
      loadMonthData(currentBudgetMonth, currentYear);
      showWarning('✓ Data imported successfully.');
    } catch (error) {
      showWarning('⚠️ Import failed. Please provide a valid JSON file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function updateFilters() {
  searchQuery = searchExpense.value.trim().toLowerCase();
  dateFrom = dateFromInput.value;
  dateTo = dateToInput.value;
  showRecurringOnly = recurringOnlyInput.checked;
  renderAllExpenses();
}

function renderInitialMonth() {
  currentBudgetMonth = monthSelect.value;
  currentYear = parseInt(yearSelect.value, 10);
  yearLabel.textContent = `${currentYear}`;
  renderHistory(currentYear);
  loadMonthData(currentBudgetMonth, currentYear);
}

function initDOMElements() {
  totalBudget = document.getElementById('budget-amount');
  availableAmount = document.getElementById('available-amount');
  totalExpenseDisplay = document.getElementById('total-expenses');
  remainBudget = document.getElementById('remaining-balance');
  setBudgetBtn = document.getElementById('setBudget');
  addExpenseBtn = document.getElementById('addExpense');
  monthSelect = document.getElementById('month-select');
  yearSelect = document.getElementById('year-select');
  expenseDateInput = document.getElementById('expense-date');
  expenseNameInput = document.getElementById('expense-name');
  expenseCategoryInput = document.getElementById('expense-category');
  expenseAmountInput = document.getElementById('expense-budget');
  budgetInput = document.getElementById('budget');
  addBudgetBtn = document.getElementById('addBudget');
  warningBanner = document.getElementById('warning-message');
  monthSummary = document.getElementById('month-summary');
  emptyState = document.getElementById('empty-state');
  expenseTableBody = document.getElementById('expense-table-body');
  filterButtons = document.querySelectorAll('.filter-btn');
  recurringExpenseInput = document.getElementById('recurring-expense');
  sortBtn = document.getElementById('sort-btn');
  clearAllBtn = document.getElementById('clear-all-btn');
  budgetProgressSection = document.getElementById('budget-progress-section');
  progressBar = document.getElementById('progress-bar');
  budgetPercentage = document.getElementById('budget-percentage');
  filterSection = document.getElementById('filter-section');
  categoryBreakdown = document.getElementById('category-breakdown');
  categoryList = document.getElementById('category-list');
  expenseCountDisplay = document.getElementById('expense-count');
  tipsSection = document.getElementById('tips-section');
  tipsContainer = document.getElementById('tips-container');
  searchExpense = document.getElementById('search-expense');
  dateFromInput = document.getElementById('date-from');
  dateToInput = document.getElementById('date-to');
  recurringOnlyInput = document.getElementById('recurring-only');
  exportBtn = document.getElementById('export-btn');
  importBtn = document.getElementById('import-btn');
  importFileInput = document.getElementById('import-file-input');
  resetMonthBtn = document.getElementById('resetMonth');
  historyGrid = document.getElementById('history-grid');
  historyList = document.getElementById('history-list');
  refreshHistoryBtn = document.getElementById('refresh-history');
  yearLabel = document.getElementById('year-label');
  historySection = document.getElementById('history-section');
}

function attachEventListeners() {
  if (setBudgetBtn) setBudgetBtn.addEventListener('click', handleSetBudget);
  if (addExpenseBtn) addExpenseBtn.addEventListener('click', handleAddExpense);
  if (addBudgetBtn) addBudgetBtn.addEventListener('click', handleTopUpBudget);
  if (resetMonthBtn) resetMonthBtn.addEventListener('click', handleResetMonth);
  if (monthSelect) monthSelect.addEventListener('change', () => loadMonthData(monthSelect.value, currentYear));
  if (yearSelect) yearSelect.addEventListener('change', () => {
    currentYear = parseInt(yearSelect.value, 10);
    yearLabel.textContent = `${currentYear}`;
    renderHistory(currentYear);
    loadMonthData(currentBudgetMonth, currentYear);
  });
  if (searchExpense) searchExpense.addEventListener('input', updateFilters);
  if (dateFromInput) dateFromInput.addEventListener('change', updateFilters);
  if (dateToInput) dateToInput.addEventListener('change', updateFilters);
  if (recurringOnlyInput) recurringOnlyInput.addEventListener('change', updateFilters);
  if (exportBtn) exportBtn.addEventListener('click', handleExport);
  if (importBtn) importBtn.addEventListener('click', () => importFileInput.click());
  if (importFileInput) importFileInput.addEventListener('change', handleImportFile);
  if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', () => renderHistory(currentYear));
  if (filterButtons) filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(it => it.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.category;
      renderAllExpenses();
    });
  });
  if (sortBtn) sortBtn.addEventListener('click', handleSortToggle);
}

function initApp() {
  initDOMElements();
  attachEventListeners();
  renderInitialMonth();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
