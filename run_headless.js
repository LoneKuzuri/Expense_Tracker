const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost:8000'
});

function dumpState() {
  const w = dom.window;
  const budget = w.document.getElementById('budget-amount')?.textContent || '0';
  const totalExpenses = w.document.getElementById('total-expenses')?.textContent || '0';
  const remaining = w.document.getElementById('remaining-balance')?.textContent || '0';
  const expenseCount = w.document.getElementById('expense-count')?.textContent || '0';

  console.log('=== App Headless State ===');
  console.log('Budget:', budget);
  console.log('Total Expenses:', totalExpenses);
  console.log('Remaining:', remaining);
  console.log('Expense Count:', expenseCount);

  const rows = w.document.querySelectorAll('#expense-table-body tr');
  if (rows.length === 0) {
    console.log('No expense rows present.');
  } else {
    console.log(`Found ${rows.length} expense rows:`);
    rows.forEach((r, i) => {
      const cols = r.querySelectorAll('td');
      const cells = Array.from(cols).map(c => c.textContent.trim());
      console.log(i + 1, cells.join(' | '));
    });
  }

  // Exit after dumping
  process.exit(0);
}

dom.window.addEventListener('load', () => {
  // give some time for scripts that run on load to initialize
  setTimeout(dumpState, 300);
});
