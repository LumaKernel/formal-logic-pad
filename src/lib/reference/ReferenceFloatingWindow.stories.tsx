import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within, userEvent } from "storybook/test";
import { ReferenceFloatingWindow } from "./ReferenceFloatingWindow";
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
      "Axiom A1, also called the <b>K axiom</b> or <i>weakening axiom</i>, states that if φ is true, then ψ → φ holds for any ψ.",
      "In combinatory logic, this corresponds to the K combinator: <code>K = λx.λy.x</code>.",
    ],
    ja: [
      "公理A1は<b>K公理</b>（弱化公理）とも呼ばれ、φが真ならば、任意のψに対してψ → φが成り立つことを述べます。",
      "コンビネータ論理では、Kコンビネータ <code>K = λx.λy.x</code> に対応します。",
    ],
  },
  formalNotation: "\\varphi \\to (\\psi \\to \\varphi)",
  relatedEntryIds: ["axiom-a2", "rule-mp"],
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

const relatedEntries: readonly ReferenceEntry[] = [
  {
    id: "axiom-a2",
    category: "axiom",
    title: { en: "Axiom A2 (S)", ja: "公理 A2 (S)" },
    summary: {
      en: "S axiom for distributivity of implication.",
      ja: "含意の分配に関するS公理。",
    },
    body: { en: ["The S axiom."], ja: ["S公理。"] },
    relatedEntryIds: [],
    externalLinks: [],
    keywords: [],
    order: 2,
  },
  {
    id: "rule-mp",
    category: "inference-rule",
    title: { en: "Modus Ponens (MP)", ja: "Modus Ponens (MP)" },
    summary: {
      en: "From φ and φ → ψ, derive ψ.",
      ja: "φ と φ → ψ から ψ を導出する。",
    },
    body: { en: ["The only inference rule."], ja: ["唯一の推論規則。"] },
    relatedEntryIds: [],
    externalLinks: [],
    keywords: [],
    order: 10,
  },
];

const allEntries = [sampleEntry, ...relatedEntries];

// --- Meta ---

const meta: Meta<typeof ReferenceFloatingWindow> = {
  component: ReferenceFloatingWindow,
  args: {
    entry: sampleEntry,
    allEntries,
    locale: "en",
    onClose: fn(),
    testId: "ref-win",
  },
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof ReferenceFloatingWindow>;

// --- ストーリー ---

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const win = canvas.getByTestId("ref-win");
    await expect(win).toBeInTheDocument();
    const titlebar = canvas.getByTestId("ref-win-titlebar");
    await expect(titlebar).toHaveTextContent("Axiom A1 (K)");
  },
};

export const Japanese: Story = {
  args: { locale: "ja" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const win = canvas.getByTestId("ref-win");
    await expect(win).toHaveTextContent("公理 A1 (K)");
  },
};

export const WithRelatedEntries: Story = {
  args: { onNavigate: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const relatedA2 = canvas.getByTestId("ref-win-related-axiom-a2");
    await expect(relatedA2).toBeInTheDocument();
    await expect(relatedA2).toHaveTextContent("Axiom A2 (S)");
    await userEvent.click(relatedA2);
    await expect(args.onNavigate).toHaveBeenCalledWith("axiom-a2");
  },
};

export const WithFormula: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const formula = canvas.getByTestId("ref-win-formula");
    await expect(formula).toBeInTheDocument();
  },
};

export const WithExternalLinks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const link = canvas.getByTestId("ref-win-link-0");
    await expect(link).toBeInTheDocument();
    await expect(link).toHaveTextContent("Hilbert system (Wikipedia)");
    await expect(link).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Hilbert_system",
    );
  },
};

export const CloseButton: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const closeBtn = canvas.getByTestId("ref-win-close");
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const OpenInNewTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const link = canvas.getByTestId("ref-win-open-new-tab");
    await expect(link).toBeInTheDocument();
    await expect(link).toHaveAttribute("href", "/reference/axiom-a1");
    await expect(link).toHaveAttribute("target", "_blank");
  },
};

export const WithRelatedQuests: Story = {
  args: {
    relatedQuests: [
      { id: "prop-02", title: "A1 Basic: φ → (ψ → φ)" },
      { id: "prop-03", title: "A1 Chain: φ → (ψ → (χ → φ))" },
    ],
    onStartQuest: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const questBtn = canvas.getByTestId("ref-win-quest-prop-02");
    await expect(questBtn).toBeInTheDocument();
    await expect(questBtn).toHaveTextContent("A1 Basic: φ → (ψ → φ)");
    await userEvent.click(questBtn);
    await expect(args.onStartQuest).toHaveBeenCalledWith("prop-02");
  },
};
