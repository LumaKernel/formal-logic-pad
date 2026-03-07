# 実行中タスク

## タスク元: `tasks/prd-custom-quests.md`

### 対象タスク

- [ ] URL形式でのクエスト共有（URLにクエスト定義をエンコード）
- [ ] 共有されたクエストを受け取った場合の選択肢:
  - いきなりクエストノートとして開始する
  - 自作クエストにまず追加してから開始する

### 周辺情報

- 既にJSONエクスポート/インポートは実装済み (`exportCustomQuestAsJson`, `importCustomQuestFromJson`)
- エクスポート形式: `{ _format: "intro-formal-proof-quest", _version: 1, quest: SerializedCustomQuest }`
- カスタムクエストID: `custom-TIMESTAMP` 形式
- 基本的なflowはHubContent.tsxで管理

### テスト計画

1. **純粋ロジックテスト** (`customQuestState.test.ts` に追加):
   - `encodeQuestToUrlParam(quest)` → URL-safe文字列に変換するテスト
   - `decodeQuestFromUrlParam(param)` → 文字列からクエスト定義を復元するテスト
   - ラウンドトリップテスト（encode → decode → 元と一致）
   - 不正な入力に対するエラーハンドリングテスト
2. **UI統合テスト** (HubPageView.stories.tsx or 新ストーリー):
   - URL共有ボタンのクリック→URLがクリップボードにコピーされる
   - URLパラメータ付きでアクセス→ダイアログ表示
   - ダイアログからクエスト開始/自作追加の選択

### ストーリー計画

- HubPageView.stories.tsx に共有URLからの受取フローのストーリーを追加
- CustomQuestListComponent.stories.tsx に共有URLコピーのストーリーを追加

### 実装方針

1. URLエンコード: JSON → deflate圧縮 → base64url エンコード → URLクエリパラメータ `?quest=`
2. URLデコード: パラメータ取得 → base64url デコード → inflate → JSON → バリデーション
3. 受取UI: ダイアログで「クエスト開始」「自作に追加」「キャンセル」の3択
4. 圧縮はブラウザネイティブ `CompressionStream` (不純) を避け、純粋な実装を使う → deflate は外部依存なので、base64url のみで実装する方が適切
   → **方針: JSON → base64url エンコードのみ（圧縮なし）。URLが長くなるが、シンプルで純粋**
