import { describe, expect, it } from "vitest";
import {
  OPENBOOK_V2_PROGRAM_ID,
  PYTH_PUSH_FEEDS,
  PYTH_PUSH_PROGRAM_ID
} from "@airline-protocol/test-utils";

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

const testFn = hasLocalnetEnv ? it : it.skip;

describe("cli localnet", () => {
  testFn("verifies the program account is executable", async () => {
    const rpcPort = parseNumber({ value: process.env.AIRLINE_RPC_PORT, fallback: 8899 });
    const rpcUrl = process.env.AIRLINE_RPC_URL ?? `http://127.0.0.1:${rpcPort}`;
    const programId =
      process.env.AIRLINE_PROGRAM_ID ?? "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";
    const openbookProgramId = process.env.AIRLINE_OPENBOOK_V2_PROGRAM_ID ?? OPENBOOK_V2_PROGRAM_ID;
    const pythPushProgramId = process.env.AIRLINE_PYTH_PUSH_PROGRAM_ID ?? PYTH_PUSH_PROGRAM_ID;

    const programAccount = await requestProgramAccount({ rpcUrl, programId });
    expect(programAccount).not.toBeNull();
    expect(programAccount?.executable).toBe(true);

    const openbookAccount = await requestProgramAccount({ rpcUrl, programId: openbookProgramId });
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
  });
});
