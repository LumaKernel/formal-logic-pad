import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectorPortComponent } from "./ConnectorPortComponent";
import type { ViewportState } from "./types";

afterEach(cleanup);

const viewport: ViewportState = { offsetX: 0, offsetY: 0, scale: 1 };

describe("ConnectorPortComponent", () => {
  it("renders a port element with correct test id", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 100, y: 100 }}
        itemWidth={80}
        itemHeight={40}
        viewport={viewport}
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    expect(port).toBeInTheDocument();
  });

  it("positions port at the correct screen position (top edge center)", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 100, y: 200 }}
        itemWidth={120}
        itemHeight={60}
        viewport={viewport}
        radius={5}
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    // World pos: x=160, y=200; screen = same at scale 1
    // Element left = 160 - 5 = 155, top = 200 - 5 = 195
    expect(port.style.left).toBe("155px");
    expect(port.style.top).toBe("195px");
  });

  it("positions port at right edge center", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "right", edge: "right", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
        radius={5}
      />,
    );

    const port = screen.getByTestId("connector-port-right");
    // World pos: x=100, y=25
    expect(port.style.left).toBe("95px");
    expect(port.style.top).toBe("20px");
  });

  it("respects viewport offset", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 100, y: 100 }}
        itemWidth={80}
        itemHeight={40}
        viewport={{ offsetX: 50, offsetY: 30, scale: 1 }}
        radius={5}
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    // World: x=140, y=100 -> Screen: x=190, y=130
    // left = 190-5=185, top = 130-5=125
    expect(port.style.left).toBe("185px");
    expect(port.style.top).toBe("125px");
  });

  it("scales port size with viewport scale", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={{ offsetX: 0, offsetY: 0, scale: 2 }}
        radius={5}
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    // radius * scale = 5 * 2 = 10, so width = 20
    expect(port.style.width).toBe("20px");
    expect(port.style.height).toBe("20px");
  });

  it("has crosshair cursor", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "left", edge: "left", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
      />,
    );

    const port = screen.getByTestId("connector-port-left");
    expect(port.style.cursor).toBe("crosshair");
  });

  it("calls onPortClick when clicked", () => {
    const onPortClick = vi.fn();
    render(
      <ConnectorPortComponent
        port={{ id: "right", edge: "right", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
        onPortClick={onPortClick}
      />,
    );

    const port = screen.getByTestId("connector-port-right");
    fireEvent.click(port);
    expect(onPortClick).toHaveBeenCalledWith("right");
  });

  it("stops event propagation on click", () => {
    const parentHandler = vi.fn();
    render(
      <div onClick={parentHandler}>
        <ConnectorPortComponent
          port={{ id: "top", edge: "top", position: 0.5 }}
          itemPosition={{ x: 0, y: 0 }}
          itemWidth={100}
          itemHeight={50}
          viewport={viewport}
        />
      </div>,
    );

    const port = screen.getByTestId("connector-port-top");
    fireEvent.click(port);
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("applies highlighted styling when highlighted", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
        radius={5}
        highlighted={true}
        borderColor="#ff0000"
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    // Highlighted: radius * scale * 1.4 = 5 * 1 * 1.4 = 7
    expect(port.style.width).toBe("14px");
    expect(port.style.height).toBe("14px");
    expect(port.style.backgroundColor).toBe("rgb(255, 0, 0)");
  });

  it("renders without onPortClick", () => {
    render(
      <ConnectorPortComponent
        port={{ id: "bottom", edge: "bottom", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
      />,
    );

    const port = screen.getByTestId("connector-port-bottom");
    // Should not throw when clicked without handler
    fireEvent.click(port);
    expect(port).toBeInTheDocument();
  });

  it("calls onPortDragStart on pointerDown with left button", () => {
    const onPortDragStart = vi.fn();
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
        onPortDragStart={onPortDragStart}
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    fireEvent.pointerDown(port, { button: 0, clientX: 50, clientY: 0 });
    expect(onPortDragStart).toHaveBeenCalledWith("top", 50, 0);
  });

  it("does not call onPortDragStart on right-click", () => {
    const onPortDragStart = vi.fn();
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
        onPortDragStart={onPortDragStart}
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    fireEvent.pointerDown(port, { button: 2 });
    expect(onPortDragStart).not.toHaveBeenCalled();
  });

  it("stops propagation on pointerDown when onPortDragStart is set", () => {
    const parentHandler = vi.fn();
    const onPortDragStart = vi.fn();
    render(
      <div onPointerDown={parentHandler}>
        <ConnectorPortComponent
          port={{ id: "top", edge: "top", position: 0.5 }}
          itemPosition={{ x: 0, y: 0 }}
          itemWidth={100}
          itemHeight={50}
          viewport={viewport}
          onPortDragStart={onPortDragStart}
        />
      </div>,
    );

    const port = screen.getByTestId("connector-port-top");
    fireEvent.pointerDown(port, { button: 0 });
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("calls onPortClick on click", () => {
    const onPortClick = vi.fn();
    render(
      <ConnectorPortComponent
        port={{ id: "top", edge: "top", position: 0.5 }}
        itemPosition={{ x: 0, y: 0 }}
        itemWidth={100}
        itemHeight={50}
        viewport={viewport}
        onPortClick={onPortClick}
      />,
    );

    const port = screen.getByTestId("connector-port-top");
    fireEvent.click(port);
    expect(onPortClick).toHaveBeenCalledWith("top");
  });

  it("stops click propagation to parent", () => {
    const parentHandler = vi.fn();
    render(
      <div onClick={parentHandler}>
        <ConnectorPortComponent
          port={{ id: "top", edge: "top", position: 0.5 }}
          itemPosition={{ x: 0, y: 0 }}
          itemWidth={100}
          itemHeight={50}
          viewport={viewport}
        />
      </div>,
    );

    const port = screen.getByTestId("connector-port-top");
    fireEvent.click(port);
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("does not stop propagation when onPortDragStart is not set", () => {
    const parentHandler = vi.fn();
    render(
      <div onPointerDown={parentHandler}>
        <ConnectorPortComponent
          port={{ id: "top", edge: "top", position: 0.5 }}
          itemPosition={{ x: 0, y: 0 }}
          itemWidth={100}
          itemHeight={50}
          viewport={viewport}
        />
      </div>,
    );

    const port = screen.getByTestId("connector-port-top");
    fireEvent.pointerDown(port, { button: 0 });
    expect(parentHandler).toHaveBeenCalled();
  });
});
