## 現在のタスク

**元ファイル:** `tasks/prd-theories.md`

### リファレンスUIコンポーネント

- [ ] `ReferencePopover` コンポーネント: (?)マーク等のクリックで解説ポップオーバー表示
- [ ] `ReferenceModal` コンポーネント: 詳細リファレンス表示
- [ ] マークダウンレンダリング (KaTeX数式サポート含む)
- [ ] Storybookストーリー + play関数

### 周辺情報

- `src/lib/reference/` にリファレンスデータモデルは既に完成済み
- `ReferenceEntry` 型定義: id, 多言語テキスト(en/ja)、パラグラフ単位のマークダウン、カテゴリ、関連リンク
- `ReferenceCategory`: axiom, inference-rule, logic-system, notation, concept 等
- 検索・フィルタリングの純粋ロジックも実装済み
- リファレンスコンテンツ(公理、推論規則、論理体系、記法・記号)もすべて実装済み
