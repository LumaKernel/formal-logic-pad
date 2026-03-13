"use client";

import dynamic from "next/dynamic";

const HubContent = dynamic(() => import("../HubContent"), { ssr: false });

export default function CustomQuestsPage() {
  return <HubContent initialTab="custom-quests" />;
}
