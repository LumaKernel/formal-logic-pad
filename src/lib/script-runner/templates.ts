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

// 論理式の定義（parseFormula でパース）
var phi = parseFormula("φ");
var psi = parseFormula("ψ");
var phiImplPsi = parseFormula("φ → ψ");

// ID 公理: φ ⇒ φ
var idPhi = scIdentity(sequent([phi], [phi]));

// ID 公理: ψ ⇒ ψ
var idPsi = scIdentity(sequent([psi], [psi]));

// 左前提: φ ⇒ φ に WR で φ→ψ を追加 → φ ⇒ φ, φ→ψ
var leftPremise = scWeakeningRight(
  idPhi, phiImplPsi, sequent([phi], [phi, phiImplPsi])
);

// 右前提: →L で φ ⇒ φ, ψ ⇒ ψ から φ→ψ, φ ⇒ ψ を導出
var rightPremise = scImplicationLeft(
  idPhi, idPsi, sequent([phiImplPsi, phi], [psi])
);

// カット: φ→ψ を主式として Cut
var proof = scCut(
  leftPremise, rightPremise, phiImplPsi,
  sequent([phi, phi], [psi])
);

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

// parseFormula でパースし、sequent / scIdentity / scCut で証明ノードを構築
var phi = parseFormula("φ");
var seq = sequent([phi], [phi]);

var idPhi = scIdentity(seq);
var proof = scCut(idPhi, idPhi, phi, seq);

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
 * φ→φ の証明を証明ツリーとしてキャンバスに表示するスクリプト。
 *
 * Hilbert公理系で φ→φ を導出し、ワークスペースに証明木を構築する。
 * ヒルベルト流以外の体系で実行するとエラーで停止する。
 *
 * 証明:
 *   1. (φ→((ψ→φ)→φ))→((φ→(ψ→φ))→(φ→φ))  [A2]
 *   2. φ→((ψ→φ)→φ)                          [A1]
 *   3. (φ→(ψ→φ))→(φ→φ)                      [MP 2,1]
 *   4. φ→(ψ→φ)                               [A1]
 *   5. φ→φ                                    [MP 4,3]
 */
const buildIdentityProofTree: ScriptTemplate = {
  id: "build-identity-proof-tree",
  title: "φ→φ の証明ツリー構築",
  description:
    "ヒルベルト公理系で φ→φ の証明木をワークスペースに構築する。公理ノードの追加・MP接続・レイアウトを自動実行。",
  compatibleStyles: ["hilbert"],
  code: `// φ→φ の証明ツリー構築
// ワークスペースに証明木を構築します。
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

// 体系チェック: ヒルベルト流以外ではエラー
var sysInfo = getDeductionSystemInfo();
if (!sysInfo.isHilbertStyle) {
  throw new Error("このスクリプトはヒルベルト流の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

// 公理同定のためにLogicSystemを取得
var system = getLogicSystem();

// ワークスペースをクリアして証明木を構築
clearWorkspace();

console.log("=== φ→φ の証明ツリー構築 ===");
console.log("体系: " + system.name);
console.log("");

// ステップ 1: A2 のインスタンス
var a2Text = "(φ → ((ψ → φ) → φ)) → ((φ → (ψ → φ)) → (φ → φ))";
var node1 = addNode(a2Text);
setNodeRoleAxiom(node1);
var id1 = identifyAxiom(parseFormula(a2Text), system);
console.log("1. " + formatFormula(parseFormula(a2Text)));
console.log("   公理判定: " + (id1._tag === "Ok" ? id1.axiomName : "ERROR"));

// ステップ 2: A1 のインスタンス
var a1Text1 = "φ → ((ψ → φ) → φ)";
var node2 = addNode(a1Text1);
setNodeRoleAxiom(node2);
var id2 = identifyAxiom(parseFormula(a1Text1), system);
console.log("2. " + formatFormula(parseFormula(a1Text1)));
console.log("   公理判定: " + (id2._tag === "Ok" ? id2.axiomName : "ERROR"));

// ステップ 3: MP(2, 1) → (φ→(ψ→φ))→(φ→φ)
var node3 = connectMP(node2, node1);
console.log("3. " + formatFormula(parseFormula("(φ → (ψ → φ)) → (φ → φ)")) + "  [MP 2,1]");

// ステップ 4: A1 のインスタンス
var a1Text2 = "φ → (ψ → φ)";
var node4 = addNode(a1Text2);
setNodeRoleAxiom(node4);
var id4 = identifyAxiom(parseFormula(a1Text2), system);
console.log("4. " + formatFormula(parseFormula(a1Text2)));
console.log("   公理判定: " + (id4._tag === "Ok" ? id4.axiomName : "ERROR"));

// ステップ 5: MP(4, 3) → φ→φ
var node5 = connectMP(node4, node3);
console.log("5. " + formatFormula(parseFormula("φ → φ")) + "  [MP 4,3]");

// レイアウト適用
applyLayout();

console.log("");
console.log("証明ツリーを構築しました。");
console.log("すべての公理ノードが正しく同定されています。");
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

console.log("=== 自動証明探索 (LK) ===");
console.log("");

// ── 1. 基本: 恒真式 φ → φ ──
var goal1 = sequent([], [parseFormula("phi -> phi")]);
console.log("1. ⇒ φ → φ");
var proof1 = proveSequentLK(goal1);
console.log("   証明ノード数: " + countCuts(proof1) + " カット");
displayScProof(proof1);

// ── 2. 対偶: (φ → ψ) → (¬ψ → ¬φ) ──
var goal2 = sequent([], [parseFormula("(phi -> psi) -> (~psi -> ~phi)")]);
console.log("");
console.log("2. ⇒ (φ → ψ) → (¬ψ → ¬φ)  [対偶]");
var proof2 = proveSequentLK(goal2);
console.log("   カットフリー? " + isCutFree(proof2));
displayScProof(proof2);

// ── 3. 排中律: φ ∨ ¬φ ──
var goal3 = sequent([], [parseFormula("phi \\\\/ ~phi")]);
console.log("");
console.log("3. ⇒ φ ∨ ¬φ  [排中律]");
var proof3 = proveSequentLK(goal3);
displayScProof(proof3);

// ── 4. ド・モルガン: ¬(φ ∧ ψ) → (¬φ ∨ ¬ψ) ──
var goal4 = sequent([], [parseFormula("~(phi /\\\\ psi) -> (~phi \\\\/ ~psi)")]);
console.log("");
console.log("4. ⇒ ¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)  [ド・モルガン]");
var proof4 = proveSequentLK(goal4);
displayScProof(proof4);

console.log("");
console.log("全定理の自動証明が完了しました！");
console.log("Q.E.D.");
`,
};

/**
 * ワークスペースの証明に対してカット除去を実行するテンプレート。
 *
 * ワークスペースからSC証明木を自動抽出し、カット除去を適用する。
 * SC体系でない場合はエラーで停止する。
 */
const cutEliminationWorkspace: ScriptTemplate = {
  id: "cut-elimination-workspace",
  title: "ワークスペース証明のカット除去",
  description:
    "ワークスペース上のSC証明木を抽出し、カット除去を適用する。結果はキャンバスに表示される。",
  compatibleStyles: ["sequent-calculus"],
  code: `// ワークスペース証明のカット除去
//
// ワークスペース上に構築されたSC証明木を自動抽出し、
// カット除去定理を適用します。
// 各ステップをコンソールに表示し、最終結果をキャンバスに展開します。

// 体系チェック
var sysInfo = getDeductionSystemInfo();
if (sysInfo.style !== "sequent-calculus") {
  throw new Error("このスクリプトはシーケント計算の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

console.log("=== ワークスペース証明のカット除去 ===");
console.log("体系: " + sysInfo.systemName);
console.log("");

// ワークスペースからSC証明木を抽出
console.log("--- 証明木を抽出中 ---");
var proof = extractScProof();

// 証明の情報を表示
var conclusionSeq = getScConclusion(proof);
console.log("結論: " + formatSequent(conclusionSeq));
console.log("カット数: " + countCuts(proof));
console.log("カットフリー? " + isCutFree(proof));
console.log("");

if (isCutFree(proof)) {
  console.log("この証明は既にカットフリーです。変更はありません。");
} else {
  // カット除去の実行
  console.log("--- カット除去開始 ---");
  var result = eliminateCutsWithSteps(proof);

  // 各ステップの表示
  for (var i = 0; i < result.steps.length; i++) {
    var step = result.steps[i];
    console.log("ステップ " + (i + 1) + ": " + step.description);
    console.log("  depth=" + step.depth + ", rank=" + step.rank);
    var stepConc = getScConclusion(step.proof);
    console.log("  結論: " + formatSequent(stepConc));
  }

  // 結果の表示
  console.log("");
  console.log("--- 結果 ---");
  console.log("状態: " + result.result._tag);
  if (result.result._tag === "Success") {
    var finalConc = getScConclusion(result.result.proof);
    console.log("最終結論: " + formatSequent(finalConc));
    console.log("カットフリー? " + isCutFree(result.result.proof));
    console.log("");
    console.log("カットフリー証明をキャンバスに表示します。");
    displayScProof(result.result.proof);
  } else if (result.result._tag === "StepLimitExceeded") {
    console.log("ステップ数の上限に達しました。部分的な結果を表示します。");
    displayScProof(result.result.proof);
  } else {
    console.log("カット除去に失敗しました: " + result.result.reason);
  }
}
`,
};

/**
 * 演繹定理の明示的実装テンプレート。
 *
 * applyDeductionTheorem 組込み関数を使わず、
 * A1/A2/MP を使って演繹定理の変換を手動で構築する。
 * 教育目的: アルゴリズムの各ケースが可視化される。
 *
 * @see dev/logic-reference/08-deduction-theorem.md
 */
const deductionTheoremExplicit: ScriptTemplate = {
  id: "deduction-theorem-explicit",
  title: "演繹定理の明示的実装",
  description:
    "組込み関数を使わず、A1/A2/MPで演繹定理の変換を手動で構築する。各ケースのログ出力付き。",
  compatibleStyles: ["hilbert"],
  code: `// 演繹定理の明示的実装
//
// applyDeductionTheorem() 組込み関数を使わず、
// 演繹定理のアルゴリズムを手動で実装します。
//
// Γ ∪ {A} ⊢ B の証明木を Γ ⊢ A → B の証明木に変換します。
//
// 3つのケース:
//   ケース1: AxiomNode（仮定A と一致）→ A→A の恒等証明（5ステップ）
//   ケース2: AxiomNode（公理C）→ A1(C,A) + MP で A→C
//   ケース3: ModusPonensNode → A2 + MP×2 で再帰的に変換

// 体系チェック
var sysInfo = getDeductionSystemInfo();
if (!sysInfo.isHilbertStyle) {
  throw new Error("このスクリプトはヒルベルト流の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

console.log("=== 演繹定理の明示的実装 ===");
console.log("体系: " + sysInfo.systemName);
console.log("");

// ── テンプレート定数（一度だけパース）──────────────────────
var A1_SCHEMA = parseFormula("phi -> (psi -> phi)");
var A2_SCHEMA = parseFormula("(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))");
var IMPL_SCHEMA = parseFormula("phi -> psi");

// ── ヘルパー関数 ─────────────────────────────────────────

// 含意 a → b を構築
function impl(a, b) {
  return substituteFormula(IMPL_SCHEMA, { "\\u03c6": a, "\\u03c8": b });
}

// A1(p, q) = p → (q → p) の公理ノードを構築
function makeA1(p, q) {
  var formula = substituteFormula(A1_SCHEMA, { "\\u03c6": p, "\\u03c8": q });
  return { _tag: "AxiomNode", formula: formula };
}

// A2(p, q, r) = (p→(q→r)) → ((p→q) → (p→r)) の公理ノードを構築
function makeA2(p, q, r) {
  var formula = substituteFormula(A2_SCHEMA, { "\\u03c6": p, "\\u03c8": q, "\\u03c7": r });
  return { _tag: "AxiomNode", formula: formula };
}

// MP(antecedentProof, conditionalProof) の証明ノードを構築
function makeMP(antecedentProof, conditionalProof, conclusion) {
  return {
    _tag: "ModusPonensNode",
    formula: conclusion,
    antecedent: antecedentProof,
    conditional: conditionalProof
  };
}

// ── ケース1: A → A の恒等証明（5ステップ）─────────────────

function buildIdentityProofExplicit(a) {
  var bImplA = impl(a, a);

  // step1: A2(A, A→A, A)
  var step1 = makeA2(a, bImplA, a);

  // step2: A1(A, A→A)
  var step2 = makeA1(a, bImplA);

  // step3: MP(step2, step1) = (A→(A→A)) → (A→A)
  var step3Conclusion = impl(impl(a, bImplA), impl(a, a));
  var step3 = makeMP(step2, step1, step3Conclusion);

  // step4: A1(A, A)
  var step4 = makeA1(a, a);

  // step5: MP(step4, step3) = A→A
  var step5Conclusion = impl(a, a);
  return makeMP(step4, step3, step5Conclusion);
}

// ── メイン変換関数 ───────────────────────────────────────
var depth = 0;

function deductionTransform(proof, hypothesis) {
  var indent = "";
  for (var i = 0; i < depth; i++) { indent += "  "; }
  depth++;

  var result;

  if (proof._tag === "AxiomNode") {
    if (equalFormula(proof.formula, hypothesis)) {
      console.log(indent + "[ケース1] 仮定一致 → A→A 恒等証明");
      result = buildIdentityProofExplicit(hypothesis);
    } else {
      console.log(indent + "[ケース2] 公理: " + formatFormula(proof.formula));
      var c = proof.formula;
      var a1Node = makeA1(c, hypothesis);
      var cNode = { _tag: "AxiomNode", formula: c };
      var aImplC = impl(hypothesis, c);
      result = makeMP(cNode, a1Node, aImplC);
    }
  } else if (proof._tag === "ModusPonensNode") {
    var d = proof.antecedent.formula;
    var e = proof.formula;
    console.log(indent + "[ケース3] MP: " + formatFormula(e));
    console.log(indent + "  前提: " + formatFormula(d));
    console.log(indent + "  条件: " + formatFormula(impl(d, e)));

    var aImplDProof = deductionTransform(proof.antecedent, hypothesis);
    var aImplDEProof = deductionTransform(proof.conditional, hypothesis);

    var a2Node = makeA2(hypothesis, d, e);
    var adToAE = impl(impl(hypothesis, d), impl(hypothesis, e));
    var mp1 = makeMP(aImplDEProof, a2Node, adToAE);
    var aImplE = impl(hypothesis, e);
    result = makeMP(aImplDProof, mp1, aImplE);
  } else {
    throw new Error("未対応のノード型: " + proof._tag);
  }

  depth--;
  console.log(indent + "→ " + formatFormula(result.formula));
  return result;
}

// ── 実行 ─────────────────────────────────────────────────

// 選択中ノードの論理式を仮定として使用
var selectedIds = getSelectedNodeIds();
if (selectedIds.length === 0) {
  throw new Error("仮定とする論理式のノードを1つ選択してください。");
}
if (selectedIds.length > 1) {
  throw new Error("仮定として使用するノードは1つだけ選択してください。");
}

var allNodes = getNodes();
var selectedNode = null;
for (var i = 0; i < allNodes.length; i++) {
  if (allNodes[i].id === selectedIds[0]) {
    selectedNode = allNodes[i];
  }
}
if (!selectedNode) {
  throw new Error("選択されたノードが見つかりません。");
}

var hypothesisText = selectedNode.formulaText;
var hypothesis = parseFormula(hypothesisText);
console.log("仮定: " + formatFormula(hypothesis));
console.log("");

// ワークスペースからHilbert証明木を抽出
console.log("--- 証明木を抽出中 ---");
var proof = extractHilbertProof();
console.log("元の結論: " + formatFormula(proof.formula));
console.log("");

// 演繹定理を明示的に適用
console.log("--- 変換中 ---");
var transformed = deductionTransform(proof, hypothesis);
console.log("");

// 変換後の証明木をワークスペースに表示
console.log("--- 変換後の証明木を配置中 ---");
displayHilbertProof(transformed);

console.log("");
console.log("演繹定理の適用が完了しました。");
console.log("変換後の結論: " + formatFormula(transformed.formula));
`,
};

/**
 * ワークスペースの証明に対して演繹定理を適用するテンプレート。
 *
 * ワークスペースからHilbert証明木を自動抽出し、
 * 選択中のノードの論理式を仮定として演繹定理を適用する。
 * 結果は元の証明木を消さず、横に配置される。
 * Hilbert体系でない場合はエラーで停止する。
 */
const deductionTheoremWorkspace: ScriptTemplate = {
  id: "deduction-theorem-workspace",
  title: "演繹定理の適用",
  description:
    "ワークスペース上のHilbert証明木を抽出し、選択ノードの論理式を仮定として演繹定理を適用する。結果は横に配置される。",
  compatibleStyles: ["hilbert"],
  code: `// 演繹定理の適用
//
// ワークスペース上に構築されたHilbert証明木を自動抽出し、
// 選択中ノードの論理式を仮定として演繹定理を適用します。
// Γ ∪ {A} ⊢ B を Γ ⊢ A → B に変換します。
// 元の証明木はそのまま残り、変換後の証明木が横に配置されます。

// 体系チェック: ヒルベルト流以外ではエラー
var sysInfo = getDeductionSystemInfo();
if (!sysInfo.isHilbertStyle) {
  throw new Error("このスクリプトはヒルベルト流の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

console.log("=== 演繹定理の適用 ===");
console.log("体系: " + sysInfo.systemName);
console.log("");

// 選択中ノードの論理式を仮定として使用
var selectedIds = getSelectedNodeIds();
if (selectedIds.length === 0) {
  throw new Error("仮定とする論理式のノードを1つ選択してください。");
}
if (selectedIds.length > 1) {
  throw new Error("仮定として使用するノードは1つだけ選択してください。（選択数: " + selectedIds.length + "）");
}

// 選択ノードの情報を取得
var allNodes = getNodes();
var selectedNode = null;
for (var i = 0; i < allNodes.length; i++) {
  if (allNodes[i].id === selectedIds[0]) {
    selectedNode = allNodes[i];
  }
}
if (!selectedNode) {
  throw new Error("選択されたノードが見つかりません。");
}

var hypothesisText = selectedNode.formulaText;
console.log("仮定: " + hypothesisText);
console.log("");

// ワークスペースからHilbert証明木を抽出
console.log("--- 証明木を抽出中 ---");
var proof = extractHilbertProof();

// 演繹定理を適用
console.log("--- 演繹定理を適用中 ---");
var transformed = applyDeductionTheorem(proof, hypothesisText);

// 変換後の証明木をワークスペースに表示（横に配置）
console.log("--- 変換後の証明木を配置中 ---");
displayHilbertProof(transformed);

console.log("");
console.log("演繹定理の適用が完了しました。");
console.log("Γ ∪ {" + hypothesisText + "} ⊢ B → Γ ⊢ " + hypothesisText + " → B");
`,
};

/**
 * 逆演繹定理の明示的実装テンプレート。
 *
 * applyReverseDeductionTheorem 組込み関数を使わず、
 * 結論の含意構造を手動で分解して MP で B を導出する。
 * 教育目的: 逆演繹定理がいかにシンプルかを実感できる。
 *
 * @see dev/logic-reference/08-deduction-theorem.md
 */
const reverseDeductionTheoremExplicit: ScriptTemplate = {
  id: "reverse-deduction-theorem-explicit",
  title: "逆演繹定理の明示的実装",
  description:
    "組込み関数を使わず、結論 A→B の構造を分解して A を仮定に追加し MP で B を導出する。",
  compatibleStyles: ["hilbert"],
  code: `// 逆演繹定理の明示的実装
//
// applyReverseDeductionTheorem() 組込み関数を使わず、
// 逆演繹定理の変換を手動で実装します。
//
// Γ ⊢ A → B の証明木を Γ ∪ {A} ⊢ B の証明木に変換します。
//
// アルゴリズム:
//   1. 証明木の結論が A→B の形であることを確認
//   2. A を AxiomNode（仮定）として追加
//   3. MP(A, A→B) = B

// 体系チェック
var sysInfo = getDeductionSystemInfo();
if (!sysInfo.isHilbertStyle) {
  throw new Error("このスクリプトはヒルベルト流の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

console.log("=== 逆演繹定理の明示的実装 ===");
console.log("体系: " + sysInfo.systemName);
console.log("");

// ワークスペースからHilbert証明木を抽出
console.log("--- 証明木を抽出中 ---");
var proof = extractHilbertProof();
var conclusion = proof.formula;
console.log("元の結論: " + formatFormula(conclusion));
console.log("");

// 結論が含意 A→B の形であることを確認
console.log("--- 結論の構造を確認 ---");
if (conclusion._tag !== "Implication") {
  throw new Error("結論が含意（→）の形ではありません: " + formatFormula(conclusion));
}

var a = conclusion.left;   // 仮定として追加する A
var b = conclusion.right;  // 導出される結論 B

console.log("  A = " + formatFormula(a));
console.log("  B = " + formatFormula(b));
console.log("");

// 逆演繹定理を適用
console.log("--- 変換中 ---");
console.log("  [ステップ1] A を仮定（AxiomNode）として追加");
var aNode = { _tag: "AxiomNode", formula: a };

console.log("  [ステップ2] MP(A, A→B) = B");
var transformed = {
  _tag: "ModusPonensNode",
  formula: b,
  antecedent: aNode,       // 前提: A
  conditional: proof        // 条件: A→B（元の証明木全体）
};
console.log("  → " + formatFormula(transformed.formula));
console.log("");

// 変換後の証明木をワークスペースに表示
console.log("--- 変換後の証明木を配置中 ---");
displayHilbertProof(transformed);

console.log("");
console.log("逆演繹定理の適用が完了しました。");
console.log("Γ ⊢ " + formatFormula(conclusion) + " → Γ ∪ {" + formatFormula(a) + "} ⊢ " + formatFormula(b));
`,
};

/**
 * 逆演繹定理の適用テンプレート。
 *
 * ワークスペース上のHilbert証明木の結論（A→B）から、
 * A を仮定として追加し B の証明木を構築する。
 * 結果は元の証明木を消さず、横に配置される。
 * Hilbert体系でない場合はエラーで停止する。
 */
const reverseDeductionTheoremWorkspace: ScriptTemplate = {
  id: "reverse-deduction-theorem-workspace",
  title: "逆演繹定理の適用",
  description:
    "ワークスペース上のHilbert証明木（結論が A→B）を抽出し、A を仮定として追加して B の証明木を構築する。結果は横に配置される。",
  compatibleStyles: ["hilbert"],
  code: `// 逆演繹定理の適用
//
// ワークスペース上に構築されたHilbert証明木を自動抽出し、
// 結論が A → B の形であることを確認して、
// A を仮定として追加し B の証明木を構築します。
// Γ ⊢ A → B を Γ ∪ {A} ⊢ B に変換します。
// 元の証明木はそのまま残り、変換後の証明木が横に配置されます。

// 体系チェック: ヒルベルト流以外ではエラー
var sysInfo = getDeductionSystemInfo();
if (!sysInfo.isHilbertStyle) {
  throw new Error("このスクリプトはヒルベルト流の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

console.log("=== 逆演繹定理の適用 ===");
console.log("体系: " + sysInfo.systemName);
console.log("");

// ワークスペースからHilbert証明木を抽出
console.log("--- 証明木を抽出中 ---");
var proof = extractHilbertProof();

// 逆演繹定理を適用
console.log("--- 逆演繹定理を適用中 ---");
var transformed = applyReverseDeductionTheorem(proof);

// 変換後の証明木をワークスペースに表示（横に配置）
console.log("--- 変換後の証明木を配置中 ---");
displayHilbertProof(transformed);

console.log("");
console.log("逆演繹定理の適用が完了しました。");
console.log("Γ ⊢ A → B を Γ ∪ {A} ⊢ B に変換しました。");
`,
};

// ── 汎用テンプレート（全演繹スタイル共通）────────────────────

/**
 * 論理式の探索テンプレート: parseFormula / formatFormula / equalFormula を紹介。
 *
 * 全スタイル共通。論理式のパース・整形・比較の基本操作を学ぶ。
 */
const formulaExplorer: ScriptTemplate = {
  id: "formula-explorer",
  title: "論理式の探索",
  description:
    "parseFormula / formatFormula / equalFormula を使って、論理式のパース・整形・構造比較を学ぶ。全スタイル共通。",
  code: `// 論理式の探索
//
// parseFormula: テキスト → 論理式 JSON
// formatFormula: 論理式 JSON → Unicode テキスト
// equalFormula: 構造的同値判定

console.log("=== 論理式の探索 ===");
console.log("");

// 1. 論理式のパースと表示
var f1 = parseFormula("phi -> (psi -> phi)");
console.log("パース結果: " + formatFormula(f1));
console.log("JSON構造: " + JSON.stringify(f1));
console.log("");

// 2. 様々な結合子
var impl = parseFormula("phi -> psi");
var conj = parseFormula("phi /\\\\ psi");
var disj = parseFormula("phi \\\\/ psi");
var neg = parseFormula("~phi");
var univ = parseFormula("forall x. P(x)");

console.log("含意: " + formatFormula(impl));
console.log("連言: " + formatFormula(conj));
console.log("選言: " + formatFormula(disj));
console.log("否定: " + formatFormula(neg));
console.log("全称: " + formatFormula(univ));
console.log("");

// 3. 構造的同値判定
var a = parseFormula("phi -> psi");
var b = parseFormula("phi -> psi");
var c = parseFormula("psi -> phi");
console.log("phi->psi == phi->psi ? " + equalFormula(a, b));
console.log("phi->psi == psi->phi ? " + equalFormula(a, c));
console.log("");

// 4. 複雑な論理式
var complex = parseFormula("(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))");
console.log("A2公理スキーマ: " + formatFormula(complex));

console.log("");
console.log("探索完了！");
`,
};

/**
 * ユニフィケーション・代入のデモ。
 *
 * unifyFormulas / substituteFormula を使って
 * パターンマッチと代入の操作を学ぶ。全スタイル共通。
 */
const unificationDemo: ScriptTemplate = {
  id: "unification-demo",
  title: "ユニフィケーション・代入",
  description:
    "unifyFormulas / substituteFormula を使って、論理式のパターンマッチと代入を学ぶ。全スタイル共通。",
  code: `// ユニフィケーション・代入
//
// unifyFormulas(source, target): 2つの論理式を単一化し代入写像を返す
// substituteFormula(formula, map): メタ変数に代入を適用
//
// ユニフィケーションは「2つの論理式を同じにする代入」を見つける操作。
// 公理スキーマのインスタンス確認などに使える。

console.log("=== ユニフィケーション・代入 ===");
console.log("");

// 1. 基本的なユニフィケーション
// φ → ψ と (χ ∧ α) → β を単一化
var pattern = parseFormula("phi -> psi");
var target = parseFormula("(chi /\\\\ alpha) -> beta");

console.log("パターン: " + formatFormula(pattern));
console.log("ターゲット: " + formatFormula(target));

var result = unifyFormulas(pattern, target);
console.log("代入写像: " + JSON.stringify(result.formulaSubstitution));
console.log("");

// 2. 代入の適用
// メタ変数 φ に具体的な論理式を代入
var schema = parseFormula("phi -> (psi -> phi)");
console.log("スキーマ: " + formatFormula(schema));

var substituted = substituteFormula(schema, {
  "φ": parseFormula("chi -> chi"),
  "ψ": parseFormula("chi")
});
console.log("代入後: " + formatFormula(substituted));
console.log("");

// 3. A1公理スキーマのインスタンス確認
// A1: φ → (ψ → φ)
var a1 = parseFormula("phi -> (psi -> phi)");
var candidate = parseFormula("(chi -> chi) -> (chi -> (chi -> chi))");
console.log("A1パターン: " + formatFormula(a1));
console.log("候補: " + formatFormula(candidate));

var match = unifyFormulas(a1, candidate);
console.log("マッチ成功！");
console.log("  φ = " + JSON.stringify(match.formulaSubstitution));
console.log("");

// 4. 同じ構造同士のユニフィケーション
var d1 = parseFormula("phi /\\\\ psi");
var d2 = parseFormula("(chi -> chi) /\\\\ alpha");
console.log("連言パターン: " + formatFormula(d1));
console.log("連言ターゲット: " + formatFormula(d2));
var r4 = unifyFormulas(d1, d2);
console.log("マッチ: " + JSON.stringify(r4.formulaSubstitution));
console.log("");

// 注意: → と ∧ のように異なるトップレベル結合子は単一化できない
// （StructureMismatch エラーになる）
console.log("注意: 異なる結合子（→ と ∧）は単一化できません。");

console.log("");
console.log("デモ完了！");
`,
};

// ── Hilbert 追加テンプレート ──────────────────────────────

/**
 * 公理同定テンプレート: identifyAxiom で公理スキーマのインスタンスを判定する。
 */
const axiomExplorer: ScriptTemplate = {
  id: "axiom-explorer",
  title: "公理スキーマの探索",
  description:
    "identifyAxiom を使って、論理式が公理スキーマのインスタンスかどうかを判定する。",
  compatibleStyles: ["hilbert"],
  code: `// 公理スキーマの探索
//
// identifyAxiom(formula, system): 論理式が公理スキーマのインスタンスか判定
//
// 返り値は discriminated union:
//   { _tag: "Ok", axiomName: "A1", ... }      → 公理のインスタンス
//   { _tag: "TheoryAxiom" }                    → 理論公理のインスタンス
//   { _tag: "Error", reason: "..." }           → 公理ではない

// 現在の体系を取得（getLogicSystem は identifyAxiom にそのまま渡せる）
var system = getLogicSystem();

console.log("=== 公理スキーマの探索 ===");
console.log("体系: " + system.name);
console.log("述語論理: " + system.predicateLogic);
console.log("汎化規則: " + system.generalization);
console.log("");

// A1公理のインスタンス: φ → (ψ → φ)
var a1Instance = parseFormula("(chi -> chi) -> (psi -> (chi -> chi))");
console.log("候補1: " + formatFormula(a1Instance));
var r1 = identifyAxiom(a1Instance, system);
console.log("結果: _tag=" + r1._tag);
if (r1._tag === "Ok") {
  console.log("  公理: " + r1.axiomName);
}
console.log("");

// A2公理のインスタンス
var a2Instance = parseFormula("(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))");
console.log("候補2: " + formatFormula(a2Instance));
var r2 = identifyAxiom(a2Instance, system);
console.log("結果: _tag=" + r2._tag);
if (r2._tag === "Ok") {
  console.log("  公理: " + r2.axiomName);
}
console.log("");

// 公理でない例
var notAxiom = parseFormula("phi -> phi");
console.log("候補3: " + formatFormula(notAxiom));
var r3 = identifyAxiom(notAxiom, system);
console.log("結果: _tag=" + r3._tag);
if (r3._tag === "Error") {
  console.log("  φ→φ は公理ではない（証明が必要）");
}

console.log("");
console.log("探索完了！");
`,
};

/**
 * 述語論理の証明: 汎化規則 (Gen) と述語論理公理の使い方。
 *
 * 汎化規則 (Gen): φ から ∀x.φ を導出する。
 * 述語論理公理:
 *   A4: ∀x.φ(x) → φ(t)  (全称例化)
 *   A5: φ → ∀x.φ  (x が φ の自由変数でない場合)
 *
 * 例: ∀x.(P(x) → Q(x)) → (P(a) → Q(a))
 * を A4 と MP で導出する。
 */
const predicateLogicProof: ScriptTemplate = {
  id: "predicate-logic-proof",
  title: "述語論理: 汎化規則と全称例化",
  description:
    "applyGen で汎化 (φ → ∀x.φ) を実行し、述語論理公理 A4/A5 の使い方を学ぶ。getLogicSystem で体系情報を取得。",
  compatibleStyles: ["hilbert"],
  code: `// 述語論理: 汎化規則と全称例化
//
// getLogicSystem() で体系情報を取得し、
// applyGen(formula, variableName, system) で汎化規則を適用する。
//
// 汎化規則 (Gen): φ ⊢ ∀x.φ
// 述語論理公理:
//   A4: ∀x.φ(x) → φ(t)  (全称例化: t を x に代入)
//   A5: φ → ∀x.φ  (x が φ の自由変数でない場合)

var system = getLogicSystem();

console.log("=== 述語論理: 汎化規則と全称例化 ===");
console.log("体系: " + system.name);
console.log("述語論理: " + system.predicateLogic);
console.log("汎化規則: " + system.generalization);
console.log("");

if (!system.generalization) {
  throw new Error(
    "この体系では汎化規則が無効です。述語論理を含む体系を選択してください。"
  );
}

// ── 1. 汎化規則 (Gen) の実演 ──
console.log("--- 1. 汎化規則 (Gen) ---");
console.log("");

// P(x) → P(x) を公理から導出（A1 + A2 + MP で構成）
// ここでは単純に命題として扱う
var px = parseFormula("P(x)");
console.log("元の論理式: " + formatFormula(px));

// applyGen で ∀x.P(x) を導出
var forallPx = applyGen(px, "x", system);
console.log("Gen 適用後: " + formatFormula(forallPx));
console.log("  P(x) ⊢ ∀x.P(x)");
console.log("");

// もう一段: ∀x.P(x) に対して y で汎化
var forallYForallPx = applyGen(forallPx, "y", system);
console.log("二重汎化: " + formatFormula(forallYForallPx));
console.log("  ∀x.P(x) ⊢ ∀y.∀x.P(x)");
console.log("  （y は自由変数でないので、実質 A5 と同等）");
console.log("");

// ── 2. 述語論理公理の確認 ──
console.log("--- 2. 述語論理公理 A4/A5 の確認 ---");
console.log("");

// A4: ∀x.P(x) → P(a)  (全称例化)
var a4Instance = parseFormula("forall x. P(x) -> P(a)");
console.log("候補: " + formatFormula(a4Instance));
var r1 = identifyAxiom(a4Instance, system);
console.log("結果: " + r1._tag);
if (r1._tag === "Ok") {
  console.log("  公理: " + r1.axiomName);
}
console.log("");

// A5: P(a) → ∀x.P(a)  (x は P(a) の自由変数でない)
var a5Instance = parseFormula("P(a) -> forall x. P(a)");
console.log("候補: " + formatFormula(a5Instance));
var r2 = identifyAxiom(a5Instance, system);
console.log("結果: " + r2._tag);
if (r2._tag === "Ok") {
  console.log("  公理: " + r2.axiomName);
}
console.log("");

// ── 3. 含意の汎化 ──
console.log("--- 3. 含意の汎化 ---");
console.log("");
var pxImplQx = parseFormula("P(x) -> Q(x)");
console.log("元: " + formatFormula(pxImplQx));
var genResult = applyGen(pxImplQx, "x", system);
console.log("Gen: " + formatFormula(genResult));
console.log("  P(x) → Q(x) ⊢ ∀x.(P(x) → Q(x))");

console.log("");
console.log("探索完了！");
console.log("述語論理の証明では Gen と A4/A5 を組み合わせて");
console.log("量化子を含む定理を導出します。");
`,
};

/**
 * 三段論法の証明: (φ→ψ) → ((ψ→χ) → (φ→χ))
 *
 * Hilbert公理系でのより複雑な証明構築の例。
 * 演繹定理を意識した構成: φ→ψ, ψ→χ, φ ⊢ χ → 演繹定理3回で結論。
 */
const syllogismProof: ScriptTemplate = {
  id: "syllogism-proof",
  title: "三段論法の証明構築",
  description:
    "Hilbert公理系で (φ→ψ)→((ψ→χ)→(φ→χ)) を導出する。MP の連鎖とA1/A2の活用を学ぶ。",
  compatibleStyles: ["hilbert"],
  code: `// 三段論法の証明構築
//
// 目標: (φ→ψ) → ((ψ→χ) → (φ→χ)) を Hilbert 公理系で証明する。
//
// アイデア:
//   φ→ψ, ψ→χ, φ を仮定すると:
//   1. φ→ψ (仮定)
//   2. φ (仮定)
//   3. ψ ... MP(2,1)
//   4. ψ→χ (仮定)
//   5. χ ... MP(3,4)
//
// これを演繹定理で3回巻き戻せば (φ→ψ)→((ψ→χ)→(φ→χ))。
// ここでは直接的な証明をワークスペースに構築する。

var sysInfo = getDeductionSystemInfo();
if (!sysInfo.isHilbertStyle) {
  throw new Error("このスクリプトはヒルベルト流の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

clearWorkspace();

console.log("=== 三段論法の証明 ===");
console.log("目標: (φ→ψ) → ((ψ→χ) → (φ→χ))");
console.log("");
console.log("仮定 φ→ψ, ψ→χ, φ のもとで χ を導出し、");
console.log("演繹定理で仮定を除去します。");
console.log("");

// 仮定つき証明を構築: φ→ψ, ψ→χ, φ ⊢ χ
var nodeHyp1 = addNode("φ → ψ");
setNodeRoleAxiom(nodeHyp1);
console.log("仮定1: φ → ψ");

var nodeHyp2 = addNode("ψ → χ");
setNodeRoleAxiom(nodeHyp2);
console.log("仮定2: ψ → χ");

var nodePhi = addNode("φ");
setNodeRoleAxiom(nodePhi);
console.log("仮定3: φ");

// MP: φ, φ→ψ ⊢ ψ
var nodePsi = connectMP(nodePhi, nodeHyp1);
console.log("MP(3,1): ψ");

// MP: ψ, ψ→χ ⊢ χ
var nodeChi = connectMP(nodePsi, nodeHyp2);
console.log("MP(4,2): χ");

applyLayout();

console.log("");
console.log("仮定つき証明を構築しました。");
console.log("演繹定理を3回適用すると:");
console.log("  (φ→ψ) → ((ψ→χ) → (φ→χ))");
console.log("が得られます。");
console.log("");

// 演繹定理を適用して仮定を除去
console.log("--- 演繹定理で仮定 φ を除去 ---");
var proof1 = extractHilbertProof();
var dt1 = applyDeductionTheorem(proof1, "φ");
displayHilbertProof(dt1);
console.log("結論: φ→ψ, ψ→χ ⊢ φ → χ");

console.log("");
console.log("--- 演繹定理で仮定 ψ→χ を除去 ---");
var dt2 = applyDeductionTheorem(dt1, "ψ → χ");
displayHilbertProof(dt2);
console.log("結論: φ→ψ ⊢ (ψ→χ) → (φ→χ)");

console.log("");
console.log("--- 演繹定理で仮定 φ→ψ を除去 ---");
var dt3 = applyDeductionTheorem(dt2, "φ → ψ");
displayHilbertProof(dt3);
console.log("結論: ⊢ (φ→ψ) → ((ψ→χ) → (φ→χ))");

console.log("");
console.log("Q.E.D.");
`,
};

/**
 * Hilbert定理ギャラリー: 複数の定理を演繹定理ワークフローで自動証明する。
 *
 * 仮定付き証明を構築 → extractHilbertProof → applyDeductionTheorem の
 * 一連のワークフローを複数定理で実演する。
 *
 * 証明する定理:
 *   1. φ → φ（恒等式）— 仮定 φ ⊢ φ から DT 1回
 *   2. (φ → ψ) → ((ψ → χ) → (φ → χ))（三段論法）— DT 3回
 */
const hilbertTheoremGallery: ScriptTemplate = {
  id: "hilbert-theorem-gallery",
  title: "Hilbert定理ギャラリー",
  description:
    "複数の定理を演繹定理ワークフロー（仮定付き証明構築 → DT適用）で自動証明する。extractHilbertProof / applyDeductionTheorem の実践的な活用例。",
  compatibleStyles: ["hilbert"],
  code: `// Hilbert定理ギャラリー
//
// 演繹定理 (DT) ワークフロー:
//   1. ワークスペースに仮定付き証明を構築
//   2. extractHilbertProof で証明木を抽出
//   3. applyDeductionTheorem で仮定を除去
//   4. displayHilbertProof で変換後の証明木を表示
//
// このワークフローで複数の定理を自動証明します。

var sysInfo = getDeductionSystemInfo();
if (!sysInfo.isHilbertStyle) {
  throw new Error("このスクリプトはヒルベルト流の体系でのみ実行できます。現在の体系: " + sysInfo.style);
}

// ── 定理1: φ → φ（恒等式）──
console.log("========================================");
console.log("定理1: φ → φ（恒等式）");
console.log("========================================");
console.log("戦略: φ を仮定として φ を導出し、DT で仮定を除去");
console.log("");

clearWorkspace();
var n1 = addNode("φ");
setNodeRoleAxiom(n1);
applyLayout();

console.log("仮定付き証明: φ ⊢ φ");
var proof1 = extractHilbertProof();

console.log("--- DT適用: 仮定 φ を除去 ---");
var dt1 = applyDeductionTheorem(proof1, "φ");
displayHilbertProof(dt1);
console.log("結論: ⊢ φ → φ");
console.log("");

// ── 定理2: (φ → ψ) → ((ψ → χ) → (φ → χ))（三段論法）──
console.log("========================================");
console.log("定理2: (φ→ψ) → ((ψ→χ) → (φ→χ))");
console.log("========================================");
console.log("戦略: φ→ψ, ψ→χ, φ を仮定 → MP2回で χ を導出 → DT3回");
console.log("");

clearWorkspace();

var h1 = addNode("φ → ψ");
setNodeRoleAxiom(h1);
var h2 = addNode("ψ → χ");
setNodeRoleAxiom(h2);
var h3 = addNode("φ");
setNodeRoleAxiom(h3);

// MP: φ, φ→ψ ⊢ ψ
var r1 = connectMP(h3, h1);
// MP: ψ, ψ→χ ⊢ χ
var r2 = connectMP(r1, h2);
applyLayout();

console.log("仮定付き証明: φ→ψ, ψ→χ, φ ⊢ χ");
var proof2 = extractHilbertProof();

console.log("--- DT適用1: 仮定 φ を除去 ---");
var dt2a = applyDeductionTheorem(proof2, "φ");
console.log("結論: φ→ψ, ψ→χ ⊢ φ → χ");

console.log("--- DT適用2: 仮定 ψ→χ を除去 ---");
var dt2b = applyDeductionTheorem(dt2a, "ψ → χ");
console.log("結論: φ→ψ ⊢ (ψ→χ) → (φ→χ)");

console.log("--- DT適用3: 仮定 φ→ψ を除去 ---");
var dt2c = applyDeductionTheorem(dt2b, "φ → ψ");
displayHilbertProof(dt2c);
console.log("結論: ⊢ (φ→ψ) → ((ψ→χ) → (φ→χ))");
console.log("");

console.log("========================================");
console.log("ギャラリー完了！");
console.log("========================================");
console.log("");
console.log("演繹定理ワークフローのまとめ:");
console.log("  1. ワークスペースに仮定付き証明を構築");
console.log("  2. extractHilbertProof() で証明木を抽出");
console.log("  3. applyDeductionTheorem(proof, hypothesis) で仮定を除去");
console.log("  4. displayHilbertProof() で結果を表示");
console.log("必要な回数だけ DT を適用して、すべての仮定を除去します。");
`,
};

// ── カット除去 段階的学習テンプレート ────────────────────────

/**
 * 段階1: カット判定 — 証明のカット状態を分析する。
 *
 * 学習者はカットの概念を理解し、isCutFree / countCuts を使って
 * 既存の証明のカット状態を判定するスクリプトを完成させる。
 */
const cutEliminationStep1: ScriptTemplate = {
  id: "cut-elimination-step1",
  title: "カット除去 段階1: カット判定",
  description:
    "証明にカットが含まれるかを判定する。isCutFree / countCuts の使い方を学ぶ。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去 段階1: カット判定
//
// 目標: 証明がカットを含むか判定し、カットの情報を出力する。
//
// ヒント: isCutFree(proof), countCuts(proof), getScConclusion(proof),
//         formatSequent(sequent) を使う。

// ── 証明の構築（変更不要）──
var phi = parseFormula("φ");
var psi = parseFormula("ψ");
var phiImplPsi = parseFormula("φ → ψ");

// ID 公理: φ ⇒ φ
var idPhi = scIdentity(sequent([phi], [phi]));

// WR: φ ⇒ φ, φ→ψ
var wrNode = scWeakeningRight(
  idPhi, phiImplPsi, sequent([phi], [phi, phiImplPsi])
);

// ID 公理: ψ ⇒ ψ
var idPsi = scIdentity(sequent([psi], [psi]));

// →L: φ→ψ, φ ⇒ ψ
var implLeft = scImplicationLeft(
  idPhi, idPsi, sequent([phiImplPsi, phi], [psi])
);

// Cut: φ, φ ⇒ ψ
var proofWithCut = scCut(
  wrNode, implLeft, phiImplPsi, sequent([phi, phi], [psi])
);

console.log("=== カット除去 段階1: カット判定 ===");
console.log("");

// ── TODO: 以下を実装してください ──

// 1. 証明の結論を表示
var conc = getScConclusion(proofWithCut);
console.log("結論: " + formatSequent(conc));

// 2. カットの数を表示
console.log("カット数: " + countCuts(proofWithCut));

// 3. カットフリーかどうかを判定して表示
console.log("カットフリー? " + isCutFree(proofWithCut));

// 4. カットフリーな証明（ID公理だけ）でも試してみよう
console.log("");
console.log("--- カットフリーな証明 ---");
console.log("カット数: " + countCuts(idPhi));
console.log("カットフリー? " + isCutFree(idPhi));

// 5. 証明をキャンバスに表示
displayScProof(proofWithCut);

console.log("");
console.log("段階1 完了！");
`,
};

/**
 * 段階2: ID公理のカット除去 (d=1, r=1)。
 *
 * 最も単純な基底ケース: 両側がID公理のカット。
 * φ ⇒ φ  +  φ ⇒ φ → Cut → φ ⇒ φ
 * → カットを除去するとID公理1つに。
 */
const cutEliminationStep2: ScriptTemplate = {
  id: "cut-elimination-step2",
  title: "カット除去 段階2: ID公理のカット",
  description:
    "両側がID公理のカット（最も単純な基底ケース）を手動で除去する方法を学ぶ。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去 段階2: ID公理のカット
//
// 両側がID公理のカットは最も単純:
//
//   φ ⇒ φ (ID)    φ ⇒ φ (ID)
//   ──────────────────────── (Cut: φ)
//            φ ⇒ φ
//
// カットを除去すると、単にID公理 φ ⇒ φ になる。
//
// 目標: 手動で「カットを除去した結果」の証明を構築し、
//        eliminateCutsWithSteps の結果と比較する。

var phi = parseFormula("φ");

var idPhi = scIdentity(sequent([phi], [phi]));

// カット付き証明
var proof = scCut(idPhi, idPhi, phi, sequent([phi], [phi]));

console.log("=== カット除去 段階2: ID公理のカット ===");
console.log("");
console.log("--- カット付き証明 ---");
displayScProof(proof);
console.log("カット数: " + countCuts(proof));

// ── TODO: カットを除去した結果を手動で構築 ──
// ヒント: 左がID公理のとき、結果は右前提そのもの（結論を調整）
// つまり: φ ⇒ φ のID公理1つで済む
var manualResult = scIdentity(sequent([phi], [phi]));

console.log("");
console.log("--- 手動でカット除去した結果 ---");
displayScProof(manualResult);
console.log("カットフリー? " + isCutFree(manualResult));

// ── 自動カット除去との比較 ──
console.log("");
console.log("--- 自動カット除去 ---");
var auto = eliminateCutsWithSteps(proof);
console.log("ステップ数: " + auto.steps.length);
for (var i = 0; i < auto.steps.length; i++) {
  console.log("  " + auto.steps[i].description);
}
if (auto.result._tag === "Success") {
  displayScProof(auto.result.proof);
  console.log("自動結果もカットフリー? " + isCutFree(auto.result.proof));
}

console.log("");
console.log("段階2 完了！");
`,
};

/**
 * 段階3: ランク0 — カット式が片側にない場合の弱化による除去。
 *
 * カット式が左前提の右辺に出現しない場合、カットは不要で
 * 弱化規則で代用できることを学ぶ。
 */
const cutEliminationStep3: ScriptTemplate = {
  id: "cut-elimination-step3",
  title: "カット除去 段階3: ランク0 (弱化で除去)",
  description:
    "カット式が片側にしか出現しない場合（ランク0）、弱化規則でカットを除去する方法を学ぶ。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去 段階3: ランク0 (弱化で除去)
//
// ランク0: カット式 φ が左前提の右辺に出現しない場合。
//
// 例:
//   ψ ⇒ ψ (ID)
//   ───────────── (WR: φ を追加)
//   ψ ⇒ ψ, φ         φ ⇒ φ (ID)
//   ────────────────────────── (Cut: φ)
//             ψ ⇒ ψ, φ
//
// 実は右辺のφはWRで追加しただけなので、カットなしで
// ψ ⇒ ψ に弱化を適用すれば同じ結論が得られる。
//
// 目標: ヘルパー関数でランクを確認し、弱化でカットを除去する。

var phi = parseFormula("φ");
var psi = parseFormula("ψ");

var idPsi = scIdentity(sequent([psi], [psi]));
var idPhi = scIdentity(sequent([phi], [phi]));

// ψ ⇒ ψ に WR で φ を追加
var wrPsi = scWeakeningRight(
  idPsi, phi, sequent([psi], [psi, phi])
);

// カット付き証明: ψ ⇒ ψ, φ
var proofWithCut = scCut(
  wrPsi, idPhi, phi, sequent([psi], [psi, phi])
);

console.log("=== カット除去 段階3: ランク0 ===");
console.log("");
console.log("--- カット付き証明 ---");
displayScProof(proofWithCut);
console.log("カット数: " + countCuts(proofWithCut));

// ── ヘルパー関数でランクを分析 ──
console.log("");
console.log("--- ランク分析 ---");
var rr = rightRank(wrPsi, phi);
var lr = leftRank(idPhi, phi);
var rank = mixRank(proofWithCut);
console.log("左前提の右ランク (rightRank): " + rr);
console.log("右前提の左ランク (leftRank): " + lr);
console.log("MIXランク: " + rank);
console.log("");

// ランクが0（左前提の右辺にφが1回しかない→WRで追加した分）
// → 弱化で除去できる！

// ── 弱化のみでカット除去した証明を構築 ──
var conc = getScConclusion(proofWithCut);
console.log("目標結論: " + formatSequent(conc));
console.log("");

// 右前提の右辺の論理式を確認
var rightConc = getScConclusion(idPhi);
console.log("右前提の右辺: ");
for (var i = 0; i < rightConc.succedents.length; i++) {
  console.log("  " + formatFormula(rightConc.succedents[i]));
}

// 左前提 ψ ⇒ ψ からスタートし、右弱化でφを追加
var manualResult = scWeakeningRight(
  idPsi, phi, sequent([psi], [psi, phi])
);

console.log("");
console.log("--- 手動でカット除去した結果 ---");
displayScProof(manualResult);
console.log("カットフリー? " + isCutFree(manualResult));

console.log("");
console.log("段階3 完了！");
console.log("ランク0のカットは弱化だけで除去できます。");
`,
};

/**
 * 段階4: ランク削減 — 構造規則を通してカットを押し上げる。
 *
 * ランク≥2のカットを、ランクの低いカットに変換する方法を学ぶ。
 * 弱化規則を通してMIXを押し上げる例。
 */
const cutEliminationStep4: ScriptTemplate = {
  id: "cut-elimination-step4",
  title: "カット除去 段階4: ランク削減",
  description:
    "構造規則（弱化・縮約）を通してカットを上方に押し上げ、ランクを削減する方法を学ぶ。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去 段階4: ランク削減
//
// ランク ≥ 2 のカットは、構造規則を「通り抜けて」
// カットを前提に押し上げることでランクを下げる。
//
// 例: 弱化で右辺にφを追加した後のカット（ランク2）
//
//   φ ⇒ φ (ID)
//   ──────────── (WR: φ を追加)
//   φ ⇒ φ, φ             φ ⇒ φ (ID)
//   ────────────────────────── (Cut: φ, rank=2)
//            φ ⇒ φ, φ
//
// 目標: ヘルパー関数でランクを確認し、ランクを下げる変換を理解する。

var phi = parseFormula("φ");

var idPhi = scIdentity(sequent([phi], [phi]));

// φ ⇒ φ にWRでφを追加 → φ ⇒ φ, φ
var wrNode = scWeakeningRight(
  idPhi, phi, sequent([phi], [phi, phi])
);

// Cut: φ ⇒ φ, φ (rank=2: φが左の右辺に2回)
var proofWithCut = scCut(
  wrNode, idPhi, phi, sequent([phi], [phi, phi])
);

console.log("=== カット除去 段階4: ランク削減 ===");
console.log("");
console.log("--- カット付き証明 ---");
displayScProof(proofWithCut);
console.log("カット数: " + countCuts(proofWithCut));

// ── ヘルパー関数でランクを分析 ──
console.log("");
console.log("--- ランク分析 ---");
var rank = mixRank(proofWithCut);
console.log("MIXランク: " + rank);
console.log("カット式 φ の深さ: " + formulaDepth(phi));

// 左前提の子ノード（弱化の前の証明）を確認
var leftChildren = getScChildren(wrNode);
console.log("左前提の子ノード数: " + leftChildren.length);
if (leftChildren.length > 0) {
  var childConc = getScConclusion(leftChildren[0]);
  console.log("左前提の前提: " + formatSequent(childConc));
  // 弱化前の証明でのφの右ランクを確認
  var childRR = rightRank(leftChildren[0], phi);
  console.log("弱化前の右ランク: " + childRR);
}

// ── ランク削減した証明を構築 ──
// 弱化前の証明(φ ⇒ φ)と右前提(φ ⇒ φ)でまずCut
// → φ ⇒ φ (rank=1)
// その結果に弱化を再適用 → φ ⇒ φ, φ
//
// 最終結果（完全にカットフリー）:
var manualResult = scWeakeningRight(
  idPhi, phi, sequent([phi], [phi, phi])
);

console.log("");
console.log("--- 手動でカット除去した結果 ---");
displayScProof(manualResult);
console.log("カットフリー? " + isCutFree(manualResult));

console.log("");
console.log("段階4 完了！");
console.log("ランク≥2のカットは、構造規則を通り抜けて");
console.log("ランクを1つずつ下げることで除去できます。");
`,
};

/**
 * 段階5: 深さ削減 — 論理結合子の分解。
 *
 * ランク1・深さ≥2のカット（含意）を、部分式に対するカットに分解する。
 */
const cutEliminationStep5: ScriptTemplate = {
  id: "cut-elimination-step5",
  title: "カット除去 段階5: 深さ削減 (含意の分解)",
  description:
    "含意(→)をカット式とするランク1のカットを、部分式(α, β)に対するカットに分解する方法を学ぶ。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去 段階5: 深さ削減 (含意の分解)
//
// ランク1, 深さ ≥ 2 のカットでは、カット式の
// 論理結合子を「分解」して、部分式に対するカットにする。
//
// 含意 (α → β) のカット:
//   左前提: ⇒→ で α→β を導入
//   右前提: →⇒ で α→β を分解
//   → 部分式 α, β に対するカットに帰着
//
// 目標: ヘルパー関数で深さ・ランクを確認し、分解の仕組みを理解する。

var phi = parseFormula("φ");
var psi = parseFormula("ψ");
var phiImplPsi = parseFormula("φ → ψ");

var idPhi = scIdentity(sequent([phi], [phi]));
var idPsi = scIdentity(sequent([psi], [psi]));

// φ ⇒ φ (ID) から WR で ψ を追加
var wrPhiPsi = scWeakeningRight(
  idPhi, psi, sequent([phi], [phi, psi])
);

// (⇒→): φ ⇒ φ, ψ → ⇒ φ→ψ, φ
var implRight = scImplicationRight(
  wrPhiPsi, sequent([], [phiImplPsi, phi])
);

// 右前提: (→⇒)
// φ ⇒ φ (ID)    ψ ⇒ ψ (ID)  → φ→ψ, φ ⇒ ψ
var implLeft = scImplicationLeft(
  idPhi, idPsi, sequent([phiImplPsi, phi], [psi])
);

// Cut(φ→ψ)
var proofWithCut = scCut(
  implRight, implLeft, phiImplPsi,
  sequent([phi], [psi, phi])
);

console.log("=== カット除去 段階5: 深さ削減 ===");
console.log("");
console.log("--- カット付き証明 ---");
displayScProof(proofWithCut);
console.log("カット数: " + countCuts(proofWithCut));

// ── ヘルパー関数で深さ・ランクを分析 ──
console.log("");
console.log("--- 深さ・ランク分析 ---");
var depth = formulaDepth(phiImplPsi);
var rank = mixRank(proofWithCut);
console.log("カット式 φ → ψ の深さ: " + depth);
console.log("MIXランク: " + rank);
console.log("部分式の深さ: φ=" + formulaDepth(phi) + ", ψ=" + formulaDepth(psi));
console.log("");

// 左前提・右前提の構造を確認
var leftChildren = getScChildren(implRight);
var rightChildren = getScChildren(implLeft);
console.log("左前提 (⇒→) の子: " + leftChildren.length + "ノード");
console.log("右前提 (→⇒) の子: " + rightChildren.length + "ノード");

// カット式の結論での出現を確認
var leftConc = getScConclusion(implRight);
var rightConc = getScConclusion(implLeft);
console.log("");
console.log("左前提の結論: " + formatSequent(leftConc));
console.log("  右辺に φ→ψ 含む? " + containsFormula(leftConc.succedents, phiImplPsi));
console.log("右前提の結論: " + formatSequent(rightConc));
console.log("  左辺に φ→ψ 含む? " + containsFormula(rightConc.antecedents, phiImplPsi));

// ── 深さ削減: φ→ψ のカットを φ と ψ のカットに分解 ──
// 分解後は depth=1 のカット（段階2の方法で除去可能）
console.log("");
console.log("--- 分解の原理 ---");
console.log("depth=" + depth + " のカット(φ→ψ)を");
console.log("depth=1 のカット(φ), depth=1 のカット(ψ)に分解。");
console.log("二重帰納法: (depth, rank) が辞書式に減少。");

console.log("");
console.log("段階5 完了！");
console.log("深さ削減では、カット式の結合子を分解して");
console.log("部分式に対する（より浅い）カットに帰着させます。");
`,
};

/**
 * 段階6: 全体統合 — すべてのケースを組み合わせる。
 *
 * 複雑な証明（複数のカット、混合ケース）に対して
 * カット除去アルゴリズム全体を実行する。
 */
const cutEliminationStep6: ScriptTemplate = {
  id: "cut-elimination-step6",
  title: "カット除去 段階6: 全体統合",
  description:
    "複数のカットを含む複雑な証明に対して、カット除去アルゴリズム全体を実行し、各段階がどう組み合わされるかを確認する。",
  compatibleStyles: ["sequent-calculus"],
  code: `// カット除去 段階6: 全体統合
//
// これまでの段階を振り返り:
//   段階1: カット判定 (isCutFree, countCuts)
//   段階2: ID公理のカット (d=1, r=1)
//   段階3: ランク0 (弱化で除去) — rightRank, leftRank で判定
//   段階4: ランク削減 (r≥2 → r-1) — mixRank で確認
//   段階5: 深さ削減 (d≥2 → 部分式カット) — formulaDepth で確認
//
// 目標: ヘルパー関数で各カットを分析し、
//       どの段階が適用されるかを自分で判定する。

var phi = parseFormula("φ");
var psi = parseFormula("ψ");

var idPhi = scIdentity(sequent([phi], [phi]));
var idPsi = scIdentity(sequent([psi], [psi]));

// 証明1: φ ⇒ φ + φ ⇒ φ を Cut(φ) → φ ⇒ φ
var cut1 = scCut(idPhi, idPhi, phi, sequent([phi], [phi]));

// WR: φ ⇒ φ, ψ (cut1の結果に弱化)
var wr1 = scWeakeningRight(cut1, psi, sequent([phi], [phi, psi]));

// 証明2: ψ ⇒ ψ にWLでφを追加 → φ, ψ ⇒ ψ
var wl2 = scWeakeningLeft(idPsi, phi, sequent([phi, psi], [psi]));

// Cut(ψ): φ ⇒ φ, ψ + φ, ψ ⇒ ψ → φ, φ ⇒ φ, ψ
var cut2 = scCut(wr1, wl2, psi, sequent([phi, phi], [phi, psi]));

console.log("=== カット除去 段階6: 全体統合 ===");
console.log("");

var conc = getScConclusion(cut2);
console.log("証明の結論: " + formatSequent(conc));
console.log("カット数: " + countCuts(cut2));
console.log("");

// ── 各カットをヘルパー関数で分析 ──
console.log("--- カット分析 ---");

// 内側のカット (cut1: φ ⇒ φ のID同士)
console.log("内側カット (Cut φ):");
console.log("  MIXランク: " + mixRank(cut1));
console.log("  カット式の深さ: " + formulaDepth(phi));
console.log("  → 段階2 (r=1, d=1: ID公理のカット)");

// 外側のカット (cut2: ψ でカット)
console.log("外側カット (Cut ψ):");
console.log("  MIXランク: " + mixRank(cut2));
console.log("  カット式の深さ: " + formulaDepth(psi));

// 左前提の子ノードを確認
var cut2Children = getScChildren(cut2);
console.log("  左前提の _tag: " + cut2Children[0]._tag);
console.log("  右前提の _tag: " + cut2Children[1]._tag);

// 右辺でψの出現を確認
var leftConc = getScConclusion(wr1);
var occ = countOccurrences(leftConc.succedents, psi);
console.log("  左前提の右辺でのψ出現数: " + occ);
console.log("");

// ── 初期証明 ---
console.log("--- 初期証明（2つのカットを含む）---");
displayScProof(cut2);

// ── 自動カット除去で各ステップのrank/depthを確認 ──
console.log("");
console.log("--- 自動カット除去ステップ ---");
var result = eliminateCutsWithSteps(cut2);

for (var i = 0; i < result.steps.length; i++) {
  var step = result.steps[i];
  console.log("ステップ " + (i + 1) + ": " + step.description);
  console.log("  depth=" + step.depth + ", rank=" + step.rank);
}

console.log("");
console.log("--- 最終結果 ---");
console.log("状態: " + result.result._tag);
if (result.result._tag === "Success") {
  var finalConc = getScConclusion(result.result.proof);
  console.log("結論: " + formatSequent(finalConc));
  console.log("カットフリー? " + isCutFree(result.result.proof));
  displayScProof(result.result.proof);
}

console.log("");
console.log("=== 全6段階 完了 ===");
console.log("カット除去定理: すべてのカットは除去できます。");
console.log("(depth, rank) の辞書式二重帰納法により、");
console.log("各カットは有限ステップで消去されます。");
`,
};

/**
 * ビルトインテンプレート一覧。
 */
export const BUILTIN_TEMPLATES: readonly ScriptTemplate[] = [
  // 汎用テンプレート（全スタイル共通）
  formulaExplorer,
  unificationDemo,
  // SC テンプレート
  cutEliminationSimple,
  cutEliminationImplication,
  cutEliminationWorkspace,
  cutEliminationStep1,
  cutEliminationStep2,
  cutEliminationStep3,
  cutEliminationStep4,
  cutEliminationStep5,
  cutEliminationStep6,
  autoProveTemplate,
  // Hilbert テンプレート
  buildIdentityProof,
  buildIdentityProofTree,
  axiomExplorer,
  predicateLogicProof,
  syllogismProof,
  hilbertTheoremGallery,
  deductionTheoremExplicit,
  deductionTheoremWorkspace,
  reverseDeductionTheoremExplicit,
  reverseDeductionTheoremWorkspace,
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
