import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeTestContext,
  PRICE_FEED_MESSAGE_PRICE_OFFSET,
  PRICE_FEED_MESSAGE_PRICE_SIZE,
  PRICE_UPDATE_V2_SIZE,
  readMockPythPrice,
  waitForMockPythPrice,
  writeMockPythPrice
} from "./index";

declare global {
  var __TEST_PYTH_PRICE: bigint | undefined;
  var __TEST_PYTH_ACCOUNT_MISSING: boolean | undefined;
  var __TEST_PYTH_DATA_LENGTH: number | undefined;
}

vi.mock("@solana/web3.js", () => {
  const requestAirdrop = vi.fn(async () => "airdrop");
  const confirmTransaction = vi.fn(async () => undefined);
  const getAccountInfo = vi.fn(async () => {
    if (globalThis.__TEST_PYTH_ACCOUNT_MISSING) {
      return null;
    }

    const length = globalThis.__TEST_PYTH_DATA_LENGTH ?? PRICE_UPDATE_V2_SIZE;
    const buffer = Buffer.alloc(length);
    const endOffset = PRICE_FEED_MESSAGE_PRICE_OFFSET + PRICE_FEED_MESSAGE_PRICE_SIZE;
    if (length >= endOffset) {
      buffer.writeBigInt64LE(globalThis.__TEST_PYTH_PRICE ?? 0n, PRICE_FEED_MESSAGE_PRICE_OFFSET);
    }
    return { data: buffer };
  });

  class Connection {
    constructor(_rpcUrl: string, _commitment?: string) {
      this.requestAirdrop = requestAirdrop;
      this.confirmTransaction = confirmTransaction;
      this.getAccountInfo = getAccountInfo;
    }

    requestAirdrop: (pubkey: unknown, amount: number) => Promise<string>;
    confirmTransaction: (signature: string, commitment?: string) => Promise<void>;
    getAccountInfo: (pubkey: unknown, commitment?: string) => Promise<{ data: Buffer } | null>;
  }

  class PublicKey {
    constructor(private value: string) {}

    toBase58(): string {
      return this.value;
    }
  }

  class TransactionInstruction {
    constructor(public config: { data: Buffer }) {}
  }

  class Transaction {
    instructions: TransactionInstruction[] = [];

    add(instruction: TransactionInstruction): this {
      this.instructions.push(instruction);
      return this;
    }
  }

  const sendAndConfirmTransaction = vi.fn(
    async (_connection: Connection, transaction: Transaction) => {
      const instruction = transaction.instructions[0];
      const data = instruction?.config.data;
      if (!data) {
        return "signature";
      }

      const length = data.readUInt32LE(16);
      const bytes = data.subarray(20, 20 + length);
      if (bytes.length >= 8) {
        globalThis.__TEST_PYTH_PRICE = bytes.readBigInt64LE(0);
      }

      return "signature";
    }
  );

  class Keypair {
    static generate(): { publicKey: PublicKey } {
      return { publicKey: new PublicKey("payer") };
    }
  }

  return {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL: 1_000_000_000,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
  };
});

describe("test utils", () => {
  beforeEach(() => {
    globalThis.__TEST_PYTH_PRICE = 0n;
    globalThis.__TEST_PYTH_ACCOUNT_MISSING = false;
    globalThis.__TEST_PYTH_DATA_LENGTH = undefined;
  });

  it("creates context", () => {
    const context = makeTestContext({ label: "localnet" });

    expect(context).toEqual({ label: "localnet" });
  });

  it("reads and writes mock Pyth prices", async () => {
    globalThis.__TEST_PYTH_PRICE = 5n;

    const before = await readMockPythPrice({
      rpcUrl: "http://localhost:8899",
      account: "price-account"
    });
    expect(before).toBe(5n);

    await writeMockPythPrice({
      rpcUrl: "http://localhost:8899",
      account: "price-account",
      price: 9n
    });

    const after = await readMockPythPrice({
      rpcUrl: "http://localhost:8899",
      account: "price-account"
    });
    expect(after).toBe(9n);
  });

  it("waits for mock Pyth price updates", async () => {
    globalThis.__TEST_PYTH_PRICE = 1n;

    setTimeout(() => {
      globalThis.__TEST_PYTH_PRICE = 2n;
    }, 50);

    const price = await waitForMockPythPrice({
      rpcUrl: "http://localhost:8899",
      account: "price-account",
      expected: 2n,
      timeoutMs: 2_000
    });

    expect(price).toBe(2n);
  });

  it("throws when the mock account is missing", async () => {
    globalThis.__TEST_PYTH_ACCOUNT_MISSING = true;

    await expect(
      readMockPythPrice({
        rpcUrl: "http://localhost:8899",
        account: "price-account"
      })
    ).rejects.toThrow("Mock price account not found");
  });

  it("throws when mock account data is too small", async () => {
    globalThis.__TEST_PYTH_DATA_LENGTH =
      PRICE_FEED_MESSAGE_PRICE_OFFSET + PRICE_FEED_MESSAGE_PRICE_SIZE - 1;

    await expect(
      readMockPythPrice({
        rpcUrl: "http://localhost:8899",
        account: "price-account"
      })
    ).rejects.toThrow("Mock price account data too small");
  });

  it("returns the latest value when wait times out", async () => {
    globalThis.__TEST_PYTH_PRICE = 3n;

    const price = await waitForMockPythPrice({
      rpcUrl: "http://localhost:8899",
      account: "price-account",
      expected: 4n,
      timeoutMs: 0
    });

    expect(price).toBe(3n);
  });
});
