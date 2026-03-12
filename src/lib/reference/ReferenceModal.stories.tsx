import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within, userEvent } from "storybook/test";
import { ReferenceModal } from "./ReferenceModal";
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
      "Axiom A1, also called the **K axiom** or *weakening axiom*, states that if φ is true, then ψ → φ holds for any ψ. Intuitively, already known things remain true even with extra assumptions.",
      "In combinatory logic, this corresponds to the K combinator: K = λx.λy.x, which takes two arguments and returns the first.",
      "A1 is common to all Hilbert-style axiom systems implemented in this application (Łukasiewicz, Mendelson, etc.).",
    ],
    ja: [
      "公理A1は**K公理**（弱化公理）とも呼ばれ、φが真ならば、任意のψに対してψ → φが成り立つことを述べます。直観的には、既知の事実は追加の仮定があっても真のままです。",
      "コンビネータ論理では、Kコンビネータ K = λx.λy.x に対応します。2つの引数を取り、最初の引数を返します。",
      "A1は、本アプリケーションで実装されているすべてのHilbert系公理体系（Łukasiewicz、Mendelsonなど）に共通です。",
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
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/ヒルベルト流演繹体系",
      label: {
        en: "Hilbert-style system (Wikipedia JA)",
        ja: "ヒルベルト流演繹体系 (Wikipedia)",
      },
      documentLanguage: "ja",
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

const meta: Meta<typeof ReferenceModal> = {
  component: ReferenceModal,
  args: {
    entry: sampleEntry,
    allEntries,
    locale: "en",
    onClose: fn(),
    testId: "ref-modal",
  },
};
export default meta;

type Story = StoryObj<typeof ReferenceModal>;

// --- ストーリー ---

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const modal = canvas.getByTestId("ref-modal");
    await expect(modal).toBeInTheDocument();
    await expect(modal).toHaveTextContent("Axiom A1 (K)");
    await expect(modal).toHaveTextContent("Axioms");
  },
};

export const WithFormula: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const formula = canvas.getByTestId("ref-modal-formula");
    await expect(formula).toBeInTheDocument();
  },
};

export const RelatedEntries: Story = {
  args: {
    onNavigate: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const relatedA2 = canvas.getByTestId("ref-modal-related-axiom-a2");
    await expect(relatedA2).toBeInTheDocument();
    await expect(relatedA2).toHaveTextContent("Axiom A2 (S)");
    await userEvent.click(relatedA2);
    await expect(args.onNavigate).toHaveBeenCalledWith("axiom-a2");
  },
};

export const ExternalLinks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link0 = canvas.getByTestId("ref-modal-link-0");
    await expect(link0).toBeInTheDocument();
    await expect(link0).toHaveTextContent("Hilbert system (Wikipedia)");
  },
};

export const Japanese: Story = {
  args: {
    locale: "ja",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const modal = canvas.getByTestId("ref-modal");
    await expect(modal).toHaveTextContent("公理 A1 (K)");
    await expect(modal).toHaveTextContent("公理");
    await expect(modal).toHaveTextContent("関連項目");
  },
};

export const CloseButton: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const closeBtn = canvas.getByTestId("ref-modal-close");
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const CloseOnEscape: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("ref-modal")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect(args.onClose).toHaveBeenCalled();
  },
};
