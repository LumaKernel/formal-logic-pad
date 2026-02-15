import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { ViewportState } from "./types";

function ZoomableCanvasDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport} />
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        scale: {viewport.scale.toFixed(2)} | offset: (
        {viewport.offsetX.toFixed(0)}, {viewport.offsetY.toFixed(0)})
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/ZoomableCanvas",
  component: ZoomableCanvasDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ZoomableCanvasDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
