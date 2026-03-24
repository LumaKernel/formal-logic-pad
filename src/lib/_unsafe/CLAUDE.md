# \_unsafe モジュール

防御的コード（v8 ignore対象）を集約するユーティリティ。

## 目的

v8 ignore コメントを個別ファイルに散在させず、このモジュールに集約する。
vitest coverage 除外対象（vitest.config.ts で `src/lib/_unsafe/**` を除外）。

## 使い方

### unsafeMapGet

呼び出し元の不変条件により Map に必ずキーが存在する場合:

```typescript
import { unsafeMapGet } from "../_unsafe/unsafeLookup";
const value = unsafeMapGet(map, key, "context for debug");
```

### unsafeAssertDefined

呼び出し元の不変条件により値が必ず存在する場合:

```typescript
import { unsafeAssertDefined } from "../_unsafe/unsafeLookup";
const value = unsafeAssertDefined(maybeUndefined, "context for debug");
```

## 注意

- 呼び出し元が不変条件を保証できる場合にのみ使用すること
- context引数でデバッグ時の文脈を明記する
- 変更時は unsafeLookup.test.ts も同期すること
