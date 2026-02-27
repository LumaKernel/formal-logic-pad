import { describe, it, expect } from "vitest";
import {
  MetaVariable,
  Negation,
  Implication,
  Universal,
  Equality,
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
  biconditional,
  universal,
  existential,
  predicate,
  equality,
  formulaSubstitution,
} from "./formula";
import type { Formula } from "./formula";
import {
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./term";

describe("MetaVariable", () => {
  it("creates without subscript", () => {
    const phi = metaVariable("φ");
    expect(phi._tag).toBe("MetaVariable");
    expect(phi.name).toBe("φ");
    expect(phi.subscript).toBeUndefined();
  });

  it("creates with subscript", () => {
    const phi1 = metaVariable("φ", "1");
    expect(phi1._tag).toBe("MetaVariable");
    expect(phi1.name).toBe("φ");
    expect(phi1.subscript).toBe("1");
  });

  it("distinguishes subscripts: φ1 ≠ φ01 ≠ φ001", () => {
    const a = metaVariable("φ", "1");
    const b = metaVariable("φ", "01");
    const c = metaVariable("φ", "001");
    expect(a.subscript).not.toBe(b.subscript);
    expect(b.subscript).not.toBe(c.subscript);
    expect(a.subscript).not.toBe(c.subscript);
  });

  it("creates with new keyword", () => {
    const psi = new MetaVariable({ name: "ψ" });
    expect(psi._tag).toBe("MetaVariable");
    expect(psi.name).toBe("ψ");
  });
});

describe("Negation", () => {
  it("negates a meta variable", () => {
    const phi = metaVariable("φ");
    const notPhi = negation(phi);
    expect(notPhi._tag).toBe("Negation");
    expect(notPhi.formula._tag).toBe("MetaVariable");
  });

  it("supports double negation ¬¬φ", () => {
    const phi = metaVariable("φ");
    const doubleNeg = negation(negation(phi));
    expect(doubleNeg._tag).toBe("Negation");
    expect(doubleNeg.formula._tag).toBe("Negation");
    expect((doubleNeg.formula as Negation).formula._tag).toBe("MetaVariable");
  });
});

describe("Implication", () => {
  it("creates φ→ψ", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const impl = implication(phi, psi);
    expect(impl._tag).toBe("Implication");
    expect(impl.left._tag).toBe("MetaVariable");
    expect(impl.right._tag).toBe("MetaVariable");
    expect((impl.left as MetaVariable).name).toBe("φ");
    expect((impl.right as MetaVariable).name).toBe("ψ");
  });

  it("creates right-associative chain: φ→ψ→χ = φ→(ψ→χ)", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const chi = metaVariable("χ");
    // Right-associative: φ→(ψ→χ)
    const psiToChi = implication(psi, chi);
    const chain = implication(phi, psiToChi);
    expect(chain._tag).toBe("Implication");
    expect(chain.right._tag).toBe("Implication");
  });
});

describe("Conjunction", () => {
  it("creates φ∧ψ", () => {
    const conj = conjunction(metaVariable("φ"), metaVariable("ψ"));
    expect(conj._tag).toBe("Conjunction");
  });
});

describe("Disjunction", () => {
  it("creates φ∨ψ", () => {
    const disj = disjunction(metaVariable("φ"), metaVariable("ψ"));
    expect(disj._tag).toBe("Disjunction");
  });
});

describe("Biconditional", () => {
  it("creates φ↔ψ", () => {
    const bic = biconditional(metaVariable("φ"), metaVariable("ψ"));
    expect(bic._tag).toBe("Biconditional");
    expect(bic.left._tag).toBe("MetaVariable");
    expect(bic.right._tag).toBe("MetaVariable");
  });
});

describe("Universal", () => {
  it("creates ∀x.φ", () => {
    const x = termVariable("x");
    const phi = metaVariable("φ");
    const univ = universal(x, phi);
    expect(univ._tag).toBe("Universal");
    expect(univ.variable._tag).toBe("TermVariable");
    expect(univ.variable.name).toBe("x");
    expect(univ.formula._tag).toBe("MetaVariable");
  });

  it("creates nested ∀x.∀y.P(x,y)", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const pxy = predicate("P", [x, y]);
    const inner = universal(y, pxy);
    const outer = universal(x, inner);
    expect(outer._tag).toBe("Universal");
    expect(outer.formula._tag).toBe("Universal");
  });
});

describe("Existential", () => {
  it("creates ∃x.φ", () => {
    const x = termVariable("x");
    const phi = metaVariable("φ");
    const exist = existential(x, phi);
    expect(exist._tag).toBe("Existential");
    expect(exist.variable.name).toBe("x");
    expect(exist.formula._tag).toBe("MetaVariable");
  });
});

describe("Predicate", () => {
  it("creates nullary predicate P()", () => {
    const p = predicate("P", []);
    expect(p._tag).toBe("Predicate");
    expect(p.name).toBe("P");
    expect(p.args).toEqual([]);
  });

  it("creates unary predicate P(x)", () => {
    const x = termVariable("x");
    const px = predicate("P", [x]);
    expect(px._tag).toBe("Predicate");
    expect(px.args).toHaveLength(1);
  });

  it("creates binary predicate R(x, y)", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const rxy = predicate("R", [x, y]);
    expect(rxy.args).toHaveLength(2);
  });

  it("supports term meta variables as arguments", () => {
    const tau = termMetaVariable("τ");
    const p = predicate("P", [tau]);
    expect(p.args[0]._tag).toBe("TermMetaVariable");
  });
});

describe("Equality", () => {
  it("creates t₁ = t₂", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const eq = equality(x, y);
    expect(eq._tag).toBe("Equality");
    expect(eq.left._tag).toBe("TermVariable");
    expect(eq.right._tag).toBe("TermVariable");
  });

  it("creates f(x) = g(y)", () => {
    const fx = functionApplication("f", [termVariable("x")]);
    const gy = functionApplication("g", [termVariable("y")]);
    const eq = equality(fx, gy);
    expect(eq._tag).toBe("Equality");
    expect(eq.left._tag).toBe("FunctionApplication");
    expect(eq.right._tag).toBe("FunctionApplication");
  });
});

describe("Formula union type", () => {
  it("discriminates all formula types by _tag", () => {
    const formulas: readonly Formula[] = [
      metaVariable("φ"),
      negation(metaVariable("φ")),
      implication(metaVariable("φ"), metaVariable("ψ")),
      conjunction(metaVariable("φ"), metaVariable("ψ")),
      disjunction(metaVariable("φ"), metaVariable("ψ")),
      biconditional(metaVariable("φ"), metaVariable("ψ")),
      universal(termVariable("x"), metaVariable("φ")),
      existential(termVariable("x"), metaVariable("φ")),
      predicate("P", [termVariable("x")]),
      equality(termVariable("x"), termVariable("y")),
      formulaSubstitution(metaVariable("φ"), termVariable("y"), termVariable("x")),
    ];

    const tags = formulas.map((f) => f._tag);
    expect(tags).toEqual([
      "MetaVariable",
      "Negation",
      "Implication",
      "Conjunction",
      "Disjunction",
      "Biconditional",
      "Universal",
      "Existential",
      "Predicate",
      "Equality",
      "FormulaSubstitution",
    ]);
  });

  it("supports exhaustive switch on _tag", () => {
    const classify = (f: Formula): string => {
      switch (f._tag) {
        case "MetaVariable":
          return "meta";
        case "Negation":
          return "neg";
        case "Implication":
          return "impl";
        case "Conjunction":
          return "conj";
        case "Disjunction":
          return "disj";
        case "Biconditional":
          return "bic";
        case "Universal":
          return "univ";
        case "Existential":
          return "exist";
        case "Predicate":
          return "pred";
        case "Equality":
          return "eq";
        case "FormulaSubstitution":
          return "subst";
      }
      f satisfies never;
    };
    expect(classify(metaVariable("φ"))).toBe("meta");
    expect(classify(negation(metaVariable("φ")))).toBe("neg");
    expect(classify(predicate("P", []))).toBe("pred");
    expect(classify(equality(termVariable("x"), termVariable("y")))).toBe("eq");
    expect(classify(formulaSubstitution(metaVariable("φ"), termVariable("y"), termVariable("x")))).toBe("subst");
  });
});

describe("complex formula construction", () => {
  it("builds K axiom: φ→(ψ→φ)", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const k = implication(phi, implication(psi, phi));

    expect(k._tag).toBe("Implication");
    expect(k.left._tag).toBe("MetaVariable");
    expect(k.right._tag).toBe("Implication");
    const inner = k.right as Implication;
    expect(inner.left._tag).toBe("MetaVariable");
    expect((inner.left as MetaVariable).name).toBe("ψ");
    expect(inner.right._tag).toBe("MetaVariable");
    expect((inner.right as MetaVariable).name).toBe("φ");
  });

  it("builds S axiom: (φ→(ψ→χ))→((φ→ψ)→(φ→χ))", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const chi = metaVariable("χ");
    const s = implication(
      implication(phi, implication(psi, chi)),
      implication(implication(phi, psi), implication(phi, chi)),
    );

    expect(s._tag).toBe("Implication");
    expect(s.left._tag).toBe("Implication");
    expect(s.right._tag).toBe("Implication");
  });

  it("builds contraposition axiom: (¬φ→¬ψ)→(ψ→φ)", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const contraposition = implication(
      implication(negation(phi), negation(psi)),
      implication(psi, phi),
    );

    expect(contraposition._tag).toBe("Implication");
    expect(contraposition.left._tag).toBe("Implication");
    const left = contraposition.left as Implication;
    expect(left.left._tag).toBe("Negation");
    expect(left.right._tag).toBe("Negation");
  });

  it("builds ∀ζ.P(ζ) ∧ ∃ξ.Q(ξ)", () => {
    const zeta = termVariable("ζ");
    const xi = termVariable("ξ");
    const pZeta = predicate("P", [zeta]);
    const qXi = predicate("Q", [xi]);
    const formula = conjunction(universal(zeta, pZeta), existential(xi, qXi));

    expect(formula._tag).toBe("Conjunction");
    expect(formula.left._tag).toBe("Universal");
    expect(formula.right._tag).toBe("Existential");
    const univ = formula.left as Universal;
    expect(univ.variable.name).toBe("ζ");
    expect(univ.formula._tag).toBe("Predicate");
  });

  it("builds ∀x. x + 0 = x", () => {
    const x = termVariable("x");
    const zero = constant("0");
    const sum = binaryOperation("+", x, zero);
    const eq = equality(sum, x);
    const formula = universal(x, eq);

    expect(formula._tag).toBe("Universal");
    expect(formula.formula._tag).toBe("Equality");
    const eqNode = formula.formula as Equality;
    expect(eqNode.left._tag).toBe("BinaryOperation");
    expect(eqNode.right._tag).toBe("TermVariable");
  });

  it("builds f(x) + g(y) = h(z) as equality formula", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const z = termVariable("z");
    const fx = functionApplication("f", [x]);
    const gy = functionApplication("g", [y]);
    const hz = functionApplication("h", [z]);
    const sum = binaryOperation("+", fx, gy);
    const eq = equality(sum, hz);

    expect(eq._tag).toBe("Equality");
    expect(eq.left._tag).toBe("BinaryOperation");
    expect(eq.right._tag).toBe("FunctionApplication");
  });

  it("builds deeply nested formula", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    // ¬(φ ∧ ψ) ↔ (¬φ ∨ ¬ψ)  (De Morgan)
    const deMorgan = biconditional(
      negation(conjunction(phi, psi)),
      disjunction(negation(phi), negation(psi)),
    );

    expect(deMorgan._tag).toBe("Biconditional");
    expect(deMorgan.left._tag).toBe("Negation");
    expect((deMorgan.left as Negation).formula._tag).toBe("Conjunction");
    expect(deMorgan.right._tag).toBe("Disjunction");
  });
});
