/**
 * Convert optional properties to required properties that still accept
 * undefined. This is useful when building complete Sequelize creation values.
 */
export type RequiredWithUndefined<T> = {
  [K in keyof Required<T>]: T[K];
};
