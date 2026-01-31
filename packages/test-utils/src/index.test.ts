import { describe, expect, it } from "vitest";
import { makeTestContext } from "./index";

describe("test utils", () => {
  it("creates context", () => {
    const context = makeTestContext({ label: "localnet" });

    expect(context).toEqual({ label: "localnet" });
  });
});
