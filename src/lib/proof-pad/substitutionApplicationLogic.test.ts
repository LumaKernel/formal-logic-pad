import { describe, expect, it } from "vitest";
import {
  buildFormulaSubstitutionMap,
  buildTermSubstitutionMap,
  getSubstitutionPremise,
  validateSubstitutionApplication,
  getSubstitutionErrorMessage,
  type SubstitutionEntries,
  type SubstitutionApplicationError,
} from "./substitutionApplicationLogic";
import { createEmptyWorkspace, addNode, addConnection } from "./workspaceState";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
} from "../logic-core/inferenceRule";

// --- getSubstitutionPremise ---

describe("getSubstitutionPremise", () => {
  it("returns undefined when no connection exists", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 0 });
    expect(getSubstitutionPremise(ws, "node-1")).toBeUndefined();
  });

  it("returns premise node id when connected", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    expect(getSubstitutionPremise(ws, "node-2")).toBe("node-1");
  });

  it("ignores connections to other ports", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
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
  it("returns NoSubstitutionEntries when entries list is empty", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    const result = validateSubstitutionApplication(ws, "node-1", []);
    expect(result._tag).toBe("NoSubstitutionEntries");
  });

  it("returns PremiseMissing when no premise is connected", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 0 });
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-1", entries);
    expect(result._tag).toBe("PremiseMissing");
  });

  it("returns PremiseParseError when premise formula is invalid", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "-> invalid");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(result._tag).toBe("PremiseParseError");
  });

  it("returns PremiseParseError when premise formula is empty", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(result._tag).toBe("PremiseParseError");
  });

  it("returns FormulaParseError when substitution formula is invalid", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "-> bad",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(result._tag).toBe("FormulaParseError");
  });

  it("returns TermParseError when term substitution is invalid", () => {
    let ws = createEmptyWorkspace(predicateLogicSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> phi");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");
    const entries: SubstitutionEntries = [
      {
        _tag: "TermSubstitution",
        metaVariableName: "τ",
        termText: "-> bad",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(result._tag).toBe("TermParseError");
  });

  it("successfully applies formula meta-variable substitution to A1", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    // A1: φ → (ψ → φ)
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");

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
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      // (α → β) → (γ → (α → β))
      expect(result.conclusionText).toBe("(α → β) → γ → α → β");
    }
  });

  it("returns same formula when meta-variables not present in premise", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "alpha -> beta");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");

    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "gamma",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      expect(result.conclusionText).toBe("α → β");
    }
  });

  it("applies single formula meta-variable substitution", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> phi");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");

    const entries: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];
    const result = validateSubstitutionApplication(ws, "node-2", entries);
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      expect(result.conclusionText).toBe("α → α");
    }
  });

  it("applies negation substitution", () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "~phi -> (phi -> psi)");
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");

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
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      expect(result.conclusionText).toBe("¬α → α → β");
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
    ws = addNode(ws, "substitution", "Subst", { x: 0, y: 100 });
    ws = addConnection(ws, "node-1", "out", "node-2", "premise");

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
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      // (α → ((α → β) → β)) → ((α → α → β) → (α → β))
      expect(result.conclusionText).toBe(
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
      error: { _tag: "PremiseMissing" },
      expected: "Connect a premise to apply substitution",
    },
    {
      error: { _tag: "PremiseParseError", nodeId: "node-1" },
      expected: "Premise has invalid formula",
    },
    {
      error: { _tag: "NoSubstitutionEntries" },
      expected: "Add at least one substitution entry",
    },
    {
      error: { _tag: "FormulaParseError", entryIndex: 0, formulaText: "bad" },
      expected: "Invalid formula in substitution entry 1",
    },
    {
      error: { _tag: "FormulaParseError", entryIndex: 2, formulaText: "bad" },
      expected: "Invalid formula in substitution entry 3",
    },
    {
      error: { _tag: "TermParseError", entryIndex: 0, termText: "bad" },
      expected: "Invalid term in substitution entry 1",
    },
    {
      error: { _tag: "TermParseError", entryIndex: 1, termText: "bad" },
      expected: "Invalid term in substitution entry 2",
    },
  ])(
    "returns correct message for $error._tag (index $error.entryIndex)",
    ({ error, expected }) => {
      expect(getSubstitutionErrorMessage(error)).toBe(expected);
    },
  );
});
