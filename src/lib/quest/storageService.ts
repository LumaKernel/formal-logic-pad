/**
 * ストレージアクセスの Effect Layer 抽象化。
 *
 * localStorage 等の副作用を Layer で差し替え可能にする。
 * 本番は BrowserStorageLayer (localStorage)、テストは createInMemoryStorageLayer で副作用フリー。
 *
 * 変更時は storageService.test.ts も同期すること。
 */

import { Context, Effect, Layer } from "effect";

// --- Service 定義 ---

/** ストレージアクセスのサービスインターフェース */
export class StorageService extends Context.Tag("StorageService")<
  StorageService,
  {
    readonly getItem: (key: string) => Effect.Effect<string | null>;
    readonly setItem: (key: string, value: string) => Effect.Effect<void>;
  }
>() {}

// --- 本番 Layer ---

/** ブラウザの localStorage を使用する Layer */
export const BrowserStorageLayer = Layer.succeed(StorageService, {
  getItem: (key: string) => Effect.sync(() => localStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    Effect.sync(() => {
      localStorage.setItem(key, value);
    }),
});

// --- テスト用 Layer ---

/** インメモリストレージの Layer を生成する */
export function createInMemoryStorageLayer(
  initial: Record<string, string> = {},
): {
  readonly layer: Layer.Layer<StorageService>;
  readonly getStore: () => ReadonlyMap<string, string>;
} {
  const store = new Map(Object.entries(initial));
  const layer = Layer.succeed(StorageService, {
    getItem: (key: string) => Effect.sync(() => store.get(key) ?? null),
    setItem: (key: string, value: string) =>
      Effect.sync(() => {
        store.set(key, value);
      }),
  });
  return {
    layer,
    getStore: () => new Map(store),
  };
}
