import { describe, expect, it } from "vitest";
import {
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
} from "../logic-core/index";
import {
  classifyFormula,
  toDisplayData,
  buildTruthTableDisplayData,
  getClassificationLabelKey,
  getClassificationLabel,
  formatTruthValue,
} from "./truthTableLogic";
import type {
  FormulaClassification,
  TruthTableDisplayData,
} from "./truthTableLogic";
import { generateTruthTable } from "../logic-core/evaluation";

// ── ヘルパー ─────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");

// ── classifyFormula ──────────────────────────────────────

describe("classifyFormula", () => {
  it("恒真式を tautology と分類する", () => {
    // φ → φ は恒真
    const formula = implication(phi, phi);
    expect(classifyFormula(formula)).toBe("tautology");
  });

  it("矛盾を contradiction と分類する", () => {
    // φ ∧ ¬φ は矛盾
    const formula = conjunction(phi, negation(phi));
    expect(classifyFormula(formula)).toBe("contradiction");
  });

  it("充足可能だが恒真でない式を satisfiable と分類する", () => {
    // φ は充足可能（true割当で真、false割当で偽）
    expect(classifyFormula(phi)).toBe("satisfiable");
  });

  it("φ ∨ ψ は充足可能と分類する", () => {
    const formula = disjunction(phi, psi);
    expect(classifyFormula(formula)).toBe("satisfiable");
  });

  it("φ → ψ は充足可能と分類する", () => {
    const formula = implication(phi, psi);
    expect(classifyFormula(formula)).toBe("satisfiable");
  });
});

// ── toDisplayData ────────────────────────────────────────

describe("toDisplayData", () => {
  it("1変数の真理値表を変換する", () => {
    const table = generateTruthTable(phi);
    const display = toDisplayData(table, "satisfiable");
    expect(display.variables).toEqual(["φ"]);
    expect(display.rows).toHaveLength(2);
    // false → true の順
    expect(display.rows[0]!.values).toEqual([false]);
    expect(display.rows[0]!.result).toBe(false);
    expect(display.rows[1]!.values).toEqual([true]);
    expect(display.rows[1]!.result).toBe(true);
    expect(display.classification).toBe("satisfiable");
  });

  it("2変数の真理値表を変換する", () => {
    const formula = conjunction(phi, psi);
    const table = generateTruthTable(formula);
    const display = toDisplayData(table, "satisfiable");
    expect(display.variables).toEqual(["φ", "ψ"]);
    expect(display.rows).toHaveLength(4);
    // (F,F) → (F,T) → (T,F) → (T,T) の順
    expect(display.rows[0]!.values).toEqual([false, false]);
    expect(display.rows[0]!.result).toBe(false);
    expect(display.rows[1]!.values).toEqual([false, true]);
    expect(display.rows[1]!.result).toBe(false);
    expect(display.rows[2]!.values).toEqual([true, false]);
    expect(display.rows[2]!.result).toBe(false);
    expect(display.rows[3]!.values).toEqual([true, true]);
    expect(display.rows[3]!.result).toBe(true);
  });

  it("0変数（変数なし）の真理値表を変換する", () => {
    // ¬φ ∨ φ をφ→φ的に扱う（ここでは無理なので恒真式で0変数はなしだが、空テーブルテスト）
    // 実際にはgenerateTruthTableは変数0個のときは空テーブルを返す
    // → 変数がない式としてconstantな恒真式は作れないので、直接TruthTableを作る
    const table = {
      variables: [] as readonly string[],
      rows: [{ assignment: new Map(), result: true }],
    };
    const display = toDisplayData(table, "tautology");
    expect(display.variables).toEqual([]);
    expect(display.rows).toHaveLength(1);
    expect(display.rows[0]!.values).toEqual([]);
    expect(display.rows[0]!.result).toBe(true);
  });

  it("割当に変数が欠けている場合はエラーになる", () => {
    const table = {
      variables: ["φ"] as readonly string[],
      rows: [{ assignment: new Map<string, boolean>(), result: true }],
    };
    expect(() => toDisplayData(table, "satisfiable")).toThrow(
      "Missing assignment for variable: φ",
    );
  });

  it("classification をそのまま保持する", () => {
    const table = generateTruthTable(phi);
    expect(toDisplayData(table, "tautology").classification).toBe("tautology");
    expect(toDisplayData(table, "contradiction").classification).toBe(
      "contradiction",
    );
    expect(toDisplayData(table, "satisfiable").classification).toBe(
      "satisfiable",
    );
  });
});

// ── buildTruthTableDisplayData ───────────────────────────

describe("buildTruthTableDisplayData", () => {
  it("恒真式の表示データを生成する", () => {
    const data = buildTruthTableDisplayData(implication(phi, phi));
    expect(data.classification).toBe("tautology");
    expect(data.variables).toEqual(["φ"]);
    expect(data.rows).toHaveLength(2);
    // すべての行で result が true
    expect(data.rows.every((r) => r.result)).toBe(true);
  });

  it("矛盾の表示データを生成する", () => {
    const data = buildTruthTableDisplayData(conjunction(phi, negation(phi)));
    expect(data.classification).toBe("contradiction");
    expect(data.variables).toEqual(["φ"]);
    expect(data.rows).toHaveLength(2);
    // すべての行で result が false
    expect(data.rows.every((r) => !r.result)).toBe(true);
  });

  it("充足可能な式の表示データを生成する", () => {
    const data = buildTruthTableDisplayData(phi);
    expect(data.classification).toBe("satisfiable");
    expect(data.variables).toEqual(["φ"]);
    expect(data.rows).toHaveLength(2);
  });

  it("2変数の式で正しいデータを生成する", () => {
    const data = buildTruthTableDisplayData(implication(phi, psi));
    expect(data.classification).toBe("satisfiable");
    expect(data.variables).toEqual(["φ", "ψ"]);
    expect(data.rows).toHaveLength(4);
    // φ→ψ: F のみは (T,F) のとき
    expect(data.rows[2]!.values).toEqual([true, false]);
    expect(data.rows[2]!.result).toBe(false);
  });
});

// ── getClassificationLabelKey ────────────────────────────

describe("getClassificationLabelKey", () => {
  it("tautology のキーを返す", () => {
    expect(getClassificationLabelKey("tautology")).toBe("truthTable.tautology");
  });

  it("satisfiable のキーを返す", () => {
    expect(getClassificationLabelKey("satisfiable")).toBe(
      "truthTable.satisfiable",
    );
  });

  it("contradiction のキーを返す", () => {
    expect(getClassificationLabelKey("contradiction")).toBe(
      "truthTable.contradiction",
    );
  });
});

// ── getClassificationLabel ───────────────────────────────

describe("getClassificationLabel", () => {
  const classifications: readonly FormulaClassification[] = [
    "tautology",
    "satisfiable",
    "contradiction",
  ] as const;

  describe("日本語", () => {
    it("tautology を「恒真（トートロジー）」と表示する", () => {
      expect(getClassificationLabel("tautology", "ja")).toBe(
        "恒真（トートロジー）",
      );
    });

    it("satisfiable を「充足可能」と表示する", () => {
      expect(getClassificationLabel("satisfiable", "ja")).toBe("充足可能");
    });

    it("contradiction を「矛盾（充足不可能）」と表示する", () => {
      expect(getClassificationLabel("contradiction", "ja")).toBe(
        "矛盾（充足不可能）",
      );
    });
  });

  describe("英語", () => {
    it("tautology を「Tautology」と表示する", () => {
      expect(getClassificationLabel("tautology", "en")).toBe("Tautology");
    });

    it("satisfiable を「Satisfiable」と表示する", () => {
      expect(getClassificationLabel("satisfiable", "en")).toBe("Satisfiable");
    });

    it("contradiction を「Contradiction」と表示する", () => {
      expect(getClassificationLabel("contradiction", "en")).toBe(
        "Contradiction",
      );
    });
  });

  it("すべての分類に対してラベルが返る", () => {
    for (const c of classifications) {
      expect(getClassificationLabel(c, "ja")).toBeTruthy();
      expect(getClassificationLabel(c, "en")).toBeTruthy();
    }
  });
});

// ── formatTruthValue ─────────────────────────────────────

describe("formatTruthValue", () => {
  it("true を T と表示する", () => {
    expect(formatTruthValue(true)).toBe("T");
  });

  it("false を F と表示する", () => {
    expect(formatTruthValue(false)).toBe("F");
  });
});

// ── 統合テスト ─────────────────────────────────────────────

describe("統合テスト", () => {
  it("ド・モルガンの法則を表示データとして生成できる", () => {
    // ¬(φ ∧ ψ) ↔ (¬φ ∨ ¬ψ) と同値だが、ここでは片方だけ
    // ¬(φ ∧ ψ) は satisfiable
    const formula = negation(conjunction(phi, psi));
    const data = buildTruthTableDisplayData(formula);
    expect(data.classification).toBe("satisfiable");
    expect(data.variables).toEqual(["φ", "ψ"]);
    expect(data.rows).toHaveLength(4);
    // ¬(φ ∧ ψ): (T,T) のみ false
    expect(data.rows[3]!.result).toBe(false);
    expect(data.rows[0]!.result).toBe(true);
    expect(data.rows[1]!.result).toBe(true);
    expect(data.rows[2]!.result).toBe(true);
  });

  it("排中律 φ ∨ ¬φ は恒真", () => {
    const data = buildTruthTableDisplayData(disjunction(phi, negation(phi)));
    expect(data.classification).toBe("tautology");
    expect(data.rows.every((r) => r.result)).toBe(true);
  });

  it("分類ラベルの一貫性を検証する", () => {
    const data: TruthTableDisplayData = buildTruthTableDisplayData(
      implication(phi, phi),
    );
    const key = getClassificationLabelKey(data.classification);
    const label = getClassificationLabel(data.classification, "ja");
    expect(key).toBe("truthTable.tautology");
    expect(label).toBe("恒真（トートロジー）");
  });
});
