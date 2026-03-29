# 差し込みタスク

- [ ] タブローもシーケント計算と同様に、論理式単体ではなく、論理式の列を持つのだから、それに合わせた内部構造の持ちかた、レンダリング、編集UIをそれぞれ提供するように変更すべき
  - 以前のシーケント計算での ΓとΔ を保持するようなやり方を参照せよ
  - [x] TABノードが直接TabExpandedEditor（FormulaListEditor利用）を開くようにする — FormulaEditor.directExpandedOpen + TabExpandedEditor + ProofWorkspaceでのモーダル分岐
  - [-] TAB用の表示コンポーネント（FormulaListDisplayなど）を追加し、レンダリングを改善
  - [ ] 消費者側がformulaTextsを直接参照するように移行（formulaTextの再パースを避ける）
