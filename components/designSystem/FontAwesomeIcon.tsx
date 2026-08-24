import React, { PropsWithChildren } from 'react';
import {
  FontAwesomeIcon as OrigFontAwesomeIcon,
  FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

export type { FontAwesomeIconProps };

/**
 * A FontAwesome icon, rendered using React.memo so that it doesn't re-render
 * and cause complicated rendering of SVG.
 *
 * See https://github.com/FortAwesome/react-fontawesome/issues/249: the library
 * is not memoized by default
 */
const FontAwesomeIcon: React.FunctionComponent<FontAwesomeIconProps> =
  React.memo(function FontAwesomeIcon(
    props: PropsWithChildren<FontAwesomeIconProps>
  ) {
    return <OrigFontAwesomeIcon {...props} />;
  });

export default FontAwesomeIcon;
