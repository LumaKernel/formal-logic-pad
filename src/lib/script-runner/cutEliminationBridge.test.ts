import { describe, it, expect } from "vitest";
import {
  encodeScProofNode,
  decodeScProofNode,
  createCutEliminationBridges,
  CUT_ELIMINATION_BRIDGE_API_DEFS,
  generateCutEliminationBridgeTypeDefs,
} from "./cutEliminationBridge";
import {
  sequent,
  scIdentity,
  scCut,
  scWeakeningLeft,
  scWeakeningRight,
  scContractionLeft,
  scContractionRight,
  scExchangeLeft,
  scExchangeRight,
  scImplicationLeft,
  scImplicationRight,
  scConjunctionLeft,
  scConjunctionRight,
  scDisjunctionLeft,
  scDisjunctionRight,
  scUniversalLeft,
  scUniversalRight,
  scExistentialLeft,
  scExistentialRight,
  scBottomLeft,
} from "../logic-core/sequentCalculus";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import {
  metaVariable,
  implication,
  conjunction,
  disjunction,
} from "../logic-core/formula";
import { createScriptRunner } from "./scriptRunner";

// ── テスト用ヘルパー ────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const phiImplPsi = implication(phi, psi);
const phiAndPsi = conjunction(phi, psi);
const phiOrPsi = disjunction(phi, psi);

// ── encode / decode のラウンドトリップ ─────────────────────

describe("encodeScProofNode / decodeScProofNode", () => {
  const roundTrip = (node: ScProofNode) => {
    const json = encodeScProofNode(node);
    const decoded = decodeScProofNode(json);
    // 再エンコードして比較（Schema.TaggedClassインスタンスの参照等価性を避ける）
    expect(encodeScProofNode(decoded)).toEqual(json);
  };

  it("ScIdentity のラウンドトリップ", () => {
    roundTrip(scIdentity(sequent([phi], [phi])));
  });

  it("ScBottomLeft のラウンドトリップ", () => {
    roundTrip(scBottomLeft(sequent([phi], [])));
  });

  it("ScCut のラウンドトリップ", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [phi]));
    roundTrip(scCut(left, right, phi, sequent([phi], [phi])));
  });

  it("ScWeakeningLeft のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scWeakeningLeft(premise, psi, sequent([psi, phi], [phi])));
  });

  it("ScWeakeningRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scWeakeningRight(premise, psi, sequent([phi], [phi, psi])));
  });

  it("ScContractionLeft のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi, phi], [phi]));
    roundTrip(scContractionLeft(premise, phi, sequent([phi], [phi])));
  });

  it("ScContractionRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi, phi]));
    roundTrip(scContractionRight(premise, phi, sequent([phi], [phi])));
  });

  it("ScExchangeLeft のラウンドトリップ", () => {
    const premise = scIdentity(sequent([psi, phi], [phi]));
    roundTrip(scExchangeLeft(premise, 0, sequent([phi, psi], [phi])));
  });

  it("ScExchangeRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [psi, phi]));
    roundTrip(scExchangeRight(premise, 0, sequent([phi], [phi, psi])));
  });

  it("ScImplicationLeft のラウンドトリップ", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    roundTrip(
      scImplicationLeft(left, right, sequent([phiImplPsi, phi], [psi])),
    );
  });

  it("ScImplicationRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [psi]));
    roundTrip(scImplicationRight(premise, sequent([], [phiImplPsi])));
  });

  it("ScConjunctionLeft のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scConjunctionLeft(premise, 1, sequent([phiAndPsi], [phi])));
  });

  it("ScConjunctionLeft componentIndex=2 のラウンドトリップ", () => {
    const premise = scIdentity(sequent([psi], [psi]));
    roundTrip(scConjunctionLeft(premise, 2, sequent([phiAndPsi], [psi])));
  });

  it("ScConjunctionRight のラウンドトリップ", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    roundTrip(
      scConjunctionRight(left, right, sequent([phi, psi], [phiAndPsi])),
    );
  });

  it("ScDisjunctionLeft のラウンドトリップ", () => {
    const left = scIdentity(sequent([phi], [chi]));
    const right = scIdentity(sequent([psi], [chi]));
    roundTrip(scDisjunctionLeft(left, right, sequent([phiOrPsi], [chi])));
  });

  it("ScDisjunctionRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scDisjunctionRight(premise, 1, sequent([phi], [phiOrPsi])));
  });

  it("ScDisjunctionRight componentIndex=2 のラウンドトリップ", () => {
    const premise = scIdentity(sequent([psi], [psi]));
    roundTrip(scDisjunctionRight(premise, 2, sequent([psi], [phiOrPsi])));
  });

  it("ScUniversalLeft のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scUniversalLeft(premise, sequent([phi], [phi])));
  });

  it("ScUniversalRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scUniversalRight(premise, sequent([phi], [phi])));
  });

  it("ScExistentialLeft のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scExistentialLeft(premise, sequent([phi], [phi])));
  });

  it("ScExistentialRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scExistentialRight(premise, sequent([phi], [phi])));
  });
});

// ── デコードエラー ────────────────────────────────────────────

describe("decodeScProofNode エラー", () => {
  it("null を渡すとエラー", () => {
    expect(() => decodeScProofNode(null)).toThrow("must be an object");
  });

  it("_tag なしオブジェクトでエラー", () => {
    expect(() => decodeScProofNode({ conclusion: {} })).toThrow(
      "Unknown SC proof node _tag",
    );
  });

  it("不正な _tag でエラー", () => {
    expect(() =>
      decodeScProofNode({ _tag: "Invalid", conclusion: {} }),
    ).toThrow("Unknown SC proof node _tag");
  });

  it("conclusion が不正でエラー", () => {
    expect(() =>
      decodeScProofNode({ _tag: "ScIdentity", conclusion: null }),
    ).toThrow("Sequent must be an object");
  });

  it("antecedents が配列でなくエラー", () => {
    expect(() =>
      decodeScProofNode({
        _tag: "ScIdentity",
        conclusion: { antecedents: "invalid", succedents: [] },
      }),
    ).toThrow("antecedents must be an array");
  });

  it("succedents が配列でなくエラー", () => {
    expect(() =>
      decodeScProofNode({
        _tag: "ScIdentity",
        conclusion: { antecedents: [], succedents: "invalid" },
      }),
    ).toThrow("succedents must be an array");
  });

  it("不正な Formula でエラー", () => {
    expect(() =>
      decodeScProofNode({
        _tag: "ScIdentity",
        conclusion: {
          antecedents: [{ _tag: "InvalidFormula" }],
          succedents: [],
        },
      }),
    ).toThrow("Invalid formula in SC proof");
  });
});

// ── position フォールバック ──────────────────────────────────

describe("decodeScProofNode position フォールバック", () => {
  const validConclusion = {
    antecedents: [{ _tag: "MetaVariable", name: "φ" }],
    succedents: [{ _tag: "MetaVariable", name: "φ" }],
  };
  const validPremise = {
    _tag: "ScIdentity",
    conclusion: validConclusion,
  };

  it("ScExchangeLeft の position が未指定の場合は 0 にフォールバック", () => {
    const decoded = decodeScProofNode({
      _tag: "ScExchangeLeft",
      conclusion: validConclusion,
      premise: validPremise,
      // position を省略
    });
    expect(decoded._tag).toBe("ScExchangeLeft");
    if (decoded._tag === "ScExchangeLeft") {
      expect(decoded.position).toBe(0);
    }
  });

  it("ScExchangeRight の position が文字列の場合は 0 にフォールバック", () => {
    const decoded = decodeScProofNode({
      _tag: "ScExchangeRight",
      conclusion: validConclusion,
      premise: validPremise,
      position: "invalid",
    });
    expect(decoded._tag).toBe("ScExchangeRight");
    if (decoded._tag === "ScExchangeRight") {
      expect(decoded.position).toBe(0);
    }
  });
});

// ── ブリッジ関数のテスト ────────────────────────────────────

describe("createCutEliminationBridges", () => {
  const bridges = createCutEliminationBridges();

  it("5つのブリッジ関数を返す", () => {
    expect(bridges).toHaveLength(5);
    expect(bridges.map((b) => b.name)).toEqual([
      "isCutFree",
      "countCuts",
      "formatSequent",
      "eliminateCutsWithSteps",
      "getScConclusion",
    ]);
  });

  describe("isCutFree", () => {
    const fn = bridges.find((b) => b.name === "isCutFree")!.fn;

    it("カットフリーな証明で true", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      const json = encodeScProofNode(proof);
      expect(fn(json)).toBe(true);
    });

    it("カットを含む証明で false", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const proof = scCut(left, right, phi, sequent([phi], [phi]));
      const json = encodeScProofNode(proof);
      expect(fn(json)).toBe(false);
    });
  });

  describe("countCuts", () => {
    const fn = bridges.find((b) => b.name === "countCuts")!.fn;

    it("カットフリーで 0", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      expect(fn(encodeScProofNode(proof))).toBe(0);
    });

    it("カット1つで 1", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const proof = scCut(left, right, phi, sequent([phi], [phi]));
      expect(fn(encodeScProofNode(proof))).toBe(1);
    });
  });

  describe("formatSequent", () => {
    const fn = bridges.find((b) => b.name === "formatSequent")!.fn;

    it("シーケントをテキストに変換", () => {
      // encodeScProofNode 済みの proof から conclusion を取得してテスト
      const proof = scIdentity(sequent([phi], [psi]));
      const proofJson = encodeScProofNode(proof) as Record<string, unknown>;
      const conclusionJson = proofJson["conclusion"];
      expect(fn(conclusionJson)).toBe("φ ⇒ ψ");
    });
  });

  describe("getScConclusion", () => {
    const fn = bridges.find((b) => b.name === "getScConclusion")!.fn;

    it("結論シーケントを取得", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      const json = encodeScProofNode(proof);
      const result = fn(json) as Record<string, unknown>;
      expect(result).toHaveProperty("antecedents");
      expect(result).toHaveProperty("succedents");
      expect((result["antecedents"] as readonly unknown[]).length).toBe(1);
      expect((result["succedents"] as readonly unknown[]).length).toBe(1);
    });
  });

  describe("eliminateCutsWithSteps", () => {
    const fn = bridges.find((b) => b.name === "eliminateCutsWithSteps")!.fn;

    it("カットフリー証明でステップなし", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      const result = fn(encodeScProofNode(proof)) as Record<string, unknown>;
      expect((result["result"] as Record<string, unknown>)["_tag"]).toBe(
        "Success",
      );
      expect((result["steps"] as readonly unknown[]).length).toBe(0);
    });

    it("カットを含む証明でカット除去が実行される", () => {
      // φ ⇒ φ (ID)    φ ⇒ φ (ID)
      // ────────────────────────── (Cut: φ)
      //            φ ⇒ φ
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const proof = scCut(left, right, phi, sequent([phi], [phi]));

      const result = fn(encodeScProofNode(proof)) as Record<string, unknown>;
      expect((result["result"] as Record<string, unknown>)["_tag"]).toBe(
        "Success",
      );
      // 結果の証明はカットフリー
      const resultProof = (result["result"] as Record<string, unknown>)[
        "proof"
      ];
      const bridges2 = createCutEliminationBridges();
      const isCutFreeFn2 = bridges2.find((b) => b.name === "isCutFree")!.fn;
      expect(isCutFreeFn2(resultProof)).toBe(true);
    });

    it("maxSteps を指定できる", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const proof = scCut(left, right, phi, sequent([phi], [phi]));

      const result = fn(encodeScProofNode(proof), 1000) as Record<
        string,
        unknown
      >;
      expect((result["result"] as Record<string, unknown>)["_tag"]).toBe(
        "Success",
      );
    });

    it("maxSteps=0 で StepLimitExceeded になる", () => {
      const left = scIdentity(sequent([phi], [phi]));
      const right = scIdentity(sequent([phi], [phi]));
      const proof = scCut(left, right, phi, sequent([phi], [phi]));

      const result = fn(encodeScProofNode(proof), 0) as Record<string, unknown>;
      const resultObj = result["result"] as Record<string, unknown>;
      expect(resultObj["_tag"]).toBe("StepLimitExceeded");
      expect(resultObj).toHaveProperty("proof");
      expect(resultObj).toHaveProperty("stepsUsed");
    });
  });
});

// ── API 定義 ──────────────────────────────────────────────────

describe("CUT_ELIMINATION_BRIDGE_API_DEFS", () => {
  it("5つの定義を含む", () => {
    expect(CUT_ELIMINATION_BRIDGE_API_DEFS).toHaveLength(5);
  });
});

describe("generateCutEliminationBridgeTypeDefs", () => {
  it("型定義テキストを生成する", () => {
    const defs = generateCutEliminationBridgeTypeDefs();
    expect(defs).toContain("declare function isCutFree");
    expect(defs).toContain("declare function eliminateCutsWithSteps");
    expect(defs).toContain("declare function formatSequent");
    expect(defs).toContain("declare function countCuts");
    expect(defs).toContain("declare function getScConclusion");
  });
});

// ── スクリプトランナーとの統合テスト ────────────────────────

describe("カット除去ブリッジ スクリプト統合", () => {
  it("スクリプトからカット除去APIを呼べる", () => {
    const b = [...createCutEliminationBridges()];
    const code = `
      var proof = {
        _tag: "ScIdentity",
        conclusion: {
          antecedents: [{ _tag: "MetaVariable", name: "φ" }],
          succedents: [{ _tag: "MetaVariable", name: "φ" }]
        }
      };
      var result = isCutFree(proof);
      result;
    `;
    const runner = createScriptRunner(code, { bridges: b });
    if ("run" in runner) {
      const result = runner.run();
      if (result._tag === "Error") {
        throw new Error(
          `Script error: ${JSON.stringify(result.error) satisfies string}`,
        );
      }
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe(true);
      }
    }
  });

  it("スクリプトからカット除去を実行できる", () => {
    const b = [...createCutEliminationBridges()];
    const code = `
      var idProof = {
        _tag: "ScIdentity",
        conclusion: {
          antecedents: [{ _tag: "MetaVariable", name: "φ" }],
          succedents: [{ _tag: "MetaVariable", name: "φ" }]
        }
      };
      var cutProof = {
        _tag: "ScCut",
        conclusion: {
          antecedents: [{ _tag: "MetaVariable", name: "φ" }],
          succedents: [{ _tag: "MetaVariable", name: "φ" }]
        },
        left: idProof,
        right: idProof,
        cutFormula: { _tag: "MetaVariable", name: "φ" }
      };
      var out = eliminateCutsWithSteps(cutProof);
      out.result._tag;
    `;
    const runner = createScriptRunner(code, { bridges: b });
    if ("run" in runner) {
      const result = runner.run();
      if (result._tag === "Error") {
        throw new Error(
          `Script error: ${JSON.stringify(result.error) satisfies string}`,
        );
      }
      expect(result._tag).toBe("Ok");
      if (result._tag === "Ok") {
        expect(result.value).toBe("Success");
      }
    }
  });
});
