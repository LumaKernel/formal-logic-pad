## 実行中タスク

**元ファイル:** `tasks/prd-inserted-tasks.md`

> Auto Layoutへのアクセス（なぞのチェックボックス）は全く直感的なUXではないので、削除して、まずメニュー体験（どんな起点、操作、まとめ方）がどうあるべきかをdev/\*.mdに整理しよう。

### テスト計画

- `ProofWorkspace.test.tsx`: Auto Layoutチェックボックス関連テストを更新（チェックボックス削除→コマンドパレット/コンテキストメニュー/ショートカット経由に変更）
- `workspaceState.test.ts`: `applyTreeLayout` 関連の既存テストは変更不要（純粋ロジック）
- `keyboardShortcuts.test.ts` / `keybinding.test.ts`: 新しいショートカット追加のテスト
- `commandPalette.test.ts`: 整列コマンド追加のテスト

### ストーリー計画

- `ProofWorkspace.stories.tsx`: Auto Layout関連ストーリーがあれば更新

### 実装ステップ

1. ✅ `dev/menu-ux-design.md` にメニュー体験を整理
2. Auto Layoutチェックボックス削除 + 整列アクションをコマンドパレット/コンテキストメニュー/ショートカットに移行
3. テスト・品質チェック・コミット
