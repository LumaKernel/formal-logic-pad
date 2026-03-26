import { describe, it, expect } from "vitest";
import {
  encodeScProofNode,
  decodeScProofNode,
  createCutEliminationBridges,
  CUT_ELIMINATION_BRIDGE_API_DEFS,
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
  scNegationLeft,
  scNegationRight,
  scBottomLeft,
} from "../logic-core/sequentCalculus";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import {
  metaVariable,
  implication,
  conjunction,
  disjunction,
} from "../logic-core/formula";
import { encodeFormula } from "../logic-core/serialization";
import { createScriptRunner } from "./scriptRunner";
import { createProofBridges } from "./proofBridge";

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

  it("ScNegationLeft のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scNegationLeft(premise, sequent([phi], [phi])));
  });

  it("ScNegationRight のラウンドトリップ", () => {
    const premise = scIdentity(sequent([phi], [phi]));
    roundTrip(scNegationRight(premise, sequent([phi], [phi])));
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

  it("36のブリッジ関数を返す（5操作 + 9ヘルパー + 22コンストラクタ）", () => {
    expect(bridges).toHaveLength(36);
    expect(bridges.map((b) => b.name)).toEqual([
      "isCutFree",
      "countCuts",
      "formatSequent",
      "eliminateCutsWithSteps",
      "getScConclusion",
      "formulaDepth",
      "rightRank",
      "leftRank",
      "mixRank",
      "removeAllOccurrences",
      "removeFirstOccurrence",
      "containsFormula",
      "countOccurrences",
      "getScChildren",
      "sequent",
      "scIdentity",
      "scBottomLeft",
      "scCut",
      "scWeakeningLeft",
      "scWeakeningRight",
      "scContractionLeft",
      "scContractionRight",
      "scExchangeLeft",
      "scExchangeRight",
      "scImplicationLeft",
      "scImplicationRight",
      "scConjunctionLeft",
      "scConjunctionRight",
      "scDisjunctionLeft",
      "scDisjunctionRight",
      "scNegationLeft",
      "scNegationRight",
      "scUniversalLeft",
      "scUniversalRight",
      "scExistentialLeft",
      "scExistentialRight",
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

// ── カット除去ヘルパー関数 ────────────────────────────────────

describe("カット除去ヘルパー関数ブリッジ", () => {
  const bridges = createCutEliminationBridges();
  const findFn = (name: string) => bridges.find((b) => b.name === name)!.fn;

  describe("formulaDepth", () => {
    const fn = findFn("formulaDepth");
    it("原子式は深さ1", () => {
      expect(fn(encodeFormula(phi))).toBe(1);
    });
    it("含意は深さ2", () => {
      expect(fn(encodeFormula(implication(phi, psi)))).toBe(2);
    });
  });

  describe("rightRank", () => {
    const fn = findFn("rightRank");
    it("ID公理の右ランクは1", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      expect(fn(encodeScProofNode(proof), encodeFormula(phi))).toBe(1);
    });
    it("右辺にカット式がないノードは0", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      expect(fn(encodeScProofNode(proof), encodeFormula(psi))).toBe(0);
    });
  });

  describe("leftRank", () => {
    const fn = findFn("leftRank");
    it("ID公理の左ランクは1", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      expect(fn(encodeScProofNode(proof), encodeFormula(phi))).toBe(1);
    });
  });

  describe("mixRank", () => {
    const fn = findFn("mixRank");
    it("ID公理同士のカットはランク1", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      expect(fn(encodeScProofNode(cut))).toBe(1);
    });
    it("ScCut以外はエラー", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      expect(() => fn(encodeScProofNode(proof))).toThrow(
        "mixRank: argument must be a ScCut node",
      );
    });
  });

  describe("removeAllOccurrences", () => {
    const fn = findFn("removeAllOccurrences");
    it("全出現を除去", () => {
      const result = fn(
        [encodeFormula(phi), encodeFormula(psi), encodeFormula(phi)],
        encodeFormula(phi),
      );
      expect(result).toHaveLength(1);
    });
    it("配列でない入力はエラー", () => {
      expect(() => fn("not-array", encodeFormula(phi))).toThrow(
        "first argument must be an array",
      );
    });
  });

  describe("removeFirstOccurrence", () => {
    const fn = findFn("removeFirstOccurrence");
    it("最初の出現だけ除去", () => {
      const result = fn(
        [encodeFormula(phi), encodeFormula(psi), encodeFormula(phi)],
        encodeFormula(phi),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("containsFormula", () => {
    const fn = findFn("containsFormula");
    it("含まれる場合true", () => {
      expect(
        fn([encodeFormula(phi), encodeFormula(psi)], encodeFormula(phi)),
      ).toBe(true);
    });
    it("含まれない場合false", () => {
      expect(fn([encodeFormula(psi)], encodeFormula(phi))).toBe(false);
    });
  });

  describe("countOccurrences", () => {
    const fn = findFn("countOccurrences");
    it("出現回数を返す", () => {
      expect(
        fn(
          [encodeFormula(phi), encodeFormula(psi), encodeFormula(phi)],
          encodeFormula(phi),
        ),
      ).toBe(2);
    });
  });

  describe("getScChildren", () => {
    const fn = findFn("getScChildren");
    it("葉ノードは空配列", () => {
      const proof = scIdentity(sequent([phi], [phi]));
      expect(fn(encodeScProofNode(proof))).toEqual([]);
    });
    it("カットノードは2つの子を返す", () => {
      const cut = scCut(
        scIdentity(sequent([phi], [phi])),
        scIdentity(sequent([phi], [phi])),
        phi,
        sequent([phi], [phi]),
      );
      const children = fn(encodeScProofNode(cut)) as readonly unknown[];
      expect(children).toHaveLength(2);
    });
  });
});

// ── API 定義 ──────────────────────────────────────────────────

describe("CUT_ELIMINATION_BRIDGE_API_DEFS", () => {
  it("36の定義を含む（5操作 + 9ヘルパー + 22コンストラクタ）", () => {
    expect(CUT_ELIMINATION_BRIDGE_API_DEFS).toHaveLength(36);
  });
});

// ── SC証明ノードコンストラクタのテスト ────────────────────────

describe("SC証明ノードコンストラクタ ブリッジ", () => {
  const bridges = createCutEliminationBridges();
  const findFn = (name: string) => bridges.find((b) => b.name === name)!.fn;

  const phiJson = encodeScProofNode(
    scIdentity(sequent([phi], [phi])),
  ) as Record<string, unknown>;
  // phiJson.conclusion を sequent JSON として使用
  const phiSeqJson = phiJson["conclusion"];
  // formula JSON
  const phiFormulaJson = (phiSeqJson as Record<string, unknown>)[
    "antecedents"
  ] as readonly unknown[];

  describe("sequent", () => {
    const fn = findFn("sequent");

    it("シーケントを構築する", () => {
      const result = fn(phiFormulaJson, phiFormulaJson) as Record<
        string,
        unknown
      >;
      expect(result).toHaveProperty("antecedents");
      expect(result).toHaveProperty("succedents");
    });

    it("antecedents が配列でなければエラー", () => {
      expect(() => fn("invalid", [])).toThrow("antecedents must be an array");
    });

    it("succedents が配列でなければエラー", () => {
      expect(() => fn([], "invalid")).toThrow("succedents must be an array");
    });
  });

  describe("scIdentity", () => {
    const fn = findFn("scIdentity");

    it("ID公理ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const result = fn(seq) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScIdentity");
      expect(result).toHaveProperty("conclusion");
    });
  });

  describe("scCut", () => {
    const fn = findFn("scCut");

    it("カットノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const left = idFn(seq);
      const right = idFn(seq);
      const result = fn(left, right, phiFormulaJson[0], seq) as Record<
        string,
        unknown
      >;
      expect(result["_tag"]).toBe("ScCut");
    });
  });

  describe("scWeakeningLeft / scWeakeningRight", () => {
    const wlFn = findFn("scWeakeningLeft");
    const wrFn = findFn("scWeakeningRight");

    it("左弱化ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(
        [...phiFormulaJson, ...phiFormulaJson],
        phiFormulaJson,
      );
      const result = wlFn(premise, phiFormulaJson[0], concl) as Record<
        string,
        unknown
      >;
      expect(result["_tag"]).toBe("ScWeakeningLeft");
    });

    it("右弱化ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, [
        ...phiFormulaJson,
        ...phiFormulaJson,
      ]);
      const result = wrFn(premise, phiFormulaJson[0], concl) as Record<
        string,
        unknown
      >;
      expect(result["_tag"]).toBe("ScWeakeningRight");
    });
  });

  describe("scImplicationLeft / scImplicationRight", () => {
    const ilFn = findFn("scImplicationLeft");
    const irFn = findFn("scImplicationRight");

    it("含意左規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const seqL = seqFn(phiFormulaJson, phiFormulaJson);
      const seqR = seqFn(phiFormulaJson, phiFormulaJson);
      const left = idFn(seqL);
      const right = idFn(seqR);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = ilFn(left, right, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScImplicationLeft");
    });

    it("含意右規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn([], phiFormulaJson);
      const result = irFn(premise, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScImplicationRight");
    });
  });

  describe("scExchangeLeft / scExchangeRight バリデーション", () => {
    it("position が数値でなければエラー", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const elFn = findFn("scExchangeLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      expect(() => elFn(premise, "invalid", seq)).toThrow(
        "position must be a number",
      );
    });

    it("scExchangeRight: position が数値でなければエラー", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const erFn = findFn("scExchangeRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      expect(() => erFn(premise, null, seq)).toThrow(
        "position must be a number",
      );
    });
  });

  describe("scConjunctionLeft / scDisjunctionRight バリデーション", () => {
    it("componentIndex が 1 でも 2 でもなければエラー", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const clFn = findFn("scConjunctionLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      expect(() => clFn(premise, 3, seq)).toThrow(
        "componentIndex must be 1 or 2",
      );
    });

    it("scDisjunctionRight: componentIndex が不正ならエラー", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const drFn = findFn("scDisjunctionRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      expect(() => drFn(premise, 0, seq)).toThrow(
        "componentIndex must be 1 or 2",
      );
    });
  });

  describe("scBottomLeft", () => {
    const fn = findFn("scBottomLeft");

    it("⊥左規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const result = fn(seq) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScBottomLeft");
    });
  });

  describe("scContractionLeft / scContractionRight", () => {
    it("左縮約ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const clFn = findFn("scContractionLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = clFn(premise, phiFormulaJson[0], concl) as Record<
        string,
        unknown
      >;
      expect(result["_tag"]).toBe("ScContractionLeft");
    });

    it("右縮約ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const crFn = findFn("scContractionRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = crFn(premise, phiFormulaJson[0], concl) as Record<
        string,
        unknown
      >;
      expect(result["_tag"]).toBe("ScContractionRight");
    });
  });

  describe("scExchangeLeft / scExchangeRight (正常系)", () => {
    it("左交換ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const elFn = findFn("scExchangeLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = elFn(premise, 0, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScExchangeLeft");
    });

    it("右交換ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const erFn = findFn("scExchangeRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = erFn(premise, 0, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScExchangeRight");
    });
  });

  describe("scConjunctionLeft (正常系) / scConjunctionRight", () => {
    it("連言左規則ノードを構築する（componentIndex=1）", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const clFn = findFn("scConjunctionLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = clFn(premise, 1, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScConjunctionLeft");
    });

    it("連言右規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const crFn = findFn("scConjunctionRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const left = idFn(seq);
      const right = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = crFn(left, right, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScConjunctionRight");
    });
  });

  describe("scDisjunctionLeft / scDisjunctionRight (正常系)", () => {
    it("選言左規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const dlFn = findFn("scDisjunctionLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const left = idFn(seq);
      const right = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = dlFn(left, right, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScDisjunctionLeft");
    });

    it("選言右規則ノードを構築する（componentIndex=2）", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const drFn = findFn("scDisjunctionRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = drFn(premise, 2, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScDisjunctionRight");
    });
  });

  describe("scNegationLeft / scNegationRight", () => {
    it("否定左規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const nlFn = findFn("scNegationLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = nlFn(premise, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScNegationLeft");
    });

    it("否定右規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const nrFn = findFn("scNegationRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = nrFn(premise, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScNegationRight");
    });
  });

  describe("scUniversalLeft / scUniversalRight", () => {
    it("全称左規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const ulFn = findFn("scUniversalLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = ulFn(premise, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScUniversalLeft");
    });

    it("全称右規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const urFn = findFn("scUniversalRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = urFn(premise, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScUniversalRight");
    });
  });

  describe("scExistentialLeft / scExistentialRight", () => {
    it("存在左規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const elFn = findFn("scExistentialLeft");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = elFn(premise, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScExistentialLeft");
    });

    it("存在右規則ノードを構築する", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const erFn = findFn("scExistentialRight");
      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const premise = idFn(seq);
      const concl = seqFn(phiFormulaJson, phiFormulaJson);
      const result = erFn(premise, concl) as Record<string, unknown>;
      expect(result["_tag"]).toBe("ScExistentialRight");
    });
  });

  describe("全コンストラクタの出力が isCutFree で検証可能", () => {
    it("コンストラクタで作った証明が isCutFree/countCuts で使える", () => {
      const seqFn = findFn("sequent");
      const idFn = findFn("scIdentity");
      const cutFn = findFn("scCut");
      const isCutFreeFn2 = findFn("isCutFree");
      const countCutsFn2 = findFn("countCuts");

      const seq = seqFn(phiFormulaJson, phiFormulaJson);
      const id = idFn(seq);
      expect(isCutFreeFn2(id)).toBe(true);
      expect(countCutsFn2(id)).toBe(0);

      const cut = cutFn(id, id, phiFormulaJson[0], seq);
      expect(isCutFreeFn2(cut)).toBe(false);
      expect(countCutsFn2(cut)).toBe(1);
    });
  });
});

// ── スクリプトランナーとの統合テスト ────────────────────────

describe("カット除去ブリッジ スクリプト統合", () => {
  it("スクリプトからコンストラクタ関数でSC証明を構築できる", () => {
    const allBridges = [
      ...createCutEliminationBridges(),
      ...createProofBridges(),
    ];
    const code = `
      var phi = parseFormula("phi");
      var seq = sequent([phi], [phi]);
      var proof = scIdentity(seq);
      var result = isCutFree(proof);
      result;
    `;
    const runner = createScriptRunner(code, { bridges: allBridges });
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

  it("スクリプトからコンストラクタでカット除去を実行できる", () => {
    const allBridges = [
      ...createCutEliminationBridges(),
      ...createProofBridges(),
    ];
    const code = `
      var phi = parseFormula("phi");
      var seq = sequent([phi], [phi]);
      var idProof = scIdentity(seq);
      var cutProof = scCut(idProof, idProof, phi, seq);
      var out = eliminateCutsWithSteps(cutProof);
      out.result._tag;
    `;
    const runner = createScriptRunner(code, { bridges: allBridges });
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
