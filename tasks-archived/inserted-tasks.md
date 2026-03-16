# 差し込みタスク（アーカイブ）

- [x] ../tasks-archived/prd-replace.md が達成されていない
  - [x] term入力のコンポーネントのストーリー(FormulaDisplay)に phi[tau/x] などがあるべきだろう
    - SubstitutionDisplay（6パターン）とSubstitutionHighlight（3パターン、A4公理全体含む）をplay関数付きで追加
  - [x] UIの公理は (all x. phi) -> phi ではなく (all x. phi) -> phi[τ/x] にする！！
    - axiomA4Template に FormulaSubstitution を追加。dslText は identifyAxiom 互換性のため旧形式維持
- [x] ダークモードでの(クエスト)「開始」とか「再挑戦」とか、選択済みの「全難易度」とかが背景色と一緒になってみえにくい。
  - [x] 過去の遺産で余計なことをしてしまってないか？ シンプルにAntのダークモードの方法にのっかるような方針にできないか
    - colorPrimary #fafafa + darkAlgorithm が白文字/薄灰色背景の低コントラストを生成していた。colorTextLightSolid で暗色テキストに修正
  - [x] playwright-cliで確認
    - chrome-devtools MCPで実アプリ(localhost:13000)のダーク/ライト両モードをスクリーンショット検証済み
