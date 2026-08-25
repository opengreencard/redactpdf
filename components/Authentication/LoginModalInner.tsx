'use client';

import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Modal } from '@mantine/core';
import LoginForm, { LoginFormMode, LoginFormProps } from './LoginForm';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import { EmailAndPassword } from '../../lib/auth/types';

export interface LoginModalInnerProps extends Omit<
  LoginFormProps,
  'onSubmit' | 'mode' | 'onModeChange'
> {
  isOpen: boolean;
  onClose: () => unknown;
  /** Which form to show when the modal opens. */
  initialMode: LoginFormMode;
  onLogin: (credentials: EmailAndPassword) => unknown;
  onSignUp: (credentials: EmailAndPassword) => unknown;
}

/** A modal that lets users log in or sign up using one of various methods */
const LoginModalInner: React.FunctionComponent<LoginModalInnerProps> =
  React.memo(function LoginModalInner(
    props: PropsWithChildren<LoginModalInnerProps>
  ) {
    const {
      isOpen,
      onClose,
      initialMode,
      onLogin,
      onSignUp,
      ...passThroughProps
    } = props;
    const [formMode, setFormMode] = useState<LoginFormMode>(initialMode);

    useEffect(() => {
      if (isOpen) {
        setFormMode(initialMode);
      }
    }, [initialMode, isOpen]);

    const handleSubmit = useMemoizedCallback(
      (credentials: EmailAndPassword) => {
        switch (formMode) {
          case LoginFormMode.logIn:
            onLogin(credentials);
            break;

          case LoginFormMode.signUp:
            onSignUp(credentials);
            break;

          default:
            getUnreachableError(formMode);
            break;
        }
      },
      [formMode, onLogin, onSignUp]
    );

    return (
      <Modal
        opened={isOpen}
        onClose={onClose}
        title={formMode === LoginFormMode.signUp ? 'Sign up' : 'Log in'}
      >
        <LoginForm
          {...passThroughProps}
          mode={formMode}
          onModeChange={setFormMode}
          onSubmit={handleSubmit}
        />
      </Modal>
    );
  });

export default LoginModalInner;
