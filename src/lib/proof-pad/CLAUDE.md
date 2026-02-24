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
- `EditableProofNode.tsx`: UIコンポーネント — FormulaEditor を内包、CanvasItem内に配置想定
- CanvasItem + EditableProofNode 連携: `onModeChange` → `dragEnabled` パターン（FI-008で確立）

## ノード種別

- `axiom`: 公理ノード（青、下にoutポート）
- `mp`: Modus Ponens（オレンジ、上に2入力+下にoutポート）
- `conclusion`: 結論（緑、上に2入力ポート）

## テスト

- `proofNodeUI.test.ts`: 純粋関数テスト（スタイル、ポート、エッジカラー）
- `EditableProofNode.test.tsx`: コンポーネントテスト（表示/編集/読み取り専用）
- `EditableProofNode.stories.tsx`: Storybook ストーリー（インタラクションテスト）
