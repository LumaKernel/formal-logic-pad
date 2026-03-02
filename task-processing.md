# タスク: ND模範解答のステップタイプ追加と基本問題の模範解答追加

**元ファイル:** `tasks/prd-inserted-tasks.md` — `[-] ビルトインのものはすべて網羅。`

## 内容

ModelAnswerStep にND規則のステップタイプを追加し、ND基本問題(nd-01〜nd-10)の模範解答を追加する。

## 周辺情報

- 現在のModelAnswerStepは axiom/mp/gen の3タイプのみ（Hilbert系専用）
- NDの推論規則は14種（→I, →E, ∧I, ∧E_L, ∧E_R, ∨I_L, ∨I_R, ∨E, w, EFQ, DNE, ∀I, ∀E, ∃I, ∃E）
- NDではノードは「仮定」として追加し、ポート接続で規則適用する
- ND模範解答は合計23問（nd-01〜nd-23）、現在0件

## テスト計画

- `src/lib/quest/modelAnswer.test.ts` — NDステップタイプのビルドテスト追加
- `src/lib/quest/builtinModelAnswers.test.ts` — nd-basics (nd-01〜nd-10) のゴール達成テスト追加

## ストーリー計画

- UIの変更なし（純粋ロジックのみ）
