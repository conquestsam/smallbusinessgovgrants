'use client';

import { Container, Title, Text, Card, Button, Stack, Group, Center, ThemeIcon } from '@mantine/core';
import { IconLock, IconMessageCircle, IconLogout, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { notifications } from '@mantine/notifications';

export default function AccountDisabledPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
       notifications.show({ title: 'Error', message: 'Failed to logout', color: 'red' });
    }
  };

  return (
    <Container size="sm" py={120}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card shadow="xl" p={50} radius="lg" withBorder style={{ overflow: 'hidden' }}>
          <Stack align="center" gap="xl">
            <ThemeIcon size={80} radius={40} color="red" variant="light">
              <IconLock size={45} />
            </ThemeIcon>

            <Stack align="center" gap="xs">
              <Title order={1} ta="center" c="#002e6d">Account Restricted</Title>
              <Text c="dimmed" ta="center" size="lg" maxWidth={400}>
                Your account has been temporarily disabled by a system administrator.
              </Text>
            </Stack>

            <Card withBorder radius="md" p="md" bg="var(--mantine-color-red-0)" style={{ borderColor: 'var(--mantine-color-red-2)' }}>
              <Group gap="sm" wrap="nowrap">
                <IconAlertCircle size={24} color="var(--mantine-color-red-6)" />
                <Text size="sm" c="red.9">
                  Reason: This action is taken to ensure platform security and adherence to our Terms of Service.
                </Text>
              </Group>
            </Card>

            <Stack gap="sm" w="100%">
              <Button 
                variant="filled" 
                color="blue" 
                size="lg" 
                fullWidth 
                leftSection={<IconMessageCircle size={20} />}
                onClick={() => router.push('/support')}
              >
                Appeal or Contact Support
              </Button>
              
              <Button 
                variant="subtle" 
                color="gray" 
                size="lg" 
                fullWidth 
                leftSection={<IconLogout size={20} />}
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </Stack>

            <Text size="xs" c="dimmed" ta="center">
              SmallBusiness Administration &copy; {new Date().getFullYear()} Platform Security
            </Text>
          </Stack>
        </Card>
      </motion.div>
    </Container>
  );
}
