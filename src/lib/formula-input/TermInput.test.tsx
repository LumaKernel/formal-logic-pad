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
      render(
        <TermInput value="" onChange={() => {}} testId="ti" />,
      );
      const input = screen.getByTestId("ti-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("デフォルトプレースホルダーを表示する", () => {
      render(
        <TermInput value="" onChange={() => {}} testId="ti" />,
      );
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
      render(
        <TermInput value="" onChange={() => {}} testId="ti" />,
      );
      expect(screen.queryByTestId("ti-preview")).not.toBeInTheDocument();
      expect(screen.queryByTestId("ti-errors")).not.toBeInTheDocument();
    });
  });

  describe("パース成功時", () => {
    it("プレビューを表示する", () => {
      render(
        <TermInput value="x + y" onChange={() => {}} testId="ti" />,
      );
      const preview = screen.getByTestId("ti-preview");
      expect(preview).toBeInTheDocument();
    });

    it("TermDisplayでプレビューを表示する", () => {
      render(
        <TermInput value="x + y" onChange={() => {}} testId="ti" />,
      );
      const term = screen.getByTestId("ti-term");
      expect(term).toBeInTheDocument();
      expect(term).toHaveTextContent("x + y");
    });

    it("エラー表示がない", () => {
      render(
        <TermInput value="x" onChange={() => {}} testId="ti" />,
      );
      expect(screen.queryByTestId("ti-errors")).not.toBeInTheDocument();
    });

    it("aria-invalid が false", () => {
      render(
        <TermInput value="x" onChange={() => {}} testId="ti" />,
      );
      expect(screen.getByTestId("ti-input")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
    });
  });

  describe("パースエラー時", () => {
    it("エラーメッセージを表示する", () => {
      render(
        <TermInput value="→" onChange={() => {}} testId="ti" />,
      );
      const errors = screen.getByTestId("ti-errors");
      expect(errors).toBeInTheDocument();
    });

    it("エラー個別のメッセージを表示する", () => {
      render(
        <TermInput value="→" onChange={() => {}} testId="ti" />,
      );
      const error = screen.getByTestId("ti-error-0");
      expect(error).toBeInTheDocument();
      expect(error.textContent).toMatch(/1:\d+ .+/);
    });

    it("プレビューを表示しない", () => {
      render(
        <TermInput value="→" onChange={() => {}} testId="ti" />,
      );
      expect(screen.queryByTestId("ti-preview")).not.toBeInTheDocument();
    });

    it("aria-invalid が true", () => {
      render(
        <TermInput value="→" onChange={() => {}} testId="ti" />,
      );
      expect(screen.getByTestId("ti-input")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("エラーの role=alert が設定されている", () => {
      render(
        <TermInput value="→" onChange={() => {}} testId="ti" />,
      );
      const errors = screen.getByTestId("ti-errors");
      expect(errors).toHaveAttribute("role", "alert");
    });

    it("ハイライト要素が表示される", () => {
      render(
        <TermInput value="→" onChange={() => {}} testId="ti" />,
      );
      const highlights = screen.getByTestId("ti-highlights");
      expect(highlights).toBeInTheDocument();
      expect(highlights).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("onChange コールバック", () => {
    it("入力変更時に onChange が呼ばれる", () => {
      const onChange = vi.fn();
      render(
        <TermInput value="" onChange={onChange} testId="ti" />,
      );
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
        <TermInput
          value=""
          onChange={() => {}}
          fontSize={20}
          testId="ti"
        />,
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
      render(
        <TermInput value="f(x)" onChange={() => {}} testId="ti" />,
      );
      expect(screen.getByTestId("ti-term")).toHaveTextContent("f(x)");
    });

    it("二項演算のプレビューを表示する", () => {
      render(
        <TermInput value="x * y + z" onChange={() => {}} testId="ti" />,
      );
      expect(screen.getByTestId("ti-term")).toHaveTextContent("x × y + z");
    });

    it("定数のプレビューを表示する", () => {
      render(
        <TermInput value="0" onChange={() => {}} testId="ti" />,
      );
      expect(screen.getByTestId("ti-term")).toHaveTextContent("0");
    });

    it("メタ変数のプレビューを表示する", () => {
      render(
        <TermInput value="τ" onChange={() => {}} testId="ti" />,
      );
      expect(screen.getByTestId("ti-term")).toHaveTextContent("τ");
    });
  });
});
