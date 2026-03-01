## 現在のタスク（from tasks/prd-inserted-tasks.md）

代入などのノードでの、それがどのように行われたか、というのが、 phi -> phi のようにレンダーされずそのまま表示されている。基本的にどこであっても入力するところ以外はKaTeXのレンダーが介されるべきだ。

## 調査結果

問題箇所: `EditableProofNode.tsx` の lines 517-530
- 代入エントリ（例: `φ := alpha -> beta`）がプレーンテキストで表示されている
- `metaVariableName` + `subscriptPart` + `:= ` + `formulaText/termText` を文字列結合して `<div>` に直接出力
- FormulaDisplay / TermDisplay を使うべき

## テスト計画
- `EditableProofNode.test.tsx` に代入エントリが `role="math"` で表示されるテストを追加
- 既存テスト: substitution entries の表示テストがあるか確認 → あれば更新

## ストーリー計画
- 既存の代入ストーリーで確認可能（新規作成不要）

## 実装計画
1. `EditableProofNode.tsx` の substitutionEntries 表示部分で:
   - `formulaText` を `parseString()` でパースし、成功時は `FormulaDisplay` で表示
   - `termText` を `parseTermString()` でパースし、成功時は `TermDisplay` で表示
   - パース失敗時はフォールバックとしてプレーンテキスト表示
   - metaVariableName はギリシャ文字なのでイタリック数式フォントで表示
