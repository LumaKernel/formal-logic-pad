import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
} from "../logic-core/index";
import { TruthTableComponent } from "./TruthTableComponent";

// ── ヘルパー ─────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");

// ── 基本レンダリング ─────────────────────────────────────

describe("TruthTableComponent", () => {
  describe("基本レンダリング", () => {
    it("1変数の真理値表を正しく表示する", () => {
      render(<TruthTableComponent formula={phi} testId="tt" />);
      const table = screen.getByTestId("tt-table");
      expect(table).toBeInTheDocument();
      // テーブルの行: thead 1行 + tbody 2行 = 3行
      const rows = table.querySelectorAll("tr");
      expect(rows).toHaveLength(3);
    });

    it("2変数の真理値表を正しく表示する", () => {
      const formula = conjunction(phi, psi);
      render(<TruthTableComponent formula={formula} testId="tt" />);
      const table = screen.getByTestId("tt-table");
      // テーブルの行: thead 1行 + tbody 4行 = 5行
      const rows = table.querySelectorAll("tr");
      expect(rows).toHaveLength(5);
    });

    it("変数名がヘッダーに表示される", () => {
      const formula = implication(phi, psi);
      render(<TruthTableComponent formula={formula} testId="tt" />);
      const table = screen.getByTestId("tt-table");
      const headers = table.querySelectorAll("th");
      // φ, ψ, 結果カラム = 3
      expect(headers).toHaveLength(3);
      expect(headers[0]!.textContent).toBe("φ");
      expect(headers[1]!.textContent).toBe("ψ");
    });

    it("真理値が T/F で表示される", () => {
      render(<TruthTableComponent formula={phi} testId="tt" />);
      const table = screen.getByTestId("tt-table");
      const cells = table.querySelectorAll("td");
      // 2行 × 2列(値+結果) = 4セル
      expect(cells).toHaveLength(4);
      // 1行目: φ=F, 結果=F
      expect(cells[0]!.textContent).toBe("F");
      expect(cells[1]!.textContent).toBe("F");
      // 2行目: φ=T, 結果=T
      expect(cells[2]!.textContent).toBe("T");
      expect(cells[3]!.textContent).toBe("T");
    });
  });

  // ── 分類バッジ ─────────────────────────────────────────

  describe("分類バッジ", () => {
    it("恒真式のバッジを表示する（日本語）", () => {
      const formula = implication(phi, phi);
      render(<TruthTableComponent formula={formula} locale="ja" testId="tt" />);
      const badge = screen.getByTestId("tt-badge");
      expect(badge.textContent).toBe("恒真（トートロジー）");
    });

    it("矛盾のバッジを表示する（日本語）", () => {
      const formula = conjunction(phi, negation(phi));
      render(<TruthTableComponent formula={formula} locale="ja" testId="tt" />);
      const badge = screen.getByTestId("tt-badge");
      expect(badge.textContent).toBe("矛盾（充足不可能）");
    });

    it("充足可能のバッジを表示する（日本語）", () => {
      render(<TruthTableComponent formula={phi} locale="ja" testId="tt" />);
      const badge = screen.getByTestId("tt-badge");
      expect(badge.textContent).toBe("充足可能");
    });

    it("英語ロケールでバッジを表示する", () => {
      const formula = implication(phi, phi);
      render(<TruthTableComponent formula={formula} locale="en" testId="tt" />);
      const badge = screen.getByTestId("tt-badge");
      expect(badge.textContent).toBe("Tautology");
    });
  });

  // ── KaTeX レンダリング ─────────────────────────────────

  describe("KaTeXレンダリング", () => {
    it("結果カラムヘッダーにKaTeXで論理式が表示される", () => {
      render(<TruthTableComponent formula={phi} testId="tt" />);
      const table = screen.getByTestId("tt-table");
      const lastHeader = table.querySelectorAll("th");
      // 結果ヘッダー（最後のth）に role="math" の要素がある
      const mathElement =
        lastHeader[lastHeader.length - 1]!.querySelector("[role='math']");
      expect(mathElement).not.toBeNull();
    });
  });

  // ── data-testid ────────────────────────────────────────

  describe("data-testid", () => {
    it("testIdが指定されないとdata-testidが付かない", () => {
      const { container } = render(<TruthTableComponent formula={phi} />);
      const divs = container.querySelectorAll("[data-testid]");
      expect(divs).toHaveLength(0);
    });

    it("testIdが指定されるとdata-testidが付く", () => {
      render(<TruthTableComponent formula={phi} testId="my-tt" />);
      expect(screen.getByTestId("my-tt")).toBeInTheDocument();
      expect(screen.getByTestId("my-tt-badge")).toBeInTheDocument();
      expect(screen.getByTestId("my-tt-table")).toBeInTheDocument();
    });
  });

  // ── デフォルトロケール ─────────────────────────────────

  describe("デフォルトロケール", () => {
    it("ロケール未指定時は日本語が表示される", () => {
      render(<TruthTableComponent formula={phi} testId="tt" />);
      const badge = screen.getByTestId("tt-badge");
      expect(badge.textContent).toBe("充足可能");
    });
  });

  // ── 論理的正確性 ───────────────────────────────────────

  describe("論理的正確性", () => {
    it("φ ∧ ψ: (T,T) のみ真", () => {
      const formula = conjunction(phi, psi);
      render(<TruthTableComponent formula={formula} testId="tt" />);
      const table = screen.getByTestId("tt-table");
      const rows = table.querySelectorAll("tbody tr");
      // 結果セルは各行の最後のtd
      const results = [...rows].map((row) => {
        const cells = row.querySelectorAll("td");
        return cells[cells.length - 1]!.textContent;
      });
      expect(results).toEqual(["F", "F", "F", "T"]);
    });

    it("φ ∨ ψ: (F,F) のみ偽", () => {
      const formula = disjunction(phi, psi);
      render(<TruthTableComponent formula={formula} testId="tt" />);
      const table = screen.getByTestId("tt-table");
      const rows = table.querySelectorAll("tbody tr");
      const results = [...rows].map((row) => {
        const cells = row.querySelectorAll("td");
        return cells[cells.length - 1]!.textContent;
      });
      expect(results).toEqual(["F", "T", "T", "T"]);
    });

    it("排中律 φ ∨ ¬φ は恒真", () => {
      const formula = disjunction(phi, negation(phi));
      render(<TruthTableComponent formula={formula} testId="tt" />);
      const badge = screen.getByTestId("tt-badge");
      expect(badge.textContent).toBe("恒真（トートロジー）");
      const table = screen.getByTestId("tt-table");
      const rows = table.querySelectorAll("tbody tr");
      const results = [...rows].map((row) => {
        const cells = row.querySelectorAll("td");
        return cells[cells.length - 1]!.textContent;
      });
      expect(results).toEqual(["T", "T"]);
    });
  });
});
