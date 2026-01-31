import { runCommands } from "./lib/run.mjs";

await runCommands({
  commands: [
    "corepack yarn format",
    "corepack yarn lint",
    "corepack yarn typecheck",
    "corepack yarn test:unit",
    "corepack yarn test:integration",
    "corepack yarn test:e2e"
  ]
});
