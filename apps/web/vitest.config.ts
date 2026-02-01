import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export default defineConfig({
  root: rootDir,
  test: {
    environment: "node",
    include: ["apps/web/tests/**/*.test.ts"]
  }
});
