import { describe, it, expect } from "vitest";
import {
  utf8ToBase64Url,
  base64UrlToUtf8,
  encodeQuestToUrlParam,
  decodeQuestFromUrlParam,
  buildQuestShareUrl,
  extractQuestParam,
  prepareUrlQuestForImport,
  QUEST_URL_PARAM,
} from "./questUrlSharing";
import type { QuestDefinition } from "./questDefinition";

// --- テストヘルパー ---

const sampleQuest: QuestDefinition = {
  id: "custom-1000",
  category: "propositional-basics",
  title: "テストクエスト",
  description: "テストの説明",
  difficulty: 2,
  systemPresetId: "lukasiewicz",
  goals: [{ formulaText: "phi -> phi" }],
  hints: ["ヒント1"],
  estimatedSteps: 5,
  learningPoint: "テスト学習ポイント",
  order: 1,
  version: 3,
};

const sampleQuestWithExtras: QuestDefinition = {
  ...sampleQuest,
  goals: [
    {
      formulaText: "phi -> phi",
      label: "Goal 1",
      allowedAxiomIds: ["A1", "A2"],
      allowedRuleIds: ["mp"],
    },
    {
      formulaText: "psi -> psi",
    },
  ],
  allowedAxiomIds: ["A1", "A2", "A3"],
};

// --- テスト ---

describe("questUrlSharing", () => {
  describe("QUEST_URL_PARAM", () => {
    it("パラメータ名が定義されている", () => {
      expect(QUEST_URL_PARAM).toBe("quest");
    });
  });

  describe("utf8ToBase64Url / base64UrlToUtf8", () => {
    it("ASCII文字列のラウンドトリップ", () => {
      const original = "Hello, World!";
      const encoded = utf8ToBase64Url(original);
      const decoded = base64UrlToUtf8(encoded);
      expect(decoded).toBe(original);
    });

    it("日本語文字列のラウンドトリップ", () => {
      const original = "テストクエスト 日本語テスト";
      const encoded = utf8ToBase64Url(original);
      const decoded = base64UrlToUtf8(encoded);
      expect(decoded).toBe(original);
    });

    it("絵文字（サロゲートペア）のラウンドトリップ", () => {
      const original = "Hello 🎉 World 🌍";
      const encoded = utf8ToBase64Url(original);
      const decoded = base64UrlToUtf8(encoded);
      expect(decoded).toBe(original);
    });

    it("空文字列のラウンドトリップ", () => {
      const encoded = utf8ToBase64Url("");
      const decoded = base64UrlToUtf8(encoded);
      expect(decoded).toBe("");
    });

    it("JSON文字列のラウンドトリップ", () => {
      const original = JSON.stringify({ key: "value", num: 42, arr: [1, 2] });
      const encoded = utf8ToBase64Url(original);
      const decoded = base64UrlToUtf8(encoded);
      expect(decoded).toBe(original);
    });

    it("base64url形式: +が-に、/が_に変換される", () => {
      const encoded = utf8ToBase64Url("test");
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");
    });

    it("不正なbase64urlはundefinedを返す", () => {
      expect(base64UrlToUtf8("!!!")).toBeUndefined();
    });

    it("不正な長さ（padding=1）はundefinedを返す", () => {
      expect(base64UrlToUtf8("A")).toBeUndefined();
    });

    it("様々な長さの文字列のラウンドトリップ", () => {
      for (let len = 0; len <= 20; len++) {
        const original = "a".repeat(len);
        const encoded = utf8ToBase64Url(original);
        const decoded = base64UrlToUtf8(encoded);
        expect(decoded).toBe(original);
      }
    });

    it("マルチバイト文字が混在する場合のラウンドトリップ", () => {
      const original = "abc日本語def𝄞ghi";
      const encoded = utf8ToBase64Url(original);
      const decoded = base64UrlToUtf8(encoded);
      expect(decoded).toBe(original);
    });

    it("孤立サロゲート（high surrogateの後にlow surrogateが続かない）", () => {
      // high surrogate (0xD800) + 通常のASCII文字 'A' (0x0041)
      const loneHighSurrogate = String.fromCharCode(0xd800, 0x0041);
      const encoded = utf8ToBase64Url(loneHighSurrogate);
      // エンコード自体がエラーなく完了することを確認
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    // --- 不正UTF-8デコードのエッジケース ---

    // バイト配列→base64urlヘルパー（テスト専用）
    function bytesToBase64Url(bytes: readonly number[]): string {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let result = "";
      for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i] ?? 0;
        const b1 = bytes[i + 1];
        const b2 = bytes[i + 2];
        result += chars[b0 >> 2];
        result += chars[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
        result +=
          b1 !== undefined ? chars[((b1 & 0xf) << 2) | ((b2 ?? 0) >> 6)] : "=";
        result += b2 !== undefined ? chars[b2 & 0x3f] : "=";
      }
      return result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }

    it("4バイトUTF-8シーケンスが途中で切れている場合はundefinedを返す", () => {
      // 0xF0はUTF-8の4バイトシーケンスのリードバイト。後続バイトが不足
      const truncated = bytesToBase64Url([0xf0, 0x90]);
      expect(base64UrlToUtf8(truncated)).toBeUndefined();
    });

    it("不正なUTF-8リードバイト(0xF8以上)はundefinedを返す", () => {
      // 0xF8はUTF-8で無効なリードバイト
      const invalid = bytesToBase64Url([0xf8]);
      expect(base64UrlToUtf8(invalid)).toBeUndefined();
    });

    it("2バイトUTF-8シーケンスが途中で切れている場合はundefinedを返す", () => {
      // 0xC2はUTF-8の2バイトシーケンスのリードバイト。後続バイトが不足
      const truncated = bytesToBase64Url([0xc2]);
      expect(base64UrlToUtf8(truncated)).toBeUndefined();
    });

    it("3バイトUTF-8シーケンスが途中で切れている場合はundefinedを返す", () => {
      // 0xE3はUTF-8の3バイトシーケンスのリードバイト。後続バイトが1つしかない
      const truncated = bytesToBase64Url([0xe3, 0x81]);
      expect(base64UrlToUtf8(truncated)).toBeUndefined();
    });
  });

  describe("encodeQuestToUrlParam / decodeQuestFromUrlParam", () => {
    it("基本的なクエストのラウンドトリップ", () => {
      const encoded = encodeQuestToUrlParam(sampleQuest);
      const result = decodeQuestFromUrlParam(encoded);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.quest.title).toBe("テストクエスト");
      expect(result.quest.description).toBe("テストの説明");
      expect(result.quest.category).toBe("propositional-basics");
      expect(result.quest.difficulty).toBe(2);
      expect(result.quest.systemPresetId).toBe("lukasiewicz");
      expect(result.quest.goals).toHaveLength(1);
      expect(result.quest.goals[0]?.formulaText).toBe("phi -> phi");
      expect(result.quest.hints).toEqual(["ヒント1"]);
      expect(result.quest.estimatedSteps).toBe(5);
      expect(result.quest.learningPoint).toBe("テスト学習ポイント");
    });

    it("元のID/order/versionはリセットされる", () => {
      const encoded = encodeQuestToUrlParam(sampleQuest);
      const result = decodeQuestFromUrlParam(encoded);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      // URLエンコードではID/order/versionは保存されない
      expect(result.quest.id).toBe("custom-0"); // 一時ID
      expect(result.quest.order).toBe(0);
      expect(result.quest.version).toBe(1);
    });

    it("ゴールのlabel/allowedAxiomIds/allowedRuleIdsが保持される", () => {
      const encoded = encodeQuestToUrlParam(sampleQuestWithExtras);
      const result = decodeQuestFromUrlParam(encoded);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.quest.goals).toHaveLength(2);
      expect(result.quest.goals[0]?.label).toBe("Goal 1");
      expect(result.quest.goals[0]?.allowedAxiomIds).toEqual(["A1", "A2"]);
      expect(result.quest.goals[0]?.allowedRuleIds).toEqual(["mp"]);
      expect(result.quest.goals[1]?.formulaText).toBe("psi -> psi");
      expect(result.quest.goals[1]?.label).toBeUndefined();
    });

    it("quest-level allowedAxiomIdsが保持される", () => {
      const encoded = encodeQuestToUrlParam(sampleQuestWithExtras);
      const result = decodeQuestFromUrlParam(encoded);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.quest.allowedAxiomIds).toEqual(["A1", "A2", "A3"]);
    });

    it("ビルトインクエストもエンコードできる", () => {
      const builtinQuest: QuestDefinition = {
        id: "prop-01",
        category: "propositional-basics",
        title: "Identity",
        description: "Prove φ→φ",
        difficulty: 1,
        systemPresetId: "lukasiewicz",
        goals: [{ formulaText: "phi -> phi" }],
        hints: ["Use A1 and A2"],
        estimatedSteps: 5,
        learningPoint: "Basic proof",
        order: 1,
        version: 1,
      };

      const encoded = encodeQuestToUrlParam(builtinQuest);
      const result = decodeQuestFromUrlParam(encoded);

      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;

      expect(result.quest.title).toBe("Identity");
      expect(result.quest.description).toBe("Prove φ→φ");
    });

    it("不正なbase64ではInvalidBase64を返す", () => {
      const result = decodeQuestFromUrlParam("!!!not-base64!!!");
      expect(result._tag).toBe("InvalidBase64");
    });

    it("不正なJSONではInvalidJsonを返す", () => {
      const notJson = utf8ToBase64Url("not json at all");
      const result = decodeQuestFromUrlParam(notJson);
      expect(result._tag).toBe("InvalidJson");
    });

    it("JSONがnullではInvalidQuestを返す", () => {
      const nullJson = utf8ToBase64Url("null");
      const result = decodeQuestFromUrlParam(nullJson);
      expect(result._tag).toBe("InvalidQuest");
    });

    it("フォーマットIDが異なるとInvalidQuestを返す", () => {
      const wrongFormat = utf8ToBase64Url(
        JSON.stringify({ _f: "wrong", _v: 1 }),
      );
      const result = decodeQuestFromUrlParam(wrongFormat);
      expect(result._tag).toBe("InvalidQuest");
    });

    it("バージョンが異なるとInvalidQuestを返す", () => {
      const wrongVersion = utf8ToBase64Url(
        JSON.stringify({ _f: "ifp-quest", _v: 99 }),
      );
      const result = decodeQuestFromUrlParam(wrongVersion);
      expect(result._tag).toBe("InvalidQuest");
    });

    it("タイトルが空だとInvalidQuestを返す", () => {
      const emptyTitle = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "",
          d: "desc",
          cat: "propositional-basics",
          diff: 1,
          sys: "lukasiewicz",
          g: [{ f: "phi -> phi" }],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      const result = decodeQuestFromUrlParam(emptyTitle);
      expect(result._tag).toBe("InvalidQuest");
    });

    it("空白のみのタイトルだとInvalidQuestを返す", () => {
      const whitespaceTitle = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "   ",
          d: "desc",
          cat: "propositional-basics",
          diff: 1,
          sys: "lukasiewicz",
          g: [{ f: "phi -> phi" }],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      const result = decodeQuestFromUrlParam(whitespaceTitle);
      expect(result._tag).toBe("InvalidQuest");
    });

    it("ゴールが空配列だとInvalidQuestを返す", () => {
      const emptyGoals = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "propositional-basics",
          diff: 1,
          sys: "lukasiewicz",
          g: [],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      const result = decodeQuestFromUrlParam(emptyGoals);
      expect(result._tag).toBe("InvalidQuest");
    });

    it("必須フィールドが欠けているとInvalidQuestを返す", () => {
      // description欠落
      const missingDesc = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          cat: "cat",
          diff: 1,
          sys: "sys",
          g: [{ f: "phi" }],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(missingDesc)._tag).toBe("InvalidQuest");

      // category欠落
      const missingCat = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          diff: 1,
          sys: "sys",
          g: [{ f: "phi" }],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(missingCat)._tag).toBe("InvalidQuest");

      // difficulty欠落
      const missingDiff = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          sys: "sys",
          g: [{ f: "phi" }],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(missingDiff)._tag).toBe("InvalidQuest");

      // systemPresetId欠落
      const missingSys = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          g: [{ f: "phi" }],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(missingSys)._tag).toBe("InvalidQuest");

      // goals欠落
      const missingGoals = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          sys: "sys",
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(missingGoals)._tag).toBe("InvalidQuest");

      // hints欠落
      const missingHints = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          sys: "sys",
          g: [{ f: "phi" }],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(missingHints)._tag).toBe("InvalidQuest");

      // estimatedSteps欠落
      const missingEst = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          sys: "sys",
          g: [{ f: "phi" }],
          h: [],
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(missingEst)._tag).toBe("InvalidQuest");

      // learningPoint欠落
      const missingLp = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          sys: "sys",
          g: [{ f: "phi" }],
          h: [],
          est: 5,
        }),
      );
      expect(decodeQuestFromUrlParam(missingLp)._tag).toBe("InvalidQuest");
    });

    it("ゴールの formulaText が欠けているとInvalidQuestを返す", () => {
      const badGoal = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          sys: "sys",
          g: [{ notF: "phi" }],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(badGoal)._tag).toBe("InvalidQuest");
    });

    it("ゴールがオブジェクトでない場合はInvalidQuestを返す", () => {
      const badGoal = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          sys: "sys",
          g: ["not-an-object"],
          h: [],
          est: 5,
          lp: "lp",
        }),
      );
      expect(decodeQuestFromUrlParam(badGoal)._tag).toBe("InvalidQuest");
    });

    it("hints内の非文字列はフィルタされる", () => {
      const mixedHints = utf8ToBase64Url(
        JSON.stringify({
          _f: "ifp-quest",
          _v: 1,
          t: "test",
          d: "desc",
          cat: "cat",
          diff: 1,
          sys: "sys",
          g: [{ f: "phi" }],
          h: ["valid", 42, "also valid"],
          est: 5,
          lp: "lp",
        }),
      );
      const result = decodeQuestFromUrlParam(mixedHints);
      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;
      expect(result.quest.hints).toEqual(["valid", "also valid"]);
    });

    it("エンコード結果はURL安全な文字のみ", () => {
      const encoded = encodeQuestToUrlParam(sampleQuest);
      expect(encoded).toMatch(/^[A-Za-z0-9_-]*$/);
    });
  });

  describe("buildQuestShareUrl", () => {
    it("ベースURLにクエストパラメータを追加する", () => {
      const url = buildQuestShareUrl("https://example.com", sampleQuest);
      expect(url).toContain("https://example.com?quest=");
    });

    it("既にクエリパラメータがあるURLでは&で結合する", () => {
      const url = buildQuestShareUrl(
        "https://example.com?foo=bar",
        sampleQuest,
      );
      expect(url).toContain("https://example.com?foo=bar&quest=");
    });

    it("生成されたURLからクエストをデコードできる", () => {
      const url = buildQuestShareUrl("https://example.com", sampleQuest);
      const param = url.split("quest=")[1];
      expect(param).toBeDefined();
      if (param === undefined) return;

      const result = decodeQuestFromUrlParam(param);
      expect(result._tag).toBe("Ok");
      if (result._tag !== "Ok") return;
      expect(result.quest.title).toBe("テストクエスト");
    });
  });

  describe("extractQuestParam", () => {
    it("nullを渡すとnullを返す", () => {
      expect(extractQuestParam(null)).toBeNull();
    });

    it("文字列をそのまま返す", () => {
      expect(extractQuestParam("abc123")).toBe("abc123");
    });
  });

  describe("prepareUrlQuestForImport", () => {
    it("クエスト定義からインポート用パラメータを抽出する", () => {
      const params = prepareUrlQuestForImport(sampleQuest);
      expect(params.title).toBe("テストクエスト");
      expect(params.description).toBe("テストの説明");
      expect(params.category).toBe("propositional-basics");
      expect(params.difficulty).toBe(2);
      expect(params.systemPresetId).toBe("lukasiewicz");
      expect(params.goals).toHaveLength(1);
      expect(params.hints).toEqual(["ヒント1"]);
      expect(params.estimatedSteps).toBe(5);
      expect(params.learningPoint).toBe("テスト学習ポイント");
    });

    it("IDやversionは含まれない", () => {
      const params = prepareUrlQuestForImport(sampleQuest);
      expect("id" in params).toBe(false);
      expect("version" in params).toBe(false);
      expect("order" in params).toBe(false);
    });
  });
});
