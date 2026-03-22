import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SequentPreview } from "./SequentPreview";

describe("SequentPreview", () => {
  describe("基本レンダリング", () => {
    it("前件・後件が空のとき ∅ を表示する", () => {
      render(
        <SequentPreview antecedents={[]} succedents={[]} testId="sp" />,
      );
      const el = screen.getByTestId("sp");
      expect(el).toHaveTextContent("∅⇒∅");
    });

    it("前件にパース可能な論理式がある場合 FormulaDisplay で表示する", () => {
      render(
        <SequentPreview antecedents={["φ"]} succedents={[]} testId="sp" />,
      );
      const el = screen.getByTestId("sp");
      // パース成功: FormulaDisplay (role="math")
      const mathEls = el.querySelectorAll("[role='math']");
      expect(mathEls).toHaveLength(1);
      expect(mathEls[0]).toHaveTextContent("φ");
    });

    it("後件にパース可能な論理式がある場合 FormulaDisplay で表示する", () => {
      render(
        <SequentPreview antecedents={[]} succedents={["ψ"]} testId="sp" />,
      );
      const el = screen.getByTestId("sp");
      const mathEls = el.querySelectorAll("[role='math']");
      expect(mathEls).toHaveLength(1);
      expect(mathEls[0]).toHaveTextContent("ψ");
    });
  });

  describe("パース失敗フォールバック", () => {
    it("パース不能な前件はエラーテキストで表示する", () => {
      render(
        <SequentPreview antecedents={["???"]} succedents={[]} testId="sp" />,
      );
      const el = screen.getByTestId("sp");
      expect(el).toHaveTextContent("???");
      // FormulaDisplay (role="math") はない
      const mathEls = el.querySelectorAll("[role='math']");
      expect(mathEls).toHaveLength(0);
    });

    it("パース不能な後件はエラーテキストで表示する", () => {
      render(
        <SequentPreview antecedents={[]} succedents={["!!!"]} testId="sp" />,
      );
      const el = screen.getByTestId("sp");
      expect(el).toHaveTextContent("!!!");
    });
  });

  describe("複数論理式のカンマ区切り", () => {
    it("前件が複数あるとカンマで区切られる", () => {
      render(
        <SequentPreview
          antecedents={["φ", "ψ"]}
          succedents={[]}
          testId="sp"
        />,
      );
      const el = screen.getByTestId("sp");
      expect(el).toHaveTextContent(/φ.*,.*ψ/);
    });

    it("後件が複数あるとカンマで区切られる", () => {
      render(
        <SequentPreview
          antecedents={[]}
          succedents={["φ", "ψ"]}
          testId="sp"
        />,
      );
      const el = screen.getByTestId("sp");
      expect(el).toHaveTextContent(/φ.*,.*ψ/);
    });
  });

  describe("空文字列のフィルタリング", () => {
    it("空文字列の前件はフィルタされて ∅ 表示になる", () => {
      render(
        <SequentPreview
          antecedents={["", "  "]}
          succedents={[]}
          testId="sp"
        />,
      );
      const el = screen.getByTestId("sp");
      // 空文字列はフィルタされるので ∅ 表示
      expect(el).toHaveTextContent("∅⇒∅");
    });
  });

  describe("testId", () => {
    it("testId 未指定でもレンダリングされる", () => {
      const { container } = render(
        <SequentPreview antecedents={["φ"]} succedents={["ψ"]} />,
      );
      expect(container.textContent).toContain("⇒");
    });
  });
});
