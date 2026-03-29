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

- [x] PLAY-WS-01: `EmptyLukasiewicz` — 公理パレットからA1クリック→ノード追加→ノード存在確認（workspaceTestId追加、A1式は右結合最小括弧化 `φ → ψ → φ`）
- [x] PLAY-WS-02: `WithAxiomNodes` — ノードをダブルクリック→編集モード→式を変更→Tab→更新確認（workspaceTestId追加、dblClick→clear→type→tab→unicode確認）
- [x] PLAY-WS-03: `EmptyPredicateLogic` — 公理パレットからA4追加→ノード追加確認（workspaceTestId追加、A4式は `(∀x.φ) → φ[τ/x]`）
- [x] PLAY-WS-04: `WithGoal` — ゴールパネル確認（Identity/Not yet/0÷1）＋A1ノード確認＋A2追加（workspaceTestId追加）
- [x] PLAY-WS-05: `WithProofTree` — 3ノード確認＋MP結論(ψ→φ/DERIVED)確認＋ノードクリック選択（workspaceTestId追加）
- [x] PLAY-WS-06: `GroupTheoryWorkspace` — 群論固有公理G3L追加＋既存G1/G2ノード確認（workspaceTestId追加）

### 体系別空ワークスペースの操作テスト

- [x] PLAY-WS-07: `EmptyNaturalDeduction` — 「+ Add Assumption」クリック→ノード追加→「Assumption」テキスト確認
- [x] PLAY-WS-08: `EmptySequentCalculus` — 「+ Add Sequent」クリック→ノード追加→「Sequent」テキスト確認
- [x] PLAY-WS-09: `EmptyTableauCalculus` — 「+ Add Sequent」クリック→ノード追加→「Sequent」テキスト確認
- [x] PLAY-WS-10: `EmptyAnalyticTableau` — 「+ Add Signed Formula」クリック→ノード追加確認

### クエスト完了ストーリーの操作テスト

- [x] PLAY-WS-11: `QuestCompleteTab01` — 完了バナー＋タブロー木パネル確認（testIdベース、CSS text-transformに非依存）
- [x] PLAY-WS-12: `QuestCompleteSc01` — 完了バナー＋SCルールパレット確認（SC証明木はcut elimination内のみ表示のためルールパレットで代替）
- [x] PLAY-WS-13: `QuestCompleteAt01` — 完了バナー＋AT証明木パネル確認（goalPanelとの不整合は別途修正対象、waitForで非同期対応）

### モデルアンサーストーリーの操作テスト

- [x] PLAY-WS-14: `QuestCompleteProp01ModelAnswer` — 完了バナー＋全ノード存在＋Subst/MPエッジバッジ確認＋エッジバッジクリック（fitToContentでculling回避、ズーム縮小時はrole-badge省略されるため存在確認のみ）
- [x] PLAY-WS-15: `QuestCompleteProp42ModelAnswer` — 完了バナー＋全4ノード(公理名+role-badge)＋エッジバッジ3つ＋エッジバッジクリック（100%ズームで詳細確認可能）
- [x] PLAY-WS-16: `QuestCompleteEq01ModelAnswer` — 等式体系の完了状態確認＋ノードクリック（完了バナー＋ノード存在＋E2追加インタラクション。CIではdetailLevelがcompactになりrole-badge非表示のため存在チェックのみ）
- [x] PLAY-WS-17: `QuestCompleteGroup01ModelAnswer` — 群論モデルアンサー確認（完了バナー＋ノード存在＋G2L追加インタラクション）
- [x] PLAY-WS-18: `QuestCompletePeano01ModelAnswer` — ペアノモデルアンサー確認（完了バナー＋ノード存在＋PA2追加インタラクション）

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
- [x] PLAY-WS-24: `WithQuestVersionWarning` — 警告バナーのUIインタラクション（閉じるボタン等）テスト追加（閉じるボタン追加＋dismiss状態管理＋play関数でクリック→非表示確認）

## カテゴリ2: proof-pad デモストーリー（高優先）

### 証明ワークスペースデモ

- [x] PLAY-PP-01: `ScAutoProofDemo` — 自動証明の実行フロー確認（完了バナー＋ゴールパネル＋Add Sequent＋Identity規則クリック）
- [x] PLAY-PP-02: `ModelAnswerDemo` — 完了バナー＋ゴールパネル＋公理パレット操作（LargeProofはCIタイムアウト対策で簡素化）
- [x] PLAY-PP-03: `PropositionalDemo` — 各証明ワークスペースでノード操作（全4ストーリー: Basics/Intermediate/Negation/Advanced にゴールパネル＋公理パレット＋公理クリック追加）
- [x] PLAY-PP-04: `EqualityDemo` — 等式証明ワークスペースでのインタラクション（ゴールパネル＋公理パレットE2クリック追加）
- [x] PLAY-PP-05: `PredicateDemo` — 述語論理ワークスペースでのインタラクション（Basics/AdvancedにゴールパネルProved!確認＋公理パレットA4クリック追加）

### 表示コンポーネント（スキップ — display-only）

以下はdisplay-onlyコンポーネントのためインタラクションテスト不要。現状のexpectで十分:

- ScProofTreePanel（ツリー表示のみ）
- SignedFormulaDisplay（署名付き式表示のみ）
- SequentDisplay（シーケント表示のみ）

## カテゴリ3: InfiniteCanvas デモストーリー（中〜高優先）

### 高優先: インタラクティブ機能のテスト

- [x] PLAY-IC-01: `KeyboardShortcutsDemo` — クリック選択→Escape解除→Ctrl+A全選択→Delete削除
- [x] PLAY-IC-02: `MultiSelectionDemo` — クリック選択→Escape解除→モード切り替えボタン
- [x] PLAY-IC-03: `GridSnapDemo` — スナップトグルOFF/ON
- [x] PLAY-IC-04: `ObjectSnapDemo` — スナップトグルOFF/ON
- [x] PLAY-IC-05: `ConnectionPreviewDemo` — ポートの存在確認（ドラッグは自動テスト困難、既存play関数で十分）
- [x] PLAY-IC-06: `EdgeScrollDemo` — 初期状態確認（エッジスクロールの自動テスト困難、既存play関数で十分）

### 中優先: 基本的なキャンバス操作

- [x] PLAY-IC-07: `PannableCanvas` — キャンバス存在・カーソル確認済み（パンはpointerイベントで自動テスト困難）
- [x] PLAY-IC-08: `ZoomableCanvas` — キャンバス存在・カーソル確認済み（ズームはwheelイベントで自動テスト困難）
- [x] PLAY-IC-09: `DraggableItems` — アイテム存在・テキスト・カーソルスタイル確認済み
- [x] PLAY-IC-10: `ConnectionLines` — 接続パス3本＋アイテム存在・カーソル確認済み
- [x] PLAY-IC-11: `MinimapDemo` — ミニマップ・ビューポート・5アイテムサムネイル確認済み

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
