import path from "node:path";
import { resolvePorts } from "./lib/ports.mjs";
import { runCommand } from "./lib/run.mjs";
import { ensureProgramArtifact } from "./localnet/build-program.mjs";
import { startLocalnet } from "./localnet/validator.mjs";

const ports = await resolvePorts();
const programId = process.env.AIRLINE_PROGRAM_ID ?? "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";
const openbookProgramId =
  process.env.AIRLINE_OPENBOOK_V2_PROGRAM_ID ?? "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb";
const pythPushProgramId =
  process.env.AIRLINE_PYTH_PUSH_PROGRAM_ID ?? "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ";
const idlPath =
  process.env.AIRLINE_IDL_PATH ?? path.join("apps", "web", "public", "idl", "airline.json");
const pythAccountDir =
  process.env.AIRLINE_PYTH_ACCOUNT_DIR ?? path.join("scripts", "localnet", "accounts", "pyth");
const program = await ensureProgramArtifact({
  programId,
  programName: "airline",
  manifestPath: "programs/airline/Cargo.toml"
});
const openbookProgram = await ensureProgramArtifact({
  programId: openbookProgramId,
  programName: "openbook_v2_mock",
  manifestPath: "programs/openbook-v2-mock/Cargo.toml"
});
const localnet = await startLocalnet({
  rpcPort: ports.rpcPort,
  wsPort: ports.wsPort,
  programs: [program, openbookProgram],
  accountDirs: [pythAccountDir]
});
const env = {
  AIRLINE_RPC_PORT: String(ports.rpcPort),
  AIRLINE_WS_PORT: String(localnet.wsPort),
  AIRLINE_RPC_URL: localnet.rpcUrl,
  AIRLINE_WS_URL: localnet.wsUrl,
  AIRLINE_PROGRAM_ID: programId,
  AIRLINE_IDL_PATH: idlPath,
  AIRLINE_OPENBOOK_V2_PROGRAM_ID: openbookProgramId,
  AIRLINE_PYTH_PUSH_PROGRAM_ID: pythPushProgramId,
  AIRLINE_PYTH_ACCOUNT_DIR: pythAccountDir
};

try {
  await runCommand({ command: "node scripts/migrate/run.mjs", env });
  await runCommand({ command: "cargo test -p airline --test localnet -- --ignored", env });
  await runCommand({
    command:
      "corepack yarn vitest run --config vitest.config.ts packages/cli/tests/localnet/localnet.test.ts",
    env
  });
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
