## タスク（inserted-tasks.md より）

論理式入力のカーソルが、シンタックスエラー状態のとき、実際の文字の位置とズレている

## 原因

FormulaInput.tsx のオーバーレイ構造で、inputは `border: 1px solid` を持つが
highlightContainerStyle は border がない。inputが absolute 配置された時に
テキスト開始位置が 1px ずれる。

## テスト計画

- 既存の FormulaInput.test.tsx テストが通ることを確認
- ブラウザでエラー入力ストーリーを確認し、カーソル位置が文字位置と一致することを検証

## ストーリー計画

- 既存の FormulaInput ErrorInput ストーリーで確認
