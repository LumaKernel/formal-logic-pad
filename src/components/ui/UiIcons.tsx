/**
 * 軽量 SVG アイコンコンポーネント（@ant-design/icons の代替）。
 *
 * 変更時は UiIcons.test.tsx も同期すること。
 */

import type { CSSProperties, ReactNode } from "react";

type IconProps = {
  readonly style?: CSSProperties;
  readonly "aria-hidden"?: boolean | "true" | "false";
};

const defaultStyle: Readonly<CSSProperties> = {
  width: "1em",
  height: "1em",
  display: "inline-block",
  verticalAlign: "-0.125em",
  fill: "currentColor",
};

function mergeStyles(style?: CSSProperties): CSSProperties {
  return style !== undefined ? { ...defaultStyle, ...style } : defaultStyle;
}

/** ⋯ Ellipsis icon */
export function EllipsisOutlined(props: IconProps): ReactNode {
  return (
    <svg
      viewBox="0 0 1024 1024"
      style={mergeStyles(props.style)}
      aria-hidden={props["aria-hidden"]}
    >
      <circle cx="176" cy="512" r="80" />
      <circle cx="512" cy="512" r="80" />
      <circle cx="848" cy="512" r="80" />
    </svg>
  );
}

/** ⋮ More (vertical ellipsis) icon */
export function MoreOutlined(props: IconProps): ReactNode {
  return (
    <svg
      viewBox="0 0 1024 1024"
      style={mergeStyles(props.style)}
      aria-hidden={props["aria-hidden"]}
    >
      <circle cx="512" cy="176" r="80" />
      <circle cx="512" cy="512" r="80" />
      <circle cx="512" cy="848" r="80" />
    </svg>
  );
}

/** ☀ Sun icon */
export function SunOutlined(props: IconProps): ReactNode {
  return (
    <svg
      viewBox="0 0 1024 1024"
      style={mergeStyles(props.style)}
      aria-hidden={props["aria-hidden"]}
    >
      <path d="M512 256a256 256 0 1 0 0 512 256 256 0 0 0 0-512zm0 448a192 192 0 1 1 0-384 192 192 0 0 1 0 384z" />
      <path d="M512 128V64m0 896v-64m384-384h64M64 512h64m587.3-275.3l45.3-45.3M263.4 760.6l-45.3 45.3m587.2 0l45.3 45.3M263.4 263.4l-45.3-45.3" />
      <path
        d="M512 128V64m0 896v-64m384-384h64M64 512h64m587.3-275.3l45.3-45.3M263.4 760.6l-45.3 45.3m587.2 0l45.3 45.3M263.4 263.4l-45.3-45.3"
        stroke="currentColor"
        strokeWidth="64"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** 🌙 Moon icon */
export function MoonOutlined(props: IconProps): ReactNode {
  return (
    <svg
      viewBox="0 0 1024 1024"
      style={mergeStyles(props.style)}
      aria-hidden={props["aria-hidden"]}
    >
      <path d="M524 128c-12.4 0-24.8 0.6-37 1.8a384 384 0 0 1 0 764.4c12.2 1.2 24.6 1.8 37 1.8a384 384 0 0 0 0-768z" />
    </svg>
  );
}

/** 🖥 Desktop/monitor icon */
export function DesktopOutlined(props: IconProps): ReactNode {
  return (
    <svg
      viewBox="0 0 1024 1024"
      style={mergeStyles(props.style)}
      aria-hidden={props["aria-hidden"]}
    >
      <path d="M928 160H96c-17.7 0-32 14.3-32 32v544c0 17.7 14.3 32 32 32h320v80H296c-8.8 0-16 7.2-16 16s7.2 16 16 16h432c8.8 0 16-7.2 16-16s-7.2-16-16-16H608v-80h320c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-32 544H128V224h768v480z" />
    </svg>
  );
}
