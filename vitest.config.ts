import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "packages",
  test: {
    environment: "node",
    include: ["**/*.test.ts"]
  },
  coverage: {
    provider: "v8",
    all: false,
    thresholds: {
      lines: 85,
      statements: 85,
      functions: 85,
      branches: 85
    }
  }
});
