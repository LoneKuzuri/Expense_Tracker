require('./budgetSystem');
const bs = global.budgetSystem;

function printSummary(summary){
  const r = summary.budgetRecord;
  console.log(`\n=== ${r.bs_month} ${r.bs_year} ===`);
  console.log('Initial Budget:', r.initial_budget);
  console.log('Added Budget:', r.added_budget);
  console.log('Carry Forward:', r.carry_forward);
  console.log('Available:', summary.available);
  console.log('Expenses:', summary.expenses);
  console.log('Remaining:', summary.remaining);
  console.log('Usage %:', summary.usage + '%');
}

async function runDemo(){
  const userId = 1;
  // Example: Baishakh 2083
  bs.initializeMonthlyBudget(userId, 2083, 'Baishakh', 5000);
  bs.addBudgetAdjustment(userId, 2083, 'Baishakh', 2000, 'Top-up');
  // add some expenses
  bs.addTransaction({id:1,user_id:userId,amount:4500,transaction_type:'expense',bs_year:2083,bs_month:'Baishakh',bs_date:'2083-01-15',ad_date:new Date().toISOString(),category_id:1});

  const sum1 = bs.getBudgetSummary(userId,2083,'Baishakh');
  printSummary(sum1);

  // Jestha 2083 should auto-carry forward when initialized
  bs.initializeMonthlyBudget(userId,2083,'Jestha',6000);
  const sum2 = bs.getBudgetSummary(userId,2083,'Jestha');
  printSummary(sum2);
}

runDemo();
