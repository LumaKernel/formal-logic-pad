import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { InfiniteCanvas } from "./InfiniteCanvas";

const meta = {
  title: "InfiniteCanvas/InfiniteCanvas",
  component: InfiniteCanvas,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    dotColor: { control: "color" },
    backgroundColor: { control: "color" },
    gridLineColor: { control: "color" },
    dotSpacing: { control: { type: "range", min: 5, max: 100, step: 1 } },
    majorGridEvery: { control: { type: "range", min: 0, max: 20, step: 1 } },
    gridLineWidth: {
      control: { type: "range", min: 0.1, max: 5, step: 0.1 },
    },
  },
} satisfies Meta<typeof InfiniteCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const infiniteCanvas = canvas.getByTestId("infinite-canvas");
    await expect(infiniteCanvas).toBeInTheDocument();
    await expect(infiniteCanvas).toHaveStyle({
      cursor: "grab",
    });
    // Default uses CSS variable for theme-aware colors
    const circle = infiniteCanvas.querySelector("circle");
    await expect(circle?.getAttribute("fill")).toBe(
      "var(--color-canvas-dot, #c8bfb0)",
    );
  },
};

export const ZoomedIn: Story = {
  args: {
    viewport: { offsetX: 0, offsetY: 0, scale: 2 },
  },
};

export const ZoomedOut: Story = {
  args: {
    viewport: { offsetX: 0, offsetY: 0, scale: 0.5 },
  },
};

export const Panned: Story = {
  args: {
    viewport: { offsetX: 150, offsetY: 75, scale: 1 },
  },
};

export const CustomColors: Story = {
  args: {
    dotColor: "#4a90d9",
    backgroundColor: "#1a1a2e",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const infiniteCanvas = canvas.getByTestId("infinite-canvas");
    await expect(infiniteCanvas).toBeInTheDocument();
    await expect(infiniteCanvas).toHaveStyle({
      backgroundColor: "#1a1a2e",
    });
  },
};

export const DenseGrid: Story = {
  args: {
    dotSpacing: 10,
  },
};

export const SparseGrid: Story = {
  args: {
    dotSpacing: 50,
  },
};

export const WithGridLines: Story = {
  args: {
    majorGridEvery: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const infiniteCanvas = canvas.getByTestId("infinite-canvas");
    await expect(infiniteCanvas).toBeInTheDocument();

    // Verify grid line pattern exists (2 patterns: dot + grid line)
    const patterns = infiniteCanvas.querySelectorAll("pattern");
    await expect(patterns.length).toBe(2);

    // Verify grid line pattern has horizontal and vertical lines
    const gridLinePattern = patterns[1];
    const lines = gridLinePattern?.querySelectorAll("line");
    await expect(lines?.length).toBe(2);

    // Verify CSS variable default for grid line color
    await expect(lines?.[0]?.getAttribute("stroke")).toBe(
      "var(--color-canvas-grid-line, rgba(80, 60, 40, 0.08))",
    );
  },
};

export const WithoutGridLines: Story = {
  args: {
    majorGridEvery: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const infiniteCanvas = canvas.getByTestId("infinite-canvas");
    await expect(infiniteCanvas).toBeInTheDocument();

    // Only dot pattern, no grid line pattern
    const patterns = infiniteCanvas.querySelectorAll("pattern");
    await expect(patterns.length).toBe(1);
  },
};

export const DenseGridLines: Story = {
  args: {
    majorGridEvery: 3,
    gridLineWidth: 1,
  },
};

export const ThemeAware: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const infiniteCanvas = canvas.getByTestId("infinite-canvas");
    await expect(infiniteCanvas).toBeInTheDocument();

    // Verify CSS variable defaults are applied (theme-aware)
    await expect(infiniteCanvas.style.backgroundColor).toBe(
      "var(--color-canvas-bg, #f5f0e8)",
    );
    const circle = infiniteCanvas.querySelector("circle");
    await expect(circle?.getAttribute("fill")).toBe(
      "var(--color-canvas-dot, #c8bfb0)",
    );
  },
};
