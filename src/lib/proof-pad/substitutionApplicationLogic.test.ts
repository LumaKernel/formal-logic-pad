import { describe, expect, it } from "vitest";
import { Either } from "effect";
import {
  buildFormulaSubstitutionMap,
  buildTermSubstitutionMap,
  getSubstitutionPremise,
  validateSubstitutionApplication,
  getSubstitutionErrorMessage,
  extractSubstitutionTargets,
  extractSubstitutionTargetsFromText,
  generateSubstitutionEntryTemplate,
  SubstPremiseMissing,
  SubstPremiseParseError,
  SubstNoEntries,
  SubstFormulaParseError,
  SubstTermParseError,
  type SubstitutionEntries,
  type SubstitutionApplicationError,
} from "./substitutionApplicationLogic";
import {
  createEmptyWorkspace,
  addNode,
  addConnection,
  type WorkspaceState,
} from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
} from "../logic-core/inferenceRule";
import {
  metaVariable,
  implication,
  universal,
  predicate,
  equality,
} from "../logic-core/formula";
import { termVariable, termMetaVariable } from "../logic-core/term";

/**
 * テスト用ヘルパー: SubstitutionEdgeをinferenceEdgesに追加する。
 */
function addSubstitutionEdge(
  ws: WorkspaceState,
  conclusionNodeId: string,
  premiseNodeId: string,
  entries: SubstitutionEntries = [],
): WorkspaceState {
  const edge: InferenceEdge = {
    _tag: "substitution",
    conclusionNodeId,
    premiseNodeId,
    entries,
    conclusionText: "",
  };
  return { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };
}

// --- getSubstitutionPremise ---

describe("getSubstitutionPremise", () => {
  it("returns undefined when no connection exists", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 0 });
    expect(getSubstitutionPremise(ws, "node-1")).toBeUndefined();
  });

  it("returns premise node id when connected", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");
    expect(getSubstitutionPremise(ws, "node-2")).toBe("node-1");
  });

  it("ignores connections to other ports", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "other");
    expect(getSubstitutionPremise(ws, "node-2")).toBeUndefined();
  });
});

// --- buildFormulaSubstitutionMap ---

describe("buildFormulaSubstitutionMap", () => {
  it("returns empty map for empty entries", () => {
    const result = buildFormulaSubstitutionMap([]);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(0);
    }
  });

  it("builds map from valid formula entries", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha -> beta",
      },
    ];
    const result = buildFormulaSubstitutionMap(entries);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(1);
      expect(result.map.has("φ")).toBe(true);
    }
  });

  it("builds map with subscripted meta-variables", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        metaVariableSubscript: "1",
        formulaText: "alpha -> beta",
      },
    ];
    const result = buildFormulaSubstitutionMap(entries);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.has("φ_1")).toBe(true);
    }
  });

  it("returns error for invalid formula text", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "-> invalid",
      },
    ];
    const result = buildFormulaSubstitutionMap(entries);
    expect(result._tag).toBe("Error");
    if (result._tag === "Error") {
      expect(result.entryIndex).toBe(0);
      expect(result.formulaText).toBe("-> invalid");
    }
  });

  it("skips term substitution entries", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "TermSubstitution",
        metaVariableName: "τ",
        termText: "0",
      },
    ];
    const result = buildFormulaSubstitutionMap(entries);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(0);
    }
  });

  it("handles multiple formula entries", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha -> beta",
      },
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "ψ",
        formulaText: "gamma",
      },
    ];
    const result = buildFormulaSubstitutionMap(entries);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(2);
    }
  });
});

// --- buildTermSubstitutionMap ---

describe("buildTermSubstitutionMap", () => {
  it("returns empty map for empty entries", () => {
    const result = buildTermSubstitutionMap([]);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(0);
    }
  });

  it("builds map from valid term entries", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "TermSubstitution",
        metaVariableName: "τ",
        termText: "0",
      },
    ];
    const result = buildTermSubstitutionMap(entries);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(1);
    }
  });

  it("returns error for invalid term text", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "TermSubstitution",
        metaVariableName: "τ",
        termText: "-> invalid",
      },
    ];
    const result = buildTermSubstitutionMap(entries);
    expect(result._tag).toBe("Error");
    if (result._tag === "Error") {
      expect(result.entryIndex).toBe(0);
    }
  });

  it("skips formula substitution entries", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha -> beta",
      },
    ];
    const result = buildTermSubstitutionMap(entries);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(0);
    }
  });

  it("builds map with subscripted term meta-variables", () => {
    const entries: SubstitutionEntries = [
      {
        _tag: "TermSubstitution",
        metaVariableName: "τ",
        metaVariableSubscript: "2",
        termText: "x",
      },
    ];
    const result = buildTermSubstitutionMap(entries);
    expect(result._tag).toBe("Ok");
    if (result._tag === "Ok") {
      expect(result.map.size).toBe(1);
    }
  });
});

// --- validateSubstitutionApplication ---

describe("validateSubstitutionApplication", () => {
  it("returns SubstNoEntries when entries list is empty", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    const result = validateSubstitutionApplication(ws, "node-1", []);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SubstNoEntries");
    }
  });

  it("returns SubstPremiseMissing when no premise is connected", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 0 });
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-1", entries);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SubstPremiseMissing");
    }
  });

  it("returns SubstPremiseParseError when premise formula is invalid", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "-> invalid");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SubstPremiseParseError");
    }
  });

  it("returns SubstPremiseParseError when premise formula is empty", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SubstPremiseParseError");
    }
  });

  it("returns SubstFormulaParseError when substitution formula is invalid", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "-> bad",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SubstFormulaParseError");
    }
  });

  it("returns SubstTermParseError when term substitution is invalid", () => {
    let ws = createEmptyWorkspace(predicateLogicSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> phi");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");
    const entries: SubstitutionEntries = [
      {
        _tag: "TermSubstitution",
        metaVariableName: "τ",
        termText: "-> bad",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SubstTermParseError");
    }
  });

  it("successfully applies formula meta-variable substitution to A1", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    // A1: φ → (ψ → φ)
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");

    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha -> beta",
      },
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "ψ",
        formulaText: "gamma",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      // (α → β) → (γ → (α → β))
      expect(result.right.conclusionText).toBe("(α → β) → γ → α → β");
    }
  });

  it("returns same formula when meta-variables not present in premise", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "alpha -> beta");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");

    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "gamma",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.conclusionText).toBe("α → β");
    }
  });

  it("applies single formula meta-variable substitution", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> phi");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");

    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.conclusionText).toBe("α → α");
    }
  });

  it("applies negation substitution", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "~phi -> (phi -> psi)");
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");

    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "ψ",
        formulaText: "beta",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.conclusionText).toBe("¬α → α → β");
    }
  });

  it("handles only formula entries when no term entries present", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 0, y: 0 },
      "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    );
    ws = addNode(ws, "axiom", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    ws = addSubstitutionEdge(ws, "node-2", "node-1");

    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "ψ",
        formulaText: "alpha -> beta",
      },
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "χ",
        formulaText: "beta",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      // (α → ((α → β) → β)) → ((α → α → β) → (α → β))
      expect(result.right.conclusionText).toBe(
        "(α → (α → β) → β) → (α → α → β) → α → β",
      );
    }
  });
});

// --- getSubstitutionErrorMessage ---

describe("getSubstitutionErrorMessage", () => {
  it.each<{
    readonly error: SubstitutionApplicationError;
    readonly expected: string;
  }>([
    {
      error: new SubstPremiseMissing({}),
      expected: "Connect a premise to apply substitution",
    },
    {
      error: new SubstPremiseParseError({ nodeId: "node-1" }),
      expected: "Premise has invalid formula",
    },
    {
      error: new SubstNoEntries({}),
      expected: "Add at least one substitution entry",
    },
    {
      error: new SubstFormulaParseError({ entryIndex: 0, formulaText: "bad" }),
      expected: "Invalid formula in substitution entry 1",
    },
    {
      error: new SubstFormulaParseError({ entryIndex: 2, formulaText: "bad" }),
      expected: "Invalid formula in substitution entry 3",
    },
    {
      error: new SubstTermParseError({ entryIndex: 0, termText: "bad" }),
      expected: "Invalid term in substitution entry 1",
    },
    {
      error: new SubstTermParseError({ entryIndex: 1, termText: "bad" }),
      expected: "Invalid term in substitution entry 2",
    },
  ])(
    "returns correct message for $error._tag (index $error.entryIndex)",
    ({ error, expected }) => {
      expect(getSubstitutionErrorMessage(error)).toBe(expected);
    },
  );
});

// --- extractSubstitutionTargets ---

describe("extractSubstitutionTargets", () => {
  it("extracts formula meta-variables from propositional axiom", () => {
    // φ → (ψ → φ)
    const formula = implication(
      metaVariable("φ"),
      implication(metaVariable("ψ"), metaVariable("φ")),
    );
    const targets = extractSubstitutionTargets(formula);
    expect(targets.formulaMetaVariables).toHaveLength(2);
    expect(targets.formulaMetaVariables[0]?.name).toBe("φ");
    expect(targets.formulaMetaVariables[1]?.name).toBe("ψ");
    expect(targets.termMetaVariables).toHaveLength(0);
  });

  it("extracts both formula and term meta-variables from predicate formula", () => {
    // φ → P(τ)
    const formula = implication(
      metaVariable("φ"),
      predicate("P", [termMetaVariable("τ")]),
    );
    const targets = extractSubstitutionTargets(formula);
    expect(targets.formulaMetaVariables).toHaveLength(1);
    expect(targets.formulaMetaVariables[0]?.name).toBe("φ");
    expect(targets.termMetaVariables).toHaveLength(1);
    expect(targets.termMetaVariables[0]?.name).toBe("τ");
  });

  it("deduplicates across formula", () => {
    // φ → (φ → ψ)
    const formula = implication(
      metaVariable("φ"),
      implication(metaVariable("φ"), metaVariable("ψ")),
    );
    const targets = extractSubstitutionTargets(formula);
    expect(targets.formulaMetaVariables).toHaveLength(2);
  });

  it("returns empty for formula with no meta-variables", () => {
    // P(x) → P(x)
    const formula = implication(
      predicate("P", [termVariable("x")]),
      predicate("P", [termVariable("x")]),
    );
    const targets = extractSubstitutionTargets(formula);
    expect(targets.formulaMetaVariables).toHaveLength(0);
    expect(targets.termMetaVariables).toHaveLength(0);
  });

  it("extracts from quantified formula", () => {
    // ∀x. φ → P(τ)
    const formula = universal(
      termVariable("x"),
      implication(metaVariable("φ"), predicate("P", [termMetaVariable("τ")])),
    );
    const targets = extractSubstitutionTargets(formula);
    expect(targets.formulaMetaVariables).toHaveLength(1);
    expect(targets.termMetaVariables).toHaveLength(1);
  });

  it("handles subscripted meta-variables", () => {
    // φ₁ → φ₂
    const formula = implication(metaVariable("φ", "1"), metaVariable("φ", "2"));
    const targets = extractSubstitutionTargets(formula);
    expect(targets.formulaMetaVariables).toHaveLength(2);
    expect(targets.formulaMetaVariables[0]?.subscript).toBe("1");
    expect(targets.formulaMetaVariables[1]?.subscript).toBe("2");
  });

  it("extracts term meta-variables from equality", () => {
    // τ = σ
    const formula = equality(termMetaVariable("τ"), termMetaVariable("σ"));
    const targets = extractSubstitutionTargets(formula);
    expect(targets.formulaMetaVariables).toHaveLength(0);
    expect(targets.termMetaVariables).toHaveLength(2);
    expect(targets.termMetaVariables[0]?.name).toBe("τ");
    expect(targets.termMetaVariables[1]?.name).toBe("σ");
  });
});

// --- extractSubstitutionTargetsFromText ---

describe("extractSubstitutionTargetsFromText", () => {
  it("extracts from valid formula text", () => {
    const targets = extractSubstitutionTargetsFromText("phi -> (psi -> phi)");
    expect(targets).not.toBeNull();
    expect(targets?.formulaMetaVariables).toHaveLength(2);
    expect(targets?.formulaMetaVariables[0]?.name).toBe("φ");
    expect(targets?.formulaMetaVariables[1]?.name).toBe("ψ");
    expect(targets?.termMetaVariables).toHaveLength(0);
  });

  it("returns null for invalid formula text", () => {
    const targets = extractSubstitutionTargetsFromText("-> invalid");
    expect(targets).toBeNull();
  });

  it("returns null for empty text", () => {
    const targets = extractSubstitutionTargetsFromText("");
    expect(targets).toBeNull();
  });

  it("extracts term meta-variables from predicate formula text", () => {
    const targets = extractSubstitutionTargetsFromText("all x. P(x) -> P(tau)");
    expect(targets).not.toBeNull();
    expect(targets?.formulaMetaVariables).toHaveLength(0);
    expect(targets?.termMetaVariables).toHaveLength(1);
    expect(targets?.termMetaVariables[0]?.name).toBe("τ");
  });
});

// --- generateSubstitutionEntryTemplate ---

describe("generateSubstitutionEntryTemplate", () => {
  it("generates empty template for no meta-variables", () => {
    const template = generateSubstitutionEntryTemplate({
      formulaMetaVariables: [],
      termMetaVariables: [],
    });
    expect(template).toHaveLength(0);
  });

  it("generates formula entries for formula meta-variables", () => {
    const targets = extractSubstitutionTargets(
      implication(metaVariable("φ"), metaVariable("ψ")),
    );
    const template = generateSubstitutionEntryTemplate(targets);
    expect(template).toHaveLength(2);
    expect(template[0]?._tag).toBe("FormulaSubstitution");
    if (template[0]?._tag === "FormulaSubstitution") {
      expect(template[0].metaVariableName).toBe("φ");
      expect(template[0].formulaText).toBe("");
    }
    expect(template[1]?._tag).toBe("FormulaSubstitution");
    if (template[1]?._tag === "FormulaSubstitution") {
      expect(template[1].metaVariableName).toBe("ψ");
      expect(template[1].formulaText).toBe("");
    }
  });

  it("generates term entries for term meta-variables", () => {
    const targets = extractSubstitutionTargets(
      equality(termMetaVariable("τ"), termMetaVariable("σ")),
    );
    const template = generateSubstitutionEntryTemplate(targets);
    expect(template).toHaveLength(2);
    expect(template[0]?._tag).toBe("TermSubstitution");
    if (template[0]?._tag === "TermSubstitution") {
      expect(template[0].metaVariableName).toBe("τ");
      expect(template[0].termText).toBe("");
    }
    expect(template[1]?._tag).toBe("TermSubstitution");
    if (template[1]?._tag === "TermSubstitution") {
      expect(template[1].metaVariableName).toBe("σ");
      expect(template[1].termText).toBe("");
    }
  });

  it("generates mixed entries (formula first, then term)", () => {
    // φ → P(τ)
    const targets = extractSubstitutionTargets(
      implication(metaVariable("φ"), predicate("P", [termMetaVariable("τ")])),
    );
    const template = generateSubstitutionEntryTemplate(targets);
    expect(template).toHaveLength(2);
    expect(template[0]?._tag).toBe("FormulaSubstitution");
    expect(template[1]?._tag).toBe("TermSubstitution");
  });

  it("preserves subscript in generated entries", () => {
    const targets = extractSubstitutionTargets(
      implication(metaVariable("φ", "1"), metaVariable("φ", "2")),
    );
    const template = generateSubstitutionEntryTemplate(targets);
    expect(template).toHaveLength(2);
    if (template[0]?._tag === "FormulaSubstitution") {
      expect(template[0].metaVariableSubscript).toBe("1");
    }
    if (template[1]?._tag === "FormulaSubstitution") {
      expect(template[1].metaVariableSubscript).toBe("2");
    }
  });

  it("round-trip: template from A1 axiom matches expected entries", () => {
    // A1: φ → (ψ → φ)
    const targets = extractSubstitutionTargetsFromText("phi -> (psi -> phi)");
    expect(targets).not.toBeNull();
    const template = generateSubstitutionEntryTemplate(targets!);
    expect(template).toHaveLength(2);
    expect(template[0]?._tag).toBe("FormulaSubstitution");
    if (template[0]?._tag === "FormulaSubstitution") {
      expect(template[0].metaVariableName).toBe("φ");
      expect(template[0].formulaText).toBe("");
    }
    expect(template[1]?._tag).toBe("FormulaSubstitution");
    if (template[1]?._tag === "FormulaSubstitution") {
      expect(template[1].metaVariableName).toBe("ψ");
      expect(template[1].formulaText).toBe("");
    }
  });
});
