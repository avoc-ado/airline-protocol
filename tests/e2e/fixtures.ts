import { chromium, expect, test as base } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const resolveUserDataDir = ({ workerIndex }: { workerIndex: number }) => {
  const agentId = process.env.AIRLINE_AGENT_ID ?? `${process.pid}`;
  const baseDir =
    process.env.AIRLINE_PROFILE_DIR ??
    path.join(process.cwd(), ".playwright", "profiles", `agent-${agentId}`);

  return path.join(baseDir, `worker-${workerIndex}`);
};

const test = base.extend({
  context: async ({}, use, testInfo) => {
    const userDataDir = resolveUserDataDir({ workerIndex: testInfo.workerIndex });
    await mkdir(userDataDir, { recursive: true });

    const headless =
      typeof testInfo.project.use.headless === "boolean" ? testInfo.project.use.headless : true;

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless
    });

    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  }
});

export { expect, test };
