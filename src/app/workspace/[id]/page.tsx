"use client";

import dynamic from "next/dynamic";
import WorkspaceLoading from "./loading";

const WorkspaceContent = dynamic(() => import("./WorkspaceContent"), {
  ssr: false,
  loading: () => <WorkspaceLoading />,
});

export default function WorkspacePage() {
  return <WorkspaceContent />;
}
