## 実行中タスク

**出典:** `tasks/inserted-tasks.md` 7-8行目

> 代入エントリのモーダルは記号によってはハイライトが見づらい。論理式入力の背景は常に白にしよう。黒点線でクリック可能なことを常にアピール

### 原因分析

FormulaInput/TermInputの`inputBaseStyle`は`backgroundColor: "var(--color-surface)"`を使用。
ダークモードでは`--color-surface: #1e1e2e`となり、一部のシンタックスハイライト色（特にconnective, negation等の暗い色）が背景と同化して見づらい。

### 修正方針

1. FormulaInput/TermInputに`inputStyle`プロップを追加し、入力要素のスタイルをオーバーライド可能にする
2. FormulaEditor/TermEditorでも同プロップをスルーパスする
3. EdgeParameterPopoverで白背景 + 黒点線ボーダーを指定

### テスト計画

- EdgeParameterPopover.test.tsx: 代入入力欄に白背景・点線ボーダーが適用されることを確認
- FormulaInput: inputStyleプロップが入力要素に反映されることを確認

### ストーリー計画

- EdgeParameterPopover.stories.tsx のSubstitutionストーリーで視覚確認
