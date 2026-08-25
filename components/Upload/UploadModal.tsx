'use client';

import React from 'react';
import { Modal } from '@mantine/core';
import UploadButtonAndDropzone from './UploadButtonAndDropzone';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => unknown;
}

/** Modal wrapper around the same dropzone used under the landing-page hero. */
const UploadModal: React.FunctionComponent<UploadModalProps> = React.memo(
  function UploadModal(props: UploadModalProps) {
    const { isOpen, onClose } = props;

    return (
      <Modal opened={isOpen} onClose={onClose} title="Upload your PDF">
        <UploadButtonAndDropzone />
      </Modal>
    );
  }
);

export default UploadModal;
