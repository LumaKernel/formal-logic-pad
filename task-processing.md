## 実行中タスク

**出典:** `tasks/inserted-tasks.md` - 「ノートを開く、模範解答を開く、など」

> ページは基本的に移動した状態のスケルトン的な状態で待機するようにしよう (体験的に)。まずは瞬時に移動がしっかり起こるように。
> - [x] タブ切り替え: (hub) route group + usePathname() でHubContent再マウント防止
> - [ ] ノートを開く、模範解答を開く、など ← **今回のタスク**

### テスト計画

- loading.tsx は Server Component（純粋HTML/CSS）のため、ユニットテストは不要
- 既存のStorybook storiesは変更なし
- ブラウザでの動作確認（Playwright MCP）でスケルトン表示を検証

### ストーリー計画

- UI変更はスケルトン表示のみ（遷移中の一時的表示）。Storybook storyは不要
- ブラウザでのスクリーンショット検証で代替

### 実装計画

1. `src/app/workspace/[id]/loading.tsx` - ワークスペースページのスケルトン（ヘッダー + 空キャンバス）
2. `src/app/reference/[id]/loading.tsx` - リファレンスビューアのスケルトン
3. `src/app/(hub)/loading.tsx` - ハブページのスケルトン
4. 各 `page.tsx` の `dynamic()` に `loading` propを追加し、クライアントサイドローディングもスケルトン表示
