import { describe, expect, it } from "vitest";
import { makeLocalnetClient } from "../../src/lib/airline-client";

describe("makeLocalnetClient", () => {
  it("builds rpc urls and loads the idl bundle", async () => {
    const idl = {
      idl: {
        version: "0.1.0",
        name: "airline",
        instructions: []
      },
      metadata: {
        cluster: "localnet",
        generatedAt: "2026-02-01T00:00:00Z",
        marketAddress: "market",
        programId: "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK",
        reserves: []
      }
    };

    const originalFetch = globalThis.fetch;
    (globalThis as { fetch?: typeof fetch }).fetch = async () =>
      new Response(JSON.stringify(idl), {
        status: 200,
        headers: { "content-type": "application/json" }
      });

    try {
      const client = await makeLocalnetClient({
        idlUrl: "http://127.0.0.1:9999/idl.json",
        rpcPort: 9999,
        wsPort: 9998
      });

      expect(client.rpcUrl).toBe("http://127.0.0.1:9999");
      expect(client.wsUrl).toBe("ws://127.0.0.1:9998");
      expect(client.idl.metadata.programId).toBe(idl.metadata.programId);
      expect(client.idl.metadata.cluster).toBe("localnet");
    } finally {
      (globalThis as { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });
});
