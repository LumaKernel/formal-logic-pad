/**
 * Formula / Term の JSON シリアライゼーション。
 * Effect.ts Schema の decode/encode を利用し、型安全な入出力を提供する。
 */
import { Either, ParseResult, Schema } from "effect";
import { Formula } from "./formula";
import { Term } from "./term";

// ── Formula ────────────────────────────────────────────────

/** unknown (JSON) → Formula。不正入力は Left(ParseError) を返す。 */
export const decodeFormula: (
  input: unknown,
) => Either.Either<Formula, ParseResult.ParseError> =
  Schema.decodeUnknownEither(Formula);

/** Formula → JSON互換のプレーンオブジェクト。 */
export const encodeFormula: (formula: Formula) => unknown =
  Schema.encodeUnknownSync(Formula);

// ── Term ───────────────────────────────────────────────────

/** unknown (JSON) → Term。不正入力は Left(ParseError) を返す。 */
export const decodeTerm: (
  input: unknown,
) => Either.Either<Term, ParseResult.ParseError> =
  Schema.decodeUnknownEither(Term);

/** Term → JSON互換のプレーンオブジェクト。 */
export const encodeTerm: (term: Term) => unknown =
  Schema.encodeUnknownSync(Term);
