/**
 * 公理パレットの純粋ロジック。
 *
 * 論理体系（LogicSystem）に応じて利用可能な公理テンプレートの一覧を提供する。
 * UIコンポーネント（AxiomPalette.tsx）から利用される。
 *
 * 変更時は axiomPaletteLogic.test.ts, AxiomPalette.tsx, index.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import type {
  LogicSystem,
  PropositionalAxiomId,
} from "../logic-core/inferenceRule";
import {
  axiomA1Template,
  axiomA2Template,
  axiomA3Template,
  axiomM3Template,
  axiomEFQTemplate,
  axiomDNETemplate,
  axiomE1Template,
  axiomE2Template,
  axiomE3Template,
} from "../logic-core/inferenceRule";
import { formatFormula } from "../logic-lang/formatUnicode";
import type { ReferenceEntryId } from "../reference/referenceEntry";

// --- 公理パレットアイテム ---

/** パレットに表示する公理アイテム */
export type AxiomPaletteItem = {
  /** 公理ID（表示名にも使う） */
  readonly id: string;
  /** 公理の表示名（例: "A1 (K公理)"） */
  readonly displayName: string;
  /** 公理テンプレートの論理式 */
  readonly template: Formula;
  /** 公理テンプレートのUnicode表示 */
  readonly unicodeDisplay: string;
  /** 公理テンプレートのDSL形式テキスト（FormulaEditorに設定する値） */
  readonly dslText: string;
};

// --- 命題論理公理のメタデータ ---

type PropositionalAxiomMeta = {
  readonly id: PropositionalAxiomId;
  readonly displayName: string;
  readonly template: Formula;
  readonly dslText: string;
};

const propositionalAxiomMetas: readonly PropositionalAxiomMeta[] = [
  {
    id: "A1",
    displayName: "A1 (K)",
    template: axiomA1Template,
    dslText: "phi -> (psi -> phi)",
  },
  {
    id: "A2",
    displayName: "A2 (S)",
    template: axiomA2Template,
    dslText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
  },
  {
    id: "A3",
    displayName: "A3",
    template: axiomA3Template,
    dslText: "(~phi -> ~psi) -> (psi -> phi)",
  },
  {
    id: "M3",
    displayName: "M3",
    template: axiomM3Template,
    dslText: "(~phi -> ~psi) -> ((~phi -> psi) -> phi)",
  },
  {
    id: "EFQ",
    displayName: "EFQ",
    template: axiomEFQTemplate,
    dslText: "~phi -> (phi -> psi)",
  },
  {
    id: "DNE",
    displayName: "DNE",
    template: axiomDNETemplate,
    dslText: "~~phi -> phi",
  },
];

// --- 等号公理のメタデータ ---

type EqualityAxiomMeta = {
  readonly id: string;
  readonly displayName: string;
  readonly template: Formula;
  readonly dslText: string;
};

const equalityAxiomMetas: readonly EqualityAxiomMeta[] = [
  {
    id: "E1",
    displayName: "E1 (Refl)",
    template: axiomE1Template,
    dslText: "all x. x = x",
  },
  {
    id: "E2",
    displayName: "E2 (Sym)",
    template: axiomE2Template,
    dslText: "all x. all y. x = y -> y = x",
  },
  {
    id: "E3",
    displayName: "E3 (Trans)",
    template: axiomE3Template,
    dslText: "all x. all y. all z. x = y -> (y = z -> x = z)",
  },
];

// --- 公理ID → リファレンスエントリID マッピング ---

/**
 * 公理IDからリファレンスエントリIDへのマッピング。
 *
 * 標準的な公理（A1, A2, ... E3）はそれぞれ対応するリファレンスエントリを持つ。
 * 理論公理（PA1, G1等）は現時点ではリファレンスエントリが存在しない場合がある。
 *
 * 新しい公理リファレンスエントリ追加時は referenceContent.ts にも追加すること。
 */
const axiomIdToReferenceEntryId: ReadonlyMap<string, ReferenceEntryId> =
  new Map([
    ["A1", "axiom-a1"],
    ["A2", "axiom-a2"],
    ["A3", "axiom-a3"],
    ["M3", "axiom-m3"],
    ["EFQ", "axiom-efq"],
    ["DNE", "axiom-dne"],
    ["A4", "axiom-a4"],
    ["A5", "axiom-a5"],
    ["E1", "axiom-e1"],
    ["E2", "axiom-e2"],
    ["E3", "axiom-e3"],
  ]);

/**
 * 公理IDに対応するリファレンスエントリIDを返す。
 * 対応するエントリがない場合はundefinedを返す。
 */
export function getAxiomReferenceEntryId(
  axiomId: string,
): ReferenceEntryId | undefined {
  return axiomIdToReferenceEntryId.get(axiomId);
}

// --- パレット生成 ---

/**
 * 論理体系に応じた利用可能な公理パレットアイテムの一覧を返す。
 *
 * @param system 論理体系設定
 * @returns 利用可能な公理のリスト
 */
export function getAvailableAxioms(
  system: LogicSystem,
): readonly AxiomPaletteItem[] {
  const items: AxiomPaletteItem[] = [];

  // 命題論理公理
  for (const meta of propositionalAxiomMetas) {
    if (system.propositionalAxioms.has(meta.id)) {
      items.push({
        id: meta.id,
        displayName: meta.displayName,
        template: meta.template,
        unicodeDisplay: formatFormula(meta.template),
        dslText: meta.dslText,
      });
    }
  }

  // 述語論理公理（A4, A5はスキーマなので一般形をdslTextに設定）
  if (system.predicateLogic) {
    items.push({
      id: "A4",
      displayName: "A4 (UI)",
      template: axiomA1Template, // placeholder — A4はパターン依存で固定テンプレートなし
      unicodeDisplay: "∀x.φ → φ[t/x]",
      dslText: "(all x. phi) -> phi",
    });
    items.push({
      id: "A5",
      displayName: "A5 (∀-Dist)",
      template: axiomA1Template, // placeholder — A5も同様
      unicodeDisplay: "∀x.(φ → ψ) → (φ → ∀x.ψ)",
      dslText: "all x. (phi -> psi) -> (phi -> all x. psi)",
    });
  }

  // 等号公理
  if (system.equalityLogic) {
    for (const meta of equalityAxiomMetas) {
      items.push({
        id: meta.id,
        displayName: meta.displayName,
        template: meta.template,
        unicodeDisplay: formatFormula(meta.template),
        dslText: meta.dslText,
      });
    }
  }

  // 理論公理（非論理的公理）
  if (system.theoryAxioms !== undefined) {
    for (const axiom of system.theoryAxioms) {
      items.push({
        id: axiom.id,
        displayName: axiom.displayName,
        template: axiom.template,
        unicodeDisplay: formatFormula(axiom.template),
        dslText: axiom.dslText,
      });
    }
  }

  return items;
}
