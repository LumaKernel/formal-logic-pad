## 実行中タスク

カバレッジ改善: ProofCollectionPanel.tsx のフォルダ名編集Escape・ブランチカバレッジ改善

出典: カバレッジレポート分析（ProofCollectionPanel.tsx: Branch 77.27%, Lines 93.87%）

### テスト計画

- `src/lib/proof-collection/ProofCollectionPanel.test.tsx` にテスト追加:
  1. フォルダ名編集中にEscapeキーで編集キャンセル → handleCancelFolderEdit呼び出し (lines 623-624, 821)
  2. フォルダ名編集中のblur確定テスト
  3. フォルダ名空白でのEnter確定が無効であることのテスト
  4. その他、Branch coverage向上のための未カバーブランチ特定・テスト追加

### ストーリー計画

- UI変更なし。テスト追加のみ。
