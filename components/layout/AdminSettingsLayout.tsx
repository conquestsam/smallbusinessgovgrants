'use client';

import { AppShell, NavLink, Stack, Title, Text, Breadcrumbs, Anchor, Card, Group, Tabs, Divider } from '@mantine/core';
import { IconSettings, IconCreditCard, IconMessage, IconMail, IconArrowLeft } from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardLayout } from './DashboardLayout';

interface AdminSettingsLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export const AdminSettingsLayout = ({ children, activeTab }: AdminSettingsLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { label: 'General Settings', icon: IconSettings, href: '/admin/settings', id: 'general' },
    { label: 'Payment Methods', icon: IconCreditCard, href: '/admin/settings/payments', id: 'payments' },
    { label: 'Contact Methods', icon: IconMessage, href: '/admin/settings/contacts', id: 'contacts' },
    { label: 'Email Templates', icon: IconMail, href: '/admin/settings/emails', id: 'emails' },
  ];

  const breadcrumbs = [
    { title: 'Admin', href: '/admin' },
    { title: 'Settings', href: '/admin/settings' },
  ];

  // Add the current page to breadcrumbs if not on main settings
  if (pathname !== '/admin/settings') {
    const currentItem = menuItems.find(item => item.href === pathname);
    if (currentItem) {
      breadcrumbs.push({ title: currentItem.label, href: currentItem.href });
    }
  }

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Breadcrumbs mb="xs">
          {breadcrumbs.map((item, index) => (
            <Anchor href={item.href} key={index} size="sm" c="dimmed">
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        <Group justify="space-between" align="flex-start">
          <Stack gap={0}>
            <Title order={1} c="#002e6d" fw={800}>
              System Configuration
            </Title>
            <Text c="dimmed">Enterprise-grade platform management and security controls.</Text>
          </Stack>
        </Group>

        <Divider mb="xl" />

        <Group align="flex-start" gap="xl" wrap="nowrap">
          {/* PERSISTENT LEFT SIDEBAR FOR SETTINGS */}
          <Stack w={280} gap="xs" visibleFrom="md">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4}>
              Sections
            </Text>
            {menuItems.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={<item.icon size={20} />}
                active={pathname === item.href}
                onClick={() => router.push(item.href)}
                styles={{
                  root: { borderRadius: 8 },
                  label: { fontWeight: pathname === item.href ? 700 : 500 }
                }}
              />
            ))}
          </Stack>

          {/* MAIN CONTENT AREA */}
          <Box style={{ flex: 1 }}>
            {children}
          </Box>
        </Group>
      </Stack>
    </DashboardLayout>
  );
};

// Help helper for Box if not imported properly from mantine
import { Box } from '@mantine/core';
