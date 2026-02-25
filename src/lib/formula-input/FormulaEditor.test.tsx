import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Formula } from "../logic-core/formula";
import { FormulaEditor } from "./FormulaEditor";
import type { EditorMode } from "./editorLogic";

// --- ヘルパー: 制御コンポーネントラッパー ---

function EditorWrapper({
  initialValue = "",
  onParsed,
  onModeChange,
  testId = "editor",
  displayRenderer,
  placeholder,
}: {
  readonly initialValue?: string;
  readonly onParsed?: (formula: Formula) => void;
  readonly onModeChange?: (mode: EditorMode) => void;
  readonly testId?: string;
  readonly displayRenderer?: "unicode" | "katex";
  readonly placeholder?: string;
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
