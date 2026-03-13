## 現在のタスク

**ソース:** `tasks/prd-docs-contents.md` > 1. 超入門・このサイトの使い方

- `[ ] [guide] 最初のクエスト（prop-01）を解いてみよう — ステップバイステップのチュートリアル`

### 周辺情報

- Phase 1（超入門・最優先）の3番目のガイド
- 既存ガイド2件: `guide-what-is-formal-proof`(order:1), `guide-basic-operations`(order:2)
- prop-01: φ→φの証明。Łukasiewicz体系、A1(K),A2(S)+MPの5ステップ
- 模範解答: A2→A1→MP→A1→MP (SKK=I対応)

### テスト計画

- `referenceContent.test.ts` のエントリ数を更新（+1）
- 新ガイドの段落数 en/ja 一致テストは既存の汎用テストでカバーされる

### ストーリー計画

- UI変更なし（データ追加のみ）。既存のReferenceModal/ReferencePopoverストーリーで表示確認
