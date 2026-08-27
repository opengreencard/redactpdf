import React from 'react';
import {
  Card as MantineCard,
  type CardProps as MantineCardProps,
} from '@mantine/core';

export interface CardProps extends Omit<MantineCardProps, 'shadow'> {}

/**
 * Card with the application's flat visual treatment.
 * Keeping shadow out of the public props prevents individual cards from
 * drifting into inconsistent elevation styles.
 */
const Card: React.FunctionComponent<CardProps> = React.memo(function Card(
  props: CardProps
) {
  return <MantineCard {...props} shadow="none" />;
});

export default Card;
