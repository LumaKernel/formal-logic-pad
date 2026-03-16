# 差し込みタスク

ant活用してほしい

- [x] トップページのタブ切り替え、タブ自体 — antd Tabs に置き換え完了
- [x] ノートブック一覧タブの三点リーダーボタンと、その中のメニュー、新規ノートブックとかのボタン、削除するときの画面 — antd Button/Menu/EllipsisOutlined に置き換え完了
- [x] クエスト一覧タブの三点リーダーボタンと、その中のメニュー、開始ボタン、難易度や状態フィルタのチップボタンみたいなやつ — antd Button/Menu/MoreOutlined に置き換え完了
- [x] 自作クエストタブの同様に各種ボタン、同様 — antd Button に置き換え完了（11個のスタイル定数削除）
- [x] コレクションタブの各種ボタン、同様 — antd Button に置き換え完了（Panel + PageView、8個のスタイル定数削除）
- [x] リファレンスタブの各種ボタン、同様 — antd Button に置き換え完了（Browser/Modal/FloatingWindow/ViewerPageView）
- [x] スクリプトタブの各種ボタン、同様 — antd Button に置き換え完了（rename/export/deleteボタン）
- [x] ヘッダーの各要素 — ThemeToggle/LanguageToggleはrole="radio"+aria-checked付きのカスタムsegmentedでantd Segmentedでは代替不可。GitHubリンクは`<a>`タグ。ヘッダーに標準ボタンなし

- [x] EN/JAの切り替えってリロード必要なの？ (必要ならいい) — リロード必要。next-intl がサーバーサイドでcookieからロケール解決するため意図的な設計。useLocaleSwitch.ts でcookie設定後 reload() 呼び出し。テストでも検証済み
- [x] 各クエストで模範解答を開いても、まだまったく、公理制約違反だったり、証明されていなかったりする
  - [x] 各論理体系ごとに何が必要？ — 調査完了。ND/TAB/AT/SCは全てAllAchieved。Hilbert系101/127がINSTANCE_ROOTSで失敗。根本原因: axiomステップが代入済みインスタンスを直接配置
  - [x] buildModelAnswerWorkspaceのaxiomステップ自動展開を実装。expandAxiomStepIfNeededで公理インスタンスをスキーマ+SubstitutionEdge+インスタンスに自動展開。全1149テストパス
  - [ ] pw mcpでしっかり確認しながらできないか
  - [x] しっかり達成しつつ、網羅的に完遂するためのタスクリストを prd-quest-ans.md にまず作っていこう — 作成済み
- [ ] http://localhost:13006/?path=/story/pages-workspace--quest-complete-prop-01
  - 前に指示したやつだが、クエストを開いて開始するところから作るべき。
  - interactionがexpectだけというのはありえない。完全なユーザーの操作としてどう証明が達成されるかを完全に作る
  - [-] また、ヒルベルト流以外はアプリ側は色々と不完全だろう。証明の流れのサイドパネルも出ないし、MP適用などのボタンは出たままになる。
    - [x] まずは prd-non-hilbert.mdで個別体系ごとに、どのような対応が必要かを網羅的にタスクリストにして進めよう — 作成済み。MP/GenはisHilbertStyleガード済みだがSubstitutionメニューは未ガード
