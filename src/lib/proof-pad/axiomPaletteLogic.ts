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
  axiomE1Template,
  axiomE2Template,
  axiomE3Template,
} from "../logic-core/inferenceRule";
import { formatFormula } from "../logic-lang/formatUnicode";

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

  // 述語論理公理（A4, A5はスキーマが複雑なためテンプレートとしてはDSLテキストのみ提供）
  if (system.predicateLogic) {
    items.push({
      id: "A4",
      displayName: "A4 (UI)",
      template: axiomA1Template, // placeholder — A4はパターン依存で固定テンプレートなし
      unicodeDisplay: "∀x.φ → φ[t/x]",
      dslText: "",
    });
    items.push({
      id: "A5",
      displayName: "A5 (∀-Dist)",
      template: axiomA1Template, // placeholder — A5も同様
      unicodeDisplay: "∀x.(φ → ψ) → (φ → ∀x.ψ)",
      dslText: "",
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

  return items;
}
