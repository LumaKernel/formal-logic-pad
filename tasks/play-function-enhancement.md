# play関数強化タスク

expectのみでユーザーインタラクションがないplay関数を、インタラクションテストに強化する。
display-onlyコンポーネントはスキップし、interactiveコンポーネントのみ対象とする。

## 前提知識

- InfiniteCanvasのドラッグ・パン・ズームはpointer/wheelイベントベース。Storybook play関数からの自動テストが困難な場合がある
- `isNodeCulled()` によりビューポート外ノードはDOM除外される。ノード座標は x:0-600, y:0-250 に収めること
- CI Storybookテストのタイムアウトは15秒。複雑なインタラクションは分割ストーリーで対応

## カテゴリ1: WorkspacePageView ストーリー（高優先）

WorkspacePageView.stories.tsx 内のassertionのみストーリーにインタラクションを追加する。

### 基本ワークスペースの操作テスト

- [-] PLAY-WS-01: `EmptyLukasiewicz` — 公理パレットからA1クリック→ノード追加→ノード存在確認
- [ ] PLAY-WS-02: `WithAxiomNodes` — ノードをダブルクリック→編集モード→式を変更→Tab→更新確認
- [ ] PLAY-WS-03: `EmptyPredicateLogic` — 公理パレットから公理追加→ノード追加確認
- [ ] PLAY-WS-04: `WithGoal` — ゴールパネルの初期状態確認＋公理操作で変化確認
- [ ] PLAY-WS-05: `WithProofTree` — ツリーレイアウトが表示されるか確認（既にノードあり）
- [ ] PLAY-WS-06: `GroupTheoryWorkspace` — 群論公理パレットからの追加操作

### 体系別空ワークスペースの操作テスト

- [ ] PLAY-WS-07: `EmptyNaturalDeduction` — 「仮定を追加」→ノード追加→式編集→ND規則パレットの連動確認
- [ ] PLAY-WS-08: `EmptySequentCalculus` — 「シーケントを追加」→ノード追加→式編集
- [ ] PLAY-WS-09: `EmptyTableauCalculus` — 「シーケントを追加」→ノード追加→式編集
- [ ] PLAY-WS-10: `EmptyAnalyticTableau` — 「式を追加」→ノード追加→式編集

### クエスト完了ストーリーの操作テスト

- [ ] PLAY-WS-11: `QuestCompleteTab01` — 完了バナーの表示確認＋ノードクリックで選択状態確認
- [ ] PLAY-WS-12: `QuestCompleteSc01` — 完了バナーの表示確認＋ノードクリックで選択状態確認
- [ ] PLAY-WS-13: `QuestCompleteAt01` — AT系のスタンドアロンノード未達成確認（現在の確認強化）

### モデルアンサーストーリーの操作テスト

- [ ] PLAY-WS-14: `QuestCompleteProp01ModelAnswer` — 完了バナー確認＋ノードクリック＋推論エッジバッジ確認
- [ ] PLAY-WS-15: `QuestCompleteProp42ModelAnswer` — 完了バナー確認＋ノード数確認
- [ ] PLAY-WS-16: `QuestCompleteEq01ModelAnswer` — 等式体系の完了状態確認＋ノードクリック
- [ ] PLAY-WS-17: `QuestCompleteGroup01ModelAnswer` — 群論モデルアンサー確認
- [ ] PLAY-WS-18: `QuestCompletePeano01ModelAnswer` — ペアノモデルアンサー確認

### FullFlowストーリーの完全証明化（最重要）

現在SC/TAB/ATのFullFlowストーリーはスタンドアロンノード未達成の確認のみ。
実際に推論規則を適用して証明を完成させるフローに拡張する。

- [x] PLAY-WS-19: `QuestCompleteSc01FullFlow` — SC推論規則適用→証明完成→ゴール達成のフルフロー（implication-right + identity）
- [x] PLAY-WS-20: `QuestCompleteTab01FullFlow` — TAB推論規則適用→証明完成→ゴール達成のフルフロー（¬→規則 + BS規則で完成）
- [x] PLAY-WS-21: `QuestCompleteAt01FullFlow` — AT推論規則適用→証明完成→ゴール達成のフルフロー（goalCheckLogicにAT署名付き論理式サポート追加）
- [x] PLAY-WS-22: FromHub系ストーリーも証明完成フローに拡張完了（TAB/SC/AT全完了）

### UI導線の不足確認・追加

FullFlowストーリーを書く上で、play関数からクリックベースで操作できない機能がある場合:

- [ ] PLAY-WS-23: SC/AT規則適用がクリックのみで完結するか確認。不足があればコンテキストメニューに追加（TABは確認済み: パレット→ノードクリック→RulePromptModal→完結）
  - 例: SC規則の選択→前提シーケントの指定→結論シーケントの生成がすべてクリックで操作可能か
- [ ] PLAY-WS-24: `WithQuestVersionWarning` — 警告バナーのUIインタラクション（閉じるボタン等）テスト追加

## カテゴリ2: proof-pad デモストーリー（高優先）

### 証明ワークスペースデモ

- [ ] PLAY-PP-01: `ScAutoProofDemo` — 自動証明の実行フロー確認（ボタンクリック→結果表示）
- [ ] PLAY-PP-02: `ModelAnswerDemo` — ノードクリック→選択→推論エッジ確認
- [ ] PLAY-PP-03: `PropositionalDemo` — 各証明ワークスペースでノード操作
- [ ] PLAY-PP-04: `EqualityDemo` — 等式証明ワークスペースでのインタラクション
- [ ] PLAY-PP-05: `PredicateDemo` — 述語論理ワークスペースでのインタラクション

### 表示コンポーネント（スキップ — display-only）

以下はdisplay-onlyコンポーネントのためインタラクションテスト不要。現状のexpectで十分:

- ScProofTreePanel（ツリー表示のみ）
- SignedFormulaDisplay（署名付き式表示のみ）
- SequentDisplay（シーケント表示のみ）

## カテゴリ3: InfiniteCanvas デモストーリー（中〜高優先）

### 高優先: インタラクティブ機能のテスト

- [ ] PLAY-IC-01: `KeyboardShortcutsDemo` — Delete/Ctrl+A/Escape/Arrowキーの動作確認
  - 前提: canvasにfocusしてからキーボードイベント送信
- [ ] PLAY-IC-02: `MultiSelectionDemo` — アイテムクリック→選択→選択数表示更新→Escapeで解除
- [ ] PLAY-IC-03: `GridSnapDemo` — スナップトグルボタンのクリック→状態変化確認
- [ ] PLAY-IC-04: `ObjectSnapDemo` — スナップトグルボタンのクリック→状態変化確認
- [ ] PLAY-IC-05: `ConnectionPreviewDemo` — ポートの存在確認（ドラッグは自動テスト困難）
- [ ] PLAY-IC-06: `EdgeScrollDemo` — 初期状態確認（エッジスクロールの自動テストは困難）

### 中優先: 基本的なキャンバス操作

- [ ] PLAY-IC-07: `PannableCanvas` — キャンバス存在確認（パンはpointerイベントで自動テスト困難）
- [ ] PLAY-IC-08: `ZoomableCanvas` — キャンバス存在確認（ズームはwheelイベントで自動テスト困難）
- [ ] PLAY-IC-09: `DraggableItems` — アイテム存在確認＋カーソルスタイル確認
- [ ] PLAY-IC-10: `ConnectionLines` — 接続パス存在確認
- [ ] PLAY-IC-11: `MinimapDemo` — ミニマップ表示確認

### スキップ（display-only または既に十分）

- ConnectorPorts（ジオメトリ検証が既に十分）
- CanvasItemPlacement（display-only）
- ProofTree（ジオメトリ検証が既に十分）

## カテゴリ4: formula-input / truth-table（スキップ）

以下はすべてdisplay-onlyコンポーネントのためスキップ:

- TruthTableComponent
- TermDisplay / TermKaTeX
- FormulaDisplay / FormulaKaTeX

## 実装上の注意

1. **1ストーリーずつ**: 各タスクは独立して実装可能。1イテレーション1ストーリー
2. **UI導線の確認**: FullFlowを書く前にその操作がクリックベースで可能か確認
3. **タイムアウト**: CIの15秒制限を意識。複雑なフローは分割
4. **座標制限**: ノード座標は x:0-600, y:0-250 に収める
5. **ドラッグ/パン/ズーム**: pointerイベントベースの操作はplay関数での自動テストが困難な場合がある。ボタン/キーボードショートカット経由でテスト可能な部分に注力
