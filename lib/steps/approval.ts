import "server-only";

import { logStepCompleteDb, logStepStartDb } from "../workflow-logging";
import type { StepContext } from "./step-handler";

export async function approvalWaitStep(input: {
  token: string;
  message?: string;
  _context?: StepContext;
}): Promise<{ logId: string; startTime: number }> {
  "use step";
  const context = input._context;
  if (!context?.executionId) {
    return { logId: "", startTime: Date.now() };
  }
  return await logStepStartDb({
    executionId: context.executionId,
    nodeId: context.nodeId,
    nodeName: context.nodeName,
    nodeType: "Approval",
    input: { token: input.token, message: input.message ?? "" },
  });
}

export async function approvalDoneStep(input: {
  logId: string;
  startTime: number;
  approved: boolean;
}): Promise<void> {
  "use step";
  if (!input.logId) {
    return;
  }
  await logStepCompleteDb({
    logId: input.logId,
    startTime: input.startTime,
    status: "success",
    output: { approved: input.approved },
  });
}