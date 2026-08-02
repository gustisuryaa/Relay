import { NextRequest, NextResponse } from 'next/server';
import { regenerateTaskSummary } from '@/server/actions/task.actions';

export async function POST(req: NextRequest) {
  const { taskId } = await req.json();

  if (!taskId || typeof taskId !== 'string') {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  }

  try {
    const task = await regenerateTaskSummary(taskId);
    return NextResponse.json(task);
  } catch (error) {
    // Auth/permission errors from requireBoardAccess() surface as plain
    // Error messages ('UNAUTHENTICATED' | 'FORBIDDEN' | ...) — map the
    // known ones to proper HTTP status codes instead of a generic 500.
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'UNAUTHENTICATED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
