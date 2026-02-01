import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rpcPort = process.env.AIRLINE_RPC_PORT ?? "8899";
const rpcUrl = process.env.AIRLINE_RPC_URL ?? `http://127.0.0.1:${rpcPort}`;
const outputPath =
  process.env.AIRLINE_IDL_PATH ?? path.join("apps", "web", "public", "idl", "airline.json");
const programId = process.env.AIRLINE_PROGRAM_ID ?? "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";

const assertRpcReady = async () => {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" })
  });

  if (!response.ok) {
    throw new Error(`RPC not ready at ${rpcUrl}: ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.error || payload.result !== "ok") {
    throw new Error(`RPC health check failed: ${payload.error?.message ?? payload.result}`);
  }
};

await assertRpcReady();
await mkdir(path.dirname(outputPath), { recursive: true });

const idlBundle = {
  version: "0.1.0",
  name: "airline",
  instructions: [],
  metadata: {
    programId,
    rpcUrl,
    migratedAt: new Date().toISOString()
  }
};

await writeFile(outputPath, JSON.stringify(idlBundle, null, 2));
console.log(`Wrote IDL bundle stub to ${outputPath}`);
