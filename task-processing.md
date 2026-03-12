## 実行中タスク

**ソース:** `tasks/prd-docs-improve.md` 行4-5

- ドキュメントそれぞれも専用のパスで、ひろびろと開けるように
- ?で開いたときも、アイコンボタンなどで新規タブで上記の専用のビュアーページに行けるようにしよう

### テスト計画

- `src/lib/reference/referenceViewerLogic.ts` → `referenceViewerLogic.test.ts`: ビューアーページの純粋ロジック（パンくず、ナビゲーション、URL生成）
- `src/app/reference/ReferenceViewerPageView.test.tsx`: ビューアーページコンポーネントのunit test
- `src/lib/reference/ReferencePopover.test.tsx`: 「新規タブで開く」ボタンの追加テスト
- `src/lib/reference/ReferenceModal.test.tsx`: 「新規タブで開く」ボタンの追加テスト
- `src/lib/reference/ReferenceBrowserComponent.test.tsx`: エントリクリック時のナビゲーションテスト

### ストーリー計画

- `src/app/reference/ReferenceViewerPageView.stories.tsx`: ビューアーページのストーリー（Default, Japanese, WithRelatedEntries, WithExternalLinks）
- `src/lib/reference/ReferenceModal.stories.tsx`: 「新規タブで開く」ボタン追加のストーリー更新
- `src/lib/reference/ReferencePopover.stories.tsx`: 「新規タブで開く」ボタン追加のストーリー更新

### 実装計画

1. **ルーティング:** `src/app/reference/[id]/page.tsx` を追加（Next.js App Router）
2. **純粋ロジック:** `referenceViewerLogic.ts` - URL生成、パンくずデータ、ナビゲーションヘルパー
3. **ビューアーページ:** `ReferenceViewerPageView.tsx` - エントリのフルビュー（ReferenceModalの内容をページレイアウトで表示）
4. **コントローラー:** `ReferenceViewerContent.tsx` - 不純層（useParams, allReferenceEntries取得）
5. **既存コンポーネントへの「新規タブで開く」ボタン追加:**
   - ReferencePopover: アイコンボタン追加
   - ReferenceModal: アイコンボタン追加
   - ReferenceBrowserComponent: エントリクリックで直接ナビゲーション or モーダルの選択肢
