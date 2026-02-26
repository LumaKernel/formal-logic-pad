/**
 * 証明ワークスペースのi18nメッセージ用Reactコンテキスト。
 *
 * ProofWorkspace がローカライズされたメッセージを表示するためのコンテキスト。
 * デフォルト値は英語メッセージ（Storybook等、next-intlが利用不可な環境でもそのまま動作する）。
 *
 * アプリケーション層で next-intl の翻訳を注入する場合は ProofMessagesProvider でラップする。
 *
 * 変更時は proofMessages.ts, ProofWorkspace.tsx, WorkspaceContent.tsx, index.ts も同期すること。
 */

"use client";

import { createContext, useContext } from "react";
import { type ProofMessages, defaultProofMessages } from "./proofMessages";

const ProofMessagesContext = createContext<ProofMessages>(defaultProofMessages);

export type ProofMessagesProviderProps = {
  readonly messages: ProofMessages;
  readonly children: React.ReactNode;
};

/**
 * 証明メッセージプロバイダー。
 * アプリ層で翻訳済みメッセージを注入する。
 */
export function ProofMessagesProvider({
  messages,
  children,
}: ProofMessagesProviderProps) {
  return (
    <ProofMessagesContext.Provider value={messages}>
      {children}
    </ProofMessagesContext.Provider>
  );
}

/**
 * 証明メッセージを取得するフック。
 * ProofMessagesProvider でラップされていない場合は英語のデフォルトメッセージを返す。
 */
export function useProofMessages(): ProofMessages {
  return useContext(ProofMessagesContext);
}
