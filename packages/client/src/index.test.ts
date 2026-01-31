import { createServer } from "node:http";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { loadIdlBundle, makeAirlineClient, makeRpcUrls } from "./index";

const makeServer = async ({ response, status = 200 }: { response: unknown; status?: number }) => {
  const server = createServer((_req, res) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
};

describe("airline client", () => {
  it("builds rpc urls", () => {
    const urls = makeRpcUrls({ rpcPort: 8899, wsPort: 8900 });

    expect(urls).toEqual({
      rpcUrl: "http://127.0.0.1:8899",
      wsUrl: "ws://127.0.0.1:8900"
    });
  });

  it("creates client config", () => {
    const idl = {
      idl: { name: "airline" },
      metadata: {
        cluster: "localnet",
        generatedAt: "2026-01-31",
        marketAddress: "market",
        programId: "program",
        reserves: []
      }
    };

    const client = makeAirlineClient({
      idl,
      rpcUrl: "http://127.0.0.1:8899",
      wsUrl: "ws://127.0.0.1:8900"
    });

    expect(client).toEqual({
      idl,
      rpcUrl: "http://127.0.0.1:8899",
      wsUrl: "ws://127.0.0.1:8900"
    });
  });

  it("loads idl bundle", async () => {
    const payload = {
      idl: { name: "airline" },
      metadata: {
        cluster: "localnet",
        generatedAt: "2026-01-31",
        marketAddress: "market",
        programId: "program",
        reserves: []
      }
    };

    const server = await makeServer({ response: payload });

    try {
      const result = await loadIdlBundle({ url: server.url });
      expect(result).toEqual(payload);
    } finally {
      await server.close();
    }
  });

  it("throws on failed idl load", async () => {
    const server = await makeServer({ response: { error: "bad" }, status: 500 });

    try {
      await expect(loadIdlBundle({ url: server.url })).rejects.toThrow("Failed to load IDL bundle");
    } finally {
      await server.close();
    }
  });
});
