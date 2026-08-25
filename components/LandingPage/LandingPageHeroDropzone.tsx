'use client';

import React from 'react';
import UploadButtonAndDropzone from '../Upload/UploadButtonAndDropzone';
import { useLandingPageUploadModalState } from './LandingPageUploadModalProvider';

/**
 * Hero dropzone. Fullscreen drag is on while the upload modal is closed, and
 * off while it is open so only one Dropzone.FullScreen handles the drop.
 */
const LandingPageHeroDropzone: React.FunctionComponent = React.memo(
  function LandingPageHeroDropzone() {
    const { isUploadModalOpen } = useLandingPageUploadModalState();

    return (
      <UploadButtonAndDropzone enableFullScreenDrop={!isUploadModalOpen} />
    );
  }
);

export default LandingPageHeroDropzone;
