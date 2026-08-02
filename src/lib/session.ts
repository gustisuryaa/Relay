import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

/**
 * Reads the current user's id from the NextAuth JWT cookie directly via
 * getToken(), instead of getServerSession(authOptions).
 *
 * Why: getServerSession() internally shims a Pages Router-style
 * req/res pair to read/rotate the session cookie. Under Next.js 16's
 * fully-async cookies()/headers() APIs, that shim silently fails inside
 * React Server Components — it returns null even for a logged-in user,
 * while the exact same cookie reads fine via middleware (which uses
 * getToken() under the hood, given a real NextRequest) and via NextAuth's
 * own /api/auth/session route handler (which has a real Request object).
 * getToken() sidesteps the broken shim entirely, so it's the reliable
 * path for Server Components and Server Actions alike.
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieMap = Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value]));

  const token = await getToken({
    req: { cookies: cookieMap, headers: {} } as unknown as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  });

  return (token?.id as string | undefined) ?? null;
}
