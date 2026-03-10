# タスク: URL パス割り当て

**出典:** `tasks/prd-2026-03-10.md` 1行目

> http://localhost:13000/ ノートブック、クエストタブ、それぞれにパスを割り当ててほしい。

## 現状分析

- HubPageView はタブ状態を `useState<HubTab>("notebooks")` で管理（URLに反映されない）
- HubContent がルーター・searchParams 等の不純な依存を持つ層
- `?quest=` クエリパラメータは既にクエスト共有で使用中
- Next.js App Router のファイルベースルーティング

## 実装方針

ハッシュベースのタブルーティングを採用する:

- `/#notebooks` → ノートブックタブ
- `/#quests` → クエストタブ
- `/` (ハッシュなし) → デフォルト: ノートブックタブ

理由:

- `?tab=` クエリパラメータは `?quest=` と競合しうるため避ける
- Next.js のファイルベースルーティングで `/quests/` ページを作ると HubPageView の分割が必要（過度な変更）
- ハッシュベースはサーバーサイドレンダリングに影響しない（SSR は `ssr: false` で無効化済み）
- ブラウザの戻る/進むで自然にタブが切り替わる

## 変更ファイル

1. `src/app/HubPageView.tsx` — `onTabChange` コールバック追加、`tab` を制御コンポーネント化
2. `src/app/HubContent.tsx` — ハッシュからタブ状態を読み取り・書き込み
3. `src/app/HubPageView.stories.tsx` — テスト更新（tab/onTabChange props）

## テスト計画

- `src/app/HubPageView.stories.tsx` の既存ストーリーに `tab`/`onTabChange` props を追加
- HubPageView は純粋プレゼンテーション層なので、ハッシュ連動は HubContent 側の責務
- ストーリーのタブ切り替えテスト（Tab Switch）を更新

## ストーリー計画

- 既存の Tab Switch ストーリーが正しく動作することを確認
- 新しいストーリーは不要（既存ストーリーの props 更新のみ）
