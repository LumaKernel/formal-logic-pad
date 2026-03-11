import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Formula } from "../logic-core/formula";
import { FormulaExpandedEditor } from "./FormulaExpandedEditor";

// --- ヘルパー: 制御コンポーネントラッパー ---

function ExpandedEditorWrapper({
  initialValue = "",
  onParsed,
  onClose = vi.fn(),
  onOpenSyntaxHelp,
  placeholder,
  testId = "expanded",
}: {
  readonly initialValue?: string;
  readonly onParsed?: (formula: Formula) => void;
  readonly onClose?: () => void;
  readonly onOpenSyntaxHelp?: () => void;
  readonly placeholder?: string;
  readonly testId?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <FormulaExpandedEditor
      value={value}
      onChange={setValue}
      onParsed={onParsed}
      onClose={onClose}
      onOpenSyntaxHelp={onOpenSyntaxHelp}
      placeholder={placeholder}
      testId={testId}
    />
  );
}

// --- 基本表示テスト ---

describe("FormulaExpandedEditor - 基本表示", () => {
  it("モーダルが開くとtextareaとプレビューが表示される", () => {
    render(<ExpandedEditorWrapper />);

    expect(screen.getByTestId("expanded")).toBeInTheDocument();
    expect(screen.getByTestId("expanded-textarea")).toBeInTheDocument();
    expect(screen.getByTestId("expanded-preview")).toBeInTheDocument();
  });

  it("role=dialogとaria-modal=trueを持つ", () => {
    render(<ExpandedEditorWrapper />);

    const dialog = screen.getByTestId("expanded");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("閉じるボタンが表示される", () => {
    render(<ExpandedEditorWrapper />);

    expect(screen.getByTestId("expanded-close")).toBeInTheDocument();
    expect(screen.getByTestId("expanded-close")).toHaveAttribute(
      "aria-label",
      "閉じる",
    );
  });

  it("初期値がtextareaに反映される", () => {
    render(<ExpandedEditorWrapper initialValue="φ → ψ" />);

    const textarea = screen.getByTestId("expanded-textarea");
    expect(textarea).toHaveValue("φ → ψ");
  });

  it("空の場合にプレースホルダーが表示される", () => {
    render(<ExpandedEditorWrapper placeholder="入力してください" />);

    const textarea = screen.getByTestId("expanded-textarea");
    expect(textarea).toHaveAttribute("placeholder", "入力してください");
  });

  it("デフォルトプレースホルダーが設定される", () => {
    render(<ExpandedEditorWrapper />);

    const textarea = screen.getByTestId("expanded-textarea");
    expect(textarea).toHaveAttribute("placeholder", "論理式を入力...");
  });
});

// --- テキスト編集テスト ---

describe("FormulaExpandedEditor - テキスト編集", () => {
  it("テキストを入力するとonChangeが呼ばれる", async () => {
    render(<ExpandedEditorWrapper initialValue="" />);

    const textarea = screen.getByTestId("expanded-textarea");
    await userEvent.type(textarea, "phi");

    expect(textarea).toHaveValue("phi");
  });

  it("パース成功時にプレビューが表示される", async () => {
    render(<ExpandedEditorWrapper initialValue="φ → ψ" />);

    await waitFor(() => {
      expect(
        screen.getByTestId("expanded-preview-formula"),
      ).toBeInTheDocument();
    });
  });

  it("パース成功時にonParsedが呼ばれる", async () => {
    const onParsed = vi.fn();
    render(<ExpandedEditorWrapper initialValue="φ → ψ" onParsed={onParsed} />);

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
    });
  });
});

// --- エラー表示テスト ---

describe("FormulaExpandedEditor - エラー表示", () => {
  it("パースエラー時にエラーメッセージが表示される", async () => {
    render(<ExpandedEditorWrapper initialValue="→" />);

    await waitFor(() => {
      expect(screen.getByTestId("expanded-errors")).toBeInTheDocument();
    });
  });

  it("パースエラー時にtextareaにエラースタイルが適用される", async () => {
    render(<ExpandedEditorWrapper initialValue="→" />);

    await waitFor(() => {
      const textarea = screen.getByTestId("expanded-textarea");
      expect(textarea).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("パースエラー時にエラーハイライトが表示される", async () => {
    render(<ExpandedEditorWrapper initialValue="→" />);

    await waitFor(() => {
      expect(screen.getByTestId("expanded-highlights")).toBeInTheDocument();
    });
  });
});

// --- 閉じる操作テスト ---

describe("FormulaExpandedEditor - 閉じる操作", () => {
  it("閉じるボタンクリックでonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(<ExpandedEditorWrapper onClose={onClose} />);

    fireEvent.click(screen.getByTestId("expanded-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("モーダル外（オーバーレイ）クリックでonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(<ExpandedEditorWrapper onClose={onClose} />);

    // オーバーレイ（背景）をクリック
    fireEvent.click(screen.getByTestId("expanded"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("モーダル内クリックではonCloseが呼ばれない", () => {
    const onClose = vi.fn();
    render(<ExpandedEditorWrapper onClose={onClose} />);

    // textarea（モーダル内）をクリック
    fireEvent.click(screen.getByTestId("expanded-textarea"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escapeキーで閉じる", () => {
    const onClose = vi.fn();
    render(<ExpandedEditorWrapper onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// --- 構文ヘルプボタンテスト ---

describe("FormulaExpandedEditor - 構文ヘルプ", () => {
  it("onOpenSyntaxHelp指定時にヘルプボタンが表示される", () => {
    const handleHelp = vi.fn();
    render(<ExpandedEditorWrapper onOpenSyntaxHelp={handleHelp} />);

    expect(screen.getByTestId("expanded-syntax-help")).toBeInTheDocument();
  });

  it("onOpenSyntaxHelp未指定時にヘルプボタンが表示されない", () => {
    render(<ExpandedEditorWrapper />);

    expect(
      screen.queryByTestId("expanded-syntax-help"),
    ).not.toBeInTheDocument();
  });

  it("ヘルプボタンクリックでonOpenSyntaxHelpが呼ばれる", () => {
    const handleHelp = vi.fn();
    render(<ExpandedEditorWrapper onOpenSyntaxHelp={handleHelp} />);

    fireEvent.click(screen.getByTestId("expanded-syntax-help"));
    expect(handleHelp).toHaveBeenCalledOnce();
  });
});

// --- シンタックスハイライトテスト ---

describe("FormulaExpandedEditor - シンタックスハイライト", () => {
  it("正しい入力時にシンタックスハイライトが表示される", async () => {
    render(<ExpandedEditorWrapper initialValue="φ → ψ" />);

    await waitFor(() => {
      expect(
        screen.getByTestId("expanded-syntax-highlight"),
      ).toBeInTheDocument();
    });
  });

  it("エラー時はシンタックスハイライトではなくエラーハイライトが表示される", async () => {
    render(<ExpandedEditorWrapper initialValue="→" />);

    await waitFor(() => {
      expect(screen.getByTestId("expanded-highlights")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("expanded-syntax-highlight"),
    ).not.toBeInTheDocument();
  });
});

// --- testId未指定テスト ---

describe("FormulaExpandedEditor - testId未指定", () => {
  it("testIdがundefinedでもエラーなくレンダリングできる", () => {
    render(
      <FormulaExpandedEditor
        value="φ → ψ"
        onChange={vi.fn()}
        onClose={vi.fn()}
        testId={undefined}
      />,
    );
    expect(document.querySelector("[role='dialog']")).toBeInTheDocument();
  });

  it("testIdがundefinedでもエラー状態でレンダリングできる", () => {
    render(
      <FormulaExpandedEditor
        value="→"
        onChange={vi.fn()}
        onClose={vi.fn()}
        testId={undefined}
      />,
    );
    expect(document.querySelector("[role='dialog']")).toBeInTheDocument();
  });

  it("testIdがundefined + onOpenSyntaxHelpありでレンダリングできる", () => {
    render(
      <FormulaExpandedEditor
        value="φ"
        onChange={vi.fn()}
        onClose={vi.fn()}
        onOpenSyntaxHelp={vi.fn()}
        testId={undefined}
      />,
    );
    expect(document.querySelector("[role='dialog']")).toBeInTheDocument();
  });
});
