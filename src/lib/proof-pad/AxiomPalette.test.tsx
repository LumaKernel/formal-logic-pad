import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiomPalette } from "./AxiomPalette";
import { getAvailableAxioms, type AxiomPaletteItem } from "./axiomPaletteLogic";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import { allReferenceEntries } from "../reference/referenceContent";

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

  it("testIdなしでも正常にレンダリングされる", () => {
    const { container } = render(
      <AxiomPalette axioms={defaultAxioms} onAddAxiom={() => {}} />,
    );
    expect(container.textContent).toContain("Axioms");
    expect(container.textContent).toContain("A1 (K)");
  });

  describe("リファレンスポップオーバー統合", () => {
    it("referenceEntries指定時に(?)ボタンが表示される", () => {
      render(
        <AxiomPalette
          axioms={defaultAxioms}
          onAddAxiom={() => {}}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="palette"
        />,
      );
      const refTrigger = screen.getByTestId("palette-item-A1-ref-trigger");
      expect(refTrigger).toBeInTheDocument();
      expect(refTrigger.textContent).toBe("?");
    });

    it("各公理にリファレンスポップオーバーが表示される", () => {
      render(
        <AxiomPalette
          axioms={defaultAxioms}
          onAddAxiom={() => {}}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="palette"
        />,
      );
      // A1, A2, A3 すべてにリファレンスボタンがある
      expect(
        screen.getByTestId("palette-item-A1-ref-trigger"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("palette-item-A2-ref-trigger"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("palette-item-A3-ref-trigger"),
      ).toBeInTheDocument();
    });

    it("(?)クリックでポップオーバーが開く（親の公理追加は発火しない）", async () => {
      const user = userEvent.setup();
      const handleAdd = vi.fn();
      render(
        <AxiomPalette
          axioms={defaultAxioms}
          onAddAxiom={handleAdd}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="palette"
        />,
      );
      await user.click(screen.getByTestId("palette-item-A1-ref-trigger"));
      // ポップオーバーが表示される
      expect(
        screen.getByTestId("palette-item-A1-ref-popover"),
      ).toBeInTheDocument();
      // 公理追加は発火していない
      expect(handleAdd).not.toHaveBeenCalled();
    });

    it("referenceEntries指定だがlocale未指定時は(?)ボタンが非表示", () => {
      render(
        <AxiomPalette
          axioms={defaultAxioms}
          onAddAxiom={() => {}}
          referenceEntries={allReferenceEntries}
          testId="palette"
        />,
      );
      expect(screen.queryByTestId("palette-item-A1-ref-trigger")).toBeNull();
    });

    it("referenceEntries未指定時は(?)ボタンが非表示", () => {
      render(
        <AxiomPalette
          axioms={defaultAxioms}
          onAddAxiom={() => {}}
          testId="palette"
        />,
      );
      expect(screen.queryByTestId("palette-item-A1-ref-trigger")).toBeNull();
    });

    it("英語ロケールでもリファレンスが表示される", () => {
      render(
        <AxiomPalette
          axioms={defaultAxioms}
          onAddAxiom={() => {}}
          referenceEntries={allReferenceEntries}
          locale="en"
          testId="palette"
        />,
      );
      expect(
        screen.getByTestId("palette-item-A1-ref-trigger"),
      ).toBeInTheDocument();
    });

    it("onOpenReferenceDetailが呼ばれる", async () => {
      const user = userEvent.setup();
      const handleDetail = vi.fn();
      render(
        <AxiomPalette
          axioms={defaultAxioms}
          onAddAxiom={() => {}}
          referenceEntries={allReferenceEntries}
          locale="ja"
          onOpenReferenceDetail={handleDetail}
          testId="palette"
        />,
      );
      // ポップオーバーを開く
      await user.click(screen.getByTestId("palette-item-A1-ref-trigger"));
      // 「詳しく見る」ボタンをクリック
      const detailBtn = screen.getByTestId("palette-item-A1-ref-detail-btn");
      await user.click(detailBtn);
      expect(handleDetail).toHaveBeenCalledWith("axiom-a1");
    });
  });
});
