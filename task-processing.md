## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md` 1行目

> 言語の切り替えはどこでできる想定なんだろう。設定パネルを開くとかができるようにして、そこでする感じかな。

### 周辺情報

- next-intl (v4.8.2) を使用済み。Cookie `"locale"` で言語を管理する仕組みがある
- 対応言語: en, ja
- ThemeToggle と同様の 3 層パターン（純粋ロジック + hook + UIコンポーネント）で LanguageToggle を作る
- HubPageView と WorkspacePageView のヘッダー右側に配置
