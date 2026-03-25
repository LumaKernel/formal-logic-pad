"use client";

import dynamic from "next/dynamic";
import ReferenceLoading from "./loading";

const ReferenceViewerContent = dynamic(
  () => import("./ReferenceViewerContent"),
  { ssr: false, loading: () => <ReferenceLoading /> },
);

export default function ReferenceViewerPage() {
  return <ReferenceViewerContent />;
}
