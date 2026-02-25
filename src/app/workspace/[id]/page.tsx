"use client";

import dynamic from "next/dynamic";

const WorkspaceContent = dynamic(() => import("./WorkspaceContent"), {
  ssr: false,
});

export default function WorkspacePage() {
  return <WorkspaceContent />;
}
