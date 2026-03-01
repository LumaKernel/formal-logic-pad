import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Term } from "../logic-core/term";
import { computeTermParseState, TermInput } from "./TermInput";

// --- 純粋関数のテスト ---

describe("computeTermParseState", () => {
  it("空文字列で empty を返す", () => {
    const result = computeTermParseState("");
    expect(result.status).toBe("empty");
  });

  it("空白のみで empty を返す", () => {
    const result = computeTermParseState("   ");
    expect(result.status).toBe("empty");
  });

  it("変数で success を返す", () => {
    const result = computeTermParseState("x");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.term._tag).toBe("TermVariable");
    }
  });

  it("定数で success を返す", () => {
    const result = computeTermParseState("0");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.term._tag).toBe("Constant");
    }
  });

  it("メタ変数で success を返す", () => {
    const result = computeTermParseState("τ");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.term._tag).toBe("TermMetaVariable");
    }
  });

  it("関数適用で success を返す", () => {
    const result = computeTermParseState("f(x, y)");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.term._tag).toBe("FunctionApplication");
    }
  });

  it("二項演算で success を返す", () => {
    const result = computeTermParseState("x + y");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.term._tag).toBe("BinaryOperation");
    }
  });

  it("無効な入力で error を返す", () => {
    const result = computeTermParseState("→");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("不完全な式で error を返す", () => {
    const result = computeTermParseState("x +");
    expect(result.status).toBe("error");
  });

  it("レキサーエラーを返す", () => {
    const result = computeTermParseState("x # y");
    expect(result.status).toBe("error");
  });
});

// --- コンポーネントのテスト ---

describe("TermInput", () => {
  describe("基本的なレンダリング", () => {
    it("入力欄を表示する", () => {
      render(<TermInput value="" onChange={() => {}} testId="ti" />);
      const input = screen.getByTestId("ti-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("デフォルトプレースホルダーを表示する", () => {
      render(<TermInput value="" onChange={() => {}} testId="ti" />);
      expect(screen.getByTestId("ti-input")).toHaveAttribute(
        "placeholder",
        "f(x, y)",
      );
    });

    it("カスタムプレースホルダーを表示する", () => {
      render(
        <TermInput
          value=""
          onChange={() => {}}
          placeholder="項を入力"
          testId="ti"
        />,
      );
      expect(screen.getByTestId("ti-input")).toHaveAttribute(
        "placeholder",
        "項を入力",
      );
    });

    it("空入力ではプレビューもエラーも表示しない", () => {
      render(<TermInput value="" onChange={() => {}} testId="ti" />);
      expect(screen.queryByTestId("ti-preview")).not.toBeInTheDocument();
      expect(screen.queryByTestId("ti-errors")).not.toBeInTheDocument();
    });
  });

  describe("パース成功時", () => {
    it("プレビューを表示する", () => {
      render(<TermInput value="x + y" onChange={() => {}} testId="ti" />);
      const preview = screen.getByTestId("ti-preview");
      expect(preview).toBeInTheDocument();
    });

    it("TermDisplayでプレビューを表示する", () => {
      render(<TermInput value="x + y" onChange={() => {}} testId="ti" />);
      const term = screen.getByTestId("ti-term");
      expect(term).toBeInTheDocument();
      expect(term).toHaveTextContent("x + y");
    });

    it("エラー表示がない", () => {
      render(<TermInput value="x" onChange={() => {}} testId="ti" />);
      expect(screen.queryByTestId("ti-errors")).not.toBeInTheDocument();
    });

    it("aria-invalid が false", () => {
      render(<TermInput value="x" onChange={() => {}} testId="ti" />);
      expect(screen.getByTestId("ti-input")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
    });
  });

  describe("パースエラー時", () => {
    it("エラーメッセージを表示する", () => {
      render(<TermInput value="→" onChange={() => {}} testId="ti" />);
      const errors = screen.getByTestId("ti-errors");
      expect(errors).toBeInTheDocument();
    });

    it("エラー個別のメッセージを表示する", () => {
      render(<TermInput value="→" onChange={() => {}} testId="ti" />);
      const error = screen.getByTestId("ti-error-0");
      expect(error).toBeInTheDocument();
      expect(error.textContent).toMatch(/1:\d+ .+/);
    });

    it("プレビューを表示しない", () => {
      render(<TermInput value="→" onChange={() => {}} testId="ti" />);
      expect(screen.queryByTestId("ti-preview")).not.toBeInTheDocument();
    });

    it("aria-invalid が true", () => {
      render(<TermInput value="→" onChange={() => {}} testId="ti" />);
      expect(screen.getByTestId("ti-input")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("エラーの role=alert が設定されている", () => {
      render(<TermInput value="→" onChange={() => {}} testId="ti" />);
      const errors = screen.getByTestId("ti-errors");
      expect(errors).toHaveAttribute("role", "alert");
    });

    it("ハイライト要素が表示される", () => {
      render(<TermInput value="→" onChange={() => {}} testId="ti" />);
      const highlights = screen.getByTestId("ti-highlights");
      expect(highlights).toBeInTheDocument();
      expect(highlights).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("onChange コールバック", () => {
    it("入力変更時に onChange が呼ばれる", () => {
      const onChange = vi.fn();
      render(<TermInput value="" onChange={onChange} testId="ti" />);
      fireEvent.change(screen.getByTestId("ti-input"), {
        target: { value: "x" },
      });
      expect(onChange).toHaveBeenCalledWith("x");
    });
  });

  describe("onParsed コールバック", () => {
    it("パース成功時に onParsed が呼ばれる", async () => {
      const onParsed = vi.fn();
      render(
        <TermInput
          value="x + y"
          onChange={() => {}}
          onParsed={onParsed}
          testId="ti"
        />,
      );
      await waitFor(() => {
        expect(onParsed).toHaveBeenCalledTimes(1);
      });
      const calledTerm = onParsed.mock.calls[0]?.[0] as Term;
      expect(calledTerm._tag).toBe("BinaryOperation");
    });

    it("パースエラー時に onParsed が呼ばれない", () => {
      const onParsed = vi.fn();
      render(
        <TermInput
          value="→"
          onChange={() => {}}
          onParsed={onParsed}
          testId="ti"
        />,
      );
      expect(onParsed).not.toHaveBeenCalled();
    });

    it("空入力時に onParsed が呼ばれない", () => {
      const onParsed = vi.fn();
      render(
        <TermInput
          value=""
          onChange={() => {}}
          onParsed={onParsed}
          testId="ti"
        />,
      );
      expect(onParsed).not.toHaveBeenCalled();
    });
  });

  describe("スタイルprops", () => {
    it("fontSize を適用する", () => {
      render(
        <TermInput value="" onChange={() => {}} fontSize={20} testId="ti" />,
      );
      const container = screen.getByTestId("ti");
      expect(container.style.fontSize).toBe("20px");
    });

    it("className を適用する", () => {
      render(
        <TermInput
          value=""
          onChange={() => {}}
          className="custom-class"
          testId="ti"
        />,
      );
      expect(screen.getByTestId("ti")).toHaveClass("custom-class");
    });
  });

  describe("複雑な項パターン", () => {
    it("関数適用のプレビューを表示する", () => {
      render(<TermInput value="f(x)" onChange={() => {}} testId="ti" />);
      expect(screen.getByTestId("ti-term")).toHaveTextContent("f(x)");
    });

    it("二項演算のプレビューを表示する", () => {
      render(<TermInput value="x * y + z" onChange={() => {}} testId="ti" />);
      expect(screen.getByTestId("ti-term")).toHaveTextContent("x × y + z");
    });

    it("定数のプレビューを表示する", () => {
      render(<TermInput value="0" onChange={() => {}} testId="ti" />);
      expect(screen.getByTestId("ti-term")).toHaveTextContent("0");
    });

    it("メタ変数のプレビューを表示する", () => {
      render(<TermInput value="τ" onChange={() => {}} testId="ti" />);
      expect(screen.getByTestId("ti-term")).toHaveTextContent("τ");
    });
  });

  describe("testIdなしのレンダリング", () => {
    it("testIdなしでも正常にレンダリングされる", () => {
      const { container } = render(
        <TermInput value="x + y" onChange={() => {}} />,
      );
      expect(container.querySelector("input")).toBeInTheDocument();
    });

    it("testIdなしでエラー表示も正常", () => {
      const { container } = render(<TermInput value="→" onChange={() => {}} />);
      const alert = container.querySelector("[role='alert']");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("testIdなしで補完ポップアップ", () => {
    it("testIdなしでも補完ポップアップが表示される", async () => {
      const onChange = vi.fn();
      const { rerender } = render(<TermInput value="" onChange={onChange} />);
      const input = document.querySelector("input")!;
      Object.defineProperty(input, "selectionStart", {
        value: 2,
        writable: true,
      });
      fireEvent.change(input, {
        target: { value: "ph", selectionStart: 2 },
      });
      rerender(<TermInput value="ph" onChange={onChange} />);
      await waitFor(() => {
        const popup = document.querySelector("[role='listbox']");
        expect(popup).toBeInTheDocument();
      });
    });
  });

  describe("ハイライトのエッジケース", () => {
    it("エラーハイライトがテキスト全体をカバーする場合", () => {
      // 単一の不正な文字のみ → ハイライトがテキスト全体をカバー
      render(<TermInput value="!" onChange={() => {}} testId="ti" />);
      // エラー表示があること
      const alert = document.querySelector("[role='alert']");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("補完機能", () => {
    it("補完候補を選択すると onChange が呼ばれる", async () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <TermInput value="" onChange={onChange} testId="ti" />,
      );
      // input要素のselectionStartを設定してから変更イベントを発火
      const input = screen.getByTestId("ti-input") as HTMLInputElement;
      // 値を設定してからselectionStartを正しく設定
      Object.defineProperty(input, "selectionStart", {
        value: 2,
        writable: true,
      });
      fireEvent.change(input, {
        target: { value: "ph", selectionStart: 2 },
      });
      // 制御コンポーネントなので、valueをrerenderで反映
      rerender(<TermInput value="ph" onChange={onChange} testId="ti" />);
      // 補完ポップアップが表示されるのを待つ
      await waitFor(() => {
        expect(screen.queryByTestId("ti-completion")).toBeInTheDocument();
      });
      // 最初の候補をクリック
      const popup = screen.getByTestId("ti-completion");
      const candidateItems = popup.querySelectorAll("[role='option']");
      expect(candidateItems.length).toBeGreaterThan(0);
      fireEvent.mouseDown(candidateItems[0]!);
      // onChange が追加で呼ばれることを確認（completion selectによる）
      const callCount = onChange.mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("構文ヘルプボタン", () => {
    it("onOpenSyntaxHelpが指定されているとき?ボタンが表示される", () => {
      const onOpenSyntaxHelp = vi.fn();
      render(
        <TermInput
          value=""
          onChange={() => {}}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId="ti"
        />,
      );
      expect(screen.getByTestId("ti-syntax-help")).toBeInTheDocument();
    });

    it("onOpenSyntaxHelpが指定されていないとき?ボタンが表示されない", () => {
      render(<TermInput value="" onChange={() => {}} testId="ti" />);
      expect(screen.queryByTestId("ti-syntax-help")).not.toBeInTheDocument();
    });

    it("?ボタンクリックでonOpenSyntaxHelpが呼ばれる", async () => {
      const onOpenSyntaxHelp = vi.fn();
      render(
        <TermInput
          value=""
          onChange={() => {}}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId="ti"
        />,
      );
      fireEvent.click(screen.getByTestId("ti-syntax-help"));
      expect(onOpenSyntaxHelp).toHaveBeenCalledOnce();
    });
  });
});
