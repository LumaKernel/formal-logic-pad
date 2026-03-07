import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ScriptEditorComponent } from "./ScriptEditorComponent";

const meta = {
  title: "components/ScriptEditor",
  component: ScriptEditorComponent,
  args: {
    height: "300px",
  },
} satisfies Meta<typeof ScriptEditorComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ツールバーが表示される
    const toolbar = canvas.getByTestId("script-editor-toolbar");
    await expect(toolbar).toBeDefined();

    // ボタンが存在する
    const runButton = canvas.getByTestId("run-button");
    const stepButton = canvas.getByTestId("step-button");
    const playButton = canvas.getByTestId("play-button");
    const resetButton = canvas.getByTestId("reset-button");
    await expect(runButton).toBeDefined();
    await expect(stepButton).toBeDefined();
    await expect(playButton).toBeDefined();
    await expect(resetButton).toBeDefined();

    // 初期状態は Ready
    const status = canvas.getByTestId("execution-status");
    await expect(status.textContent).toBe("Ready");

    // Reset は idle 時に disabled
    await expect(resetButton.getAttribute("disabled")).toBe("");

    // 速度スライダーが表示される
    const speedBar = canvas.getByTestId("speed-bar");
    await expect(speedBar).toBeDefined();

    const speedSlider = canvas.getByTestId("speed-slider");
    await expect(speedSlider).toBeDefined();

    const speedValue = canvas.getByTestId("speed-value");
    await expect(speedValue.textContent).toContain("ms");
  },
};

export const WithCustomCode: Story = {
  args: {
    initialCode: `// カスタムコード
var f = parseFormula("phi -> psi");
console.log(formatFormula(f));`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エディタコンテナが存在する
    const editor = canvas.getByTestId("script-editor");
    await expect(editor).toBeDefined();

    // ツールバーが表示される
    const toolbar = canvas.getByTestId("script-editor-toolbar");
    await expect(toolbar).toBeDefined();

    // Run ボタンが有効
    const runButton = canvas.getByTestId("run-button");
    await expect(runButton.getAttribute("disabled")).toBeNull();

    // Play ボタンが有効
    const playButton = canvas.getByTestId("play-button");
    await expect(playButton.getAttribute("disabled")).toBeNull();
  },
};
