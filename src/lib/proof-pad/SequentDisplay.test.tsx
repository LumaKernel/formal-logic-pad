import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { implication, metaVariable } from "../logic-core/formula";
import { SequentDisplay } from "./SequentDisplay";

describe("SequentDisplay", () => {
  describe("データソース分岐", () => {
    it("sequent prop が優先される", () => {
      const phi = metaVariable("φ");
      render(
        <SequentDisplay
          sequent={{
            antecedents: [phi],
            succedents: [implication(phi, phi)],
          }}
          text="ignored"
          testId="seq"
        />,
      );
      const el = screen.getByTestId("seq");
      expect(el).toHaveAttribute("role", "math");
      // sequent からの表示: FormulaDisplay で描画される
      expect(screen.getByTestId("seq-ant-0")).toHaveTextContent("φ");
      expect(screen.getByTestId("seq-suc-0")).toHaveTextContent("φ → φ");
    });

    it("text prop からパースする", () => {
      render(<SequentDisplay text="φ ⇒ ψ" testId="seq" />);
      const el = screen.getByTestId("seq");
      expect(el).toHaveAttribute("aria-label", "φ ⇒ ψ");
      expect(screen.getByTestId("seq-turnstile")).toHaveTextContent("⇒");
    });

    it("どちらも未指定なら空のシーケントを表示", () => {
      render(<SequentDisplay testId="seq" />);
      const el = screen.getByTestId("seq");
      expect(el).toHaveAttribute("role", "math");
      expect(el).toHaveAttribute("aria-label", "");
    });
  });

  describe("FormulaSlotView 分岐", () => {
    it("パース成功: FormulaDisplay で表示 (parsed slot)", () => {
      render(<SequentDisplay text="φ ⇒ ψ" testId="seq" />);
      // parsed slot は FormulaDisplay → role="math"
      const ant0 = screen.getByTestId("seq-ant-0");
      expect(ant0).toHaveAttribute("role", "math");
      expect(ant0).toHaveTextContent("φ");
    });

    it("パース失敗: テキストフォールバック (text slot)", () => {
      render(<SequentDisplay text="??? ⇒ φ" testId="seq" />);
      // "???" はパースできないので text slot
      const ant0 = screen.getByTestId("seq-ant-0");
      expect(ant0).not.toHaveAttribute("role", "math");
      expect(ant0).toHaveTextContent("???");
    });
  });

  describe("スタイル props", () => {
    it("fontSize を適用する（数値）", () => {
      render(<SequentDisplay text="φ ⇒ ψ" fontSize={20} testId="seq" />);
      const el = screen.getByTestId("seq");
      expect(el.style.fontSize).toBe("20px");
      // turnstile は 1.1 倍
      const turnstile = screen.getByTestId("seq-turnstile");
      expect(turnstile.style.fontSize).toBe("22px");
    });

    it("fontSize を適用する（文字列）", () => {
      render(<SequentDisplay text="φ ⇒ ψ" fontSize="1.5em" testId="seq" />);
      const turnstile = screen.getByTestId("seq-turnstile");
      expect(turnstile.style.fontSize).toBe("1.5em");
    });

    it("color を適用する", () => {
      render(<SequentDisplay text="φ ⇒ ψ" color="blue" testId="seq" />);
      const el = screen.getByTestId("seq");
      expect(el.style.color).toBe("blue");
    });

    it("fontSize/color 未指定でもレンダリングされる", () => {
      render(<SequentDisplay text="φ ⇒ ψ" testId="seq" />);
      const el = screen.getByTestId("seq");
      expect(el.style.fontSize).toBe("");
      expect(el.style.color).toBe("");
    });
  });

  describe("testId 分岐", () => {
    it("testId 未指定でもレンダリングされる", () => {
      const { container } = render(<SequentDisplay text="φ ⇒ ψ" />);
      const el = container.querySelector("[role='math']");
      expect(el).not.toBeNull();
      expect(el).not.toHaveAttribute("data-testid");
    });
  });

  describe("複数論理式のカンマ区切り", () => {
    it("前件が複数あるとカンマで区切られる", () => {
      render(<SequentDisplay text="φ, ψ ⇒ χ" testId="seq" />);
      const ant0 = screen.getByTestId("seq-ant-0");
      const ant1 = screen.getByTestId("seq-ant-1");
      expect(ant0).toHaveTextContent("φ");
      expect(ant1).toHaveTextContent("ψ");
    });
  });

  describe("パース失敗時のスタイル props", () => {
    it("text slot に fontSize/color が適用される", () => {
      render(
        <SequentDisplay
          text="??? ⇒ φ"
          fontSize={18}
          color="red"
          testId="seq"
        />,
      );
      const ant0 = screen.getByTestId("seq-ant-0");
      expect(ant0.style.fontSize).toBe("18px");
      expect(ant0.style.color).toBe("red");
    });

    it("text slot に fontSize/color 未指定", () => {
      render(<SequentDisplay text="??? ⇒ φ" testId="seq" />);
      const ant0 = screen.getByTestId("seq-ant-0");
      expect(ant0.style.fontSize).toBe("");
      expect(ant0.style.color).toBe("");
    });
  });

  describe("sequentTexts prop", () => {
    it("sequentTexts から表示データを生成する（text の再パースをスキップ）", () => {
      render(
        <SequentDisplay
          text="φ, ψ ⇒ χ"
          sequentTexts={{
            antecedentTexts: ["φ", "ψ"],
            succedentTexts: ["χ"],
          }}
          testId="seq"
        />,
      );
      expect(screen.getByTestId("seq-ant-0")).toHaveTextContent("φ");
      expect(screen.getByTestId("seq-ant-1")).toHaveTextContent("ψ");
      expect(screen.getByTestId("seq-suc-0")).toHaveTextContent("χ");
    });

    it("sequentTexts のみ（text なし）で表示できる", () => {
      render(
        <SequentDisplay
          sequentTexts={{
            antecedentTexts: ["φ"],
            succedentTexts: ["ψ"],
          }}
          testId="seq"
        />,
      );
      expect(screen.getByTestId("seq-ant-0")).toHaveTextContent("φ");
      expect(screen.getByTestId("seq-suc-0")).toHaveTextContent("ψ");
    });
  });
});
