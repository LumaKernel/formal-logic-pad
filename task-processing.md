## タスク: Branchカバレッジ改善（テスト追加）

出典: カバレッジレポートの未カバーブランチ分析

### 対象ファイルと未カバーブランチ

1. **proofCollectionState.ts** (Branch 93.75%) - line 335: filter条件のAND分岐
2. **atApplicationLogic.ts** (Branch 95.45%) - line 74: 空formulaText検証, lines 254-258: deltaルール
3. **scApplicationLogic.ts** (Branch 97.76%) - line 93: succedentパースエラー, lines 1186-1200: exchange規則
4. **edgeBadgeEditLogic.ts** (Branch 96.36%) - line 264: 部分的substitutionエントリ検証
5. **mergeNodesLogic.ts** (Branch 97.82%) - line 173: 吸収ノードからの出力コネクション付替え
6. **proofCollectionPanelLogic.ts** (Branch 94.44%) - line 147: フォルダ編集状態マッチング

### テスト計画

- `proofCollectionState.test.ts` にフィルタ条件テスト追加
- `atApplicationLogic.test.ts` に空formula、deltaルールテスト追加
- `scApplicationLogic.test.ts` にsuccedentパースエラー、exchange規則テスト追加
- `edgeBadgeEditLogic.test.ts` に部分的エントリテスト追加
- `mergeNodesLogic.test.ts` に吸収ノード出力コネクションテスト追加
- `proofCollectionPanelLogic.test.ts` にフォルダ編集状態テスト追加

### ストーリー計画

UI変更なし。テスト追加のみ。

### 防御的コードへの v8 ignore

テストで到達不能と確認できた防御的コードには v8 ignore を追加する。
