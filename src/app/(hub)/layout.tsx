"use client";

import dynamic from "next/dynamic";

const HubContent = dynamic(() => import("../HubContent"), { ssr: false });

interface Props {
  readonly children: React.ReactNode;
}

/**
 * Hub ページ共通レイアウト。
 *
 * (hub) route group 内のすべてのタブルートで共有される。
 * HubContent はこのレイアウトに配置されるため、
 * タブ間遷移時にアンマウント→再マウントが発生しない。
 */
export default function HubLayout({ children }: Props) {
  return (
    <>
      <HubContent />
      {children}
    </>
  );
}
