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

// ワークスペースをクリアして証明木を構築
clearWorkspace();

console.log("=== φ→φ の証明ツリー構築 ===");
console.log("体系: " + sysInfo.systemName);
console.log("");

// ステップ 1: A2 のインスタンス
var a2Text = "(φ → ((ψ → φ) → φ)) → ((φ → (ψ → φ)) → (φ → φ))";
var node1 = addNode(a2Text);
setNodeRoleAxiom(node1);
console.log("1. " + formatFormula(parseFormula(a2Text)) + "  [A2]");

// ステップ 2: A1 のインスタンス
var a1Text1 = "φ → ((ψ → φ) → φ)";
var node2 = addNode(a1Text1);
setNodeRoleAxiom(node2);
console.log("2. " + formatFormula(parseFormula(a1Text1)) + "  [A1]");

// ステップ 3: MP(2, 1) → (φ→(ψ→φ))→(φ→φ)
var node3 = connectMP(node2, node1);
console.log("3. " + formatFormula(parseFormula("(φ → (ψ → φ)) → (φ → φ)")) + "  [MP 2,1]");

// ステップ 4: A1 のインスタンス
var a1Text2 = "φ → (ψ → φ)";
var node4 = addNode(a1Text2);
setNodeRoleAxiom(node4);
console.log("4. " + formatFormula(parseFormula(a1Text2)) + "  [A1]");

// ステップ 5: MP(4, 3) → φ→φ
var node5 = connectMP(node4, node3);
console.log("5. " + formatFormula(parseFormula("φ → φ")) + "  [MP 4,3]");

// ゴール設定とレイアウト適用
addGoal("φ → φ");
applyLayout();

console.log("");
console.log("証明ツリーを構築しました。");
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
var phi = { _tag: "MetaVariable", name: "φ" };
var psi = { _tag: "MetaVariable", name: "ψ" };
var phiImplPsi = { _tag: "Implication", left: phi, right: psi };

// ID 公理: φ ⇒ φ
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};

// WR: φ ⇒ φ, φ→ψ
var wrNode = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [phi], succedents: [phi, phiImplPsi] },
  premise: idPhi,
  weakenedFormula: phiImplPsi
};

// ID 公理: ψ ⇒ ψ
var idPsi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [psi], succedents: [psi] }
};

// →L: φ→ψ, φ ⇒ ψ
var implLeft = {
  _tag: "ScImplicationLeft",
  conclusion: { antecedents: [phiImplPsi, phi], succedents: [psi] },
  left: idPhi,
  right: idPsi
};

// Cut: φ, φ ⇒ ψ
var proofWithCut = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi, phi], succedents: [psi] },
  left: wrNode,
  right: implLeft,
  cutFormula: phiImplPsi
};

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

var phi = { _tag: "MetaVariable", name: "φ" };

var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};

// カット付き証明
var proof = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi], succedents: [phi] },
  left: idPhi,
  right: idPhi,
  cutFormula: phi
};

console.log("=== カット除去 段階2: ID公理のカット ===");
console.log("");
console.log("--- カット付き証明 ---");
displayScProof(proof);
console.log("カット数: " + countCuts(proof));

// ── TODO: カットを除去した結果を手動で構築 ──
// ヒント: 左がID公理のとき、結果は右前提そのもの（結論を調整）
// つまり: φ ⇒ φ のID公理1つで済む
var manualResult = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};

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
// ただし結論 ψ ⇒ ψ, φ のうち φ はカットの右前提の
// 右辺から来ているので、弱化で追加する。
//
// 目標: 弱化のみでカットと同じ結論を導出する。

var phi = { _tag: "MetaVariable", name: "φ" };
var psi = { _tag: "MetaVariable", name: "ψ" };

var idPsi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [psi], succedents: [psi] }
};

var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};

// ψ ⇒ ψ に WR で φ を追加
var wrPsi = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [psi], succedents: [psi, phi] },
  premise: idPsi,
  weakenedFormula: phi
};

// カット付き証明: ψ ⇒ ψ, φ
var proofWithCut = {
  _tag: "ScCut",
  conclusion: { antecedents: [psi], succedents: [psi, phi] },
  left: wrPsi,
  right: idPhi,
  cutFormula: phi
};

console.log("=== カット除去 段階3: ランク0 ===");
console.log("");
console.log("--- カット付き証明 ---");
displayScProof(proofWithCut);
console.log("カット数: " + countCuts(proofWithCut));

// ── TODO: 弱化のみでカット除去した証明を構築 ──
// ヒント: 左前提 ψ ⇒ ψ の右辺にはφがない（左ランク=0）。
// 右前提の右辺から来るφを弱化で追加すればよい。
//
// 手順:
// 1. 左前提 ψ ⇒ ψ (ID) からスタート
// 2. 右前提の右辺 [φ] を右弱化(WR)で追加
//    → ψ ⇒ ψ, φ (これが最終結論)

var manualResult = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [psi], succedents: [psi, phi] },
  premise: idPsi,
  weakenedFormula: phi
};

console.log("");
console.log("--- 手動でカット除去した結果 ---");
displayScProof(manualResult);
console.log("カットフリー? " + isCutFree(manualResult));

// ── 自動カット除去との比較 ──
console.log("");
console.log("--- 自動カット除去 ---");
var auto = eliminateCutsWithSteps(proofWithCut);
for (var i = 0; i < auto.steps.length; i++) {
  console.log("  " + auto.steps[i].description);
}
if (auto.result._tag === "Success") {
  displayScProof(auto.result.proof);
}

console.log("");
console.log("段階3 完了！");
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
// ランク削減のアイデア:
//   弱化で追加されたφは「余分な」出現。
//   弱化の前の証明 (φ ⇒ φ) に対してカットを適用すれば
//   ランクが1つ下がる。結果に弱化を再適用する。
//
//   φ ⇒ φ (ID)    φ ⇒ φ (ID)
//   ──────────────────── (Cut: φ, rank=1)
//          φ ⇒ φ
//   ──────────── (WR: φ を追加)
//      φ ⇒ φ, φ

var phi = { _tag: "MetaVariable", name: "φ" };

var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};

// φ ⇒ φ にWRでφを追加 → φ ⇒ φ, φ
var wrNode = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [phi], succedents: [phi, phi] },
  premise: idPhi,
  weakenedFormula: phi
};

// Cut: φ ⇒ φ, φ (rank=2: φが左の右辺に2回)
var proofWithCut = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi], succedents: [phi, phi] },
  left: wrNode,
  right: idPhi,
  cutFormula: phi
};

console.log("=== カット除去 段階4: ランク削減 ===");
console.log("");
console.log("--- カット付き証明 ---");
displayScProof(proofWithCut);
console.log("カット数: " + countCuts(proofWithCut));

// ── TODO: ランク削減した証明を構築 ──
// ヒント:
// 1. 弱化の前の証明(φ ⇒ φ)と右前提(φ ⇒ φ)でCutする
//    → φ ⇒ φ (rank=1 のカット、これはさらに段階2の方法で除去)
// 2. その結果に弱化を再適用
//
// ここでは最終結果（完全にカットフリー）を構築:
// φ ⇒ φ に WR でφを追加 → φ ⇒ φ, φ

var manualResult = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [phi], succedents: [phi, phi] },
  premise: idPhi,
  weakenedFormula: phi
};

console.log("");
console.log("--- 手動でカット除去した結果 ---");
displayScProof(manualResult);
console.log("カットフリー? " + isCutFree(manualResult));

// ── 自動カット除去で中間ステップを確認 ──
console.log("");
console.log("--- 自動カット除去 ---");
var auto = eliminateCutsWithSteps(proofWithCut);
for (var i = 0; i < auto.steps.length; i++) {
  var step = auto.steps[i];
  console.log("ステップ " + (i + 1) + ": " + step.description);
  console.log("  depth=" + step.depth + ", rank=" + step.rank);
}
if (auto.result._tag === "Success") {
  displayScProof(auto.result.proof);
}

console.log("");
console.log("段階4 完了！");
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
//
//   α, Γ ⇒ Δ, β              Σ ⇒ Π, α    β, Σ' ⇒ Δ'
//   ───────────── (⇒→)       ─────────────────────── (→⇒)
//   Γ ⇒ Δ, α→β               α→β, Σ, Σ' ⇒ Π, Δ'
//   ────────────────────────────────────────────────
//              Γ, Σ, Σ' ⇒ Δ, Π, Δ'          Cut(α→β)
//
// 分解: α と β に対する2つのカットに変換
//
//              Σ ⇒ Π, α   α, Γ ⇒ Δ, β
//              ────────────────────────  Cut(α)
//  β, Σ'⇒Δ'       Γ, Σ ⇒ Δ, Π, β
//  ───────────────────────────────── Cut(β)
//         Γ, Σ, Σ' ⇒ Δ, Π, Δ'
//
// 目標: 含意のカットを分解するプロセスを理解する。

var phi = { _tag: "MetaVariable", name: "φ" };
var psi = { _tag: "MetaVariable", name: "ψ" };
var phiImplPsi = { _tag: "Implication", left: phi, right: psi };

// 左前提の前提: φ, ⇒ φ → 簡略化して φ ⇒ ψ として (⇒→)
// 左: φ ⇒ ψ を (⇒→) で Γ=∅, Δ=∅ として構築
//   φ ⇒ ψ / ⇒ φ→ψ
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var idPsi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [psi], succedents: [psi] }
};

// φ ⇒ φ (ID) から WR で ψ を追加
var wrPhiPsi = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [phi], succedents: [phi, psi] },
  premise: idPhi,
  weakenedFormula: psi
};

// (⇒→): φ ⇒ φ, ψ → ⇒ φ→ψ, φ
// ※ ⇒→ は前件の先頭の α を除いて右辺に α→β を追加
var implRight = {
  _tag: "ScImplicationRight",
  conclusion: { antecedents: [], succedents: [phiImplPsi, phi] },
  premise: wrPhiPsi
};

// 右前提: (→⇒)
// φ ⇒ φ (ID)    ψ ⇒ ψ (ID)  → φ→ψ, φ ⇒ ψ
var implLeft = {
  _tag: "ScImplicationLeft",
  conclusion: { antecedents: [phiImplPsi, phi], succedents: [psi] },
  left: idPhi,
  right: idPsi
};

// Cut(φ→ψ): ⇒ φ→ψ, φ  +  φ→ψ, φ ⇒ ψ  → φ ⇒ ψ
// ※ 実際にはΓ=∅, Σ=∅, Σ'=φ
var proofWithCut = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi], succedents: [psi, phi] },
  left: implRight,
  right: implLeft,
  cutFormula: phiImplPsi
};

console.log("=== カット除去 段階5: 深さ削減 ===");
console.log("");
console.log("--- カット式: φ → ψ (depth=2) ---");
console.log("--- カット付き証明 ---");
displayScProof(proofWithCut);
console.log("カット数: " + countCuts(proofWithCut));

// ── 自動カット除去でステップを確認 ──
console.log("");
console.log("--- 自動カット除去のステップ ---");
var auto = eliminateCutsWithSteps(proofWithCut);
for (var i = 0; i < auto.steps.length; i++) {
  var step = auto.steps[i];
  console.log("ステップ " + (i + 1) + ": " + step.description);
  console.log("  depth=" + step.depth + ", rank=" + step.rank);
  var stepConc = getScConclusion(step.proof);
  console.log("  結論: " + formatSequent(stepConc));
}

console.log("");
console.log("--- 最終結果 ---");
if (auto.result._tag === "Success") {
  var finalConc = getScConclusion(auto.result.proof);
  console.log("結論: " + formatSequent(finalConc));
  console.log("カットフリー? " + isCutFree(auto.result.proof));
  displayScProof(auto.result.proof);
}

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
//   段階3: ランク0 (弱化で除去)
//   段階4: ランク削減 (r≥2 → r-1)
//   段階5: 深さ削減 (d≥2 → 部分式カット)
//
// カット除去アルゴリズムは (depth, rank) の辞書式二重帰納法:
// 1. ボトムアップでサブ証明からカットを除去
// 2. トップレベルのカットに対して:
//    - ランク0 → 弱化で除去（段階3）
//    - ランク≥2 → ランク削減（段階4）
//    - ランク1, 深さ≥2 → 深さ削減（段階5）
//    - ランク1, 深さ1 → 基底ケース（段階2）
//
// 目標: 複数カットを含む証明で全体の動作を確認する。

var phi = { _tag: "MetaVariable", name: "φ" };
var psi = { _tag: "MetaVariable", name: "ψ" };
var chi = { _tag: "MetaVariable", name: "χ" };

var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var idPsi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [psi], succedents: [psi] }
};
var idChi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [chi], succedents: [chi] }
};

// 証明1: φ ⇒ φ + φ ⇒ φ を Cut(φ) → φ ⇒ φ
var cut1 = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi], succedents: [phi] },
  left: idPhi,
  right: idPhi,
  cutFormula: phi
};

// WR: φ ⇒ φ, ψ (cut1の結果に弱化)
var wr1 = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [phi], succedents: [phi, psi] },
  premise: cut1,
  weakenedFormula: psi
};

// 証明2: ψ ⇒ ψ にWLでφを追加 → φ, ψ ⇒ ψ
var wl2 = {
  _tag: "ScWeakeningLeft",
  conclusion: { antecedents: [phi, psi], succedents: [psi] },
  premise: idPsi,
  weakenedFormula: phi
};

// Cut(ψ): φ ⇒ φ, ψ + φ, ψ ⇒ ψ → φ, φ ⇒ φ, ψ
var cut2 = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi, phi], succedents: [phi, psi] },
  left: wr1,
  right: wl2,
  cutFormula: psi
};

console.log("=== カット除去 段階6: 全体統合 ===");
console.log("");

var conc = getScConclusion(cut2);
console.log("証明の結論: " + formatSequent(conc));
console.log("カット数: " + countCuts(cut2));
console.log("");

// 初期証明をキャンバスに表示
console.log("--- 初期証明（2つのカットを含む）---");
displayScProof(cut2);

// 自動カット除去の全ステップを表示
console.log("");
console.log("--- カット除去の全ステップ ---");
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
  cutEliminationSimple,
  cutEliminationImplication,
  cutEliminationWorkspace,
  cutEliminationStep1,
  cutEliminationStep2,
  cutEliminationStep3,
  cutEliminationStep4,
  cutEliminationStep5,
  cutEliminationStep6,
  buildIdentityProof,
  buildIdentityProofTree,
  autoProveTemplate,
  deductionTheoremWorkspace,
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
