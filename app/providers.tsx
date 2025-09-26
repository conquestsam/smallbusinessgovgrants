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
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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