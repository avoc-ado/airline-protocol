import { readFile } from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./lib/run.mjs";

const threshold = 85;

const resolveCoveragePath = () =>
  path.resolve(process.cwd(), "packages", "coverage", "coverage-summary.json");

const assertCoverage = async () => {
  const coveragePath = resolveCoveragePath();
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

  throw new Error(`Coverage below ${threshold}%: ${detail}`);
};

await runCommand({
  command:
    "corepack yarn vitest run --coverage --coverage.reporter=text --coverage.reporter=json-summary"
});

await assertCoverage();

await runCommand({
  command: "corepack yarn vitest run --config apps/web/vitest.config.ts apps/web/tests/unit"
});
