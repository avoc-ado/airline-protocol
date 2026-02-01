import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rpcPort = process.env.AIRLINE_RPC_PORT ?? "8899";
const rpcUrl = process.env.AIRLINE_RPC_URL ?? `http://127.0.0.1:${rpcPort}`;
const outputPath =
  process.env.AIRLINE_IDL_PATH ?? path.join("apps", "web", "public", "idl", "airline.json");
const programId = process.env.AIRLINE_PROGRAM_ID ?? "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";
const openbookProgramId =
  process.env.AIRLINE_OPENBOOK_V2_PROGRAM_ID ?? "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb";
const pythPushProgramId =
  process.env.AIRLINE_PYTH_PUSH_PROGRAM_ID ?? "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ";
const marketAddress = process.env.AIRLINE_MARKET_ADDRESS;
const cluster = process.env.AIRLINE_CLUSTER ?? "localnet";

const pythFeeds = [
  {
    label: "SOL/USD",
    account: "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
    feedId: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
  },
  {
    label: "MSOL/USD",
    account: "5CKzb9j4ChgLUt8Gfm5CNGLN6khXKiqMbnGAW4cgXgxK",
    feedId: "c2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4"
  },
  {
    label: "USDC/USD",
    account: "Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX",
    feedId: "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
  }
];

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
// TODO: seed mints, markets, reserves, and market address once program instructions land.
await mkdir(path.dirname(outputPath), { recursive: true });

const metadata = {
  version: "v1",
  cluster,
  generatedAt: new Date().toISOString(),
  programId,
  reserves: [],
  openbookProgramId,
  pythPushProgramId,
  pythFeeds,
  seedStatus: "stub"
};

if (marketAddress) {
  metadata.marketAddress = marketAddress;
}

const idlBundle = {
  idl: {},
  metadata
};

await writeFile(outputPath, JSON.stringify(idlBundle, null, 2));
console.log(`Wrote IDL bundle stub to ${outputPath}`);
