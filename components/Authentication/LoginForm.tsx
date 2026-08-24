'use client';

import React, { FormEvent, PropsWithChildren, useState } from 'react';
import { Group, Stack, Text, TextInput } from '@mantine/core';
import Button from '../designSystem/Button/Button';
import { useUpdateFromEvent } from '../../lib/hookUtilities/useUpdateFromEvent';
import { KeyboardShortcutSpecialKey } from '../designSystem/KeyboardShortcut';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { siteName } from '../../lib/config/brand';
import googleImage from './LoginForm__google.png';
import { APICallState } from '../../lib/typescript/apiCallState';
import { EmailAndPassword } from '../../lib/auth/types';

export interface LoginFormProps {
  mode: LoginFormMode;
  onModeChange: (mode: LoginFormMode) => unknown;
  /** Called when someone clicks the "Sign in with Google" button */
  onGoogleClick: () => unknown;
  /**
   * Called when someone submits the email/password form for either
   * login or sign-up
   */
  onSubmit: (value: EmailAndPassword) => unknown;
  loginFormState: APICallState<unknown> | null;
  signUpFormState: APICallState<unknown> | null;
}

export enum LoginFormMode {
  signUp = 'signUp',
  logIn = 'logIn',
}

/**
 * A LoginForm with buttons to log in using different OAuth methods and
 * email/password to sign in/sign up
 */
const LoginForm: React.FunctionComponent<LoginFormProps> = React.memo(
  function LoginForm(props: PropsWithChildren<LoginFormProps>) {
    const {
      onGoogleClick,
      onSubmit,
      mode,
      onModeChange,
      loginFormState,
      signUpFormState,
    } = props;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const formState =
      mode === LoginFormMode.logIn ? loginFormState : signUpFormState;

    const handleSubmit = useMemoizedCallback(
      (event: FormEvent) => {
        event.preventDefault();
        onSubmit({ email, password });
      },
      [email, onSubmit, password]
    );

    const handleModeToggle = useMemoizedCallback(() => {
      onModeChange(
        mode === LoginFormMode.signUp
          ? LoginFormMode.logIn
          : LoginFormMode.signUp
      );
    }, [mode, onModeChange]);

    return (
      <form onSubmit={handleSubmit}>
        <Stack>
          <Button
            keyboardShortcut={{ shiftKey: true, shortcut: 'G' }}
            onClick={onGoogleClick}
            variant="default"
            fullWidth
            leftSection={{ type: 'iconImage', src: googleImage }}
          >
            {mode === LoginFormMode.logIn
              ? 'Log in with Google'
              : 'Sign up with Google'}
          </Button>

          <Group justify="center" c="gray">
            or
          </Group>

          <TextInput
            label="Email"
            placeholder="e.g., example@email.com"
            type="email"
            value={email}
            onChange={useUpdateFromEvent(setEmail)}
          />

          <TextInput
            label="Password"
            placeholder="Min. 12 characters with number"
            type="password"
            value={password}
            onChange={useUpdateFromEvent(setPassword)}
          />

          {formState && formState.status === 'error' && (
            <Text c="red" size="sm">
              {formState.error}
            </Text>
          )}

          <Group justify="end">
            <Button
              keyboardShortcut={KeyboardShortcutSpecialKey.enter}
              type="submit"
              onClick={null}
              loading={formState?.status === 'inProgress'}
            >
              {mode === LoginFormMode.logIn ? 'Log in' : 'Sign up'}
            </Button>
          </Group>

          <Group justify="center" gap={0}>
            {mode === LoginFormMode.signUp ? (
              <>
                <Text size="sm">Already have an account?</Text>
                <Button
                  keyboardShortcut={null}
                  variant="transparent"
                  onClick={handleModeToggle}
                >
                  Log in instead
                </Button>
              </>
            ) : (
              <>
                <Text size="sm">New to {siteName}?</Text>
                <Button
                  keyboardShortcut={null}
                  variant="transparent"
                  onClick={handleModeToggle}
                >
                  Sign up instead
                </Button>
              </>
            )}
          </Group>
        </Stack>
      </form>
    );
  }
);

export default LoginForm;
