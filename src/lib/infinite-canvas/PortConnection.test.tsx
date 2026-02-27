import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConnectorPortOnItem } from "./connector";
import { PortConnection } from "./PortConnection";
import type { ViewportState } from "./types";

afterEach(cleanup);

const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

const fromPort: ConnectorPortOnItem = {
  port: { id: "right", edge: "right", position: 0.5 },
  itemPosition: { x: 50, y: 100 },
  itemWidth: 100,
  itemHeight: 50,
};

const toPort: ConnectorPortOnItem = {
  port: { id: "left", edge: "left", position: 0.5 },
  itemPosition: { x: 300, y: 100 },
  itemWidth: 100,
  itemHeight: 50,
};

describe("PortConnection", () => {
  it("renders an SVG with the port-connection testid", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);

    const svg = screen.getByTestId("port-connection");
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe("svg");
  });

  it("renders a path with the port-connection-path testid", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);

    const path = screen.getByTestId("port-connection-path");
    expect(path).toBeInTheDocument();
    expect(path.getAttribute("d")).toBeTruthy();
  });

  it("uses the provided color for the path stroke", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        color="#ff0000"
      />,
    );

    const path = screen.getByTestId("port-connection-path");
    expect(path.getAttribute("stroke")).toBe("#ff0000");
  });

  it("uses the provided stroke width", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        strokeWidth={4}
      />,
    );

    const path = screen.getByTestId("port-connection-path");
    expect(path.getAttribute("stroke-width")).toBe("4");
  });

  it("applies default color and stroke width", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);

    const path = screen.getByTestId("port-connection-path");
    expect(path.getAttribute("stroke")).toBe("#666");
    expect(path.getAttribute("stroke-width")).toBe("2");
  });

  it("applies stroke-linecap round on main and background paths", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);

    const svg = screen.getByTestId("port-connection");
    const paths = svg.querySelectorAll("path");
    expect(paths[0]?.getAttribute("stroke-linecap")).toBe("round");
    expect(paths[1]?.getAttribute("stroke-linecap")).toBe("round");
  });

  it("renders background stroke for visibility", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);

    const svg = screen.getByTestId("port-connection");
    const paths = svg.querySelectorAll("path");
    // 2 paths: background + main
    expect(paths).toHaveLength(2);
    expect(paths[0]?.getAttribute("stroke")).toBe("white");
  });

  it("does not render hand-drawn filter by default", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);
    expect(screen.queryByTestId("hand-drawn-filter")).not.toBeInTheDocument();
  });

  it("renders hand-drawn filter when handDrawn is true", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        handDrawn
      />,
    );
    expect(screen.getByTestId("hand-drawn-filter")).toBeInTheDocument();
  });

  it("applies filter to paths when handDrawn is true", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        handDrawn
      />,
    );
    const path = screen.getByTestId("port-connection-path");
    expect(path.getAttribute("filter")).toMatch(/^url\(#/);
  });

  it("has pointer-events none on the SVG", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);

    const svg = screen.getByTestId("port-connection");
    expect(svg.style.pointerEvents).toBe("none");
  });

  it("generates different paths for different port positions", () => {
    const { unmount } = render(
      <PortConnection from={fromPort} to={toPort} viewport={viewport} />,
    );
    const path1 = screen.getByTestId("port-connection-path").getAttribute("d");
    unmount();

    const altTo: ConnectorPortOnItem = {
      port: { id: "top", edge: "top", position: 0.5 },
      itemPosition: { x: 300, y: 100 },
      itemWidth: 100,
      itemHeight: 50,
    };
    render(<PortConnection from={fromPort} to={altTo} viewport={viewport} />);
    const path2 = screen.getByTestId("port-connection-path").getAttribute("d");

    expect(path1).not.toBe(path2);
  });

  it("respects viewport offset", () => {
    const vpOffset: ViewportState = { offsetX: 100, offsetY: 50, scale: 1 };
    render(<PortConnection from={fromPort} to={toPort} viewport={vpOffset} />);

    const path = screen.getByTestId("port-connection-path");
    const d = path.getAttribute("d") ?? "";
    // The path should contain offset start position
    // from port right edge: world (150, 125) -> screen (250, 175)
    expect(d).toContain("M 250 175");
  });

  it("does not render hit area when onClick is not provided", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);
    expect(
      screen.queryByTestId("port-connection-hit-area"),
    ).not.toBeInTheDocument();
  });

  it("renders hit area when onClick is provided", () => {
    const handleClick = vi.fn();
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        onClick={handleClick}
      />,
    );
    const hitArea = screen.getByTestId("port-connection-hit-area");
    expect(hitArea).toBeInTheDocument();
    expect(hitArea.getAttribute("stroke")).toBe("transparent");
  });

  it("calls onClick with screen coordinates when hit area is clicked", () => {
    const handleClick = vi.fn();
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        onClick={handleClick}
      />,
    );
    const hitArea = screen.getByTestId("port-connection-hit-area");
    fireEvent.click(hitArea, { clientX: 200, clientY: 100 });
    expect(handleClick).toHaveBeenCalledOnce();
    expect(handleClick).toHaveBeenCalledWith(200, 100);
  });

  it("hit area has pointer cursor style", () => {
    const handleClick = vi.fn();
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        onClick={handleClick}
      />,
    );
    const hitArea = screen.getByTestId("port-connection-hit-area");
    expect(hitArea.style.cursor).toBe("pointer");
  });

  it("hit area stops pointer event propagation", () => {
    const handleClick = vi.fn();
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        onClick={handleClick}
      />,
    );
    const hitArea = screen.getByTestId("port-connection-hit-area");
    const pointerEvent = new PointerEvent("pointerdown", { bubbles: true });
    vi.spyOn(pointerEvent, "stopPropagation");
    hitArea.dispatchEvent(pointerEvent);
    expect(pointerEvent.stopPropagation).toHaveBeenCalled();
  });

  it("renders hit area when only onContextMenu is provided", () => {
    const handleContextMenu = vi.fn();
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        onContextMenu={handleContextMenu}
      />,
    );
    const hitArea = screen.getByTestId("port-connection-hit-area");
    expect(hitArea).toBeInTheDocument();
  });

  it("calls onContextMenu with screen coordinates on right-click", () => {
    const handleContextMenu = vi.fn();
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        onContextMenu={handleContextMenu}
      />,
    );
    const hitArea = screen.getByTestId("port-connection-hit-area");
    fireEvent.contextMenu(hitArea, { clientX: 150, clientY: 80 });
    expect(handleContextMenu).toHaveBeenCalledOnce();
    expect(handleContextMenu).toHaveBeenCalledWith(150, 80);
  });

  it("prevents default and stops propagation on context menu", () => {
    const handleContextMenu = vi.fn();
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        onContextMenu={handleContextMenu}
      />,
    );
    const hitArea = screen.getByTestId("port-connection-hit-area");
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      clientX: 150,
      clientY: 80,
      cancelable: true,
    });
    vi.spyOn(event, "preventDefault");
    vi.spyOn(event, "stopPropagation");
    hitArea.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("does not render label when label prop is not provided", () => {
    render(<PortConnection from={fromPort} to={toPort} viewport={viewport} />);
    expect(
      screen.queryByTestId("port-connection-label"),
    ).not.toBeInTheDocument();
  });

  it("renders label at the midpoint of the connection", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        label={<span>MP</span>}
      />,
    );
    const label = screen.getByTestId("port-connection-label");
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe("MP");
  });

  it("label has absolute positioning and centering transform", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        label={<span>Test</span>}
      />,
    );
    const label = screen.getByTestId("port-connection-label");
    expect(label.style.position).toBe("absolute");
    expect(label.style.transform).toBe("translate(-50%, -50%)");
  });

  it("label has pointer-events auto for interaction", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        label={<span>Test</span>}
      />,
    );
    const label = screen.getByTestId("port-connection-label");
    expect(label.style.pointerEvents).toBe("auto");
  });

  it("renders complex label content (parameter panel)", () => {
    render(
      <PortConnection
        from={fromPort}
        to={toPort}
        viewport={viewport}
        label={
          <div data-testid="param-panel">
            <span>σ = [φ/ψ]</span>
            <button>Edit</button>
          </div>
        }
      />,
    );
    expect(screen.getByTestId("param-panel")).toBeInTheDocument();
    expect(screen.getByText("σ = [φ/ψ]")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});
