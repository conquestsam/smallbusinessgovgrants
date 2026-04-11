'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

const theme = createTheme({
  primaryColor: 'primary',
  fontFamily: 'Inter, sans-serif',
  colors: {
    primary: [
      '#e6f0ff', // 0 - lightest
      '#cce0ff', // 1
      '#99c0ff', // 2
      '#66a0ff', // 3
      '#3380ff', // 4
      '#005ea2', // 5 - main color
      '#004d8a', // 6
      '#003d72', // 7
      '#002e5a', // 8
      '#002e6d', // 9 - darkest
    ],
  },
  components: {
    Button: {
      defaultProps: {
        color: 'primary',
      },
      styles: (theme: any) => ({
        root: {
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
      }),
    },
    ActionIcon: {
      defaultProps: {
        color: 'primary',
      },
    },
    Card: {
      styles: () => ({
        root: {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
      }),
    },
    Modal: {
      defaultProps: {
        centered: true,
        radius: 'md',
        overlayProps: { backgroundOpacity: 0.55, blur: 3 },
      },
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,      // 5 min — avoid redundant refetches
        gcTime: 10 * 60 * 1000,         // 10 min garbage collection
        refetchOnWindowFocus: false,    // Eliminate focus-triggered refetches
        retry: 1,                       // Single retry on failure
        refetchOnReconnect: true,       // Re-fetch after network recovery
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}