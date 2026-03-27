import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InlineMarkdown } from "./InlineMarkdown";

afterEach(cleanup);

describe("InlineMarkdown", () => {
  it("プレーンテキストをそのまま表示する", () => {
    const { container } = render(<InlineMarkdown text="hello world" />);
    expect(container.textContent).toBe("hello world");
  });

  it("<b>タグをstrongで表示する", () => {
    const { container } = render(<InlineMarkdown text="<b>bold</b> text" />);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("bold");
  });

  it("<i>タグをemで表示する", () => {
    const { container } = render(<InlineMarkdown text="<i>italic</i>" />);
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(em?.textContent).toBe("italic");
  });

  it("<code>タグをcodeで表示する", () => {
    const { container } = render(<InlineMarkdown text="<code>code</code>" />);
    const code = container.querySelector("code");
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe("code");
  });

  it("$...$をKaTeX数式として描画する", () => {
    const { container } = render(
      <InlineMarkdown text="formula $\\varphi$ here" />,
    );
    // KaTeXはspanにkatexクラスを付与する
    const katexSpan = container.querySelector(".katex");
    expect(katexSpan).not.toBeNull();
  });

  it("<b>内の$...$をKaTeX数式として描画する（renderContentWithMath）", () => {
    const { container } = render(
      <InlineMarkdown text="<b>bold $\\varphi$ text</b>" />,
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    // strong内にKaTeX数式がある
    const katexInStrong = strong?.querySelector(".katex");
    expect(katexInStrong).not.toBeNull();
    // テキスト部分も含まれる
    expect(strong?.textContent).toContain("bold");
    expect(strong?.textContent).toContain("text");
  });

  it("<i>内の$...$をKaTeX数式として描画する（renderContentWithMath）", () => {
    const { container } = render(
      <InlineMarkdown text="<i>italic $\\psi$ end</i>" />,
    );
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    const katexInEm = em?.querySelector(".katex");
    expect(katexInEm).not.toBeNull();
  });

  it("テキスト要素内の$...$をKaTeX数式として描画する（renderContentWithMath）", () => {
    const { container } = render(
      <InlineMarkdown text="before $\\alpha$ after" />,
    );
    // parseInlineMarkdownでtop-levelの$...$はmathとしてパースされる
    const katexSpan = container.querySelector(".katex");
    expect(katexSpan).not.toBeNull();
  });

  it("$を含むが数式でない場合はテキストとして扱う（renderContentWithMath分岐）", () => {
    // <b>内で$が1つだけ（閉じなし）→ renderContentWithMathの$含むが分割不要な分岐
    const { container } = render(<InlineMarkdown text="<b>price is $5</b>" />);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("price is $5");
    // KaTeXは生成されない
    const katex = strong?.querySelector(".katex");
    expect(katex).toBeNull();
  });

  it("下付き文字をsubで表示する", () => {
    const { container } = render(<InlineMarkdown text="x_1 test" />);
    const sub = container.querySelector("sub");
    expect(sub).not.toBeNull();
    expect(sub?.textContent).toBe("1");
  });

  it("<b>内の複数数式を正しく描画する", () => {
    const { container } = render(
      <InlineMarkdown text="<b>$\\alpha$ and $\\beta$</b>" />,
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    const katexSpans = strong?.querySelectorAll(".katex");
    expect(katexSpans?.length).toBe(2);
    expect(strong?.textContent).toContain("and");
  });

  it("空の内容はnullとして扱われる（renderContentWithMathの空文字列分岐）", () => {
    // $...$で分割すると空文字列パーツが生成される場合
    const { container } = render(<InlineMarkdown text="<b>$\\varphi$</b>" />);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    const katexInStrong = strong?.querySelector(".katex");
    expect(katexInStrong).not.toBeNull();
  });

  // --- リファレンスリンク ---

  it("<ref:id />をリンクとして表示する", () => {
    const { container } = render(
      <InlineMarkdown text="see <ref:rule-mp /> here" />,
    );
    const link = container.querySelector("a[data-ref-id='rule-mp']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("rule-mp");
  });

  it("<ref:id>text</ref>をカスタムテキストのリンクとして表示する", () => {
    const { container } = render(
      <InlineMarkdown text="see <ref:rule-mp>Modus Ponens</ref> here" />,
    );
    const link = container.querySelector("a[data-ref-id='rule-mp']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("Modus Ponens");
  });

  it("リファレンスリンクのクリックでonNavigateが呼ばれる", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="see <ref:rule-mp>MP</ref>"
        onNavigate={onNavigate}
      />,
    );
    const link = container.querySelector("a[data-ref-id='rule-mp']");
    expect(link).not.toBeNull();
    fireEvent.click(link!);
    expect(onNavigate).toHaveBeenCalledWith("rule-mp");
  });

  it("onNavigateが未指定でもリンクをクリックしてもエラーにならない", () => {
    const { container } = render(
      <InlineMarkdown text="<ref:rule-mp>MP</ref>" />,
    );
    const link = container.querySelector("a[data-ref-id='rule-mp']");
    expect(link).not.toBeNull();
    // onNavigateなしでクリックしてもエラーにならない
    fireEvent.click(link!);
  });

  it("リファレンスリンクのキーボード操作でonNavigateが呼ばれる", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown text="<ref:axiom-a1>A1</ref>" onNavigate={onNavigate} />,
    );
    const link = container.querySelector("a[data-ref-id='axiom-a1']");
    expect(link).not.toBeNull();
    fireEvent.keyDown(link!, { key: "Enter" });
    expect(onNavigate).toHaveBeenCalledWith("axiom-a1");
  });

  // --- 参考文献リンク ---

  it("<cite:key>text</cite>を上付きリンクとして表示する", () => {
    const { container } = render(
      <InlineMarkdown text="follows <cite:bekki2012>Bekki, Ch. 8</cite>." />,
    );
    const link = container.querySelector("a[data-cite-key='bekki2012']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("[Bekki, Ch. 8]");
    expect(link?.id).toBe("cite-ref-bekki2012");
  });

  it("参考文献リンクのクリックでonCiteClickが呼ばれる", () => {
    const onCiteClick = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<cite:bekki2012>Bekki</cite>"
        onCiteClick={onCiteClick}
      />,
    );
    const link = container.querySelector("a[data-cite-key='bekki2012']");
    expect(link).not.toBeNull();
    fireEvent.click(link!);
    expect(onCiteClick).toHaveBeenCalledWith("bekki2012");
  });

  it("参考文献リンクのキーボード操作でonCiteClickが呼ばれる", () => {
    const onCiteClick = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<cite:godel1930>Gödel</cite>"
        onCiteClick={onCiteClick}
      />,
    );
    const link = container.querySelector("a[data-cite-key='godel1930']");
    expect(link).not.toBeNull();
    fireEvent.keyDown(link!, { key: "Enter" });
    expect(onCiteClick).toHaveBeenCalledWith("godel1930");
  });

  it("onCiteClickが未指定でもクリックしてもエラーにならない", () => {
    const { container } = render(
      <InlineMarkdown text="<cite:bekki2012>Bekki</cite>" />,
    );
    const link = container.querySelector("a[data-cite-key='bekki2012']");
    expect(link).not.toBeNull();
    fireEvent.click(link!);
  });

  // --- bold/italic内のネストされたインライン要素 ---

  it("<b>内の<ref:id>text</ref>をリンクとして表示する", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<b><ref:axiom-a1>A1</ref> (K):</b> description"
        onNavigate={onNavigate}
      />,
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    const link = strong?.querySelector("a[data-ref-id='axiom-a1']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("A1");
    // リンクの後にテキストが続く
    expect(strong?.textContent).toContain("(K):");
    // クリックでonNavigateが呼ばれる
    fireEvent.click(link!);
    expect(onNavigate).toHaveBeenCalledWith("axiom-a1");
  });

  it("<i>内の<ref:id>text</ref>をリンクとして表示する", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<i>see <ref:rule-mp>Modus Ponens</ref></i>"
        onNavigate={onNavigate}
      />,
    );
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    const link = em?.querySelector("a[data-ref-id='rule-mp']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("Modus Ponens");
    fireEvent.click(link!);
    expect(onNavigate).toHaveBeenCalledWith("rule-mp");
  });

  it("<b>内の<cite:key>text</cite>を参考文献リンクとして表示する", () => {
    const onCiteClick = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<b>Reference <cite:bekki2012>Bekki, Ch. 8</cite></b>"
        onCiteClick={onCiteClick}
      />,
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    const link = strong?.querySelector("a[data-cite-key='bekki2012']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("[Bekki, Ch. 8]");
    fireEvent.click(link!);
    expect(onCiteClick).toHaveBeenCalledWith("bekki2012");
  });

  it("<b>内の<ref:id />（テキスト省略）をidで表示する", () => {
    const { container } = render(
      <InlineMarkdown text="<b>see <ref:axiom-a2 /></b>" />,
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    const link = strong?.querySelector("a[data-ref-id='axiom-a2']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("axiom-a2");
  });

  it("<b>内の[[ref:...]]と$...$が混在するケース", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<b><ref:axiom-a1>A1</ref>:</b> $\\varphi \\to (\\psi \\to \\varphi)$"
        onNavigate={onNavigate}
      />,
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    // bold内にrefリンクがある
    const refLink = strong?.querySelector("a[data-ref-id='axiom-a1']");
    expect(refLink).not.toBeNull();
    expect(refLink?.textContent).toBe("A1");
    // bold外にKaTeX数式がある
    const katex = container.querySelector(".katex");
    expect(katex).not.toBeNull();
  });

  it("<b>内のキーボード操作で[[ref:...]]のonNavigateが呼ばれる", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<b><ref:axiom-a1>A1</ref></b>"
        onNavigate={onNavigate}
      />,
    );
    const link = container.querySelector("strong a[data-ref-id='axiom-a1']");
    expect(link).not.toBeNull();
    fireEvent.keyDown(link!, { key: " " });
    expect(onNavigate).toHaveBeenCalledWith("axiom-a1");
  });

  it("<b>内のキーボード操作で[[cite:...]]のonCiteClickが呼ばれる", () => {
    const onCiteClick = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<b><cite:bekki2012>Bekki</cite></b>"
        onCiteClick={onCiteClick}
      />,
    );
    const link = container.querySelector("strong a[data-cite-key='bekki2012']");
    expect(link).not.toBeNull();
    fireEvent.keyDown(link!, { key: " " });
    expect(onCiteClick).toHaveBeenCalledWith("bekki2012");
  });

  // --- クエストリンク ---

  it("<quest:id />をリンクとして表示する", () => {
    const { container } = render(
      <InlineMarkdown text="open <quest:prop-01 /> now" />,
    );
    const link = container.querySelector("a[data-quest-id='prop-01']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("prop-01");
  });

  it("<quest:id>text</quest>をカスタムテキストのリンクとして表示する", () => {
    const { container } = render(
      <InlineMarkdown text="try <quest:pred-01>pred-01</quest> next" />,
    );
    const link = container.querySelector("a[data-quest-id='pred-01']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("pred-01");
  });

  it("クエストリンクのクリックでonQuestNavigateが呼ばれる", () => {
    const onQuestNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="try <quest:prop-01>prop-01</quest>"
        onQuestNavigate={onQuestNavigate}
      />,
    );
    const link = container.querySelector("a[data-quest-id='prop-01']");
    expect(link).not.toBeNull();
    fireEvent.click(link!);
    expect(onQuestNavigate).toHaveBeenCalledWith("prop-01");
  });

  it("クエストリンクのキーボード操作でonQuestNavigateが呼ばれる", () => {
    const onQuestNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<quest:pred-01>pred-01</quest>"
        onQuestNavigate={onQuestNavigate}
      />,
    );
    const link = container.querySelector("a[data-quest-id='pred-01']");
    expect(link).not.toBeNull();
    fireEvent.keyDown(link!, { key: "Enter" });
    expect(onQuestNavigate).toHaveBeenCalledWith("pred-01");
  });

  it("onQuestNavigateが未指定でもクリックしてもエラーにならない", () => {
    const { container } = render(<InlineMarkdown text="<quest:prop-01 />" />);
    const link = container.querySelector("a[data-quest-id='prop-01']");
    expect(link).not.toBeNull();
    fireEvent.click(link!);
  });

  it("<b>内の<quest:id>text</quest>をリンクとして表示する", () => {
    const onQuestNavigate = vi.fn();
    const { container } = render(
      <InlineMarkdown
        text="<b>try <quest:prop-01>prop-01</quest></b>"
        onQuestNavigate={onQuestNavigate}
      />,
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    const link = strong?.querySelector("a[data-quest-id='prop-01']");
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("prop-01");
    fireEvent.click(link!);
    expect(onQuestNavigate).toHaveBeenCalledWith("prop-01");
  });
});
