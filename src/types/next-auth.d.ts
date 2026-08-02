import { DefaultSession } from 'next-auth';

// next-auth's built-in Session type doesn't know about our custom `id`
// field by default — this module augmentation extends it project-wide so
// `session.user.id` type-checks everywhere instead of needing `as any`.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
