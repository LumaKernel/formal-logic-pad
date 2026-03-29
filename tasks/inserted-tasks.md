# 差し込みタスク

- [-] 以前、シーケント計算は ΓとΔのそれぞれの列を内部で持つと話した。
  - [x] いきなりシーケント編集モーダルが開いてよい。 — FormulaEditor.enterEditModeでallowSequentText時に直接onOpenExpanded()を呼ぶ実装済み。play関数はcreatePortal対応でscreen使用
  - [x] 内部的にテキストとして保持しているなら、それをやめる — WorkspaceNodeにsequentTexts(antecedentTexts/succedentTexts配列)を追加。addNode/updateNodeFormulaTextで自動ポピュレート。シリアライゼーション対応済み
  - [ ] わざわざ一度テキスト形式を経由しているなら、それをやめる
- [ ] タブローもシーケント計算と同様に、論理式単体ではなく、論理式の列を持つのだから、それに合わせた内部構造の持ちかた、レンダリング、編集UIをそれぞれ提供するように変更すべき
  - 以前のシーケント計算での ΓとΔ を保持するようなやり方を参照せよ

- [x] 恒等律の反駁 (→) (模範解答) ← QuestCompleteTab01FromHubストーリーで全フロー（Hub→クエスト開始→証明構築→ゴール達成）をクリックベースのplay関数で実装済み。play-function-enhancement.md全47タスクも完了・アーカイブ済み
