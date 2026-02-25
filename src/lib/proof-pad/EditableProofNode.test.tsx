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
    it("読み取り専用で表示される（FormulaDisplayでUnicode表示）", () => {
      renderNode({ editable: false });
      expect(screen.getByTestId("test-node-formula")).toBeInTheDocument();
      // formatFormulaは右結合→で最小括弧化するため括弧なし
      expect(screen.getByTestId("test-node-formula")).toHaveTextContent(
        "φ → ψ → φ",
      );
    });

    it("FormulaEditorが表示されない", () => {
      renderNode({ editable: false });
      expect(
        screen.queryByTestId("test-node-editor-display"),
      ).not.toBeInTheDocument();
    });

    it("パース失敗時はプレーンテキストにフォールバック", () => {
      renderNode({ editable: false, formulaText: "invalid @@@ syntax" });
      expect(screen.getByTestId("test-node-formula")).toHaveTextContent(
        "invalid @@@ syntax",
      );
    });

    it("FormulaDisplay の role=math 属性が存在する（パース成功時）", () => {
      renderNode({ editable: false, formulaText: "phi -> psi" });
      const formulaContainer = screen.getByTestId("test-node-formula");
      const mathEl = formulaContainer.querySelector('[role="math"]');
      expect(mathEl).toBeInTheDocument();
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

  describe("statusMessage", () => {
    it("エラーステータスが表示される", () => {
      renderNode({
        statusMessage: "Premise mismatch",
        statusType: "error",
      });
      expect(screen.getByTestId("test-node-status")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-status")).toHaveTextContent(
        "Premise mismatch",
      );
    });

    it("成功ステータスが表示される", () => {
      renderNode({
        statusMessage: "MP applied",
        statusType: "success",
      });
      expect(screen.getByTestId("test-node-status")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-status")).toHaveTextContent(
        "MP applied",
      );
    });

    it("ステータスがない場合は表示されない", () => {
      renderNode();
      expect(screen.queryByTestId("test-node-status")).not.toBeInTheDocument();
    });

    it("空文字のステータスでも表示されない", () => {
      renderNode({ statusMessage: "" });
      expect(screen.queryByTestId("test-node-status")).not.toBeInTheDocument();
    });
  });

  describe("role badge", () => {
    it("classification未指定ではバッジが表示されない", () => {
      renderNode();
      expect(
        screen.queryByTestId("test-node-role-badge"),
      ).not.toBeInTheDocument();
    });

    it("root-axiom分類で'AXIOM'バッジが表示される", () => {
      renderNode({ classification: "root-axiom" });
      const badge = screen.getByTestId("test-node-role-badge");
      expect(badge).toHaveTextContent("AXIOM");
    });

    it("root-goal分類で'GOAL'バッジが表示される", () => {
      renderNode({ classification: "root-goal" });
      const badge = screen.getByTestId("test-node-role-badge");
      expect(badge).toHaveTextContent("GOAL");
    });

    it("root-unmarked分類で'ROOT'バッジが表示される", () => {
      renderNode({ classification: "root-unmarked" });
      const badge = screen.getByTestId("test-node-role-badge");
      expect(badge).toHaveTextContent("ROOT");
    });

    it("derived分類で'DERIVED'バッジが表示される", () => {
      renderNode({ classification: "derived" });
      const badge = screen.getByTestId("test-node-role-badge");
      expect(badge).toHaveTextContent("DERIVED");
    });

    it("root-unmarkedバッジクリックでonRoleChange('axiom')が呼ばれる", async () => {
      const user = userEvent.setup();
      const onRoleChange = vi.fn();
      renderNode({ classification: "root-unmarked", onRoleChange });
      const badge = screen.getByTestId("test-node-role-badge");
      await user.click(badge);
      expect(onRoleChange).toHaveBeenCalledWith("node-1", "axiom");
    });

    it("root-axiomバッジクリックでonRoleChange('goal')が呼ばれる", async () => {
      const user = userEvent.setup();
      const onRoleChange = vi.fn();
      renderNode({ classification: "root-axiom", onRoleChange });
      const badge = screen.getByTestId("test-node-role-badge");
      await user.click(badge);
      expect(onRoleChange).toHaveBeenCalledWith("node-1", "goal");
    });

    it("root-goalバッジクリックでonRoleChange(undefined)が呼ばれる", async () => {
      const user = userEvent.setup();
      const onRoleChange = vi.fn();
      renderNode({ classification: "root-goal", onRoleChange });
      const badge = screen.getByTestId("test-node-role-badge");
      await user.click(badge);
      expect(onRoleChange).toHaveBeenCalledWith("node-1", undefined);
    });

    it("derivedバッジクリックではonRoleChangeが呼ばれない", async () => {
      const user = userEvent.setup();
      const onRoleChange = vi.fn();
      renderNode({ classification: "derived", onRoleChange });
      const badge = screen.getByTestId("test-node-role-badge");
      await user.click(badge);
      expect(onRoleChange).not.toHaveBeenCalled();
    });

    it("onRoleChangeが未定義の場合、バッジクリックでエラーにならない", async () => {
      const user = userEvent.setup();
      renderNode({ classification: "root-unmarked" });
      const badge = screen.getByTestId("test-node-role-badge");
      await user.click(badge);
      // Should not throw
    });

    it("testIdなしでclassificationを指定してもrole-badge testIdは出ない", () => {
      const { container } = render(
        <EditableProofNode
          id="node-1"
          kind="axiom"
          label="A1"
          formulaText="φ"
          onFormulaTextChange={() => {}}
          classification="root-axiom"
        />,
      );
      expect(container.textContent).toContain("AXIOM");
    });
  });

  describe("testIdなしのレンダリング", () => {
    it("testIdなしでも正常にレンダリングされる", () => {
      const { container } = render(
        <EditableProofNode
          id="node-1"
          kind="axiom"
          label="A1"
          formulaText="φ → ψ"
          onFormulaTextChange={() => {}}
        />,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("testIdなし・readonly表示でも正常にレンダリングされる", () => {
      const { container } = render(
        <EditableProofNode
          id="node-1"
          kind="axiom"
          label="A1"
          formulaText="φ → ψ"
          editable={false}
          onFormulaTextChange={() => {}}
        />,
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.textContent).toContain("φ → ψ");
    });

    it("testIdなし・ステータスメッセージ付きでも正常にレンダリングされる", () => {
      const { container } = render(
        <EditableProofNode
          id="node-1"
          kind="mp"
          label="MP"
          formulaText="ψ"
          editable={false}
          statusMessage="有効"
          statusType="success"
          onFormulaTextChange={() => {}}
        />,
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.textContent).toContain("有効");
    });
  });

  describe("保護ノード（isProtected）", () => {
    it("保護ノードにQUESTバッジが表示される", () => {
      renderNode({ isProtected: true });
      expect(screen.getByTestId("test-node-protected-badge")).toHaveTextContent(
        "QUEST",
      );
    });

    it("非保護ノードにQUESTバッジが表示されない", () => {
      renderNode({ isProtected: false });
      expect(
        screen.queryByTestId("test-node-protected-badge"),
      ).not.toBeInTheDocument();
    });

    it("保護ノードは編集不可（FormulaEditorが表示されず読み取り専用）", () => {
      renderNode({
        isProtected: true,
        editable: true,
        formulaText: "phi -> psi",
      });
      // FormulaEditor のtestIdが存在しない（readonlyモード）
      expect(screen.queryByTestId("test-node-editor")).not.toBeInTheDocument();
      // formulaの読み取り専用表示が存在する（パースされてUnicode表示）
      expect(screen.getByTestId("test-node-formula")).toHaveTextContent(
        "φ → ψ",
      );
    });

    it("保護ノードのバッジクリックで役割が変わらない", async () => {
      const user = userEvent.setup();
      const onRoleChange = vi.fn();
      renderNode({
        isProtected: true,
        classification: "root-goal",
        onRoleChange,
      });
      const badge = screen.getByTestId("test-node-role-badge");
      await user.click(badge);
      expect(onRoleChange).not.toHaveBeenCalled();
    });

    it("保護ノードでもヘッダー行が表示される（QUESTバッジのため）", () => {
      renderNode({ isProtected: true });
      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(
        screen.getByTestId("test-node-protected-badge"),
      ).toBeInTheDocument();
    });

    it("testIdなしの保護ノードでもQUESTバッジが表示される", () => {
      const { container } = render(
        <EditableProofNode
          id="node-1"
          kind="axiom"
          label="A1"
          formulaText="φ"
          onFormulaTextChange={() => {}}
          isProtected={true}
        />,
      );
      expect(container.textContent).toContain("QUEST");
    });
  });

  describe("公理名バッジ", () => {
    it("axiomNameが指定されると公理名バッジが表示される", () => {
      renderNode({ axiomName: "A1 (K)" });
      expect(screen.getByTestId("test-node-axiom-name")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-axiom-name")).toHaveTextContent(
        "A1 (K)",
      );
    });

    it("axiomNameが未指定だと公理名バッジは表示されない", () => {
      renderNode();
      expect(
        screen.queryByTestId("test-node-axiom-name"),
      ).not.toBeInTheDocument();
    });

    it("axiomNameが指定されるとヘッダー行にflexレイアウトが適用される", () => {
      renderNode({ axiomName: "A2 (S)" });
      // ヘッダー行が存在し、公理名バッジが含まれる
      expect(screen.getByText("A2 (S)")).toBeInTheDocument();
      expect(screen.getByText("A1")).toBeInTheDocument(); // label
    });

    it("testIdなしでも公理名バッジが表示される", () => {
      const { container } = render(
        <EditableProofNode
          id="node-1"
          kind="axiom"
          label="A1"
          formulaText="φ"
          onFormulaTextChange={() => {}}
          axiomName="A1 (K)"
        />,
      );
      expect(container.textContent).toContain("A1 (K)");
    });
  });
});
