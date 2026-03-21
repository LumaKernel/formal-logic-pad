# 実行中タスク

**出典:** `tasks/inserted-tasks.md`

**タスク:** ドキュメントトップページ、みたいなのも用意して、どのページからもそこへ移動できるようにする

## コンテキスト

- 親タスク: ノート操作のときのドキュメントウィンドウを強化する
- サブタスク: ドキュメントタブのように一覧から検索、フィルタして探せる
- 現在 ReferenceFloatingWindow は単一エントリのみ表示
- ReferenceBrowserComponent（カテゴリフィルタ・検索・一覧）は /reference ページで使用されている
- フローティングウィンドウ内にトップページ（一覧・検索）を表示し、そこからエントリに遷移できるようにする

## テスト計画

- ReferenceFloatingWindow.test.tsx: トップページ表示・エントリ選択でentryビューへ遷移するテスト
- floatingWindowLogic.ts or 新規ロジック: 必要に応じて

## ストーリー計画

- ReferenceFloatingWindow.stories.tsx: トップページモードのストーリーを追加

## 実装方針

1. ReferenceFloatingWindow に「ホーム」ボタンを追加（エントリ表示時に一覧に戻る）
2. ReferenceFloatingWindow を拡張して、entry が undefined の場合にブラウザビュー（一覧・検索）を表示
3. 呼び出し元（WorkspaceContent）で referenceDetailId を null にすると一覧モードになるようにする
