import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export default defineConfig({
  root: rootDir,
  test: {
    environment: "node",
    include: ["apps/web/tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      all: false,
      include: ["apps/web/src/**"],
      reportsDirectory: "apps/web/coverage",
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 85
      }
    }
  }
});
