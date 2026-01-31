import { loadIdlBundle, makeAirlineClient, makeRpcUrls } from "@airline-protocol/client";

export interface LocalnetClientParams {
  idlUrl: string;
  rpcPort: number;
  wsPort: number;
}

export const makeLocalnetClient = async ({ idlUrl, rpcPort, wsPort }: LocalnetClientParams) => {
  const { rpcUrl, wsUrl } = makeRpcUrls({ rpcPort, wsPort });
  const idl = await loadIdlBundle({ url: idlUrl });

  return makeAirlineClient({ idl, rpcUrl, wsUrl });
};
