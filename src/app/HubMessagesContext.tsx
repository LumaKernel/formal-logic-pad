/**
 * ハブページのi18nメッセージ用Reactコンテキスト。
 *
 * HubPageView がローカライズされたメッセージを表示するためのコンテキスト。
 * デフォルト値は英語メッセージ（Storybook等、next-intlが利用不可な環境でもそのまま動作する）。
 *
 * アプリケーション層で next-intl の翻訳を注入する場合は HubMessagesProvider でラップする。
 *
 * 変更時は hubMessages.ts, HubPageView.tsx, HubContent.tsx も同期すること。
 */

"use client";

import { createContext, useContext } from "react";
import { type HubMessages, defaultHubMessages } from "./hubMessages";

const HubMessagesContext = createContext<HubMessages>(defaultHubMessages);

export type HubMessagesProviderProps = {
  readonly messages: HubMessages;
  readonly children: React.ReactNode;
};

/**
 * ハブメッセージプロバイダー。
 * アプリ層で翻訳済みメッセージを注入する。
 */
export function HubMessagesProvider({
  messages,
  children,
}: HubMessagesProviderProps) {
  return (
    <HubMessagesContext.Provider value={messages}>
      {children}
    </HubMessagesContext.Provider>
  );
}

/**
 * ハブメッセージを取得するフック。
 * HubMessagesProvider でラップされていない場合は英語のデフォルトメッセージを返す。
 */
export function useHubMessages(): HubMessages {
  return useContext(HubMessagesContext);
}
