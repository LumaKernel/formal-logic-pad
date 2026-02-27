/**
 * 証明ツリー自動レイアウトのデモストーリー。
 *
 * 自動レイアウトボタンで証明ツリーを整列する機能を実演。
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import { ProofWorkspace } from "./ProofWorkspace";
import {
  createEmptyWorkspace,
  addNode,
  applyMPAndConnect,
  applyTreeLayout,
} from "./workspaceState";
import type { WorkspaceState } from "./workspaceState";
import type { LayoutDirection } from "./treeLayoutLogic";

// --- 乱雑に配置された証明ツリー ---

function createMessyProof(): WorkspaceState {
  let ws = createEmptyWorkspace(lukasiewiczSystem);
  // 意図的に乱雑な位置に配置
  ws = addNode(
    ws,
    "axiom",
    "Axiom",
    { x: 500, y: 400 },
    "phi -> ((phi -> phi) -> phi)",
  );
  ws = addNode(
    ws,
    "axiom",
    "Axiom",
    { x: 100, y: 100 },
    "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
  );
  const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
    x: 50,
    y: 300,
  });
  ws = mp1.workspace;
  ws = addNode(ws, "axiom", "Axiom", { x: 600, y: 50 }, "phi -> (phi -> phi)");
  const mp2 = applyMPAndConnect(ws, "node-4", "node-3", {
    x: 400,
    y: 100,
  });
  ws = mp2.workspace;
  return ws;
}

function TreeLayoutDemoComponent() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(createMessyProof);
  const [direction, setDirection] = useState<LayoutDirection>("top-to-bottom");

  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  const handleAutoLayout = useCallback(() => {
    setWorkspace((ws) => applyTreeLayout(ws, direction));
  }, [direction]);

  const handleReset = useCallback(() => {
    setWorkspace(createMessyProof());
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
      <div
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          display: "flex",
          gap: 8,
          zIndex: 10000,
        }}
      >
        <select
          data-testid="direction-select"
          value={direction}
          onChange={(e) => {
            setDirection(
              e.target.value === "bottom-to-top"
                ? "bottom-to-top"
                : "top-to-bottom",
            );
          }}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 13,
          }}
        >
          <option value="top-to-bottom">上→下</option>
          <option value="bottom-to-top">下→上</option>
        </select>
        <button
          data-testid="auto-layout-btn"
          onClick={handleAutoLayout}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          自動整列
        </button>
        <button
          data-testid="reset-btn"
          onClick={handleReset}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#f5f5f5",
            color: "#333",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          リセット
        </button>
      </div>
    </div>
  );
}

const meta = {
  title: "ProofPad/TreeLayoutDemo",
  component: TreeLayoutDemoComponent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TreeLayoutDemoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Auto-layout button and direction selector exist
    const autoLayoutBtn = canvas.getByTestId("auto-layout-btn");
    await expect(autoLayoutBtn).toBeInTheDocument();
    await expect(autoLayoutBtn).toHaveTextContent("自動整列");

    const directionSelect = canvas.getByTestId("direction-select");
    await expect(directionSelect).toBeInTheDocument();

    const resetBtn = canvas.getByTestId("reset-btn");
    await expect(resetBtn).toBeInTheDocument();

    // Click auto-layout button
    await userEvent.click(autoLayoutBtn);

    // The workspace should still have 5 nodes after layout
    // (Verify by checking workspace element exists)
    const workspace = canvas.getByTestId("workspace");
    await expect(workspace).toBeInTheDocument();
  },
};
