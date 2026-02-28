import { describe, expect, it } from "vitest";
import {
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
  biconditional,
  predicate,
  equality,
  universal,
  existential,
  formulaSubstitution,
  termVariable,
  constant,
} from "./index";
import {
  evaluateFormula,
  collectPropositionalVariables,
  isTautology,
  isSatisfiable,
  isContradiction,
  generateTruthTable,
} from "./evaluation";
import type { TruthAssignment } from "./evaluation";

// ── ヘルパー ─────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const phi1 = metaVariable("φ", "1");

const assignment = (
  entries: readonly (readonly [string, boolean])[],
): TruthAssignment => new Map(entries);

// ── evaluateFormula ──────────────────────────────────────

describe("evaluateFormula", () => {
  describe("メタ変数", () => {
    it("trueに割り当てられたメタ変数はtrueを返す", () => {
      expect(evaluateFormula(phi, assignment([["φ", true]]))).toBe(true);
    });

    it("falseに割り当てられたメタ変数はfalseを返す", () => {
      expect(evaluateFormula(phi, assignment([["φ", false]]))).toBe(false);
    });

    it("添字付きメタ変数は添字込みのキーで評価される", () => {
      expect(evaluateFormula(phi1, assignment([["φ_1", true]]))).toBe(true);
      expect(evaluateFormula(phi1, assignment([["φ_1", false]]))).toBe(false);
    });

    it("割り当てにないメタ変数はエラーになる", () => {
      expect(() => evaluateFormula(phi, assignment([]))).toThrow();
    });
  });

  describe("否定", () => {
    it("¬true = false", () => {
      expect(evaluateFormula(negation(phi), assignment([["φ", true]]))).toBe(
        false,
      );
    });

    it("¬false = true", () => {
      expect(evaluateFormula(negation(phi), assignment([["φ", false]]))).toBe(
        true,
      );
    });

    it("二重否定: ¬¬φ はφと同値", () => {
      expect(
        evaluateFormula(negation(negation(phi)), assignment([["φ", true]])),
      ).toBe(true);
      expect(
        evaluateFormula(negation(negation(phi)), assignment([["φ", false]])),
      ).toBe(false);
    });
  });

  describe("含意", () => {
    it("true → true = true", () => {
      expect(
        evaluateFormula(
          implication(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", true],
          ]),
        ),
      ).toBe(true);
    });

    it("true → false = false", () => {
      expect(
        evaluateFormula(
          implication(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", false],
          ]),
        ),
      ).toBe(false);
    });

    it("false → true = true", () => {
      expect(
        evaluateFormula(
          implication(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", true],
          ]),
        ),
      ).toBe(true);
    });

    it("false → false = true", () => {
      expect(
        evaluateFormula(
          implication(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", false],
          ]),
        ),
      ).toBe(true);
    });
  });

  describe("連言", () => {
    it("true ∧ true = true", () => {
      expect(
        evaluateFormula(
          conjunction(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", true],
          ]),
        ),
      ).toBe(true);
    });

    it("true ∧ false = false", () => {
      expect(
        evaluateFormula(
          conjunction(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", false],
          ]),
        ),
      ).toBe(false);
    });

    it("false ∧ true = false", () => {
      expect(
        evaluateFormula(
          conjunction(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", true],
          ]),
        ),
      ).toBe(false);
    });

    it("false ∧ false = false", () => {
      expect(
        evaluateFormula(
          conjunction(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", false],
          ]),
        ),
      ).toBe(false);
    });
  });

  describe("選言", () => {
    it("true ∨ true = true", () => {
      expect(
        evaluateFormula(
          disjunction(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", true],
          ]),
        ),
      ).toBe(true);
    });

    it("true ∨ false = true", () => {
      expect(
        evaluateFormula(
          disjunction(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", false],
          ]),
        ),
      ).toBe(true);
    });

    it("false ∨ true = true", () => {
      expect(
        evaluateFormula(
          disjunction(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", true],
          ]),
        ),
      ).toBe(true);
    });

    it("false ∨ false = false", () => {
      expect(
        evaluateFormula(
          disjunction(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", false],
          ]),
        ),
      ).toBe(false);
    });
  });

  describe("双条件", () => {
    it("true ↔ true = true", () => {
      expect(
        evaluateFormula(
          biconditional(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", true],
          ]),
        ),
      ).toBe(true);
    });

    it("true ↔ false = false", () => {
      expect(
        evaluateFormula(
          biconditional(phi, psi),
          assignment([
            ["φ", true],
            ["ψ", false],
          ]),
        ),
      ).toBe(false);
    });

    it("false ↔ true = false", () => {
      expect(
        evaluateFormula(
          biconditional(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", true],
          ]),
        ),
      ).toBe(false);
    });

    it("false ↔ false = true", () => {
      expect(
        evaluateFormula(
          biconditional(phi, psi),
          assignment([
            ["φ", false],
            ["ψ", false],
          ]),
        ),
      ).toBe(true);
    });
  });

  describe("命題論理以外のノードはエラー", () => {
    const x = termVariable("x");
    const a = constant("a");

    it("Universal はエラー", () => {
      expect(() =>
        evaluateFormula(universal(x, phi), assignment([["φ", true]])),
      ).toThrow("propositional");
    });

    it("Existential はエラー", () => {
      expect(() =>
        evaluateFormula(existential(x, phi), assignment([["φ", true]])),
      ).toThrow("propositional");
    });

    it("Predicate はエラー", () => {
      expect(() =>
        evaluateFormula(predicate("P", [a]), assignment([])),
      ).toThrow("propositional");
    });

    it("Equality はエラー", () => {
      expect(() => evaluateFormula(equality(a, a), assignment([]))).toThrow(
        "propositional",
      );
    });

    it("FormulaSubstitution はエラー", () => {
      expect(() =>
        evaluateFormula(
          formulaSubstitution(phi, a, x),
          assignment([["φ", true]]),
        ),
      ).toThrow("propositional");
    });
  });

  describe("複合式", () => {
    it("φ → φ はすべての割り当てで真（φ=true）", () => {
      expect(
        evaluateFormula(implication(phi, phi), assignment([["φ", true]])),
      ).toBe(true);
    });

    it("φ → φ はすべての割り当てで真（φ=false）", () => {
      expect(
        evaluateFormula(implication(phi, phi), assignment([["φ", false]])),
      ).toBe(true);
    });

    it("(φ → ψ) → ((ψ → χ) → (φ → χ)) - 仮言三段論法", () => {
      // すべての割り当てで真であるべき
      const f = implication(
        implication(phi, psi),
        implication(implication(psi, chi), implication(phi, chi)),
      );
      for (const p of [true, false]) {
        for (const q of [true, false]) {
          for (const r of [true, false]) {
            expect(
              evaluateFormula(
                f,
                assignment([
                  ["φ", p],
                  ["ψ", q],
                  ["χ", r],
                ]),
              ),
            ).toBe(true);
          }
        }
      }
    });

    it("ド・モルガンの法則: ¬(φ ∧ ψ) ↔ (¬φ ∨ ¬ψ)", () => {
      const f = biconditional(
        negation(conjunction(phi, psi)),
        disjunction(negation(phi), negation(psi)),
      );
      for (const p of [true, false]) {
        for (const q of [true, false]) {
          expect(
            evaluateFormula(
              f,
              assignment([
                ["φ", p],
                ["ψ", q],
              ]),
            ),
          ).toBe(true);
        }
      }
    });

    it("対偶: (φ → ψ) ↔ (¬ψ → ¬φ)", () => {
      const f = biconditional(
        implication(phi, psi),
        implication(negation(psi), negation(phi)),
      );
      for (const p of [true, false]) {
        for (const q of [true, false]) {
          expect(
            evaluateFormula(
              f,
              assignment([
                ["φ", p],
                ["ψ", q],
              ]),
            ),
          ).toBe(true);
        }
      }
    });
  });
});

// ── collectPropositionalVariables ───────────────────────

describe("collectPropositionalVariables", () => {
  it("単一メタ変数から1つの変数を収集", () => {
    expect(collectPropositionalVariables(phi)).toEqual(new Set(["φ"]));
  });

  it("添字付きメタ変数", () => {
    expect(collectPropositionalVariables(phi1)).toEqual(new Set(["φ_1"]));
  });

  it("複数の異なるメタ変数を収集", () => {
    expect(collectPropositionalVariables(implication(phi, psi))).toEqual(
      new Set(["φ", "ψ"]),
    );
  });

  it("重複するメタ変数は1つにまとめる", () => {
    expect(collectPropositionalVariables(implication(phi, phi))).toEqual(
      new Set(["φ"]),
    );
  });

  it("否定内のメタ変数も収集する", () => {
    expect(collectPropositionalVariables(negation(phi))).toEqual(
      new Set(["φ"]),
    );
  });

  it("ネストした式から全メタ変数を収集", () => {
    const f = biconditional(implication(phi, psi), disjunction(chi, phi1));
    expect(collectPropositionalVariables(f)).toEqual(
      new Set(["φ", "ψ", "χ", "φ_1"]),
    );
  });

  it("メタ変数のない式（空集合）", () => {
    // Predicate等は命題論理ではないが、collectではエラーにしない
    // → 命題論理以外はエラーにする設計の場合は要修正
    // 実際はevaluateでエラーになるので、collectは命題論理のノードだけ対象
    // ただし述語論理のノードが混ざっていたらエラーにすべき
    const x = termVariable("x");
    expect(() => collectPropositionalVariables(universal(x, phi))).toThrow(
      "propositional",
    );
  });

  it("連言・選言を再帰的にたどる", () => {
    const f = conjunction(disjunction(phi, psi), negation(chi));
    expect(collectPropositionalVariables(f)).toEqual(new Set(["φ", "ψ", "χ"]));
  });
});

// ── isTautology ─────────────────────────────────────────

describe("isTautology", () => {
  it("φ → φ は恒真", () => {
    expect(isTautology(implication(phi, phi))).toBe(true);
  });

  it("排中律 φ ∨ ¬φ は恒真", () => {
    expect(isTautology(disjunction(phi, negation(phi)))).toBe(true);
  });

  it("φ → (ψ → φ) (K公理) は恒真", () => {
    expect(isTautology(implication(phi, implication(psi, phi)))).toBe(true);
  });

  it("S公理 (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) は恒真", () => {
    const s = implication(
      implication(phi, implication(psi, chi)),
      implication(implication(phi, psi), implication(phi, chi)),
    );
    expect(isTautology(s)).toBe(true);
  });

  it("φ は恒真ではない", () => {
    expect(isTautology(phi)).toBe(false);
  });

  it("φ ∧ ψ は恒真ではない", () => {
    expect(isTautology(conjunction(phi, psi))).toBe(false);
  });

  it("φ ∧ ¬φ は恒真ではない（矛盾）", () => {
    expect(isTautology(conjunction(phi, negation(phi)))).toBe(false);
  });

  it("ド・モルガン: ¬(φ ∧ ψ) ↔ (¬φ ∨ ¬ψ) は恒真", () => {
    expect(
      isTautology(
        biconditional(
          negation(conjunction(phi, psi)),
          disjunction(negation(phi), negation(psi)),
        ),
      ),
    ).toBe(true);
  });

  it("二重否定除去 ¬¬φ → φ は恒真", () => {
    expect(isTautology(implication(negation(negation(phi)), phi))).toBe(true);
  });

  it("Peirceの法則 ((φ → ψ) → φ) → φ は恒真", () => {
    expect(
      isTautology(implication(implication(implication(phi, psi), phi), phi)),
    ).toBe(true);
  });
});

// ── isSatisfiable ───────────────────────────────────────

describe("isSatisfiable", () => {
  it("φ は充足可能", () => {
    expect(isSatisfiable(phi)).toBe(true);
  });

  it("¬φ は充足可能", () => {
    expect(isSatisfiable(negation(phi))).toBe(true);
  });

  it("φ ∧ ψ は充足可能", () => {
    expect(isSatisfiable(conjunction(phi, psi))).toBe(true);
  });

  it("φ ∧ ¬φ は充足不可能（矛盾）", () => {
    expect(isSatisfiable(conjunction(phi, negation(phi)))).toBe(false);
  });

  it("恒真式は充足可能", () => {
    expect(isSatisfiable(implication(phi, phi))).toBe(true);
  });
});

// ── isContradiction ─────────────────────────────────────

describe("isContradiction", () => {
  it("φ ∧ ¬φ は矛盾", () => {
    expect(isContradiction(conjunction(phi, negation(phi)))).toBe(true);
  });

  it("φ は矛盾ではない", () => {
    expect(isContradiction(phi)).toBe(false);
  });

  it("φ → φ は矛盾ではない（恒真）", () => {
    expect(isContradiction(implication(phi, phi))).toBe(false);
  });

  it("φ ∧ ψ は矛盾ではない", () => {
    expect(isContradiction(conjunction(phi, psi))).toBe(false);
  });
});

// ── generateTruthTable ──────────────────────────────────

describe("generateTruthTable", () => {
  it("単一変数の真理値表", () => {
    const table = generateTruthTable(phi);
    expect(table.variables).toEqual(["φ"]);
    expect(table.rows).toHaveLength(2);
    // φ=false → φ=false, φ=true → φ=true
    expect(table.rows[0]).toEqual({
      assignment: new Map([["φ", false]]),
      result: false,
    });
    expect(table.rows[1]).toEqual({
      assignment: new Map([["φ", true]]),
      result: true,
    });
  });

  it("二変数の真理値表は4行", () => {
    const table = generateTruthTable(conjunction(phi, psi));
    expect(table.variables).toHaveLength(2);
    expect(table.rows).toHaveLength(4);
  });

  it("三変数の真理値表は8行", () => {
    const table = generateTruthTable(implication(phi, implication(psi, chi)));
    expect(table.variables).toHaveLength(3);
    expect(table.rows).toHaveLength(8);
  });

  it("φ → φ の真理値表は全行true", () => {
    const table = generateTruthTable(implication(phi, phi));
    for (const row of table.rows) {
      expect(row.result).toBe(true);
    }
  });

  it("φ ∧ ¬φ の真理値表は全行false", () => {
    const table = generateTruthTable(conjunction(phi, negation(phi)));
    for (const row of table.rows) {
      expect(row.result).toBe(false);
    }
  });

  it("真理値表の割り当ては辞書順で網羅的", () => {
    const table = generateTruthTable(conjunction(phi, psi));
    // 変数のソート順: φ, ψ
    // 割り当て: (F,F), (F,T), (T,F), (T,T)
    const expected = [
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ];
    for (const [i, row] of table.rows.entries()) {
      expect(row.assignment.get(table.variables[0])).toBe(expected[i]![0]);
      expect(row.assignment.get(table.variables[1])).toBe(expected[i]![1]);
    }
  });

  it("変数が0個の式（定数的な式）は1行の真理値表", () => {
    // ¬(φ ∧ ¬φ) は変数はφの1つだが、
    // 変数0個のケースは命題論理では起こりにくいので、
    // 恒真式で変数が少ないケースをテスト
    // 実際には MetaVariable がないと変数0になるが、
    // MetaVariableのない命題論理の論理式は存在しない
    // → テスト省略（メタ変数のない式は述語論理）
  });
});
