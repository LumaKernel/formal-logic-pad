## タスク: カバレッジ改善 - ProofWorkspace.tsx 未カバー行の対処

**ソース:** カバレッジレポート（Stmts 98.71%, ProofWorkspace.tsx 90.01%）

### 対象行

1. **Line 2614, 2624:** `isNodeProtected` が常に false を返すため `.map()` が到達不能 → `/* v8 ignore next */` で防御的コードとして除外
2. **Line 3335:** auto-layout direction の onChange ハンドラ → テスト追加でカバー

### テスト計画

- `ProofWorkspace.test.tsx` の "auto layout toggle" describe に「方向セレクタの変更でレイアウト方向が切り替わる」テストを追加
- `fireEvent.change` で select の onChange をトリガー

### ストーリー計画

- UI変更なし（テストのみ）
