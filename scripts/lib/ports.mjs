import net from "node:net";

const parseNumericEnv = ({ name }) => {
  const value = process.env[name];
  if (!value) {
    return null;
  }

  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }

  return numeric;
};

const probePort = ({ port }) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      server.close(() => reject(error));
    });

    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : port;

      server.close(() => resolve(resolvedPort));
    });
  });

const getEphemeralPort = async () => probePort({ port: 0 });

const getOpenPort = async ({ preferredPort }) => {
  if (preferredPort === null) {
    return getEphemeralPort();
  }

  try {
    return await probePort({ port: preferredPort });
  } catch (error) {
    throw new Error(`Port ${preferredPort} unavailable: ${error.message}`);
  }
};

const resolvePorts = async () => {
  const rpcPort = await getOpenPort({
    preferredPort: parseNumericEnv({ name: "AIRLINE_RPC_PORT" })
  });
  const wsPort = await getOpenPort({
    preferredPort: parseNumericEnv({ name: "AIRLINE_WS_PORT" })
  });
  const webPort = await getOpenPort({
    preferredPort: parseNumericEnv({ name: "AIRLINE_WEB_PORT" })
  });
  const testPortBase = await getOpenPort({
    preferredPort: parseNumericEnv({ name: "AIRLINE_TEST_PORT_BASE" })
  });

  return {
    rpcPort,
    wsPort,
    webPort,
    testPortBase
  };
};

const formatPortEnv = ({ rpcPort, wsPort, webPort, testPortBase }) => [
  `AIRLINE_RPC_PORT=${rpcPort}`,
  `AIRLINE_WS_PORT=${wsPort}`,
  `AIRLINE_WEB_PORT=${webPort}`,
  `AIRLINE_TEST_PORT_BASE=${testPortBase}`
];

export { formatPortEnv, resolvePorts };
