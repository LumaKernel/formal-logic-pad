- [x] 論理スキーマの表現言語に置換を入れたい。以前も置換を言語内部に入れるよう指示したが、入っていない。
  - [x] phi[τ/x] はたとえば { type: subst, body: { ...phi... }, var: x, with: { ...tau... }}（FormulaSubstitution として実装済み）
  - [x] ある自由変数が存在しない、ということも表現できるようにしよう phi[/x] で { type: asserts-..., body: ... }
    - FreeVariableAbsence として実装。パーサー・フォーマッター・全ロジック層対応済み
  - [x] x[/x] はあくまでも、なににも変換(簡約)できないだけで、正当なものになる。
    - normalizeFormula で FreeVariableAbsence の変数が自由な場合は保持、自由でない場合は除去
  - [x] 等価性の判定はより柔軟にする — 置換チェーン正規化で実現済み（archived）
  - [x] 簡約化のサポートをしよう。簡約処理をなるべくした論理式へ置き換える操作として、MPなどと同じようにコンテキストメニューから起動できるものにしよう
    - normalizeApplicationLogic.ts で純粋バリデーション、workspaceState.ts で状態管理、ProofWorkspace.tsx でUI統合。menuActionDefinition.ts に "normalize-formula" メニュー項目追加

=== 参考の過去タスク ===

- [x] 0 + 0 = 0 (模範解答) において、 (all x. x + 0 = x) -> 0 + 0 = 0 が公理として認識されている
  - (all x. phi) -> phi が公理なので、これのみが公理として認識されるべきだ。そこからの置換による解答であるべき。
  - というかこれは、 (all x. phi) -> phi[τ/x] という公理図式なのでは？これについて、 τ=0で置換している
    - 変数を表わすメタ変数と、項を表すメタ変数は衝突しないように調整してね
- [x] needs substition stepというのも、ない。そんな状態を持つノードはありえなくていい。
      まず、論理式スキーム自体がsubstition ([.../...]) をASTそのものとして持てるようであるべきというのがある。
      そして、A4: all phi -> phi[tau/x] とかであっても、これ自体に phi := ... の代入をして、その展開として一致するなら、繋げることがあくまでもできるというものになる。
      置換を介して一致するか、というのは、formula schema(置換含む)の同値関係を定義して考えることになるだろう。 phi[tau1/x][tau2/y]とphi[tau2/x][tau1/y]なんかも一致することになるだろうね。
- [x] (AST内にある)置換を解決するというのを補助する機能はあってよいだろうね。Resolve substition的に(ここで差すsubstitionはメタ変数の置換ではなく、そのスキーム言語内部の置換として)
