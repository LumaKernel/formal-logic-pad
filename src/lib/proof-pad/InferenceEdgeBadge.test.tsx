import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  // --- Interactive behavior ---

  it("Gen badge with onBadgeClick has role=button", () => {
    const labelData: InferenceEdgeLabelData = {
      label: "Gen(x)",
      badgeColor: "var(--color-badge-gen, #00b894)",
      tag: "gen",
    };
    const onClick = vi.fn();
    render(
      <InferenceEdgeBadge
        labelData={labelData}
        testId="badge-gen"
        onBadgeClick={onClick}
      />,
    );
    const badge = screen.getByTestId("badge-gen");
    expect(badge).toHaveAttribute("role", "button");
  });

  it("MP badge does not become interactive even with onBadgeClick", () => {
    const labelData: InferenceEdgeLabelData = {
      label: "MP",
      badgeColor: "var(--color-badge-mp, #6c5ce7)",
      tag: "mp",
    };
    const onClick = vi.fn();
    render(
      <InferenceEdgeBadge
        labelData={labelData}
        testId="badge-mp"
        onBadgeClick={onClick}
      />,
    );
    const badge = screen.getByTestId("badge-mp");
    expect(badge).not.toHaveAttribute("role", "button");
  });

  it("Gen badge calls onBadgeClick when clicked", async () => {
    const user = userEvent.setup();
    const labelData: InferenceEdgeLabelData = {
      label: "Gen(x)",
      badgeColor: "var(--color-badge-gen, #00b894)",
      tag: "gen",
    };
    const onClick = vi.fn();
    render(
      <InferenceEdgeBadge
        labelData={labelData}
        testId="badge-gen"
        onBadgeClick={onClick}
      />,
    );
    await user.click(screen.getByTestId("badge-gen"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("Substitution badge calls onBadgeClick when clicked", async () => {
    const user = userEvent.setup();
    const labelData: InferenceEdgeLabelData = {
      label: "Subst(2)",
      badgeColor: "var(--color-badge-subst, #e17055)",
      tag: "substitution",
    };
    const onClick = vi.fn();
    render(
      <InferenceEdgeBadge
        labelData={labelData}
        testId="badge-subst"
        onBadgeClick={onClick}
      />,
    );
    await user.click(screen.getByTestId("badge-subst"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("Gen badge without onBadgeClick is not interactive", () => {
    const labelData: InferenceEdgeLabelData = {
      label: "Gen(x)",
      badgeColor: "var(--color-badge-gen, #00b894)",
      tag: "gen",
    };
    render(<InferenceEdgeBadge labelData={labelData} testId="badge-gen" />);
    const badge = screen.getByTestId("badge-gen");
    expect(badge).not.toHaveAttribute("role", "button");
  });
});
