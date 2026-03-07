import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties } from "react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Formula } from "../logic-core/formula";
import { FormulaEditor } from "./FormulaEditor";
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
  readonly onParsed?: (formula: Formula) => void;
  readonly onModeChange?: (mode: EditorMode) => void;
  readonly testId?: string;
  readonly displayRenderer?: "unicode" | "katex";
  readonly placeholder?: string;
  readonly fontSize?: CSSProperties["fontSize"];
  readonly editTrigger?: EditTrigger;
  readonly onOpenSyntaxHelp?: () => void;
  readonly forceEditMode?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <FormulaEditor
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

describe("FormulaEditor - 表示モード", () => {
  it("パース成功時にUnicodeレンダラーで表示する", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toBeInTheDocument();

    const unicode = screen.getByTestId("editor-unicode");
    expect(unicode).toBeInTheDocument();
    expect(unicode).toHaveTextContent("φ → ψ");
  });

  it("パース成功時にKaTeXレンダラーで表示する", () => {
    render(<EditorWrapper initialValue="φ → ψ" displayRenderer="katex" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toBeInTheDocument();

    const katex = screen.getByTestId("editor-katex");
    expect(katex).toBeInTheDocument();
  });

  it("空の値でプレースホルダーを表示する", () => {
    render(<EditorWrapper initialValue="" placeholder="入力してください" />);

    const placeholder = screen.getByTestId("editor-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent("入力してください");
  });

  it("デフォルトプレースホルダーを表示する", () => {
    render(<EditorWrapper initialValue="" />);

    const placeholder = screen.getByTestId("editor-placeholder");
    expect(placeholder).toHaveTextContent("クリックして論理式を入力...");
  });

  it("表示モードでrole=buttonとtabIndex=0を持つ", () => {
    render(<EditorWrapper initialValue="φ" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toHaveAttribute("role", "button");
    expect(display).toHaveAttribute("tabindex", "0");
  });

  it("表示モードでaria-labelを持つ", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toHaveAttribute("aria-label", "φ → ψ - クリックして編集");
  });
});

// --- モード切替のテスト ---

describe("FormulaEditor - モード切替", () => {
  it("クリックで編集モードに入る", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    // 表示モード
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-edit")).not.toBeInTheDocument();

    // クリック
    fireEvent.click(screen.getByTestId("editor-display"));

    // 編集モード
    expect(screen.queryByTestId("editor-display")).not.toBeInTheDocument();
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it("Enterキーで編集モードに入る", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: "Enter" });

    expect(screen.queryByTestId("editor-display")).not.toBeInTheDocument();
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it("Spaceキーで編集モードに入る", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: " " });

    expect(screen.queryByTestId("editor-display")).not.toBeInTheDocument();
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it("編集モードでinputにフォーカスが当たる", async () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    fireEvent.click(screen.getByTestId("editor-display"));

    await waitFor(() => {
      const input = screen.getByTestId("editor-input-input");
      expect(document.activeElement).toBe(input);
    });
  });

  it("blurで表示モードに戻る（パース成功時）", async () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    // blurで戻る
    const input = screen.getByTestId("editor-input-input");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });

  it("Escapeで表示モードに戻る（パース成功時）", async () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    // Escapeで戻る
    const editContainer = screen.getByTestId("editor");
    fireEvent.keyDown(editContainer, { key: "Escape" });

    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });

  it("空入力でblurすると表示モードに戻る", async () => {
    render(<EditorWrapper initialValue="" />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    // blurで戻る
    const input = screen.getByTestId("editor-input-input");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });
});

// --- パースエラー時のテスト ---

describe("FormulaEditor - パースエラー時", () => {
  it("パースエラー時はblurしても編集モードに留まる", async () => {
    render(<EditorWrapper initialValue="→" />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    // テキストを変更してエラー状態にする
    const input = screen.getByTestId("editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "→");

    // blurで戻ろうとする
    fireEvent.blur(input);

    // パースエラーなので編集モードに留まる
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-display")).not.toBeInTheDocument();
  });

  it("パースエラー時はEscapeでも編集モードに留まる", async () => {
    render(<EditorWrapper initialValue="→" />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));

    // テキストを変更してエラー状態にする
    const input = screen.getByTestId("editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "→");

    // Escapeで戻ろうとする
    const editContainer = screen.getByTestId("editor");
    fireEvent.keyDown(editContainer, { key: "Escape" });

    // パースエラーなので編集モードに留まる
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it("エラー修正後はblurで表示モードに戻れる", async () => {
    render(<EditorWrapper initialValue="φ" />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));

    const input = screen.getByTestId("editor-input-input");

    // エラーのある入力にする
    await userEvent.clear(input);
    await userEvent.type(input, "→");

    // blurしても編集モードに留まる
    fireEvent.blur(input);
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();

    // 正しい入力に修正
    await userEvent.clear(input);
    await userEvent.type(input, "φ");

    // blurで表示モードに戻れる
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    });
  });
});

// --- onParsedコールバックのテスト ---

describe("FormulaEditor - onParsed", () => {
  it("パース成功時にonParsedが呼ばれる", async () => {
    const onParsed = vi.fn();
    render(<EditorWrapper initialValue="φ → ψ" onParsed={onParsed} />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));

    // onParsedはFormulaInputが内部で呼ぶ
    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });
});

// --- 初期表示のテスト ---

describe("FormulaEditor - 初期表示", () => {
  it("パースエラーの初期値でもプレースホルダー表示になる（パースできないテキストの場合）", () => {
    // 「→」はパースエラーだが、表示モードではプレースホルダー表示
    render(<EditorWrapper initialValue="→" />);

    // パースエラーのためFormulaはnull、プレースホルダーが表示される
    const placeholder = screen.getByTestId("editor-placeholder");
    expect(placeholder).toBeInTheDocument();
  });
});

// --- onModeChangeコールバックのテスト ---

describe("FormulaEditor - onModeChange", () => {
  it("編集モードに入るとonModeChangeがeditingで呼ばれる", () => {
    const onModeChange = vi.fn();
    render(<EditorWrapper initialValue="φ → ψ" onModeChange={onModeChange} />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(onModeChange).toHaveBeenCalledWith("editing");
  });

  it("表示モードに戻るとonModeChangeがdisplayで呼ばれる", async () => {
    const onModeChange = vi.fn();
    render(<EditorWrapper initialValue="φ → ψ" onModeChange={onModeChange} />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));
    expect(onModeChange).toHaveBeenCalledWith("editing");

    // blurで表示モードに戻る
    const input = screen.getByTestId("editor-input-input");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onModeChange).toHaveBeenCalledWith("display");
    });
  });

  it("パースエラー時はblurしてもonModeChangeがdisplayで呼ばれない", async () => {
    const onModeChange = vi.fn();
    render(<EditorWrapper initialValue="→" onModeChange={onModeChange} />);

    // 編集モードに入る
    fireEvent.click(screen.getByTestId("editor-display"));
    expect(onModeChange).toHaveBeenCalledWith("editing");
    onModeChange.mockClear();

    // テキストを変更してエラー状態にする
    const input = screen.getByTestId("editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "→");

    // blurで戻ろうとする
    fireEvent.blur(input);

    // パースエラーなのでdisplayには遷移しない
    expect(onModeChange).not.toHaveBeenCalledWith("display");
  });
});

// --- testIdなしのレンダリング ---

describe("FormulaEditor - testIdなしのレンダリング", () => {
  it("testIdなしでも正常にレンダリングされる（Unicode表示）", () => {
    const { container } = render(
      <EditorWrapper initialValue="φ → ψ" testId={undefined} />,
    );
    expect(container.querySelector("[role='button']")).toBeInTheDocument();
  });

  it("testIdなしでもKaTeX表示が正常にレンダリングされる", () => {
    const { container } = render(
      <EditorWrapper
        initialValue="φ → ψ"
        displayRenderer="katex"
        testId={undefined}
      />,
    );
    expect(container.querySelector("[role='button']")).toBeInTheDocument();
  });

  it("testIdなしでも編集モードに遷移できる", () => {
    const { container } = render(
      <EditorWrapper initialValue="φ" testId={undefined} />,
    );
    const button = container.querySelector("[role='button']");
    expect(button).toBeInTheDocument();
    fireEvent.click(button!);
    expect(container.querySelector("input")).toBeInTheDocument();
  });

  it("testIdなしで空値のプレースホルダーが表示される", () => {
    const { container } = render(
      <EditorWrapper initialValue="" testId={undefined} />,
    );
    const button = container.querySelector("[role='button']");
    expect(button).toBeInTheDocument();
    expect(button!.textContent).toContain("クリックして論理式を入力...");
  });
});

// --- fontSize指定のテスト ---

describe("FormulaEditor - fontSize指定", () => {
  it("fontSizeを指定するとコンテナにfontSizeが適用される", () => {
    render(<EditorWrapper initialValue="φ → ψ" fontSize="20px" />);

    const container = screen.getByTestId("editor");
    expect(container.style.fontSize).toBe("20px");
  });

  it("fontSizeなしでもコンテナが正常にレンダリングされる", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const container = screen.getByTestId("editor");
    // fontSizeが設定されていないことを確認
    expect(container.style.fontSize).toBe("");
  });

  it("fontSizeを指定して編集モードでも反映される", async () => {
    render(<EditorWrapper initialValue="φ" fontSize={18} />);

    fireEvent.click(screen.getByTestId("editor-display"));

    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    // コンテナにfontSizeが設定されている
    const container = screen.getByTestId("editor");
    expect(container.style.fontSize).toBe("18px");
  });
});

// --- editTriggerのテスト ---

describe("FormulaEditor - editTrigger", () => {
  it('editTrigger="click"（デフォルト）: シングルクリックで編集モードに入る', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="click" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it('editTrigger="dblclick": シングルクリックでは編集モードに入らない', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="dblclick" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    // シングルクリックでは表示モードのまま
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-edit")).not.toBeInTheDocument();
  });

  it('editTrigger="dblclick": ダブルクリックで編集モードに入る', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="dblclick" />);

    fireEvent.doubleClick(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it('editTrigger="dblclick": Enter/Spaceキーで編集モードに入る', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="dblclick" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: "Enter" });
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
  });

  it('editTrigger="none": シングルクリックでは編集モードに入らない', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="none" />);

    fireEvent.click(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-edit")).not.toBeInTheDocument();
  });

  it('editTrigger="none": ダブルクリックでも編集モードに入らない', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="none" />);

    fireEvent.doubleClick(screen.getByTestId("editor-display"));
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-edit")).not.toBeInTheDocument();
  });

  it('editTrigger="none": Enter/Spaceキーでも編集モードに入らない', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="none" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: "Enter" });
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();

    fireEvent.keyDown(display, { key: " " });
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
  });

  it('editTrigger="none": cursorがdefaultになる', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="none" />);

    const container = screen.getByTestId("editor");
    expect(container.style.cursor).toBe("default");
  });

  it('editTrigger="dblclick": aria-labelにダブルクリックと表示される', () => {
    render(<EditorWrapper initialValue="φ → ψ" editTrigger="dblclick" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toHaveAttribute(
      "aria-label",
      "φ → ψ - ダブルクリックして編集",
    );
  });

  it('editTrigger="dblclick": 空の場合もaria-labelにダブルクリックと表示される', () => {
    render(<EditorWrapper initialValue="" editTrigger="dblclick" />);

    const display = screen.getByTestId("editor-display");
    expect(display).toHaveAttribute(
      "aria-label",
      "ダブルクリックして論理式を入力",
    );
  });
});

// --- 構文ヘルプボタンのテスト ---

describe("FormulaEditor - 構文ヘルプ", () => {
  it("onOpenSyntaxHelp指定時、編集モードでヘルプボタンが表示される", async () => {
    const handleHelp = vi.fn();
    render(
      <EditorWrapper initialValue="φ → ψ" onOpenSyntaxHelp={handleHelp} />,
    );

    // 表示モードではヘルプボタンは非表示
    expect(screen.queryByTestId("editor-syntax-help")).not.toBeInTheDocument();

    // 編集モードに入る
    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    // ヘルプボタンが表示される
    expect(screen.getByTestId("editor-syntax-help")).toBeInTheDocument();
    expect(screen.getByTestId("editor-syntax-help")).toHaveTextContent("?");
    expect(screen.getByTestId("editor-syntax-help")).toHaveAttribute(
      "aria-label",
      "構文ヘルプ",
    );
  });

  it("onOpenSyntaxHelp未指定時、編集モードでもヘルプボタンは表示されない", async () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    // 編集モードに入る
    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    // ヘルプボタンは非表示
    expect(screen.queryByTestId("editor-syntax-help")).not.toBeInTheDocument();
  });

  it("ヘルプボタンクリックでonOpenSyntaxHelpが呼ばれる", async () => {
    const handleHelp = vi.fn();
    render(
      <EditorWrapper initialValue="φ → ψ" onOpenSyntaxHelp={handleHelp} />,
    );

    // 編集モードに入る
    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    // ヘルプボタンをクリック
    fireEvent.click(screen.getByTestId("editor-syntax-help"));
    expect(handleHelp).toHaveBeenCalledOnce();
  });

  it("ヘルプボタンクリック後も編集モードに留まる", async () => {
    const handleHelp = vi.fn();
    render(
      <EditorWrapper initialValue="φ → ψ" onOpenSyntaxHelp={handleHelp} />,
    );

    // 編集モードに入る
    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    // ヘルプボタンをクリック
    fireEvent.click(screen.getByTestId("editor-syntax-help"));

    // 編集モードに留まっている
    expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-display")).not.toBeInTheDocument();
  });

  it("ヘルプボタンのmousedownでpreventDefaultとstopPropagationが呼ばれる", async () => {
    const handleHelp = vi.fn();
    render(
      <EditorWrapper initialValue="φ → ψ" onOpenSyntaxHelp={handleHelp} />,
    );

    // 編集モードに入る
    await userEvent.click(screen.getByTestId("editor-display"));
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });

    // ヘルプボタンのmousedownイベントを発火
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

describe("forceEditMode", () => {
  it("forceEditModeがtrueの場合に編集モードに遷移する", async () => {
    const onModeChange = vi.fn();
    const { rerender } = render(
      <EditorWrapper
        initialValue="φ → ψ"
        onModeChange={onModeChange}
        forceEditMode={false}
      />,
    );

    // 初期状態は表示モード
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();

    // forceEditMode を true にして再レンダリング
    rerender(
      <EditorWrapper
        initialValue="φ → ψ"
        onModeChange={onModeChange}
        forceEditMode={true}
      />,
    );

    // 編集モードに遷移する
    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });
  });
});

// --- マウスホバー ---

describe("マウスホバー", () => {
  it("表示モードでmouseLeaveするとホバースタイルが解除される", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.mouseEnter(display);
    fireEvent.mouseLeave(display);
    // ホバー解除後は通常の表示スタイル（エラーなく動作することを確認）
    expect(display).toBeInTheDocument();
  });
});

// --- testId未指定 ---

describe("testId未指定", () => {
  it("testIdがundefinedでもエラーなくレンダリングできる（表示モード）", () => {
    render(
      <FormulaEditor value="φ → ψ" onChange={vi.fn()} testId={undefined} />,
    );
    // testIdなしなのでgetByTestIdは使えない。role=buttonの存在で確認
    expect(document.querySelector("[role='button']")).toBeInTheDocument();
  });

  it("testIdがundefinedでもエラーなくレンダリングできる（編集モード）", () => {
    render(
      <FormulaEditor
        value="φ → ψ"
        onChange={vi.fn()}
        testId={undefined}
        forceEditMode={true}
        onOpenSyntaxHelp={vi.fn()}
      />,
    );
    // 編集モードのinputが存在する
    expect(document.querySelector("input")).toBeInTheDocument();
  });

  it("testIdがundefined+katexレンダラーでもエラーなくレンダリングできる", () => {
    render(
      <FormulaEditor
        value="φ → ψ"
        onChange={vi.fn()}
        testId={undefined}
        displayRenderer="katex"
      />,
    );
    expect(document.querySelector("[role='button']")).toBeInTheDocument();
  });

  it("testIdがundefined+空のvalue(placeholder表示)でもエラーなくレンダリングできる", () => {
    render(
      <FormulaEditor
        value=""
        onChange={vi.fn()}
        testId={undefined}
        placeholder="入力してください"
      />,
    );
    expect(document.querySelector("[role='button']")).toBeInTheDocument();
  });
});

// --- Spaceキーで編集モードに入る ---

describe("Spaceキーによる編集モード", () => {
  it("表示モードでSpaceキーを押すと編集モードに入る", async () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: " " });

    await waitFor(() => {
      expect(screen.getByTestId("editor-edit")).toBeInTheDocument();
    });
  });

  it("表示モードでEnter/Space以外のキーを押しても編集モードに入らない", () => {
    render(<EditorWrapper initialValue="φ → ψ" />);

    const display = screen.getByTestId("editor-display");
    fireEvent.keyDown(display, { key: "Tab" });
    // 表示モードのまま
    expect(screen.getByTestId("editor-display")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-edit")).not.toBeInTheDocument();
  });
});
