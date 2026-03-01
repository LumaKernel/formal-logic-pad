# カバレッジ改善: workspaceState.ts TAB/ATエッジ revalidate パス

元ファイル: カバレッジレポートから（特定PRDなし、カバレッジ改善優先）

## 対象

- `workspaceState.ts` Lines 98.64% → 100% (1400-1407: TAB/ATエッジの revalidateInferenceConclusions パス)
- `EditableProofNode.tsx` Lines 98.66% → 100% (263: パースエラー時のフォールバック表示)
- `TermInput.tsx` Lines 97.01% → 100% (246-247: handleSyntaxHelpMouseDown)
- `treeLayoutLogic.ts` v8 ignore next → start/stop パターンへ修正

## テスト計画

1. `workspaceState.test.ts` に TAB/AT エッジを含むワークスペースで `revalidateInferenceConclusions` が TAB/AT ノードを変更しないことを確認するテストを追加
2. `EditableProofNode.test.tsx` にパースエラーの代入エントリ(termText がパース失敗)のテストを追加
3. `TermInput.test.tsx` に構文ヘルプボタンのmousedownイベントテストを追加
4. `treeLayoutLogic.ts` の v8 ignore を start/stop パターンに修正

## ストーリー計画

UI変更なし。テスト追加のみ。
