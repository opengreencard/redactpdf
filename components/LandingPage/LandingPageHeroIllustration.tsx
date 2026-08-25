import React from 'react';
import { Box } from '@mantine/core';

/**
 * Hero graphic of the review workspace, not a tilted labeled document.
 * The left rail + page canvas is the product UI visitors will actually use.
 */
const LandingPageHeroIllustration: React.FunctionComponent = React.memo(
  function LandingPageHeroIllustration() {
    return (
      <Box maw={440} mx="auto" aria-hidden>
        <svg viewBox="0 0 440 320" width="100%" height="auto" role="img">
          <title>Automatic redaction review workspace</title>
          <rect
            x="8"
            y="8"
            width="424"
            height="304"
            rx="12"
            fill="var(--mantine-color-gray-0)"
            stroke="var(--mantine-color-gray-3)"
            strokeWidth="1"
          />
          <rect x="8" y="8" width="424" height="40" rx="12" fill="white" />
          <rect x="8" y="32" width="424" height="16" fill="white" />
          <circle cx="28" cy="28" r="5" fill="var(--mantine-color-gray-3)" />
          <circle cx="46" cy="28" r="5" fill="var(--mantine-color-gray-3)" />
          <circle cx="64" cy="28" r="5" fill="var(--mantine-color-gray-3)" />
          <text
            x="86"
            y="32"
            fill="var(--mantine-color-gray-7)"
            fontSize="13"
            fontFamily="inherit"
          >
            Review redactions
          </text>
          <rect
            x="292"
            y="18"
            width="124"
            height="22"
            rx="11"
            fill="var(--mantine-primary-color-6)"
          />
          <text
            x="354"
            y="33"
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontFamily="inherit"
            fontWeight="600"
          >
            AI found 4 items
          </text>

          <rect x="20" y="60" width="140" height="236" rx="8" fill="white" />
          <text
            x="32"
            y="84"
            fill="var(--mantine-color-gray-6)"
            fontSize="11"
            fontFamily="inherit"
          >
            Detected
          </text>
          {detectionRows.map((row) => (
            <g key={row.label}>
              <rect
                x="28"
                y={row.y}
                width="124"
                height="36"
                rx="6"
                fill="var(--mantine-color-gray-0)"
              />
              <rect
                x="36"
                y={row.y + 12}
                width="28"
                height="12"
                rx="2"
                fill="black"
              />
              <text
                x="72"
                y={row.y + 22}
                fill="var(--mantine-color-dark-7)"
                fontSize="12"
                fontFamily="inherit"
              >
                {row.label}
              </text>
            </g>
          ))}

          <rect x="176" y="60" width="240" height="236" rx="8" fill="white" />
          <rect
            x="192"
            y="80"
            width="208"
            height="200"
            rx="4"
            fill="var(--mantine-color-gray-0)"
          />
          <rect x="208" y="96" width="120" height="8" rx="2" fill="black" />
          <rect
            x="208"
            y="114"
            width="176"
            height="6"
            rx="2"
            fill="var(--mantine-color-gray-4)"
          />
          <rect x="208" y="132" width="88" height="8" rx="2" fill="black" />
          <rect
            x="208"
            y="150"
            width="160"
            height="6"
            rx="2"
            fill="var(--mantine-color-gray-4)"
          />
          <rect x="208" y="168" width="104" height="8" rx="2" fill="black" />
          <rect
            x="208"
            y="186"
            width="176"
            height="6"
            rx="2"
            fill="var(--mantine-color-gray-4)"
          />
          <rect
            x="208"
            y="204"
            width="140"
            height="6"
            rx="2"
            fill="var(--mantine-color-gray-4)"
          />
          <rect x="208" y="222" width="72" height="8" rx="2" fill="black" />
          <rect
            x="208"
            y="240"
            width="120"
            height="6"
            rx="2"
            fill="var(--mantine-color-gray-4)"
          />
        </svg>
      </Box>
    );
  }
);

interface DetectionRow {
  label: string;
  y: number;
}

const detectionRows: DetectionRow[] = [
  { label: 'Name', y: 96 },
  { label: 'Address', y: 140 },
  { label: 'Email', y: 184 },
  { label: 'SSN', y: 228 },
];

export default LandingPageHeroIllustration;
