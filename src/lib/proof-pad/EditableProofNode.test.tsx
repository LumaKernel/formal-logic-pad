import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

  describe("種別ごとのスタイル（紙カード風）", () => {
    it("全種別で紙カード背景色が適用される", () => {
      for (const kind of [
        "axiom",
        "mp",
        "gen",
        "substitution",
        "conclusion",
      ] as const) {
        cleanup();
        renderNode({ kind, label: kind.toUpperCase() });
        const node = screen.getByTestId("test-node");
        expect(node).toHaveStyle({
          background: "var(--color-node-card-bg, #fffdf8)",
        });
      }
    });

    it("全種別でカテゴリ色の左辺ストライプが適用される", () => {
      const stripeColors: Record<ProofNodeKind, string> = {
        axiom: "var(--color-node-axiom, #5b8bd9)",
        mp: "var(--color-node-mp, #d9944a)",
        gen: "var(--color-node-gen, #9b59b6)",
        substitution: "var(--color-node-substitution, #3498db)",
        conclusion: "var(--color-node-conclusion, #4ad97a)",
      };
      for (const kind of [
        "axiom",
        "mp",
        "gen",
        "substitution",
        "conclusion",
      ] as const) {
        cleanup();
        renderNode({ kind, label: kind.toUpperCase() });
        const node = screen.getByTestId("test-node");
        // JSDOMではCSS変数を含むborderLeftを正確に解釈できないため、
        // style属性の文字列で確認する
        const styleAttr = node.getAttribute("style") ?? "";
        expect(styleAttr).toContain(
          `border-left: 4px solid ${stripeColors[kind] satisfies string}`,
        );
      }
    });

    it("暗色テキスト色が適用される", () => {
      renderNode();
      const node = screen.getByTestId("test-node");
      expect(node).toHaveStyle({
        color: "var(--color-node-card-text, #2d2a24)",
      });
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

    it("編集モードでFormulaInputのプレビューが表示されない", async () => {
      const user = userEvent.setup();
      renderNode();
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      expect(screen.getByTestId("test-node-editor-edit")).toBeInTheDocument();
      // FormulaInputのプレビュー（-input-preview）が表示されていないこと
      expect(
        screen.queryByTestId("test-node-editor-input-preview"),
      ).not.toBeInTheDocument();
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

  describe("公理依存関係の表示", () => {
    it("依存関係がある場合、Depends on セクションが表示される", () => {
      renderNode({
        dependencies: [
          { nodeId: "axiom-1", displayName: "A1 (K)" },
          { nodeId: "axiom-2", displayName: "A2 (S)" },
        ],
      });
      expect(screen.getByText("Depends on:")).toBeInTheDocument();
      expect(screen.getByText("A1 (K)")).toBeInTheDocument();
      expect(screen.getByText("A2 (S)")).toBeInTheDocument();
    });

    it("依存関係がない場合（undefined）、Depends on セクションが表示されない", () => {
      renderNode({ dependencies: undefined });
      expect(screen.queryByText("Depends on:")).not.toBeInTheDocument();
    });

    it("依存関係が空配列の場合、Depends on セクションが表示されない", () => {
      renderNode({ dependencies: [] });
      expect(screen.queryByText("Depends on:")).not.toBeInTheDocument();
    });

    it("data-testidが設定される", () => {
      renderNode({
        dependencies: [{ nodeId: "axiom-1", displayName: "A1" }],
        testId: "test-node",
      });
      expect(screen.getByTestId("test-node-dependencies")).toBeInTheDocument();
    });
  });

  describe("detailLevel (Level-of-Detail)", () => {
    const fullProps = {
      classification: "root-axiom" as const,
      axiomName: "A1 (K)",
      isProtected: true,
      statusMessage: "Valid",
      statusType: "success" as const,
      dependencies: [{ nodeId: "dep-1", displayName: "Dep1" }],
    };

    it("detailLevel='full'（デフォルト）ですべて表示される", () => {
      renderNode(fullProps);
      expect(screen.getByTestId("test-node-role-badge")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-axiom-name")).toBeInTheDocument();
      expect(
        screen.getByTestId("test-node-protected-badge"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("test-node-status")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-dependencies")).toBeInTheDocument();
      // formula displayed (readonly because isProtected)
      expect(screen.getByTestId("test-node-formula")).toBeInTheDocument();
    });

    it("detailLevel='compact'でバッジ・ステータス・依存を非表示、数式は表示", () => {
      renderNode({ ...fullProps, detailLevel: "compact" });
      expect(
        screen.queryByTestId("test-node-role-badge"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("test-node-axiom-name"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("test-node-protected-badge"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("test-node-status")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("test-node-dependencies"),
      ).not.toBeInTheDocument();
      // formula is still displayed
      expect(screen.getByTestId("test-node-formula")).toBeInTheDocument();
    });

    it("detailLevel='minimal'ですべて非表示（ラベルのみ）", () => {
      renderNode({ ...fullProps, detailLevel: "minimal" });
      // ラベルは常に表示
      expect(screen.getByText("A1")).toBeInTheDocument();
      // 数式も非表示
      expect(screen.queryByTestId("test-node-formula")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("test-node-editor-display"),
      ).not.toBeInTheDocument();
      // バッジ・ステータスも非表示
      expect(
        screen.queryByTestId("test-node-role-badge"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("test-node-status")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("test-node-dependencies"),
      ).not.toBeInTheDocument();
    });

    it("detailLevel='compact'で編集可能ノードの数式エディタが表示される", () => {
      renderNode({
        detailLevel: "compact",
        editable: true,
        isProtected: false,
      });
      expect(
        screen.getByTestId("test-node-editor-display"),
      ).toBeInTheDocument();
    });

    it("detailLevel='minimal'で編集可能ノードの数式エディタも非表示", () => {
      renderNode({
        detailLevel: "minimal",
        editable: true,
        isProtected: false,
      });
      expect(
        screen.queryByTestId("test-node-editor-display"),
      ).not.toBeInTheDocument();
    });
  });

  describe("visibilityOverrides", () => {
    it("fullレベルでshowDependencies: falseにすると依存情報が非表示になる", () => {
      renderNode({
        dependencies: [{ nodeId: "dep-1", displayName: "Dep1" }],
        detailLevel: "full",
        visibilityOverrides: { showDependencies: false },
      });
      expect(
        screen.queryByTestId("test-node-dependencies"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Depends on:")).not.toBeInTheDocument();
    });

    it("fullレベルでvisibilityOverrides未指定だと依存情報が表示される", () => {
      renderNode({
        dependencies: [{ nodeId: "dep-1", displayName: "Dep1" }],
        detailLevel: "full",
      });
      expect(screen.getByTestId("test-node-dependencies")).toBeInTheDocument();
      expect(screen.getByText("Depends on:")).toBeInTheDocument();
    });

    it("compactレベルでshowDependencies: trueにすると依存情報が表示される", () => {
      renderNode({
        dependencies: [{ nodeId: "dep-1", displayName: "Dep1" }],
        detailLevel: "compact",
        visibilityOverrides: { showDependencies: true },
      });
      expect(screen.getByTestId("test-node-dependencies")).toBeInTheDocument();
    });

    it("showDependencies: falseでも他の表示要素には影響しない", () => {
      renderNode({
        classification: "root-axiom" as const,
        axiomName: "A1 (K)",
        statusMessage: "Valid",
        statusType: "success" as const,
        dependencies: [{ nodeId: "dep-1", displayName: "Dep1" }],
        detailLevel: "full",
        visibilityOverrides: { showDependencies: false },
      });
      // 依存情報のみ非表示
      expect(
        screen.queryByTestId("test-node-dependencies"),
      ).not.toBeInTheDocument();
      // 他の要素は表示される
      expect(screen.getByTestId("test-node-role-badge")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-axiom-name")).toBeInTheDocument();
      expect(screen.getByTestId("test-node-status")).toBeInTheDocument();
    });
  });

  describe("editTrigger", () => {
    it('editTrigger="dblclick"でシングルクリックでは編集モードに入らない', async () => {
      const user = userEvent.setup();
      renderNode({ editTrigger: "dblclick" });
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      expect(
        screen.getByTestId("test-node-editor-display"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("test-node-editor-edit"),
      ).not.toBeInTheDocument();
    });

    it('editTrigger="dblclick"でダブルクリックで編集モードに入る', async () => {
      const user = userEvent.setup();
      renderNode({ editTrigger: "dblclick" });
      const display = screen.getByTestId("test-node-editor-display");
      await user.dblClick(display);
      await waitFor(() => {
        expect(screen.getByTestId("test-node-editor-edit")).toBeInTheDocument();
      });
    });

    it("editTrigger未指定ではデフォルト(click)で動作する", async () => {
      const user = userEvent.setup();
      renderNode();
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      expect(screen.getByTestId("test-node-editor-edit")).toBeInTheDocument();
    });
  });

  describe("構文ヘルプ", () => {
    it("onOpenSyntaxHelp指定時、編集モードでヘルプボタンが表示される", async () => {
      const user = userEvent.setup();
      const handleHelp = vi.fn();
      renderNode({ onOpenSyntaxHelp: handleHelp });
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      await waitFor(() => {
        expect(
          screen.getByTestId("test-node-editor-syntax-help"),
        ).toBeInTheDocument();
      });
    });

    it("ヘルプボタンクリックでonOpenSyntaxHelpが呼ばれる", async () => {
      const user = userEvent.setup();
      const handleHelp = vi.fn();
      renderNode({ onOpenSyntaxHelp: handleHelp });
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      await waitFor(() => {
        expect(
          screen.getByTestId("test-node-editor-syntax-help"),
        ).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("test-node-editor-syntax-help"));
      expect(handleHelp).toHaveBeenCalledOnce();
    });

    it("onOpenSyntaxHelp未指定時はヘルプボタンが表示されない", async () => {
      const user = userEvent.setup();
      renderNode();
      const display = screen.getByTestId("test-node-editor-display");
      await user.click(display);
      expect(
        screen.queryByTestId("test-node-editor-syntax-help"),
      ).not.toBeInTheDocument();
    });
  });
});
