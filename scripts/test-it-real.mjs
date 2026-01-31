import { runCommand } from "./lib/run.mjs";

await runCommand({ command: "corepack yarn test:all" });
