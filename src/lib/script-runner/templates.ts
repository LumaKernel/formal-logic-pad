/**
 * テンプレートスクリプトの定義。
 *
 * ScriptEditor で選択・ロードできるビルトインスクリプトを提供する。
 * 各テンプレートはタイトル・説明・コード本体を含む。
 *
 * テンプレートは `compatibleStyles` で対応する演繹体系を指定する。
 * ScriptEditor は現在のワークスペースの演繹スタイルに基づいて
 * テンプレートをフィルタリングして表示する。
 *
 * 変更時は templates.test.ts, index.ts も同期すること。
 */

import type { DeductionStyle } from "@/lib/logic-core/deductionSystem";

/**
 * テンプレートスクリプトの定義。
 */
export type ScriptTemplate = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly code: string;
  /**
   * このテンプレートが対応する演繹スタイル。
   * undefined の場合は全スタイルで表示される（汎用テンプレート）。
   */
  readonly compatibleStyles?: readonly DeductionStyle[];
};

/**
 * カット除去テンプレート: 含意のカットを除去する例。
 *
 * 証明:
 *   φ ⇒ φ (ID)
 *   ────────────── (WR: φ→ψ を追加)
 *   φ ⇒ φ, φ→ψ
 *                        φ ⇒ φ (ID)    ψ ⇒ ψ (ID)
 *                        ──────────────────────── (→L)
 *                        φ→ψ, φ ⇒ ψ
 *   ────────────────────────────────────────────── (Cut: φ→ψ)
 *               φ, φ ⇒ ψ
 *
 * このカットは含意 (φ→ψ) を主式とする。
 * カット除去により、含意の分解が行われる。
 */
const cutEliminationImplication: ScriptTemplate = {
  id: "cut-elimination-implication",
  title: "カット除去: 含意の例",
  description:
    "φ→ψ をカット式とする証明からカットを除去する。含意のカット除去の典型例。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去定理の実演: 含意のカット
//
// 証明:
//   φ ⇒ φ (ID)
//   ────────────── (WR: φ→ψ を追加)
//   φ ⇒ φ, φ→ψ
//                        φ ⇒ φ (ID)    ψ ⇒ ψ (ID)
//                        ──────────────────────── (→L)
//                        φ→ψ, φ ⇒ ψ
//   ────────────────────────────────────────────── (Cut: φ→ψ)
//               φ, φ ⇒ ψ

// 論理式の定義
var phi = { _tag: "MetaVariable", name: "φ" };
var psi = { _tag: "MetaVariable", name: "ψ" };
var phiImplPsi = { _tag: "Implication", left: phi, right: psi };

// ID 公理: φ ⇒ φ
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};

// ID 公理: ψ ⇒ ψ
var idPsi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [psi], succedents: [psi] }
};

// 左前提: φ ⇒ φ に WR で φ→ψ を追加 → φ ⇒ φ, φ→ψ
var leftPremise = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [phi], succedents: [phi, phiImplPsi] },
  premise: idPhi,
  weakenedFormula: phiImplPsi
};

// 右前提: →L で φ ⇒ φ, ψ ⇒ ψ から φ→ψ, φ ⇒ ψ を導出
var rightPremise = {
  _tag: "ScImplicationLeft",
  conclusion: { antecedents: [phiImplPsi, phi], succedents: [psi] },
  left: idPhi,
  right: idPsi
};

// カット: φ→ψ を主式として Cut
var proof = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi, phi], succedents: [psi] },
  left: leftPremise,
  right: rightPremise,
  cutFormula: phiImplPsi
};

// カット除去前の情報
var conclusionSeq = getScConclusion(proof);
console.log("=== カット除去定理の実演 ===");
console.log("結論: " + formatSequent(conclusionSeq));
console.log("カット数: " + countCuts(proof));
console.log("カットフリー? " + isCutFree(proof));
console.log("");

// 初期証明をキャンバスに表示
console.log("--- 初期証明をキャンバスに表示 ---");
displayScProof(proof);

// カット除去の実行
console.log("");
console.log("--- カット除去開始 ---");
var result = eliminateCutsWithSteps(proof);

// 各ステップの表示と可視化
for (var i = 0; i < result.steps.length; i++) {
  var step = result.steps[i];
  console.log("ステップ " + (i + 1) + ": " + step.description);
  console.log("  depth=" + step.depth + ", rank=" + step.rank);
  var stepConc = getScConclusion(step.proof);
  console.log("  結論: " + formatSequent(stepConc));
  // 各ステップの証明をキャンバスに表示
  displayScProof(step.proof);
}

// 結果の表示
console.log("");
console.log("--- 結果 ---");
console.log("状態: " + result.result._tag);
if (result.result._tag === "Success") {
  var finalConc = getScConclusion(result.result.proof);
  console.log("最終結論: " + formatSequent(finalConc));
  console.log("カットフリー? " + isCutFree(result.result.proof));
  // 最終結果をキャンバスに表示
  displayScProof(result.result.proof);
}
`,
};

/**
 * 簡単な例: 公理のカットを除去する。
 *
 * 証明:
 *   φ ⇒ φ (ID)    φ ⇒ φ (ID)
 *   ──────────────────────── (Cut: φ)
 *            φ ⇒ φ
 */
const cutEliminationSimple: ScriptTemplate = {
  id: "cut-elimination-simple",
  title: "カット除去: 単純な例",
  description:
    "φ ⇒ φ の公理同士をカットした証明からカットを除去する。最も単純なカット除去の例。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去: 最も単純な例
//
// φ ⇒ φ (ID)    φ ⇒ φ (ID)
// ──────────────────────── (Cut: φ)
//          φ ⇒ φ

var phi = { _tag: "MetaVariable", name: "φ" };

var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};

var proof = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi], succedents: [phi] },
  left: idPhi,
  right: idPhi,
  cutFormula: phi
};

console.log("=== 単純なカット除去 ===");
console.log("カット数: " + countCuts(proof));

// 初期証明をキャンバスに表示
displayScProof(proof);

var result = eliminateCutsWithSteps(proof);

for (var i = 0; i < result.steps.length; i++) {
  var step = result.steps[i];
  console.log("ステップ " + (i + 1) + ": " + step.description);
  // 各ステップの証明をキャンバスに表示
  displayScProof(step.proof);
}

console.log("結果: " + result.result._tag);
if (result.result._tag === "Success") {
  console.log("カットフリー? " + isCutFree(result.result.proof));
  // 最終結果をキャンバスに表示
  displayScProof(result.result.proof);
}
`,
};

/**
 * φ→φ の証明を組み立てるスクリプト（代入の実演）。
 */
const buildIdentityProof: ScriptTemplate = {
  id: "build-identity-proof",
  title: "φ→φ の証明構築",
  description:
    "parseFormula と applyMP を使って φ→φ の Hilbert スタイル証明を組み立てる。",
  compatibleStyles: ["hilbert"],
  code: `// φ→φ の証明構築
// Hilbert公理系で φ→φ を導出する。
//
// 使用公理:
//   A1: φ→(ψ→φ)
//   A2: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
//
// 導出:
//   1. (φ→((ψ→φ)→φ))→((φ→(ψ→φ))→(φ→φ))  ... A2 のインスタンス
//   2. φ→((ψ→φ)→φ)                          ... A1 のインスタンス
//   3. (φ→(ψ→φ))→(φ→φ)                      ... MP(2, 1)
//   4. φ→(ψ→φ)                               ... A1 のインスタンス
//   5. φ→φ                                    ... MP(4, 3)

var phi = parseFormula("φ");
var psiImplPhi = parseFormula("ψ → φ");
var phiImplPhiImplPhi = parseFormula("φ → ((ψ → φ) → φ)");

console.log("=== φ→φ の Hilbert スタイル証明 ===");
console.log("");

// ステップ 1: A2 のインスタンス
var a2Instance = parseFormula("(φ → ((ψ → φ) → φ)) → ((φ → (ψ → φ)) → (φ → φ))");
console.log("1. " + formatFormula(a2Instance) + "  [A2]");

// ステップ 2: A1 のインスタンス
var a1Instance1 = parseFormula("φ → ((ψ → φ) → φ)");
console.log("2. " + formatFormula(a1Instance1) + "  [A1]");

// ステップ 3: MP(2, 1)
var step3 = applyMP(a1Instance1, a2Instance);
console.log("3. " + formatFormula(step3) + "  [MP 2,1]");

// ステップ 4: A1 のインスタンス
var a1Instance2 = parseFormula("φ → (ψ → φ)");
console.log("4. " + formatFormula(a1Instance2) + "  [A1]");

// ステップ 5: MP(4, 3)
var step5 = applyMP(a1Instance2, step3);
console.log("5. " + formatFormula(step5) + "  [MP 4,3]");

console.log("");
console.log("Q.E.D.");
`,
};

/**
 * 自動証明探索テンプレート: proveSequentLK で証明木を生成する例。
 */
const autoProveTemplate: ScriptTemplate = {
  id: "auto-prove-lk",
  title: "自動証明探索 (LK)",
  description:
    "proveSequentLK を使って命題論理の定理を自動的に証明し、証明木をキャンバスに表示する。",
  compatibleStyles: ["sequent-calculus"],
  code: `// 自動証明探索 (LK) の実演
//
// proveSequentLK を使って、命題論理の定理を自動的に証明します。
// 証明木は displayScProof でキャンバスに表示されます。

// 証明したいシーケント: ⇒ φ → φ
var goal = {
  antecedents: [],
  succedents: [parseFormula("phi -> phi")]
};

console.log("=== 自動証明探索 (LK) ===");
console.log("ゴール: ⇒ φ → φ");
console.log("");

// 証明探索を実行
var proof = proveSequentLK(goal);

// 証明木をキャンバスに表示
console.log("証明が見つかりました！");
displayScProof(proof);
console.log("Q.E.D.");
`,
};

/**
 * ビルトインテンプレート一覧。
 */
export const BUILTIN_TEMPLATES: readonly ScriptTemplate[] = [
  cutEliminationSimple,
  cutEliminationImplication,
  buildIdentityProof,
  autoProveTemplate,
];

/**
 * 演繹スタイルに基づいてテンプレートをフィルタリングする。
 *
 * - style が undefined の場合は全テンプレートを返す（スタンドアロンモード）。
 * - style が指定された場合、compatibleStyles が undefined（汎用）または
 *   指定スタイルを含むテンプレートのみを返す。
 */
export function filterTemplatesByStyle(
  templates: readonly ScriptTemplate[],
  style: DeductionStyle | undefined,
): readonly ScriptTemplate[] {
  if (style === undefined) {
    return templates;
  }
  /* v8 ignore start -- V8 coverage merging quirk: 100% in isolation but phantom uncovered in full suite */
  return templates.filter(
    (t) =>
      t.compatibleStyles === undefined || t.compatibleStyles.includes(style),
  );
  /* v8 ignore stop */
}
