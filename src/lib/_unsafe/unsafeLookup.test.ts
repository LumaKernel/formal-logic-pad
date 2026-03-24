import { describe, it, expect } from "vitest";
import { unsafeMapGet, unsafeAssertDefined } from "./unsafeLookup";

describe("unsafeMapGet", () => {
  it("should return the value when key exists", () => {
    const map = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    expect(unsafeMapGet(map, "a")).toBe(1);
    expect(unsafeMapGet(map, "b")).toBe(2);
  });

  it("should throw when key does not exist", () => {
    const map = new Map([["a", 1]]);
    expect(() => unsafeMapGet(map, "missing")).toThrow(
      "unsafeMapGet: key not found: missing",
    );
  });

  it("should include context in error message", () => {
    const map = new Map<string, number>();
    expect(() => unsafeMapGet(map, "x", "test context")).toThrow(
      "unsafeMapGet: key not found: x (test context)",
    );
  });
});

describe("unsafeAssertDefined", () => {
  it("should return the value when defined", () => {
    expect(unsafeAssertDefined(42)).toBe(42);
    expect(unsafeAssertDefined("hello")).toBe("hello");
    expect(unsafeAssertDefined(0)).toBe(0);
    expect(unsafeAssertDefined("")).toBe("");
    expect(unsafeAssertDefined(false)).toBe(false);
  });

  it("should throw when value is undefined", () => {
    expect(() => unsafeAssertDefined(undefined)).toThrow(
      "unsafeAssertDefined: value is undefined",
    );
  });

  it("should throw when value is null", () => {
    expect(() => unsafeAssertDefined(null)).toThrow(
      "unsafeAssertDefined: value is null",
    );
  });

  it("should include context in error message", () => {
    expect(() => unsafeAssertDefined(undefined, "node lookup")).toThrow(
      "unsafeAssertDefined: value is undefined (node lookup)",
    );
  });
});
