import { runCommand } from "./lib/run.mjs";

await runCommand({ command: "cargo test -p airline" });
