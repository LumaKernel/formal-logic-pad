"use client";

import dynamic from "next/dynamic";

const ReferenceViewerContent = dynamic(
  () => import("./ReferenceViewerContent"),
  { ssr: false },
);

export default function ReferenceViewerPage() {
  return <ReferenceViewerContent />;
}
