import { defineConfig } from "@playwright/test";

const resolveWebPort = () => {
  const value = Number.parseInt(process.env.AIRLINE_WEB_PORT ?? "", 10);
  if (Number.isNaN(value)) {
    return 3000;
  }

  return value;
};

const webPort = resolveWebPort();
const baseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  webServer: {
    command: `corepack yarn workspace @airline-protocol/web dev --port ${webPort}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
