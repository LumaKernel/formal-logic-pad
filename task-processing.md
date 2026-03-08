タスク: カバレッジ改善（第8回）— ProofWorkspace.tsx カット除去エラーパス

ソース: coverage baseline分析（Branch 98.76% → 100%目標）

## 対象

ProofWorkspace.tsx の未カバーブランチ:

- L1801-1803: `rootIds.length > 1` → multiple roots alert
- L1814-1820: `Either.isLeft(treeResult)` → build error alert

## テスト計画

- `ProofWorkspace.test.tsx` に2テスト追加:
  1. 複数ルートがある場合のアラート表示テスト
  2. ツリー構築エラー時のアラート表示テスト

## ストーリー計画

- UI変更なし。テスト追加のみ
