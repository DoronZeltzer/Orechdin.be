const fs = require('fs');
const path = require('path');

function reconcile() {
  const projectRoot = path.resolve(__dirname, '../..');
  const ledgerPath = path.join(projectRoot, 'evidence/EXECUTION_LEDGER.json');
  const debtPath = path.join(projectRoot, 'state/TRUTH_DEBT.json');
  const verdictPath = path.join(projectRoot, 'evidence/repo_truth/RECONCILIATION_VERDICT.json');

  let ledger = { receipts: [] };
  let debt = { debts: [] };

  if (fs.existsSync(ledgerPath)) {
    ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  }
  if (fs.existsSync(debtPath)) {
    debt = JSON.parse(fs.readFileSync(debtPath, 'utf8'));
  }

  const failures = [];

  // Check ledger receipts
  for (const r of ledger.receipts) {
    if (r.status === 'FAIL') {
      failures.push(`Ledger section ${r.section} failed`);
    }
    if (r.status === 'EXECUTED' && r.artifact) {
      const artPath = path.join(projectRoot, r.artifact);
      if (!fs.existsSync(artPath)) {
        failures.push(`Artifact missing for executed section ${r.section}: ${r.artifact}`);
      }
    }
  }

  // Check truth debt blockers
  const debtsList = Array.isArray(debt) ? debt : (debt.debts || debt.items || []);
  for (const d of debtsList) {
    if (d.status === 'OPEN' && d.blocksComplete === true) {
      failures.push(`Blocking truth debt open: ${d.debt_id || d.id}`);
    }
  }

  const verdict = failures.length > 0 ? 'FAIL' : 'PASS';
  const result = {
    verdict,
    timestamp: new Date().toISOString(),
    failures
  };

  fs.mkdirSync(path.dirname(verdictPath), { recursive: true });
  fs.writeFileSync(verdictPath, JSON.stringify(result, null, 2), 'utf8');

  console.log(`==============================================================`);
  console.log(`TRUTH RECONCILIATION RUN`);
  console.log(`==============================================================`);
  console.log(`Verdict: ${verdict}`);
  if (failures.length > 0) {
    console.log(`Failures:`);
    failures.forEach(f => console.log(`  X ${f}`));
    process.exit(1);
  } else {
    console.log(`All checks passed successfully!`);
    process.exit(0);
  }
}

if (require.main === module) {
  reconcile();
}

module.exports = { reconcile };
