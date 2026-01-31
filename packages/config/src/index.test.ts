import { describe, expect, it } from "vitest";
import { AIRLINE_ENV } from "./index";

describe("config", () => {
  it("exposes env keys", () => {
    expect(AIRLINE_ENV).toEqual({
      agentId: "AIRLINE_AGENT_ID",
      rpcPort: "AIRLINE_RPC_PORT",
      wsPort: "AIRLINE_WS_PORT",
      webPort: "AIRLINE_WEB_PORT",
      testPortBase: "AIRLINE_TEST_PORT_BASE"
    });
  });
});
