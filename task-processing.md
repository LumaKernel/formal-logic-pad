# 現在のタスク: カバレッジ改善（scApplicationLogic.ts, ProofWorkspace.tsx）

## 対象

ベースラインカバレッジレポートで100%未満のファイルのカバレッジを改善する。

### 1. scApplicationLogic.ts (Stmts 97.72%, Lines 98.31%)

未カバー行:

- **Line 936**: `validateUniversalRightEffect` - 固有変数が右辺(succedent)に出現する場合のfreeVariables収集ループ
- **Line 1007**: `validateExistentialLeftEffect` - 固有変数が左辺(antecedent)に出現する場合のfreeVariables収集ループ
- **Line 1086**: `validateExistentialRightEffect` - `isFreeFor` バリデーション失敗パス

### 2. ProofWorkspace.tsx (Stmts 90.01%, Lines 90.96%)

未カバー行の大部分はJSDOM制約で正当にv8 ignore済み。テスト可能な残り:

- **Lines 2614, 2624**: マージ機能のprotected node IDs
- **Line 3335**: レイアウト方向ドロップダウンのonChange

## テスト計画

### scApplicationLogic.test.ts に追加するテスト:

1. universal-right: 固有変数が右辺(succedent)に自由出現するケース → ScEigenVariableError
2. existential-left: 固有変数が左辺(antecedent)に自由出現するケース → ScEigenVariableError
3. existential-right: isFreeFor失敗ケース → ScEigenVariableError

### ProofWorkspace.test.tsx に追加するテスト:

1. マージ機能の検証（2ノード選択 → mergeEnabled確認）
2. レイアウト方向変更のテスト（autoLayout有効 → direction変更）

## ストーリー計画

UI変更なし。テスト追加のみ。
