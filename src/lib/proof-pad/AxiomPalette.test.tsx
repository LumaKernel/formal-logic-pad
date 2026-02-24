import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiomPalette } from "./AxiomPalette";
import { getAvailableAxioms, type AxiomPaletteItem } from "./axiomPaletteLogic";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";

const defaultAxioms = getAvailableAxioms(lukasiewiczSystem);

describe("AxiomPalette", () => {
  it("renders axiom list with header", () => {
    render(
      <AxiomPalette
        axioms={defaultAxioms}
        onAddAxiom={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("Axioms")).toBeInTheDocument();
    expect(screen.getByText("A1 (K)")).toBeInTheDocument();
    expect(screen.getByText("A2 (S)")).toBeInTheDocument();
    expect(screen.getByText("A3")).toBeInTheDocument();
  });

  it("displays unicode formula for each axiom", () => {
    render(
      <AxiomPalette
        axioms={defaultAxioms}
        onAddAxiom={() => {}}
        testId="palette"
      />,
    );
    // A1 formula should contain →
    const a1Item = screen.getByTestId("palette-item-A1");
    expect(a1Item.textContent).toContain("→");
  });

  it("calls onAddAxiom when axiom item is clicked", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <AxiomPalette
        axioms={defaultAxioms}
        onAddAxiom={handleAdd}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-item-A1"));
    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd.mock.calls[0][0].id).toBe("A1");
  });

  it("calls onAddAxiom on Enter key press", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <AxiomPalette
        axioms={defaultAxioms}
        onAddAxiom={handleAdd}
        testId="palette"
      />,
    );
    const item = screen.getByTestId("palette-item-A2");
    item.focus();
    await user.keyboard("{Enter}");
    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd.mock.calls[0][0].id).toBe("A2");
  });

  it("calls onAddAxiom on Space key press", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <AxiomPalette
        axioms={defaultAxioms}
        onAddAxiom={handleAdd}
        testId="palette"
      />,
    );
    const item = screen.getByTestId("palette-item-A3");
    item.focus();
    await user.keyboard(" ");
    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd.mock.calls[0][0].id).toBe("A3");
  });

  it("renders nothing for empty axiom list", () => {
    const { container } = render(
      <AxiomPalette axioms={[]} onAddAxiom={() => {}} testId="palette" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("passes correct axiom data to onAddAxiom callback", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <AxiomPalette
        axioms={defaultAxioms}
        onAddAxiom={handleAdd}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-item-A1"));
    const addedAxiom = handleAdd.mock.calls[0][0] as AxiomPaletteItem;
    expect(addedAxiom.id).toBe("A1");
    expect(addedAxiom.displayName).toBe("A1 (K)");
    expect(addedAxiom.dslText).toBe("phi -> (psi -> phi)");
    expect(addedAxiom.template._tag).toBe("Implication");
  });

  it("each axiom item has role=button and tabIndex=0", () => {
    render(
      <AxiomPalette
        axioms={defaultAxioms}
        onAddAxiom={() => {}}
        testId="palette"
      />,
    );
    const item = screen.getByTestId("palette-item-A1");
    expect(item.getAttribute("role")).toBe("button");
    expect(item.getAttribute("tabindex")).toBe("0");
  });
});
