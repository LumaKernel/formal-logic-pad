import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
});
