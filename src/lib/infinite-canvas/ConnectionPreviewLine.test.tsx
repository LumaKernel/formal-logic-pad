import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionPreviewLine } from "./ConnectionPreviewLine";
import type { ConnectionPreviewState } from "./connectionPreview";
import type { ConnectorPortOnItem } from "./connector";
import type { ViewportState } from "./types";

const defaultViewport: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const sourcePortOnItem: ConnectorPortOnItem = {
  port: { id: "bottom", edge: "bottom", position: 0.5 },
  itemPosition: { x: 100, y: 100 },
  itemWidth: 100,
  itemHeight: 50,
};

describe("ConnectionPreviewLine", () => {
  it("renders a preview line SVG", () => {
    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const svg = screen.getByTestId("connection-preview-line");
    expect(svg).toBeDefined();
  });

  it("renders a path element", () => {
    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const path = screen.getByTestId("connection-preview-path");
    expect(path).toBeDefined();
    const d = path.getAttribute("d") ?? "";
    // Source port bottom center is at (150, 150), target is (200, 300)
    expect(d).toContain("M 150 150");
    expect(d).toContain("L 200 300");
  });

  it("uses blue color for valid connection", () => {
    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const path = screen.getByTestId("connection-preview-path");
    expect(path.getAttribute("stroke")).toBe("#3b82f6");
  });

  it("uses red color for invalid connection", () => {
    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: false,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const path = screen.getByTestId("connection-preview-path");
    expect(path.getAttribute("stroke")).toBe("#ef4444");
  });

  it("does not render snap indicator when not snapped", () => {
    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    expect(
      screen.queryByTestId("connection-preview-snap-indicator"),
    ).toBeNull();
  });

  it("renders snap indicator when snapped to target", () => {
    const targetPortOnItem: ConnectorPortOnItem = {
      port: { id: "top", edge: "top", position: 0.5 },
      itemPosition: { x: 180, y: 280 },
      itemWidth: 100,
      itemHeight: 50,
    };

    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 230, y: 280 },
      snappedTarget: {
        itemId: "target",
        portOnItem: targetPortOnItem,
      },
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const indicator = screen.getByTestId("connection-preview-snap-indicator");
    expect(indicator).toBeDefined();
    // Target port top center at (230, 280)
    expect(indicator.getAttribute("cx")).toBe("230");
    expect(indicator.getAttribute("cy")).toBe("280");
  });

  it("applies viewport scale to coordinates", () => {
    const scaledViewport: ViewportState = {
      offsetX: 50,
      offsetY: 50,
      scale: 2,
    };

    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={scaledViewport} />,
    );

    const path = screen.getByTestId("connection-preview-path");
    const d = path.getAttribute("d") ?? "";
    // Source port at (150, 150) in world -> screen: (150*2+50, 150*2+50) = (350, 350)
    // Target at (200, 300) in world -> screen: (200*2+50, 300*2+50) = (450, 650)
    expect(d).toContain("M 350 350");
    expect(d).toContain("L 450 650");
  });

  it("draws line to snapped port position instead of mouse", () => {
    const targetPortOnItem: ConnectorPortOnItem = {
      port: { id: "top", edge: "top", position: 0.5 },
      itemPosition: { x: 180, y: 280 },
      itemWidth: 100,
      itemHeight: 50,
    };

    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 235, y: 285 },
      snappedTarget: {
        itemId: "target",
        portOnItem: targetPortOnItem,
      },
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const path = screen.getByTestId("connection-preview-path");
    const d = path.getAttribute("d") ?? "";
    // Should use snapped port position (230, 280) not mouse position (235, 285)
    expect(d).toContain("L 230 280");
  });

  it("applies stroke-linecap round on paths", () => {
    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: true,
    };

    const { container } = render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const paths = container.querySelectorAll("path");
    expect(paths[0]?.getAttribute("stroke-linecap")).toBe("round");
    expect(paths[1]?.getAttribute("stroke-linecap")).toBe("round");
  });

  it("has pointer-events none on the SVG", () => {
    const state: ConnectionPreviewState = {
      sourceItemId: "source",
      sourcePortOnItem,
      mouseWorldPosition: { x: 200, y: 300 },
      snappedTarget: null,
      isValid: true,
    };

    render(
      <ConnectionPreviewLine state={state} viewport={defaultViewport} />,
    );

    const svg = screen.getByTestId("connection-preview-line");
    expect(svg.style.pointerEvents).toBe("none");
  });
});
