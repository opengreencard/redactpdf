import { hash } from 'bcrypt';
import User, { UserAttributes } from '../../../../lib/models/User';
import { PartialInstance } from '../../../../lib/db/types';
import { ApplicationError } from '../../../../lib/errors/applicationError';
import { signInOnServer } from '../../../../lib/auth/nextAuth';
import { EmailAndPassword } from '../../../../lib/auth/types';

export type SignUpRequestBody = EmailAndPassword;
export type SignUpResponse = void;

/** Create a new account using email/password */
export async function signUpServer({
  email,
  password,
}: SignUpRequestBody): Promise<SignUpResponse> {
  const user = (await User.findOne({
    where: { email },
    attributes: ['id'],
  })) as PartialInstance<UserAttributes, 'id'> | null;

  if (user) {
    throw new ApplicationError(
      `There already is a user with the email ${email}: please log in instead`
    );
  }

  // 12 is the recommended bcrypt difficulty on Laravel as of 2024-08-18: see
  // https://securinglaravel.com/security-tip-increase-your-bcrypt/
  const bcryptDifficulty = 12;

  await User.create({
    email,
    password: await hash(password, bcryptDifficulty),
  });

  await signInOnServer('credentials', { email, password, redirect: false });
}
