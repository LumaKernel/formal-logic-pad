## 現在のタスク

**出典:** `tasks/inserted-tasks.md` 1行目

> ページは基本的に移動した状態のスケルトン的な状態で待機するようにしよう (体験的に)。まずは瞬時に移動がしっかり起こるように。

**今回の集中タスク:** タブ切り替え時の瞬時遷移（HubContent再マウント防止）

### テスト計画

- `pathToTab` 純粋関数のユニットテスト（`src/app/hubRouting.ts` + `hubRouting.test.ts`）
- 既存テストが壊れないことを確認

### ストーリー計画

- UI変更なし（ストーリー追加不要）
- ブラウザで tab 切り替えが瞬時になることを確認

### 実装計画

1. `src/app/hubRouting.ts` に `pathToTab` 純粋関数を作成
2. `(hub)` route group layout を作成し、HubContent を配置
3. 既存の page.tsx ファイルを `(hub)/` に移動
4. HubContent から `initialTab` prop を削除、`usePathname()` で tab 決定
5. 各 page.tsx を最小化（null返却）
