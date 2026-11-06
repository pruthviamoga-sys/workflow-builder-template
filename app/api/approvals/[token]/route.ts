import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { resumeHook } from "workflow/api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workflowExecutions } from "@/lib/db/schema";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The UI sends the token URL-encoded (":" becomes "%3A"), so decode it first.
  const { token: rawToken } = await context.params;
  const token = decodeURIComponent(rawToken);
  const [executionId] = token.split(":");
  console.log("[approval] lookup", { rawToken, token, executionId });
  const execution = await db.query.workflowExecutions.findFirst({
    where: eq(workflowExecutions.id, executionId),
    with: { workflow: true },
  });
    console.log("[approval] found", Boolean(execution));


  if (!execution) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (execution.workflow.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { approved?: boolean };
  const approved = body.approved === true;

  try {
    await resumeHook(token, { approved });
  } catch {
    return NextResponse.json(
      { error: "Run is not waiting for approval" },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, approved });
}