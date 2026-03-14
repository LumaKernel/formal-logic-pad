from: tasks/prd-inserted-tasks.md
task: リファレンスの上のほうに、入門者はこちらから、これを学ぶならここから、のように章だてのガイドの起点となるものを並べよう。

## テスト計画
- referenceBrowserLogic.test.ts: ガイドエントリ抽出関数のテスト追加
- ReferenceBrowserComponent.test.tsx: ガイドセクション表示、クリックでモーダル表示のテスト追加

## ストーリー計画
- HubPageView.stories.tsx のReferenceTabストーリーで視覚確認（既存で十分）

## 実装計画
1. referenceBrowserLogic.ts: guideカテゴリのエントリを抽出する純粋関数を追加
2. ReferenceBrowserComponent.tsx: 検索バーの上にガイドセクションを追加
   - guideカテゴリのエントリをorder順にカード表示
   - カードクリックでモーダル表示（既存のdetailEntryId機構を利用）
   - 検索/フィルタ中はガイドセクションを非表示にする
