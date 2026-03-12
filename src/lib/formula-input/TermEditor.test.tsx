import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Term } from "../logic-core/term";
import { TermEditor } from "./TermEditor";
import type { EditTrigger, EditorMode } from "./editorLogic";

// --- ヘルパー: 制御コンポーネントラッパー ---

function EditorWrapper({
  initialValue = "",
  onParsed,
  onModeChange,
  testId = "editor",
  displayRenderer,
  placeholder,
  fontSize,
  editTrigger,
  onOpenSyntaxHelp,
  forceEditMode,
}: {
  readonly initialValue?: string;
  readonly onParsed?: (term: Term) => void;
  readonly onModeChange?: (mode: EditorMode) => void;
  readonly testId?: string;
  readonly displayRenderer?: "unicode" | "katex";
  readonly placeholder?: string;
  readonly fontSize?: number | string;
  readonly editTrigger?: EditTrigger;
  readonly onOpenSyntaxHelp?: () => void;
  readonly forceEditMode?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <TermEditor
      value={value}
      onChange={setValue}
      onParsed={onParsed}
      onModeChange={onModeChange}
      testId={testId}
      displayRenderer={displayRenderer}
      placeholder={placeholder}
      fontSize={fontSize}
      editTrigger={editTrigger}
      onOpenSyntaxHelp={onOpenSyntaxHelp}
      forceEditMode={forceEditMode}
    />
  );
}

// --- 表示モードのテスト ---

describe("TermEditor - 表示モード", () => {
  it("パース成功時にUnicodeレンダラーで表示する", () => {
    render(<EditorWrapper initialValue="f(x, y)" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toBeInTheDocument();

    const unicode = screen.getByTestId("editor-unicode");
    expect(unicode).toBeInTheDocument();
  });

  it("パース成功時にKaTeXレンダラーで表示する", () => {
    render(<EditorWrapper initialValue="f(x)" displayRenderer="katex" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toBeInTheDocument();

    const katex = screen.getByTestId("editor-katex");
    expect(katex).toBeInTheDocument();
  });

  it("空の値でプレースホルダーを表示する", () => {
    render(<EditorWrapper initialValue="" placeholder="項を入力" />);

    const placeholder = screen.getByTestId("editor-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent("項を入力");
  });

  it("デフォルトプレースホルダーを表示する", () => {
    render(<EditorWrapper initialValue="" />);

    const placeholder = screen.getByTestId("editor-placeholder");
    expect(placeholder).toHaveTextContent("クリックして項を入力...");
  });

  it("表示モードでrole=buttonとtabIndex=0を持つ", () => {
    render(<EditorWrapper initialValue="x" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toHaveAttribute("role", "button");
    expect(display).toHaveAttribute("tabindex", "0");
  });

  it("表示モードでaria-labelを持つ", () => {
    render(<EditorWrapper initialValue="x" />);

    const display = screen.getByTestId("editor-display");
    expect(display.getAttribute("aria-label")).toContain("クリックして編集");
  });
});

// --- モード切替のテスト ---

describe("TermEditor - モード切替", () => {
  it("クリックで編集モードに入る", () => {
    render(<EditorWrapper initialValue="x" />);

    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-edit")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("editor-display"));

    expect(screen.queryByTestId("editor-display")).not.toBeInTheDocument();
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it("Enterキーで編集モードに入る", () => {
    render(<EditorWrapper initialValue="x" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: "Enter" });

    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it("Spaceキーで編集モードに入る", () => {
    render(<EditorWrapper initialValue="x" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: " " });

    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it("編集モードでinputにフォーカスが当たる", async () => {
    render(<EditorWrapper initialValue="x" />);

    fireEvent.click(screen.getByTestId("editor-display"));

    await waitFor(() => {
      const input = screen.getByTestId("editor-input-input");
      expect(document.activeElement).toBe(input);
    });
  });

  it("blurで表示モードに戻る（パース成功時）", async () => {
    render(<EditorWrapper initialValue="x" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    const input = screen.getByTestId("editor-input-input");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });

  it("Escapeで表示モードに戻る（パース成功時）", async () => {
    render(<EditorWrapper initialValue="x" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    const editContainer = screen.getByTestId("editor");
    fireEvent.keyDown(editContainer, { key: "Escape" });

    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });

  it("空入力でblurすると表示モードに戻る", async () => {
    render(<EditorWrapper initialValue="" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    const input = screen.getByTestId("editor-input-input");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });
});

// --- パースエラー時のテスト ---

describe("TermEditor - パースエラー時", () => {
  it("パースエラー時はblurしても編集モードに留まる", async () => {
    // Use a value that parses initially, then type invalid input
    render(<EditorWrapper initialValue="x" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    const input = screen.getByTestId("editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "f(");

    fireEvent.blur(input);

    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-display")).not.toBeInTheDocument();
  });

  it("エラー修正後はblurで表示モードに戻れる", async () => {
    render(<EditorWrapper initialValue="x" />);

    fireEvent.click(screen.getByTestId("editor-display"));

    const input = screen.getByTestId("editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "f(");

    fireEvent.blur(input);
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "f(x)");

    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });
});

// --- onParsedコールバックのテスト ---

describe("TermEditor - onParsed", () => {
  it("パース成功時にonParsedが呼ばれる", async () => {
    const onParsed = vi.fn();
    render(<EditorWrapper initialValue="f(x)" onParsed={onParsed} />);

    fireEvent.click(screen.getByTestId("editor-display"));

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });
});

// --- onModeChangeコールバックのテスト ---

describe("TermEditor - onModeChange", () => {
  it("編集モードに入るとonModeChangeがeditingで呼ばれる", () => {
    const onModeChange = vi.fn();
    render(<EditorWrapper initialValue="x" onModeChange={onModeChange} />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(onModeChange).toHaveBeenCalledWith("editing");
  });

  it("表示モードに戻るとonModeChangeがdisplayで呼ばれる", async () => {
    const onModeChange = vi.fn();
    render(<EditorWrapper initialValue="x" onModeChange={onModeChange} />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(onModeChange).toHaveBeenCalledWith("editing");

    const input = screen.getByTestId("editor-input-input");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onModeChange).toHaveBeenCalledWith("display");
    });
  });
});

// --- editTriggerのテスト ---

describe("TermEditor - editTrigger", () => {
  it('editTrigger="dblclick": シングルクリックでは編集モードに入らない', () => {
    render(<EditorWrapper initialValue="x" editTrigger="dblclick" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-edit")).not.toBeInTheDocument();
  });

  it('editTrigger="dblclick": ダブルクリックで編集モードに入る', () => {
    render(<EditorWrapper initialValue="x" editTrigger="dblclick" />);

    fireEvent.doubleClick(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it('editTrigger="none": クリックでもダブルクリックでも編集モードに入らない', () => {
    render(<EditorWrapper initialValue="x" editTrigger="none" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();

    fireEvent.doubleClick(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
  });

  it('editTrigger="none": cursorがdefaultになる', () => {
    render(<EditorWrapper initialValue="x" editTrigger="none" />);

    const container = screen.getByTestId("editor");
    expect(container.style.cursor).toBe("default");
  });

  it('editTrigger="dblclick": aria-labelにダブルクリックと表示される', () => {
    render(<EditorWrapper initialValue="x" editTrigger="dblclick" />);

    const display = screen.getByTestId("editor-display");
    expect(display.getAttribute("aria-label")).toContain(
      "ダブルクリックして編集",
    );
  });

  it('editTrigger="none": Enter/Spaceキーでも編集モードに入らない', () => {
    render(<EditorWrapper initialValue="x" editTrigger="none" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: "Enter" });
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();

    fireEvent.keyDown(display, { key: " " });
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
  });
});

// --- 構文ヘルプボタンのテスト ---

describe("TermEditor - 構文ヘルプ", () => {
  it("onOpenSyntaxHelp指定時、編集モードでヘルプボタンが表示される", async () => {
    const handleHelp = vi.fn();
    render(<EditorWrapper initialValue="x" onOpenSyntaxHelp={handleHelp} />);

    expect(screen.queryByTestId("editor-syntax-help")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    expect(screen.getByTestId("editor-syntax-help")).toBeInTheDocument();
    expect(screen.getByTestId("editor-syntax-help")).toHaveTextContent("?");
  });

  it("onOpenSyntaxHelp未指定時、編集モードでもヘルプボタンは表示されない", async () => {
    render(<EditorWrapper initialValue="x" />);

    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("editor-syntax-help")).not.toBeInTheDocument();
  });

  it("ヘルプボタンクリックでonOpenSyntaxHelpが呼ばれる", async () => {
    const handleHelp = vi.fn();
    render(<EditorWrapper initialValue="x" onOpenSyntaxHelp={handleHelp} />);

    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("editor-syntax-help"));
    expect(handleHelp).toHaveBeenCalledOnce();
  });

  it("ヘルプボタンのmousedownでpreventDefaultが呼ばれる", async () => {
    const handleHelp = vi.fn();
    render(<EditorWrapper initialValue="x" onOpenSyntaxHelp={handleHelp} />);

    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    const helpButton = screen.getByTestId("editor-syntax-help");
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(mouseDownEvent, "preventDefault");
    helpButton.dispatchEvent(mouseDownEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

// --- forceEditMode ---

describe("TermEditor - forceEditMode", () => {
  it("forceEditModeがtrueの場合に編集モードに遷移する", async () => {
    const onModeChange = vi.fn();
    const { rerender } = render(
      <EditorWrapper
        initialValue="x"
        onModeChange={onModeChange}
        forceEditMode={false}
      />,
    );

    expect(screen.getByTestId("editor-display")).toBeInTheDocument();

    rerender(
      <EditorWrapper
        initialValue="x"
        onModeChange={onModeChange}
        forceEditMode={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });
  });
});

// --- マウスホバー ---

describe("TermEditor - マウスホバー", () => {
  it("表示モードでmouseLeaveするとホバースタイルが解除される", () => {
    render(<EditorWrapper initialValue="x" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.mouseEnter(display);
    fireEvent.mouseLeave(display);
    expect(display).toBeInTheDocument();
  });
});

// --- fontSize指定のテスト ---

describe("TermEditor - fontSize指定", () => {
  it("fontSizeを指定するとコンテナにfontSizeが適用される", () => {
    render(<EditorWrapper initialValue="x" fontSize="20px" />);

    const container = screen.getByTestId("editor");
    expect(container.style.fontSize).toBe("20px");
  });
});

// --- testIdなしのレンダリング ---

describe("TermEditor - testIdなし", () => {
  it("testIdがundefinedでも正常にレンダリングされる", () => {
    render(<TermEditor value="x" onChange={vi.fn()} testId={undefined} />);
    expect(document.querySelector("[role='button']")).toBeInTheDocument();
  });

  it("testIdがundefined+katexレンダラーでもエラーなくレンダリングされる", () => {
    render(
      <TermEditor
        value="x"
        onChange={vi.fn()}
        testId={undefined}
        displayRenderer="katex"
      />,
    );
    expect(document.querySelector("[role='button']")).toBeInTheDocument();
  });

  it("testIdがundefined+空のvalue(placeholder表示)でもエラーなくレンダリングされる", () => {
    render(
      <TermEditor
        value=""
        onChange={vi.fn()}
        testId={undefined}
        placeholder="項を入力"
      />,
    );
    expect(document.querySelector("[role='button']")).toBeInTheDocument();
  });

  it("testIdがundefined+編集モードでもエラーなくレンダリングされる", () => {
    render(
      <TermEditor
        value="x"
        onChange={vi.fn()}
        testId={undefined}
        forceEditMode={true}
        onOpenSyntaxHelp={vi.fn()}
      />,
    );
    expect(document.querySelector("input")).toBeInTheDocument();
  });
});
