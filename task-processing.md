from: tasks/prd-inserted-tasks.md
task: かっこいいfaviconを作って置き換えて。アップバーのタイトルブランドもテーマにちなんだ形にかっこいいものに

## テスト計画
- HubPageView.stories.tsx のplay関数でブランドアイコンの存在確認
- 既存テストが壊れないことを確認

## ストーリー計画
- HubPageView.stories.tsx でブランド変更の視覚確認（既存ストーリーで十分）

## 実装計画
1. SVGファビコンを作成（形式ロジックのテーマ：ターンスタイル⊢をモチーフに）
2. src/app/favicon.ico を新しいSVGベースのものに置き換え
3. apple-touch-icon.png も追加
4. アップバーのブランドアイコンをカスタムSVGに変更（Sigma→テーマに合ったもの）
