## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` line 12

> - [ ] Unnamedであっても自動でワークスペース全体の状態として自動保存して、失われない、途中から作業できるように

### 今回のスコープ

ワークスペース状態のシリアライゼーション（scriptWorkspacePersistence.ts）を作成する:

- WorkspaceState の JSON シリアライゼーション/デシリアライゼーション
- savedScriptsLogic.ts と同様のパターン（STORAGE_KEY, serialize, deserialize）
- ライブラリタブの復元時はテンプレートIDから再構築（コードはテンプレートから取得）
- 不正データへの堅牢なパース

### テスト計画

- `scriptWorkspacePersistence.test.ts` に純粋ロジックのユニットテスト
  - 空状態のラウンドトリップ
  - 複数タブ（Unnamed/Library/Saved）のラウンドトリップ
  - 不正JSON、不正構造のフォールバック
  - ライブラリタブの復元（テンプレート参照解決）

### ストーリー計画

- ロジック層のみなのでストーリーなし
