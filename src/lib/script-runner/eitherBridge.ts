/**
 * Either ユーティリティ API のサンドボックスブリッジ。
 *
 * Effect.ts の Either パターンをスクリプトサンドボックス内で利用できるように
 * JSON 互換の EitherJson 型とヘルパー関数を提供する。
 *
 * 変更時は eitherBridge.test.ts, index.ts, builtin-api.d.ts も同期すること。
 */

import type { NativeFunctionBridge } from "./scriptRunner";
import type { ProofBridgeApiDef } from "./proofBridge";

// ── ブリッジ関数の実装 ─────────────────────────────────────────

/**
 * 成功値を Right に包む。
 */
const createRightFn = (value: unknown): unknown => ({
  _tag: "Right",
  right: value,
});

/**
 * エラー値を Left に包む。
 */
const createLeftFn = (error: unknown): unknown => ({
  _tag: "Left",
  left: error,
});

/**
 * Either が Right かどうか判定する。
 */
const isRightFn = (either: unknown): unknown => {
  if (either === null || either === undefined || typeof either !== "object") {
    return false;
  }
  return (either as Record<string, unknown>)["_tag"] === "Right";
};

/**
 * Either が Left かどうか判定する。
 */
const isLeftFn = (either: unknown): unknown => {
  if (either === null || either === undefined || typeof either !== "object") {
    return false;
  }
  return (either as Record<string, unknown>)["_tag"] === "Left";
};

/**
 * Right の値を取り出す。Right でない場合は例外をスロー。
 */
const getOrThrowFn = (either: unknown): unknown => {
  if (either === null || either === undefined || typeof either !== "object") {
    throw new Error("getOrThrow: argument is not an Either");
  }
  const obj = either as Record<string, unknown>;
  if (obj["_tag"] !== "Right") {
    throw new Error("getOrThrow: Either is Left, not Right");
  }
  return obj["right"];
};

/**
 * Left の値を取り出す。Left でない場合は例外をスロー。
 */
const getLeftOrThrowFn = (either: unknown): unknown => {
  if (either === null || either === undefined || typeof either !== "object") {
    throw new Error("getLeftOrThrow: argument is not an Either");
  }
  const obj = either as Record<string, unknown>;
  if (obj["_tag"] !== "Left") {
    throw new Error("getLeftOrThrow: Either is Right, not Left");
  }
  return obj["left"];
};

/**
 * Right の値にデフォルト値を適用する。Left の場合はデフォルト値を返す。
 */
const getOrElseFn = (either: unknown, defaultValue: unknown): unknown => {
  if (either === null || either === undefined || typeof either !== "object") {
    return defaultValue;
  }
  const obj = either as Record<string, unknown>;
  if (obj["_tag"] === "Right") {
    return obj["right"];
  }
  return defaultValue;
};

// ── ブリッジ生成 ──────────────────────────────────────────────

/**
 * Either ユーティリティ API の NativeFunctionBridge 配列を生成する。
 *
 * サンドボックス内で以下の関数が利用可能になる:
 * - createRight(value) → EitherJson (Right)
 * - createLeft(error) → EitherJson (Left)
 * - isRight(either) → boolean
 * - isLeft(either) → boolean
 * - getOrThrow(either) → value
 * - getLeftOrThrow(either) → error
 * - getOrElse(either, defaultValue) → value
 */
export const createEitherBridges = (): readonly NativeFunctionBridge[] => [
  { name: "createRight", fn: createRightFn },
  { name: "createLeft", fn: createLeftFn },
  { name: "isRight", fn: isRightFn },
  { name: "isLeft", fn: isLeftFn },
  { name: "getOrThrow", fn: getOrThrowFn },
  { name: "getLeftOrThrow", fn: getLeftOrThrowFn },
  { name: "getOrElse", fn: getOrElseFn },
];

// ── API 定義（Monaco Editor 補完用）──────────────────────────

/**
 * ブリッジ関数の API 定義一覧。
 * builtin-api.d.ts との同期確認テストで使用する。
 */
export const EITHER_BRIDGE_API_DEFS: readonly ProofBridgeApiDef[] = [
  {
    name: "createRight",
    signature: "<T>(value: T) => EitherJson<T, never>",
    description: "成功値を Right に包む。",
  },
  {
    name: "createLeft",
    signature: "<E>(error: E) => EitherJson<never, E>",
    description: "エラー値を Left に包む。",
  },
  {
    name: "isRight",
    signature:
      "<T, E>(either: EitherJson<T, E>) => either is EitherRightJson<T>",
    description: "Either が Right かどうか判定する。",
  },
  {
    name: "isLeft",
    signature:
      "<T, E>(either: EitherJson<T, E>) => either is EitherLeftJson<E>",
    description: "Either が Left かどうか判定する。",
  },
  {
    name: "getOrThrow",
    signature: "<T, E>(either: EitherJson<T, E>) => T",
    description: "Right の値を取り出す。Left の場合は例外をスロー。",
  },
  {
    name: "getLeftOrThrow",
    signature: "<T, E>(either: EitherJson<T, E>) => E",
    description: "Left の値を取り出す。Right の場合は例外をスロー。",
  },
  {
    name: "getOrElse",
    signature: "<T, E>(either: EitherJson<T, E>, defaultValue: T) => T",
    description: "Right の値を取り出す。Left の場合はデフォルト値を返す。",
  },
];
