/**
 * スクリプトサンドボックス向けのビルトインAPI型定義。
 *
 * このファイルは Monaco Editor の addExtraLib に `?raw` import で渡される。
 * スクリプトエディタ内での型チェック・補完・Go to Definition を提供する。
 *
 * 変更時は以下も同期すること:
 * - 各ブリッジモジュールの API_DEFS 配列（ドキュメント用）
 * - builtin-api.test.ts（同期テスト）
 */

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

// ── Either ユーティリティ型 ───────────────────────────────

/** Either の Right（成功）側。_tag: "Right" と right プロパティを持つ。 */
declare type EitherRightJson<T> = { readonly _tag: "Right"; readonly right: T };

/** Either の Left（失敗）側。_tag: "Left" と left プロパティを持つ。 */
declare type EitherLeftJson<E> = { readonly _tag: "Left"; readonly left: E };

/**
 * Either 型の JSON 表現。Effect.ts の Either パターンに対応する。
 * Right = 成功、Left = 失敗。
 */
declare type EitherJson<T, E> = EitherRightJson<T> | EitherLeftJson<E>;

// ── Either ユーティリティ API (eitherBridge) ──────────────

/** 成功値を Right に包む。 */
declare function createRight<T>(value: T): EitherRightJson<T>;

/** エラー値を Left に包む。 */
declare function createLeft<E>(error: E): EitherLeftJson<E>;

/** Either が Right かどうか判定する。型ガードとして機能する。 */
declare function isRight<T, E>(
  either: EitherJson<T, E>,
): either is EitherRightJson<T>;

/** Either が Left かどうか判定する。型ガードとして機能する。 */
declare function isLeft<T, E>(
  either: EitherJson<T, E>,
): either is EitherLeftJson<E>;

/** Right の値を取り出す。Left の場合は例外をスロー。 */
declare function getOrThrow<T, E>(either: EitherJson<T, E>): T;

/** Left の値を取り出す。Right の場合は例外をスロー。 */
declare function getLeftOrThrow<T, E>(either: EitherJson<T, E>): E;

/** Right の値を取り出す。Left の場合はデフォルト値を返す。 */
declare function getOrElse<T, E>(either: EitherJson<T, E>, defaultValue: T): T;

// ── 証明操作 API (proofBridge) ────────────────────────────

/** 論理式テキストをパースして Formula JSON を返す。パース失敗時は例外をスロー。 */
declare function parseFormula(text: string): FormulaJson;

/** Formula JSON を Unicode テキスト表現に変換する。 */
declare function formatFormula(formula: FormulaJson): string;

/** Term JSON を Unicode テキスト表現に変換する。 */
declare function formatTerm(term: TermJson): string;

/** 2つの Formula の構造的等価性を返す。 */
declare function equalFormula(a: FormulaJson, b: FormulaJson): boolean;

/** 2つの Term の構造的等価性を返す。 */
declare function equalTerm(a: TermJson, b: TermJson): boolean;

/** Modus Ponens: φ と φ→ψ から ψ を導出する。前提不一致時は例外をスロー。 */
declare function applyMP(
  antecedent: FormulaJson,
  conditional: FormulaJson,
): FormulaJson;

/** 汎化規則: φ から ∀x.φ を導出する。体系で汎化が無効の場合は例外をスロー。 */
declare function applyGen(
  formula: FormulaJson,
  variableName: string,
  system: LogicSystemJson,
): FormulaJson;

/** 2つの Formula をユニファイする。成功時は代入マップを返す。失敗時は例外。 */
declare function unifyFormulas(
  source: FormulaJson,
  target: FormulaJson,
): UnificationResult;

/** 2つの Term をユニファイする。成功時は項代入マップを返す。失敗時は例外。 */
declare function unifyTerms(
  source: TermJson,
  target: TermJson,
): TermUnificationResult;

/** Formula にメタ変数代入を適用する。 */
declare function substituteFormula(
  formula: FormulaJson,
  substitutionMap: Record<string, FormulaJson>,
): FormulaJson;

/** Formula が指定体系の公理インスタンスかどうか識別する。 */
declare function identifyAxiom(
  formula: FormulaJson,
  system: LogicSystemJson,
): AxiomIdentificationResult;

/** 命題論理シーケント計算（LK）の自動証明探索。シーケントが妥当なら証明木を返す。証明不可能またはステップ数超過時は例外をスロー。 */
declare function proveSequentLK(
  sequent: SequentJson,
  options?: { stepLimit?: number },
): ScProofNodeJson;

// ── ワークスペース操作 API (workspaceBridge) ──────────────

/** ワークスペースにノードを追加する。論理式テキストを指定し、ノードIDを返す。 */
declare function addNode(formulaText: string): string;

/** 指定ノードの論理式テキストを更新する。 */
declare function setNodeFormula(nodeId: string, formulaText: string): void;

/** ワークスペース上の全ノード一覧を返す。 */
declare function getNodes(): Array<{
  id: string;
  formulaText: string;
  label: string;
  x: number;
  y: number;
}>;

/** Modus Ponens で2つのノードを接続し、結論ノードを作成する。結論ノードIDを返す。 */
declare function connectMP(antecedentId: string, conditionalId: string): string;

/** ワークスペースにゴール（証明すべき目標）を追加する。 */
declare function addGoal(formulaText: string): void;

/** 指定ノードをワークスペースから削除する。 */
declare function removeNode(nodeId: string): void;

/** 指定ノードの役割を公理に設定する。 */
declare function setNodeRoleAxiom(nodeId: string): void;

/** ワークスペース上のノードにツリーレイアウトを自動適用する。 */
declare function applyLayout(): void;

/** ワークスペース上の全ノードを削除する。 */
declare function clearWorkspace(): void;

/** SC証明木をワークスペースに表示する。既存ノードをクリアし、証明木の各ノードをシーケントテキストとして配置する。 */
declare function displayScProof(proof: ScProofNodeJson): void;

/** 現在選択中のノードID一覧を返す。 */
declare function getSelectedNodeIds(): string[];

/** 現在の演繹体系の情報を返す。style（証明スタイル）、systemName（体系名）、isHilbertStyle（Hilbert流かどうか）、rules（有効な推論規則一覧）を含む。 */
declare function getDeductionSystemInfo(): {
  style: string;
  systemName: string;
  isHilbertStyle: boolean;
  rules: string[];
};

/** 現在のHilbert体系のLogicSystem JSONを返す。identifyAxiom / applyGen にそのまま渡せる。Hilbert体系でない場合はエラーをthrowする。 */
declare function getLogicSystem(): LogicSystemJson;

/** ワークスペースからSC証明木を抽出する。rootNodeIdを省略するとルートを自動検出する。SC体系でない場合や証明木構築に失敗した場合はエラーをthrowする。 */
declare function extractScProof(rootNodeId?: string): ScProofNodeJson;

/** ワークスペースからHilbert証明木を抽出する。rootNodeIdを省略するとルートを自動検出する。Hilbert系でない場合や証明木構築に失敗した場合はエラーをthrowする。 */
declare function extractHilbertProof(rootNodeId?: string): ProofNodeJson;

/** 指定ノードの詳細な内部状態を返す。分類、接続、推論エッジを含む。存在しないノードIDを指定するとエラーをthrowする。 */
declare function getNodeState(nodeId: string): {
  readonly id: string;
  readonly kind: string;
  readonly formulaText: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly classification: string;
  readonly incomingConnections: ReadonlyArray<{
    readonly fromNodeId: string;
    readonly fromPortId: string;
    readonly toPortId: string;
  }>;
  readonly outgoingConnections: ReadonlyArray<{
    readonly toNodeId: string;
    readonly fromPortId: string;
    readonly toPortId: string;
  }>;
  readonly inferenceEdges: ReadonlyArray<{
    readonly tag: string;
    readonly role: "conclusion" | "premise";
  }>;
};

// ── カット除去 API (cutEliminationBridge) ─────────────────

/** SC証明がカットフリーかどうか判定する。 */
declare function isCutFree(proof: ScProofNodeJson): boolean;

/** SC証明中のカット規則の数を返す。 */
declare function countCuts(proof: ScProofNodeJson): number;

/** Sequent JSON を Unicode テキスト表現に変換する。例: "φ, ψ ⇒ χ" */
declare function formatSequent(sequent: SequentJson): string;

/** SC証明のカットを除去し、各変換ステップの情報を返す。result._tag は 'Success' | 'StepLimitExceeded' | 'Failure'。 */
declare function eliminateCutsWithSteps(
  proof: ScProofNodeJson,
  maxSteps?: number,
): {
  result: CutEliminationResultJson;
  steps: CutEliminationStepJson[];
};

/** SC証明の結論シーケントを取得する。 */
declare function getScConclusion(proof: ScProofNodeJson): SequentJson;

/** シーケント（前件と後件の組）を構築する。 */
declare function sequent(
  antecedents: FormulaJson[],
  succedents: FormulaJson[],
): SequentJson;

/** ID公理ノード（φ ⇒ φ）を構築する。 */
declare function scIdentity(conclusion: SequentJson): ScProofNodeJson;

/** ⊥L公理ノードを構築する。 */
declare function scBottomLeft(conclusion: SequentJson): ScProofNodeJson;

/** カット規則ノードを構築する。 */
declare function scCut(
  left: ScProofNodeJson,
  right: ScProofNodeJson,
  cutFormula: FormulaJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 左弱化規則ノードを構築する。 */
declare function scWeakeningLeft(
  premise: ScProofNodeJson,
  formula: FormulaJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 右弱化規則ノードを構築する。 */
declare function scWeakeningRight(
  premise: ScProofNodeJson,
  formula: FormulaJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 左縮約規則ノードを構築する。 */
declare function scContractionLeft(
  premise: ScProofNodeJson,
  formula: FormulaJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 右縮約規則ノードを構築する。 */
declare function scContractionRight(
  premise: ScProofNodeJson,
  formula: FormulaJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 左交換規則ノードを構築する。 */
declare function scExchangeLeft(
  premise: ScProofNodeJson,
  position: number,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 右交換規則ノードを構築する。 */
declare function scExchangeRight(
  premise: ScProofNodeJson,
  position: number,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 含意左規則（→⇒）ノードを構築する。 */
declare function scImplicationLeft(
  left: ScProofNodeJson,
  right: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 含意右規則（⇒→）ノードを構築する。 */
declare function scImplicationRight(
  premise: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 連言左規則（∧⇒）ノードを構築する。 */
declare function scConjunctionLeft(
  premise: ScProofNodeJson,
  componentIndex: 1 | 2,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 連言右規則（⇒∧）ノードを構築する。 */
declare function scConjunctionRight(
  left: ScProofNodeJson,
  right: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 選言左規則（∨⇒）ノードを構築する。 */
declare function scDisjunctionLeft(
  left: ScProofNodeJson,
  right: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 選言右規則（⇒∨）ノードを構築する。 */
declare function scDisjunctionRight(
  premise: ScProofNodeJson,
  componentIndex: 1 | 2,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 否定左規則（¬⇒）ノードを構築する。 */
declare function scNegationLeft(
  premise: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 否定右規則（⇒¬）ノードを構築する。 */
declare function scNegationRight(
  premise: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 全称左規則（∀⇒）ノードを構築する。 */
declare function scUniversalLeft(
  premise: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 全称右規則（⇒∀）ノードを構築する。 */
declare function scUniversalRight(
  premise: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 存在左規則（∃⇒）ノードを構築する。 */
declare function scExistentialLeft(
  premise: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

/** 存在右規則（⇒∃）ノードを構築する。 */
declare function scExistentialRight(
  premise: ScProofNodeJson,
  conclusion: SequentJson,
): ScProofNodeJson;

// ── Hilbert証明木 API (hilbertProofBridge) ────────────────

/** 演繹定理を適用する。仮定 A を除去し、A → B の証明木を構築する。証明木のJSON表現と仮定の論理式テキストを指定する。 */
declare function applyDeductionTheorem(
  proof: ProofNodeJson,
  hypothesisText: string,
): ProofNodeJson;

/** 逆演繹定理を適用する。A → B の証明木から、A を仮定として追加し B の証明木を構築する。結論が含意でない場合はエラー。 */
declare function applyReverseDeductionTheorem(
  proof: ProofNodeJson,
): ProofNodeJson;

/** Hilbert証明木をワークスペースに表示する。既存ノードはクリアせず、横に配置される。 */
declare function displayHilbertProof(proof: ProofNodeJson): void;

// ── 可視化 API (visualizationBridge) ──────────────────────

/** ノードにハイライトを追加する。色を省略するとyellow。既存があれば上書き。 */
declare function highlightNode(
  nodeId: string,
  color?: "red" | "blue" | "green" | "yellow" | "purple" | "orange",
  label?: string,
): void;

/** ノードのハイライトを除去する。 */
declare function unhighlightNode(nodeId: string): void;

/** 全ノードのハイライトをクリアする。 */
declare function clearHighlights(): void;

/** ノードに吹き出しアノテーションを追加する。アノテーションIDを返す。 */
declare function addAnnotation(nodeId: string, text: string): string;

/** アノテーションを除去する。 */
declare function removeAnnotation(annotationId: string): void;

/** 全アノテーションをクリアする。 */
declare function clearAnnotations(): void;

/** 可視化ログにメッセージを追加する。levelを省略するとinfo。 */
declare function vizLog(
  message: string,
  level?: "info" | "warn" | "error",
): void;

/** 全可視化状態（ハイライト・アノテーション・ログ）をクリアする。 */
declare function clearVisualization(): void;

// ── コンソール API ────────────────────────────────────────

declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};
