## 現在のタスク

カバレッジ改善: `scTreeBuildLogic.ts` のBranchカバレッジ向上 (83.96% → 100%)

ソース: ベースラインカバレッジレポート（prd-logic-pad-world.md の前に実施）

### 未カバーのエラーパス

1. L456: weakening-right の論理式復元失敗
2. L471: contraction-left の論理式復元失敗
3. L486: contraction-right の論理式復元失敗
4. L535: cut のカット式復元失敗
5. L426: premiseParsed === undefined（前提テキストパース失敗）
6. L275: サイクル検出

### テスト計画

- ファイル: `src/lib/proof-pad/scTreeBuildLogic.test.ts`
- 追加テストケース:
  - weakening-right で論理式復元が失敗するケース（結論と前提のsuccedent数が不正）
  - contraction-left で論理式復元が失敗するケース（結論と前提のantecedent数が不正）
  - contraction-right で論理式復元が失敗するケース（結論と前提のsuccedent数が不正）
  - cut でカット式復元が失敗するケース（左前提テキストのsuccedentが複数）
  - 前提テキストがパース不能で premiseParsed === undefined になるケース
  - グラフにサイクルがある場合の ScTreeCycleDetected エラー

### ストーリー計画

- UI変更なし。純粋ロジックのテスト追加のみ。
