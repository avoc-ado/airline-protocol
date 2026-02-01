const AIRLINE_ENV = {
  agentId: "AIRLINE_AGENT_ID",
  rpcPort: "AIRLINE_RPC_PORT",
  wsPort: "AIRLINE_WS_PORT",
  webPort: "AIRLINE_WEB_PORT",
  testPortBase: "AIRLINE_TEST_PORT_BASE",
  rpcUrl: "AIRLINE_RPC_URL",
  wsUrl: "AIRLINE_WS_URL",
  programId: "AIRLINE_PROGRAM_ID",
  marketAddress: "AIRLINE_MARKET_ADDRESS",
  idlPath: "AIRLINE_IDL_PATH",
  cluster: "AIRLINE_CLUSTER",
  openbookProgramId: "AIRLINE_OPENBOOK_V2_PROGRAM_ID",
  pythPushProgramId: "AIRLINE_PYTH_PUSH_PROGRAM_ID",
  pythAccountDir: "AIRLINE_PYTH_ACCOUNT_DIR",
  ledgerDir: "AIRLINE_LEDGER_DIR",
  ledgerBaseDir: "AIRLINE_LEDGER_BASE_DIR",
  keepLedger: "AIRLINE_KEEP_LEDGER",
  tmpDir: "AIRLINE_TMP_DIR",
  validatorBin: "AIRLINE_TEST_VALIDATOR_BIN",
  validatorQuiet: "AIRLINE_TEST_VALIDATOR_QUIET"
} satisfies Record<string, string>;

export { AIRLINE_ENV };
