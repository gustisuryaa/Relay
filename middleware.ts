import { withAuth } from 'next-auth/middleware';

// withAuth handles the redirect-to-/login-if-unauthenticated logic for us;
// we only need to declare which paths it should guard. The landing page
// and API auth routes are intentionally excluded via the matcher below —
// gating them would break sign-in itself.
export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ['/boards/:path*'],
};
