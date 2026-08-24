import React, { PropsWithChildren } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { StaticImageData } from 'next/image';
import FontAwesomeIcon from '../FontAwesomeIcon';
import Image from '../Image';
import { getUnreachableError } from '../../../lib/typescript/getUnreachableError';

export interface ButtonLeftOrRightSectionProps {
  section: ButtonSection;
}

export type ButtonSection =
  | {
      type: 'icon';
      icon: IconDefinition;
    }
  | {
      type: 'iconImage';
      src: StaticImageData;
    };

/**
 * A left/right addon to a button; used as a part of the button
 */
const ButtonLeftOrRightSection: React.FunctionComponent<ButtonLeftOrRightSectionProps> =
  React.memo(function ButtonLeftOrRightSection(
    props: PropsWithChildren<ButtonLeftOrRightSectionProps>
  ) {
    const { section } = props;
    switch (section.type) {
      case 'icon':
        return <FontAwesomeIcon icon={section.icon} />;

      case 'iconImage':
        return <Image alt="" src={section.src} w={16} h={16} />;

      default:
        getUnreachableError(section);
        return null;
    }
  });

export default ButtonLeftOrRightSection;
