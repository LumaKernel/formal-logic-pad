import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EdgeScrollIndicator } from "./EdgeScrollIndicator";

afterEach(cleanup);

describe("EdgeScrollIndicator", () => {
  it("returns null when edgePenetration is null", () => {
    const { container } = render(
      <EdgeScrollIndicator edgePenetration={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when all penetrations are zero", () => {
    const { container } = render(
      <EdgeScrollIndicator
        edgePenetration={{ top: 0, right: 0, bottom: 0, left: 0 }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders shadow overlay when left penetration is active", () => {
    render(
      <EdgeScrollIndicator
        edgePenetration={{ top: 0, right: 0, bottom: 0, left: 0.5 }}
      />,
    );
    const indicator = screen.getByTestId("edge-scroll-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator.style.boxShadow).toContain("inset");
  });

  it("renders shadow overlay when multiple edges are active", () => {
    render(
      <EdgeScrollIndicator
        edgePenetration={{ top: 0.3, right: 0.7, bottom: 0, left: 0 }}
      />,
    );
    const indicator = screen.getByTestId("edge-scroll-indicator");
    expect(indicator).toBeInTheDocument();
    // Multiple shadows joined by comma
    expect(indicator.style.boxShadow).toContain(",");
  });

  it("has pointer-events none to avoid blocking interactions", () => {
    render(
      <EdgeScrollIndicator
        edgePenetration={{ top: 1, right: 0, bottom: 0, left: 0 }}
      />,
    );
    const indicator = screen.getByTestId("edge-scroll-indicator");
    expect(indicator.style.pointerEvents).toBe("none");
  });
});
