import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within, userEvent } from "storybook/test";
import { ReferencePopover } from "./ReferencePopover";
import type { ReferenceEntry } from "./referenceEntry";

// --- サンプルデータ ---

const sampleEntry: ReferenceEntry = {
  id: "axiom-a1",
  category: "axiom",
  title: { en: "Axiom A1 (K)", ja: "公理 A1 (K)" },
  summary: {
    en: "φ → (ψ → φ) — What is already known remains true under additional assumptions.",
    ja: "φ → (ψ → φ) — 既知の事実は、追加の仮定のもとでも成り立つ。",
  },
  body: {
    en: [
      "Axiom A1, also called the <b>K axiom</b> or <b>weakening axiom</b>, states that if φ is true, then ψ → φ holds for any ψ.",
      "In combinatory logic, this corresponds to the K combinator: K = λx.λy.x.",
    ],
    ja: [
      "公理A1は<b>K公理</b>（弱化公理）とも呼ばれ、φが真ならば、任意のψに対してψ → φが成り立つことを述べます。",
      "コンビネータ論理では、Kコンビネータ K = λx.λy.x に対応します。",
    ],
  },
  formalNotation: "\\varphi \\to (\\psi \\to \\varphi)",
  relatedEntryIds: ["axiom-a2"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Hilbert_system",
      label: {
        en: "Hilbert system (Wikipedia)",
        ja: "ヒルベルト体系 (Wikipedia)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: ["K", "weakening", "A1"],
  order: 1,
};

const entryWithoutNotation: ReferenceEntry = {
  ...sampleEntry,
  id: "concept-subst",
  category: "concept",
  title: { en: "Substitution", ja: "代入" },
  summary: {
    en: "Replacing meta-variables in formula schemas with concrete formulas.",
    ja: "論理式スキーマのメタ変数を具体的な論理式に置き換える操作。",
  },
  formalNotation: undefined,
};

// --- Meta ---

const meta: Meta<typeof ReferencePopover> = {
  component: ReferencePopover,
  args: {
    entry: sampleEntry,
    locale: "en",
    testId: "ref-pop",
  },
};
export default meta;

type Story = StoryObj<typeof ReferencePopover>;

// --- ストーリー ---

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByTestId("ref-pop-trigger");
    await expect(trigger).toBeInTheDocument();
    await expect(trigger).toHaveTextContent("?");
  },
};

export const OpenPopover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByTestId("ref-pop-trigger");
    await userEvent.click(trigger);
    const popover = body.getByTestId("ref-pop-popover");
    await expect(popover).toBeInTheDocument();
    await expect(popover).toHaveTextContent("Axiom A1 (K)");
    await expect(popover).toHaveTextContent("Axioms");
  },
};

export const WithFormula: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByTestId("ref-pop-trigger"));
    const formula = body.getByTestId("ref-pop-formula");
    await expect(formula).toBeInTheDocument();
  },
};

export const WithoutFormula: Story = {
  args: {
    entry: entryWithoutNotation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByTestId("ref-pop-trigger"));
    await expect(body.queryByTestId("ref-pop-formula")).not.toBeInTheDocument();
  },
};

export const WithDetailButton: Story = {
  args: {
    onOpenDetail: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByTestId("ref-pop-trigger"));
    const detailBtn = body.getByTestId("ref-pop-detail-btn");
    await expect(detailBtn).toBeInTheDocument();
    await userEvent.click(detailBtn);
    await expect(args.onOpenDetail).toHaveBeenCalledWith("axiom-a1");
  },
};

export const Japanese: Story = {
  args: {
    locale: "ja",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByTestId("ref-pop-trigger"));
    const popover = body.getByTestId("ref-pop-popover");
    await expect(popover).toHaveTextContent("公理 A1 (K)");
    await expect(popover).toHaveTextContent("公理");
  },
};

export const CloseOnEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByTestId("ref-pop-trigger"));
    await expect(body.getByTestId("ref-pop-popover")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect(body.queryByTestId("ref-pop-popover")).not.toBeInTheDocument();
  },
};

export const ToggleOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByTestId("ref-pop-trigger");
    await userEvent.click(trigger);
    await expect(body.getByTestId("ref-pop-popover")).toBeInTheDocument();
    await userEvent.click(trigger);
    await expect(body.queryByTestId("ref-pop-popover")).not.toBeInTheDocument();
  },
};
