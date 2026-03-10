# タスク: 自作クエストを独立タブとして分離

**出典:** `tasks/prd-2026-03-10.md` 2行目

> 結局自作クエストはどこ??? 自作クエストタブができる想定なんだけど。

## 調査結果

- 自作クエストは現在クエストタブ内のセクションとして表示（QuestCatalogの下にCustomQuestList）
- 元のPRD（prd-custom-quests.md）は「ビルトインクエストとは別枠で管理」と記載、独立タブは明記されていなかった
- しかしユーザーの現在の要望は独立タブ化

## 実装方針

`HubTab` を 2値→3値に拡張: `"notebooks" | "quests" | "custom-quests"`

- `/#custom-quests` → 自作クエストタブ
- タブバーに3つ目のタブ「自作クエスト」を追加
- クエストタブからCustomQuestListを除去し、custom-questsタブに移動

## 変更ファイル

1. `src/app/HubPageView.tsx` — HubTab拡張、3つ目のタブUI、コンテンツ分岐
2. `src/app/HubContent.tsx` — parseTabFromHash に "custom-quests" 追加
3. `src/app/HubPageView.stories.tsx` — 新タブ用ストーリー追加
4. `src/app/hubMessages.ts` — タブラベルメッセージ追加
5. `src/app/HubMessagesContext.tsx` — 型更新（必要に応じて）
6. `messages/en.json`, `messages/ja.json` — i18n メッセージ追加

## テスト計画

- 既存のWithCustomQuests/WithEmptyCustomQuestsストーリーを `tab: "custom-quests"` に更新
- TabSwitchストーリーに3タブ切り替えテスト追加

## ストーリー計画

- CustomQuestsTab ストーリー（自作クエストタブ単体表示）
