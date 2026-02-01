export interface AirlineReserveMetadata {
  address: string;
  mintAddress: string;
  name: string;
  oracleAddress: string;
}

export interface AirlinePythFeedMetadata {
  label: string;
  account: string;
  feedId: string;
}

export interface AirlineIdlMetadata {
  version: string;
  cluster: string;
  generatedAt: string;
  programId: string;
  reserves: AirlineReserveMetadata[];
  marketAddress?: string;
  openbookProgramId?: string;
  pythPushProgramId?: string;
  pythFeeds?: AirlinePythFeedMetadata[];
  seedStatus?: "seeded" | "stub";
}

export interface AirlineIdlBundle {
  idl: unknown;
  metadata: AirlineIdlMetadata;
}
