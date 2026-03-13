/**
 * スクリプトノードのテスト。
 */

import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  ScriptNodeData,
  ScriptNodeDataSchema,
  createDefaultScriptNodeData,
  getScriptNodeLabel,
  getScriptCode,
  setScriptCode,
} from "./scriptNode";

describe("ScriptNodeData", () => {
  it("正しくインスタンス化できる", () => {
    const data = new ScriptNodeData({
      title: "Test Script",
      tags: [],
    });
    expect(data.title).toBe("Test Script");
    expect(data.tags).toEqual([]);
    expect(data.description).toBeUndefined();
    expect(data.author).toBeUndefined();
    expect(data.maxSteps).toBeUndefined();
    expect(data.maxTimeMs).toBeUndefined();
  });

  it("すべてのフィールドを設定できる", () => {
    const data = new ScriptNodeData({
      title: "Complex Script",
      description: "A complex script for testing",
      author: "Test Author",
      tags: ["test", "example"],
      maxSteps: 1000,
      maxTimeMs: 5000,
    });
    expect(data.title).toBe("Complex Script");
    expect(data.description).toBe("A complex script for testing");
    expect(data.author).toBe("Test Author");
    expect(data.tags).toEqual(["test", "example"]);
    expect(data.maxSteps).toBe(1000);
    expect(data.maxTimeMs).toBe(5000);
  });
});

describe("ScriptNodeDataSchema", () => {
  it("有効なデータをエンコード・デコードできる", () => {
    const data = new ScriptNodeData({
      title: "Test Script",
      tags: ["test"],
    });

    const encoded = Schema.encodeUnknownSync(ScriptNodeDataSchema)(data);
    const decoded = Schema.decodeUnknownSync(ScriptNodeDataSchema)(encoded);

    expect(decoded).toEqual(data);
  });

  it("空のタイトルでエラーになる", () => {
    const invalidData = {
      _tag: "ScriptNodeData",
      title: "",
      tags: [],
    };

    expect(() =>
      Schema.decodeUnknownSync(ScriptNodeDataSchema)(invalidData),
    ).toThrow();
  });
});

describe("createDefaultScriptNodeData", () => {
  it("デフォルトのScriptNodeDataを作成できる", () => {
    const data = createDefaultScriptNodeData("My Script");
    expect(data.title).toBe("My Script");
    expect(data.tags).toEqual([]);
    expect(data.description).toBeUndefined();
    expect(data.author).toBeUndefined();
    expect(data.maxSteps).toBeUndefined();
    expect(data.maxTimeMs).toBeUndefined();
  });
});

describe("getScriptNodeLabel", () => {
  it("ラベルを正しく生成する", () => {
    const data = createDefaultScriptNodeData("Calculate Proof");
    const label = getScriptNodeLabel(data);
    expect(label).toBe("Script: Calculate Proof");
  });
});

describe("Script code functions", () => {
  it("getScriptCode はコードをそのまま返す", () => {
    const code = `// Test script
const x = 1;
console.log(x);`;
    expect(getScriptCode(code)).toBe(code);
  });

  it("setScriptCode はコードをそのまま返す", () => {
    const code = `// Another script
function test() { return 42; }`;
    expect(setScriptCode(code)).toBe(code);
  });
});

