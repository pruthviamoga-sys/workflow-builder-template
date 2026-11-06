"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type ApprovalLog = {
  nodeType: string;
  status: string;
  input?: unknown;
};

export function ApprovalActions({ log }: { log: ApprovalLog }) {
  const [busy, setBusy] = useState(false);
  const [decided, setDecided] = useState(false);
  const input = (log.input ?? {}) as { token?: string; message?: string };

  if (
    log.nodeType !== "Approval" ||
    log.status !== "running" ||
    !input.token ||
    decided
  ) {
    return null;
  }

  const decide = async (approved: boolean) => {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/approvals/${encodeURIComponent(input.token as string)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
        }
      );
      if (!response.ok) {
        throw new Error(`Approval failed (${response.status})`);
      }
      setDecided(true);
      toast.success(approved ? "Approved" : "Rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-2 space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <div className="text-sm">{input.message || "Waiting for approval"}</div>
      <div className="flex gap-2">
        <Button disabled={busy} onClick={() => decide(true)} size="sm">
          Approve
        </Button>
        <Button
          disabled={busy}
          onClick={() => decide(false)}
          size="sm"
          variant="outline"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}