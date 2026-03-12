# 現在のタスク

**出典:** `tasks/prd-non-hilbert.md`

## タスク

- [ ] MP適用などがすべて出てくるが、これも正しいのか？上部メニューやコンテキストメニューはノートの体系によって変わるべきではないか

## 調査結果

ProofWorkspace.tsx の以下のUI要素がHilbert体系以外でも表示されている:
1. **MPボタン** (line ~4196): 常に表示される → Hilbert以外では非表示にすべき
2. **MPコンテキストメニュー** (line ~5278-5300): "Use as MP Left/Right" が常に表示 → Hilbert以外では非表示にすべき
3. **Genボタン** (line ~4230): `workspace.system.generalization` で制御 → すでに非Hilbertでは非表示（emptyLogicSystemは generalization: false）
4. **Genコンテキストメニュー** (line ~5301-5313): 同上

## テスト計画

- ProofWorkspace.test.ts に非Hilbert体系でのMP/Gen非表示テストを追加
  - ND体系ワークスペースでMPボタンが表示されないこと
  - ND体系ワークスペースでコンテキストメニューにMP項目がないこと
- 既存のHilbert体系テストが引き続きパスすることを確認

## ストーリー計画

- 既存のNDストーリーでMP非表示を確認
- 必要に応じて新ストーリー追加
