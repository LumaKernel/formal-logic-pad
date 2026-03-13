## タスク: パッド内の各種アクションをするための起点、ボタンなど
- 出典: tasks/prd-inserted-tasks.md

### 対象ファイル (9)
- EdgeParameterPopover.tsx: popoverStyle, inputStyle, buttonStyle, confirmButtonStyle
- NdRulePalette.tsx: panelStyle, headerStyle, addButtonStyle, sectionHeaderStyle, ruleItemStyle
- CutEliminationStepper.tsx: panelStyle, headerStyle, controlsStyle, buttonStyle, disabledButtonStyle, etc.
- GoalPanel.tsx: ~20+ CSSProperties, toggleButtonStyle, hintToggleStyle, itemClickableStyle
- EditableProofNode.tsx: axiomNameBadgeClickableStyle, containerStyle
- AxiomPalette.tsx: panelStyle, headerStyle, itemStyle, itemHoverStyle, etc.
- AtRulePalette.tsx: addButtonStyle
- ScRulePalette.tsx: addButtonStyle
- TabRulePalette.tsx: addButtonStyle

### テスト計画
- 既存テストが通ることを確認（スタイル変更のみなのでテスト追加は不要）
- カバレッジが低下しないことを確認

### ストーリー計画
- 既存ストーリーのブラウザ確認（変更後にスクリーンショット撮影）

### 方針
- ボタン/アクション関連のCSSPropertiesをTailwindクラスに変換
- パネル全体のスタイルも含めて変換（アクション起点であるパネル自体のスタイルも対象）
- hover状態のObject.assignパターン → Tailwind hover:クラスに変換
- disabled状態 → Tailwindクラス + 条件分岐
- 動的position overrides（resolvedPanelStyle）はCSSProperties維持（runtime値のため）
