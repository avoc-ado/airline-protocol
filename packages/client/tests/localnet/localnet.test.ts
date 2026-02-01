import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  OPENBOOK_V2_PROGRAM_ID,
  PYTH_PUSH_FEEDS,
  PYTH_PUSH_PROGRAM_ID,
  readMockPythPrice,
  waitForMockPythPrice,
  writeMockPythPrice
} from "@airline-protocol/test-utils";
import { loadIdlBundle, makeAirlineClient, makeRpcUrls } from "../../src/index";

const hasLocalnetEnv =
  Boolean(process.env.AIRLINE_RPC_URL) || Boolean(process.env.AIRLINE_RPC_PORT);

const parseNumber = ({ value, fallback }: { value: string | undefined; fallback: number }) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
};

const requestProgramAccount = async ({
  rpcUrl,
  programId,
  commitment = "confirmed"
}: {
  rpcUrl: string;
  programId: string;
  commitment?: "processed" | "confirmed" | "finalized";
}) => {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAccountInfo",
      params: [programId, { encoding: "base64", commitment }]
    })
  });

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(payload.error.message ?? "getAccountInfo failed");
  }

  return payload?.result?.value ?? null;
};

const withIdlServer = async ({
  idlPath,
  action
}: {
  idlPath: string;
  action: (idlUrl: string) => Promise<void>;
}) => {
  const idlPayload = await readFile(idlPath, "utf8");
  const server = createServer((_, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(idlPayload);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to start IDL server");
  }

  const idlUrl = `http://127.0.0.1:${address.port}/airline.json`;

  try {
    await action(idlUrl);
  } finally {
    server.close();
  }
};

const testFn = hasLocalnetEnv ? it : it.skip;

describe("airline client localnet", () => {
  testFn("loads the IDL bundle and verifies the program account", async () => {
    const rpcPort = parseNumber({ value: process.env.AIRLINE_RPC_PORT, fallback: 8899 });
    const wsPort = parseNumber({ value: process.env.AIRLINE_WS_PORT, fallback: rpcPort + 1 });
    const rpcUrl = process.env.AIRLINE_RPC_URL ?? `http://127.0.0.1:${rpcPort}`;
    const programId =
      process.env.AIRLINE_PROGRAM_ID ?? "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";
    const openbookProgramId = process.env.AIRLINE_OPENBOOK_V2_PROGRAM_ID ?? OPENBOOK_V2_PROGRAM_ID;
    const pythPushProgramId = process.env.AIRLINE_PYTH_PUSH_PROGRAM_ID ?? PYTH_PUSH_PROGRAM_ID;
    const idlPath = process.env.AIRLINE_IDL_PATH ?? "apps/web/public/idl/airline.json";

    await withIdlServer({
      idlPath,
      action: async (idlUrl) => {
        const idl = await loadIdlBundle({ url: idlUrl });
        const { rpcUrl: resolvedRpcUrl, wsUrl } = makeRpcUrls({ rpcPort, wsPort });
        const client = makeAirlineClient({ idl, rpcUrl: resolvedRpcUrl, wsUrl });

        expect(client.idl.metadata.programId).toBe(programId);
        expect(client.rpcUrl).toBe(`http://127.0.0.1:${rpcPort}`);
        expect(client.wsUrl).toBe(`ws://127.0.0.1:${wsPort}`);

        const programAccount = await requestProgramAccount({ rpcUrl, programId });
        expect(programAccount).not.toBeNull();
        expect(programAccount?.executable).toBe(true);

        const openbookAccount = await requestProgramAccount({
          rpcUrl,
          programId: openbookProgramId
        });
        expect(openbookAccount).not.toBeNull();
        expect(openbookAccount?.executable).toBe(true);

        await Promise.all(
          PYTH_PUSH_FEEDS.map(async (feed) => {
            const feedAccount = await requestProgramAccount({ rpcUrl, programId: feed.account });
            expect(feedAccount).not.toBeNull();
            expect(feedAccount?.owner).toBe(pythPushProgramId);
            expect(feedAccount?.executable).toBe(false);
          })
        );

        const feed = PYTH_PUSH_FEEDS[0];
        const beforePrice = await readMockPythPrice({ rpcUrl, account: feed.account });
        const nextPrice = beforePrice + BigInt(1000);

        await writeMockPythPrice({
          rpcUrl,
          account: feed.account,
          price: nextPrice
        });

        const afterPrice = await waitForMockPythPrice({
          rpcUrl,
          account: feed.account,
          expected: nextPrice,
          timeoutMs: 5_000
        });
        expect(afterPrice).toBe(nextPrice);
      }
    });
  });
});
