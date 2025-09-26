'use client';

import { Card, Text, Group, ThemeIcon } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

export function StatsCard({ title, value, change, icon, color = 'blue' }: StatsCardProps) {
  const isPositive = change && change > 0;
  
  return (
    <Card withBorder radius="md" shadow="sm" p="xl">
      <Group justify="apart">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs">
            {title}
          </Text>
          <Text fw={700} size="xl" mt="xs">
            {value}
          </Text>
          {change && (
            <Group gap="xs" mt="xs">
              <ThemeIcon
                size="xs"
                color={isPositive ? 'teal' : 'red'}
                variant="light"
              >
                {isPositive ? (
                  <IconTrendingUp size={12} />
                ) : (
                  <IconTrendingDown size={12} />
                )}
              </ThemeIcon>
              <Text size="xs" c={isPositive ? 'teal' : 'red'}>
                {Math.abs(change)}% {isPositive ? 'increase' : 'decrease'}
              </Text>
            </Group>
          )}
        </div>
        <ThemeIcon size="lg" color={color} variant="light">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}