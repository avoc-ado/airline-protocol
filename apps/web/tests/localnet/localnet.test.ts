import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { makeLocalnetClient } from "../../src/lib/airline-client";

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

const requestHealth = async ({ rpcUrl }: { rpcUrl: string }) => {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" })
  });

  const payload = await response.json();
  return payload?.result ?? payload?.error?.message ?? "unknown";
};

const requestProgramAccount = async ({
  rpcUrl,
  programId
}: {
  rpcUrl: string;
  programId: string;
}) => {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAccountInfo",
      params: [programId, { encoding: "base64" }]
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

describe("localnet web client", () => {
  it("connects to localnet and loads the IDL bundle", async () => {
    const rpcPort = parseNumber({ value: process.env.AIRLINE_RPC_PORT, fallback: 8899 });
    const wsPort = parseNumber({ value: process.env.AIRLINE_WS_PORT, fallback: rpcPort + 1 });
    const rpcUrl = process.env.AIRLINE_RPC_URL ?? `http://127.0.0.1:${rpcPort}`;
    const programId =
      process.env.AIRLINE_PROGRAM_ID ?? "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";
    const idlPath = process.env.AIRLINE_IDL_PATH ?? "apps/web/public/idl/airline.json";

    await withIdlServer({
      idlPath,
      action: async (idlUrl) => {
        const client = await makeLocalnetClient({
          idlUrl,
          rpcPort,
          wsPort
        });

        expect(client.idl.metadata?.programId).toBe(programId);
        expect(client.rpcUrl).toBe(`http://127.0.0.1:${rpcPort}`);
        expect(client.wsUrl).toBe(`ws://127.0.0.1:${wsPort}`);

        const health = await requestHealth({ rpcUrl });
        expect(health).toBe("ok");

        const programAccount = await requestProgramAccount({ rpcUrl, programId });
        expect(programAccount).not.toBeNull();
        expect(programAccount?.executable).toBe(true);
      }
    });
  });
});
