import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { StorageService, createInMemoryStorageLayer } from "./storageService";

describe("createInMemoryStorageLayer", () => {
  it("空の初期状態で getItem は null を返す", () => {
    const { layer } = createInMemoryStorageLayer();
    const result = Effect.runSync(
      Effect.provide(
        Effect.gen(function* () {
          const storage = yield* StorageService;
          return yield* storage.getItem("key");
        }),
        layer,
      ),
    );
    expect(result).toBeNull();
  });

  it("setItem した値を getItem で取得できる", () => {
    const { layer } = createInMemoryStorageLayer();
    const result = Effect.runSync(
      Effect.provide(
        Effect.gen(function* () {
          const storage = yield* StorageService;
          yield* storage.setItem("key", "value");
          return yield* storage.getItem("key");
        }),
        layer,
      ),
    );
    expect(result).toBe("value");
  });

  it("初期値を指定して生成できる", () => {
    const { layer } = createInMemoryStorageLayer({ existing: "data" });
    const result = Effect.runSync(
      Effect.provide(
        Effect.gen(function* () {
          const storage = yield* StorageService;
          return yield* storage.getItem("existing");
        }),
        layer,
      ),
    );
    expect(result).toBe("data");
  });

  it("getStore でストアの内容を確認できる", () => {
    const { layer, getStore } = createInMemoryStorageLayer();
    Effect.runSync(
      Effect.provide(
        Effect.gen(function* () {
          const storage = yield* StorageService;
          yield* storage.setItem("a", "1");
          yield* storage.setItem("b", "2");
        }),
        layer,
      ),
    );
    const store = getStore();
    expect(store.get("a")).toBe("1");
    expect(store.get("b")).toBe("2");
  });

  it("setItem で既存の値を上書きできる", () => {
    const { layer } = createInMemoryStorageLayer({ key: "old" });
    const result = Effect.runSync(
      Effect.provide(
        Effect.gen(function* () {
          const storage = yield* StorageService;
          yield* storage.setItem("key", "new");
          return yield* storage.getItem("key");
        }),
        layer,
      ),
    );
    expect(result).toBe("new");
  });
});
