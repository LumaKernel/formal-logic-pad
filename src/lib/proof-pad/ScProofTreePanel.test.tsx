/**
 * ScProofTreePanel のテスト。
 *
 * Gentzenスタイル証明木パネルのレンダリングを検証する。
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Formula } from "../logic-core/formula";
import { MetaVariable } from "../logic-core/formula";
import {
  scIdentity,
  scCut,
  scImplicationRight,
  scWeakeningLeft,
  sequent,
} from "../logic-core/sequentCalculus";
import { ScProofTreePanel } from "./ScProofTreePanel";

// ── テストヘルパー ──────────────────────────────────────────

const phi: Formula = new MetaVariable({ name: "φ" });
const psi: Formula = new MetaVariable({ name: "ψ" });

// ── テスト ──────────────────────────────────────────

describe("ScProofTreePanel", () => {
  it("公理ノードを表示する", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    render(<ScProofTreePanel proof={proof} testId="tree" />);

    expect(screen.getByTestId("tree")).toBeDefined();
    expect(screen.getByText("Proof Tree")).toBeDefined();
    expect(screen.getByText("1 nodes, depth 0")).toBeDefined();
  });

  it("規則ラベルを表示する", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    render(<ScProofTreePanel proof={proof} testId="tree" />);

    // Id 規則ラベル
    const ruleEl = screen.getByTestId("tree-rule-sctree-0");
    expect(ruleEl.textContent).toBe("Id");
  });

  it("結論テキストにturnstile記号が含まれる", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    render(<ScProofTreePanel proof={proof} testId="tree" />);

    const conclEl = screen.getByTestId("tree-concl-sctree-0");
    expect(conclEl.textContent).toContain("⊢");
  });

  it("単項規則で前提と結論を表示する", () => {
    const leaf = scIdentity(sequent([phi], [psi]));
    const proof = scImplicationRight(leaf, sequent([], [phi]));
    render(<ScProofTreePanel proof={proof} testId="tree" />);

    expect(screen.getByText("2 nodes, depth 1")).toBeDefined();
    // 規則ラベルが表示される（IDは割り当て順序に依存するのでテキスト内容で検証）
    const allRules = screen.getAllByText(/^(→R|Id)$/);
    const ruleTexts = allRules.map((el) => el.textContent);
    expect(ruleTexts).toContain("→R");
    expect(ruleTexts).toContain("Id");
  });

  it("二項規則で2つの前提を表示する", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [psi]));
    const proof = scCut(left, right, phi, sequent([phi], [psi]));
    render(<ScProofTreePanel proof={proof} testId="tree" />);

    expect(screen.getByText("3 nodes, depth 1")).toBeDefined();
    const allRules = screen.getAllByText(/^(Cut|Id)$/);
    const ruleTexts = allRules.map((el) => el.textContent);
    expect(ruleTexts).toContain("Cut");
    expect(ruleTexts.filter((t) => t === "Id")).toHaveLength(2);
  });

  it("深いツリーを正しく表示する", () => {
    const leaf = scIdentity(sequent([phi], [phi]));
    const mid = scWeakeningLeft(leaf, psi, sequent([psi, phi], [phi]));
    const root = scImplicationRight(mid, sequent([], [phi]));
    render(<ScProofTreePanel proof={root} testId="tree" />);

    expect(screen.getByText("3 nodes, depth 2")).toBeDefined();
  });

  it("testId未指定でもレンダリングできる", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    const { container } = render(<ScProofTreePanel proof={proof} />);
    expect(container.textContent).toContain("Proof Tree");
  });

  it("パネルのclickがstopPropagationされる", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    render(
      <div
        onClick={() => {
          throw new Error("should not propagate");
        }}
      >
        <ScProofTreePanel proof={proof} testId="tree" />
      </div>,
    );

    const panel = screen.getByTestId("tree");
    panel.click();
    // エラーが発生しなければOK
  });
});
