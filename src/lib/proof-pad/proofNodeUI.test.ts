import { describe, expect, it } from "vitest";
import {
  AXIOM_PORTS,
  CONCLUSION_PORTS,
  MP_PORTS,
  PROOF_NODE_KINDS,
  getProofEdgeColor,
  getProofNodePorts,
  getProofNodeStyle,
} from "./proofNodeUI";
import type { ProofNodeKind } from "./proofNodeUI";

describe("getProofNodeStyle", () => {
  it.each<ProofNodeKind>(["axiom", "mp", "conclusion"])(
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

  it("returns different background colors for each kind", () => {
    const colors = PROOF_NODE_KINDS.map(
      (k) => getProofNodeStyle(k).backgroundColor,
    );
    const unique = new Set(colors);
    expect(unique.size).toBe(PROOF_NODE_KINDS.length);
  });

  it("conclusion has a special border radius (12)", () => {
    expect(getProofNodeStyle("conclusion").borderRadius).toBe(12);
  });

  it("axiom and mp have border radius 8", () => {
    expect(getProofNodeStyle("axiom").borderRadius).toBe(8);
    expect(getProofNodeStyle("mp").borderRadius).toBe(8);
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

  it("axiom edges are lighter blue", () => {
    expect(getProofEdgeColor("axiom")).toBe("#7aa3e0");
  });

  it("mp edges are lighter orange", () => {
    expect(getProofEdgeColor("mp")).toBe("#e0a87a");
  });
});

describe("PROOF_NODE_KINDS", () => {
  it("contains all 3 kinds", () => {
    expect(PROOF_NODE_KINDS).toEqual(["axiom", "mp", "conclusion"]);
  });
});
