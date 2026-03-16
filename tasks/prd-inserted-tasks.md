# 差し込みタスク

- [ ] ../tasks-archived/prd-replace.md が達成されていない
  - [ ] term入力のコンポーネントのストーリー(FormulaDisplay)に phi[tau/x] などがあるべきだろう
    - 入力、render, ...
  - [ ] UIの公理は (all x. phi) -> phi ではなく (all x. phi) -> phi[τ/x] にする！！
- [-] http://localhost:13006/?path=/story/formulainput-formulaeditor--error-stays-in-edit-mode
  - [-] エラー時の文字色が背景色と同じで見えない。 pw mcpでも分かる
- [ ] 現在、論理式などはただのJSON構造体だが、それだと自由度が高すぎてscriptで利用するときにも使いづらい
  - [ ] Effect.ts と Tagged Class (schema) へ完全に移行し、コンストラクタによる作成のみ許容され、scriptに提供する関数はすべてunknown前提でのクラスの検証(パース)を行う
    - [ ] 構造体の形、つくりかたを知っていないと書けないような箇所は排除される
- [ ] Gen適用の変数を指定するところは、事前に選ぶのではなく、対象の論理式を選んだあとに、選択式にできないだろうか。
  - [ ] このとき、あくまでも選択式は補完ということにして、自由入力もできるようにする
- [ ] 過去の以下のタスクが完了できていない
  - [x] MP適用などのモーダルの、論理式入力のところは、論理式入力のための共通UIをせっかく作ったのだから、それを利用したクリックから開始して、離れたらrenderされるやつを使うほうがよいだろう
  - [x] 基本すべての箇所において、 phi -> phi とかのままではなく、編集から離れたら render されるように共通化されるべき
  - AxiomPalette: unicodeDisplay文字列をFormulaDisplayに置換。EditableProofNode: パース失敗時フォールバックに数式フォントスタイル適用。GoalPanel: フォールバックにrole="math"とaria-label付与。EdgeParameterPopover は既にFormulaInput/TermInput使用済み。
    === 引用終了 ===
  - [ ] 当時なにを思っていまのでよいとしたのか整理せよ
  - [ ] 基本はrenderedが表示され、クリックで編集開始できるやつ (Nodeに使われてるダブルクリックのクリック版) を利用せよ。
        http://localhost:13006/?path=/story/formulainput-formulaeditor--with-parsed-callback を指している。
  - [ ] 拡張編集にも対応。(改行が入ってれば拡張がすぐに開くのみ)
  - [ ] http://localhost:13006/?path=/story/formulainput-formulaeditor--with-parsed-callback ← そもそも拡張編集がついてないこれはなに？拡張編集があるかないかをコンポーネントごとに分けられるようになってる？統一が足りてなさそう。
