## 実行中タスク

**ソース:** `tasks/inserted-tasks.md` 5行目

> 内部的にテキストとして保持しているなら、それをやめる（formulaTextのテキスト⇔配列変換を経由しない内部構造へ）

**今回の集中タスク:** WorkspaceNodeにSC用の構造化データ（antecedentTexts/succedentTexts配列）を追加し、SCノードの作成・更新時に自動的にポピュレートする

### コンテキスト

- 現在: SCノードは `formulaText: "φ, ψ ⇒ χ, δ"` の単一テキストで保持。表示・編集・規則適用のたびにパースし直す
- TAB は既に `formulaTexts?: readonly string[]` を使用（`splitByTopLevelComma(formulaText)` でポピュレート）
- 目標: SCノードも構造化データ（前件・後件の配列）として内部保持し、テキスト⇔配列変換を最小化
- logic-core に `Sequent` 型（`antecedents: Formula[], succedents: Formula[]`）は既に存在

### 設計方針

WorkspaceNodeに `sequentTexts?: { readonly antecedentTexts: readonly string[]; readonly succedentTexts: readonly string[]; }` を追加する。

- `formulaText` はバックワード互換のため維持（表示フォールバック、エクスポート）
- SCノードの作成・更新時に `sequentTexts` を `splitSequentTextParts` で自動ポピュレート
- 将来的に消費者側（SequentExpandedEditor, scApplicationLogic, SequentDisplay）が `sequentTexts` を直接参照するように移行

### テスト計画

- `workspaceState.test.ts`: SCノード作成時に `sequentTexts` がポピュレートされることをテスト
- `workspaceState.test.ts`: SCノード更新時に `sequentTexts` が同期されることをテスト
- 既存テストが引き続きパスすることを確認

### ストーリー計画

- UI変更なし（内部データ構造の変更のみ）。既存ストーリーが引き続きパスすることの確認のみ
