import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Formula } from "../logic-core/formula";
import { ParseError } from "../logic-lang/parser";
import {
  computeErrorHighlights,
  computeParseState,
  formatErrorMessage,
  FormulaInput,
} from "./FormulaInput";

// --- 純粋関数のテスト ---

describe("computeParseState", () => {
  it("空文字列で empty を返す", () => {
    const result = computeParseState("");
    expect(result.status).toBe("empty");
  });

  it("空白のみで empty を返す", () => {
    const result = computeParseState("   ");
    expect(result.status).toBe("empty");
  });

  it("有効な論理式で success を返す", () => {
    const result = computeParseState("φ → ψ");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.formula._tag).toBe("Implication");
    }
  });

  it("無効な入力で error を返す", () => {
    const result = computeParseState("→");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("否定式を正しくパースする", () => {
    const result = computeParseState("¬φ");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.formula._tag).toBe("Negation");
    }
  });

  it("量化子を含む論理式をパースする", () => {
    const result = computeParseState("∀x. P(x)");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.formula._tag).toBe("Universal");
    }
  });

  it("複雑な式をパースする", () => {
    const result = computeParseState("(φ → ψ) → (¬ψ → ¬φ)");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.formula._tag).toBe("Implication");
    }
  });

  it("レキサーエラーを返す", () => {
    // 不正なトークンを含む入力
    const result = computeParseState("φ # ψ");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("computeErrorHighlights", () => {
  it("エラーのスパンからハイライト範囲を計算する", () => {
    const highlights = computeErrorHighlights("→ ψ", [
      new ParseError({
        message: "Unexpected token",
        span: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 2 },
        },
      }),
    ]);
    expect(highlights).toHaveLength(1);
    expect(highlights[0]?.start).toBe(0);
    expect(highlights[0]?.end).toBe(1);
  });

  it("end <= start の場合は最低1文字をハイライトする", () => {
    const highlights = computeErrorHighlights("abc", [
      new ParseError({
        message: "Error",
        span: {
          start: { line: 1, column: 2 },
          end: { line: 1, column: 2 },
        },
      }),
    ]);
    expect(highlights).toHaveLength(1);
    expect(highlights[0]?.start).toBe(1);
    expect(highlights[0]?.end).toBe(2);
  });

  it("入力範囲を超えるオフセットをクランプする", () => {
    const highlights = computeErrorHighlights("ab", [
      new ParseError({
        message: "Error",
        span: {
          start: { line: 1, column: 10 },
          end: { line: 1, column: 20 },
        },
      }),
    ]);
    expect(highlights).toHaveLength(1);
    expect(highlights[0]?.start).toBe(2);
    expect(highlights[0]?.end).toBe(2);
  });

  it("複数エラーでハイライトを返す", () => {
    const highlights = computeErrorHighlights("a → → b", [
      new ParseError({
        message: "Error 1",
        span: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 2 },
        },
      }),
      new ParseError({
        message: "Error 2",
        span: {
          start: { line: 1, column: 5 },
          end: { line: 1, column: 6 },
        },
      }),
    ]);
    expect(highlights).toHaveLength(2);
  });

  it("複数行のエラー位置を正しく計算する", () => {
    const input = "abc\ndef";
    const highlights = computeErrorHighlights(input, [
      new ParseError({
        message: "Error",
        span: {
          start: { line: 2, column: 1 },
          end: { line: 2, column: 3 },
        },
      }),
    ]);
    expect(highlights).toHaveLength(1);
    expect(highlights[0]?.start).toBe(4); // "abc\n" = 4 chars
    expect(highlights[0]?.end).toBe(6); // "de" = 2 chars
  });
});

describe("formatErrorMessage", () => {
  it("行:列とメッセージをフォーマットする", () => {
    const msg = formatErrorMessage(
      new ParseError({
        message: "Unexpected token",
        span: {
          start: { line: 1, column: 3 },
          end: { line: 1, column: 4 },
        },
      }),
    );
    expect(msg).toBe("1:3 Unexpected token");
  });

  it("2行目のエラーをフォーマットする", () => {
    const msg = formatErrorMessage(
      new ParseError({
        message: "Expected ')'",
        span: {
          start: { line: 2, column: 5 },
          end: { line: 2, column: 6 },
        },
      }),
    );
    expect(msg).toBe("2:5 Expected ')'");
  });
});

// --- コンポーネントのテスト ---

describe("FormulaInput", () => {
  describe("基本的なレンダリング", () => {
    it("入力欄を表示する", () => {
      render(<FormulaInput value="" onChange={() => {}} testId="fi" />);
      const input = screen.getByTestId("fi-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("プレースホルダーを表示する", () => {
      render(<FormulaInput value="" onChange={() => {}} testId="fi" />);
      expect(screen.getByTestId("fi-input")).toHaveAttribute(
        "placeholder",
        "φ → ψ",
      );
    });

    it("カスタムプレースホルダーを表示する", () => {
      render(
        <FormulaInput
          value=""
          onChange={() => {}}
          placeholder="入力してください"
          testId="fi"
        />,
      );
      expect(screen.getByTestId("fi-input")).toHaveAttribute(
        "placeholder",
        "入力してください",
      );
    });

    it("空入力ではプレビューもエラーも表示しない", () => {
      render(<FormulaInput value="" onChange={() => {}} testId="fi" />);
      expect(screen.queryByTestId("fi-preview")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fi-errors")).not.toBeInTheDocument();
    });
  });

  describe("パース成功時", () => {
    it("プレビューを表示する", () => {
      render(<FormulaInput value="φ → ψ" onChange={() => {}} testId="fi" />);
      const preview = screen.getByTestId("fi-preview");
      expect(preview).toBeInTheDocument();
    });

    it("FormulaDisplayでプレビューを表示する", () => {
      render(<FormulaInput value="φ → ψ" onChange={() => {}} testId="fi" />);
      const formula = screen.getByTestId("fi-formula");
      expect(formula).toBeInTheDocument();
      expect(formula).toHaveTextContent("φ → ψ");
    });

    it("エラー表示がない", () => {
      render(<FormulaInput value="φ → ψ" onChange={() => {}} testId="fi" />);
      expect(screen.queryByTestId("fi-errors")).not.toBeInTheDocument();
    });

    it("aria-invalid が false", () => {
      render(<FormulaInput value="φ → ψ" onChange={() => {}} testId="fi" />);
      expect(screen.getByTestId("fi-input")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
    });

    it("showPreview=falseでプレビューが非表示", () => {
      render(
        <FormulaInput
          value="φ → ψ"
          onChange={() => {}}
          testId="fi"
          showPreview={false}
        />,
      );
      expect(screen.queryByTestId("fi-preview")).not.toBeInTheDocument();
      // 入力欄は存在する
      expect(screen.getByTestId("fi-input")).toBeInTheDocument();
    });
  });

  describe("パースエラー時", () => {
    it("エラーメッセージを表示する", () => {
      render(<FormulaInput value="→" onChange={() => {}} testId="fi" />);
      const errors = screen.getByTestId("fi-errors");
      expect(errors).toBeInTheDocument();
    });

    it("エラー個別のメッセージを表示する", () => {
      render(<FormulaInput value="→" onChange={() => {}} testId="fi" />);
      const error = screen.getByTestId("fi-error-0");
      expect(error).toBeInTheDocument();
      expect(error.textContent).toMatch(/1:\d+ .+/);
    });

    it("プレビューを表示しない", () => {
      render(<FormulaInput value="→" onChange={() => {}} testId="fi" />);
      expect(screen.queryByTestId("fi-preview")).not.toBeInTheDocument();
    });

    it("aria-invalid が true", () => {
      render(<FormulaInput value="→" onChange={() => {}} testId="fi" />);
      expect(screen.getByTestId("fi-input")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("エラーの role=alert が設定されている", () => {
      render(<FormulaInput value="→" onChange={() => {}} testId="fi" />);
      const errors = screen.getByTestId("fi-errors");
      expect(errors).toHaveAttribute("role", "alert");
    });
  });

  describe("onChange コールバック", () => {
    it("入力変更時に onChange が呼ばれる", () => {
      const onChange = vi.fn();
      render(<FormulaInput value="" onChange={onChange} testId="fi" />);
      fireEvent.change(screen.getByTestId("fi-input"), {
        target: { value: "φ" },
      });
      expect(onChange).toHaveBeenCalledWith("φ");
    });
  });

  describe("onParsed コールバック", () => {
    it("パース成功時に onParsed が呼ばれる", async () => {
      const onParsed = vi.fn();
      render(
        <FormulaInput
          value="φ → ψ"
          onChange={() => {}}
          onParsed={onParsed}
          testId="fi"
        />,
      );
      await waitFor(() => {
        expect(onParsed).toHaveBeenCalledTimes(1);
      });
      const calledFormula = onParsed.mock.calls[0]?.[0] as Formula;
      expect(calledFormula._tag).toBe("Implication");
    });

    it("パースエラー時に onParsed が呼ばれない", () => {
      const onParsed = vi.fn();
      render(
        <FormulaInput
          value="→"
          onChange={() => {}}
          onParsed={onParsed}
          testId="fi"
        />,
      );
      expect(onParsed).not.toHaveBeenCalled();
    });

    it("空入力時に onParsed が呼ばれない", () => {
      const onParsed = vi.fn();
      render(
        <FormulaInput
          value=""
          onChange={() => {}}
          onParsed={onParsed}
          testId="fi"
        />,
      );
      expect(onParsed).not.toHaveBeenCalled();
    });
  });

  describe("スタイルprops", () => {
    it("fontSize を適用する", () => {
      render(
        <FormulaInput value="" onChange={() => {}} fontSize={20} testId="fi" />,
      );
      const container = screen.getByTestId("fi");
      expect(container.style.fontSize).toBe("20px");
    });

    it("className を適用する", () => {
      render(
        <FormulaInput
          value=""
          onChange={() => {}}
          className="custom-class"
          testId="fi"
        />,
      );
      expect(screen.getByTestId("fi")).toHaveClass("custom-class");
    });

    it("style を適用する", () => {
      render(
        <FormulaInput
          value=""
          onChange={() => {}}
          style={{ maxWidth: 400 }}
          testId="fi"
        />,
      );
      const container = screen.getByTestId("fi");
      expect(container.style.maxWidth).toBe("400px");
    });
  });

  describe("エラーハイライト", () => {
    it("パースエラー時にハイライト要素が表示される", () => {
      render(<FormulaInput value="→" onChange={() => {}} testId="fi" />);
      const highlights = screen.getByTestId("fi-highlights");
      expect(highlights).toBeInTheDocument();
      expect(highlights).toHaveAttribute("aria-hidden", "true");
    });

    it("パース成功時にハイライト要素がない", () => {
      render(<FormulaInput value="φ" onChange={() => {}} testId="fi" />);
      expect(screen.queryByTestId("fi-highlights")).not.toBeInTheDocument();
    });
  });

  describe("エラーハイライトの詳細", () => {
    it("エラーが入力の中間にあるとき前後のテキストがある", () => {
      // "φ → → ψ" は → → がエラーで前後にテキストがある
      render(<FormulaInput value="φ → → ψ" onChange={() => {}} testId="fi" />);
      const highlights = screen.getByTestId("fi-highlights");
      expect(highlights).toBeInTheDocument();
      // mark要素が存在する
      const marks = highlights.querySelectorAll("mark");
      expect(marks.length).toBeGreaterThan(0);
    });

    it("末尾にエラーがあるとき前にテキストがある", () => {
      // "φ →" は末尾が不完全
      render(<FormulaInput value="φ →" onChange={() => {}} testId="fi" />);
      const highlights = screen.getByTestId("fi-highlights");
      expect(highlights).toBeInTheDocument();
    });
  });

  describe("複雑な入力パターン", () => {
    it("否定式のプレビューを表示する", () => {
      render(<FormulaInput value="¬φ" onChange={() => {}} testId="fi" />);
      expect(screen.getByTestId("fi-formula")).toHaveTextContent("¬φ");
    });

    it("量化子付き論理式のプレビューを表示する", () => {
      render(<FormulaInput value="∀x. P(x)" onChange={() => {}} testId="fi" />);
      expect(screen.getByTestId("fi-formula")).toHaveTextContent("∀x.P(x)");
    });

    it("等式のプレビューを表示する", () => {
      render(<FormulaInput value="x = y" onChange={() => {}} testId="fi" />);
      expect(screen.getByTestId("fi-formula")).toHaveTextContent("x = y");
    });
  });

  describe("シンタックスハイライト", () => {
    it("有効な論理式入力時にシンタックスハイライトが表示される", () => {
      render(
        <FormulaInput value="phi -> psi" onChange={() => {}} testId="fi" />,
      );
      const highlight = screen.getByTestId("fi-syntax-highlight");
      expect(highlight).toBeInTheDocument();
      expect(highlight).toHaveAttribute("aria-hidden", "true");
    });

    it("シンタックスハイライトのspan要素が色分けされている", () => {
      render(
        <FormulaInput value="phi -> psi" onChange={() => {}} testId="fi" />,
      );
      const highlight = screen.getByTestId("fi-syntax-highlight");
      const spans = highlight.querySelectorAll("span");
      expect(spans.length).toBeGreaterThan(0);
      // 少なくとも1つのspanにcolor スタイルがある
      const hasColoredSpan = Array.from(spans).some(
        (span) => span.style.color !== "",
      );
      expect(hasColoredSpan).toBe(true);
    });

    it("空入力時にはシンタックスハイライトが表示されない", () => {
      render(<FormulaInput value="" onChange={() => {}} testId="fi" />);
      expect(
        screen.queryByTestId("fi-syntax-highlight"),
      ).not.toBeInTheDocument();
    });

    it("パースエラー時にはシンタックスハイライトが表示されない（エラーハイライトが優先）", () => {
      render(<FormulaInput value="→" onChange={() => {}} testId="fi" />);
      expect(
        screen.queryByTestId("fi-syntax-highlight"),
      ).not.toBeInTheDocument();
      // エラーハイライトは表示される
      expect(screen.getByTestId("fi-highlights")).toBeInTheDocument();
    });

    it("Unicode入力でもシンタックスハイライトが表示される", () => {
      render(<FormulaInput value="φ → ψ" onChange={() => {}} testId="fi" />);
      const highlight = screen.getByTestId("fi-syntax-highlight");
      expect(highlight).toBeInTheDocument();
    });

    it("入力テキストがtransparentで表示される（ハイライト時）", () => {
      render(
        <FormulaInput value="phi -> psi" onChange={() => {}} testId="fi" />,
      );
      const input = screen.getByTestId("fi-input");
      expect(input.style.color).toBe("transparent");
    });

    it("カーソル色が維持される（ハイライト時）", () => {
      render(
        <FormulaInput value="phi -> psi" onChange={() => {}} testId="fi" />,
      );
      const input = screen.getByTestId("fi-input");
      expect(input.style.caretColor).not.toBe("");
    });

    it("lexerエラーの入力ではシンタックスハイライトが表示されない", () => {
      // "@@@@" はlexerが不正文字エラーを出すが、parserに到達しない可能性
      // parserエラーとして扱われるケースでも適切に動作すること
      render(<FormulaInput value="@@@@" onChange={() => {}} testId="fi" />);
      expect(
        screen.queryByTestId("fi-syntax-highlight"),
      ).not.toBeInTheDocument();
    });
  });

  describe("testIdなしのレンダリング", () => {
    it("testIdなしでも正常にレンダリングされる", () => {
      const { container } = render(
        <FormulaInput value="φ → ψ" onChange={() => {}} />,
      );
      expect(container.querySelector("input")).toBeInTheDocument();
    });

    it("testIdなしでエラー表示も正常", () => {
      const { container } = render(
        <FormulaInput value="→" onChange={() => {}} />,
      );
      const alert = container.querySelector("[role='alert']");
      expect(alert).toBeInTheDocument();
    });

    it("testIdなしで補完ポップアップが表示される", async () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <FormulaInput value="" onChange={onChange} />,
      );
      const input = document.querySelector("input")!;
      Object.defineProperty(input, "selectionStart", {
        value: 2,
        writable: true,
      });
      fireEvent.change(input, {
        target: { value: "ph", selectionStart: 2 },
      });
      rerender(<FormulaInput value="ph" onChange={onChange} />);
      await waitFor(() => {
        const popup = document.querySelector("[role='listbox']");
        expect(popup).toBeInTheDocument();
      });
    });
  });
});
