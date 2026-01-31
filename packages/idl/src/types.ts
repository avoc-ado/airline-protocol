export interface AirlineReserveMetadata {
  address: string;
  mintAddress: string;
  name: string;
  oracleAddress: string;
}

export interface AirlineIdlMetadata {
  cluster: string;
  generatedAt: string;
  marketAddress: string;
  programId: string;
  reserves: AirlineReserveMetadata[];
}

export interface AirlineIdlBundle {
  idl: unknown;
  metadata: AirlineIdlMetadata;
}
