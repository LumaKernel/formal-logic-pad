## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md`

- [] トップページのタブはハッシュではなく、ルートとして管理しよう

### 周辺情報

- 現状: `/#quests`, `/#custom-quests`, `/#collection`, `/#reference` のハッシュベース
- 目標: `/quests`, `/custom-quests`, `/collection`, `/reference` のルートベース
- HubContent.tsx が `parseTabFromHash` + `window.history.replaceState` でハッシュ管理
- HubPageView.tsx はプレゼンテーション層（`tab` prop + `onTabChange` callback）
- `/reference/[id]` ルートが既存 → `/reference/page.tsx` と共存可能

### テスト計画

- HubPageView.stories.tsx: `onTabChange` のテストは変更なし（プレゼンテーション層は変わらない）
- HubContent のルーティング部分はE2Eレベルの変更だが、ユニットテストではモック可能
- 既存テストが壊れないことを確認

### ストーリー計画

- HubPageView.stories.tsx は変更不要（プレゼンテーション層のインターフェース変更なし）
- HubContent は `"use client"` + `dynamic import` なのでストーリー対象外
