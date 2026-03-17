## 実行中タスク

**ソース**: `tasks/prd-inserted-tasks.md` lines 33-34

> - [ ] UIは真に(all x. phi) -> phi[τ/x]のみであるべきで、この形とメタ変数の差を除いて認識しなくていい
> - [ ] UIは真に(all x. phi) -> phi[τ/x]が、ノードとして呼び出したときに表れるべきである

### テスト計画

- `axiomPaletteLogic.test.ts`: A4のdslTextが`(all x. phi) -> phi[tau/x]`であることを検証
- `axiomNameLogic.test.ts`: A4テンプレートの識別テストが新dslTextで動作確認
- 既存テストが壊れないことの確認（模範解答等でA4 dslTextを参照している箇所）

### ストーリー計画

- `AxiomPalette.stories.tsx`: A4表示が`(∀x.φ) → φ[τ/x]`になっていることをスクリーンショットで確認

### 実装計画

1. `axiomPaletteLogic.ts`: A4のdslTextを`"(all x. phi) -> phi[tau/x]"`に変更
2. 影響範囲調査: dslTextを参照している箇所（模範解答、スクリプト等）の同期
3. テスト・品質チェック
