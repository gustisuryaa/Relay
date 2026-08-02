import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const parsed = createWorkspaceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name) || 'workspace';
  // Slugs must be globally unique, but two teams naming their workspace
  // "Acme" shouldn't hit a hard error — append a short random suffix on
  // collision instead of forcing the user to pick a different name.
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug,
      members: { create: { userId, role: 'OWNER' } },
    },
  });

  return NextResponse.json(workspace, { status: 201 });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: { boards: { select: { id: true, name: true } } },
  });

  return NextResponse.json(workspaces);
}
