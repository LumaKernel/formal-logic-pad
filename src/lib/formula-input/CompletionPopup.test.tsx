import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CompletionCandidate } from "./inputCompletion";
import { CompletionPopup } from "./CompletionPopup";

const mockCandidates: readonly CompletionCandidate[] = [
  {
    label: "→ (implies)",
    insertText: "→",
    category: "operator",
    trigger: "->",
  },
  {
    label: "φ (phi)",
    insertText: "φ",
    category: "greek",
    trigger: "phi",
  },
  {
    label: "∀. (forall)",
    insertText: "∀",
    category: "quantifier",
    trigger: "all",
  },
];

describe("CompletionPopup", () => {
  describe("基本的なレンダリング", () => {
    it("候補リストを表示する", () => {
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      expect(screen.getByTestId("cp")).toBeInTheDocument();
      expect(screen.getByTestId("cp")).toHaveAttribute("role", "listbox");
    });

    it("各候補アイテムを表示する", () => {
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      expect(screen.getByTestId("cp-item-0")).toBeInTheDocument();
      expect(screen.getByTestId("cp-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("cp-item-2")).toBeInTheDocument();
    });

    it("候補ラベルを表示する", () => {
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      expect(screen.getByTestId("cp-item-0")).toHaveTextContent("→ (implies)");
      expect(screen.getByTestId("cp-item-1")).toHaveTextContent("φ (phi)");
      expect(screen.getByTestId("cp-item-2")).toHaveTextContent("∀. (forall)");
    });

    it("カテゴリバッジを表示する", () => {
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      expect(screen.getByTestId("cp-item-0")).toHaveTextContent("演算子");
      expect(screen.getByTestId("cp-item-1")).toHaveTextContent("文字");
      expect(screen.getByTestId("cp-item-2")).toHaveTextContent("量化子");
    });

    it("空候補でnullを返す", () => {
      const { container } = render(
        <CompletionPopup
          candidates={[]}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("選択状態", () => {
    it("selectedIndex のアイテムに aria-selected=true", () => {
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={1}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      expect(screen.getByTestId("cp-item-0")).toHaveAttribute(
        "aria-selected",
        "false",
      );
      expect(screen.getByTestId("cp-item-1")).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByTestId("cp-item-2")).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("各アイテムに role=option", () => {
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      expect(screen.getByTestId("cp-item-0")).toHaveAttribute("role", "option");
    });
  });

  describe("マウスインタラクション", () => {
    it("マウスダウンで onSelect が呼ばれる", () => {
      const onSelect = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={onSelect}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.mouseDown(screen.getByTestId("cp-item-1"));
      expect(onSelect).toHaveBeenCalledWith(mockCandidates[1]);
    });

    it("マウスエンターで onSelectedIndexChange が呼ばれる", () => {
      const onSelectedIndexChange = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={onSelectedIndexChange}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.mouseEnter(screen.getByTestId("cp-item-2"));
      expect(onSelectedIndexChange).toHaveBeenCalledWith(2);
    });
  });

  describe("キーボードインタラクション", () => {
    it("ArrowDown で次の候補に移動", () => {
      const onSelectedIndexChange = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={onSelectedIndexChange}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(onSelectedIndexChange).toHaveBeenCalledWith(1);
    });

    it("ArrowDown で末尾から先頭にラップ", () => {
      const onSelectedIndexChange = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={2}
          onSelect={() => {}}
          onSelectedIndexChange={onSelectedIndexChange}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(onSelectedIndexChange).toHaveBeenCalledWith(0);
    });

    it("ArrowUp で前の候補に移動", () => {
      const onSelectedIndexChange = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={1}
          onSelect={() => {}}
          onSelectedIndexChange={onSelectedIndexChange}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.keyDown(document, { key: "ArrowUp" });
      expect(onSelectedIndexChange).toHaveBeenCalledWith(0);
    });

    it("ArrowUp で先頭から末尾にラップ", () => {
      const onSelectedIndexChange = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={onSelectedIndexChange}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.keyDown(document, { key: "ArrowUp" });
      expect(onSelectedIndexChange).toHaveBeenCalledWith(2);
    });

    it("Tab で候補を選択", () => {
      const onSelect = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={1}
          onSelect={onSelect}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.keyDown(document, { key: "Tab" });
      expect(onSelect).toHaveBeenCalledWith(mockCandidates[1]);
    });

    it("Enter で候補を選択", () => {
      const onSelect = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={onSelect}
          onSelectedIndexChange={() => {}}
          onClose={() => {}}
          testId="cp"
        />,
      );
      fireEvent.keyDown(document, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith(mockCandidates[0]);
    });

    it("Escape でポップアップを閉じる", () => {
      const onClose = vi.fn();
      render(
        <CompletionPopup
          candidates={mockCandidates}
          selectedIndex={0}
          onSelect={() => {}}
          onSelectedIndexChange={() => {}}
          onClose={onClose}
          testId="cp"
        />,
      );
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
