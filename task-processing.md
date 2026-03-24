## 現在のタスク

**出典:** `tasks/inserted-tasks.md`

- [-] まずは現在の v8 ignore を分析、分類。

### コンテキスト

親タスク: v8 ignoreすべきところは、ひとつの場所に集約されているべきだと考える。

- map系は、makeConstMap を利用できるところは利用する
- `.../_unsafe` のようなフォルダに v8 ignore をすべき対象を集約する

---

## 分析結果

**合計: 851箇所の `/* v8 ignore start */`**（107ファイル）

### カテゴリ分類

| カテゴリ                                      | 件数(概算) | 説明                                                                            | 集約方針                                       |
| --------------------------------------------- | ---------- | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| A. exhaustive switch tail (`satisfies never`) | ~80        | 網羅的switchの後の `satisfies never` + throw/return。V8がブランチとしてカウント | `_unsafe/exhaustive.ts` に集約可能（関数化）   |
| B. V8集約アーティファクト                     | ~115       | テスト単体では100%だが全体テストでブランチ未カバーになるV8のバグ                | 回避困難。コメント統一のみ                     |
| C. 防御的: ノード存在チェック                 | ~65        | `nodes.get(id)` のundefinedブランチ。呼び出し元で存在が保証済み                 | `makeConstMap` or Record型で解消可能な部分あり |
| D. StepLimitExceeded 防御的伝播               | ~44        | cutElimination等の再帰中のステップ制限超過伝播                                  | 構造的に必要。集約は困難                       |
| E. model answer defensive                     | ~40        | 正常なモデル解答では到達しないバリデーション                                    | ロジック分離で集約可能                         |
| F. testId分岐                                 | ~53        | `testId ? data-testid={testId} : undefined`                                     | コンポーネントパターンで集約可能               |
| G. JSDOM/ブラウザ環境ガード                   | ~15        | `typeof window === "undefined"` 等のSSRガード                                   | impure層として分離済み（一部）                 |
| H. React DOM/ref/rAF null guard               | ~5         | `ref.current?.method()` のnull guard                                            | impure層                                       |
| I. exhaustive Map lookup                      | ~3         | `Map.get()` の `undefined` ブランチ（全キー網羅済み）                           | `makeConstMap` or `Record` で解消              |
| J. キーボード操作/アクセシビリティ            | ~8         | `onKeyDown` の Enter/Space ハンドラ                                             | テストカバー済みだがv8集約で未計上             |
| K. コメントなし防御的チェック                 | ~25        | 呼び出し元で保証された不変条件のガード                                          | コメント追加 + 必要に応じ集約                  |
| L. UI経由で常に設定されるパラメータ           | ~12        | `termText ?? ""` 等のオプショナル引数デフォルト                                 | 型で解消可能（required化）                     |
| **合計**                                      | **~851**   |                                                                                 |                                                |

### 集約可能性の高いカテゴリ（後続タスク向け）

#### 1. `makeConstMap` で解消可能（カテゴリ C, I）

- `Map.get()` → `makeConstMap` で `undefined` なしの型安全なルックアップ
- ノード存在チェックの一部（IDが網羅的な場合）
- `HIGHLIGHT_STYLES` map（`visualizationHighlightLogic.ts`）

#### 2. `_unsafe/` フォルダへの集約候補（カテゴリ A, K）

- exhaustive switch tail パターン → ヘルパー関数 `assertNever(x: never): never` に集約
- 防御的unreachableチェック → `unsafeAssertDefined<T>(value: T | undefined): T` に集約

#### 3. コンポーネントパターンで集約（カテゴリ F）

- testId分岐 → `data-testid` を常に渡すか、コンポーネントラッパーで吸収

#### 4. 回避困難（カテゴリ B, D, J）

- V8集約アーティファクトはV8のカバレッジマージバグ。コメント統一のみ
- StepLimitExceeded伝播は構造的に必要
- キーボード操作はテスト済みだがv8が検出しない

### ファイル別トップ10

| ファイル                    | v8 ignore数 |
| --------------------------- | ----------- |
| ProofWorkspace.tsx          | 225         |
| modelAnswer.ts              | 66          |
| cutElimination.ts           | 61          |
| workspaceState.ts           | 36          |
| ProofCollectionPageView.tsx | 27          |
| GoalPanel.tsx               | 19          |
| ProofCollectionPanel.tsx    | 16          |
| substitution.ts             | 15          |
| questUrlSharing.ts          | 12          |
| TermInput.tsx               | 10          |
