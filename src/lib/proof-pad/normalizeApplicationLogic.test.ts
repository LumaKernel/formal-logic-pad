import { describe, expect, it } from "vitest";
import { Effect, Either } from "effect";
import {
  validateNormalizeApplicationEffect,
  validateNormalizeApplication,
  NormalizeParseError,
  NormalizeNoChange,
  NormalizeEmptyFormula,
  type NormalizeApplicationError,
} from "./normalizeApplicationLogic";

// --- validateNormalizeApplication ---

describe("validateNormalizeApplication", () => {
  it("returns NormalizeEmptyFormula for empty string", () => {
    const result = validateNormalizeApplication("");
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("NormalizeEmptyFormula");
    }
  });

  it("returns NormalizeEmptyFormula for whitespace-only string", () => {
    const result = validateNormalizeApplication("   ");
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("NormalizeEmptyFormula");
    }
  });

  it("returns NormalizeParseError for invalid formula", () => {
    const result = validateNormalizeApplication("-> invalid");
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("NormalizeParseError");
    }
  });

  it("returns NormalizeNoChange for already normalized formula", () => {
    const result = validateNormalizeApplication("φ → ψ");
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("NormalizeNoChange");
    }
  });

  it("returns NormalizeNoChange for simple propositional variable", () => {
    const result = validateNormalizeApplication("φ");
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("NormalizeNoChange");
    }
  });

  it("successfully normalizes a formula with resolvable substitution", () => {
    // P(x)[a/x] should normalize to P(a)
    const result = validateNormalizeApplication("P(x)[a/x]");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.normalizedText).toBe("P(a)");
    }
  });

  it("successfully normalizes FreeVariableAbsence when variable is not free", () => {
    // P(y)[/x] should normalize to P(y) since x is not free in P(y)
    const result = validateNormalizeApplication("P(y)[/x]");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.normalizedText).toBe("P(y)");
    }
  });

  it("returns NormalizeNoChange for FreeVariableAbsence when variable is free", () => {
    // P(x)[/x] — x is free in P(x), so cannot simplify further
    const result = validateNormalizeApplication("P(x)[/x]");
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("NormalizeNoChange");
    }
  });

  it("normalizes nested substitution chain", () => {
    // P(x)[a/x][b/y] should normalize: resolve P(x)[a/x] = P(a), then P(a)[b/y] = P(a) (y not free)
    const result = validateNormalizeApplication("P(x)[a/x][b/y]");
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.normalizedText).toBe("P(a)");
    }
  });
});

// --- validateNormalizeApplicationEffect ---

describe("validateNormalizeApplicationEffect", () => {
  it("returns success as Effect for normalizable formula", () => {
    const effect = validateNormalizeApplicationEffect("P(x)[a/x]");
    const result = Effect.runSync(Effect.either(effect));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.normalizedText).toBe("P(a)");
      expect(result.right.normalizedFormula._tag).toBe("Predicate");
    }
  });

  it("returns NormalizeNoChange as Effect for already normalized formula", () => {
    const effect = validateNormalizeApplicationEffect("φ → ψ");
    const result = Effect.runSync(Effect.either(effect));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("NormalizeNoChange");
    }
  });
});

// --- Error type checks ---

describe("NormalizeApplicationError types", () => {
  it("NormalizeParseError has correct _tag", () => {
    const error = new NormalizeParseError({});
    expect(error._tag).toBe("NormalizeParseError");
  });

  it("NormalizeNoChange has correct _tag", () => {
    const error = new NormalizeNoChange({});
    expect(error._tag).toBe("NormalizeNoChange");
  });

  it("NormalizeEmptyFormula has correct _tag", () => {
    const error = new NormalizeEmptyFormula({});
    expect(error._tag).toBe("NormalizeEmptyFormula");
  });

  it("exhaustive error type coverage", () => {
    const errors: readonly NormalizeApplicationError[] = [
      new NormalizeParseError({}),
      new NormalizeNoChange({}),
      new NormalizeEmptyFormula({}),
    ];
    const tags = errors.map((e) => e._tag);
    expect(tags).toEqual([
      "NormalizeParseError",
      "NormalizeNoChange",
      "NormalizeEmptyFormula",
    ]);
  });
});
