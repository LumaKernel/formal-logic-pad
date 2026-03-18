## 実行中タスク

**出典:** `tasks/prd-non-hilbert.md` — タブロー法 (TAB) セクション

> - [ ] 証明木/反駁木の視覚的フロー表示

### 周辺情報

- SC の証明木パネル（ScProofTreePanel + scProofTreeRendererLogic）が参考パターン
- TAB は上から下へ展開するタブローツリー（SC の Gentzen スタイルとは逆方向）
- 分岐規則（¬∧, ∨, →）でツリーが二股に分かれる
- 公理（BS, ⊥）で枝が閉じる
- TabProofNode の discriminated union が logic-core/tableauCalculus.ts に定義済み

### テスト計画

- `tabProofTreeRendererLogic.test.ts`:
  - 公理ノード（BS, ⊥）の変換
  - 単項規則（¬¬, ∧, ¬∨, ¬→）の変換
  - 分岐規則（¬∧, ∨, →）の変換
  - 深いツリーの統計計算
  - 規則ラベル変換の網羅テスト

### ストーリー計画

- `TabProofTreePanel.stories.tsx`:
  - 単純な公理のみ
  - 単項規則チェーン
  - 分岐あり証明木
  - play 関数でノード存在・規則ラベル確認
