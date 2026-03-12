# 現在のタスク

**元ファイル**: `tasks/prd-inserted-tasks.md`

## タスク

- [-] 置換のところの論理式入力は、普通に、論理式ノードと同様の編集コンポーネントを利用して、クリックで編集、拡張編集やヘルプ、とできればよいが、なぜ統一れていない??

## 周辺情報

EdgeParameterPopover の substitution 入力が生の FormulaInput / TermInput を使用しており、証明ノードで使用される FormulaEditor の機能（クリックで編集/表示切替、構文ヘルプボタン、拡張エディタボタン）がない。

### 現状分析

| コンポーネント | 場所 | クリック編集 | 構文ヘルプ | 拡張エディタ | プレビュー |
|---|---|---|---|---|---|
| FormulaEditor | formula-input/ | ✓ | ✓ | ✓ | ✓ |
| FormulaInput | formula-input/ | ✗ | ✗ | ✗ | オプション |
| TermInput | formula-input/ | ✗ | ✗ | ✗ | オプション |
| EdgeParameterPopover (代入) | proof-pad/ | ✗ | ヘッダのみ | ✗ | ✗ |

TermEditor（FormulaEditor の Term 版）が存在しない。

## テスト計画

1. **TermEditor の単体テスト** (`TermEditor.test.tsx`)
   - 表示モード/編集モードの切替
   - パースエラー時の編集モード保持
   - 構文ヘルプボタン表示/クリック
   - テストパターンは FormulaEditor.test.tsx と同様
2. **editorLogic.test.ts の更新** — TermParseState でも canExitEditMode / computeExitAction が動作することのテスト追加
3. **EdgeParameterPopover.test.tsx の更新**
   - FormulaEditor / TermEditor 経由のテスト（testId パターンが変わる可能性に注意）

## ストーリー計画

1. **TermEditor.stories.tsx** — 基本表示、編集、エラー、構文ヘルプのストーリー
2. **EdgeParameterPopover.stories.tsx** — 新しいエディタUIの確認（作成が必要）

## 実装計画

1. editorLogic.ts を汎化（FormulaParseState | TermParseState を受け付けるように）
2. TermEditor.tsx を作成（FormulaEditor と同様の構造）
3. EdgeParameterPopover.tsx の FormulaInput → FormulaEditor、TermInput → TermEditor に置換
4. ポップオーバー内のヘッダ構文ヘルプボタンを削除（各フィールドに移動するため）
5. index.ts にエクスポート追加
