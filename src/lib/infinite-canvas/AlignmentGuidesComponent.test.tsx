import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlignmentGuidesComponent } from "./AlignmentGuidesComponent";
import type { AlignmentGuide } from "./objectSnap";
import type { ViewportState } from "./types";

const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

describe("AlignmentGuidesComponent", () => {
  it("renders nothing when guides is empty", () => {
    const { container } = render(
      <AlignmentGuidesComponent guides={[]} viewport={viewport} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders vertical guide line", () => {
    const guides: readonly AlignmentGuide[] = [
      { axis: "vertical", value: 100, from: 50, to: 300 },
    ];
    render(
      <AlignmentGuidesComponent guides={guides} viewport={viewport} />,
    );
    const svg = screen.getByTestId("alignment-guides");
    expect(svg).toBeInTheDocument();
    const lines = svg.querySelectorAll("line");
    expect(lines).toHaveLength(1);
    const line = lines[0]!;
    expect(line.getAttribute("x1")).toBe("100");
    expect(line.getAttribute("y1")).toBe("50");
    expect(line.getAttribute("x2")).toBe("100");
    expect(line.getAttribute("y2")).toBe("300");
  });

  it("renders horizontal guide line", () => {
    const guides: readonly AlignmentGuide[] = [
      { axis: "horizontal", value: 200, from: 10, to: 400 },
    ];
    render(
      <AlignmentGuidesComponent guides={guides} viewport={viewport} />,
    );
    const svg = screen.getByTestId("alignment-guides");
    const lines = svg.querySelectorAll("line");
    expect(lines).toHaveLength(1);
    const line = lines[0]!;
    expect(line.getAttribute("x1")).toBe("10");
    expect(line.getAttribute("y1")).toBe("200");
    expect(line.getAttribute("x2")).toBe("400");
    expect(line.getAttribute("y2")).toBe("200");
  });

  it("renders multiple guides", () => {
    const guides: readonly AlignmentGuide[] = [
      { axis: "vertical", value: 100, from: 0, to: 200 },
      { axis: "horizontal", value: 150, from: 0, to: 300 },
    ];
    render(
      <AlignmentGuidesComponent guides={guides} viewport={viewport} />,
    );
    const svg = screen.getByTestId("alignment-guides");
    const lines = svg.querySelectorAll("line");
    expect(lines).toHaveLength(2);
  });

  it("applies viewport transform to coordinates", () => {
    const scaledViewport: ViewportState = {
      offsetX: 50,
      offsetY: 100,
      scale: 2,
    };
    const guides: readonly AlignmentGuide[] = [
      { axis: "vertical", value: 100, from: 50, to: 200 },
    ];
    render(
      <AlignmentGuidesComponent
        guides={guides}
        viewport={scaledViewport}
      />,
    );
    const svg = screen.getByTestId("alignment-guides");
    const line = svg.querySelector("line")!;
    // worldToScreen: x = 100*2+50 = 250, y1 = 50*2+100 = 200, y2 = 200*2+100 = 500
    expect(line.getAttribute("x1")).toBe("250");
    expect(line.getAttribute("y1")).toBe("200");
    expect(line.getAttribute("x2")).toBe("250");
    expect(line.getAttribute("y2")).toBe("500");
  });

  it("uses custom color and strokeWidth", () => {
    const guides: readonly AlignmentGuide[] = [
      { axis: "vertical", value: 50, from: 0, to: 100 },
    ];
    render(
      <AlignmentGuidesComponent
        guides={guides}
        viewport={viewport}
        color="#ff0000"
        strokeWidth={3}
      />,
    );
    const svg = screen.getByTestId("alignment-guides");
    const line = svg.querySelector("line")!;
    expect(line.getAttribute("stroke")).toBe("#ff0000");
    expect(line.getAttribute("stroke-width")).toBe("3");
  });
});
