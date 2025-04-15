let totalBudget = document.getElementById('budget-amount');
const remainBudget = document.getElementById('remaining-balance');
const setBudgetBtn = document.getElementById('setBudget');
const monthSelect = document.getElementById('month-select');
const expenseDateInput = document.getElementById('expense-date');

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

setBudgetBtn.addEventListener('click', () => {
  const selectedMonth = monthSelect.value;
  const estimatedBudget = parseFloat(document.getElementById('budget').value);
  const sumMonth = document.getElementById('summary-month');

  if (isNaN(estimatedBudget) || estimatedBudget <= 0) {
    alert("Please enter a valid budget!");
    return;
  }

  sumMonth.textContent = `Budget Summary of ${selectedMonth}`;
  totalBudget.textContent = estimatedBudget;
  updateRemainingBalance();

  localStorage.setItem('selectedMonth', selectedMonth);
  updateDateRange(selectedMonth);
});

monthSelect.addEventListener('change', () => {
  const selectedMonth = monthSelect.value;
  updateDateRange(selectedMonth);
});

function updateDateRange(month) {
  const range = monthRanges[month];
  if (range) {
    const currentYear = new Date().getFullYear();

    const [startMonth, startDay] = range.start.split("-");
    const [endMonth, endDay] = range.end.split("-");

    expenseDateInput.min = `${currentYear}-${startMonth}-${startDay}`;
    expenseDateInput.max = `${currentYear}-${endMonth}-${endDay}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const savedMonth = localStorage.getItem('selectedMonth') || "January";
  monthSelect.value = savedMonth;
  updateDateRange(savedMonth);
});

let totalExpenseAmount = 0;
const setExpenseBtn = document.getElementById('addExpense');

setExpenseBtn.addEventListener('click', () => {
  const expenseDate = document.getElementById('expense-date').value;
  const expenseName = document.getElementById('expense-name').value;
  const expenseBudget = parseFloat(document.getElementById('expense-budget').value);
  const totalExpense = document.getElementById('total-expenses');
  const budgetWarning = document.getElementById('warning-message');

  if (!totalBudget || !expenseDate || !expenseName || isNaN(expenseBudget)) {
    alert("Please fill the empty fields!!!");
    return;
  }

  if ((totalExpenseAmount + expenseBudget) > parseFloat(totalBudget.textContent)) {
    alert("No budget left for more expenses!!!");
    budgetWarning.innerText = `No budget left for more expenses!!!`;
    return;
  }

  totalExpenseAmount += expenseBudget;
  totalExpense.textContent = totalExpenseAmount;
  updateRemainingBalance();
  budgetWarning.innerText = '';

  const expenseTable = document.getElementById('expense-table-body');
  const newRow = document.createElement('tr');

  const dateCell = document.createElement('td');
  const nameCell = document.createElement('td');
  const budgetCell = document.createElement('td');
  const actionCell = document.createElement('td');
  const editBtn = document.createElement('button');
  const deleteBtn = document.createElement('button');

  dateCell.textContent = expenseDate;
  nameCell.textContent = expenseName;
  budgetCell.textContent = expenseBudget;
  editBtn.textContent = 'Edit';
  deleteBtn.textContent = 'Delete';

  newRow.appendChild(dateCell);
  newRow.appendChild(nameCell);
  newRow.appendChild(budgetCell);
  newRow.appendChild(actionCell);
  actionCell.appendChild(editBtn);
  actionCell.appendChild(deleteBtn);
  expenseTable.appendChild(newRow);

  document.getElementById('expense-name').value = '';
  document.getElementById('expense-budget').value = '';
  document.getElementById('expense-date').value = '';

  deleteBtn.addEventListener('click', () => {
    totalExpenseAmount -= parseFloat(budgetCell.textContent);
    totalExpense.textContent = totalExpenseAmount;
    updateRemainingBalance();
    expenseTable.removeChild(newRow);
  });

  editBtn.addEventListener('click', () => {
    totalExpenseAmount -= parseFloat(budgetCell.textContent);
    totalExpense.textContent = totalExpenseAmount;

    document.getElementById('expense-date').value = dateCell.textContent;
    document.getElementById('expense-name').value = nameCell.textContent;
    document.getElementById('expense-budget').value = budgetCell.textContent;
    updateRemainingBalance();
    expenseTable.removeChild(newRow);
  });
});

function updateRemainingBalance() {
  const estimatedBudget = parseFloat(totalBudget.textContent);
  const remaining = estimatedBudget - totalExpenseAmount;
  remainBudget.textContent = remaining;
}
