import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const sleep = ({ ms }) => new Promise((resolve) => setTimeout(resolve, ms));

const requestHealth = async ({ rpcUrl }) => {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" })
  });

  if (!response.ok) {
    throw new Error(`RPC health check failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message ?? "RPC health check error");
  }

  return payload.result;
};

const supportsWsPort = ({ validatorBin }) => {
  const result = spawnSync(validatorBin, ["--help"], { encoding: "utf8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  return output.includes("--ws-port");
};

const waitForLogReady = async ({ logPath, timeoutMs, pollMs, isProcessAlive }) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (isProcessAlive && !isProcessAlive()) {
      throw new Error("solana-test-validator exited before logs stabilized");
    }

    try {
      const logs = await readFile(logPath, "utf8");
      if (logs.includes("Confirmed Slot: 1")) {
        return;
      }
    } catch {
      // Keep polling until the log exists.
    }

    await sleep({ ms: pollMs });
  }
};

const waitForRpc = async ({ rpcUrl, timeoutMs, pollMs, isProcessAlive }) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (isProcessAlive && !isProcessAlive()) {
      throw new Error("solana-test-validator exited before RPC became ready");
    }

    try {
      const health = await requestHealth({ rpcUrl });
      if (health === "ok") {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await sleep({ ms: pollMs });
  }

  throw new Error(`Timed out waiting for validator at ${rpcUrl}`);
};

const makeLedgerDir = ({ agentId, baseDir }) =>
  path.join(baseDir, `agent-${agentId}`, `${Date.now()}`);

const startLocalnet = async ({ rpcPort, wsPort, ledgerDir, keepLedger } = {}) => {
  const agentId = process.env.AIRLINE_AGENT_ID ?? `${process.pid}`;
  const baseDir =
    process.env.AIRLINE_LEDGER_BASE_DIR ?? path.join(os.tmpdir(), "airline-protocol", "localnet");
  const resolvedLedgerDir =
    ledgerDir ?? process.env.AIRLINE_LEDGER_DIR ?? makeLedgerDir({ agentId, baseDir });
  const resolvedKeepLedger = keepLedger ?? (process.env.AIRLINE_KEEP_LEDGER ?? "false") === "true";
  const validatorBin = process.env.AIRLINE_TEST_VALIDATOR_BIN ?? "solana-test-validator";
  const hasWsPortFlag = supportsWsPort({ validatorBin });
  const resolvedWsPort = hasWsPortFlag ? wsPort : rpcPort + 1;

  await mkdir(resolvedLedgerDir, { recursive: true });

  const args = ["--ledger", resolvedLedgerDir, "--rpc-port", String(rpcPort), "--reset"];

  if (hasWsPortFlag) {
    args.push("--ws-port", String(resolvedWsPort));
  }

  if ((process.env.AIRLINE_TEST_VALIDATOR_QUIET ?? "false") === "true") {
    args.push("--quiet");
  }

  const child = spawn(validatorBin, args, { stdio: "inherit" });
  let exitCode = null;

  child.on("exit", (code) => {
    exitCode = code;
  });

  const rpcUrl = `http://127.0.0.1:${rpcPort}`;
  const wsUrl = `ws://127.0.0.1:${resolvedWsPort}`;
  const logPath = path.join(resolvedLedgerDir, "validator.log");

  await waitForLogReady({
    logPath,
    timeoutMs: 30_000,
    pollMs: 500,
    isProcessAlive: () => exitCode === null
  });

  await waitForRpc({
    rpcUrl,
    timeoutMs: 30_000,
    pollMs: 500,
    isProcessAlive: () => exitCode === null
  });

  const stop = async () => {
    if (exitCode === null) {
      child.kill("SIGTERM");
      await new Promise((resolve) => {
        child.once("exit", resolve);
      });
    }

    if (!resolvedKeepLedger) {
      await rm(resolvedLedgerDir, { recursive: true, force: true });
    }
  };

  return {
    rpcUrl,
    wsUrl,
    rpcPort,
    wsPort: resolvedWsPort,
    ledgerDir: resolvedLedgerDir,
    stop
  };
};

export { startLocalnet };
