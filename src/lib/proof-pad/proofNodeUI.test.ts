import { describe, expect, it } from "vitest";
import {
  AXIOM_PORTS,
  CONCLUSION_PORTS,
  GEN_PORTS,
  MP_PORTS,
  SUBSTITUTION_PORTS,
  PROOF_NODE_KINDS,
  getProofEdgeColor,
  getProofNodePorts,
  getProofNodeStyle,
  getProofNodeKindLabel,
} from "./proofNodeUI";
import type { ProofNodeKind } from "./proofNodeUI";

describe("getProofNodeStyle", () => {
  it.each<ProofNodeKind>(["axiom", "mp", "gen", "substitution", "conclusion"])(
    "returns a style object for kind=%s",
    (kind) => {
      const style = getProofNodeStyle(kind);
      expect(style.backgroundColor).toBeTruthy();
      expect(style.textColor).toBeTruthy();
      expect(typeof style.borderRadius).toBe("number");
      expect(style.border).toBeTruthy();
      expect(style.boxShadow).toBeTruthy();
    },
  );

  it("returns different stripe colors for each kind", () => {
    const colors = PROOF_NODE_KINDS.map(
      (k) => getProofNodeStyle(k).stripeColor,
    );
    const unique = new Set(colors);
    expect(unique.size).toBe(PROOF_NODE_KINDS.length);
  });

  it("all kinds use paper card background", () => {
    for (const kind of PROOF_NODE_KINDS) {
      expect(getProofNodeStyle(kind).backgroundColor).toBe(
        "var(--color-node-card-bg, #fffdf8)",
      );
    }
  });

  it("all kinds use card text color", () => {
    for (const kind of PROOF_NODE_KINDS) {
      expect(getProofNodeStyle(kind).textColor).toBe(
        "var(--color-node-card-text, #2d2a24)",
      );
    }
  });

  it("conclusion has a special border radius (12)", () => {
    expect(getProofNodeStyle("conclusion").borderRadius).toBe(12);
  });

  it("axiom, mp, gen, and substitution have border radius 8", () => {
    expect(getProofNodeStyle("axiom").borderRadius).toBe(8);
    expect(getProofNodeStyle("mp").borderRadius).toBe(8);
    expect(getProofNodeStyle("gen").borderRadius).toBe(8);
    expect(getProofNodeStyle("substitution").borderRadius).toBe(8);
  });

  it("includes stripeColor and boxShadowHover", () => {
    for (const kind of PROOF_NODE_KINDS) {
      const style = getProofNodeStyle(kind);
      expect(style.stripeColor).toBeTruthy();
      expect(style.boxShadowHover).toBeTruthy();
    }
  });
});

describe("getProofNodePorts", () => {
  it("axiom has 1 output port", () => {
    const ports = getProofNodePorts("axiom");
    expect(ports).toBe(AXIOM_PORTS);
    expect(ports).toHaveLength(1);
    expect(ports[0]?.id).toBe("out");
    expect(ports[0]?.edge).toBe("bottom");
  });

  it("mp has 3 ports (2 input + 1 output)", () => {
    const ports = getProofNodePorts("mp");
    expect(ports).toBe(MP_PORTS);
    expect(ports).toHaveLength(3);
    expect(ports.map((p) => p.id)).toEqual([
      "premise-left",
      "premise-right",
      "out",
    ]);
  });

  it("gen has 2 ports (1 input + 1 output)", () => {
    const ports = getProofNodePorts("gen");
    expect(ports).toBe(GEN_PORTS);
    expect(ports).toHaveLength(2);
    expect(ports.map((p) => p.id)).toEqual(["premise", "out"]);
  });

  it("substitution has 2 ports (1 input + 1 output)", () => {
    const ports = getProofNodePorts("substitution");
    expect(ports).toBe(SUBSTITUTION_PORTS);
    expect(ports).toHaveLength(2);
    expect(ports.map((p) => p.id)).toEqual(["premise", "out"]);
  });

  it("conclusion has 2 input ports", () => {
    const ports = getProofNodePorts("conclusion");
    expect(ports).toBe(CONCLUSION_PORTS);
    expect(ports).toHaveLength(2);
    expect(ports.map((p) => p.id)).toEqual(["premise-left", "premise-right"]);
  });
});

describe("getProofEdgeColor", () => {
  it("returns a color for each kind", () => {
    for (const kind of PROOF_NODE_KINDS) {
      expect(getProofEdgeColor(kind)).toBeTruthy();
    }
  });

  it("axiom edges use CSS variable with fallback", () => {
    expect(getProofEdgeColor("axiom")).toBe("var(--color-edge-axiom, #7aa3e0)");
  });

  it("mp edges use CSS variable with fallback", () => {
    expect(getProofEdgeColor("mp")).toBe("var(--color-edge-mp, #e0a87a)");
  });

  it("gen edges use CSS variable with fallback", () => {
    expect(getProofEdgeColor("gen")).toBe("var(--color-edge-gen, #c39bd3)");
  });

  it("substitution edges use CSS variable with fallback", () => {
    expect(getProofEdgeColor("substitution")).toBe(
      "var(--color-edge-substitution, #5dade2)",
    );
  });
});

describe("PROOF_NODE_KINDS", () => {
  it("contains all 6 kinds", () => {
    expect(PROOF_NODE_KINDS).toEqual([
      "axiom",
      "mp",
      "gen",
      "substitution",
      "derived",
      "conclusion",
    ]);
  });
});

describe("getProofNodeKindLabel", () => {
  it("returns 'Axiom' for axiom kind", () => {
    expect(getProofNodeKindLabel("axiom")).toBe("Axiom");
  });

  it("returns 'MP' for mp kind", () => {
    expect(getProofNodeKindLabel("mp")).toBe("MP");
  });

  it("returns 'Gen' for gen kind", () => {
    expect(getProofNodeKindLabel("gen")).toBe("Gen");
  });

  it("returns 'Subst' for substitution kind", () => {
    expect(getProofNodeKindLabel("substitution")).toBe("Subst");
  });

  it("returns 'Derived' for derived kind", () => {
    expect(getProofNodeKindLabel("derived")).toBe("Derived");
  });

  it("returns 'Conclusion' for conclusion kind", () => {
    expect(getProofNodeKindLabel("conclusion")).toBe("Conclusion");
  });

  it("returns a label for every PROOF_NODE_KINDS entry", () => {
    for (const kind of PROOF_NODE_KINDS) {
      expect(getProofNodeKindLabel(kind)).toBeTruthy();
    }
  });
});
