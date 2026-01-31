import { runCommands } from "./lib/run.mjs";

await runCommands({
  commands: [
    "corepack yarn tsc -p apps/web/tsconfig.json",
    "corepack yarn tsc -p packages/client/tsconfig.json",
    "corepack yarn tsc -p packages/config/tsconfig.json",
    "corepack yarn tsc -p packages/idl/tsconfig.json",
    "corepack yarn tsc -p packages/test-utils/tsconfig.json",
    "corepack yarn tsc -p packages/cli/tsconfig.json"
  ]
});
