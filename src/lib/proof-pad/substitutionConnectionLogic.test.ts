import { describe, expect, it } from "vitest";
import { Either } from "effect";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import { createEmptyWorkspace, addNode } from "./workspaceState";
import {
  validateSubstitutionConnectionApplication,
  computeSubstitutionConnectionCompatibleNodeIds,
  getSubstitutionConnectionErrorMessage,
  SubstitutionConnectionPremiseMissing,
  SubstitutionConnectionPremiseParseError,
  SubstitutionConnectionConclusionParseError,
  SubstitutionConnectionNotRelated,
} from "./substitutionConnectionLogic";
import type { SubstitutionConnectionEdge } from "./inferenceEdge";
import type { InferenceEdge } from "./inferenceEdge";

/** Helper to add a substitution-connection edge */
function addSubConnEdge(
  ws: ReturnType<typeof createEmptyWorkspace>,
  conclusionNodeId: string,
  premiseNodeId: string | undefined,
  conclusionText = "",
): ReturnType<typeof createEmptyWorkspace> {
  const edge: SubstitutionConnectionEdge = {
    _tag: "substitution-connection",
    conclusionNodeId,
    premiseNodeId,
    conclusionText,
  };
  return {
    ...ws,
    inferenceEdges: [...ws.inferenceEdges, edge],
  };
}

describe("substitutionConnectionLogic", () => {
  describe("validateSubstitutionConnectionApplication", () => {
    it("前提なしでエラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi");
      ws = addSubConnEdge(ws, "node-1", undefined);
      const result = validateSubstitutionConnectionApplication(ws, "node-1");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SubstitutionConnectionPremiseMissing");
      }
    });

    it("SubstitutionConnectionEdgeが存在しない場合エラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi");
      const result = validateSubstitutionConnectionApplication(ws, "node-1");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SubstitutionConnectionPremiseMissing");
      }
    });

    it("前提がパースできない場合エラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "invalid!!!");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "phi");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe(
          "SubstitutionConnectionPremiseParseError",
        );
      }
    });

    it("結論がパースできない場合エラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "invalid!!!");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe(
          "SubstitutionConnectionConclusionParseError",
        );
      }
    });

    it("項変数代入関係にない論理式はエラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "chi -> omega");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SubstitutionConnectionNotRelated");
      }
    });

    it("phi->phiとpsi->psiは置換接続不可（命題変数は項変数代入の対象外）", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi -> phi");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "psi -> psi");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isLeft(result)).toBe(true);
    });

    it("P(a)->P(a)とP(b)->P(b)は置換接続可能（a→bの代入）", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(a) -> P(a)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(b) -> P(b)");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("substitution-connection-valid");
      }
    });

    it("P(a)とP(b)は置換接続可能（a→bの代入）", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(a)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(b)");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isRight(result)).toBe(true);
    });

    it("双方向: 逆方向の代入も成功する", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // P(a)→P(b) は前提→結論の方向で a→b
      // 逆にedgeを張っても成功する（backward matchingで結論→前提の方向で a→b）
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(b)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(a)");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isRight(result)).toBe(true);
    });

    it("空のformulaTextはパースエラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe(
          "SubstitutionConnectionConclusionParseError",
        );
      }
    });

    it("同一の論理式は置換接続可能（自明な代入）", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "phi -> psi");
      ws = addSubConnEdge(ws, "node-2", "node-1");
      const result = validateSubstitutionConnectionApplication(ws, "node-2");
      // 同一なので forward = size 0 map（trivial）だが findTermVariableSubstitution は成功する
      expect(Either.isRight(result)).toBe(true);
    });
  });

  describe("computeSubstitutionConnectionCompatibleNodeIds", () => {
    it("項変数代入関係のノードIDを返す", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(a) -> P(a)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(b) -> P(b)");
      ws = addNode(ws, "axiom", "", { x: 200, y: 0 }, "chi -> omega");
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        ws.nodes,
        "node-1",
        ws.inferenceEdges,
      );
      expect(compatible.has("node-2")).toBe(true);
      expect(compatible.has("node-3")).toBe(false);
    });

    it("自分自身は含まない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "phi");
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        ws.nodes,
        "node-1",
        ws.inferenceEdges,
      );
      expect(compatible.has("node-1")).toBe(false);
    });

    it("存在しないノードIDでは空セット", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        ws.nodes,
        "nonexistent",
        ws.inferenceEdges,
      );
      expect(compatible.size).toBe(0);
    });

    it("パースできないノードは除外", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(a) -> P(a)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "invalid!!!");
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        ws.nodes,
        "node-1",
        ws.inferenceEdges,
      );
      expect(compatible.size).toBe(0);
    });

    it("パースできないソースノードは空セット", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "invalid!!!");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(a) -> P(a)");
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        ws.nodes,
        "node-1",
        ws.inferenceEdges,
      );
      expect(compatible.size).toBe(0);
    });

    it("一方向のみサイクルの場合は許可される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(a) -> P(a)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(b) -> P(b)");
      // node-1 → node-2 のエッジが既にある
      const existingEdge: InferenceEdge = {
        _tag: "substitution-connection",
        premiseNodeId: "node-1",
        conclusionNodeId: "node-2",
        conclusionText: "P(b) -> P(b)",
      };
      const wsWithEdge = {
        ...ws,
        inferenceEdges: [...ws.inferenceEdges, existingEdge],
      };
      // node-2→node-1方向はサイクル（node-1→node-2が既にある）
      // node-1→node-2方向はサイクルでない（node-2→node-1のパスがない）
      // 一方向はOKなのでcompatibleに含まれる
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        wsWithEdge.nodes,
        "node-1",
        wsWithEdge.inferenceEdges,
      );
      expect(compatible.has("node-2")).toBe(true);
    });

    it("双方向ともサイクルを作る場合は除外", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(a) -> P(a)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(b) -> P(b)");
      // node-1 → node-2 と node-2 → node-1 の双方向エッジ
      const edge1: InferenceEdge = {
        _tag: "substitution-connection",
        premiseNodeId: "node-1",
        conclusionNodeId: "node-2",
        conclusionText: "P(b) -> P(b)",
      };
      const edge2: InferenceEdge = {
        _tag: "substitution-connection",
        premiseNodeId: "node-2",
        conclusionNodeId: "node-1",
        conclusionText: "P(a) -> P(a)",
      };
      const wsWithEdges = {
        ...ws,
        inferenceEdges: [...ws.inferenceEdges, edge1, edge2],
      };
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        wsWithEdges.nodes,
        "node-1",
        wsWithEdges.inferenceEdges,
      );
      // 双方向にパスがあるので、どちらの向きでもサイクル → 除外
      expect(compatible.has("node-2")).toBe(false);
    });

    it("ダイヤモンドDAGでBFS visited分岐を通過", () => {
      // node-1: P(a) → P(a)（ソース）
      // node-2: P(b) → P(b)（ターゲット候補 — node-1と項変数代入関係あり）
      // node-3, node-4: 中間ノード
      // node-5: 合流ノード
      // エッジ: node-2→node-3, node-2→node-4, node-3→node-5, node-4→node-5（ダイヤモンド）
      // BFSでnode-5に2つのパスから到達 → visited.has(node-5) → continue を通過
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "P(a) -> P(a)");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "P(b) -> P(b)");
      ws = addNode(ws, "axiom", "", { x: 200, y: 0 }, "P(c) -> P(c)");
      ws = addNode(ws, "axiom", "", { x: 300, y: 0 }, "P(d) -> P(d)");
      ws = addNode(ws, "axiom", "", { x: 400, y: 0 }, "P(e) -> P(e)");
      // ダイヤモンド: node-2→node-3, node-2→node-4, node-3→node-5, node-4→node-5
      const diamondEdges: readonly InferenceEdge[] = [
        {
          _tag: "substitution-connection",
          premiseNodeId: "node-2",
          conclusionNodeId: "node-3",
          conclusionText: "P(c) -> P(c)",
        },
        {
          _tag: "substitution-connection",
          premiseNodeId: "node-2",
          conclusionNodeId: "node-4",
          conclusionText: "P(d) -> P(d)",
        },
        {
          _tag: "substitution-connection",
          premiseNodeId: "node-3",
          conclusionNodeId: "node-5",
          conclusionText: "P(e) -> P(e)",
        },
        {
          _tag: "substitution-connection",
          premiseNodeId: "node-4",
          conclusionNodeId: "node-5",
          conclusionText: "P(e) -> P(e)",
        },
      ];
      const wsWithEdges = {
        ...ws,
        inferenceEdges: [...ws.inferenceEdges, ...diamondEdges],
      };
      const compatible = computeSubstitutionConnectionCompatibleNodeIds(
        wsWithEdges.nodes,
        "node-1",
        wsWithEdges.inferenceEdges,
      );
      // node-1→node-2方向でサイクルなし（node-2のBFSからnode-1に到達しない）
      expect(compatible.has("node-2")).toBe(true);
    });
  });

  describe("getSubstitutionConnectionErrorMessage", () => {
    it("各エラー型に対してメッセージを返す", () => {
      expect(
        getSubstitutionConnectionErrorMessage(
          new SubstitutionConnectionPremiseMissing({}),
        ),
      ).toBe("Connect a premise to apply substitution connection");
      expect(
        getSubstitutionConnectionErrorMessage(
          new SubstitutionConnectionPremiseParseError({ nodeId: "n1" }),
        ),
      ).toBe("Premise has invalid formula");
      expect(
        getSubstitutionConnectionErrorMessage(
          new SubstitutionConnectionConclusionParseError({ nodeId: "n1" }),
        ),
      ).toBe("Conclusion has invalid formula");
      expect(
        getSubstitutionConnectionErrorMessage(
          new SubstitutionConnectionNotRelated({}),
        ),
      ).toBe("Formulas are not related by term-variable substitution");
    });
  });
});
