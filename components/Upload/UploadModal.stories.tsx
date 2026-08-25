import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import UploadModal, { UploadModalProps } from './UploadModal';

const defaultProps: UploadModalProps = {
  isOpen: true,
  onClose: () => undefined,
};

const metadata: Meta = {
  title: 'UploadModal',
  component: UploadModal,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<UploadModalProps> = (args) => <UploadModal {...args} />;

export const Open: StoryFn<UploadModalProps> = Template.bind({});
