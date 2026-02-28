/**
 * validationDisplay のテスト。
 *
 * 汎用的な ValidationDisplay ユーティリティの単体テスト。
 * ドメイン固有のメッセージマップを使ったテストを含む。
 */

import { describe, it, expect } from "vitest";
import { Data, Either } from "effect";
import {
  processValidationResult,
  formatMessage,
  type ValidationDisplay,
} from "./validationDisplay";

// --- テスト用のドメインエラー型 ---

class FooMissing extends Data.TaggedError("FooMissing")<
  Record<string, never>
> {}
class FooInvalid extends Data.TaggedError("FooInvalid")<{
  readonly reason: string;
}> {}
class FooNotFound extends Data.TaggedError("FooNotFound")<{
  readonly id: string;
}> {}

type FooError = FooMissing | FooInvalid | FooNotFound;

// --- テスト用のメッセージマップ ---

const testMessages = {
  fooMissing: "Foo is missing",
  fooInvalid: "Foo is invalid",
  fooNotFound: "Foo not found",
} as const;

type TestMessages = typeof testMessages;

function getFooErrorKey(error: FooError): keyof TestMessages {
  switch (error._tag) {
    case "FooMissing":
      return "fooMissing";
    case "FooInvalid":
      return "fooInvalid";
    case "FooNotFound":
      return "fooNotFound";
  }
}

// --- processValidationResult ---

describe("processValidationResult", () => {
  it("成功時はsuccessメッセージを返す", () => {
    const result: Either.Either<{ readonly value: number }, FooError> =
      Either.right({ value: 42 });
    const display = processValidationResult(
      result,
      "Operation succeeded",
      getFooErrorKey,
      () => false,
      testMessages,
    );
    expect(display).toEqual({
      message: "Operation succeeded",
      type: "success",
    } satisfies ValidationDisplay);
  });

  it("スキップ対象エラーの場合はundefinedを返す", () => {
    const result: Either.Either<unknown, FooError> = Either.left(
      new FooMissing({}),
    );
    const display = processValidationResult(
      result,
      "Succeeded",
      getFooErrorKey,
      (e) => e._tag === "FooMissing",
      testMessages,
    );
    expect(display).toBeUndefined();
  });

  it("表示対象エラーの場合はエラーメッセージを返す", () => {
    const result: Either.Either<unknown, FooError> = Either.left(
      new FooInvalid({ reason: "bad format" }),
    );
    const display = processValidationResult(
      result,
      "Succeeded",
      getFooErrorKey,
      (e) => e._tag === "FooMissing",
      testMessages,
    );
    expect(display).toEqual({
      message: "Foo is invalid",
      type: "error",
    } satisfies ValidationDisplay);
  });

  it("FooNotFoundエラーでも正しくメッセージキーを解決する", () => {
    const result: Either.Either<unknown, FooError> = Either.left(
      new FooNotFound({ id: "abc" }),
    );
    const display = processValidationResult(
      result,
      "Succeeded",
      getFooErrorKey,
      () => false,
      testMessages,
    );
    expect(display).toEqual({
      message: "Foo not found",
      type: "error",
    } satisfies ValidationDisplay);
  });

  it("shouldSkipErrorで外部変数による複合条件を使える", () => {
    const result: Either.Either<unknown, FooError> = Either.left(
      new FooMissing({}),
    );

    // 条件成立 → スキップ
    const items: readonly unknown[] = [];
    const display1 = processValidationResult(
      result,
      "Succeeded",
      getFooErrorKey,
      (e) => e._tag === "FooMissing" && items.length === 0,
      testMessages,
    );
    expect(display1).toBeUndefined();

    // 条件不成立 → エラー表示
    const nonEmptyItems: readonly unknown[] = [1];
    const display2 = processValidationResult(
      result,
      "Succeeded",
      getFooErrorKey,
      (e) => e._tag === "FooMissing" && nonEmptyItems.length === 0,
      testMessages,
    );
    expect(display2).toEqual({
      message: "Foo is missing",
      type: "error",
    } satisfies ValidationDisplay);
  });

  it("異なるメッセージマップ型でも型安全に動作する", () => {
    const jaMessages = {
      fooMissing: "Fooがありません",
      fooInvalid: "Fooが不正です",
      fooNotFound: "Fooが見つかりません",
    } as const;

    const result: Either.Either<unknown, FooError> = Either.left(
      new FooInvalid({ reason: "test" }),
    );
    const display = processValidationResult(
      result,
      "成功",
      getFooErrorKey,
      () => false,
      jaMessages,
    );
    expect(display).toEqual({
      message: "Fooが不正です",
      type: "error",
    } satisfies ValidationDisplay);
  });
});

// --- formatMessage ---

describe("formatMessage", () => {
  it("単一プレースホルダーを置換する", () => {
    expect(formatMessage("Hello {name}", { name: "World" })).toBe(
      "Hello World",
    );
  });

  it("複数プレースホルダーを置換する", () => {
    expect(formatMessage("{a} and {b}", { a: "foo", b: "bar" })).toBe(
      "foo and bar",
    );
  });

  it("マッチしないプレースホルダーはそのまま残す", () => {
    expect(formatMessage("No {match}", { key: "val" })).toBe("No {match}");
  });

  it("空のparamsではテンプレートをそのまま返す", () => {
    expect(formatMessage("Template {x}", {})).toBe("Template {x}");
  });

  it("プレースホルダーなしのテンプレートはそのまま返す", () => {
    expect(formatMessage("No placeholders", { key: "val" })).toBe(
      "No placeholders",
    );
  });

  it("同じプレースホルダーが複数ある場合、最初の1つのみ置換する", () => {
    expect(formatMessage("{x} and {x}", { x: "val" })).toBe("val and {x}");
  });
});
