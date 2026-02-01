import path from "node:path";
import { resolvePorts } from "./lib/ports.mjs";
import { runCommand } from "./lib/run.mjs";
import { ensureProgramArtifact } from "./localnet/build-program.mjs";
import { startLocalnet } from "./localnet/validator.mjs";

const ports = await resolvePorts();
const programId = process.env.AIRLINE_PROGRAM_ID ?? "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";
const idlPath =
  process.env.AIRLINE_IDL_PATH ?? path.join("apps", "web", "public", "idl", "airline.json");
const program = await ensureProgramArtifact({
  programId,
  programName: "airline",
  manifestPath: "programs/airline/Cargo.toml"
});
const localnet = await startLocalnet({
  rpcPort: ports.rpcPort,
  wsPort: ports.wsPort,
  programs: [program]
});
const env = {
  AIRLINE_RPC_PORT: String(ports.rpcPort),
  AIRLINE_WS_PORT: String(localnet.wsPort),
  AIRLINE_RPC_URL: localnet.rpcUrl,
  AIRLINE_WS_URL: localnet.wsUrl,
  AIRLINE_PROGRAM_ID: programId,
  AIRLINE_IDL_PATH: idlPath
};

try {
  await runCommand({ command: "node scripts/migrate/run.mjs", env });
  await runCommand({ command: "cargo test -p airline --test localnet -- --ignored", env });
  await runCommand({
    command:
      "corepack yarn vitest run --config vitest.config.ts packages/client/tests/localnet/localnet.test.ts",
    env
  });
  await runCommand({
    command: "corepack yarn vitest run --config apps/web/vitest.config.ts apps/web/tests/localnet",
    env
  });
} finally {
  await localnet.stop();
}
