import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { reconcile } from "../../../scripts/truth/reconcile";

test.describe("Meta Framework Truth Downgrade Unit Tests", () => {
  const projectRoot = path.resolve(__dirname, "../../..");
  const tempLedger = path.join(projectRoot, "evidence/EXECUTION_LEDGER_temp.json");
  const tempDebt = path.join(projectRoot, "state/TRUTH_DEBT_temp.json");
  const realLedger = path.join(projectRoot, "evidence/EXECUTION_LEDGER.json");
  const realDebt = path.join(projectRoot, "state/TRUTH_DEBT.json");

  test.beforeAll(() => {
    if (fs.existsSync(realLedger)) {
      fs.copyFileSync(realLedger, tempLedger);
    }
    if (fs.existsSync(realDebt)) {
      fs.copyFileSync(realDebt, tempDebt);
    }
  });

  test.afterAll(() => {
    if (fs.existsSync(tempLedger)) {
      fs.copyFileSync(tempLedger, realLedger);
      fs.unlinkSync(tempLedger);
    }
    if (fs.existsSync(tempDebt)) {
      fs.copyFileSync(tempDebt, realDebt);
      fs.unlinkSync(tempDebt);
    }
  });

  test("should fail reconciliation if a blocking truth debt is open", () => {
    fs.writeFileSync(realLedger, JSON.stringify({ receipts: [] }), "utf8");
    fs.writeFileSync(
      realDebt,
      JSON.stringify({
        debts: [
          {
            debt_id: "TD-001",
            blocksComplete: true,
            status: "OPEN",
            owner: "Antigravity",
            required_fix: "Fix unit test runner integration",
          },
        ],
      }),
      "utf8",
    );

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
