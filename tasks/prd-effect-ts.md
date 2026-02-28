# PRD: Effect.ts 全面採用計画

## はじめに

本プロジェクトでは `src/lib/logic-core/` のAST定義に `Schema.TaggedClass` を使用しているが、Effect.ts の機能はごく一部しか活用されていない。本PRDでは、プロジェクト全体にEffect.tsの恩恵を広げるための段階的な採用計画を定める。

## 現状分析

### Effect.ts を使用中のモジュール

| モジュール                                              | 使用範囲    | 使用機能                                                                                    |
| ------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| logic-core (`formula.ts`, `term.ts`, `greekLetters.ts`) | AST定義のみ | `Schema.TaggedClass`, `Schema.Union`, `Schema.suspend`, `Schema.Literal`, `Schema.optional` |

### 現在のエラー型インベントリ（移行対象）

すべて手動の `_tag` 付きオブジェクトリテラル。`throw` は使われていない。

| ファイル                                    | エラー型                       | バリアント数 | 結果型                                                                     |
| ------------------------------------------- | ------------------------------ | ------------ | -------------------------------------------------------------------------- |
| `logic-core/inferenceRule.ts`               | `RuleApplicationError`         | 10           | `RuleApplicationResult` (`Ok`/`Error`)                                     |
| `logic-core/unification.ts`                 | `UnificationError`             | 3            | `UnificationResult` (`Ok`/`Error`)                                         |
| `proof-pad/mpApplicationLogic.ts`           | `MPApplicationError`           | 6            | `MPApplicationResult` (`Success`/Error variants)                           |
| `proof-pad/genApplicationLogic.ts`          | `GenApplicationError`          | 5            | `GenApplicationResult`                                                     |
| `proof-pad/substitutionApplicationLogic.ts` | `SubstitutionApplicationError` | 5            | `SubstitutionApplicationResult`                                            |
| `proof-pad/goalCheckLogic.ts`               | ― (ステータス型)               | 3            | `GoalCheckResult` (`GoalNotSet`/`GoalAllAchieved`/`GoalPartiallyAchieved`) |
| `quest/questCompletionLogic.ts`             | ― (ステータス型)               | 3+4          | `QuestGoalCheckResult`, `QuestGoalCheckWithAxiomsResult`                   |
| `logic-lang/parser.ts`                      | `ParseError` (interface)       | ―            | `ParseResult` (`{ ok: true }` / `{ ok: false }`)                           |
| `logic-lang/lexer.ts` (token.ts)            | `LexerError` (interface)       | ―            | `LexResult` (`{ ok: true }` / `{ ok: false }`)                             |

### 未使用だが有効なEffect.ts機能

- **`Data.TaggedError`**: 型付きエラー（現在は手動の `_tag` 付きオブジェクトリテラル）
- **`Effect.gen` / `Effect.pipe`**: 型安全なエラーハンドリングチェーン
- **`Either`**: 明示的な成功/失敗型（現在は `{ ok: true } | { ok: false }` 手動定義）
- **`Schema.decode` / `Schema.encode`**: JSON シリアライゼーション検証（現在は手動 `JSON.parse` + try-catch）
- **`Effect.catchTag` / `Effect.catchTags`**: `_tag` ベースのエラーハンドリング
- **`Layer`**: DI（localStorage等の副作用分離）

## 設計原則

- **段階的採用**: 一度にすべてを書き換えない。モジュールごとに段階的に導入する
- **ピュア層を先に**: 純粋ロジック層からEffect化し、UI層は最後
- **既存テストを壊さない**: リファクタリングごとにテストが通ることを確認
- **過剰導入しない**: 単純な関数に `Effect.gen` を被せるだけの無意味な導入はしない。恩恵がある箇所のみ
- **context7を使え**: Effect.tsの最新APIを確認するために `context7` の `resolve-library-id` → `query-docs` を必ず利用すること。古い情報に基づいて実装しない

## 採用優先度マトリクス

| モジュール                               | 複雑度   | 現在のエラー処理       | 純粋性 | Effect.ts 価値 | 優先度 |
| ---------------------------------------- | -------- | ---------------------- | ------ | -------------- | ------ |
| logic-core                               | 高       | `Ok`/`Error` union     | 純粋   | ⭐⭐ 中        | P1     |
| proof-pad (ロジック層)                   | 非常に高 | `_tag` 付き union      | 混在   | ⭐⭐⭐ 高      | P1     |
| quest (ロジック層)                       | 中       | `_tag` union           | 混在   | ⭐⭐ 中        | P2     |
| logic-lang                               | 高       | `{ ok, errors }` union | 純粋   | ⭐⭐ 中        | P2     |
| formula-input (ロジック層)               | 中       | discriminated union    | 混在   | ⭐ 低          | P3     |
| infinite-canvas                          | 非常に高 | ほぼ不要(数学)         | 純粋   | ⭐ 低          | 対象外 |
| theme / history / keybinding / reference | 低〜中   | なし                   | 純粋   | ⭐ 低          | 対象外 |

---

## タスクリスト

### フェーズ2: 高価値モジュールへの展開 (proof-pad, logic-lang)

#### proof-pad ロジック層

- [x] **ET-004: proof-pad エラー型を `Data.TaggedError` に移行**

  **対象ファイルと変換内容:**
  1. **`src/lib/proof-pad/mpApplicationLogic.ts`** — `MPApplicationError` (6バリアント)

     ```typescript
     // Before:
     export type MPApplicationError =
       | { readonly _tag: "LeftPremiseMissing" }
       | { readonly _tag: "RightPremiseMissing" }
       | { readonly _tag: "BothPremisesMissing" }
       | { readonly _tag: "LeftParseError"; readonly nodeId: string }
       | { readonly _tag: "RightParseError"; readonly nodeId: string }
       | { readonly _tag: "RuleError"; readonly error: RuleApplicationError };

     // After:
     export class LeftPremiseMissing extends Data.TaggedError("LeftPremiseMissing")<{}> {}
     export class RightPremiseMissing extends Data.TaggedError("RightPremiseMissing")<{}> {}
     export class BothPremisesMissing extends Data.TaggedError("BothPremisesMissing")<{}> {}
     export class LeftParseError extends Data.TaggedError("LeftParseError")<{ readonly nodeId: string }> {}
     export class RightParseError extends Data.TaggedError("RightParseError")<{ readonly nodeId: string }> {}
     export class MPRuleError extends Data.TaggedError("MPRuleError")<{ readonly error: RuleApplicationError }> {}
     export type MPApplicationError = LeftPremiseMissing | RightPremiseMissing | ...
     ```

     - `MPApplicationResult` → `Either<MPApplicationSuccess, MPApplicationError>` に
     - `getMPErrorMessage()` は `_tag` ベースの既存パターンをそのまま維持可能

  2. **`src/lib/proof-pad/genApplicationLogic.ts`** — `GenApplicationError` (5バリアント) — 同様の変換

  3. **`src/lib/proof-pad/substitutionApplicationLogic.ts`** — `SubstitutionApplicationError` (5バリアント) — 同様の変換

  **影響を受けるファイル:**
  - `mpApplicationLogic.test.ts` — Result検証を `Either` ベースに
  - `genApplicationLogic.test.ts` — 同上
  - `substitutionApplicationLogic.test.ts` — 同上
  - `workspaceState.ts` — 結果型の扱いを更新
  - `ProofWorkspace.tsx` — UI層での結果型の扱い（`Either.match` に）

  **手順:**
  1. `mpApplicationLogic.ts` から開始（最も使用頻度が高い）
  2. エラークラス定義 → Result型をEither化 → `validateMPApplication` の戻り値更新
  3. `getMPErrorMessage()` の更新（`Either.match` + `_tag` switch は既存パターンで動く）
  4. テスト更新、通過確認
  5. `genApplicationLogic.ts`, `substitutionApplicationLogic.ts` も同様に
  6. `ProofWorkspace.tsx` のコンパイルエラーを修正
  7. `npm run typecheck && npm run lint && npm run test` 通過を確認

  **受け入れ基準:** proof-padのエラー型が `Data.TaggedError` + `Either` パターンに統一。全テスト通過

---

- [x] **ET-005: MP/Gen適用ロジックを `Effect.gen` パイプラインに**

  **前提:** ET-001, ET-004 完了後

  **対象ファイル:**
  - `src/lib/proof-pad/mpApplicationLogic.ts` — `validateMPApplication()` 関数
  - `src/lib/proof-pad/genApplicationLogic.ts` — `validateGenApplication()` 関数
  - `src/lib/proof-pad/substitutionApplicationLogic.ts` — `validateSubstitutionApplication()` 関数

  **変換例 (`validateMPApplication`):**

  ```typescript
  // Before: 手動の早期リターンチェーン
  export function validateMPApplication(state, mpNodeId): MPApplicationResult {
    const premises = getMPPremises(state, mpNodeId);
    if (!premises.leftNodeId && !premises.rightNodeId)
      return { _tag: "BothPremisesMissing" };
    if (!premises.leftNodeId) return { _tag: "LeftPremiseMissing" };
    // ... パース → MP適用 → 結果返却
  }

  // After: Effect.gen パイプライン
  export const validateMPApplication = (
    state: WorkspaceState,
    mpNodeId: string,
  ) =>
    Effect.gen(function* () {
      const premises = getMPPremises(state, mpNodeId);
      if (!premises.leftNodeId && !premises.rightNodeId)
        yield* Effect.fail(new BothPremisesMissing());
      if (!premises.leftNodeId) yield* Effect.fail(new LeftPremiseMissing());
      const leftFormula = yield* parseNodeFormula(
        state,
        premises.leftNodeId,
      ).pipe(
        Effect.mapError(
          () => new LeftParseError({ nodeId: premises.leftNodeId! }),
        ),
      );
      // ... MP適用
    });

  // 互換性ラッパー
  export const validateMPApplicationSync = (
    state: WorkspaceState,
    mpNodeId: string,
  ): Either<MPApplicationSuccess, MPApplicationError> =>
    Effect.runSync(Effect.either(validateMPApplication(state, mpNodeId)));
  ```

  **UI層との境界:** `ProofWorkspace.tsx` では `validateMPApplicationSync` を呼び、返される `Either` を `Either.match` で処理する。

  **手順:**
  1. `mpApplicationLogic.ts` の `validateMPApplication` を Effect.gen に変換
  2. `...Sync` ラッパーを提供
  3. テスト更新（`Effect.runSync(Effect.either(...))` ラップ）
  4. `ProofWorkspace.tsx` を `...Sync` ラッパー経由に更新
  5. gen, substitution も同様に
  6. 全テスト通過を確認

  **受け入れ基準:** バリデーションが `Effect.gen` で記述され、短絡評価が明示的。UI層は `...Sync` ラッパー経由。全テスト通過

---

- [x] **ET-006: JSON Import/Export を Schema ベースに**

  **前提:** ET-002 完了後（`serialization.ts` の decode/encode が使える）

  **対象ファイル:**
  - `src/lib/proof-pad/workspaceState.ts` — `exportWorkspace()`, `importWorkspace()` 関数
  - `src/lib/proof-pad/workspaceState.test.ts`

  **現在の実装:** `JSON.parse` + 手動バリデーション + try-catch

  **変換方針:**
  - `WorkspaceState` のSchemaを `Schema.Struct` + 既存AST Schemaで定義
  - `importWorkspace` を `Schema.decodeUnknown(WorkspaceStateSchema)` に置き換え
  - パースエラーは `Schema.ParseError` → ユーザー向けメッセージに変換

  **手順:**
  1. `WorkspaceState` の Schema 定義を追加
  2. `exportWorkspace` → `Schema.encodeSync` を使用
  3. `importWorkspace` → `Schema.decodeUnknown` + `Either` で結果を返す
  4. 既存の import/export テストを更新
  5. 不正JSON入力のエラーテストを追加
  6. 全テスト通過を確認

  **受け入れ基準:** import/exportが `Schema` ベースで型安全。不正JSONに構造化エラー。全テスト通過

---

#### logic-lang

- [x] **ET-007: パース結果型を `Either` に統一**

  **対象ファイル:**
  - `src/lib/logic-lang/parser.ts` — `ParseResult`, `TermParseResult`
  - `src/lib/logic-lang/token.ts` — `LexResult`
  - `src/lib/logic-lang/lexer.ts`
  - `src/lib/logic-lang/parser.test.ts`
  - `src/lib/logic-lang/lexer.test.ts`

  **変換内容:**

  ```typescript
  // Before:
  export type ParseResult =
    | { readonly ok: true; readonly formula: Formula }
    | { readonly ok: false; readonly errors: readonly ParseError[] };

  // After:
  import { Either } from "effect";
  export type ParseResult = Either.Either<Formula, readonly ParseError[]>;
  // Right = 成功 (Formula), Left = 失敗 (ParseError[])
  ```

  **影響を受ける呼び出し元（全モジュールを更新）:**
  - `src/lib/formula-input/editorLogic.ts` — `result.ok` → `Either.isRight(result)`
  - `src/lib/formula-input/inputCompletion.ts` — 同上
  - `src/lib/proof-pad/mpApplicationLogic.ts` — 同上
  - `src/lib/proof-pad/genApplicationLogic.ts` — 同上
  - `src/lib/proof-pad/substitutionApplicationLogic.ts` — 同上
  - `src/lib/proof-pad/goalCheckLogic.ts` — 同上
  - `src/lib/proof-pad/workspaceState.ts` — 同上

  **手順:**
  1. `token.ts` の `LexResult` を `Either` に変換
  2. `lexer.ts` 内部を更新
  3. `lexer.test.ts` を更新、通過確認
  4. `parser.ts` の `ParseResult`, `TermParseResult` を `Either` に変換
  5. `parser.test.ts` を更新、通過確認
  6. 呼び出し元を **一括で** `Either.isRight` / `Either.match` パターンに更新
  7. `npm run typecheck` で漏れがないことを確認（型エラーで検出可能）
  8. 全テスト通過を確認

  **受け入れ基準:** パース結果が `Either` で表現され、全呼び出し元が更新済み。全テスト通過

---

- [x] **ET-008: パースエラーを `Data.TaggedError` に**

  **前提:** ET-007 完了後

  **対象ファイル:**
  - `src/lib/logic-lang/token.ts` — `ParseError`, `LexerError` (現在はinterface)
  - `src/lib/logic-lang/parser.ts`
  - `src/lib/logic-lang/lexer.ts`

  **変換内容:**

  ```typescript
  // Before:
  export interface ParseError {
    readonly message: string;
    readonly span: Span;
  }

  // After:
  export class ParseError extends Data.TaggedError("ParseError")<{
    readonly message: string;
    readonly span: Span;
  }> {}

  export class LexerError extends Data.TaggedError("LexerError")<{
    readonly message: string;
    readonly span: Span;
  }> {}
  ```

  **手順:**
  1. `token.ts` の interface → class 変換
  2. エラー生成箇所（`new ParseError(...)` 形式）を更新
  3. テスト更新、通過確認

  **受け入れ基準:** パースエラーが `Data.TaggedError` ベースで `_tag` を持つ。全テスト通過

---

### フェーズ3: DI・副作用分離 (quest, app層)

- [-] **ET-009: quest のストレージ操作を Effect + Layer で抽象化**

  **対象ファイル:**
  - `src/lib/quest/questProgress.ts` — `loadProgress()`, `saveProgress()`
  - `src/lib/quest/useQuestProgress.ts` — React hook
  - `src/lib/quest/questProgress.test.ts`

  **変換方針:**

  ```typescript
  import { Effect, Layer, Context } from "effect";

  // StorageService の定義
  class StorageService extends Context.Tag("StorageService")<
    StorageService,
    {
      readonly getItem: (key: string) => Effect.Effect<string | null>;
      readonly setItem: (key: string, value: string) => Effect.Effect<void>;
    }
  >() {}

  // 本番Layer
  const BrowserStorageLayer = Layer.succeed(StorageService, {
    getItem: (key) => Effect.sync(() => localStorage.getItem(key)),
    setItem: (key, value) =>
      Effect.sync(() => localStorage.setItem(key, value)),
  });

  // テストLayer
  const InMemoryStorageLayer = (initial: Record<string, string> = {}) => {
    const store = new Map(Object.entries(initial));
    return Layer.succeed(StorageService, {
      getItem: (key) => Effect.sync(() => store.get(key) ?? null),
      setItem: (key, value) =>
        Effect.sync(() => {
          store.set(key, value);
        }),
    });
  };
  ```

  **手順:**
  1. context7 で `Context.Tag`, `Layer.succeed` の最新APIを確認
  2. `StorageService` インターフェースを `src/lib/quest/storageService.ts` に定義
  3. `loadProgress`, `saveProgress` を `Effect<..., ..., StorageService>` に変換
  4. React hook 側は `Effect.runSync(Effect.provide(..., BrowserStorageLayer))` で呼び出す
  5. テストは `InMemoryStorageLayer` を使用
  6. 全テスト通過を確認

  **受け入れ基準:** ストレージアクセスが `Layer` で差し替え可能。テストが副作用フリー。全テスト通過

---

- [ ] **ET-010: quest のゴールチェック検証を Effect パイプラインに**

  **前提:** ET-009 完了後

  **対象ファイル:**
  - `src/lib/quest/questCompletionLogic.ts` — `checkQuestGoals()`, `checkQuestGoalsWithAxioms()`
  - `src/lib/quest/questCompletionLogic.test.ts`

  **変換方針:**
  - 複数ゴールの検証を `Effect.all` で並列実行
  - 公理制約チェックを `Effect.gen` で逐次実行（前のチェック結果に依存）
  - エラー蓄積が必要な場合は `Effect.all({ mode: "either" })` を使用

  **手順:**
  1. `checkQuestGoals` を `Effect.gen` に変換
  2. `checkQuestGoalsWithAxioms` を `Effect.gen` に変換
  3. 互換性ラッパー（Sync版）を提供
  4. テスト更新、通過確認

  **受け入れ基準:** ゴールチェックが型安全なパイプライン。全テスト通過

---

- [ ] **ET-011: app層のエラーバウンダリ整備**

  **対象ファイル:**
  - `src/lib/proof-pad/ProofWorkspace.tsx` (主要なEffect消費者)
  - `src/lib/quest/` 配下のReact hooks

  **変換方針:**
  - Effect化されたロジック層の呼び出しは UI層の境界で `Effect.runSync` / `Either.match` に統一
  - エラー → ユーザー向けメッセージ変換のパターンを統一

  **受け入れ基準:** UI層がEffect内部のエラー型を意識せず、統一的なエラー表示ができる

---

### フェーズ4: 横断的整備

- [ ] **ET-012: Effect.ts のプロジェクト規約を CLAUDE.md に追加**

  **追加先:** `CLAUDE.md` および `src/lib/logic-core/CLAUDE.md`

  **記載内容:**
  - `Schema.TaggedClass`: ASTノード等のデータ型に使用。シリアライゼーション対象
  - `Data.TaggedError`: エラー型に使用。`Effect.fail` で投げ、`Effect.catchTag` でハンドリング
  - `Effect.gen`: 複数のバリデーションチェーンがある関数に使用。単純な関数には使わない
  - `Either`: Result型として使用。`{ ok: true } | { ok: false }` の代わり
  - `Layer` + `Context.Tag`: 副作用（localStorage, fetch等）の抽象化に使用
  - UI層の境界では `Effect.runSync` / `Effect.runPromise` で解決
  - `Schema.optionalWith({ as: "Option" })` は union schema で使えない（既存の注意事項維持）

  **受け入れ基準:** 新規コードでEffect.tsを正しく使うためのガイドラインが文書化される

---

- [ ] **ET-013: 共通エラーユーティリティの整備**

  **対象ファイル:**
  - `src/lib/error-utils/index.ts` (新規作成)
  - `src/lib/error-utils/errorMessages.ts` (新規作成)

  **提供する機能:**

  ```typescript
  // Data.TaggedError → ユーザー向けメッセージ（i18n対応）
  export function getErrorMessage(
    error: { readonly _tag: string },
    locale: Locale,
  ): string;
  // Either → UI表示用の統一的な変換
  export function eitherToDisplayResult<A, E extends { readonly _tag: string }>(
    result: Either<A, E>,
    locale: Locale,
  ):
    | { readonly ok: true; readonly value: A }
    | { readonly ok: false; readonly message: string };
  ```

  **受け入れ基準:** エラー→メッセージ変換が一箇所に集約される

---

## 対象外（Effect化しないもの）

以下のモジュールは現状のパターンで十分機能しており、Effect化のメリットが薄い:

- **infinite-canvas**: 幾何計算が中心でエラーケースがほぼない。純粋関数で完結
- **theme**: 極めてシンプル。エラーケースなし
- **history**: ジェネリックなundo/redo。エラーケースなし
- **keybinding**: 純粋なマッチングロジック。エラーケースなし
- **reference**: 純粋なデータ定義。エラーケースなし

## 技術的注意事項

### Schema.TaggedClass vs Data.TaggedError の使い分け

- **`Schema.TaggedClass`**: ASTノードなどのデータ型。シリアライゼーション（decode/encode）対象
- **`Data.TaggedError`**: エラー型。`Effect.fail` で投げ、`Effect.catchTag` でハンドリング。シリアライゼーション不要

### 互換性維持の戦略

- Effect化した関数は、移行期間中は `...Sync` ラッパーを提供して既存の呼び出し元を壊さない
- UI層（React hooks/components）は最後にEffect対応する。それまでは境界で `runSync`
- テストは `Effect.runSync(Effect.either(...))` でラップして既存のexpect パターンを維持可能

### `Either` の向き（Right = 成功）

Effect.ts の `Either<A, E>` は `Right(A)` が成功、`Left(E)` が失敗。これは一般的な慣例に従う。

### パフォーマンス考慮

- `Effect.runSync` はオーバーヘッドが極小（同期的なEffect解決）
- Schemaのdecode/encodeは初回にスキーマコンパイルが走るが、その後はキャッシュされる
- UIのレンダリングパス上で重いEffect計算を行わないこと

## 成功指標

- エラー型がプロジェクト全体で `Data.TaggedError` に統一される
- JSON import/export が `Schema` ベースで型安全になる
- proof-padのバリデーションチェーンが `Effect.gen` で読みやすくなる
- テストカバレッジが低下しない（むしろエラーパスのテストが充実する）
- 新規コード開発時にEffect.tsのパターンが自然に使われるようになる

## タスク依存関係

```
ET-001 ──→ ET-003 ──→ ET-005
  │                       ↑
  └──→ ET-004 ────────────┘
ET-002 ──→ ET-006
ET-007 ──→ ET-008
ET-009 ──→ ET-010
ET-005 + ET-010 ──→ ET-011
ET-001〜ET-008 完了後 ──→ ET-012, ET-013
```
