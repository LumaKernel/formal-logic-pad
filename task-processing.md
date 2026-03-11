# カバレッジ Stmts 100% 達成

**出典:** カバレッジレポート（Stmts 99.97%, Branch 100%, Lines 100%）

## タスク

Stmts が 100% でないファイルの改善:

1. `jsInterpreterTypes.ts` (0%) → 型定義のみ。カバレッジ除外設定に追加
2. `formula.ts` (98.07%) → 単体テストでは100%、V8集約アーティファクト。v8 ignore で対応
3. `TermInput.tsx` (98.83%) → 防御的コードの v8 ignore 漏れ調査
4. `questUrlSharing.ts` (99.3%) → 防御的コードの v8 ignore 漏れ調査
5. `workspaceState.ts` (99.74%) → 防御的コードの v8 ignore 漏れ調査

## テスト計画

- 既存テストの変更なし（カバレッジ対策のみ）
- v8 ignore コメント追加とカバレッジ除外設定の変更

## ストーリー計画

- UI変更なし
