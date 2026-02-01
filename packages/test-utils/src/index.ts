import { createHash } from "node:crypto";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction
} from "@solana/web3.js";

export interface PythPushFeed {
  label: string;
  account: string;
  feedId: string;
}

export const PRICE_UPDATE_V2_DISCRIMINATOR_SIZE = 8;
export const PRICE_UPDATE_V2_WRITE_AUTHORITY_SIZE = 32;
export const PRICE_UPDATE_V2_VERIFICATION_LEVEL_SIZE = 2;
export const PRICE_FEED_MESSAGE_FEED_ID_SIZE = 32;
export const PRICE_FEED_MESSAGE_PRICE_SIZE = 8;
export const PRICE_FEED_MESSAGE_PRICE_OFFSET =
  PRICE_UPDATE_V2_DISCRIMINATOR_SIZE +
  PRICE_UPDATE_V2_WRITE_AUTHORITY_SIZE +
  PRICE_UPDATE_V2_VERIFICATION_LEVEL_SIZE +
  PRICE_FEED_MESSAGE_FEED_ID_SIZE;
export const PRICE_FEED_MESSAGE_SIZE = PRICE_FEED_MESSAGE_FEED_ID_SIZE + 8 + 8 + 4 + 8 + 8 + 8 + 8;
export const PRICE_UPDATE_V2_SIZE =
  PRICE_UPDATE_V2_DISCRIMINATOR_SIZE +
  PRICE_UPDATE_V2_WRITE_AUTHORITY_SIZE +
  PRICE_UPDATE_V2_VERIFICATION_LEVEL_SIZE +
  PRICE_FEED_MESSAGE_SIZE +
  8;

export const OPENBOOK_V2_PROGRAM_ID = "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb";
export const PYTH_PUSH_PROGRAM_ID = "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ";
export const PYTH_PUSH_FEEDS: readonly PythPushFeed[] = [
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

export interface PythMockPriceReadParams {
  rpcUrl: string;
  account: string;
  commitment?: "processed" | "confirmed" | "finalized";
}

export interface PythMockPriceWriteParams {
  rpcUrl: string;
  account: string;
  price: bigint;
  programId?: string;
}

export interface PythMockPriceWaitParams {
  rpcUrl: string;
  account: string;
  expected: bigint;
  timeoutMs: number;
  commitment?: "processed" | "confirmed" | "finalized";
}

const makeAnchorDiscriminator = ({ name }: { name: string }): Buffer =>
  createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);

const makeWriteInstructionData = ({ offset, bytes }: { offset: bigint; bytes: Buffer }): Buffer => {
  const discriminator = makeAnchorDiscriminator({ name: "write" });
  const offsetBytes = Buffer.alloc(8);
  offsetBytes.writeBigUInt64LE(offset);
  const lengthBytes = Buffer.alloc(4);
  lengthBytes.writeUInt32LE(bytes.length);

  return Buffer.concat([discriminator, offsetBytes, lengthBytes, bytes]);
};

const readMockPrice = ({ data }: { data: Buffer }): bigint => {
  const endOffset = PRICE_FEED_MESSAGE_PRICE_OFFSET + PRICE_FEED_MESSAGE_PRICE_SIZE;
  if (data.length < endOffset) {
    throw new Error("Mock price account data too small");
  }

  return data.readBigInt64LE(PRICE_FEED_MESSAGE_PRICE_OFFSET);
};

export const readMockPythPrice = async ({
  rpcUrl,
  account,
  commitment = "confirmed"
}: PythMockPriceReadParams): Promise<bigint> => {
  const connection = new Connection(rpcUrl, commitment);
  const accountInfo = await connection.getAccountInfo(new PublicKey(account), commitment);

  if (!accountInfo) {
    throw new Error("Mock price account not found");
  }

  return readMockPrice({ data: accountInfo.data });
};

export const writeMockPythPrice = async ({
  rpcUrl,
  account,
  price,
  programId = PYTH_PUSH_PROGRAM_ID
}: PythMockPriceWriteParams): Promise<void> => {
  const connection = new Connection(rpcUrl, "confirmed");
  const payer = Keypair.generate();
  const airdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSignature, "confirmed");

  const priceBytes = Buffer.alloc(8);
  priceBytes.writeBigInt64LE(price);

  const instruction = new TransactionInstruction({
    programId: new PublicKey(programId),
    keys: [{ pubkey: new PublicKey(account), isSigner: false, isWritable: true }],
    data: makeWriteInstructionData({
      offset: BigInt(PRICE_FEED_MESSAGE_PRICE_OFFSET),
      bytes: priceBytes
    })
  });

  const transaction = new Transaction().add(instruction);
  await sendAndConfirmTransaction(connection, transaction, [payer], { commitment: "confirmed" });
};

export const waitForMockPythPrice = async ({
  rpcUrl,
  account,
  expected,
  timeoutMs,
  commitment = "confirmed"
}: PythMockPriceWaitParams): Promise<bigint> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const price = await readMockPythPrice({ rpcUrl, account, commitment });
    if (price === expected) {
      return price;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return readMockPythPrice({ rpcUrl, account, commitment });
};

export const makeTestContext = ({ label }: { label: string }): { label: string } => ({ label });
