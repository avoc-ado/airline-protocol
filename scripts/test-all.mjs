import { runCommands } from "./lib/run.mjs";

await runCommands({
  commands: ["corepack yarn test:unit", "corepack yarn test:integration", "corepack yarn test:e2e"]
});
