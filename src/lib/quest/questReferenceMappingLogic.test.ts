import { describe, it, expect } from "vitest";
import type { ReferenceEntry } from "../reference/referenceEntry";
import {
  buildQuestToReferenceMap,
  getQuestReferenceCount,
  getQuestReferenceIds,
} from "./questReferenceMappingLogic";

// --- テストヘルパー ---

function makeEntry(
  id: string,
  relatedQuestIds?: readonly string[],
): ReferenceEntry {
  return {
    id,
    category: "axiom",
    title: { en: id, ja: id },
    summary: { en: "", ja: "" },
    body: { en: [], ja: [] },
    relatedEntryIds: [],
    relatedQuestIds,
    externalLinks: [],
    keywords: [],
    order: 0,
  };
}

// --- buildQuestToReferenceMap ---

describe("buildQuestToReferenceMap", () => {
  it("空配列では空マップを返す", () => {
    const map = buildQuestToReferenceMap([]);
    expect(map.size).toBe(0);
  });

  it("relatedQuestIdsがないエントリは無視される", () => {
    const entries = [makeEntry("ref-1"), makeEntry("ref-2", undefined)];
    const map = buildQuestToReferenceMap(entries);
    expect(map.size).toBe(0);
  });

  it("relatedQuestIdsが空配列のエントリは無視される", () => {
    const entries = [makeEntry("ref-1", [])];
    const map = buildQuestToReferenceMap(entries);
    expect(map.size).toBe(0);
  });

  it("1エントリが複数クエストに関連するとき正しくマッピングされる", () => {
    const entries = [makeEntry("axiom-a1", ["prop-01", "prop-02"])];
    const map = buildQuestToReferenceMap(entries);
    expect(map.get("prop-01")).toEqual(["axiom-a1"]);
    expect(map.get("prop-02")).toEqual(["axiom-a1"]);
  });

  it("複数エントリが同じクエストに関連するとき集約される", () => {
    const entries = [
      makeEntry("axiom-a1", ["prop-01"]),
      makeEntry("axiom-a2", ["prop-01", "prop-03"]),
      makeEntry("rule-mp", ["prop-01"]),
    ];
    const map = buildQuestToReferenceMap(entries);
    expect(map.get("prop-01")).toEqual(["axiom-a1", "axiom-a2", "rule-mp"]);
    expect(map.get("prop-03")).toEqual(["axiom-a2"]);
  });

  it("relatedQuestIdsがあるエントリとないエントリが混在しても正しく動作する", () => {
    const entries = [
      makeEntry("ref-1", ["q1"]),
      makeEntry("ref-2"),
      makeEntry("ref-3", ["q1", "q2"]),
    ];
    const map = buildQuestToReferenceMap(entries);
    expect(map.get("q1")).toEqual(["ref-1", "ref-3"]);
    expect(map.get("q2")).toEqual(["ref-3"]);
    expect(map.size).toBe(2);
  });
});

// --- getQuestReferenceCount ---

describe("getQuestReferenceCount", () => {
  it("マッピングに存在するクエストの数を返す", () => {
    const map = buildQuestToReferenceMap([
      makeEntry("a1", ["q1"]),
      makeEntry("a2", ["q1"]),
    ]);
    expect(getQuestReferenceCount(map, "q1")).toBe(2);
  });

  it("マッピングに存在しないクエストは0を返す", () => {
    const map = buildQuestToReferenceMap([makeEntry("a1", ["q1"])]);
    expect(getQuestReferenceCount(map, "q999")).toBe(0);
  });

  it("空マップでは0を返す", () => {
    const map = buildQuestToReferenceMap([]);
    expect(getQuestReferenceCount(map, "q1")).toBe(0);
  });
});

// --- getQuestReferenceIds ---

describe("getQuestReferenceIds", () => {
  it("マッピングに存在するクエストのIDリストを返す", () => {
    const map = buildQuestToReferenceMap([
      makeEntry("a1", ["q1"]),
      makeEntry("a2", ["q1"]),
    ]);
    expect(getQuestReferenceIds(map, "q1")).toEqual(["a1", "a2"]);
  });

  it("マッピングに存在しないクエストは空配列を返す", () => {
    const map = buildQuestToReferenceMap([makeEntry("a1", ["q1"])]);
    expect(getQuestReferenceIds(map, "q999")).toEqual([]);
  });

  it("空マップでは空配列を返す", () => {
    const map = buildQuestToReferenceMap([]);
    expect(getQuestReferenceIds(map, "q1")).toEqual([]);
  });
});
