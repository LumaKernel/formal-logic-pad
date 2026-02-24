## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` 4行目

> ノードのひっかけるところが浮いた位置にある。storyのplayでcomputedなノードの右端とかと、丸ちょんが実際に近い位置関係にあるか、とかもテストするといいかもね。

### 周辺情報

- ConnectorPortComponent が「丸ちょん」（コネクタポート）
- CanvasItem のレンダリング位置に対して、ポートが正しい位置にあるかの検証
- ストーリーの play 関数で getBoundingClientRect 等を使って位置関係をテストする
