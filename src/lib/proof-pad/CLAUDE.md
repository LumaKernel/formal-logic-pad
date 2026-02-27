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

## ファイル命名規則

- macOS case-insensitive FS 対策: `axiomPaletteLogic.ts`（ロジック）と `AxiomPalette.tsx`（UI）のように、拡張子だけでなくファイル名自体を明確に異なるものにする

## ノード種別

- `axiom`: 公理ノード（青、下にoutポート）
- `mp`: Modus Ponens（オレンジ、上に2入力+下にoutポート）
- `conclusion`: 結論（緑、上に2入力ポート）

## テスト

- `proofNodeUI.test.ts`: 純粋関数テスト（スタイル、ポート、エッジカラー）
- `axiomPaletteLogic.test.ts`: 公理パレットロジックテスト（体系別公理一覧）
- `goalCheckLogic.test.ts`: ゴールチェック純粋ロジックテスト（パース/一致判定/境界ケース）
- `AxiomPalette.test.tsx`: コンポーネントテスト（表示/クリック/キーボード操作）
- `EditableProofNode.test.tsx`: コンポーネントテスト（表示/編集/読み取り専用）
- `EditableProofNode.stories.tsx`: Storybook ストーリー（インタラクションテスト）
- `ProofWorkspace.test.tsx`: 統合テスト（公理パレット・MP適用・ゴール判定を含む）
- `ProofWorkspace.stories.tsx`: Storybook ストーリー（GoalAchieved/GoalNotAchieved でゴール判定デモ）

## WorkspaceState

- ゴールは `role: "goal"` を持つ WorkspaceNode で表現（旧 `goalFormulaText` フィールドは廃止済み）
- `checkGoal(nodes)`: ゴールノードと同じ式を持つ非ゴールノードが存在すれば達成と判定
- ゴール判定は ProofWorkspace.tsx 内で `checkGoal()` を useMemo で呼び出し
