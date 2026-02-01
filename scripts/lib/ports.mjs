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

const parseAgentId = () => {
  const agentId = parseNumericEnv({ name: "AIRLINE_AGENT_ID" });
  if (agentId === null) {
    return 0;
  }

  return agentId;
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

const resolvePreferredPorts = () => {
  const explicitRpcPort = parseNumericEnv({ name: "AIRLINE_RPC_PORT" });
  const explicitWsPort = parseNumericEnv({ name: "AIRLINE_WS_PORT" });
  const explicitWebPort = parseNumericEnv({ name: "AIRLINE_WEB_PORT" });
  const explicitTestPortBase = parseNumericEnv({ name: "AIRLINE_TEST_PORT_BASE" });

  if (explicitTestPortBase === null) {
    return {
      rpcPort: explicitRpcPort,
      wsPort: explicitWsPort,
      webPort: explicitWebPort,
      testPortBase: explicitTestPortBase
    };
  }

  const portStride = 20;
  const offset = parseAgentId() * portStride;
  const blockBase = explicitTestPortBase + offset;

  return {
    rpcPort: explicitRpcPort ?? blockBase,
    wsPort: explicitWsPort ?? blockBase + 1,
    webPort: explicitWebPort ?? blockBase + 2,
    testPortBase: blockBase + 10
  };
};

const resolvePorts = async () => {
  const preferred = resolvePreferredPorts();
  const rpcPort = await getOpenPort({
    preferredPort: preferred.rpcPort
  });
  const wsPort = await getOpenPort({
    preferredPort: preferred.wsPort
  });
  const webPort = await getOpenPort({
    preferredPort: preferred.webPort
  });
  const testPortBase = await getOpenPort({
    preferredPort: preferred.testPortBase
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
