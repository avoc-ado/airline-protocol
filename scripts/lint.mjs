import { runCommand } from "./lib/run.mjs";

await runCommand({ command: "corepack yarn workspace @airline-protocol/web lint" });
