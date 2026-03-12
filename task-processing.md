# 現在のタスク

**出典:** `tasks/prd-non-hilbert.md`

## タスク

- [x] axiomsがないのにウィンドウはaxiomがある場所をよけたりする

## 調査結果

**問題なし（コード変更不要）。** 理由:

1. `computeNewNodePosition` の baseX=250 はパレット回避用。すべての体系（Hilbert/ND/SC/TAB/AT）に左側パレットがあり、同じ位置（left:12, top:48, minWidth:200）に配置される
2. `axiomPalettePos` によるGoal/Collectionパネルの重なり回避も、非Hilbertパレットが同位置なので正しく機能
3. 非Hilbertパレットはドラッグ不可だが、axiomPalettePos初期値(12,48)と一致するため問題なし

結論: 「axiomsがある場所をよける」は実質「左側パレットをよける」であり、すべての体系で正しい動作。
