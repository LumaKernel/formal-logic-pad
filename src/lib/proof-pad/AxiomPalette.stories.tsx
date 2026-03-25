/**
 * 公理パレットのStorybook ストーリー。
 *
 * 変更時は AxiomPalette.tsx, AxiomPalette.test.tsx も同期すること。
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { AxiomPalette } from "./AxiomPalette";
import { getAvailableAxioms } from "./axiomPaletteLogic";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";

const defaultAxioms = getAvailableAxioms(lukasiewiczSystem);

const meta = {
  title: "ProofPad/AxiomPalette",
  component: AxiomPalette,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: 400, height: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AxiomPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本表示: 公理一覧が表示される。
 */
export const Default: Story = {
  args: {
    axioms: defaultAxioms,
    onAddAxiom: () => {},
    testId: "palette",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const a1 = canvas.getByTestId("palette-item-A1");
    await expect(a1).toBeInTheDocument();
    const a2 = canvas.getByTestId("palette-item-A2");
    await expect(a2).toBeInTheDocument();
  },
};

/**
 * 畳む/展開: 畳むボタンで畳み、トグルで展開する。
 */
export const CollapseAndExpand: Story = {
  args: {
    axioms: defaultAxioms,
    onAddAxiom: () => {},
    testId: "palette",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 初期: 展開状態
    await expect(canvas.getByTestId("palette-item-A1")).toBeInTheDocument();
    // 畳む
    const collapseBtn = canvas.getByTestId("palette-collapse");
    await userEvent.click(collapseBtn);
    // 畳まれた状態: トグルボタンが見える
    const toggle = canvas.getByTestId("palette-toggle");
    await expect(toggle).toBeInTheDocument();
    await expect(
      canvas.queryByTestId("palette-item-A1"),
    ).not.toBeInTheDocument();
    // 展開
    await userEvent.click(toggle);
    await expect(canvas.getByTestId("palette-item-A1")).toBeInTheDocument();
  },
};
