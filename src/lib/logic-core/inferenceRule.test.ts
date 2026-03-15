import { Either } from "effect";
import { describe, it, expect } from "vitest";
import {
  applyModusPonens,
  applyGeneralization,
  matchPropositionalAxiom,
  matchAxiomA4,
  matchAxiomA5,
  matchExDef,
  matchEqualityAxiom,
  matchE4,
  matchTheoryAxiom,
  matchFormulaPattern,
  applySubstitution,
  identifyAxiom,
  axiomA1Template,
  axiomA2Template,
  axiomA3Template,
  axiomM3Template,
  axiomEFQTemplate,
  axiomDNETemplate,
  axiomConjDefForwardTemplate,
  axiomConjDefBackwardTemplate,
  axiomDisjDefForwardTemplate,
  axiomDisjDefBackwardTemplate,
  axiomExDefForwardTemplate,
  axiomE1Template,
  axiomE2Template,
  axiomE3Template,
  axiomPA1Template,
  axiomPA2Template,
  axiomPA3Template,
  axiomPA4Template,
  axiomPA5Template,
  axiomPA6Template,
  peanoFixedAxioms,
  robinsonAxioms,
  axiomQ7Template,
  peanoArithmeticSystem,
  robinsonArithmeticSystem,
  peanoArithmeticHKSystem,
  peanoArithmeticMendelsonSystem,
  heytingArithmeticSystem,
  axiomG1Template,
  axiomG2LTemplate,
  axiomG2RTemplate,
  axiomG3LTemplate,
  axiomG3RTemplate,
  axiomG4CommTemplate,
  groupLeftAxioms,
  groupFullAxioms,
  abelianGroupAxioms,
  groupTheoryLeftSystem,
  groupTheoryFullSystem,
  abelianGroupSystem,
  skSystem,
  minimalLogicSystem,
  intuitionisticSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  classicalLogicSystem,
  predicateLogicSystem,
  equalityLogicSystem,
  type TheoryAxiom,
  type RuleApplicationResult,
  type AxiomMatchResult,
} from "./inferenceRule";
import {
  metaVariable,
  implication,
  negation,
  conjunction,
  disjunction,
  biconditional,
  universal,
  existential,
  predicate,
  equality,
  formulaSubstitution,
  freeVariableAbsence,
} from "./formula";
import {
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./term";
import { buildFormulaSubstitutionMap } from "./substitution";
import { metaVariableKey, termMetaVariableKey } from "./metaVariable";

// ── ヘルパー ──────────────────────────────────────────────

const expectRuleOk = (result: RuleApplicationResult) => {
  expect(Either.isRight(result)).toBe(true);
  if (!Either.isRight(result)) throw new Error("Expected Right (Ok)");
  return result.right;
};

const expectRuleErr = (result: RuleApplicationResult) => {
  expect(Either.isLeft(result)).toBe(true);
  if (!Either.isLeft(result)) throw new Error("Expected Left (Error)");
  return result.left;
};

const expectMatchOk = (result: AxiomMatchResult) => {
  expect(Either.isRight(result)).toBe(true);
  if (!Either.isRight(result)) throw new Error("Expected Right (Ok)");
  return result.right;
};

const expectMatchErr = (result: AxiomMatchResult) => {
  expect(Either.isLeft(result)).toBe(true);
  if (!Either.isLeft(result)) throw new Error("Expected Left (Error)");
  return result.left;
};

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const x = termVariable("x");
const y = termVariable("y");
const z = termVariable("z");
const a = constant("a");

// ── Modus Ponens ──────────────────────────────────────────

describe("applyModusPonens", () => {
  it("should derive ψ from φ and φ→ψ", () => {
    const result = applyModusPonens(phi, implication(phi, psi));
    const ok = expectRuleOk(result);
    expect(ok.conclusion._tag).toBe("MetaVariable");
    expect((ok.conclusion as typeof psi).name).toBe("ψ");
  });

  it("should derive complex conclusion from MP", () => {
    // P(a) と P(a)→Q(a) から Q(a)
    const pa = predicate("P", [a]);
    const qa = predicate("Q", [a]);
    const result = applyModusPonens(pa, implication(pa, qa));
    const ok = expectRuleOk(result);
    expect(ok.conclusion._tag).toBe("Predicate");
  });

  it("should fail if conditional is not an implication", () => {
    const result = applyModusPonens(phi, phi);
    const error = expectRuleErr(result);
    expect(error._tag).toBe("NotAnImplication");
  });

  it("should fail if antecedent does not match", () => {
    const result = applyModusPonens(psi, implication(phi, chi));
    const error = expectRuleErr(result);
    expect(error._tag).toBe("PremiseMismatch");
  });

  it("should handle nested implications", () => {
    // (φ→ψ) と (φ→ψ)→χ から χ
    const phiToPsi = implication(phi, psi);
    const result = applyModusPonens(phiToPsi, implication(phiToPsi, chi));
    const ok = expectRuleOk(result);
    expect(ok.conclusion).toBe(chi);
  });

  it("should fail with negation as conditional", () => {
    const result = applyModusPonens(phi, negation(phi));
    const error = expectRuleErr(result);
    expect(error._tag).toBe("NotAnImplication");
  });
});

// ── Generalization ────────────────────────────────────────

describe("applyGeneralization", () => {
  it("should derive ∀x.φ from φ when Gen is enabled", () => {
    const result = applyGeneralization(phi, x, predicateLogicSystem);
    const ok = expectRuleOk(result);
    expect(ok.conclusion._tag).toBe("Universal");
  });

  it("should derive ∀x.P(x) from P(x)", () => {
    const px = predicate("P", [x]);
    const result = applyGeneralization(px, x, predicateLogicSystem);
    const ok = expectRuleOk(result);
    expect(ok.conclusion._tag).toBe("Universal");
  });

  it("should fail when Gen is not enabled", () => {
    const result = applyGeneralization(phi, x, lukasiewiczSystem);
    const error = expectRuleErr(result);
    expect(error._tag).toBe("GeneralizationNotEnabled");
  });

  it("should allow generalization with any variable", () => {
    const result = applyGeneralization(
      predicate("P", [y]),
      y,
      predicateLogicSystem,
    );
    const ok = expectRuleOk(result);
    expect(ok.conclusion._tag).toBe("Universal");
  });
});

// ── 命題論理公理 (A1, A2, A3) ───────────────────────────

describe("matchPropositionalAxiom", () => {
  describe("A1: K公理 φ → (ψ → φ)", () => {
    it("should match the template itself", () => {
      const result = matchPropositionalAxiom("A1", axiomA1Template);
      expectMatchOk(result);
    });

    it("should match a concrete instance: P(a) → (Q(a) → P(a))", () => {
      const pa = predicate("P", [a]);
      const qa = predicate("Q", [a]);
      const instance = implication(pa, implication(qa, pa));
      const result = matchPropositionalAxiom("A1", instance);
      expectMatchOk(result);
    });

    it("should match with negation: ¬φ → (ψ → ¬φ)", () => {
      const instance = implication(
        negation(phi),
        implication(psi, negation(phi)),
      );
      const result = matchPropositionalAxiom("A1", instance);
      expectMatchOk(result);
    });

    it("should not match a non-instance", () => {
      const nonInstance = implication(phi, implication(psi, psi));
      const result = matchPropositionalAxiom("A1", nonInstance);
      expectMatchErr(result);
    });
  });

  describe("A2: S公理", () => {
    it("should match the template itself", () => {
      const result = matchPropositionalAxiom("A2", axiomA2Template);
      expectMatchOk(result);
    });

    it("should match a concrete instance", () => {
      // (P→(Q→R)) → ((P→Q) → (P→R))
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const r = predicate("R", []);
      const instance = implication(
        implication(p, implication(q, r)),
        implication(implication(p, q), implication(p, r)),
      );
      const result = matchPropositionalAxiom("A2", instance);
      expectMatchOk(result);
    });

    it("should not match when structure differs", () => {
      const nonInstance = implication(phi, psi);
      const result = matchPropositionalAxiom("A2", nonInstance);
      expectMatchErr(result);
    });
  });

  describe("A3: 対偶公理 (¬φ → ¬ψ) → (ψ → φ)", () => {
    it("should match the template itself", () => {
      const result = matchPropositionalAxiom("A3", axiomA3Template);
      expectMatchOk(result);
    });

    it("should match a concrete instance", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const instance = implication(
        implication(negation(p), negation(q)),
        implication(q, p),
      );
      const result = matchPropositionalAxiom("A3", instance);
      expectMatchOk(result);
    });

    it("should not match when structure differs", () => {
      const nonInstance = implication(
        implication(negation(phi), psi),
        implication(psi, phi),
      );
      const result = matchPropositionalAxiom("A3", nonInstance);
      expectMatchErr(result);
    });
  });

  describe("M3: 背理法 (¬φ → ¬ψ) → ((¬φ → ψ) → φ)", () => {
    it("should match the template itself", () => {
      const result = matchPropositionalAxiom("M3", axiomM3Template);
      expectMatchOk(result);
    });

    it("should match a concrete instance", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      // (¬P → ¬Q) → ((¬P → Q) → P)
      const instance = implication(
        implication(negation(p), negation(q)),
        implication(implication(negation(p), q), p),
      );
      const result = matchPropositionalAxiom("M3", instance);
      expectMatchOk(result);
    });

    it("should not match A3 template (A3 ≠ M3)", () => {
      const result = matchPropositionalAxiom("M3", axiomA3Template);
      expectMatchErr(result);
    });

    it("A3 should not match M3 template", () => {
      const result = matchPropositionalAxiom("A3", axiomM3Template);
      expectMatchErr(result);
    });

    it("should not match when structure differs", () => {
      const nonInstance = implication(
        implication(negation(phi), negation(psi)),
        implication(psi, phi),
      );
      const result = matchPropositionalAxiom("M3", nonInstance);
      expectMatchErr(result);
    });
  });

  describe("EFQ: 爆発原理 ¬φ → (φ → ψ)", () => {
    it("should match the template itself", () => {
      const result = matchPropositionalAxiom("EFQ", axiomEFQTemplate);
      expectMatchOk(result);
    });

    it("should match a concrete instance", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      // ¬P → (P → Q)
      const instance = implication(negation(p), implication(p, q));
      const result = matchPropositionalAxiom("EFQ", instance);
      expectMatchOk(result);
    });

    it("should not match A3 template", () => {
      const result = matchPropositionalAxiom("EFQ", axiomA3Template);
      expectMatchErr(result);
    });

    it("A3 should not match EFQ template", () => {
      const result = matchPropositionalAxiom("A3", axiomEFQTemplate);
      expectMatchErr(result);
    });

    it("should not match when structure differs", () => {
      // φ → (¬φ → ψ) ≠ ¬φ → (φ → ψ)
      const nonInstance = implication(phi, implication(negation(phi), psi));
      const result = matchPropositionalAxiom("EFQ", nonInstance);
      expectMatchErr(result);
    });
  });

  describe("DNE: 二重否定除去 ¬¬φ → φ", () => {
    it("should match the template itself", () => {
      const result = matchPropositionalAxiom("DNE", axiomDNETemplate);
      expectMatchOk(result);
    });

    it("should match a concrete instance", () => {
      const p = predicate("P", []);
      // ¬¬P → P
      const instance = implication(negation(negation(p)), p);
      const result = matchPropositionalAxiom("DNE", instance);
      expectMatchOk(result);
    });

    it("should not match EFQ template", () => {
      const result = matchPropositionalAxiom("DNE", axiomEFQTemplate);
      expectMatchErr(result);
    });

    it("EFQ should not match DNE template", () => {
      const result = matchPropositionalAxiom("EFQ", axiomDNETemplate);
      expectMatchErr(result);
    });

    it("should not match when structure differs", () => {
      // φ → ¬¬φ ≠ ¬¬φ → φ
      const nonInstance = implication(phi, negation(negation(phi)));
      const result = matchPropositionalAxiom("DNE", nonInstance);
      expectMatchErr(result);
    });
  });
});

// ── A4: 全称例化 ──────────────────────────────────────────

describe("matchAxiomA4", () => {
  it("should match ∀x.P(x) → P(a)", () => {
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [a]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("should match ∀x.P(x) → P(x) (t=x, trivial substitution)", () => {
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [x]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("should match ∀x.Q(x,y) → Q(f(z),y)", () => {
    const fz = functionApplication("f", [z]);
    const instance = implication(
      universal(x, predicate("Q", [x, y])),
      predicate("Q", [fz, y]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("should match ∀x.(P(x)→Q(x)) → (P(a)→Q(a))", () => {
    const instance = implication(
      universal(x, implication(predicate("P", [x]), predicate("Q", [x]))),
      implication(predicate("P", [a]), predicate("Q", [a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("should match when variable doesn't appear free in body", () => {
    // ∀x.P(a) → P(a) (x doesn't appear in body)
    const instance = implication(
      universal(x, predicate("P", [a])),
      predicate("P", [a]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("should not match non-implication", () => {
    const result = matchAxiomA4(phi);
    expectMatchErr(result);
  });

  it("should not match when left is not universal", () => {
    const result = matchAxiomA4(implication(phi, psi));
    expectMatchErr(result);
  });

  it("should not match when substitution is inconsistent", () => {
    // ∀x.P(x,x) → P(a,b) — different replacements for x
    const b = constant("b");
    const instance = implication(
      universal(x, predicate("P", [x, x])),
      predicate("P", [a, b]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("should match with binary operations: ∀x.(x+0=x) → (a+0=a)", () => {
    const zero = constant("0");
    const instance = implication(
      universal(x, equality(binaryOperation("+", x, zero), x)),
      equality(binaryOperation("+", a, zero), a),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("should match when body contains inner quantifier shadowing the bound variable: ∀x.(P(x) ∧ ∀x.Q(x)) → (P(a) ∧ ∀x.Q(x))", () => {
    // Inner ∀x.Q(x) shadows outer x, so it should remain unchanged
    const qx = predicate("Q", [x]);
    const px = predicate("P", [x]);
    const pa = predicate("P", [a]);
    const instance = implication(
      universal(x, conjunction(px, universal(x, qx))),
      conjunction(pa, universal(x, qx)),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("should match with existential shadowing: ∀x.(P(x) ∧ ∃x.Q(x)) → (P(a) ∧ ∃x.Q(x))", () => {
    const qx = predicate("Q", [x]);
    const px = predicate("P", [x]);
    const pa = predicate("P", [a]);
    const instance = implication(
      universal(x, conjunction(px, existential(x, qx))),
      conjunction(pa, existential(x, qx)),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  // ── 代入マップ検証 ──────────────────────────────────────
  const tauTmv = termMetaVariable("τ");

  it("returns non-trivial substitution maps for ∀x.P(x) → P(a)", () => {
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [a]),
    );
    const result = matchAxiomA4(instance);
    const ok = expectMatchOk(result);
    // formulaSubstitution: φ → P(x)
    const phiSub = ok.formulaSubstitution.get(metaVariableKey(phi));
    expect(phiSub).toBeDefined();
    expect(phiSub?._tag).toBe("Predicate");
    // termSubstitution: τ → a
    const tauSub = ok.termSubstitution.get(termMetaVariableKey(tauTmv));
    expect(tauSub).toBeDefined();
    expect(tauSub?._tag).toBe("Constant");
    if (tauSub?._tag === "Constant") {
      expect(tauSub.name).toBe("a");
    }
  });

  it("returns trivial term substitution when x is not free in body: ∀x.P(a) → P(a)", () => {
    const instance = implication(
      universal(x, predicate("P", [a])),
      predicate("P", [a]),
    );
    const result = matchAxiomA4(instance);
    const ok = expectMatchOk(result);
    // formulaSubstitution: φ → P(a)
    expect(ok.formulaSubstitution.get(metaVariableKey(phi))).toBeDefined();
    // termSubstitution: τ → τ (TermMetaVariable — 空操作なのでtrivial)
    const tauSub = ok.termSubstitution.get(termMetaVariableKey(tauTmv));
    expect(tauSub).toBeDefined();
    expect(tauSub?._tag).toBe("TermMetaVariable");
  });

  it("returns non-trivial substitution for ∀x.(x+0=x) → (a+0=a)", () => {
    const zero = constant("0");
    const instance = implication(
      universal(x, equality(binaryOperation("+", x, zero), x)),
      equality(binaryOperation("+", a, zero), a),
    );
    const result = matchAxiomA4(instance);
    const ok = expectMatchOk(result);
    // termSubstitution: τ → a
    const tauSub = ok.termSubstitution.get(termMetaVariableKey(tauTmv));
    expect(tauSub).toBeDefined();
    expect(tauSub?._tag).toBe("Constant");
  });

  it("returns variable substitution for ∀x.P(x) → P(x) (t=x)", () => {
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [x]),
    );
    const result = matchAxiomA4(instance);
    const ok = expectMatchOk(result);
    // termSubstitution: τ → x (TermVariable, not TermMetaVariable)
    const tauSub = ok.termSubstitution.get(termMetaVariableKey(tauTmv));
    expect(tauSub).toBeDefined();
    expect(tauSub?._tag).toBe("TermVariable");
  });

  it("should match A4 with FreeVariableAbsence in body: ∀x.(P(x)[/y]) → P(a)[/y]", () => {
    // Body: P(x)[/y], Conclusion: P(a)[/y]
    // inferTermReplacement traverses FreeVariableAbsence to match x→a
    const instance = implication(
      universal(x, freeVariableAbsence(predicate("P", [x]), y)),
      freeVariableAbsence(predicate("P", [a]), y),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });
});

// ── A5: 全称と含意の分配 ──────────────────────────────────

describe("matchAxiomA5", () => {
  it("should match ∀x.(P(y)→Q(x)) → (P(y) → ∀x.Q(x))", () => {
    const py = predicate("P", [y]);
    const qx = predicate("Q", [x]);
    const instance = implication(
      universal(x, implication(py, qx)),
      implication(py, universal(x, qx)),
    );
    const result = matchAxiomA5(instance);
    expectMatchOk(result);
  });

  it("should reject when x ∈ FV(φ): ∀x.(P(x)→Q(x)) → (P(x) → ∀x.Q(x))", () => {
    const px = predicate("P", [x]);
    const qx = predicate("Q", [x]);
    const instance = implication(
      universal(x, implication(px, qx)),
      implication(px, universal(x, qx)),
    );
    const result = matchAxiomA5(instance);
    const error = expectMatchErr(result);
    expect(error._tag).toBe("A5VariableFreeInAntecedent");
  });

  it("should not match non-implication", () => {
    const result = matchAxiomA5(phi);
    expectMatchErr(result);
  });

  it("should not match when left is not universal", () => {
    const result = matchAxiomA5(implication(phi, psi));
    expectMatchErr(result);
  });

  it("should not match when inner body is not implication", () => {
    const result = matchAxiomA5(
      implication(universal(x, predicate("P", [x])), psi),
    );
    expectMatchErr(result);
  });

  it("should not match when antecedents differ", () => {
    const py = predicate("P", [y]);
    const pz = predicate("P", [z]);
    const qx = predicate("Q", [x]);
    const instance = implication(
      universal(x, implication(py, qx)),
      implication(pz, universal(x, qx)),
    );
    const result = matchAxiomA5(instance);
    expectMatchErr(result);
  });

  it("should not match when bound variables differ", () => {
    const py = predicate("P", [y]);
    const qx = predicate("Q", [x]);
    const instance = implication(
      universal(x, implication(py, qx)),
      implication(py, universal(y, qx)),
    );
    const result = matchAxiomA5(instance);
    expectMatchErr(result);
  });

  it("should not match when consequents differ", () => {
    const py = predicate("P", [y]);
    const qx = predicate("Q", [x]);
    const rx = predicate("R", [x]);
    const instance = implication(
      universal(x, implication(py, qx)),
      implication(py, universal(x, rx)),
    );
    const result = matchAxiomA5(instance);
    expectMatchErr(result);
  });

  it("should not match when right conclusion is not universal", () => {
    const py = predicate("P", [y]);
    const qx = predicate("Q", [x]);
    const instance = implication(
      universal(x, implication(py, qx)),
      implication(py, qx),
    );
    const result = matchAxiomA5(instance);
    expectMatchErr(result);
  });

  it("should not match when right side is not implication", () => {
    // ∀x.(P(y) → Q(x)) → Q(x) — right side is not implication
    const py = predicate("P", [y]);
    const qx = predicate("Q", [x]);
    const instance = implication(universal(x, implication(py, qx)), qx);
    const result = matchAxiomA5(instance);
    expectMatchErr(result);
  });
});

// ── 等号公理 ──────────────────────────────────────────────

describe("matchEqualityAxiom", () => {
  describe("E1: 反射律 ∀x. x = x", () => {
    it("should match the template", () => {
      const result = matchEqualityAxiom("E1", axiomE1Template);
      expectMatchOk(result);
    });

    it("should not match a non-instance", () => {
      const result = matchEqualityAxiom("E1", phi);
      expectMatchErr(result);
    });
  });

  describe("E2: 対称律 ∀x.∀y. x = y → y = x", () => {
    it("should match the template", () => {
      const result = matchEqualityAxiom("E2", axiomE2Template);
      expectMatchOk(result);
    });
  });

  describe("E3: 推移律 ∀x.∀y.∀z. x = y → (y = z → x = z)", () => {
    it("should match the template", () => {
      const result = matchEqualityAxiom("E3", axiomE3Template);
      expectMatchOk(result);
    });
  });
});

// ── E4: 関数合同公理 ──────────────────────────────────────

describe("matchE4", () => {
  const x = termVariable("x");
  const y = termVariable("y");
  const x1 = termVariable("x1");
  const y1 = termVariable("y1");
  const x2 = termVariable("x2");
  const y2 = termVariable("y2");

  describe("1引数関数の合同公理", () => {
    it("∀x.∀y. x = y → S(x) = S(y) がマッチする", () => {
      const f = universal(
        x,
        universal(
          y,
          implication(
            equality(x, y),
            equality(
              functionApplication("S", [x]),
              functionApplication("S", [y]),
            ),
          ),
        ),
      );
      expectMatchOk(matchE4(f));
    });

    it("∀x.∀y. x = y → i(x) = i(y) がマッチする", () => {
      const f = universal(
        x,
        universal(
          y,
          implication(
            equality(x, y),
            equality(
              functionApplication("i", [x]),
              functionApplication("i", [y]),
            ),
          ),
        ),
      );
      expectMatchOk(matchE4(f));
    });

    it("具体的なインスタンス a = b → S(a) = S(b) がマッチする", () => {
      const a = functionApplication("S", [constant("0")]);
      const b = constant("0");
      const f = implication(
        equality(a, b),
        equality(functionApplication("S", [a]), functionApplication("S", [b])),
      );
      expectMatchOk(matchE4(f));
    });
  });

  describe("2引数二項演算子の合同公理", () => {
    it("∀x₁.∀y₁.∀x₂.∀y₂. x₁=y₁ → (x₂=y₂ → x₁+x₂ = y₁+y₂) がマッチする", () => {
      const f = universal(
        x1,
        universal(
          y1,
          universal(
            x2,
            universal(
              y2,
              implication(
                equality(x1, y1),
                implication(
                  equality(x2, y2),
                  equality(
                    binaryOperation("+", x1, x2),
                    binaryOperation("+", y1, y2),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      expectMatchOk(matchE4(f));
    });

    it("具体的なインスタンス a=b → (c=d → a+c = b+d) がマッチする", () => {
      const a = constant("0");
      const b = functionApplication("S", [constant("0")]);
      const c = constant("0");
      const d = constant("0");
      const f = implication(
        equality(a, b),
        implication(
          equality(c, d),
          equality(binaryOperation("+", a, c), binaryOperation("+", b, d)),
        ),
      );
      expectMatchOk(matchE4(f));
    });
  });

  describe("マッチしないケース", () => {
    it("E3（推移律）はマッチしない", () => {
      expectMatchErr(matchE4(axiomE3Template));
    });

    it("単なる等式はマッチしない", () => {
      expectMatchErr(matchE4(equality(x, y)));
    });

    it("関数名が異なる場合はマッチしない", () => {
      const f = implication(
        equality(x, y),
        equality(functionApplication("S", [x]), functionApplication("T", [y])),
      );
      expectMatchErr(matchE4(f));
    });

    it("前提の項と結論の関数引数が一致しない場合はマッチしない", () => {
      const f = implication(
        equality(x, y),
        equality(functionApplication("S", [y]), functionApplication("S", [x])),
      );
      expectMatchErr(matchE4(f));
    });

    it("命題論理の含意はマッチしない", () => {
      expectMatchErr(matchE4(implication(phi, psi)));
    });

    it("結論がEqualityでない場合はマッチしない", () => {
      // x = y → P(x)（結論がPredicateで、Equalityではない）
      const f = implication(equality(x, y), predicate("P", [x]));
      expectMatchErr(matchE4(f));
    });

    it("関数の引数数が左右で異なる場合はマッチしない", () => {
      const f = implication(
        equality(x, y),
        equality(
          functionApplication("f", [x]),
          functionApplication("f", [x, y]),
        ),
      );
      expectMatchErr(matchE4(f));
    });

    it("前提数と関数の引数数が一致しない場合はマッチしない", () => {
      // 2つの前提だが1引数関数
      const f = implication(
        equality(x, y),
        implication(
          equality(x1, y1),
          equality(
            functionApplication("S", [x]),
            functionApplication("S", [y]),
          ),
        ),
      );
      expectMatchErr(matchE4(f));
    });

    it("二項演算子名が異なる場合はマッチしない", () => {
      const f = implication(
        equality(x1, y1),
        implication(
          equality(x2, y2),
          equality(binaryOperation("+", x1, x2), binaryOperation("*", y1, y2)),
        ),
      );
      expectMatchErr(matchE4(f));
    });

    it("二項演算子で前提数が2でない場合はマッチしない", () => {
      // 1つの前提だが二項演算子
      const f = implication(
        equality(x1, y1),
        equality(binaryOperation("+", x1, x2), binaryOperation("+", y1, y2)),
      );
      expectMatchErr(matchE4(f));
    });

    it("二項演算子で前提の項と結論の引数が一致しない場合はマッチしない", () => {
      const f = implication(
        equality(x1, y1),
        implication(
          equality(x2, y2),
          equality(binaryOperation("+", x2, x1), binaryOperation("+", y1, y2)),
        ),
      );
      expectMatchErr(matchE4(f));
    });
  });
});

// ── CONJ-DEF / DISJ-DEF ──────────────────────────────────

describe("matchPropositionalAxiom CONJ-DEF", () => {
  const phi = metaVariable("φ");
  const psi = metaVariable("ψ");

  describe("正方向: (φ ∧ ψ) → ¬(φ → ¬ψ)", () => {
    it("テンプレートそのものがマッチする", () => {
      expectMatchOk(
        matchPropositionalAxiom("CONJ-DEF", axiomConjDefForwardTemplate),
      );
    });

    it("具体式のインスタンスがマッチする", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const f = implication(
        conjunction(p, q),
        negation(implication(p, negation(q))),
      );
      expectMatchOk(matchPropositionalAxiom("CONJ-DEF", f));
    });
  });

  describe("逆方向: ¬(φ → ¬ψ) → (φ ∧ ψ)", () => {
    it("テンプレートそのものがマッチする", () => {
      expectMatchOk(
        matchPropositionalAxiom("CONJ-DEF", axiomConjDefBackwardTemplate),
      );
    });

    it("具体式のインスタンスがマッチする", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const f = implication(
        negation(implication(p, negation(q))),
        conjunction(p, q),
      );
      expectMatchOk(matchPropositionalAxiom("CONJ-DEF", f));
    });
  });

  describe("マッチしないケース", () => {
    it("A1はCONJ-DEFにマッチしない", () => {
      expectMatchErr(matchPropositionalAxiom("CONJ-DEF", axiomA1Template));
    });

    it("φ ∧ ψだけではマッチしない", () => {
      expectMatchErr(
        matchPropositionalAxiom("CONJ-DEF", conjunction(phi, psi)),
      );
    });
  });
});

describe("matchPropositionalAxiom DISJ-DEF", () => {
  const phi = metaVariable("φ");
  const psi = metaVariable("ψ");

  describe("正方向: (φ ∨ ψ) → (¬φ → ψ)", () => {
    it("テンプレートそのものがマッチする", () => {
      expectMatchOk(
        matchPropositionalAxiom("DISJ-DEF", axiomDisjDefForwardTemplate),
      );
    });

    it("具体式のインスタンスがマッチする", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const f = implication(disjunction(p, q), implication(negation(p), q));
      expectMatchOk(matchPropositionalAxiom("DISJ-DEF", f));
    });
  });

  describe("逆方向: (¬φ → ψ) → (φ ∨ ψ)", () => {
    it("テンプレートそのものがマッチする", () => {
      expectMatchOk(
        matchPropositionalAxiom("DISJ-DEF", axiomDisjDefBackwardTemplate),
      );
    });

    it("具体式のインスタンスがマッチする", () => {
      const p = predicate("P", []);
      const q = predicate("Q", []);
      const f = implication(implication(negation(p), q), disjunction(p, q));
      expectMatchOk(matchPropositionalAxiom("DISJ-DEF", f));
    });
  });

  describe("マッチしないケース", () => {
    it("A1はDISJ-DEFにマッチしない", () => {
      expectMatchErr(matchPropositionalAxiom("DISJ-DEF", axiomA1Template));
    });

    it("φ ∨ ψだけではマッチしない", () => {
      expectMatchErr(
        matchPropositionalAxiom("DISJ-DEF", disjunction(phi, psi)),
      );
    });
  });
});

describe("identifyAxiom CONJ-DEF/DISJ-DEF", () => {
  it("CONJ-DEF正方向がŁukasiewicz体系で識別される", () => {
    const result = identifyAxiom(
      axiomConjDefForwardTemplate,
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("CONJ-DEF");
    }
  });

  it("CONJ-DEF逆方向がŁukasiewicz体系で識別される", () => {
    const result = identifyAxiom(
      axiomConjDefBackwardTemplate,
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("CONJ-DEF");
    }
  });

  it("DISJ-DEF正方向がŁukasiewicz体系で識別される", () => {
    const result = identifyAxiom(
      axiomDisjDefForwardTemplate,
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("DISJ-DEF");
    }
  });

  it("DISJ-DEF逆方向がŁukasiewicz体系で識別される", () => {
    const result = identifyAxiom(
      axiomDisjDefBackwardTemplate,
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("DISJ-DEF");
    }
  });

  it("CONJ-DEF/DISJ-DEFはminimalLogicSystemでは識別されない", () => {
    const r1 = identifyAxiom(axiomConjDefForwardTemplate, minimalLogicSystem);
    expect(r1._tag).toBe("Error");
    const r2 = identifyAxiom(axiomDisjDefForwardTemplate, minimalLogicSystem);
    expect(r2._tag).toBe("Error");
  });
});

// ── EX-DEF ───────────────────────────────────────────────

describe("matchExDef", () => {
  describe("正方向: (∃x.φ) → ¬(∀x.¬φ)", () => {
    it("テンプレートそのものがマッチする", () => {
      expectMatchOk(matchExDef(axiomExDefForwardTemplate));
    });

    it("具体式のインスタンスがマッチする", () => {
      const px = predicate("P", [x]);
      const f = implication(
        existential(x, px),
        negation(universal(x, negation(px))),
      );
      expectMatchOk(matchExDef(f));
    });

    it("異なる変数名でもマッチする", () => {
      const py = predicate("P", [y]);
      const f = implication(
        existential(y, py),
        negation(universal(y, negation(py))),
      );
      expectMatchOk(matchExDef(f));
    });

    it("複合式でもマッチする", () => {
      const body = implication(predicate("P", [x]), predicate("Q", [x]));
      const f = implication(
        existential(x, body),
        negation(universal(x, negation(body))),
      );
      expectMatchOk(matchExDef(f));
    });
  });

  describe("逆方向: ¬(∀x.¬φ) → (∃x.φ)", () => {
    it("具体式のインスタンスがマッチする", () => {
      const px = predicate("P", [x]);
      const f = implication(
        negation(universal(x, negation(px))),
        existential(x, px),
      );
      expectMatchOk(matchExDef(f));
    });

    it("異なる変数名でもマッチする", () => {
      const pz = predicate("P", [z]);
      const f = implication(
        negation(universal(z, negation(pz))),
        existential(z, pz),
      );
      expectMatchOk(matchExDef(f));
    });
  });

  describe("マッチしないケース", () => {
    it("Implicationでない式はマッチしない", () => {
      expectMatchErr(matchExDef(predicate("P", [x])));
    });

    it("量化変数が異なるとマッチしない", () => {
      const f = implication(
        existential(x, predicate("P", [x])),
        negation(universal(y, negation(predicate("P", [y])))),
      );
      expectMatchErr(matchExDef(f));
    });

    it("本体が異なるとマッチしない", () => {
      const f = implication(
        existential(x, predicate("P", [x])),
        negation(universal(x, negation(predicate("Q", [x])))),
      );
      expectMatchErr(matchExDef(f));
    });

    it("構造が異なるとマッチしない（∃→∀、否定なし）", () => {
      const px = predicate("P", [x]);
      const f = implication(existential(x, px), universal(x, px));
      expectMatchErr(matchExDef(f));
    });

    it("A1はEX-DEFにマッチしない", () => {
      expectMatchErr(matchExDef(axiomA1Template));
    });
  });
});

describe("identifyAxiom EX-DEF", () => {
  it("EX-DEF正方向が述語論理体系で識別される", () => {
    const px = predicate("P", [x]);
    const f = implication(
      existential(x, px),
      negation(universal(x, negation(px))),
    );
    const result = identifyAxiom(f, predicateLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("EX-DEF");
    }
  });

  it("EX-DEF逆方向が述語論理体系で識別される", () => {
    const px = predicate("P", [x]);
    const f = implication(
      negation(universal(x, negation(px))),
      existential(x, px),
    );
    const result = identifyAxiom(f, predicateLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("EX-DEF");
    }
  });

  it("EX-DEFは命題論理体系では識別されない", () => {
    const px = predicate("P", [x]);
    const f = implication(
      existential(x, px),
      negation(universal(x, negation(px))),
    );
    const result = identifyAxiom(f, lukasiewiczSystem);
    expect(result._tag).toBe("Error");
  });
});

// ── 代入の適用 ────────────────────────────────────────────

describe("applySubstitution", () => {
  it("should apply formula substitution", () => {
    const subst = buildFormulaSubstitutionMap([
      [metaVariable("φ"), predicate("P", [a])],
      [metaVariable("ψ"), predicate("Q", [a])],
    ]);
    const result = applySubstitution(axiomA1Template, subst, new Map());
    // P(a) → (Q(a) → P(a))
    expect(result._tag).toBe("Implication");
  });

  it("should apply both formula and term substitutions", () => {
    const fSubst = buildFormulaSubstitutionMap([
      [metaVariable("φ"), predicate("P", [termMetaVariable("τ")])],
    ]);
    const tSubst: ReadonlyMap<string, import("./term").Term> = new Map([
      ["τ", a],
    ]);
    const schema = implication(phi, phi);
    const result = applySubstitution(schema, fSubst, tSubst);
    expect(result._tag).toBe("Implication");
  });

  it("should return unchanged if substitutions are empty", () => {
    const result = applySubstitution(phi, new Map(), new Map());
    expect(result._tag).toBe("MetaVariable");
    expect((result as typeof phi).name).toBe("φ");
  });
});

// ── 体系設定 ──────────────────────────────────────────────

describe("LogicSystem", () => {
  it("SK system is same reference as minimal logic system", () => {
    expect(skSystem).toBe(minimalLogicSystem);
  });

  it("Minimal logic system has A1, A2 only", () => {
    expect(minimalLogicSystem.propositionalAxioms.has("A1")).toBe(true);
    expect(minimalLogicSystem.propositionalAxioms.has("A2")).toBe(true);
    expect(minimalLogicSystem.propositionalAxioms.has("A3")).toBe(false);
    expect(minimalLogicSystem.propositionalAxioms.has("M3")).toBe(false);
    expect(minimalLogicSystem.propositionalAxioms.size).toBe(2);
    expect(minimalLogicSystem.predicateLogic).toBe(false);
    expect(minimalLogicSystem.equalityLogic).toBe(false);
    expect(minimalLogicSystem.generalization).toBe(false);
  });

  it("Intuitionistic system has A1, A2, EFQ, CONJ-DEF, DISJ-DEF", () => {
    expect(intuitionisticSystem.propositionalAxioms.has("A1")).toBe(true);
    expect(intuitionisticSystem.propositionalAxioms.has("A2")).toBe(true);
    expect(intuitionisticSystem.propositionalAxioms.has("EFQ")).toBe(true);
    expect(intuitionisticSystem.propositionalAxioms.has("CONJ-DEF")).toBe(true);
    expect(intuitionisticSystem.propositionalAxioms.has("DISJ-DEF")).toBe(true);
    expect(intuitionisticSystem.propositionalAxioms.has("A3")).toBe(false);
    expect(intuitionisticSystem.propositionalAxioms.has("M3")).toBe(false);
    expect(intuitionisticSystem.propositionalAxioms.size).toBe(5);
    expect(intuitionisticSystem.predicateLogic).toBe(false);
    expect(intuitionisticSystem.equalityLogic).toBe(false);
    expect(intuitionisticSystem.generalization).toBe(false);
  });

  it("Łukasiewicz system has A1, A2, A3", () => {
    expect(lukasiewiczSystem.propositionalAxioms.has("A1")).toBe(true);
    expect(lukasiewiczSystem.propositionalAxioms.has("A2")).toBe(true);
    expect(lukasiewiczSystem.propositionalAxioms.has("A3")).toBe(true);
    expect(lukasiewiczSystem.predicateLogic).toBe(false);
    expect(lukasiewiczSystem.equalityLogic).toBe(false);
    expect(lukasiewiczSystem.generalization).toBe(false);
  });

  it("Mendelson system has A1, A2, M3", () => {
    expect(mendelsonSystem.propositionalAxioms.has("A1")).toBe(true);
    expect(mendelsonSystem.propositionalAxioms.has("A2")).toBe(true);
    expect(mendelsonSystem.propositionalAxioms.has("M3")).toBe(true);
    expect(mendelsonSystem.propositionalAxioms.has("A3")).toBe(false);
    expect(mendelsonSystem.predicateLogic).toBe(false);
    expect(mendelsonSystem.equalityLogic).toBe(false);
    expect(mendelsonSystem.generalization).toBe(false);
  });

  it("Predicate logic system has A1-A3 + predicateLogic + Gen", () => {
    expect(predicateLogicSystem.propositionalAxioms.has("A1")).toBe(true);
    expect(predicateLogicSystem.predicateLogic).toBe(true);
    expect(predicateLogicSystem.equalityLogic).toBe(false);
    expect(predicateLogicSystem.generalization).toBe(true);
  });

  it("Equality logic system has everything", () => {
    expect(equalityLogicSystem.propositionalAxioms.has("A1")).toBe(true);
    expect(equalityLogicSystem.predicateLogic).toBe(true);
    expect(equalityLogicSystem.equalityLogic).toBe(true);
    expect(equalityLogicSystem.generalization).toBe(true);
  });
});

// ── identifyAxiom ─────────────────────────────────────────

describe("identifyAxiom", () => {
  it("should identify A1 instance", () => {
    const pa = predicate("P", [a]);
    const qa = predicate("Q", [a]);
    const instance = implication(pa, implication(qa, pa));
    const result = identifyAxiom(instance, lukasiewiczSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("A1");
    }
  });

  it("should identify A2 instance", () => {
    const result = identifyAxiom(axiomA2Template, lukasiewiczSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("A2");
    }
  });

  it("should identify A3 instance", () => {
    const result = identifyAxiom(axiomA3Template, lukasiewiczSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("A3");
    }
  });

  it("should identify M3 instance in mendelson system", () => {
    const result = identifyAxiom(axiomM3Template, mendelsonSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("M3");
    }
  });

  it("should not identify M3 in lukasiewicz system", () => {
    const result = identifyAxiom(axiomM3Template, lukasiewiczSystem);
    expect(result._tag).toBe("Error");
  });

  it("should not identify A3 in mendelson system", () => {
    const result = identifyAxiom(axiomA3Template, mendelsonSystem);
    expect(result._tag).toBe("Error");
  });

  it("should identify A1 and A2 in mendelson system", () => {
    const a1Result = identifyAxiom(axiomA1Template, mendelsonSystem);
    expect(a1Result._tag).toBe("Ok");
    if (a1Result._tag === "Ok") {
      expect(a1Result.axiomId).toBe("A1");
    }
    const a2Result = identifyAxiom(axiomA2Template, mendelsonSystem);
    expect(a2Result._tag).toBe("Ok");
    if (a2Result._tag === "Ok") {
      expect(a2Result.axiomId).toBe("A2");
    }
  });

  it("should identify A1 and A2 in minimal logic system", () => {
    const a1Result = identifyAxiom(axiomA1Template, minimalLogicSystem);
    expect(a1Result._tag).toBe("Ok");
    if (a1Result._tag === "Ok") {
      expect(a1Result.axiomId).toBe("A1");
    }
    const a2Result = identifyAxiom(axiomA2Template, minimalLogicSystem);
    expect(a2Result._tag).toBe("Ok");
    if (a2Result._tag === "Ok") {
      expect(a2Result.axiomId).toBe("A2");
    }
  });

  it("should not identify A3 or M3 in minimal logic system", () => {
    const a3Result = identifyAxiom(axiomA3Template, minimalLogicSystem);
    expect(a3Result._tag).toBe("Error");
    const m3Result = identifyAxiom(axiomM3Template, minimalLogicSystem);
    expect(m3Result._tag).toBe("Error");
  });

  it("should identify EFQ instance in intuitionistic system", () => {
    const result = identifyAxiom(axiomEFQTemplate, intuitionisticSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("EFQ");
    }
  });

  it("should not identify EFQ in lukasiewicz system", () => {
    const result = identifyAxiom(axiomEFQTemplate, lukasiewiczSystem);
    expect(result._tag).toBe("Error");
  });

  it("should not identify A3 in intuitionistic system", () => {
    const result = identifyAxiom(axiomA3Template, intuitionisticSystem);
    expect(result._tag).toBe("Error");
  });

  it("should identify A1 and A2 in intuitionistic system", () => {
    const a1Result = identifyAxiom(axiomA1Template, intuitionisticSystem);
    expect(a1Result._tag).toBe("Ok");
    if (a1Result._tag === "Ok") {
      expect(a1Result.axiomId).toBe("A1");
    }
    const a2Result = identifyAxiom(axiomA2Template, intuitionisticSystem);
    expect(a2Result._tag).toBe("Ok");
    if (a2Result._tag === "Ok") {
      expect(a2Result.axiomId).toBe("A2");
    }
  });

  it("should identify DNE instance in classical logic system", () => {
    const result = identifyAxiom(axiomDNETemplate, classicalLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("DNE");
    }
  });

  it("should not identify DNE in lukasiewicz system", () => {
    const result = identifyAxiom(axiomDNETemplate, lukasiewiczSystem);
    expect(result._tag).toBe("Error");
  });

  it("should not identify EFQ in classical logic system", () => {
    const result = identifyAxiom(axiomEFQTemplate, classicalLogicSystem);
    expect(result._tag).toBe("Error");
  });

  it("should identify A1 and A2 in classical logic system", () => {
    const a1Result = identifyAxiom(axiomA1Template, classicalLogicSystem);
    expect(a1Result._tag).toBe("Ok");
    if (a1Result._tag === "Ok") {
      expect(a1Result.axiomId).toBe("A1");
    }
    const a2Result = identifyAxiom(axiomA2Template, classicalLogicSystem);
    expect(a2Result._tag).toBe("Ok");
    if (a2Result._tag === "Ok") {
      expect(a2Result.axiomId).toBe("A2");
    }
  });

  it("should identify A4 instance when predicate logic enabled", () => {
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [a]),
    );
    const result = identifyAxiom(instance, predicateLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("A4");
    }
  });

  it("should not identify A4 when predicate logic disabled", () => {
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [a]),
    );
    const result = identifyAxiom(instance, lukasiewiczSystem);
    // A4 is not checked in Łukasiewicz system
    expect(result._tag).toBe("Error");
  });

  it("should identify A5 instance when predicate logic enabled", () => {
    const py = predicate("P", [y]);
    const qx = predicate("Q", [x]);
    const instance = implication(
      universal(x, implication(py, qx)),
      implication(py, universal(x, qx)),
    );
    const result = identifyAxiom(instance, predicateLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("A5");
    }
  });

  it("should identify E1 instance when equality logic enabled", () => {
    const result = identifyAxiom(axiomE1Template, equalityLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("E1");
    }
  });

  it("should not identify E1 when equality logic disabled", () => {
    const result = identifyAxiom(axiomE1Template, predicateLogicSystem);
    expect(result._tag).toBe("Error");
  });

  it("should return Error for non-axiom formula", () => {
    const result = identifyAxiom(implication(phi, phi), lukasiewiczSystem);
    expect(result._tag).toBe("Error");
  });

  it("should skip propositional axioms not in system", () => {
    // System with no propositional axioms but predicate logic
    const minimalSystem: import("./inferenceRule").LogicSystem = {
      name: "minimal",
      propositionalAxioms: new Set(),
      predicateLogic: true,
      equalityLogic: false,
      generalization: false,
    };
    // An A1 instance should not be identified
    const pa = predicate("P", [a]);
    const qa = predicate("Q", [a]);
    const a1Instance = implication(pa, implication(qa, pa));
    const result = identifyAxiom(a1Instance, minimalSystem);
    expect(result._tag).toBe("Error");
  });
});

// ── φ→φ の証明検証 (統合テスト) ─────────────────────────

describe("integration: φ→φ proof", () => {
  it("should verify the proof of φ→φ", () => {
    // ステップ1: A2 インスタンス
    // (φ→((ψ→φ)→φ)) → ((φ→(ψ→φ)) → (φ→φ))
    // ψ := ψ→φ を代入
    // 実際: (φ→((φ→φ)→φ)) → ((φ→(φ→φ)) → (φ→φ))
    // ただしPRDの証明はψ:=φ→φ, χ:=φ
    const a2Instance = implication(
      implication(phi, implication(implication(phi, phi), phi)),
      implication(
        implication(phi, implication(phi, phi)),
        implication(phi, phi),
      ),
    );
    expectMatchOk(matchPropositionalAxiom("A2", a2Instance));

    // ステップ2: A1 インスタンス (a)
    // φ → ((φ→φ) → φ)
    const a1InstanceA = implication(
      phi,
      implication(implication(phi, phi), phi),
    );
    expectMatchOk(matchPropositionalAxiom("A1", a1InstanceA));

    // ステップ3: MP (A2 instance + A1 instance a)
    // A2 instance の left = A1 instance a
    const mp1Result = applyModusPonens(a1InstanceA, a2Instance);
    const mp1Ok = expectRuleOk(mp1Result);
    // 結果: (φ→(φ→φ)) → (φ→φ)
    const mp1Conclusion = mp1Ok.conclusion;

    // ステップ4: A1 インスタンス (b)
    // φ → (φ → φ)
    const a1InstanceB = implication(phi, implication(phi, phi));
    expectMatchOk(matchPropositionalAxiom("A1", a1InstanceB));

    // ステップ5: MP (step3 result + A1 instance b)
    const mp2Result = applyModusPonens(a1InstanceB, mp1Conclusion);
    const mp2Ok = expectRuleOk(mp2Result);
    // 結果: φ→φ
    expect(mp2Ok.conclusion._tag).toBe("Implication");
  });
});

// ── 公理テンプレートのexhaucstivenessテスト ──────────────

describe("axiom templates", () => {
  it("A1 template has correct structure", () => {
    expect(axiomA1Template._tag).toBe("Implication");
  });

  it("A2 template has correct structure", () => {
    expect(axiomA2Template._tag).toBe("Implication");
  });

  it("A3 template has correct structure", () => {
    expect(axiomA3Template._tag).toBe("Implication");
  });

  it("E1 template has correct structure", () => {
    expect(axiomE1Template._tag).toBe("Universal");
  });

  it("E2 template has correct structure", () => {
    expect(axiomE2Template._tag).toBe("Universal");
  });

  it("E3 template has correct structure", () => {
    expect(axiomE3Template._tag).toBe("Universal");
  });
});

// ── エッジケース ─────────────────────────────────────────

describe("edge cases", () => {
  it("MP with identical antecedent and conclusion", () => {
    const result = applyModusPonens(phi, implication(phi, phi));
    expectRuleOk(result);
  });

  it("A4 with function application replacement", () => {
    const fx = functionApplication("f", [x]);
    const ffa = functionApplication("f", [functionApplication("f", [a])]);
    const instance = implication(
      universal(x, predicate("P", [fx])),
      predicate("P", [ffa]),
    );
    const result = matchAxiomA4(instance);
    // ∀x.P(f(x)) → P(f(f(a))): x ↦ f(a)
    expectMatchOk(result);
  });

  it("A4 with equality", () => {
    // ∀x.(x = a) → (y = a)
    const instance = implication(universal(x, equality(x, a)), equality(y, a));
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("identifyAxiom prefers A1 over other axioms for matching instances", () => {
    const result = identifyAxiom(axiomA1Template, lukasiewiczSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("A1");
    }
  });

  it("A4 with nested quantifier where bound var is shadowed", () => {
    // ∀x.∀x.P(x) → ∀x.P(x)
    // inner ∀x shadows outer x, so substitution of outer x doesn't affect inner
    const instance = implication(
      universal(x, universal(x, predicate("P", [x]))),
      universal(x, predicate("P", [x])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with negation in body", () => {
    // ∀x.¬P(x) → ¬P(a)
    const instance = implication(
      universal(x, negation(predicate("P", [x]))),
      negation(predicate("P", [a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with conjunction in body", () => {
    // ∀x.(P(x)∧Q(x)) → (P(a)∧Q(a))
    const instance = implication(
      universal(x, conjunction(predicate("P", [x]), predicate("Q", [x]))),
      conjunction(predicate("P", [a]), predicate("Q", [a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with disjunction in body", () => {
    const instance = implication(
      universal(x, disjunction(predicate("P", [x]), predicate("Q", [x]))),
      disjunction(predicate("P", [a]), predicate("Q", [a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with biconditional in body", () => {
    const instance = implication(
      universal(x, biconditional(predicate("P", [x]), predicate("Q", [x]))),
      biconditional(predicate("P", [a]), predicate("Q", [a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with existential quantifier in body", () => {
    // ∀x.∃y.P(x,y) → ∃y.P(a,y)
    const instance = implication(
      universal(x, existential(y, predicate("P", [x, y]))),
      existential(y, predicate("P", [a, y])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with meta variable in body", () => {
    // ∀x.(φ→P(x)) → (φ→P(a))
    const instance = implication(
      universal(x, implication(phi, predicate("P", [x]))),
      implication(phi, predicate("P", [a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with constant and term meta variable in body", () => {
    // ∀x.P(x, c, τ) → P(a, c, τ)
    const c = constant("c");
    const tau = termMetaVariable("τ");
    const instance = implication(
      universal(x, predicate("P", [x, c, tau])),
      predicate("P", [a, c, tau]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with binary operation in replacement", () => {
    // ∀x.P(x) → P(a+b)
    const b = constant("b");
    const aplusb = binaryOperation("+", a, b);
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [aplusb]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with conjunction template (via inferTermReplacement)", () => {
    // ∀x.(P(x) ∧ Q(x)) → (P(a) ∧ Q(a))
    const instance = implication(
      universal(x, conjunction(predicate("P", [x]), predicate("Q", [x]))),
      conjunction(predicate("P", [a]), predicate("Q", [a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("identifyAxiom with E2", () => {
    const result = identifyAxiom(axiomE2Template, equalityLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("E2");
    }
  });

  it("identifyAxiom with E3", () => {
    const result = identifyAxiom(axiomE3Template, equalityLogicSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("E3");
    }
  });

  // ── matchFormulaPattern の matchTerm カバレッジ ─────────────

  it("E1 template is exact match (no meta variables)", () => {
    // E1: ∀x. x=x — template uses concrete TermVariables, so only exact match works
    const result = matchEqualityAxiom("E1", axiomE1Template);
    expectMatchOk(result);
  });

  it("E1 rejects non-matching variable name", () => {
    // E1: ∀x. x=x template won't match ∀y. y=y because x≠y (concrete var matching)
    const instance = universal(y, equality(y, y));
    const result = matchEqualityAxiom("E1", instance);
    expectMatchErr(result);
  });

  it("E2 exact match", () => {
    // E2: ∀x.∀y. x=y → y=x
    const result = matchEqualityAxiom("E2", axiomE2Template);
    expectMatchOk(result);
  });

  // ── A4 エラー分岐のカバレッジ ─────────────────────────────

  it("A4 rejects non-implication", () => {
    const result = matchAxiomA4(phi);
    expectMatchErr(result);
  });

  it("A4 rejects implication with non-universal left", () => {
    const result = matchAxiomA4(implication(phi, psi));
    expectMatchErr(result);
  });

  it("A4 rejects when substitution yields different result", () => {
    // ∀x.P(x) → P(y) は正しいA4だが、∀x.P(x) → Q(a) は不正
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("Q", [a]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with substitution that is not free-for", () => {
    // ∀x.∀y.P(x,y) → ∀y.P(y,y) — x↦y but y is captured by ∀y
    const instance = implication(
      universal(x, universal(y, predicate("P", [x, y]))),
      universal(y, predicate("P", [y, y])),
    );
    const result = matchAxiomA4(instance);
    const error = expectMatchErr(result);
    expect(error._tag).toBe("SubstitutionNotFreeFor");
  });

  // ── inferTermReplacement カバレッジ ────────────────────────

  it("A4 with universal quantifier in body (shadowing)", () => {
    // ∀x.∀y.P(y,x) → ∀y.P(y,a) — covers Universal branch in inferTermReplacement
    const instance = implication(
      universal(x, universal(y, predicate("P", [y, x]))),
      universal(y, predicate("P", [y, a])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 rejects when predicate names differ in body vs target", () => {
    // ∀x.P(x) → Q(a) — P≠Q so inferTermReplacement fails
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("Q", [a]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 rejects when predicate arity differs", () => {
    // ∀x.P(x) → P(a, b) — different arity
    const b = constant("b");
    const instance = implication(
      universal(x, predicate("P", [x])),
      predicate("P", [a, b]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with function application mismatch in body", () => {
    // ∀x.P(f(x)) → P(g(a)) — f≠g
    const fx = functionApplication("f", [x]);
    const ga = functionApplication("g", [a]);
    const instance = implication(
      universal(x, predicate("P", [fx])),
      predicate("P", [ga]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with function arity mismatch in body", () => {
    // ∀x.P(f(x)) → P(f(a,b)) — different arity
    const b = constant("b");
    const fx = functionApplication("f", [x]);
    const fab = functionApplication("f", [a, b]);
    const instance = implication(
      universal(x, predicate("P", [fx])),
      predicate("P", [fab]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with binary operation mismatch (wrong operator)", () => {
    // ∀x.P(x+a) → P(a*a) — +≠*
    const xplusa = binaryOperation("+", x, a);
    const atimesa = binaryOperation("*", a, a);
    const instance = implication(
      universal(x, predicate("P", [xplusa])),
      predicate("P", [atimesa]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with binary operation mismatch (wrong type)", () => {
    // ∀x.P(x+a) → P(f(a)) — BinaryOperation vs FunctionApplication
    const xplusa = binaryOperation("+", x, a);
    const fa = functionApplication("f", [a]);
    const instance = implication(
      universal(x, predicate("P", [xplusa])),
      predicate("P", [fa]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with variable mismatch in non-target position", () => {
    // ∀x.P(x, y) → P(a, z) — y≠z so mismatch
    const instance = implication(
      universal(x, predicate("P", [x, y])),
      predicate("P", [a, z]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 where body has no free occurrence of bound var (identity case)", () => {
    // ∀x.P(a) → P(a) — x doesn't occur free, body=conclusion
    const instance = implication(
      universal(x, predicate("P", [a])),
      predicate("P", [a]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 where body has no free var and conclusion differs", () => {
    // ∀x.P(a) → P(b) — x doesn't occur free but body≠conclusion
    const b = constant("b");
    const instance = implication(
      universal(x, predicate("P", [a])),
      predicate("P", [b]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with quantifier variable mismatch in body", () => {
    // ∀x.∀y.P(x,y) → ∀z.P(a,z) — y≠z so quantifier variables don't match
    const instance = implication(
      universal(x, universal(y, predicate("P", [x, y]))),
      universal(z, predicate("P", [a, z])),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 where bound var shadows outer in body (equalFormula path)", () => {
    // ∀x.∀x.P(x) → ∀x.P(x) — inner ∀x shadows outer x
    // inferTermReplacement: b.variable.name === variable.name → equalFormula path
    const instance = implication(
      universal(x, universal(x, predicate("P", [x]))),
      universal(x, predicate("P", [x])),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with function application type mismatch in inferTermReplacement", () => {
    // ∀x.P(f(x, a)) → P(f(a)) — f arity mismatch
    const fxa = functionApplication("f", [x, a]);
    const fa = functionApplication("f", [a]);
    const instance = implication(
      universal(x, predicate("P", [fxa])),
      predicate("P", [fa]),
    );
    const result = matchAxiomA4(instance);
    expectMatchErr(result);
  });

  it("A4 with function application vs non-function in target", () => {
    // ∀x.P(f(x)) → P(a) — body has f(x) at position, target has constant a
    const fx = functionApplication("f", [x]);
    const instance = implication(
      universal(x, predicate("P", [fx])),
      predicate("P", [a]),
    );
    const result = matchAxiomA4(instance);
    // f(x) with x->a would give f(a), but target position has just a (not f(a))
    expectMatchErr(result);
  });

  it("A4 with function application in body and matching target (covers inferTermReplacement matchTerm)", () => {
    // ∀x.P(f(x), x) → P(f(a), a) — body has f(x) and x, target has f(a) and a
    const fx = functionApplication("f", [x]);
    const fa = functionApplication("f", [a]);
    const instance = implication(
      universal(x, predicate("P", [fx, x])),
      predicate("P", [fa, a]),
    );
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });

  it("A4 with FormulaSubstitution in body (covers inferTermReplacement FormulaSubstitution)", () => {
    // body = (P(x))[f(x)/w]、conclusion = (P(a))[f(a)/w]
    // ∀x. body → conclusion で x → a の代入を推論
    const w = termVariable("w");
    const fx = functionApplication("f", [x]);
    const fa = functionApplication("f", [a]);
    const body = formulaSubstitution(predicate("P", [x]), fx, w);
    const conclusion = formulaSubstitution(predicate("P", [a]), fa, w);
    const instance = implication(universal(x, body), conclusion);
    const result = matchAxiomA4(instance);
    expectMatchOk(result);
  });
});

// ── matchFormulaPattern (直接テスト) ─────────────────────────

describe("matchFormulaPattern", () => {
  describe("TermMetaVariable in template", () => {
    it("should bind TermMetaVariable to candidate term", () => {
      // Template: P(τ), Candidate: P(a)
      const tau = termMetaVariable("τ");
      const template = predicate("P", [tau]);
      const candidate = predicate("P", [a]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).not.toBeUndefined();
      if (result) {
        expect(result.termSub.size).toBe(1);
      }
    });

    it("should check consistency of TermMetaVariable bindings", () => {
      // Template: P(τ, τ), Candidate: P(a, b) — inconsistent
      const tau = termMetaVariable("τ");
      const b = constant("b");
      const template = predicate("P", [tau, tau]);
      const candidate = predicate("P", [a, b]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });

    it("should accept consistent TermMetaVariable bindings", () => {
      // Template: P(τ, τ), Candidate: P(a, a) — consistent
      const tau = termMetaVariable("τ");
      const template = predicate("P", [tau, tau]);
      const candidate = predicate("P", [a, a]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).not.toBeUndefined();
    });
  });

  describe("Constant in template term", () => {
    it("should match identical constants", () => {
      // Template: P(0), Candidate: P(0)
      const zero = constant("0");
      const template = predicate("P", [zero]);
      const candidate = predicate("P", [zero]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).not.toBeUndefined();
    });

    it("should reject different constants", () => {
      // Template: P(0), Candidate: P(1)
      const zero = constant("0");
      const one = constant("1");
      const template = predicate("P", [zero]);
      const candidate = predicate("P", [one]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });
  });

  describe("FunctionApplication in template term", () => {
    it("should match identical function applications", () => {
      // Template: P(f(x)), Candidate: P(f(x))
      const fx = functionApplication("f", [x]);
      const template = predicate("P", [fx]);
      const candidate = predicate("P", [fx]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).not.toBeUndefined();
    });

    it("should reject different function names", () => {
      // Template: P(f(x)), Candidate: P(g(x))
      const fx = functionApplication("f", [x]);
      const gx = functionApplication("g", [x]);
      const template = predicate("P", [fx]);
      const candidate = predicate("P", [gx]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });

    it("should reject different arities", () => {
      // Template: P(f(x, y)), Candidate: P(f(x))
      const fxy = functionApplication("f", [x, y]);
      const fx = functionApplication("f", [x]);
      const template = predicate("P", [fxy]);
      const candidate = predicate("P", [fx]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });
  });

  describe("Predicate mismatch", () => {
    it("should reject different predicate names", () => {
      // Template: P(x), Candidate: Q(x)
      const template = predicate("P", [x]);
      const candidate = predicate("Q", [x]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });

    it("should reject different predicate arities", () => {
      // Template: P(x, y), Candidate: P(x)
      const template = predicate("P", [x, y]);
      const candidate = predicate("P", [x]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });
  });

  describe("Term tag mismatch", () => {
    it("should reject when template has TermVariable but candidate has Constant", () => {
      // Template: P(x), Candidate: P(0)  — x is TermVariable not TermMetaVariable
      const template = predicate("P", [x]);
      const candidate = predicate("P", [constant("0")]);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });
  });

  describe("BinaryOperation in template term", () => {
    it("should match identical binary operations", () => {
      // Template: x + y = z, Candidate: x + y = z
      const template = equality(binaryOperation("+", x, y), z);
      const candidate = equality(binaryOperation("+", x, y), z);
      const result = matchFormulaPattern(template, candidate);
      expect(result).not.toBeUndefined();
    });

    it("should reject different operators", () => {
      // Template: x + y = z, Candidate: x * y = z
      const template = equality(binaryOperation("+", x, y), z);
      const candidate = equality(binaryOperation("*", x, y), z);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });
  });

  describe("FormulaSubstitution in template", () => {
    it("should match identical FormulaSubstitution", () => {
      // Template: φ[τ/x], Candidate: φ[τ/x]
      const tau = termMetaVariable("τ");
      const template = formulaSubstitution(phi, tau, x);
      const candidate = formulaSubstitution(
        implication(predicate("P", [x]), predicate("Q", [x])),
        functionApplication("f", [y]),
        x,
      );
      const result = matchFormulaPattern(template, candidate);
      expect(result).not.toBeUndefined();
    });

    it("should reject FormulaSubstitution with different variable", () => {
      // Template: φ[τ/x], Candidate: ψ[τ/y]
      const tau = termMetaVariable("τ");
      const template = formulaSubstitution(phi, tau, x);
      const candidate = formulaSubstitution(psi, tau, y);
      const result = matchFormulaPattern(template, candidate);
      // variable x ≠ y
      expect(result).toBeUndefined();
    });

    it("should match FreeVariableAbsence with same structure", () => {
      // Template: φ[/x], Candidate: P(y)[/x]
      const template = freeVariableAbsence(phi, x);
      const candidate = freeVariableAbsence(predicate("P", [y]), x);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeDefined();
    });

    it("should reject FreeVariableAbsence with different variable", () => {
      // Template: φ[/x], Candidate: P(y)[/y]
      const template = freeVariableAbsence(phi, x);
      const candidate = freeVariableAbsence(predicate("P", [y]), y);
      const result = matchFormulaPattern(template, candidate);
      expect(result).toBeUndefined();
    });
  });
});

// ── ペアノ算術の公理テンプレート ────────────────────────────

describe("ペアノ算術公理テンプレート", () => {
  // ヘルパー
  const zero = constant("0");
  const succOfX = functionApplication("S", [x]);
  const succOfY = functionApplication("S", [y]);

  describe("PA1: ∀x. ¬(S(x) = 0)", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomPA1Template._tag).toBe("Universal");
      if (axiomPA1Template._tag === "Universal") {
        expect(axiomPA1Template.variable.name).toBe("x");
        expect(axiomPA1Template.formula._tag).toBe("Negation");
      }
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(peanoFixedAxioms[0], axiomPA1Template);
      expectMatchOk(result);
    });

    it("異なる式はマッチしない", () => {
      const wrong = universal(x, equality(succOfX, zero)); // ¬ がない
      const result = matchTheoryAxiom(peanoFixedAxioms[0], wrong);
      expectMatchErr(result);
    });
  });

  describe("PA2: ∀x.∀y. S(x) = S(y) → x = y", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomPA2Template._tag).toBe("Universal");
      if (axiomPA2Template._tag === "Universal") {
        expect(axiomPA2Template.formula._tag).toBe("Universal");
      }
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(peanoFixedAxioms[1], axiomPA2Template);
      expectMatchOk(result);
    });

    it("異なる式はマッチしない", () => {
      // S(x) = S(y) → y = x (x,y 逆)
      const wrong = universal(
        x,
        universal(y, implication(equality(succOfX, succOfY), equality(y, x))),
      );
      const result = matchTheoryAxiom(peanoFixedAxioms[1], wrong);
      expectMatchErr(result);
    });
  });

  describe("PA3: ∀x. x + 0 = x", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomPA3Template._tag).toBe("Universal");
      if (axiomPA3Template._tag === "Universal") {
        expect(axiomPA3Template.formula._tag).toBe("Equality");
      }
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(peanoFixedAxioms[2], axiomPA3Template);
      expectMatchOk(result);
    });
  });

  describe("PA4: ∀x.∀y. x + S(y) = S(x + y)", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomPA4Template._tag).toBe("Universal");
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(peanoFixedAxioms[3], axiomPA4Template);
      expectMatchOk(result);
    });
  });

  describe("PA5: ∀x. x * 0 = 0", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomPA5Template._tag).toBe("Universal");
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(peanoFixedAxioms[4], axiomPA5Template);
      expectMatchOk(result);
    });
  });

  describe("PA6: ∀x.∀y. x * S(y) = x * y + x", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomPA6Template._tag).toBe("Universal");
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(peanoFixedAxioms[5], axiomPA6Template);
      expectMatchOk(result);
    });
  });
});

describe("peanoArithmeticSystem", () => {
  it("述語論理・等号・汎化が有効", () => {
    expect(peanoArithmeticSystem.predicateLogic).toBe(true);
    expect(peanoArithmeticSystem.equalityLogic).toBe(true);
    expect(peanoArithmeticSystem.generalization).toBe(true);
  });

  it("理論公理(PA1-PA6)が含まれる", () => {
    const axioms = peanoArithmeticSystem.theoryAxioms;
    expect(axioms).toBeDefined();
    expect(axioms?.length).toBe(6);
    expect(axioms?.map((a) => a.id)).toEqual([
      "PA1",
      "PA2",
      "PA3",
      "PA4",
      "PA5",
      "PA6",
    ]);
  });
});

describe("identifyAxiom with theoryAxioms", () => {
  it("PA体系でPA1公理を識別する", () => {
    const result = identifyAxiom(axiomPA1Template, peanoArithmeticSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("PA1");
      expect(result.displayName).toBe("PA1 (0≠後者)");
    }
  });

  it("PA体系でPA3公理を識別する", () => {
    const result = identifyAxiom(axiomPA3Template, peanoArithmeticSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("PA3");
    }
  });

  it("PA体系でPA6公理を識別する", () => {
    const result = identifyAxiom(axiomPA6Template, peanoArithmeticSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("PA6");
    }
  });

  it("PA体系でも通常の論理公理(A1)は識別される", () => {
    const result = identifyAxiom(axiomA1Template, peanoArithmeticSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("A1");
    }
  });

  it("PA体系でも等号公理(E1)は識別される", () => {
    const result = identifyAxiom(axiomE1Template, peanoArithmeticSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("E1");
    }
  });

  it("theoryAxiomsが未定義の体系では理論公理は識別されない", () => {
    const result = identifyAxiom(axiomPA1Template, equalityLogicSystem);
    expect(result._tag).toBe("Error");
  });

  it("論理公理でもPA公理でもない式はErrorになる", () => {
    // ¬¬φ は A1, A2, A3, A4, A5, E1-E3, PA1-PA6 のいずれにもマッチしない
    const randomFormula = negation(negation(phi));
    const result = identifyAxiom(randomFormula, peanoArithmeticSystem);
    expect(result._tag).toBe("Error");
  });
});

describe("robinsonArithmeticSystem", () => {
  it("述語論理・等号・汎化が有効", () => {
    expect(robinsonArithmeticSystem.predicateLogic).toBe(true);
    expect(robinsonArithmeticSystem.equalityLogic).toBe(true);
    expect(robinsonArithmeticSystem.generalization).toBe(true);
  });

  it("理論公理(PA1-PA6 + Q7)が含まれる", () => {
    const axioms = robinsonArithmeticSystem.theoryAxioms;
    expect(axioms).toBeDefined();
    expect(axioms?.length).toBe(7);
    const ids = axioms?.map((a) => a.id);
    expect(ids).toEqual(["PA1", "PA2", "PA3", "PA4", "PA5", "PA6", "Q7"]);
  });

  it("robinsonAxiomsはpeanoFixedAxiomsを含む", () => {
    for (const pa of peanoFixedAxioms) {
      expect(robinsonAxioms.some((a) => a.id === pa.id)).toBe(true);
    }
  });

  it("Q7公理を識別する", () => {
    const result = identifyAxiom(axiomQ7Template, robinsonArithmeticSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("Q7");
    }
  });

  it("PA公理もQ体系で識別される", () => {
    const result = identifyAxiom(axiomPA1Template, robinsonArithmeticSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("PA1");
    }
  });
});

describe("PA流儀バリアント", () => {
  it("peanoArithmeticHKSystem: DNEベース + PA1-PA6", () => {
    expect(peanoArithmeticHKSystem.propositionalAxioms).toEqual(
      new Set(["A1", "A2", "DNE", "CONJ-DEF", "DISJ-DEF"]),
    );
    expect(peanoArithmeticHKSystem.predicateLogic).toBe(true);
    expect(peanoArithmeticHKSystem.equalityLogic).toBe(true);
    expect(peanoArithmeticHKSystem.generalization).toBe(true);
    expect(peanoArithmeticHKSystem.theoryAxioms?.length).toBe(6);
    expect(peanoArithmeticHKSystem.theoryAxioms).toBe(peanoFixedAxioms);
  });

  it("peanoArithmeticMendelsonSystem: M3ベース + PA1-PA6", () => {
    expect(peanoArithmeticMendelsonSystem.propositionalAxioms).toEqual(
      new Set(["A1", "A2", "M3", "CONJ-DEF", "DISJ-DEF"]),
    );
    expect(peanoArithmeticMendelsonSystem.predicateLogic).toBe(true);
    expect(peanoArithmeticMendelsonSystem.equalityLogic).toBe(true);
    expect(peanoArithmeticMendelsonSystem.generalization).toBe(true);
    expect(peanoArithmeticMendelsonSystem.theoryAxioms).toBe(peanoFixedAxioms);
  });

  it("heytingArithmeticSystem: EFQベース + PA1-PA6", () => {
    expect(heytingArithmeticSystem.propositionalAxioms).toEqual(
      new Set(["A1", "A2", "EFQ", "CONJ-DEF", "DISJ-DEF"]),
    );
    expect(heytingArithmeticSystem.predicateLogic).toBe(true);
    expect(heytingArithmeticSystem.equalityLogic).toBe(true);
    expect(heytingArithmeticSystem.generalization).toBe(true);
    expect(heytingArithmeticSystem.theoryAxioms).toBe(peanoFixedAxioms);
  });

  it("HKバリアントでPA公理を識別できる", () => {
    const result = identifyAxiom(axiomPA3Template, peanoArithmeticHKSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("PA3");
    }
  });

  it("MendelsonバリアントでPA公理を識別できる", () => {
    const result = identifyAxiom(
      axiomPA5Template,
      peanoArithmeticMendelsonSystem,
    );
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("PA5");
    }
  });

  it("HAでPA公理を識別できる", () => {
    const result = identifyAxiom(axiomPA6Template, heytingArithmeticSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("PA6");
    }
  });

  it("HKバリアントでDNE公理を識別できる", () => {
    const result = identifyAxiom(axiomDNETemplate, peanoArithmeticHKSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("DNE");
    }
  });

  it("MendelsonバリアントでM3公理を識別できる", () => {
    const result = identifyAxiom(
      axiomM3Template,
      peanoArithmeticMendelsonSystem,
    );
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("M3");
    }
  });

  it("HAでEFQ公理を識別できる", () => {
    const result = identifyAxiom(axiomEFQTemplate, heytingArithmeticSystem);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.axiomId).toBe("EFQ");
    }
  });

  it("HAでDNEは識別されない", () => {
    const result = identifyAxiom(axiomDNETemplate, heytingArithmeticSystem);
    expect(result._tag).toBe("Error");
  });
});

describe("matchTheoryAxiom", () => {
  describe("exactモード", () => {
    it("完全一致でOkを返す", () => {
      const axiom: TheoryAxiom = {
        id: "TEST",
        displayName: "Test",
        template: axiomPA1Template,
        dslText: "",
        matchMode: "exact",
      };
      const result = matchTheoryAxiom(axiom, axiomPA1Template);
      expectMatchOk(result);
    });

    it("不一致でErrorを返す", () => {
      const axiom: TheoryAxiom = {
        id: "TEST",
        displayName: "Test",
        template: axiomPA1Template,
        dslText: "",
        matchMode: "exact",
      };
      const result = matchTheoryAxiom(axiom, axiomPA2Template);
      expectMatchErr(result);
    });
  });

  describe("patternモード", () => {
    it("パターンマッチでOkを返す", () => {
      // テンプレート: φ → φ
      const axiom: TheoryAxiom = {
        id: "TEST",
        displayName: "Test",
        template: implication(phi, phi),
        dslText: "",
        matchMode: "pattern",
      };
      // 候補: (P(x) → P(x)) — φ = P(x) としてマッチ
      const px = predicate("P", [x]);
      const candidate = implication(px, px);
      const result = matchTheoryAxiom(axiom, candidate);
      expectMatchOk(result);
    });

    it("パターン不一致でErrorを返す", () => {
      const axiom: TheoryAxiom = {
        id: "TEST",
        displayName: "Test",
        template: implication(phi, phi),
        dslText: "",
        matchMode: "pattern",
      };
      // 候補: P(x) → Q(x) — φ が P(x) と Q(x) で矛盾
      const candidate = implication(predicate("P", [x]), predicate("Q", [x]));
      const result = matchTheoryAxiom(axiom, candidate);
      expectMatchErr(result);
    });
  });
});

// ── 群論公理テンプレート ──────────────────────────────────────────

describe("群論公理テンプレート", () => {
  // ヘルパー
  const e = constant("e");
  const invX = functionApplication("i", [x]);

  describe("G1: ∀x.∀y.∀z. (x * y) * z = x * (y * z)", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomG1Template._tag).toBe("Universal");
      if (axiomG1Template._tag === "Universal") {
        expect(axiomG1Template.variable.name).toBe("x");
        expect(axiomG1Template.formula._tag).toBe("Universal");
      }
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(groupLeftAxioms[0], axiomG1Template);
      expectMatchOk(result);
    });

    it("異なる結合でマッチしない", () => {
      // x * (y * z) = (x * y) * z — 左右逆
      const wrong = universal(
        x,
        universal(
          y,
          universal(
            z,
            equality(
              binaryOperation("*", x, binaryOperation("*", y, z)),
              binaryOperation("*", binaryOperation("*", x, y), z),
            ),
          ),
        ),
      );
      const result = matchTheoryAxiom(groupLeftAxioms[0], wrong);
      expectMatchErr(result);
    });
  });

  describe("G2L: ∀x. e * x = x", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomG2LTemplate._tag).toBe("Universal");
      if (axiomG2LTemplate._tag === "Universal") {
        expect(axiomG2LTemplate.formula._tag).toBe("Equality");
      }
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(groupLeftAxioms[1], axiomG2LTemplate);
      expectMatchOk(result);
    });

    it("右単位元とマッチしない", () => {
      // x * e = x
      const wrong = universal(x, equality(binaryOperation("*", x, e), x));
      const result = matchTheoryAxiom(groupLeftAxioms[1], wrong);
      expectMatchErr(result);
    });
  });

  describe("G2R: ∀x. x * e = x", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomG2RTemplate._tag).toBe("Universal");
    });

    it("正しいインスタンスとexactマッチする", () => {
      const g2r = groupFullAxioms.find((a) => a.id === "G2R");
      expect(g2r).toBeDefined();
      const result = matchTheoryAxiom(g2r!, axiomG2RTemplate);
      expectMatchOk(result);
    });
  });

  describe("G3L: ∀x. i(x) * x = e", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomG3LTemplate._tag).toBe("Universal");
      if (axiomG3LTemplate._tag === "Universal") {
        expect(axiomG3LTemplate.formula._tag).toBe("Equality");
      }
    });

    it("正しいインスタンスとexactマッチする", () => {
      const result = matchTheoryAxiom(groupLeftAxioms[2], axiomG3LTemplate);
      expectMatchOk(result);
    });

    it("右逆元とマッチしない", () => {
      // x * i(x) = e
      const wrong = universal(x, equality(binaryOperation("*", x, invX), e));
      const result = matchTheoryAxiom(groupLeftAxioms[2], wrong);
      expectMatchErr(result);
    });
  });

  describe("G3R: ∀x. x * i(x) = e", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomG3RTemplate._tag).toBe("Universal");
    });

    it("正しいインスタンスとexactマッチする", () => {
      const g3r = groupFullAxioms.find((a) => a.id === "G3R");
      expect(g3r).toBeDefined();
      const result = matchTheoryAxiom(g3r!, axiomG3RTemplate);
      expectMatchOk(result);
    });
  });

  describe("G4: ∀x.∀y. x * y = y * x (可換律)", () => {
    it("テンプレートが正しい構造を持つ", () => {
      expect(axiomG4CommTemplate._tag).toBe("Universal");
      if (axiomG4CommTemplate._tag === "Universal") {
        expect(axiomG4CommTemplate.formula._tag).toBe("Universal");
      }
    });

    it("正しいインスタンスとexactマッチする", () => {
      const g4 = abelianGroupAxioms.find((a) => a.id === "G4");
      expect(g4).toBeDefined();
      const result = matchTheoryAxiom(g4!, axiomG4CommTemplate);
      expectMatchOk(result);
    });

    it("異なる式はマッチしない", () => {
      // x * y = x * y (恒等式)
      const wrong = universal(
        x,
        universal(
          y,
          equality(binaryOperation("*", x, y), binaryOperation("*", x, y)),
        ),
      );
      const g4 = abelianGroupAxioms.find((a) => a.id === "G4");
      expect(g4).toBeDefined();
      const result = matchTheoryAxiom(g4!, wrong);
      expectMatchErr(result);
    });
  });
});

describe("群論の公理配列", () => {
  it("groupLeftAxiomsは3公理を持つ", () => {
    expect(groupLeftAxioms).toHaveLength(3);
    expect(groupLeftAxioms.map((a) => a.id)).toEqual(["G1", "G2L", "G3L"]);
  });

  it("groupFullAxiomsは5公理を持つ", () => {
    expect(groupFullAxioms).toHaveLength(5);
    expect(groupFullAxioms.map((a) => a.id)).toEqual([
      "G1",
      "G2L",
      "G3L",
      "G2R",
      "G3R",
    ]);
  });

  it("abelianGroupAxiomsは6公理を持つ", () => {
    expect(abelianGroupAxioms).toHaveLength(6);
    expect(abelianGroupAxioms.map((a) => a.id)).toEqual([
      "G1",
      "G2L",
      "G3L",
      "G2R",
      "G3R",
      "G4",
    ]);
  });

  it("全公理がexactマッチモード", () => {
    for (const axiom of abelianGroupAxioms) {
      expect(axiom.matchMode).toBe("exact");
    }
  });

  it("全公理にdslTextが設定されている", () => {
    for (const axiom of abelianGroupAxioms) {
      expect(axiom.dslText.length).toBeGreaterThan(0);
    }
  });
});

describe("群論LogicSystem", () => {
  it("groupTheoryLeftSystemは左公理系", () => {
    expect(groupTheoryLeftSystem.name).toBe("Group Theory (Left Axioms)");
    expect(groupTheoryLeftSystem.predicateLogic).toBe(true);
    expect(groupTheoryLeftSystem.equalityLogic).toBe(true);
    expect(groupTheoryLeftSystem.generalization).toBe(true);
    expect(groupTheoryLeftSystem.theoryAxioms).toHaveLength(3);
  });

  it("groupTheoryFullSystemは両側公理系", () => {
    expect(groupTheoryFullSystem.name).toBe("Group Theory (Full Axioms)");
    expect(groupTheoryFullSystem.theoryAxioms).toHaveLength(5);
  });

  it("abelianGroupSystemはアーベル群", () => {
    expect(abelianGroupSystem.name).toBe("Abelian Group");
    expect(abelianGroupSystem.theoryAxioms).toHaveLength(6);
  });

  it("全体系がLukasiewicz命題論理基盤", () => {
    for (const system of [
      groupTheoryLeftSystem,
      groupTheoryFullSystem,
      abelianGroupSystem,
    ]) {
      expect(system.propositionalAxioms.has("A1")).toBe(true);
      expect(system.propositionalAxioms.has("A2")).toBe(true);
      expect(system.propositionalAxioms.has("A3")).toBe(true);
    }
  });
});

describe("群論公理のidentifyAxiom", () => {
  it("G1をgroupTheoryLeftSystemで識別できる", () => {
    const result = identifyAxiom(axiomG1Template, groupTheoryLeftSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("G1");
    }
  });

  it("G2LをgroupTheoryLeftSystemで識別できる", () => {
    const result = identifyAxiom(axiomG2LTemplate, groupTheoryLeftSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("G2L");
    }
  });

  it("G3LをgroupTheoryLeftSystemで識別できる", () => {
    const result = identifyAxiom(axiomG3LTemplate, groupTheoryLeftSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("G3L");
    }
  });

  it("G2RはgroupTheoryLeftSystemでは識別不可", () => {
    const result = identifyAxiom(axiomG2RTemplate, groupTheoryLeftSystem);
    expect(result._tag).toBe("Error");
  });

  it("G2RはgroupTheoryFullSystemで識別できる", () => {
    const result = identifyAxiom(axiomG2RTemplate, groupTheoryFullSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("G2R");
    }
  });

  it("G4はabelianGroupSystemで識別できる", () => {
    const result = identifyAxiom(axiomG4CommTemplate, abelianGroupSystem);
    expect(result._tag).toBe("TheoryAxiom");
    if (result._tag === "TheoryAxiom") {
      expect(result.theoryAxiomId).toBe("G4");
    }
  });

  it("G4はgroupTheoryFullSystemでは識別不可", () => {
    const result = identifyAxiom(axiomG4CommTemplate, groupTheoryFullSystem);
    expect(result._tag).toBe("Error");
  });
});
