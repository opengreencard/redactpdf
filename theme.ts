'use client';

import { createTheme } from '@mantine/core';
import { themeOverrides } from './themeOverrides';

/** Shared Mantine theme for the public RedactPDF.ai application. */
export const theme = createTheme(themeOverrides);
