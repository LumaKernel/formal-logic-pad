/**
 * NdProofTreePanel のテスト。
 *
 * ND Gentzenスタイル証明木パネルのレンダリングを検証する。
 */

import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import { NdProofTreePanel } from "./NdProofTreePanel";

// ── テストヘルパー ──────────────────────────────────────────

function mkNode(id: string, formulaText: string): WorkspaceNode {
  return {
    id,
    kind: "axiom",
    label: "",
    formulaText,
    position: { x: 0, y: 0 },
  };
}

// ── テスト ──────────────────────────────────────────

describe("NdProofTreePanel", () => {
  it("エッジなしの場合空メッセージを表示する", () => {
    const nodes = [mkNode("n1", "φ")];
    const edges: readonly InferenceEdge[] = [];
    render(
      <NdProofTreePanel
        nodes={nodes}
        inferenceEdges={edges}
        testId="nd-tree"
      />,
    );

    expect(screen.getByTestId("nd-tree")).toBeDefined();
    expect(screen.getByText("ND Proof Tree")).toBeDefined();
    expect(screen.getByText("No proof")).toBeDefined();
    expect(
      screen.getByText(
        "No inference edges yet. Apply rules to build a proof tree.",
      ),
    ).toBeDefined();
  });

  it("→I証明木を表示する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
    ];
    render(
      <NdProofTreePanel
        nodes={nodes}
        inferenceEdges={edges}
        testId="nd-tree"
      />,
    );

    expect(screen.getByText("2 nodes, depth 1")).toBeDefined();
    // 規則ラベルが表示される
    const allRules = screen.getAllByText(/^(→I \[1\]|Asm)$/);
    const ruleTexts = allRules.map((el) => el.textContent);
    expect(ruleTexts).toContain("→I [1]");
    expect(ruleTexts).toContain("Asm");
  });

  it("→E証明木で前提を表示する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → ψ"), mkNode("n3", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "ψ",
      },
    ];
    render(
      <NdProofTreePanel
        nodes={nodes}
        inferenceEdges={edges}
        testId="nd-tree"
      />,
    );

    expect(screen.getByText("3 nodes, depth 1")).toBeDefined();
    const allRules = screen.getAllByText(/^(→E|Asm)$/);
    const ruleTexts = allRules.map((el) => el.textContent);
    expect(ruleTexts).toContain("→E");
    expect(ruleTexts.filter((t) => t === "Asm")).toHaveLength(2);
  });

  it("testId未指定でもレンダリングできる", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
    ];
    const { container } = render(
      <NdProofTreePanel nodes={nodes} inferenceEdges={edges} />,
    );
    expect(container.textContent).toContain("ND Proof Tree");
  });

  it("パネルのclickがstopPropagationされる", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
    ];
    render(
      <div
        onClick={() => {
          throw new Error("should not propagate");
        }}
      >
        <NdProofTreePanel
          nodes={nodes}
          inferenceEdges={edges}
          testId="nd-tree"
        />
      </div>,
    );

    const panel = screen.getByTestId("nd-tree");
    panel.click();
    // エラーが発生しなければOK
  });

  it("複数のルートがある場合サイクルボタンが表示される", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → φ"),
      mkNode("n3", "ψ"),
      mkNode("n4", "ψ → ψ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n4",
        premiseNodeId: "n3",
        dischargedFormulaText: "ψ",
        dischargedAssumptionId: 2,
        conclusionText: "ψ → ψ",
      },
    ];
    render(
      <NdProofTreePanel
        nodes={nodes}
        inferenceEdges={edges}
        testId="nd-tree"
      />,
    );

    const cycleButton = screen.getByTestId("nd-tree-cycle-root");
    expect(cycleButton.textContent).toBe("1/2");

    // ボタンクリックでルートが切り替わる
    fireEvent.click(cycleButton);
    expect(cycleButton.textContent).toBe("2/2");
  });

  it("深いツリーを正しく表示する", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → φ"),
      mkNode("n3", "φ"),
      mkNode("n4", "φ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n4",
        leftPremiseNodeId: "n3",
        rightPremiseNodeId: "n2",
        conclusionText: "φ",
      },
    ];
    render(
      <NdProofTreePanel
        nodes={nodes}
        inferenceEdges={edges}
        testId="nd-tree"
      />,
    );

    expect(screen.getByText("4 nodes, depth 2")).toBeDefined();
  });
});
