'use client';

import { 
  ActionIcon, Stack, Tooltip, Transition, Paper, Text, Group, 
  UnstyledButton, Box, ThemeIcon, CloseButton 
} from '@mantine/core';
import { useDisclosure, useClickOutside } from '@mantine/hooks';
import { 
  IconMessageCircle, IconBrandWhatsapp, IconBrandTelegram, 
  IconMail, IconHeadset, IconMessages 
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export const SupportWidget = () => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const clickOutsideRef = useClickOutside(() => close());

  const { data: contacts = [] } = useQuery({
    queryKey: ['public-contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts/methods');
      return response.json();
    },
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp': return <IconBrandWhatsapp size={20} />;
      case 'telegram': return <IconBrandTelegram size={20} />;
      case 'email': return <IconMail size={20} />;
      default: return <IconMessages size={20} />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp': return '#25D366';
      case 'telegram': return '#0088cc';
      case 'email': return '#EA4335';
      default: return 'blue';
    }
  };

  return (
    <Box 
        ref={clickOutsideRef}
        style={{ 
            position: 'fixed', 
            bottom: 30, 
            right: 30, 
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
        }}
    >
      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ marginBottom: 15 }}
          >
            <Paper shadow="xl" p="md" radius="lg" withBorder w={280}>
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm" c="#002e6d">Support Concierge</Text>
                <CloseButton size="sm" onClick={close} />
              </Group>
              <Text size="xs" c="dimmed" mb={15}>We typically respond in under 15 minutes.</Text>

              <Stack gap={8}>
                {contacts.map((contact: any) => (
                  <UnstyledButton
                    key={contact.id}
                    component="a"
                    href={contact.link}
                    target="_blank"
                    p="xs"
                    style={(theme) => ({
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.gray[0],
                      '&:hover': { backgroundColor: theme.colors.gray[1] },
                      width: '100%',
                      transition: 'all 0.2s'
                    })}
                  >
                    <Group gap="sm">
                      <ThemeIcon 
                        color={getPlatformColor(contact.platform)} 
                        variant="light" 
                        size={32} 
                        radius="md"
                      >
                        {getPlatformIcon(contact.platform)}
                      </ThemeIcon>
                      <div>
                        <Text size="sm" fw={600} style={{ textTransform: 'capitalize' }}>
                            {contact.platform}
                        </Text>
                        <Text size="xs" c="dimmed">Available Now</Text>
                      </div>
                    </Group>
                  </UnstyledButton>
                ))}

                {contacts.length === 0 && (
                  <Text size="xs" ta="center" py="md" c="dimmed">No channels currently online.</Text>
                )}
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Tooltip label="Need Help?" position="left" withArrow offset={15} radius="md" openDelay={500}>
            <ActionIcon 
                size={60} 
                radius={30} 
                variant="filled" 
                color="blue" 
                onClick={toggle}
                className="support-bubble"
                style={{ 
                    boxShadow: '0 8px 16px -4px rgba(0, 46, 109, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.2)' 
                }}
            >
                {opened ? <IconHeadset size={30} /> : <IconMessageCircle size={30} />}
            </ActionIcon>
        </Tooltip>
      </motion.div>

      <style jsx global>{`
        .support-bubble {
            background: linear-gradient(135deg, #005ea2 0%, #002e6d 100%) !important;
        }
      `}</style>
    </Box>
  );
};
