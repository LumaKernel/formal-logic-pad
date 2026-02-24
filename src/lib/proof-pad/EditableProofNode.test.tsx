import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditableProofNode } from "./EditableProofNode";
import type { ProofNodeKind } from "./proofNodeUI";

afterEach(cleanup);

// --- ヘルパー ---

function renderNode(
  overrides?: Partial<React.ComponentProps<typeof EditableProofNode>>,
) {
  const defaultProps = {
    id: "node-1",
    kind: "axiom" as ProofNodeKind,
    label: "A1",
    formulaText: "φ → (ψ → φ)",
    onFormulaTextChange: vi.fn(),
    testId: "test-node",
  };
  return render(<EditableProofNode {...defaultProps} {...overrides} />);
}

/** 状態管理付きラッパー（onParsedなど副作用テスト用） */
function StatefulWrapper(props: {
  readonly initialText: string;
  readonly onFormulaParsed?: React.ComponentProps<
    typeof EditableProofNode
  >["onFormulaParsed"];
  readonly onFormulaTextChange?: React.ComponentProps<
    typeof EditableProofNode
  >["onFormulaTextChange"];
}) {
  const [text, setText] = React.useState(props.initialText);
  return (
    <EditableProofNode
      id="node-1"
      kind="axiom"
      label="A1"
      formulaText={text}
      onFormulaTextChange={(_id, newText) => {
        setText(newText);
        props.onFormulaTextChange?.(_id, newText);
      }}
      onFormulaParsed={props.onFormulaParsed}
      testId="test-node"
    />
  );
}

describe("EditableProofNode", () => {
  describe("表示モード（デフォルト）", () => {
    it("ノードのラベルが表示される", () => {
      renderNode();
      expect(screen.getByText("A1")).toBeInTheDocument();
    });

    it("論理式がUnicodeレンダリングで表示される", () => {
      renderNode();
      // FormulaEditor display mode: パースされた式がUnicodeで表示
      const display = screen.getByTestId("test-node-editor-display");
      expect(display).toBeInTheDocument();
    });

    it("data-testidが正しく設定される", () => {
      renderNode();
      expect(screen.getByTestId("test-node")).toBeInTheDocument();
    });
  });

  describe("種別ごとのスタイル", () => {
    it.each<{ readonly kind: ProofNodeKind; readonly color: string }>([
      { kind: "axiom", color: "#5b8bd9" },
      { kind: "mp", color: "#d9944a" },
      { kind: "conclusion", color: "#4ad97a" },
    ])("kind=$kind でbackground=$colorが適用される", ({ kind, color }) => {
      renderNode({ kind, label: kind.toUpperCase() });
      const node = screen.getByTestId("test-node");
      expect(node).toHaveStyle({ background: color });
    });
  });

  describe("編集モード", () => {
    it("クリックで編集モードに入れる", async () => {
      const user = userEvent.setup();
      renderNode();
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      expect(screen.getByTestId("test-node-editor-edit")).toBeInTheDocument();
    });

    it("編集中にテキストを変更するとonFormulaTextChangeが呼ばれる", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderNode({ onFormulaTextChange: onChange });
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      const input = screen.getByTestId("test-node-editor-input-input");
      await user.clear(input);
      await user.type(input, "φ ∧ ψ");
      // onChange should have been called with (id, text)
      expect(onChange).toHaveBeenCalled();
      // The last call should include the node id
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall?.[0]).toBe("node-1");
    });

    it("Escapeで表示モードに戻る", async () => {
      const user = userEvent.setup();
      renderNode();
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      expect(screen.getByTestId("test-node-editor-edit")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(
        screen.getByTestId("test-node-editor-display"),
      ).toBeInTheDocument();
    });
  });

  describe("onModeChange", () => {
    it("編集モードに入るとonModeChangeが呼ばれる", async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      renderNode({ onModeChange });
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      expect(onModeChange).toHaveBeenCalledWith("node-1", "editing");
    });

    it("表示モードに戻るとonModeChangeが呼ばれる", async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      renderNode({ onModeChange });
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      await user.keyboard("{Escape}");
      expect(onModeChange).toHaveBeenCalledWith("node-1", "display");
    });
  });

  describe("onFormulaParsed", () => {
    it("パース成功時にonFormulaParsedが呼ばれる", async () => {
      const user = userEvent.setup();
      const onParsed = vi.fn();
      render(<StatefulWrapper initialText="" onFormulaParsed={onParsed} />);
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      const input = screen.getByTestId("test-node-editor-input-input");
      await user.type(input, "φ");
      // onParsed is called via useEffect + useDeferredValue, so we need waitFor
      await waitFor(() => {
        expect(onParsed).toHaveBeenCalled();
      });
      const lastCall = onParsed.mock.calls[onParsed.mock.calls.length - 1];
      expect(lastCall?.[0]).toBe("node-1");
      // The second argument should be a Formula object (has _tag)
      expect(lastCall?.[1]).toBeDefined();
    });
  });

  describe("editable=false", () => {
    it("読み取り専用で表示される", () => {
      renderNode({ editable: false });
      expect(screen.getByTestId("test-node-formula")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-formula")).toHaveTextContent(
        "φ → (ψ → φ)",
      );
    });

    it("FormulaEditorが表示されない", () => {
      renderNode({ editable: false });
      expect(
        screen.queryByTestId("test-node-editor-display"),
      ).not.toBeInTheDocument();
    });
  });

  describe("各ノード種別", () => {
    it("MPノードが正しくレンダリングされる", () => {
      renderNode({
        kind: "mp",
        label: "MP",
        formulaText: "(φ→(φ→φ)) → (φ→φ)",
      });
      expect(screen.getByText("MP")).toBeInTheDocument();
    });

    it("conclusionノードが正しくレンダリングされる", () => {
      renderNode({
        kind: "conclusion",
        label: "φ→φ",
        formulaText: "φ → φ",
      });
      expect(screen.getByText("φ→φ")).toBeInTheDocument();
    });
  });
});
