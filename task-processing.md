## 実行中タスク

**出典:** `tasks/inserted-tasks.md` 1番目

**タスク:** タブローにおけるノードの内部モデルを `formulaText: string`（カンマ区切り）から `formulaTexts: readonly string[]`（論理式列）に変更する

**コンテキスト:**

- 現在: `WorkspaceNode.formulaText` は全システム共通で単一文字列。TAB/SC/AT では カンマ区切りで複数論理式を格納
- `splitByTopLevelComma` で括弧考慮カンマ分割は実装済み（P(x,y)対応）
- 残り: 内部モデルの完全移行

**今回のスコープ（1イテレーション）:**

TAB（タブロー）のみを対象に、`formulaTexts` 配列による内部管理への移行を実施する。

1. `WorkspaceNode` に `formulaTexts?: readonly string[]` を追加
2. `tabApplicationLogic.ts` の入出力を `formulaTexts` ベースに変更
3. `workspaceState.ts` の TAB 関連処理を `formulaTexts` 対応に更新
4. `workspaceExport.ts` のシリアライゼーションを `formulaTexts` 対応に更新
5. UI 表示は `formulaTexts.join(", ")` で `formulaText` を導出
6. テスト更新

### テスト計画

- `tabApplicationLogic.test.ts`: 既存テストを `formulaTexts` 入出力に変更。配列ベースの結果検証追加
- `workspaceState.test.ts`: TAB 関連テストで `formulaTexts` を使用するよう更新
- `workspaceExport.test.ts`: シリアライゼーションの `formulaTexts` 対応テスト

### ストーリー計画

- UI変更なし（表示はカンマ区切り表示のまま）。ストーリー更新不要
