from: tasks/inserted-tasks.md
task: 代入エントリをあとから編集する場合は、同じ論理式編集コンポーネントになっていない。

## 調査結果

- **初期作成バナー** (ProofWorkspace.tsx L5665-5703): FormulaEditor/TermEditorのデフォルトprops（editTrigger="click"）
  - 表示モードで開始→クリックで編集モードに入る必要がある
  - inputStyle未指定（暗い背景のまま）
- **編集ポップオーバー** (EdgeParameterPopover.tsx L336-377): editTrigger="none", forceEditMode={true}, inputStyle={substInputStyle}
  - 常に編集モード
  - 白背景+黒点線ボーダーで視認性良好

## テスト計画

- ProofWorkspace.test.tsx の既存代入テストが通ることを確認
- 新規テスト不要（既存のコンポーネントpropsの変更のみ、ロジック変更なし）

## ストーリー計画

- ProofWorkspace.stories.tsx の SubstitutionApplication ストーリーで視覚確認

## 実装計画

1. substPromptBannerのFormulaEditorに editTrigger="none", forceEditMode={true}, inputStyle={substInputStyle} を追加
2. substPromptBannerのTermEditorに同様の変更
3. substInputStyleは既にEdgeParameterPopoverで定義されているが、ProofWorkspace.tsx内にも同じスタイルを定義するか、共通化する
