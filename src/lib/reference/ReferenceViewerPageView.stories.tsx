import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  ReferenceViewerPageView,
  ReferenceViewerNotFound,
} from "./ReferenceViewerPageView";
import type { ReferenceEntry } from "./referenceEntry";

// --- サンプルデータ ---

const sampleEntry: ReferenceEntry = {
  id: "axiom-a1",
  category: "axiom",
  title: { en: "Axiom A1 (K)", ja: "公理 A1 (K)" },
  summary: {
    en: "What is already known remains true under additional assumptions.",
    ja: "既知の事実は、追加の仮定のもとでも成り立つ。",
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

const meta: Meta<typeof ReferenceViewerPageView> = {
  component: ReferenceViewerPageView,
  args: {
    entry: sampleEntry,
    allEntries,
    locale: "en",
    onNavigate: fn(),
    testId: "ref-viewer",
  },
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof ReferenceViewerPageView>;

// --- ストーリー ---

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByTestId("ref-viewer-title");
    await expect(title).toHaveTextContent("Axiom A1 (K)");
    // パンくずが表示される
    const breadcrumb0 = canvas.getByTestId("ref-viewer-breadcrumb-0");
    await expect(breadcrumb0).toHaveTextContent("Home");
    const breadcrumb1 = canvas.getByTestId("ref-viewer-breadcrumb-1");
    await expect(breadcrumb1).toHaveTextContent("Reference");
  },
};

export const Japanese: Story = {
  args: { locale: "ja" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByTestId("ref-viewer-title");
    await expect(title).toHaveTextContent("公理 A1 (K)");
    const breadcrumb1 = canvas.getByTestId("ref-viewer-breadcrumb-1");
    await expect(breadcrumb1).toHaveTextContent("リファレンス");
  },
};

export const WithRelatedEntries: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const relatedA2 = canvas.getByTestId("ref-viewer-related-axiom-a2");
    await expect(relatedA2).toBeInTheDocument();
    await expect(relatedA2).toHaveTextContent("Axiom A2 (S)");
    // 関連エントリはリンクとして表示される
    await expect(relatedA2).toHaveAttribute("href", "/reference/axiom-a2");
  },
};

export const WithFormula: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const formula = canvas.getByTestId("ref-viewer-formula");
    await expect(formula).toBeInTheDocument();
  },
};

export const WithExternalLinks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByTestId("ref-viewer-link-0");
    await expect(link).toBeInTheDocument();
    await expect(link).toHaveTextContent("Hilbert system (Wikipedia)");
    await expect(link).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Hilbert_system",
    );
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
    const canvas = within(canvasElement);
    const questBtn = canvas.getByTestId("ref-viewer-quest-prop-02");
    await expect(questBtn).toBeInTheDocument();
    await expect(questBtn).toHaveTextContent("A1 Basic: φ → (ψ → φ)");
    await userEvent.click(questBtn);
    await expect(args.onStartQuest).toHaveBeenCalledWith("prop-02");
  },
};

export const WithRelatedQuestsJapanese: Story = {
  args: {
    locale: "ja",
    relatedQuests: [{ id: "prop-02", title: "A1基本: φ → (ψ → φ)" }],
    onStartQuest: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewer = canvas.getByTestId("ref-viewer");
    await expect(viewer).toHaveTextContent("関連クエスト");
    await expect(
      canvas.getByTestId("ref-viewer-quest-prop-02"),
    ).toBeInTheDocument();
  },
};

// --- NotFound ストーリー ---

export const NotFound: Story = {
  render: () => (
    <ReferenceViewerNotFound locale="en" testId="reference-not-found" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notFound = canvas.getByTestId("reference-not-found");
    await expect(notFound).toHaveTextContent("Reference Not Found");
  },
};

export const NotFoundJapanese: Story = {
  render: () => (
    <ReferenceViewerNotFound locale="ja" testId="reference-not-found" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notFound = canvas.getByTestId("reference-not-found");
    await expect(notFound).toHaveTextContent("リファレンスが見つかりません");
  },
};
