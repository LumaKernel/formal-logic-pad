/**
 * インラインHTMLタグレンダラー。
 *
 * <b>bold</b>, <i>italic</i>, <code>code</code> テキストをReact要素に変換する。
 * リファレンスのbody/summaryテキスト表示に使用。
 *
 * 変更時は referenceUILogic.test.ts（parseInlineMarkdown）も同期すること。
 */

import { useMemo } from "react";
import { parseInlineMarkdown } from "./referenceUILogic";

export interface InlineMarkdownProps {
  /** レンダリングするテキスト */
  readonly text: string;
}

export function InlineMarkdown({ text }: InlineMarkdownProps) {
  const elements = useMemo(() => parseInlineMarkdown(text), [text]);

  return (
    <>
      {elements.map((el, i) => {
        const key = `${el.type satisfies string}-${String(i) satisfies string}`;
        if (el.type === "bold") {
          return <strong key={key}>{el.content}</strong>;
        }
        if (el.type === "italic") {
          return <em key={key}>{el.content}</em>;
        }
        if (el.type === "code") {
          return <code key={key}>{el.content}</code>;
        }
        return <span key={key}>{el.content}</span>;
      })}
    </>
  );
}
