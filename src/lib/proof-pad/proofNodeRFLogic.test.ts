import { describe, it, expect } from "vitest";
import { Position } from "@xyflow/react";
import {
  edgeToPosition,
  edgeToHandleType,
  portPositionToStyle,
  connectorPortToHandleProps,
  connectorPortsToHandleProps,
} from "./proofNodeRFLogic";
import type { ConnectorPort } from "../infinite-canvas/connector";

describe("edgeToPosition", () => {
  it("top → Position.Top", () => {
    expect(edgeToPosition("top")).toBe(Position.Top);
  });
  it("bottom → Position.Bottom", () => {
    expect(edgeToPosition("bottom")).toBe(Position.Bottom);
  });
  it("left → Position.Left", () => {
    expect(edgeToPosition("left")).toBe(Position.Left);
  });
  it("right → Position.Right", () => {
    expect(edgeToPosition("right")).toBe(Position.Right);
  });
});

describe("edgeToHandleType", () => {
  it("top → target (入力)", () => {
    expect(edgeToHandleType("top")).toBe("target");
  });
  it("left → target (入力)", () => {
    expect(edgeToHandleType("left")).toBe("target");
  });
  it("bottom → source (出力)", () => {
    expect(edgeToHandleType("bottom")).toBe("source");
  });
  it("right → source (出力)", () => {
    expect(edgeToHandleType("right")).toBe("source");
  });
});

describe("portPositionToStyle", () => {
  it("top ポートの position 0.3 → left: 30%", () => {
    expect(portPositionToStyle("top", 0.3)).toEqual({ left: "30%" });
  });
  it("bottom ポートの position 0.5 → left: 50%", () => {
    expect(portPositionToStyle("bottom", 0.5)).toEqual({ left: "50%" });
  });
  it("left ポートの position 0.7 → top: 70%", () => {
    expect(portPositionToStyle("left", 0.7)).toEqual({ top: "70%" });
  });
  it("right ポートの position 0.5 → top: 50%", () => {
    expect(portPositionToStyle("right", 0.5)).toEqual({ top: "50%" });
  });
});

describe("connectorPortToHandleProps", () => {
  it("出力ポート (bottom, 0.5) を変換する", () => {
    const port: ConnectorPort = { id: "out", edge: "bottom", position: 0.5 };
    const result = connectorPortToHandleProps(port);

    expect(result).toEqual({
      id: "out",
      type: "source",
      position: Position.Bottom,
      style: { left: "50%" },
    });
  });

  it("入力ポート (top, 0.3) を変換する", () => {
    const port: ConnectorPort = {
      id: "premise-left",
      edge: "top",
      position: 0.3,
    };
    const result = connectorPortToHandleProps(port);

    expect(result).toEqual({
      id: "premise-left",
      type: "target",
      position: Position.Top,
      style: { left: "30%" },
    });
  });

  it("position 未指定はデフォルト 0.5", () => {
    const port: ConnectorPort = { id: "out", edge: "bottom" };
    const result = connectorPortToHandleProps(port);

    expect(result.style).toEqual({ left: "50%" });
  });
});

describe("connectorPortsToHandleProps", () => {
  it("空配列を返す（ポートなし）", () => {
    expect(connectorPortsToHandleProps([])).toEqual([]);
  });

  it("DERIVED_PORTS 相当の配列を変換する", () => {
    const ports: readonly ConnectorPort[] = [
      { id: "premise-left", edge: "top", position: 0.3 },
      { id: "premise-right", edge: "top", position: 0.7 },
      { id: "premise", edge: "top", position: 0.5 },
      { id: "out", edge: "bottom", position: 0.5 },
    ];
    const result = connectorPortsToHandleProps(ports);

    expect(result).toHaveLength(4);
    expect(result[0].type).toBe("target");
    expect(result[3].type).toBe("source");
  });
});
