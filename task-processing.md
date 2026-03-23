## 現在のタスク

**出典:** `tasks/inserted-tasks.md`

- [-] Next.jsの機能を用いた最適化
  - [ ] antd → 軽量代替（Button/Tabs/Menu/ConfigProvider/Icons のみ使用 → 自前実装+Tailwind）

### コンテキスト

- antd は 1.0MB×2チャンク (gzip 304KB×2)
- 使用コンポーネント: Button(11箇所), Tabs(1), Menu+MenuProps(2), ConfigProvider+theme(1), Icons(3)
- 全て基本的なUIコンポーネントで自前実装可能
- Tailwind CSS は既にプロジェクトに導入済み

### 置換計画

1. Button → `<button>` + Tailwind class (type="primary" は blue background)
2. Tabs → 自前タブコンポーネント（activeKey, onChange, items）
3. Menu (dropdown) → 自前ドロップダウンメニュー
4. ConfigProvider + theme → CSS variables でダーク/ライト切替（既存ThemeProviderで十分）
5. Icons → SVG インライン or lucide-react

### テスト計画

- 既存テスト・Storybookテスト全通過確認
- カバレッジ低下なし
- Storybook スクリーンショットで見た目確認

### ストーリー計画

- 既存ストーリーで確認（新規追加不要）
