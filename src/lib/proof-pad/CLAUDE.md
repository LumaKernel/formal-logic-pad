# proof-pad モジュール

証明パッド（証明ワークスペース）のUIコンポーネント群。
logic-core, logic-lang, formula-input, infinite-canvas を統合する層。

## 依存関係

- `logic-core`: Formula/Term AST 型定義
- `logic-lang`: パーサー/フォーマッター（formula-input 経由で間接利用）
- `formula-input`: FormulaEditor コンポーネント
- `infinite-canvas`: CanvasItem, ConnectorPort, PortConnection

## 設計パターン

- `proofNodeUI.ts`: 純粋ロジック（スタイル、ポート定義）— exhaustive switch で網羅性保証
- `axiomPaletteLogic.ts`: 純粋ロジック（体系→公理一覧）— UIなし、logic-core/logic-lang に依存
- `goalCheckLogic.ts`: 純粋ロジック（ゴール式パース＋ワークスペースノードとの構造的一致判定）— equalFormula で AST 比較
- `EditableProofNode.tsx`: UIコンポーネント — FormulaEditor を内包、CanvasItem内に配置想定
- `AxiomPalette.tsx`: サイドパネルUI — axiomPaletteLogic の一覧を表示、クリックで公理追加
- CanvasItem + EditableProofNode 連携: `onModeChange` → `dragEnabled` パターン（FI-008で確立）

## Effect.ts パターン（proof-pad 固有）

- **3層分離**: 純粋バリデーション(`*ApplicationLogic.ts`) → 状態管理(`workspaceState.ts`) → UI(`ProofWorkspace.tsx`)
- **エラー型**: 各推論規則ごとに `Data.TaggedError` クラスを定義し union 型に集約（例: `MPApplicationError`, `GenApplicationError`）
- **バリデーション**: `Effect.gen` で実装（`validate*Effect`）、公開APIは `Either` を返す（`validate*`）
- **エラー→メッセージ変換**: `proofMessages.ts` の `getErrorMessageKey()` 関数で `_tag` → メッセージキーに変換
- **UI層の統一処理**: `processValidationResult()` で `Either` → `ValidationDisplay` に変換。UI層は `Either` を直接参照しない
- 新しい推論規則を追加する場合: `*ApplicationLogic.ts` + テスト → `proofMessages.ts` にキー追加 → `workspaceState.ts` に統合 → `ProofWorkspace.tsx` でUI

## ファイル命名規則

- macOS case-insensitive FS 対策: `axiomPaletteLogic.ts`（ロジック）と `AxiomPalette.tsx`（UI）のように、拡張子だけでなくファイル名自体を明確に異なるものにする

## ノード種別

- `axiom`: 公理ノード（kind値、ノードの初期状態）
- "derived" 状態はコネクション/InferenceEdgeから動的に計算される（kindに保存しない）
- 推論規則（MP/Gen/Substitution）はInferenceEdgeとして表現され、ノードではない

## マージロジック

- `mergeNodesLogic.ts`: 同一formulaTextノードのマージ（純粋ロジック）
  - 変更時は `mergeNodesLogic.test.ts`, `workspaceState.ts`, `index.ts` も同期
  - リーダーノード保持、吸収ノードの定理利用コネクションをリーダーに付替え
  - InferenceEdgeの前提ノードIDも付替え、結論が吸収ノードのEdgeは削除
- `workspaceState.ts`: `mergeSelectedNodes()` で純粋ロジックをラップ + syncInferenceEdges + revalidate
- UI: ProofWorkspace.tsx の選択バナーにMergeボタン + Ctrl/Cmd+M ショートカット

## テスト

- `proofNodeUI.test.ts`: 純粋関数テスト（スタイル、ポート、エッジカラー）
- `axiomPaletteLogic.test.ts`: 公理パレットロジックテスト（体系別公理一覧）
- `goalCheckLogic.test.ts`: ゴールチェック純粋ロジックテスト（パース/一致判定/境界ケース）
- `mergeNodesLogic.test.ts`: マージ純粋ロジックテスト（31テスト）
- `workspaceState.test.ts`: 統合テスト（マージ含む）
- `ProofWorkspace.stories.tsx`: Storybook ストーリー

## WorkspaceState

- ゴールはノードではなく独立データ（`WorkspaceGoal`）として管理
- ゴール達成判定: ゴール式と同じ式を持つノードが存在し、許可公理のみで導出されていれば達成
- `isNodeProtected()` は常にfalseを返す（ゴールノード廃止のため）
