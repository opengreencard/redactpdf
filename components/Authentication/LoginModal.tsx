'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginModalInner, { LoginModalInnerProps } from './LoginModalInner';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import { signUpClient } from '../clientLib/api/auth';
import { EmailAndPassword } from '../../lib/auth/types';

export interface LoginModalProps extends Pick<
  LoginModalInnerProps,
  'isOpen' | 'onClose'
> {}

/**
 * Login or sign-up modal for creating a new account. Shows a list of all
 * login methods, and also handles starting OAuth, etc.
 */
const LoginModal: React.FunctionComponent<LoginModalProps> = React.memo(
  function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const router = useRouter();

    const { call: handleLogin, state: loginFormState } = useAPICall(
      useMemoizedCallback(
        async (credentials: EmailAndPassword) => {
          const result = await signIn('credentials', {
            ...credentials,
            redirect: false,
          });

          // Note: do not rely on result.ok to see if the login attempt
          // succeeded, as it will always return true, even with the wrong
          // email/password
          if (result.error) {
            throw new Error(
              'We could not find a user with the matching email and password.'
            );
          } else {
            onClose();
            router.push('/');
          }
        },
        [onClose, router]
      )
    );

    const handleGoogleClick = useMemoizedCallback(async () => {
      await signIn('google');
    }, []);

    const { call: handleSignUp, state: signUpFormState } = useAPICall(
      useMemoizedCallback(
        async (credentials: EmailAndPassword) => {
          await signUpClient(credentials);
          onClose();
          router.push('/');
        },
        [onClose, router]
      )
    );

    return (
      <LoginModalInner
        isOpen={isOpen}
        onClose={onClose}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onGoogleClick={handleGoogleClick}
        loginFormState={loginFormState}
        signUpFormState={signUpFormState}
      />
    );
  }
);

export default LoginModal;
