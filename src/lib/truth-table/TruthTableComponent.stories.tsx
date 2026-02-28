import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
  biconditional,
} from "../logic-core/index";
import { TruthTableComponent } from "./TruthTableComponent";

const meta = {
  title: "TruthTable/TruthTableComponent",
  component: TruthTableComponent,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TruthTableComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── ヘルパー ─────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");

// ── ストーリー ──────────────────────────────────────────

/** 恒真式 φ → φ */
export const Tautology: Story = {
  args: {
    formula: implication(phi, phi),
    testId: "tt",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("tt-badge");
    await expect(badge.textContent).toBe("恒真（トートロジー）");
    const table = canvas.getByTestId("tt-table");
    await expect(table).toBeInTheDocument();
    // すべての結果がT
    const rows = table.querySelectorAll("tbody tr");
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      await expect(cells[cells.length - 1]!.textContent).toBe("T");
    }
  },
};

/** 矛盾 φ ∧ ¬φ */
export const Contradiction: Story = {
  args: {
    formula: conjunction(phi, negation(phi)),
    testId: "tt",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("tt-badge");
    await expect(badge.textContent).toBe("矛盾（充足不可能）");
    const table = canvas.getByTestId("tt-table");
    // すべての結果がF
    const rows = table.querySelectorAll("tbody tr");
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      await expect(cells[cells.length - 1]!.textContent).toBe("F");
    }
  },
};

/** 充足可能 φ → ψ */
export const Satisfiable: Story = {
  args: {
    formula: implication(phi, psi),
    testId: "tt",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("tt-badge");
    await expect(badge.textContent).toBe("充足可能");
    const table = canvas.getByTestId("tt-table");
    // 4行あること
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows).toHaveLength(4);
  },
};

/** 排中律 φ ∨ ¬φ */
export const ExcludedMiddle: Story = {
  args: {
    formula: disjunction(phi, negation(phi)),
    testId: "tt",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("tt-badge");
    await expect(badge.textContent).toBe("恒真（トートロジー）");
  },
};

/** 3変数 φ → (ψ → χ) */
export const ThreeVariables: Story = {
  args: {
    formula: implication(phi, implication(psi, chi)),
    testId: "tt",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByTestId("tt-table");
    // 3変数 → 2^3 = 8行
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows).toHaveLength(8);
    // ヘッダーは4つ（3変数 + 結果）
    const headers = table.querySelectorAll("th");
    await expect(headers).toHaveLength(4);
  },
};

/** 双条件 φ ↔ ψ */
export const Biconditional: Story = {
  args: {
    formula: biconditional(phi, psi),
    testId: "tt",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("tt-badge");
    await expect(badge.textContent).toBe("充足可能");
    const table = canvas.getByTestId("tt-table");
    const rows = table.querySelectorAll("tbody tr");
    // φ ↔ ψ: (F,F)=T, (F,T)=F, (T,F)=F, (T,T)=T
    const results = [...rows].map((row) => {
      const cells = row.querySelectorAll("td");
      return cells[cells.length - 1]!.textContent;
    });
    await expect(results).toEqual(["T", "F", "F", "T"]);
  },
};

/** 英語ロケール */
export const EnglishLocale: Story = {
  args: {
    formula: implication(phi, phi),
    locale: "en",
    testId: "tt",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("tt-badge");
    await expect(badge.textContent).toBe("Tautology");
  },
};

/** 複数の真理値表を並べて表示 */
export const MultipleFormulas: Story = {
  args: {
    formula: phi,
  },
  render: () => {
    const formulas = [
      { label: "φ → φ (恒真)", formula: implication(phi, phi) },
      { label: "φ ∧ ¬φ (矛盾)", formula: conjunction(phi, negation(phi)) },
      { label: "φ → ψ (充足可能)", formula: implication(phi, psi) },
      { label: "φ ∨ ¬φ (排中律)", formula: disjunction(phi, negation(phi)) },
    ] as const;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {formulas.map(({ label, formula }) => (
          <div key={label}>
            <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-ui)" }}>
              {label}
            </h3>
            <TruthTableComponent
              formula={formula}
              testId={`tt-${label satisfies string}`}
            />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 4つの真理値表が表示されていること
    const tables = canvas.getAllByRole("table");
    await expect(tables).toHaveLength(4);
  },
};
