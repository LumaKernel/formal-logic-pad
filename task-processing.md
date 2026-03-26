## 実行タスク

**出典:** `tasks/inserted-tasks.md` - 「スクリプトライブラリの カット除去 段階{n} はすべて eliminateCutsWithSteps のような組込みで実装済みのものを使うべきではなく、露出させるべき。」

**集中タスク:** カット除去の内部ヘルパー関数をスクリプトサンドボックスに露出し、段階的学習テンプレートで利用可能にする

### コンテキスト

- `eliminateCutsWithSteps` はブラックボックスAPI。内部のrank/depth計算や個別戦略が隠蔽されている
- 段階3-6のテンプレートは、学習者が内部の仕組みを理解するために個別APIを呼べるべき
- 以下の関数を `cutEliminationBridge.ts` に追加:
  - `mixRank`, `rightRank`, `leftRank`, `formulaDepth`
  - `removeAllOccurrences`, `removeFirstOccurrence`, `containsFormula`, `countOccurrences`
  - `getScChildren`
  - 個別elimination戦略（`eliminateSingleCut` 等）の一部

### テスト計画

- `src/lib/script-runner/cutEliminationBridge.test.ts` に新規APIのテスト追加
- 各関数のバリデーション（unknown入力→パース→実行）を検証

### ストーリー計画

- UI変更なし。スクリプトAPI追加のため新ストーリー不要

### 実装計画

1. `cutElimination.ts` - 必要な内部関数をexportする（既にexportされているものは確認のみ）
2. `cutEliminationBridge.ts` - ブリッジ関数を追加（sandbox向けラッパー）
3. `builtin-api-typedefs.txt` - 型定義を追加
4. テンプレート `templates.ts` の段階3-6を個別API利用に書き換え
5. テスト追加
