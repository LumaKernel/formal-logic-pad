# 実行中タスク

## タスク

**元ファイル:** `tasks/prd-inserted-tasks.md`

> カット除去を部分的に実装しているものを、5-7段階ぐらいでそれぞれ用意 (自分で実装して学習していきながらやっていく人向け)

### 周辺情報

- 既存テンプレート: `cut-elimination-simple`（公理同士のカット）、`cut-elimination-implication`（含意のカット）、`cut-elimination-workspace`（ワークスペース証明のカット除去）
- カット除去アルゴリズム（cutElimination.ts）は (depth, rank) の二重帰納法
  - ランク0: カット式が片側にない → 弱化で除去
  - 基底ケース (d=1, r=1): ID公理同士のカット
  - ランク削減 (r≥2): 構造規則を通してMIXを押し上げ
  - 深さ削減 (d≥2, r=1): 論理規則の主式を分解
- サンドボックスで利用可能なAPI: `eliminateCutsWithSteps`, `isCutFree`, `countCuts`, `getScConclusion`, `formatSequent`, `displayScProof`, `parseFormula`

## テスト計画

- `templates.test.ts` に新テンプレートの構造検証テストを追加（既存パターンに従う）
- テンプレート自体はスクリプトコード文字列なので、id/title/description/code/compatibleStylesの存在と型を検証

## ストーリー計画

- UI変更なし（テンプレートコンテンツの追加のみ）。スクリプトライブラリパネルで表示されることをブラウザで確認
