import { describe, expect, it } from "vitest";
import {
  CONCLUSION_PORTS,
  DERIVED_PORTS,
  PROOF_NODE_KINDS,
  getProofEdgeColor,
  getProofNodePorts,
  getProofNodeStyle,
  getProofNodeKindLabel,
} from "./proofNodeUI";
import type { ProofNodeKind } from "./proofNodeUI";

describe("getProofNodeStyle", () => {
  it.each<ProofNodeKind>(["axiom", "conclusion"])(
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

  it("axiom has border radius 8", () => {
    expect(getProofNodeStyle("axiom").borderRadius).toBe(8);
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
  it("axiom has all ports (input + output) since derived is computed", () => {
    const ports = getProofNodePorts("axiom");
    expect(ports).toBe(DERIVED_PORTS);
    expect(ports).toHaveLength(4);
    expect(ports.some((p) => p.id === "out")).toBe(true);
    expect(ports.some((p) => p.id === "premise-left")).toBe(true);
    expect(ports.some((p) => p.id === "premise-right")).toBe(true);
    expect(ports.some((p) => p.id === "premise")).toBe(true);
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
});

describe("PROOF_NODE_KINDS", () => {
  it("contains all 2 kinds", () => {
    expect(PROOF_NODE_KINDS).toEqual(["axiom", "conclusion"]);
  });
});

describe("getProofNodeKindLabel", () => {
  it("returns 'Axiom' for axiom kind", () => {
    expect(getProofNodeKindLabel("axiom")).toBe("Axiom");
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
