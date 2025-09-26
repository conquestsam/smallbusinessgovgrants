'use client';

import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export function SearchBar() {
  return (
    <TextInput
      placeholder="Search applications, users..."
      leftSection={<IconSearch size={18} />}
      size="md"
      w={{ base: 200, sm: 300, md: 350 }}
      styles={{
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.6)',
          },
          '&:focus': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderColor: '#005ea2',
          },
        },
      }}
      visibleFrom="sm"
    />
  );
}