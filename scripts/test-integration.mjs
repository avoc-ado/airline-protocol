import { resolvePorts } from "./lib/ports.mjs";
import { runCommand } from "./lib/run.mjs";
import { startLocalnet } from "./localnet/validator.mjs";

const ports = await resolvePorts();
const localnet = await startLocalnet({ rpcPort: ports.rpcPort, wsPort: ports.wsPort });
const env = {
  AIRLINE_RPC_PORT: String(ports.rpcPort),
  AIRLINE_WS_PORT: String(localnet.wsPort),
  AIRLINE_RPC_URL: localnet.rpcUrl,
  AIRLINE_WS_URL: localnet.wsUrl
};

try {
  await runCommand({ command: "node scripts/migrate/run.mjs", env });
  await runCommand({ command: "cargo test -p airline --test localnet -- --ignored", env });
} finally {
  await localnet.stop();
}
