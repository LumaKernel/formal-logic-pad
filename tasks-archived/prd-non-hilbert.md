- [x] hilbert以外は実際に動くものになっているだろうか。
  - [x] axiomsがないのにウィンドウはaxiomがある場所をよけたりする (調査の結果問題なし: 全体系に左側パレットがあり同位置。回避は正しい動作)
  - [x] ストーリーでしっかり、ルート、ページの実際のストーリーを作って保証、確認 (WorkspacePageViewにND/SC/TAB/ATの4ストーリー追加。play関数で体系バッジ・パレット・MPボタン非表示を検証)
  - [x] 対応することが多ければ、専用のタスクファイルとタスクリストを作って計画を立てて対応 (3イテレーションで対応完了。専用タスクファイル不要)
  - [x] MP適用などがすべて出てくるが、これも正しいのか？上部メニューやコンテキストメニューはノートの体系によって変わるべきではないか
  - [x] そもそも全部、体系が Empty (non-Hilbert) になるが、正しいのか (notebookListLogic.tsのsystemName修正。ProofWorkspaceは既にgetDeductionSystemName使用で正しい)

### 自然演繹 (ND)

- [x] 証明木表示パネル（ND用）の検討 — ndProofTreeRendererLogic.ts + NdProofTreePanel.tsx + Storybookストーリー6種（play関数付き）
  - Gentzenスタイルの証明木表示

### 共通

- [x] Substitutionコンテキストメニュー項目を `isHilbertStyle` ガードで囲む — Fragment内に移動済み
- [x] 上記のテスト追加 — ND体系でSubstitution非表示を検証するテスト追加

- [x] 仮定のスコープ（discharge）の視覚的フィードバック改善
  - エッジラベルに仮定ID `[n]` を付与（→I [1], ∨E [2,3], ∃E [4] 形式）
  - ノード上の仮定ID表示は別タスクに持ち越し（モデル上の紐づけが必要）

### シーケント計算 (SC)

- [x] 証明木表示パネル（SC用）
  - scProofTreeRendererLogic.ts（純粋ロジック）+ ScProofTreePanel.tsx（UI）で実装
  - ProofWorkspaceのカット除去ステッパー内に統合（右下配置）
  - 全21規則ラベル対応、Gentzenスタイル表示

### Storybook play関数の改善

- [x] Quest完了ストーリー（prop-01等）で、クエスト開始→証明操作→達成の完全なインタラクションを作成
  - prop-01: QuestCompleteProp01 で MP操作→ゴール達成の完全フロー実装済み
  - nd-01: QuestCompleteNd01Interactive で仮定追加→式入力のND固有操作フロー実装（ポート接続はplay関数では困難なため部分的）
