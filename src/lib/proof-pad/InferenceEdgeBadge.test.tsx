import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InferenceEdgeBadge } from "./InferenceEdgeBadge";
import type { InferenceEdgeLabelData } from "./inferenceEdgeLabelLogic";

describe("InferenceEdgeBadge", () => {
  it("renders MP label", () => {
    const labelData: InferenceEdgeLabelData = {
      label: "MP",
      badgeColor: "var(--color-badge-mp, #6c5ce7)",
      tag: "mp",
    };
    render(<InferenceEdgeBadge labelData={labelData} testId="badge-mp" />);
    const badge = screen.getByTestId("badge-mp");
    expect(badge).toHaveTextContent("MP");
  });

  it("renders Gen label with variable", () => {
    const labelData: InferenceEdgeLabelData = {
      label: "Gen(x)",
      badgeColor: "var(--color-badge-gen, #00b894)",
      tag: "gen",
    };
    render(<InferenceEdgeBadge labelData={labelData} testId="badge-gen" />);
    const badge = screen.getByTestId("badge-gen");
    expect(badge).toHaveTextContent("Gen(x)");
  });

  it("renders Substitution label", () => {
    const labelData: InferenceEdgeLabelData = {
      label: "Subst(2)",
      badgeColor: "var(--color-badge-subst, #e17055)",
      tag: "substitution",
    };
    render(<InferenceEdgeBadge labelData={labelData} testId="badge-subst" />);
    const badge = screen.getByTestId("badge-subst");
    expect(badge).toHaveTextContent("Subst(2)");
  });

  it("renders without testId", () => {
    const labelData: InferenceEdgeLabelData = {
      label: "MP",
      badgeColor: "var(--color-badge-mp, #6c5ce7)",
      tag: "mp",
    };
    const { container } = render(<InferenceEdgeBadge labelData={labelData} />);
    expect(container.textContent).toBe("MP");
  });
});
