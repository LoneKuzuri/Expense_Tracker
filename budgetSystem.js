
(function(root){
  const STORAGE_KEY = 'rollingBudgetData';
  const TX_KEY = 'rollingTransactions';
  const SETTINGS_KEY = 'budgetSettings';

  function isNode() {
    return (typeof window === 'undefined');
  }

  // Simple file-backed storage for node demos
  const fs = isNode() ? require('fs') : null;
  const storageFile = isNode() ? (__dirname + '/.rolling_storage.json') : null;

  function readStore() {
    if (!isNode()) return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    try {
      if (!fs.existsSync(storageFile)) return {};
      const raw = fs.readFileSync(storageFile, 'utf8');
      return JSON.parse(raw || '{}');
    } catch (e) { return {}; }
  }

  function writeStore(obj) {
    if (!isNode()) return localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    fs.writeFileSync(storageFile, JSON.stringify(obj, null, 2), 'utf8');
  }

  function readTx() {
    if (!isNode()) return JSON.parse(localStorage.getItem(TX_KEY) || '[]');
    try {
      const p = __dirname + '/.rolling_tx.json';
      if (!fs.existsSync(p)) return [];
      return JSON.parse(fs.readFileSync(p,'utf8')||'[]');
    } catch(e){ return []; }
  }

  function writeTx(arr) {
    if (!isNode()) return localStorage.setItem(TX_KEY, JSON.stringify(arr));
    const p = __dirname + '/.rolling_tx.json';
    fs.writeFileSync(p, JSON.stringify(arr, null, 2), 'utf8');
  }

  function getSettings() {
    if (!isNode()) return JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify({enableCarryForward:true,carryNegative:true,autoCreate:true}));
    const p = __dirname + '/.rolling_settings.json';
    try {
      if (!fs.existsSync(p)) return {enableCarryForward:true,carryNegative:true,autoCreate:true};
      return JSON.parse(fs.readFileSync(p,'utf8')||'{}');
    } catch(e){ return {enableCarryForward:true,carryNegative:true,autoCreate:true}; }
  }

  function setSettings(s) {
    if (!isNode()) return localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    const p = __dirname + '/.rolling_settings.json';
    fs.writeFileSync(p, JSON.stringify(s,null,2),'utf8');
  }

  function keyFor(userId, bsYear, bsMonth){
    return `${userId}:${bsYear}:${bsMonth}`;
  }

  function getMonthlyBudget(userId, bsYear, bsMonth){
    const store = readStore();
    const key = keyFor(userId, bsYear, bsMonth);
    return store[key] || null;
  }

  function validateBudgetRecord(record){
    if (record.initial_budget < 0) throw new Error('Initial Budget cannot be negative');
    if (record.added_budget < 0) throw new Error('Added Budget cannot be negative');
  }

  function saveMonthlyBudget(userId, bsYear, bsMonth, record){
    const store = readStore();
    const key = keyFor(userId, bsYear, bsMonth);
    store[key] = record;
    writeStore(store);
  }

  function getTransactions(userId, bsYear, bsMonth){
    const all = readTx();
    return all.filter(t=>t.user_id===userId && t.bs_year===bsYear && t.bs_month===bsMonth && t.transaction_type==='expense');
  }

  function addTransaction(tx){
    const all = readTx();
    all.push(tx);
    writeTx(all);
  }

  function sumExpenses(userId, bsYear, bsMonth){
    const tx = getTransactions(userId, bsYear, bsMonth);
    return tx.reduce((s,t)=>s + parseFloat(t.amount||0), 0);
  }

  function calculateAvailableBudget(budgetRecord){
    return parseFloat((Number(budgetRecord.initial_budget||0) + Number(budgetRecord.added_budget||0) + Number(budgetRecord.carry_forward||0)).toFixed(2));
  }

  function calculateRemainingBudget(budgetRecord, expensesAmount){
    const available = calculateAvailableBudget(budgetRecord);
    return parseFloat((available - Number(expensesAmount||0)).toFixed(2));
  }

  function calculateBudgetUsage(budgetRecord, expensesAmount){
    const available = calculateAvailableBudget(budgetRecord);
    if (available === 0) return 0;
    const used = (Number(expensesAmount||0) / available) * 100;
    return parseFloat(used.toFixed(2));
  }

  function calculateCarryForward(prevRemaining){
    const settings = getSettings();
    if (!settings.enableCarryForward) return 0;
    if (!settings.carryNegative && prevRemaining < 0) return 0;
    return parseFloat(Number(prevRemaining||0).toFixed(2));
  }

  function initializeMonthlyBudget(userId, bsYear, bsMonth, initialBudget){
    if (initialBudget < 0) throw new Error('Initial Budget cannot be negative');
    const existing = getMonthlyBudget(userId, bsYear, bsMonth);
    if (existing) return existing; // prevent duplicate

    // find previous month key
    const prev = previousBsMonth(bsYear, bsMonth);
    let carry = 0;
    const prevRecord = getMonthlyBudget(userId, prev.year, prev.month);
    if (prevRecord){
      const prevExpenses = sumExpenses(userId, prev.year, prev.month);
      const prevRemaining = calculateRemainingBudget(prevRecord, prevExpenses);
      carry = calculateCarryForward(prevRemaining);
    }

    const record = {
      id: `${userId}-${bsYear}-${bsMonth}`,
      user_id: userId,
      bs_year: bsYear,
      bs_month: bsMonth,
      initial_budget: parseFloat(Number(initialBudget||0).toFixed(2)),
      added_budget: 0,
      carry_forward: carry,
      adjustments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    validateBudgetRecord(record);
    saveMonthlyBudget(userId, bsYear, bsMonth, record);
    return record;
  }

  function updateInitialBudget(userId, bsYear, bsMonth, newInitial){
    if (newInitial < 0) throw new Error('Initial Budget cannot be negative');
    let rec = getMonthlyBudget(userId, bsYear, bsMonth);
    if (!rec) {
      rec = initializeMonthlyBudget(userId, bsYear, bsMonth, newInitial);
      return rec;
    }
    rec.initial_budget = parseFloat(Number(newInitial).toFixed(2));
    rec.updated_at = new Date().toISOString();
    validateBudgetRecord(rec);
    saveMonthlyBudget(userId, bsYear, bsMonth, rec);
    return rec;
  }

  function addBudgetAdjustment(userId, bsYear, bsMonth, amount, note){
    if (amount === 0) return getMonthlyBudget(userId, bsYear, bsMonth);
    if (amount < 0) throw new Error('Added Budget cannot be negative');
    const rec = getMonthlyBudget(userId, bsYear, bsMonth) || initializeMonthlyBudget(userId, bsYear, bsMonth, 0);
    rec.added_budget = parseFloat((Number(rec.added_budget||0) + Number(amount)).toFixed(2));
    rec.adjustments = rec.adjustments || [];
    rec.adjustments.push({amount: Number(amount), note: note||'', at: new Date().toISOString()});
    rec.updated_at = new Date().toISOString();
    validateBudgetRecord(rec);
    saveMonthlyBudget(userId, bsYear, bsMonth, rec);
    return rec;
  }

  function getBudgetSummary(userId, bsYear, bsMonth){
    const rec = getMonthlyBudget(userId, bsYear, bsMonth) || (getSettings().autoCreate ? initializeMonthlyBudget(userId, bsYear, bsMonth,0) : null);
    if (!rec) return null;
    const expenses = sumExpenses(userId, bsYear, bsMonth);
    const available = calculateAvailableBudget(rec);
    const remaining = calculateRemainingBudget(rec, expenses);
    const usage = calculateBudgetUsage(rec, expenses);
    return {
      budgetRecord: rec,
      expenses: parseFloat(Number(expenses).toFixed(2)),
      available,
      remaining,
      usage
    };
  }

  function getBudgetHistory(userId, year){
    const store = readStore();
    const results = [];
    Object.values(store).forEach(rec=>{
      if (rec.user_id===userId && rec.bs_year===year) results.push(rec);
    });
    // sort by month order if possible
    return results.sort((a,b)=>bsMonthIndex(a.bs_month)-bsMonthIndex(b.bs_month));
  }

  function bsMonths(){
    return ['Baishakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
  }

  function bsMonthIndex(m){
    const idx = bsMonths().indexOf(m);
    return idx===-1?0:idx;
  }

  function previousBsMonth(year, month){
    const months = bsMonths();
    const idx = months.indexOf(month);
    if (idx === -1) return {year, month};
    if (idx === 0) return {year: Number(year)-1, month: months[months.length-1]};
    return {year, month: months[idx-1]};
  }

  // Expose API
  const api = {
    getMonthlyBudget,
    initializeMonthlyBudget,
    addBudgetAdjustment,
    getBudgetSummary,
    getBudgetHistory,
    calculateAvailableBudget,
    calculateRemainingBudget,
    calculateBudgetUsage,
    calculateCarryForward,
    addTransaction,
    getTransactions,
    sumExpenses,
    getSettings,
    setSettings,
    updateInitialBudget,
    bsMonths
  };

  root.budgetSystem = api;
})(typeof window !== 'undefined' ? window : global);
