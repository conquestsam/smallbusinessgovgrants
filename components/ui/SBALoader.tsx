'use client';

import { Box, Text, Stack } from '@mantine/core';

interface SBALoaderProps {
  /** 'fullscreen' covers entire viewport, 'inline' fits within parent, 'overlay' covers parent with backdrop */
  variant?: 'fullscreen' | 'inline' | 'overlay';
  /** Optional contextual message displayed below the spinner */
  message?: string;
  /** Size of the logo spinner in pixels */
  size?: number;
}

/**
 * Enterprise-grade loading indicator using the official SBA logo.
 * Communicates institutional trust during all async operations.
 */
export function SBALoader({ variant = 'inline', message, size = 64 }: SBALoaderProps) {
  const spinner = (
    <Stack align="center" gap="md" py={variant === 'inline' ? 'xl' : 0}>
      <Box className="sba-loader-ring" style={{ width: size + 24, height: size + 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg"
          alt="Loading..."
          width={size}
          height={size * 0.33}
          className="sba-loader-logo"
        />
      </Box>
      {message && (
        <Text size="sm" c="dimmed" fw={500} ta="center">
          {message}
        </Text>
      )}
    </Stack>
  );

  if (variant === 'fullscreen') {
    return (
      <Box className="sba-loader-fullscreen">
        {spinner}
      </Box>
    );
  }

  if (variant === 'overlay') {
    return (
      <Box className="sba-loader-overlay">
        {spinner}
      </Box>
    );
  }

  return spinner;
}
