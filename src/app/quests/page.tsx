"use client";

import dynamic from "next/dynamic";

const HubContent = dynamic(() => import("../HubContent"), { ssr: false });

export default function QuestsPage() {
  return <HubContent initialTab="quests" />;
}
