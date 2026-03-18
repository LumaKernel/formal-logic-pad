/**
 * スクリプトサンドボックス向けの共有型定義文字列を生成する。
 *
 * Monaco Editor の addExtraLib に渡す `.d.ts` の先頭に挿入して、
 * FormulaJson / SequentJson / ScProofNodeJson 等のブランド型を宣言する。
 * これにより `parseFormula` の戻り値が `any` ではなく `FormulaJson` として
 * 型チェックされるようになる。
 *
 * ブランド型（`__brand` フィールド）を使うことで、異なる JSON 型同士の
 * 混同をコンパイル時に防ぐ。ただしスクリプトは JavaScript で書かれるため、
 * ブランドは実行時には存在しない（エディタの型チェック専用）。
 *
 * 変更時は scriptBridgeTypes.test.ts も同期すること。
 */

/**
 * スクリプト向け共有型定義テキストを生成する。
 *
 * 各ブリッジ API の signature で参照されるすべての型名に対して
 * `declare type` 宣言を出力する。
 */
export const generateScriptBridgeTypeDefs = (): string => `\
// ── 基本型 (opaque branded types) ──────────────────────────

/** 論理式の JSON 表現。parseFormula / formatFormula 等で操作する。 */
declare type FormulaJson = { readonly __brand: "FormulaJson" };

/** 項の JSON 表現。formatTerm / equalTerm 等で操作する。 */
declare type TermJson = { readonly __brand: "TermJson" };

/** シーケントの JSON 表現。sequent() で構築し、formatSequent 等で操作する。 */
declare type SequentJson = {
  readonly __brand: "SequentJson";
  readonly antecedents: readonly FormulaJson[];
  readonly succedents: readonly FormulaJson[];
};

/** SC証明ノードの JSON 表現。scIdentity / scCut 等で構築する。 */
declare type ScProofNodeJson = { readonly __brand: "ScProofNodeJson" };

/** Hilbert証明ノードの JSON 表現。extractHilbertProof 等で取得する。 */
declare type ProofNodeJson = { readonly __brand: "ProofNodeJson" };

// ── 体系・設定型 ──────────────────────────────────────────

/** 論理体系の JSON 表現。getDeductionSystemInfo().rules 等から構築する。 */
declare type LogicSystemJson = {
  readonly name: string;
  readonly propositionalAxioms: readonly string[];
  readonly predicateLogic: boolean;
  readonly equalityLogic: boolean;
  readonly generalization: boolean;
};

// ── 結果型 ────────────────────────────────────────────────

/** ユニフィケーション結果。unifyFormulas の戻り値。 */
declare type UnificationResult = {
  readonly formulaSubstitution: Record<string, FormulaJson>;
};

/** 項ユニフィケーション結果。unifyTerms の戻り値。 */
declare type TermUnificationResult = {
  readonly termSubstitution: Record<string, TermJson>;
};

/** 公理同定結果。identifyAxiom の戻り値。 */
declare type AxiomIdentificationResult =
  | { readonly _tag: "Ok"; readonly axiomName: string }
  | { readonly _tag: "TheoryAxiom" }
  | { readonly _tag: "Error"; readonly reason: string };

/** カット除去結果。eliminateCutsWithSteps の result フィールド。 */
declare type CutEliminationResultJson =
  | { readonly _tag: "Success"; readonly proof: ScProofNodeJson }
  | {
      readonly _tag: "StepLimitExceeded";
      readonly proof: ScProofNodeJson;
      readonly stepsUsed: number;
    }
  | { readonly _tag: "Error"; readonly reason: string };

/** カット除去ステップ。eliminateCutsWithSteps の steps 配列要素。 */
declare type CutEliminationStepJson = {
  readonly description: string;
  readonly proof: ScProofNodeJson;
  readonly depth: number;
  readonly rank: number;
};
`;
