import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { reconcile } from "../../../scripts/truth/reconcile";

test.describe("False Complete Reconciliation Unit Tests", () => {
  const projectRoot = path.resolve(__dirname, "../../..");
  const tempLedger = path.join(projectRoot, "evidence/EXECUTION_LEDGER_temp.json");
  const tempDebt = path.join(projectRoot, "state/TRUTH_DEBT_temp.json");
  const realLedger = path.join(projectRoot, "evidence/EXECUTION_LEDGER.json");
  const realDebt = path.join(projectRoot, "state/TRUTH_DEBT.json");

  test.beforeAll(() => {
    // Back up real files if they exist
    if (fs.existsSync(realLedger)) {
      fs.copyFileSync(realLedger, tempLedger);
    }
    if (fs.existsSync(realDebt)) {
      fs.copyFileSync(realDebt, tempDebt);
    }
  });

  test.afterAll(() => {
    // Restore real files
    if (fs.existsSync(tempLedger)) {
      fs.copyFileSync(tempLedger, realLedger);
      fs.unlinkSync(tempLedger);
    }
    if (fs.existsSync(tempDebt)) {
      fs.copyFileSync(tempDebt, realDebt);
      fs.unlinkSync(tempDebt);
    }
  });

  test("should pass reconciliation if ledger and debt are clean", () => {
    fs.writeFileSync(realLedger, JSON.stringify({ receipts: [] }), "utf8");
    fs.writeFileSync(realDebt, JSON.stringify({ debts: [] }), "utf8");

    let exitCode: number | null = null;
    const originalExit = process.exit;
    process.exit = ((code) => {
      exitCode = typeof code === "number" ? code : null;
      return undefined as never;
    }) as typeof process.exit;

    try {
      reconcile();
    } finally {
      process.exit = originalExit;
    }

    expect(exitCode).toBe(0);
  });

  test("should fail reconciliation if ledger contains a FAIL status", () => {
    fs.writeFileSync(
      realLedger,
      JSON.stringify({
        receipts: [{ section: "10 §C0", status: "FAIL", artifact: "state/PROJECT_INTENT.json" }],
      }),
      "utf8",
    );
    fs.writeFileSync(realDebt, JSON.stringify({ debts: [] }), "utf8");

    let exitCode: number | null = null;
    const originalExit = process.exit;
    process.exit = ((code) => {
      exitCode = typeof code === "number" ? code : null;
      return undefined as never;
    }) as typeof process.exit;

    try {
      reconcile();
    } finally {
      process.exit = originalExit;
    }

    expect(exitCode).toBe(1);
  });
});
