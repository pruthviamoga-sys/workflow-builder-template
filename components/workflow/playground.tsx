"use client";

import { useAtomValue } from "jotai";
import { Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { currentWorkflowIdAtom } from "@/lib/workflow-store";
import { Button } from "../ui/button";

function parseInput(text: string): Record<string, unknown> | null {
  let value: unknown;
  try {
    value = JSON.parse(text || "{}");
  } catch {
    toast.error("Test input must be valid JSON");
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    toast.error("Test input must be a JSON object");
    return null;
  }
  return value as Record<string, unknown>;
}

export function WorkflowPlayground() {
  const workflowId = useAtomValue(currentWorkflowIdAtom);
  const [text, setText] = useState("{}");
  const [busy, setBusy] = useState(false);

  const handleRun = async () => {
    if (!workflowId) {
      toast.error("Save the workflow before running it");
      return;
    }

    const input = parseInput(text);
    if (!input) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/workflow/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!response.ok) {
        throw new Error(`Run failed (${response.status})`);
      }
      toast.success("Run started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Run failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="font-medium text-sm">Playground test input</div>
      <textarea
        className="h-28 w-full rounded-md border bg-background p-2 font-mono text-xs"
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        value={text}
      />
      <Button disabled={busy || !workflowId} onClick={handleRun} size="sm">
        <Play className="mr-2 size-4" />
        {busy ? "Starting..." : "Run with this input"}
      </Button>
    </div>
  );
}