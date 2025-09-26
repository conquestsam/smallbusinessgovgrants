'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/query-devtools';
import { useState } from 'react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

const theme = {
  colors: {
    primary: [
      '#e6f0ff',
      '#cce0ff',
      '#99c0ff',
      '#66a0ff',
      '#3380ff',
      '#005ea2',
      '#004d8a',
      '#003d72',
      '#002e5a',
      '#002e6d',
    ],
  },
  primaryColor: 'primary',
  fontFamily: 'Inter, sans-serif',
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        {children}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </MantineProvider>
    </QueryClientProvider>
  );
}