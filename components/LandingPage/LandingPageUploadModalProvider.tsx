'use client';

import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import UploadModal from '../Upload/UploadModal';

interface LandingPageUploadModalState {
  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
}

const LandingPageUploadModalContext =
  createContext<LandingPageUploadModalState | null>(null);

/**
 * Owns the landing page's single upload modal and shares its state with the
 * separate client components that trigger or coordinate it.
 *
 * Keeping this state here instead of in LandingPageInner preserves the
 * server-compatible page composition. It also prevents each CTA from creating
 * a separate modal and lets the hero dropzone disable its fullscreen listener
 * while the modal's dropzone is active.
 */
const LandingPageUploadModalProvider: React.FunctionComponent<PropsWithChildren> =
  React.memo(function LandingPageUploadModalProvider(props: PropsWithChildren) {
    const { children } = props;
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const openUploadModal = useMemoizedCallback(() => {
      setIsUploadModalOpen(true);
    }, []);
    const closeUploadModal = useMemoizedCallback(() => {
      setIsUploadModalOpen(false);
    }, []);

    const value: LandingPageUploadModalState = useMemo(
      (): LandingPageUploadModalState => ({
        isUploadModalOpen,
        openUploadModal,
        closeUploadModal,
      }),
      [closeUploadModal, isUploadModalOpen, openUploadModal]
    );

    return (
      <LandingPageUploadModalContext.Provider value={value}>
        {children}
        <UploadModal isOpen={isUploadModalOpen} onClose={closeUploadModal} />
      </LandingPageUploadModalContext.Provider>
    );
  });

export default LandingPageUploadModalProvider;

export function useLandingPageUploadModalState(): LandingPageUploadModalState {
  const state = useContext(LandingPageUploadModalContext);
  if (!state) {
    throw new Error(
      'useLandingPageUploadModalState must be used within LandingPageUploadModalProvider'
    );
  }
  return state;
}
