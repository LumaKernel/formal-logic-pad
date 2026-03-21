/**
 * Either ユーティリティブリッジのテスト。
 *
 * createEitherBridges() が返す NativeFunctionBridge[] の動作を検証する。
 */
import { describe, it, expect } from "vitest";
import { createEitherBridges } from "./eitherBridge";

const bridgeMap = new Map(
  createEitherBridges().map((b) => [b.name, b.fn] as const),
);

const call = (name: string, ...args: readonly unknown[]): unknown => {
  const fn = bridgeMap.get(name);
  if (!fn) throw new Error(`Bridge not found: ${name satisfies string}`);
  return fn(...args);
};

describe("eitherBridge", () => {
  describe("createRight", () => {
    it("Right オブジェクトを生成する", () => {
      const result = call("createRight", 42);
      expect(result).toEqual({ _tag: "Right", right: 42 });
    });

    it("null を包める", () => {
      const result = call("createRight", null);
      expect(result).toEqual({ _tag: "Right", right: null });
    });

    it("オブジェクトを包める", () => {
      const value = { name: "test" };
      const result = call("createRight", value);
      expect(result).toEqual({ _tag: "Right", right: value });
    });
  });

  describe("createLeft", () => {
    it("Left オブジェクトを生成する", () => {
      const result = call("createLeft", "error message");
      expect(result).toEqual({ _tag: "Left", left: "error message" });
    });

    it("オブジェクトを包める", () => {
      const error = { _tag: "ParseError", message: "bad input" };
      const result = call("createLeft", error);
      expect(result).toEqual({ _tag: "Left", left: error });
    });
  });

  describe("isRight", () => {
    it("Right に対して true を返す", () => {
      const right = call("createRight", 1);
      expect(call("isRight", right)).toBe(true);
    });

    it("Left に対して false を返す", () => {
      const left = call("createLeft", "err");
      expect(call("isRight", left)).toBe(false);
    });

    it("null に対して false を返す", () => {
      expect(call("isRight", null)).toBe(false);
    });

    it("undefined に対して false を返す", () => {
      expect(call("isRight", undefined)).toBe(false);
    });

    it("プレーンオブジェクトに対して false を返す", () => {
      expect(call("isRight", { value: 1 })).toBe(false);
    });
  });

  describe("isLeft", () => {
    it("Left に対して true を返す", () => {
      const left = call("createLeft", "err");
      expect(call("isLeft", left)).toBe(true);
    });

    it("Right に対して false を返す", () => {
      const right = call("createRight", 1);
      expect(call("isLeft", right)).toBe(false);
    });

    it("null に対して false を返す", () => {
      expect(call("isLeft", null)).toBe(false);
    });
  });

  describe("getOrThrow", () => {
    it("Right から値を取り出す", () => {
      const right = call("createRight", "hello");
      expect(call("getOrThrow", right)).toBe("hello");
    });

    it("Left に対して例外をスローする", () => {
      const left = call("createLeft", "err");
      expect(() => call("getOrThrow", left)).toThrow(
        "getOrThrow: Either is Left, not Right",
      );
    });

    it("null に対して例外をスローする", () => {
      expect(() => call("getOrThrow", null)).toThrow(
        "getOrThrow: argument is not an Either",
      );
    });
  });

  describe("getLeftOrThrow", () => {
    it("Left から値を取り出す", () => {
      const left = call("createLeft", "err");
      expect(call("getLeftOrThrow", left)).toBe("err");
    });

    it("Right に対して例外をスローする", () => {
      const right = call("createRight", 1);
      expect(() => call("getLeftOrThrow", right)).toThrow(
        "getLeftOrThrow: Either is Right, not Left",
      );
    });

    it("null に対して例外をスローする", () => {
      expect(() => call("getLeftOrThrow", null)).toThrow(
        "getLeftOrThrow: argument is not an Either",
      );
    });
  });

  describe("getOrElse", () => {
    it("Right から値を取り出す", () => {
      const right = call("createRight", 42);
      expect(call("getOrElse", right, 0)).toBe(42);
    });

    it("Left の場合デフォルト値を返す", () => {
      const left = call("createLeft", "err");
      expect(call("getOrElse", left, 0)).toBe(0);
    });

    it("null の場合デフォルト値を返す", () => {
      expect(call("getOrElse", null, "default")).toBe("default");
    });

    it("undefined の場合デフォルト値を返す", () => {
      expect(call("getOrElse", undefined, "default")).toBe("default");
    });
  });
});
