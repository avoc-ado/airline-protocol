import { runCommand } from "./lib/run.mjs";

// TODO: add debug harness for integration + e2e tests.
await runCommand({ command: "corepack yarn test:all" });
