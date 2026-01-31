import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { resolvePorts } from "./lib/ports.mjs";
import { runCommand } from "./lib/run.mjs";

const candidateConfigs = ["playwright.config.ts", "apps/web/playwright.config.ts"];

const findConfig = async () => {
  for (const configPath of candidateConfigs) {
    try {
      await access(configPath);
      return configPath;
    } catch {
      // Try next path.
    }
  }

  return null;
};

const configPath = await findConfig();

if (!configPath) {
  console.error("Playwright config missing. Add one before running e2e.");
  process.exit(1);
}

const ports = await resolvePorts();
const agentId = process.env.AIRLINE_AGENT_ID ?? `${process.pid}`;
const profileDir =
  process.env.AIRLINE_PROFILE_DIR ?? path.join(".playwright", "profiles", `agent-${agentId}`);

await mkdir(profileDir, { recursive: true });

await runCommand({
  command: "corepack yarn playwright test",
  env: {
    AIRLINE_AGENT_ID: agentId,
    AIRLINE_PROFILE_DIR: profileDir,
    AIRLINE_WEB_PORT: String(ports.webPort)
  }
});
