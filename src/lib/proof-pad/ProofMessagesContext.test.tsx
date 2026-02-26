/**
 * ProofMessagesContext のテスト。
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProofMessagesProvider, useProofMessages } from "./ProofMessagesContext";
import { defaultProofMessages, type ProofMessages } from "./proofMessages";

/** テスト用のメッセージ表示コンポーネント */
function MessageDisplay() {
  const msg = useProofMessages();
  return <span data-testid="msg">{msg.mpApply}</span>;
}

describe("ProofMessagesContext", () => {
  it("should provide default English messages without provider", () => {
    render(<MessageDisplay />);
    expect(screen.getByTestId("msg")).toHaveTextContent(
      defaultProofMessages.mpApply,
    );
  });

  it("should provide custom messages via ProofMessagesProvider", () => {
    const customMessages: ProofMessages = {
      ...defaultProofMessages,
      mpApply: "カスタムMP適用",
    };

    render(
      <ProofMessagesProvider messages={customMessages}>
        <MessageDisplay />
      </ProofMessagesProvider>,
    );

    expect(screen.getByTestId("msg")).toHaveTextContent("カスタムMP適用");
  });

  it("should override nested provider messages", () => {
    const outer: ProofMessages = {
      ...defaultProofMessages,
      mpApply: "Outer",
    };
    const inner: ProofMessages = {
      ...defaultProofMessages,
      mpApply: "Inner",
    };

    render(
      <ProofMessagesProvider messages={outer}>
        <ProofMessagesProvider messages={inner}>
          <MessageDisplay />
        </ProofMessagesProvider>
      </ProofMessagesProvider>,
    );

    expect(screen.getByTestId("msg")).toHaveTextContent("Inner");
  });
});
