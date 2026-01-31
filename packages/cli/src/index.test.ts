import { describe, expect, it } from "vitest";
import { runCli } from "./index";

describe("cli", () => {
  it("runs without throwing", () => {
    expect(() => runCli({ args: ["--help"] })).not.toThrow();
  });
});
