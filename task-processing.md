## タスク (from tasks/prd-inserted-tasks.md)

bug: ノートノードが、キャンバスのスクロールの右端にきたらそれにつられてwrapされてしまいます。

### 原因分析

- `CanvasItem.tsx` (line 185) に `whiteSpace: "nowrap"` がある
- CanvasItem は `position: absolute` + `left`/`top` で配置される
- 親の InfiniteCanvas コンテナは `overflow: hidden` + `position: relative`
- CSS仕様: `position: absolute` で `left` のみ指定（`right` なし）の場合、`width` は shrink-to-fit で計算され、available width は containing block の幅 - left になる
- ノートノードが右端近くにあると available width が狭くなり、shrink-to-fit の結果として幅が小さくなる
- ノートテキストの `pre-wrap` + `maxWidth: 240` が狭い available width 内で折り返される

### 修正方針

- `CanvasItem.tsx` に `width: "max-content"` を追加する
- これにより absolute 要素の幅がコンテナの残り幅に制約されず、コンテンツの自然な最大幅になる
- 全ノード（数式ノード含む）に影響するが、数式ノードは `whiteSpace: "nowrap"` で元々1行なので影響なし

### テスト計画

- `CanvasItem.test.tsx` に「右端配置時にサイズが制約されない」テストを追加
- 既存テストが壊れないことを確認

### ストーリー計画

- 既存ストーリーで確認（新規ストーリーは不要）
- ブラウザでノートノードを右端に配置して確認
