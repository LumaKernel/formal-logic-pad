import { describe, it, expect } from "vitest";
import {
  identifyAxiomName,
  getAxiomDisplayName,
  isTrivialFormulaSubstitution,
  isTrivialTermSubstitution,
  isTrivialAxiomSubstitution,
} from "./axiomNameLogic";
import {
  intuitionisticSystem,
  classicalLogicSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  equalityLogicSystem,
  peanoArithmeticSystem,
  axiomPA1Template,
  axiomPA3Template,
} from "../logic-core/inferenceRule";
import type { LogicSystem } from "../logic-core/inferenceRule";
import {
  metaVariable,
  implication,
  universal,
  equality,
  negation,
} from "../logic-core/formula";
import {
  termMetaVariable,
  termVariable,
  constant,
} from "../logic-core/term";
import { parseString } from "../logic-lang/parser";
import {
  metaVariableKey,
  termMetaVariableKey,
} from "../logic-core/metaVariable";
import type {
  FormulaSubstitutionMap,
  TermMetaSubstitutionMap,
} from "../logic-core/substitution";

// --- ヘルパー ---

/** DSL文字列をパースしてFormulaを返す（テスト用）*/
function parseFormula(text: string) {
  const result = parseString(text);
  if (!result.ok) throw new Error(`Parse error: ${text satisfies string}`);
  return result.formula;
}

describe("axiomNameLogic", () => {
  describe("identifyAxiomName", () => {
    // --- A1 (K公理) ---
    describe("A1 (K)", () => {
      it("identifies exact A1 template", () => {
        const formula = parseFormula("phi -> (psi -> phi)");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A1");
          expect(result.displayName).toBe("A1 (K)");
        }
      });

      it("identifies A1 instance with specific propositions", () => {
        // p → (q → p) where p, q are specific formulas
        const formula = parseFormula(
          "(alpha -> beta) -> (chi -> (alpha -> beta))",
        );
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A1");
        }
      });
    });

    // --- A2 (S公理) ---
    describe("A2 (S)", () => {
      it("identifies exact A2 template", () => {
        const formula = parseFormula(
          "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
        );
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A2");
          expect(result.displayName).toBe("A2 (S)");
        }
      });
    });

    // --- A3 (対偶) ---
    describe("A3", () => {
      it("identifies exact A3 template", () => {
        const formula = parseFormula("(~phi -> ~psi) -> (psi -> phi)");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A3");
          expect(result.displayName).toBe("A3");
        }
      });
    });

    // --- M3 (背理法) ---
    describe("M3", () => {
      it("identifies exact M3 template in mendelson system", () => {
        const formula = parseFormula(
          "(~phi -> ~psi) -> ((~phi -> psi) -> phi)",
        );
        const result = identifyAxiomName(formula, mendelsonSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("M3");
          expect(result.displayName).toBe("M3");
        }
      });

      it("does not identify M3 in lukasiewicz system", () => {
        const formula = parseFormula(
          "(~phi -> ~psi) -> ((~phi -> psi) -> phi)",
        );
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("NotIdentified");
      });
    });

    // --- EFQ (爆発原理) ---
    describe("EFQ", () => {
      it("identifies EFQ template in intuitionistic system", () => {
        const formula = parseFormula("~phi -> (phi -> psi)");
        const result = identifyAxiomName(formula, intuitionisticSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("EFQ");
          expect(result.displayName).toBe("EFQ");
        }
      });

      it("does not identify EFQ in lukasiewicz system", () => {
        const formula = parseFormula("~phi -> (phi -> psi)");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("NotIdentified");
      });
    });

    // --- DNE (二重否定除去) ---
    describe("DNE", () => {
      it("identifies DNE template in classical logic system", () => {
        const formula = parseFormula("~~phi -> phi");
        const result = identifyAxiomName(formula, classicalLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("DNE");
          expect(result.displayName).toBe("DNE");
        }
      });

      it("does not identify DNE in lukasiewicz system", () => {
        const formula = parseFormula("~~phi -> phi");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("NotIdentified");
      });
    });

    // --- 非公理 ---
    describe("non-axiom formulas", () => {
      it("returns NotIdentified for arbitrary formula", () => {
        const formula = parseFormula("phi -> psi");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("NotIdentified");
      });

      it("returns NotIdentified for negation", () => {
        const formula = parseFormula("~phi");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("NotIdentified");
      });
    });

    // --- 体系依存 ---
    describe("system-dependent identification", () => {
      it("does not identify A3 if not enabled in system", () => {
        const system: LogicSystem = {
          name: "A1A2 only",
          propositionalAxioms: new Set(["A1", "A2"]),
          predicateLogic: false,
          equalityLogic: false,
          generalization: false,
        };
        const formula = parseFormula("(~phi -> ~psi) -> (psi -> phi)");
        const result = identifyAxiomName(formula, system);
        expect(result._tag).toBe("NotIdentified");
      });
    });

    // --- 等号公理 ---
    describe("equality axioms", () => {
      it("identifies E1 (Refl)", () => {
        const formula = parseFormula("all x. x = x");
        const result = identifyAxiomName(formula, equalityLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("E1");
          expect(result.displayName).toBe("E1 (Refl)");
        }
      });

      it("identifies E2 (Sym)", () => {
        const formula = parseFormula("all x. all y. x = y -> y = x");
        const result = identifyAxiomName(formula, equalityLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("E2");
          expect(result.displayName).toBe("E2 (Sym)");
        }
      });

      it("identifies E3 (Trans)", () => {
        const formula = parseFormula(
          "all x. all y. all z. x = y -> (y = z -> x = z)",
        );
        const result = identifyAxiomName(formula, equalityLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("E3");
          expect(result.displayName).toBe("E3 (Trans)");
        }
      });

      it("does not identify equality axioms if equality logic is disabled", () => {
        const formula = parseFormula("all x. x = x");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("NotIdentified");
      });
    });

    // --- 述語論理公理 ---
    describe("predicate logic axioms", () => {
      it("identifies A4 (UI) instance: ∀x.(x=x) → a=a", () => {
        // A4: ∀x.φ → φ[t/x]
        // Instance: ∀x.(x=x) → a=a (φ = x=x, t = a)
        const x = termVariable("x");
        const a = constant("a");
        const formula = implication(
          universal(x, equality(x, x)),
          equality(a, a),
        );
        const result = identifyAxiomName(formula, equalityLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A4");
          expect(result.displayName).toBe("A4 (UI)");
        }
      });

      it("does not identify A4 if predicate logic is disabled", () => {
        const x = termVariable("x");
        const a = constant("a");
        const formula = implication(
          universal(x, equality(x, x)),
          equality(a, a),
        );
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("NotIdentified");
      });
    });
  });

  describe("getAxiomDisplayName", () => {
    it("returns display name for A1", () => {
      expect(getAxiomDisplayName("A1")).toBe("A1 (K)");
    });

    it("returns display name for A2", () => {
      expect(getAxiomDisplayName("A2")).toBe("A2 (S)");
    });

    it("returns display name for A3", () => {
      expect(getAxiomDisplayName("A3")).toBe("A3");
    });

    it("returns display name for M3", () => {
      expect(getAxiomDisplayName("M3")).toBe("M3");
    });

    it("returns display name for EFQ", () => {
      expect(getAxiomDisplayName("EFQ")).toBe("EFQ");
    });

    it("returns display name for DNE", () => {
      expect(getAxiomDisplayName("DNE")).toBe("DNE");
    });

    it("returns display name for A4", () => {
      expect(getAxiomDisplayName("A4")).toBe("A4 (UI)");
    });

    it("returns display name for A5", () => {
      expect(getAxiomDisplayName("A5")).toBe("A5 (∀-Dist)");
    });

    it("returns display name for E1", () => {
      expect(getAxiomDisplayName("E1")).toBe("E1 (Refl)");
    });

    it("returns display name for E2", () => {
      expect(getAxiomDisplayName("E2")).toBe("E2 (Sym)");
    });

    it("returns display name for E3", () => {
      expect(getAxiomDisplayName("E3")).toBe("E3 (Trans)");
    });

    it("returns display name for E4", () => {
      expect(getAxiomDisplayName("E4")).toBe("E4");
    });

    it("returns display name for E5", () => {
      expect(getAxiomDisplayName("E5")).toBe("E5");
    });
  });

  describe("theory axiom identification", () => {
    it("identifies PA1 in peano arithmetic system", () => {
      const result = identifyAxiomName(axiomPA1Template, peanoArithmeticSystem);
      expect(result._tag).toBe("TheoryAxiomIdentified");
      if (result._tag === "TheoryAxiomIdentified") {
        expect(result.theoryAxiomId).toBe("PA1");
        expect(result.displayName).toBe("PA1 (0≠後者)");
      }
    });

    it("identifies PA3 in peano arithmetic system", () => {
      const result = identifyAxiomName(axiomPA3Template, peanoArithmeticSystem);
      expect(result._tag).toBe("TheoryAxiomIdentified");
      if (result._tag === "TheoryAxiomIdentified") {
        expect(result.theoryAxiomId).toBe("PA3");
        expect(result.displayName).toBe("PA3 (加法基底)");
      }
    });

    it("does not identify PA axioms in non-PA systems", () => {
      const result = identifyAxiomName(axiomPA1Template, equalityLogicSystem);
      expect(result._tag).toBe("NotIdentified");
    });
  });

  // --- isTrivialSubstitution フィールドのテスト ---
  describe("isTrivialSubstitution", () => {
    describe("命題論理公理", () => {
      it("A1テンプレートそのもの (φ→ψ→φ) は trivial", () => {
        const formula = parseFormula("phi -> (psi -> phi)");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.isTrivialSubstitution).toBe(true);
        }
      });

      it("A1のメタ変数名を変えただけ (χ→α→χ) は trivial", () => {
        const formula = parseFormula("chi -> (alpha -> chi)");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A1");
          expect(result.isTrivialSubstitution).toBe(true);
        }
      });

      it("A1に具体式を代入 ((α→β)→χ→(α→β)) は non-trivial", () => {
        const formula = parseFormula(
          "(alpha -> beta) -> (chi -> (alpha -> beta))",
        );
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A1");
          expect(result.isTrivialSubstitution).toBe(false);
        }
      });

      it("A1に否定を含む式を代入 (¬φ→ψ→¬φ) は non-trivial", () => {
        const formula = parseFormula("~phi -> (psi -> ~phi)");
        const result = identifyAxiomName(formula, lukasiewiczSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A1");
          expect(result.isTrivialSubstitution).toBe(false);
        }
      });
    });

    describe("理論公理", () => {
      it("PA1テンプレートそのもの (exact match) は trivial", () => {
        const result = identifyAxiomName(
          axiomPA1Template,
          peanoArithmeticSystem,
        );
        expect(result._tag).toBe("TheoryAxiomIdentified");
        if (result._tag === "TheoryAxiomIdentified") {
          expect(result.isTrivialSubstitution).toBe(true);
        }
      });

      it("PA3テンプレートそのもの (exact match) は trivial", () => {
        const result = identifyAxiomName(
          axiomPA3Template,
          peanoArithmeticSystem,
        );
        expect(result._tag).toBe("TheoryAxiomIdentified");
        if (result._tag === "TheoryAxiomIdentified") {
          expect(result.isTrivialSubstitution).toBe(true);
        }
      });
    });

    describe("述語論理公理", () => {
      it("A4のインスタンス ∀x.(x=x) → a=a は non-trivial (φとtに具体式代入)", () => {
        const x = termVariable("x");
        const a = constant("a");
        const formula = implication(
          universal(x, equality(x, x)),
          equality(a, a),
        );
        const result = identifyAxiomName(formula, equalityLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A4");
          expect(result.isTrivialSubstitution).toBe(false);
        }
      });

      it("A5のインスタンス ∀x.(P(a)→x=x) → (P(a)→∀x.x=x) は non-trivial", () => {
        // A5: ∀x.(φ→ψ) → (φ→∀x.ψ) where x∉FV(φ)
        // Instance: φ=P(a), ψ=x=x, x=x
        const formula = parseFormula(
          "(all x. (P(a) -> x = x)) -> (P(a) -> all x. x = x)",
        );
        const result = identifyAxiomName(formula, equalityLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("A5");
          expect(result.isTrivialSubstitution).toBe(false);
        }
      });
    });

    describe("等号公理", () => {
      it("E1テンプレート ∀x.x=x は trivial (束縛変数のみで代入なし)", () => {
        const formula = parseFormula("all x. x = x");
        const result = identifyAxiomName(formula, equalityLogicSystem);
        expect(result._tag).toBe("Identified");
        if (result._tag === "Identified") {
          expect(result.axiomId).toBe("E1");
          expect(result.isTrivialSubstitution).toBe(true);
        }
      });
    });
  });
});

// --- isTrivialFormulaSubstitution / isTrivialTermSubstitution 単体テスト ---

describe("isTrivialFormulaSubstitution", () => {
  it("空マップは trivial", () => {
    const map: FormulaSubstitutionMap = new Map();
    expect(isTrivialFormulaSubstitution(map)).toBe(true);
  });

  it("全てMetaVariableへの単射マップは trivial", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const alpha = metaVariable("α");
    const beta = metaVariable("β");
    const map: FormulaSubstitutionMap = new Map([
      [metaVariableKey(phi), alpha],
      [metaVariableKey(psi), beta],
    ]);
    expect(isTrivialFormulaSubstitution(map)).toBe(true);
  });

  it("MetaVariableに具体式を代入したマップは non-trivial", () => {
    const phi = metaVariable("φ");
    const alpha = metaVariable("α");
    const beta = metaVariable("β");
    const map: FormulaSubstitutionMap = new Map([
      [metaVariableKey(phi), implication(alpha, beta)],
    ]);
    expect(isTrivialFormulaSubstitution(map)).toBe(false);
  });

  it("Negation を代入したマップは non-trivial", () => {
    const phi = metaVariable("φ");
    const alpha = metaVariable("α");
    const map: FormulaSubstitutionMap = new Map([
      [metaVariableKey(phi), negation(alpha)],
    ]);
    expect(isTrivialFormulaSubstitution(map)).toBe(false);
  });

  it("2つのメタ変数が同じ先に写る非単射マップは non-trivial", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const alpha = metaVariable("α");
    const map: FormulaSubstitutionMap = new Map([
      [metaVariableKey(phi), alpha],
      [metaVariableKey(psi), alpha],
    ]);
    expect(isTrivialFormulaSubstitution(map)).toBe(false);
  });

  it("添字付きMetaVariableへの単射マップは trivial", () => {
    const phi = metaVariable("φ");
    const alpha1 = metaVariable("α", "1");
    const map: FormulaSubstitutionMap = new Map([
      [metaVariableKey(phi), alpha1],
    ]);
    expect(isTrivialFormulaSubstitution(map)).toBe(true);
  });
});

describe("isTrivialTermSubstitution", () => {
  it("空マップは trivial", () => {
    const map: TermMetaSubstitutionMap = new Map();
    expect(isTrivialTermSubstitution(map)).toBe(true);
  });

  it("全てTermMetaVariableへの単射マップは trivial", () => {
    const tau = termMetaVariable("τ");
    const sigma = termMetaVariable("σ");
    const map: TermMetaSubstitutionMap = new Map([
      [termMetaVariableKey(tau), sigma],
    ]);
    expect(isTrivialTermSubstitution(map)).toBe(true);
  });

  it("具体的な定数への代入は non-trivial", () => {
    const tau = termMetaVariable("τ");
    const map: TermMetaSubstitutionMap = new Map([
      [termMetaVariableKey(tau), constant("a")],
    ]);
    expect(isTrivialTermSubstitution(map)).toBe(false);
  });

  it("TermVariableへの代入は non-trivial", () => {
    const tau = termMetaVariable("τ");
    const map: TermMetaSubstitutionMap = new Map([
      [termMetaVariableKey(tau), termVariable("x")],
    ]);
    expect(isTrivialTermSubstitution(map)).toBe(false);
  });

  it("添字付きTermMetaVariableへの単射マップは trivial", () => {
    const tau = termMetaVariable("τ");
    const sigma1 = termMetaVariable("σ", "1");
    const map: TermMetaSubstitutionMap = new Map([
      [termMetaVariableKey(tau), sigma1],
    ]);
    expect(isTrivialTermSubstitution(map)).toBe(true);
  });

  it("2つのterm metaが同じ先に写る非単射は non-trivial", () => {
    const tau = termMetaVariable("τ");
    const sigma = termMetaVariable("σ");
    const alpha = termMetaVariable("α");
    const map: TermMetaSubstitutionMap = new Map([
      [termMetaVariableKey(tau), alpha],
      [termMetaVariableKey(sigma), alpha],
    ]);
    expect(isTrivialTermSubstitution(map)).toBe(false);
  });
});

describe("isTrivialAxiomSubstitution", () => {
  it("両方空マップは trivial", () => {
    expect(isTrivialAxiomSubstitution(new Map(), new Map())).toBe(true);
  });

  it("formula trivial + term trivial は trivial", () => {
    const phi = metaVariable("φ");
    const alpha = metaVariable("α");
    const tau = termMetaVariable("τ");
    const sigma = termMetaVariable("σ");
    const formulaMap: FormulaSubstitutionMap = new Map([
      [metaVariableKey(phi), alpha],
    ]);
    const termMap: TermMetaSubstitutionMap = new Map([
      [termMetaVariableKey(tau), sigma],
    ]);
    expect(isTrivialAxiomSubstitution(formulaMap, termMap)).toBe(true);
  });

  it("formula non-trivial + term trivial は non-trivial", () => {
    const phi = metaVariable("φ");
    const alpha = metaVariable("α");
    const beta = metaVariable("β");
    const formulaMap: FormulaSubstitutionMap = new Map([
      [metaVariableKey(phi), implication(alpha, beta)],
    ]);
    expect(isTrivialAxiomSubstitution(formulaMap, new Map())).toBe(false);
  });

  it("formula trivial + term non-trivial は non-trivial", () => {
    const tau = termMetaVariable("τ");
    const termMap: TermMetaSubstitutionMap = new Map([
      [termMetaVariableKey(tau), constant("0")],
    ]);
    expect(isTrivialAxiomSubstitution(new Map(), termMap)).toBe(false);
  });
});
