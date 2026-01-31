import type { AirlineIdlBundle } from "@airline-protocol/idl";

export interface AirlineClientConfig {
  idl: AirlineIdlBundle;
  rpcUrl: string;
  wsUrl?: string;
}

export interface AirlineClient {
  idl: AirlineIdlBundle;
  rpcUrl: string;
  wsUrl?: string;
}

export const makeAirlineClient = ({ idl, rpcUrl, wsUrl }: AirlineClientConfig): AirlineClient => ({
  idl,
  rpcUrl,
  wsUrl
});

export const makeRpcUrls = ({
  rpcPort,
  wsPort
}: {
  rpcPort: number;
  wsPort: number;
}): { rpcUrl: string; wsUrl: string } => ({
  rpcUrl: `http://127.0.0.1:${rpcPort}`,
  wsUrl: `ws://127.0.0.1:${wsPort}`
});

export const loadIdlBundle = async ({ url }: { url: string }): Promise<AirlineIdlBundle> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load IDL bundle from ${url}`);
  }

  return (await response.json()) as AirlineIdlBundle;
};
