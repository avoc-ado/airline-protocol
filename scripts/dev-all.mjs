import { formatPortEnv, resolvePorts } from "./lib/ports.mjs";
import { runPlaceholder } from "./placeholder.mjs";

const ports = await resolvePorts();

runPlaceholder({
  commandName: "dev:all",
  detail: "start localnet + migrate + start UI + watch shared packages",
  extraLines: ["Reserved ports (set env to override):", ...formatPortEnv(ports)]
});
