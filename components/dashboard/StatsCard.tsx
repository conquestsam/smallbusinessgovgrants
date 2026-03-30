'use client';

import { Card, Text, Group, ThemeIcon, Box, Stack } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
  index?: number;
}

// Gradient configs per color
const gradientMap: Record<string, string> = {
  blue: 'linear-gradient(135deg, #002e6d 0%, #005ea2 100%)',
  orange: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
  green: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
  teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
  violet: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
  indigo: 'linear-gradient(135deg, #3730a3 0%, #6366f1 100%)',
  red: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
  cyan: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)',
};

export function StatsCard({ title, value, change, icon, color = 'blue', index = 0 }: StatsCardProps) {
  const isPositive = change && change > 0;
  const gradient = gradientMap[color] || gradientMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card
        className="stats-card-gradient"
        shadow="md"
        p="xl"
        radius="md"
        style={{ background: gradient, color: 'white', border: 'none' }}
      >
        <Group justify="space-between" align="flex-start">
          <Stack gap={4} style={{ flex: 1 }}>
            <Text
              size="xs"
              fw={600}
              tt="uppercase"
              style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}
            >
              {title}
            </Text>
            <Text fw={800} size="xl" lh={1.1} style={{ fontSize: '1.75rem' }}>
              {value}
            </Text>
            {change !== undefined && change !== null && (
              <Group gap={4} mt={4}>
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: isPositive ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)',
                  }}
                >
                  {isPositive ? (
                    <IconTrendingUp size={12} color="#4ade80" />
                  ) : (
                    <IconTrendingDown size={12} color="#f87171" />
                  )}
                </Box>
                <Text size="xs" fw={600} style={{ color: isPositive ? '#bbf7d0' : '#fecaca' }}>
                  {Math.abs(change)}% {isPositive ? 'increase' : 'decrease'}
                </Text>
              </Group>
            )}
          </Stack>
          <Box
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Group>
      </Card>
    </motion.div>
  );
}