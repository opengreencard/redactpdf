import NextAuth, { User as NextAuthUser, Session } from 'next-auth';
import { encode as defaultEncodeJWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import SequelizeAdapter from '@auth/sequelize-adapter';
import { compare } from 'bcrypt';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import db from '../db';
import config from '../config';
import { PartialInstance } from '../db/types';
import User, { UserAttributes } from '../models/User';
import SessionModel from '../models/Session';
import Account from '../models/Account';
import VerificationToken from '../models/VerificationToken';

/**
 * Set 1 day as the session expiration: we have a lot of sensitive data
 * in a user's application, so don't want any accidentally-open sessions
 */
const sessionMaxAgeMs = 86400 * 1000 * 24;

// Added based on instructions from
// https://authjs.dev/getting-started/installation#configure
const nextAuthResult = NextAuth({
  adapter: SequelizeAdapter(db, {
    models: {
      User,
      Session: SessionModel,
      Account,
      VerificationToken,
    } as any,
    // Without this `as any`, we get a Typescript error that
    // > TS2589: Type instantiation is excessively deep and possibly infinite.
  }),
  // Auth.js validates request host in production; set this so
  // local proxies/reverse hosts don't trigger UntrustedHost.
  // Reference: https://authjs.dev/reference/core#trusthost
  trustHost: true,
  session: {
    maxAge: sessionMaxAgeMs,
  },
  secret: config.auth.secret,
  providers: [
    GoogleProvider({
      clientId: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
    }),
    CredentialsProvider({
      name: 'email and password',
      credentials: {
        email: {
          label: 'Email',
          type: 'text',
          placeholder: 'email@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = (await User.findOne({
            where: { email },
            attributes: ['id', 'email', 'password'],
          })) as PartialInstance<
            UserAttributes,
            'id' | 'email' | 'password'
          > | null;
          if (!user || !user.password) return null;
          const passwordsMatch = await compare(password, user.password);

          if (passwordsMatch) {
            return { id: String(user.id), email: user.email };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user && user.id) {
        const updatedSession: Session = {
          ...session,
          user: {
            ...session.user,
            // NextAuth's public type requires a string ID, while this app's
            // database models intentionally use numeric IDs.
            id: Number(user.id) as unknown as string,
          },
        };
        return updatedSession;
      }
      return session;
    },
  },
  jwt: {
    // We need to override the default JWT encoding to make sure that
    // email/password ("Credentials") logins still get saved in the
    // database: from
    // https://github.com/nextauthjs/next-auth/discussions/4394#discussioncomment-9559072
    async encode(params) {
      if (params.token?.sub) {
        const sessionToken = randomUUID();
        await SessionModel.upsert({
          sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + (params.maxAge ?? sessionMaxAgeMs)),
        });

        return sessionToken;
      }

      return defaultEncodeJWT(params);
    },
  },
});

export const {
  handlers: authServerHandlers,
  signIn: signInOnServer,
  signOut: signOutOnServer,
} = nextAuthResult;

/**
 * Narrowed `auth()` result whose session user carries our full
 * {@link UserAttributes} (id, password, …) instead of the generic next-auth
 * user.
 */
export const getAuthState = nextAuthResult.auth as () => Promise<
  (Session & { user: UserAttributes }) | null
>;
