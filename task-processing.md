## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` 行6

**タスク:** UIの公理A4を `(∀x.φ) → φ` から `(∀x.φ) → φ[τ/x]` に修正する

### テスト計画

- axiomPaletteLogic.test.ts: A4の unicode表示とdslTextの期待値を更新
- inferenceRule.test.ts: axiomA4Templateの検証テストがあれば更新
- ストーリーのplay関数でA4表示を確認

### ストーリー計画

- UI変更なし（テンプレートの値変更のみ、AxiomPaletteコンポーネント自体は変更不要）
- 既存のAxiomPaletteストーリーでA4表示が更新されることを確認
