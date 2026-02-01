import { readFile } from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./lib/run.mjs";

const threshold = 85;

const resolveCoveragePath = ({ dir }) =>
  path.resolve(process.cwd(), dir, "coverage", "coverage-summary.json");

const assertCoverage = async ({ dir, label }) => {
  const coveragePath = resolveCoveragePath({ dir });
  const raw = await readFile(coveragePath, "utf-8");
  const summary = JSON.parse(raw);
  const total = summary.total;

  const metrics = ["lines", "statements", "functions", "branches"];
  const failures = metrics
    .map((metric) => ({ metric, value: total?.[metric]?.pct ?? 0 }))
    .filter(({ value }) => value < threshold);

  if (failures.length === 0) {
    return;
  }

  const detail = failures.map(({ metric, value }) => `${metric}=${value}`).join(", ");

  throw new Error(`[${label}] coverage below ${threshold}%: ${detail}`);
};

await runCommand({
  command:
    "corepack yarn vitest run --coverage --coverage.reporter=text --coverage.reporter=json-summary"
});

await assertCoverage({ dir: "packages", label: "packages" });

await runCommand({
  command:
    "corepack yarn vitest run --config apps/web/vitest.config.ts --coverage --coverage.reporter=text --coverage.reporter=json-summary apps/web/tests/unit"
});

await assertCoverage({ dir: "apps/web", label: "apps/web" });
