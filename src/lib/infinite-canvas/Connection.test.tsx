import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Connection } from "./Connection";
import type { ConnectionEndpoint } from "./connectionPath";
import type { ViewportState } from "./types";

const defaultViewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

const from: ConnectionEndpoint = {
  position: { x: 0, y: 0 },
  width: 100,
  height: 50,
};

const to: ConnectionEndpoint = {
  position: { x: 300, y: 100 },
  width: 100,
  height: 50,
};

describe("Connection", () => {
  it("renders an SVG with a path", () => {
    render(<Connection from={from} to={to} viewport={defaultViewport} />);
    const svg = screen.getByTestId("connection");
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe("svg");

    const path = screen.getByTestId("connection-path");
    expect(path).toBeInTheDocument();
    expect(path.tagName).toBe("path");
  });

  it("positions SVG absolutely with full coverage", () => {
    render(<Connection from={from} to={to} viewport={defaultViewport} />);
    const svg = screen.getByTestId("connection");
    expect(svg.style.position).toBe("absolute");
    expect(svg.style.pointerEvents).toBe("none");
  });

  it("renders path with bezier curve", () => {
    render(<Connection from={from} to={to} viewport={defaultViewport} />);
    const path = screen.getByTestId("connection-path");
    const d = path.getAttribute("d") ?? "";
    expect(d).toMatch(/^M\s/);
    expect(d).toContain("C ");
  });

  it("applies custom color", () => {
    render(
      <Connection
        from={from}
        to={to}
        viewport={defaultViewport}
        color="#ff0000"
      />,
    );
    const path = screen.getByTestId("connection-path");
    expect(path.getAttribute("stroke")).toBe("#ff0000");
  });

  it("applies custom stroke width", () => {
    render(
      <Connection
        from={from}
        to={to}
        viewport={defaultViewport}
        strokeWidth={4}
      />,
    );
    const path = screen.getByTestId("connection-path");
    expect(path.getAttribute("stroke-width")).toBe("4");
  });

  it("uses default color and stroke width", () => {
    render(<Connection from={from} to={to} viewport={defaultViewport} />);
    const path = screen.getByTestId("connection-path");
    expect(path.getAttribute("stroke")).toBe("#666");
    expect(path.getAttribute("stroke-width")).toBe("2");
  });

  it("has dashed stroke for visibility behind items", () => {
    render(<Connection from={from} to={to} viewport={defaultViewport} />);
    const path = screen.getByTestId("connection-path");
    expect(path.getAttribute("stroke-dasharray")).toBe("8 4");
  });

  it("renders with partial opacity", () => {
    render(<Connection from={from} to={to} viewport={defaultViewport} />);
    const path = screen.getByTestId("connection-path");
    expect(path.getAttribute("opacity")).toBe("0.8");
  });

  it("renders background stroke for contrast", () => {
    const { container } = render(
      <Connection from={from} to={to} viewport={defaultViewport} />,
    );
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    // Background stroke
    const bgPath = paths[0];
    expect(bgPath?.getAttribute("stroke")).toBe("white");
    expect(bgPath?.getAttribute("opacity")).toBe("0.6");
  });

  it("updates path when viewport changes", () => {
    const { rerender } = render(
      <Connection from={from} to={to} viewport={defaultViewport} />,
    );
    const pathBefore =
      screen.getByTestId("connection-path").getAttribute("d") ?? "";

    rerender(
      <Connection
        from={from}
        to={to}
        viewport={{ offsetX: 100, offsetY: 50, scale: 2 }}
      />,
    );
    const pathAfter =
      screen.getByTestId("connection-path").getAttribute("d") ?? "";

    expect(pathBefore).not.toBe(pathAfter);
  });

  it("updates path when endpoint positions change", () => {
    const { rerender } = render(
      <Connection from={from} to={to} viewport={defaultViewport} />,
    );
    const pathBefore =
      screen.getByTestId("connection-path").getAttribute("d") ?? "";

    const movedTo: ConnectionEndpoint = {
      position: { x: 500, y: 300 },
      width: 100,
      height: 50,
    };
    rerender(
      <Connection from={from} to={movedTo} viewport={defaultViewport} />,
    );
    const pathAfter =
      screen.getByTestId("connection-path").getAttribute("d") ?? "";

    expect(pathBefore).not.toBe(pathAfter);
  });
});
