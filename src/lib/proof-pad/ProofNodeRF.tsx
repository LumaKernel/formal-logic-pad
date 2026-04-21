/**
 * React Flow カスタムノードコンポーネント。
 *
 * NodeProps<ProofNodeData> を受け取り、Handle + EditableProofNode をレンダリングする。
 * ConnectorPort → Handle 変換は proofNodeRFLogic.ts の純粋ロジックを使用。
 *
 * 変更時は ProofNodeRF.stories.tsx, proofNodeRFLogic.ts, reactFlowAdapter.ts, index.ts も同期すること。
 */

import { memo, useCallback, useMemo } from "react";
import { Handle, type Node, type NodeProps } from "@xyflow/react";
import type { ProofNodeData } from "./reactFlowAdapter";
import { connectorPortsToHandleProps } from "./proofNodeRFLogic";
import { EditableProofNode } from "./EditableProofNode";

/**
 * ProofNodeRF に外部から注入するコールバック。
 * React Flow の nodeTypes に登録するコンポーネントは NodeProps のみ受け取るため、
 * コールバックは Context 経由で注入する。
 */
export interface ProofNodeRFCallbacks {
  readonly onFormulaTextChange: (id: string, text: string) => void;
  readonly onEditNote?: (id: string) => void;
}

/** デフォルトのコールバック（no-op）。ストーリーや静的表示で使用 */
const DEFAULT_CALLBACKS: ProofNodeRFCallbacks = {
  onFormulaTextChange: () => {},
};

/**
 * React Flow カスタムノード: 証明ノード。
 *
 * ProofNodeData から EditableProofNode を構成し、
 * ConnectorPort に対応する Handle をレンダリングする。
 */
function ProofNodeRFInner({
  data,
  id,
}: NodeProps<Node<ProofNodeData, "proofNode">>): React.JSX.Element {
  const { workspaceNode, classification, ports } = data;

  const handleProps = useMemo(() => connectorPortsToHandleProps(ports), [ports]);

  // コールバックはデフォルト（no-op）。実際のアプリケーションでは Context 経由で注入予定。
  const callbacks = DEFAULT_CALLBACKS;

  const handleFormulaTextChange = useCallback(
    (_id: string, text: string) => {
      callbacks.onFormulaTextChange(id, text);
    },
    [callbacks, id],
  );

  const handleEditNote = useCallback(
    (_id: string) => {
      callbacks.onEditNote?.(id);
    },
    [callbacks, id],
  );

  return (
    <div data-testid={`proof-node-rf-${id satisfies string}`}>
      {handleProps.map((hp) => (
        <Handle
          key={hp.id}
          id={hp.id}
          type={hp.type}
          position={hp.position}
          style={hp.style}
        />
      ))}
      <EditableProofNode
        id={id}
        kind={workspaceNode.kind}
        label={workspaceNode.label}
        formulaText={workspaceNode.formulaText}
        onFormulaTextChange={handleFormulaTextChange}
        editable={false}
        classification={classification}
        onEditNote={handleEditNote}
        testId={`proof-node-rf-${id satisfies string}-inner`}
      />
    </div>
  );
}

/** メモ化されたカスタムノード。React Flow の nodeTypes に登録する。 */
export const ProofNodeRF = memo(ProofNodeRFInner);
ProofNodeRF.displayName = "ProofNodeRF";
