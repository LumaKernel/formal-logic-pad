/**
 * インラインHTMLタグ・数式レンダラー。
 *
 * <b>bold</b>, <i>italic</i>, <code>code</code>, $math$, _subscript テキストをReact要素に変換する。
 * リファレンスのbody/summaryテキスト表示に使用。
 *
 * 変更時は referenceUILogic.test.ts（parseInlineMarkdown）も同期すること。
 */

import { useMemo } from "react";
import katex from "katex";
import { parseInlineMarkdown } from "./referenceUILogic";

export interface InlineMarkdownProps {
  /** レンダリングするテキスト */
  readonly text: string;
}

/** KaTeX でインライン数式をHTMLに変換する（純粋関数） */
function renderMathToHtml(tex: string): string {
  return katex.renderToString(tex, {
    displayMode: false,
    throwOnError: false,
    output: "htmlAndMathml",
  });
}

/**
 * テキスト中の $...$ をKaTeX数式として描画し、残りをテキストとして返す。
 * bold/italic/text要素の内部で $...$ を使えるようにするためのヘルパー。
 */
function renderContentWithMath(
  content: string,
  keyPrefix: string,
): React.ReactNode {
  // $...$ を含まない場合はテキストそのまま
  if (!content.includes("$")) {
    return content;
  }
  // $...$ で分割（キャプチャグループで区切り文字も保持）
  const parts = content.split(/(\$[^$]+\$)/g);
  if (parts.length === 1) {
    return content;
  }
  return parts.map((part, j) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const tex = part.slice(1, -1);
      return (
        <span
          key={`${keyPrefix satisfies string}-m${String(j) satisfies string}`}
          dangerouslySetInnerHTML={{ __html: renderMathToHtml(tex) }}
        />
      );
    }
    return part === "" ? null : part;
  });
}

export function InlineMarkdown({ text }: InlineMarkdownProps) {
  const elements = useMemo(() => parseInlineMarkdown(text), [text]);

  return (
    <>
      {elements.map((el, i) => {
        const key = `${el.type satisfies string}-${String(i) satisfies string}`;
        if (el.type === "bold") {
          return (
            <strong key={key}>{renderContentWithMath(el.content, key)}</strong>
          );
        }
        if (el.type === "italic") {
          return <em key={key}>{renderContentWithMath(el.content, key)}</em>;
        }
        if (el.type === "code") {
          return <code key={key}>{el.content}</code>;
        }
        if (el.type === "subscript") {
          return <sub key={key}>{el.content}</sub>;
        }
        if (el.type === "math") {
          return (
            <span
              key={key}
              dangerouslySetInnerHTML={{ __html: renderMathToHtml(el.content) }}
            />
          );
        }
        return <span key={key}>{renderContentWithMath(el.content, key)}</span>;
      })}
    </>
  );
}
