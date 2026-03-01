## 実行中タスク

カバレッジ改善: 純粋ロジック・UIコンポーネントの未カバー行テスト追加

### ソース

CLAUDE.md の「100%カバレッジを目指す」指示に基づく自発的カバレッジ改善タスク

### テスト計画

以下のファイルの未カバー行にテストを追加:

1. **formula.ts** (Stmts 98.07%) - ファクトリ関数のテスト追加（VERY EASY）
2. **axiomNameLogic.ts** (line 162) - 非自明な代入でNotIdentifiedを返すテスト（EASY）
3. **copyPasteLogic.ts** (lines 100, 236) - 部分選択のコピペテスト（EASY）
4. **dependencyLogic.ts** (lines 171, 238) - 欠損ノード参照のガードテスト（MODERATE）
5. **GoalPanel.tsx** (lines 216-257) - キーボードイベント（Enter/Space）テスト（EASY）
6. **workspaceState.ts** (lines 1112, 1237, 1406) - 接続フィルタ/レイアウト/ATエッジ（MODERATE）

### ストーリー計画

UI変更なし（テスト追加のみ）
