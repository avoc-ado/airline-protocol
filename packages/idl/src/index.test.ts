import { describe, expect, it } from "vitest";
import { IDL_METADATA_VERSION } from "./index";

describe("idl", () => {
  it("pins metadata version", () => {
    expect(IDL_METADATA_VERSION).toBe("v1");
  });
});
