import { describe, it, expect } from "vitest";
import {
  axiomNode,
  modusPonensNode,
  generalizationNode,
  getConclusion,
  countNodes,
  proofDepth,
  collectAxiomNodes,
  validateProof,
  toVisualizationData,
  type ProofNode,
} from "./proofTree";
import {
  metaVariable,
  implication,
  negation,
  conjunction,
  universal,
  type Formula,
} from "./formula";
import { termVariable } from "./term";
import {
  lukasiewiczSystem,
  mendelsonSystem,
  predicateLogicSystem,
  axiomA1Template,
  axiomA2Template,
  axiomM3Template,
  applySubstitution,
} from "./inferenceRule";
import { buildFormulaSubstitutionMap } from "./substitution";

// ── ヘルパー ──────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");

/**
 * φ→φ の証明を構築する。
 *
 * 5ステップの証明:
 * 1. A2 インスタンス: (φ→((φ→φ)→φ)) → ((φ→(φ→φ)) → (φ→φ))
 * 2. A1 インスタンス(a): φ→((φ→φ)→φ)
 * 3. MP₁: (φ→(φ→φ)) → (φ→φ)
 * 4. A1 インスタンス(b): φ→(φ→φ)
 * 5. MP₂: φ→φ
 */
const buildPhiImpliesPhiProof = (target: Formula): ProofNode => {
  // メタ変数代入 for A2: φ:=target, ψ:=target→target, χ:=target
  const a2Sub = buildFormulaSubstitutionMap([
    [phi, target],
    [psi, implication(target, target)],
    [chi, target],
  ]);
  const a2Instance = applySubstitution(axiomA2Template, a2Sub, new Map());

  // A1 instance (a): target → ((target→target) → target)
  const a1aSub = buildFormulaSubstitutionMap([
    [phi, target],
    [psi, implication(target, target)],
  ]);
  const a1aInstance = applySubstitution(axiomA1Template, a1aSub, new Map());

  // MP₁: a2Instance + a1aInstance → (target→(target→target)) → (target→target)
  const mp1Conclusion = implication(
    implication(target, implication(target, target)),
    implication(target, target),
  );

  // A1 instance (b): target → (target → target)
  const a1bSub = buildFormulaSubstitutionMap([
    [phi, target],
    [psi, target],
  ]);
  const a1bInstance = applySubstitution(axiomA1Template, a1bSub, new Map());

  // MP₂: mp1Conclusion + a1bInstance → target→target
  const finalConclusion = implication(target, target);

  const a2Node = axiomNode(a2Instance);
  const a1aNode = axiomNode(a1aInstance);
  const mp1Node = modusPonensNode(mp1Conclusion, a1aNode, a2Node);
  const a1bNode = axiomNode(a1bInstance);
  const mp2Node = modusPonensNode(finalConclusion, a1bNode, mp1Node);

  return mp2Node;
};

// ── ファクトリ関数のテスト ─────────────────────────────────

describe("proofTree factory functions", () => {
  it("axiomNode creates an axiom node", () => {
    const node = axiomNode(phi);
    expect(node._tag).toBe("AxiomNode");
    expect(node.formula).toBe(phi);
  });

  it("modusPonensNode creates an MP node", () => {
    const ant = axiomNode(phi);
    const cond = axiomNode(implication(phi, psi));
    const node = modusPonensNode(psi, ant, cond);
    expect(node._tag).toBe("ModusPonensNode");
    expect(node.formula).toBe(psi);
    expect(node.antecedent).toBe(ant);
    expect(node.conditional).toBe(cond);
  });

  it("generalizationNode creates a Gen node", () => {
    const x = termVariable("x");
    const premise = axiomNode(phi);
    const node = generalizationNode(universal(x, phi), x, premise);
    expect(node._tag).toBe("GeneralizationNode");
    expect(node.variable).toBe(x);
    expect(node.premise).toBe(premise);
  });
});

// ── ユーティリティのテスト ────────────────────────────────

describe("getConclusion", () => {
  it("returns the formula of an axiom node", () => {
    const node = axiomNode(phi);
    expect(getConclusion(node)).toBe(phi);
  });

  it("returns the formula of an MP node", () => {
    const node = modusPonensNode(
      psi,
      axiomNode(phi),
      axiomNode(implication(phi, psi)),
    );
    expect(getConclusion(node)).toBe(psi);
  });
});

describe("countNodes", () => {
  it("returns 1 for a single axiom node", () => {
    expect(countNodes(axiomNode(phi))).toBe(1);
  });

  it("returns 3 for an MP node with two axiom children", () => {
    const node = modusPonensNode(
      psi,
      axiomNode(phi),
      axiomNode(implication(phi, psi)),
    );
    expect(countNodes(node)).toBe(3);
  });

  it("returns 5 for φ→φ proof", () => {
    const proof = buildPhiImpliesPhiProof(phi);
    expect(countNodes(proof)).toBe(5);
  });

  it("returns 2 for a generalization node", () => {
    const x = termVariable("x");
    const node = generalizationNode(universal(x, phi), x, axiomNode(phi));
    expect(countNodes(node)).toBe(2);
  });
});

describe("proofDepth", () => {
  it("returns 0 for a single axiom node", () => {
    expect(proofDepth(axiomNode(phi))).toBe(0);
  });

  it("returns 1 for an MP node with two axiom children", () => {
    const node = modusPonensNode(
      psi,
      axiomNode(phi),
      axiomNode(implication(phi, psi)),
    );
    expect(proofDepth(node)).toBe(1);
  });

  it("returns 2 for φ→φ proof", () => {
    const proof = buildPhiImpliesPhiProof(phi);
    expect(proofDepth(proof)).toBe(2);
  });

  it("returns 1 for a generalization node", () => {
    const x = termVariable("x");
    const node = generalizationNode(universal(x, phi), x, axiomNode(phi));
    expect(proofDepth(node)).toBe(1);
  });
});

describe("collectAxiomNodes", () => {
  it("returns the single axiom node", () => {
    const node = axiomNode(phi);
    const axioms = collectAxiomNodes(node);
    expect(axioms).toHaveLength(1);
    expect(axioms[0]).toBe(node);
  });

  it("returns all axiom nodes from MP tree", () => {
    const a1 = axiomNode(phi);
    const a2 = axiomNode(implication(phi, psi));
    const mp = modusPonensNode(psi, a1, a2);
    const axioms = collectAxiomNodes(mp);
    expect(axioms).toHaveLength(2);
    expect(axioms).toContain(a1);
    expect(axioms).toContain(a2);
  });

  it("returns 3 axiom nodes from φ→φ proof", () => {
    const proof = buildPhiImpliesPhiProof(phi);
    const axioms = collectAxiomNodes(proof);
    expect(axioms).toHaveLength(3);
  });

  it("returns axiom nodes through generalization", () => {
    const x = termVariable("x");
    const a = axiomNode(phi);
    const gen = generalizationNode(universal(x, phi), x, a);
    const axioms = collectAxiomNodes(gen);
    expect(axioms).toHaveLength(1);
    expect(axioms[0]).toBe(a);
  });
});

// ── validateProof のテスト ────────────────────────────────

describe("validateProof", () => {
  describe("AxiomNode validation", () => {
    it("validates a valid A1 instance", () => {
      // φ → (ψ → φ) with φ:=φ, ψ:=ψ
      const a1Instance = implication(phi, implication(psi, phi));
      const proof = axiomNode(a1Instance);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Valid");
    });

    it("validates a valid A2 instance", () => {
      // (φ→(ψ→χ))→((φ→ψ)→(φ→χ))
      const a2Instance = implication(
        implication(phi, implication(psi, chi)),
        implication(implication(phi, psi), implication(phi, chi)),
      );
      const proof = axiomNode(a2Instance);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Valid");
    });

    it("validates a valid A3 instance", () => {
      // (¬φ → ¬ψ) → (ψ → φ)
      const a3Instance = implication(
        implication(negation(phi), negation(psi)),
        implication(psi, phi),
      );
      const proof = axiomNode(a3Instance);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Valid");
    });

    it("validates a valid M3 instance in mendelson system", () => {
      // M3: (¬φ → ¬ψ) → ((¬φ → ψ) → φ)
      const m3Instance = implication(
        implication(negation(phi), negation(psi)),
        implication(implication(negation(phi), psi), phi),
      );
      const proof = axiomNode(m3Instance);
      const result = validateProof(proof, mendelsonSystem);
      expect(result._tag).toBe("Valid");
    });

    it("rejects M3 in lukasiewicz system", () => {
      const proof = axiomNode(axiomM3Template);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
    });

    it("rejects a non-axiom formula", () => {
      const proof = axiomNode(phi);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]._tag).toBe("InvalidAxiom");
        expect(result.errors[0].path).toHaveLength(0);
      }
    });

    it("rejects a conjunction (not an axiom)", () => {
      const proof = axiomNode(conjunction(phi, psi));
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
    });
  });

  describe("ModusPonensNode validation", () => {
    it("validates a valid MP application", () => {
      const proof = buildPhiImpliesPhiProof(phi);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Valid");
    });

    it("rejects MP with mismatched antecedent", () => {
      // antecedent is ψ but conditional is φ→χ (φ≠ψ)
      const a1ForPhi = implication(phi, implication(chi, phi));
      const a1ForPsi = implication(psi, implication(chi, psi));
      const node = modusPonensNode(
        implication(chi, phi), // wrong conclusion
        axiomNode(a1ForPsi),
        axiomNode(a1ForPhi), // not an implication with a1ForPsi as left
      );
      const result = validateProof(node, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        const mpError = result.errors.find(
          (e) => e._tag === "ModusPonensFailure",
        );
        expect(mpError).toBeDefined();
      }
    });

    it("rejects MP when conditional is not an implication", () => {
      const a1 = implication(phi, implication(psi, phi));
      const node = modusPonensNode(
        psi,
        axiomNode(a1),
        axiomNode(a1), // a1 is an implication, but not with a1 as left side
      );
      const result = validateProof(node, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
    });

    it("rejects MP with wrong conclusion", () => {
      // Correct MP: φ→(ψ→φ) and (φ→(ψ→φ))→((φ→ψ)→(φ→φ)) should give (φ→ψ)→(φ→φ)
      // But we claim a different conclusion
      const a1Instance = implication(phi, implication(psi, phi));
      const a2Instance = implication(
        implication(phi, implication(psi, phi)),
        implication(implication(phi, psi), implication(phi, phi)),
      );
      // Wrong conclusion: φ instead of (φ→ψ)→(φ→φ)
      const node = modusPonensNode(
        phi,
        axiomNode(a1Instance),
        axiomNode(a2Instance),
      );
      const result = validateProof(node, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        const mismatch = result.errors.find(
          (e) => e._tag === "ConclusionMismatch",
        );
        expect(mismatch).toBeDefined();
      }
    });

    it("reports errors at children too", () => {
      // invalid axiom as a child of a valid MP
      const invalidAxiom = axiomNode(phi);
      const validA1 = axiomNode(implication(phi, implication(psi, phi)));
      const node = modusPonensNode(
        implication(psi, phi),
        invalidAxiom,
        validA1,
      );
      const result = validateProof(node, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        const childError = result.errors.find(
          (e) => e._tag === "InvalidAxiom" && e.path.length > 0,
        );
        expect(childError).toBeDefined();
        if (childError !== undefined && childError._tag === "InvalidAxiom") {
          expect(childError.path[0]._tag).toBe("Antecedent");
        }
      }
    });
  });

  describe("GeneralizationNode validation", () => {
    it("validates Gen in predicate logic system", () => {
      const x = termVariable("x");
      const a1Instance = implication(phi, implication(psi, phi));
      const premise = axiomNode(a1Instance);
      const conclusion = universal(x, a1Instance);
      const node = generalizationNode(conclusion, x, premise);
      const result = validateProof(node, predicateLogicSystem);
      expect(result._tag).toBe("Valid");
    });

    it("rejects Gen in Łukasiewicz system (no generalization)", () => {
      const x = termVariable("x");
      const a1Instance = implication(phi, implication(psi, phi));
      const conclusion = universal(x, a1Instance);
      const node = generalizationNode(conclusion, x, axiomNode(a1Instance));
      const result = validateProof(node, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        const genError = result.errors.find(
          (e) => e._tag === "GeneralizationFailure",
        );
        expect(genError).toBeDefined();
      }
    });

    it("rejects Gen with wrong conclusion", () => {
      const x = termVariable("x");
      const y = termVariable("y");
      const a1Instance = implication(phi, implication(psi, phi));
      // wrong: claim ∀y.a1Instance but Gen with x
      const wrongConclusion = universal(y, a1Instance);
      const node = generalizationNode(
        wrongConclusion,
        x,
        axiomNode(a1Instance),
      );
      const result = validateProof(node, predicateLogicSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        const mismatch = result.errors.find(
          (e) => e._tag === "ConclusionMismatch",
        );
        expect(mismatch).toBeDefined();
      }
    });

    it("reports child errors along with Gen errors", () => {
      const x = termVariable("x");
      // invalid axiom as premise
      const invalidPremise = axiomNode(phi);
      const conclusion = universal(x, phi);
      const node = generalizationNode(conclusion, x, invalidPremise);
      const result = validateProof(node, predicateLogicSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        // Should have at least the child's InvalidAxiom error
        const childError = result.errors.find(
          (e) => e._tag === "InvalidAxiom" && e.path.length > 0,
        );
        expect(childError).toBeDefined();
        if (childError !== undefined && childError._tag === "InvalidAxiom") {
          expect(childError.path[0]._tag).toBe("Premise");
        }
      }
    });
  });

  describe("φ→φ proof validation (integration test)", () => {
    it("validates the complete φ→φ proof", () => {
      const proof = buildPhiImpliesPhiProof(phi);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Valid");
    });

    it("validates φ→φ proof in mendelson system (A1, A2 shared)", () => {
      const proof = buildPhiImpliesPhiProof(phi);
      const result = validateProof(proof, mendelsonSystem);
      expect(result._tag).toBe("Valid");
    });

    it("validates φ→φ with concrete formula (¬ψ → ¬ψ)", () => {
      const negPsi = negation(psi);
      const proof = buildPhiImpliesPhiProof(negPsi);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Valid");
    });

    it("validates φ→φ with complex formula", () => {
      const complex = implication(phi, implication(psi, chi));
      const proof = buildPhiImpliesPhiProof(complex);
      const result = validateProof(proof, lukasiewiczSystem);
      expect(result._tag).toBe("Valid");
    });

    it("validates φ→φ has correct conclusion", () => {
      const proof = buildPhiImpliesPhiProof(phi);
      expect(getConclusion(proof)).toEqual(implication(phi, phi));
    });

    it("validates φ→φ has 5 nodes", () => {
      const proof = buildPhiImpliesPhiProof(phi);
      expect(countNodes(proof)).toBe(5);
    });

    it("validates φ→φ has 3 axiom nodes", () => {
      const proof = buildPhiImpliesPhiProof(phi);
      expect(collectAxiomNodes(proof)).toHaveLength(3);
    });

    it("validates φ→φ has depth 2", () => {
      const proof = buildPhiImpliesPhiProof(phi);
      expect(proofDepth(proof)).toBe(2);
    });
  });

  describe("error path tracking", () => {
    it("tracks path for deeply nested errors", () => {
      // Build a 3-level deep tree with an invalid axiom at the bottom
      const invalidAxiom = axiomNode(phi); // not a valid axiom
      const validA1 = axiomNode(implication(phi, implication(psi, phi)));
      const mp1 = modusPonensNode(implication(psi, phi), invalidAxiom, validA1);
      const validA1b = axiomNode(
        implication(
          implication(psi, phi),
          implication(chi, implication(psi, phi)),
        ),
      );
      const mp2 = modusPonensNode(
        implication(chi, implication(psi, phi)),
        mp1,
        validA1b,
      );
      const result = validateProof(mp2, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        const deepError = result.errors.find(
          (e) => e._tag === "InvalidAxiom" && e.path.length === 2,
        );
        expect(deepError).toBeDefined();
        if (deepError !== undefined) {
          expect(deepError.path[0]._tag).toBe("Antecedent");
          expect(deepError.path[1]._tag).toBe("Antecedent");
        }
      }
    });

    it("tracks Conditional path segment", () => {
      const validA1 = axiomNode(implication(phi, implication(psi, phi)));
      const invalidConditional = axiomNode(phi); // not valid
      const node = modusPonensNode(psi, validA1, invalidConditional);
      const result = validateProof(node, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        const condError = result.errors.find(
          (e) =>
            e._tag === "InvalidAxiom" &&
            e.path.length === 1 &&
            e.path[0]._tag === "Conditional",
        );
        expect(condError).toBeDefined();
      }
    });
  });

  describe("multiple errors", () => {
    it("reports multiple errors from different branches", () => {
      const invalidAnt = axiomNode(phi);
      const invalidCond = axiomNode(psi);
      const node = modusPonensNode(chi, invalidAnt, invalidCond);
      const result = validateProof(node, lukasiewiczSystem);
      expect(result._tag).toBe("Invalid");
      if (result._tag === "Invalid") {
        // At least 2 errors: invalid axiom on antecedent side + invalid axiom on conditional side
        // Plus MP failure
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});

// ── toVisualizationData のテスト ───────────────────────────

describe("toVisualizationData", () => {
  it("converts a single axiom node", () => {
    const a1Instance = implication(phi, implication(psi, phi));
    const proof = axiomNode(a1Instance);
    const data = toVisualizationData(proof, lukasiewiczSystem);
    expect(data).toHaveLength(1);
    expect(data[0].label).toBe("Axiom A1");
    expect(data[0].rule).toBe("A1");
    expect(data[0].axiomId).toBe("A1");
    expect(data[0].children).toHaveLength(0);
  });

  it("converts φ→φ proof", () => {
    const proof = buildPhiImpliesPhiProof(phi);
    const data = toVisualizationData(proof, lukasiewiczSystem);
    expect(data).toHaveLength(5);

    // Root should be the last item (MP node)
    const mpNodes = data.filter((n) => n.rule === "MP");
    expect(mpNodes).toHaveLength(2);

    const axiomNodes = data.filter((n) => n.rule !== "MP");
    expect(axiomNodes).toHaveLength(3);
  });

  it("assigns unique IDs to all nodes", () => {
    const proof = buildPhiImpliesPhiProof(phi);
    const data = toVisualizationData(proof, lukasiewiczSystem);
    const ids = data.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("correctly references children by ID", () => {
    const proof = buildPhiImpliesPhiProof(phi);
    const data = toVisualizationData(proof, lukasiewiczSystem);
    const idSet = new Set(data.map((n) => n.id));

    for (const node of data) {
      for (const childId of node.children) {
        expect(idSet.has(childId)).toBe(true);
      }
    }
  });

  it("converts a Gen node", () => {
    const x = termVariable("x");
    const a1Instance = implication(phi, implication(psi, phi));
    const conclusion = universal(x, a1Instance);
    const proof = generalizationNode(conclusion, x, axiomNode(a1Instance));
    const data = toVisualizationData(proof, predicateLogicSystem);
    expect(data).toHaveLength(2);

    const genNode = data.find((n) => n.rule === "Gen");
    expect(genNode).toBeDefined();
    expect(genNode?.children).toHaveLength(1);
    expect(genNode?.label).toBe("Gen");
  });

  it("marks unknown axiom", () => {
    const proof = axiomNode(phi); // not a valid axiom
    const data = toVisualizationData(proof, lukasiewiczSystem);
    expect(data).toHaveLength(1);
    expect(data[0].axiomId).toBeUndefined();
    expect(data[0].label).toBe("Axiom");
    expect(data[0].rule).toBe("unknown");
  });
});

// ── exhaustive switch テスト ──────────────────────────────

describe("exhaustive switch coverage", () => {
  it("getConclusion handles GeneralizationNode", () => {
    const x = termVariable("x");
    const conclusion = universal(x, phi);
    const node = generalizationNode(conclusion, x, axiomNode(phi));
    expect(getConclusion(node)).toEqual(conclusion);
  });
});
