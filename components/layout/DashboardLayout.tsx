'use client';

import { observer } from 'mobx-react-lite';
import { AppShell, Group, Text, Avatar, Menu, Button, Badge, Indicator, Burger } from '@mantine/core';
import { IconBell, IconSettings, IconLogout, IconUser, IconSearch } from '@tabler/icons-react';
import { authStore } from '@/lib/stores/auth.store';
import { Sidebar } from './Sidebar';
import { SearchBar } from './SearchBar';
import Image from 'next/image';
import { useDisclosure } from '@mantine/hooks';
import { SupportWidget } from '@/components/support/SupportWidget';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = observer(({ children }: DashboardLayoutProps) => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const handleLogout = () => {
    authStore.logout();
    window.location.href = '/login';
  };

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 300,
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
      styles={{
        header: {
          backgroundColor: '#002e6d',
          borderBottom: '1px solid #e5e5e5',
        },
        navbar: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e5e5',
          padding: '1rem 0.5rem',
        },
        main: {
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="md"
              size="sm"
              color="white"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="md"
              size="sm"
              color="white"
            />
            <Image
              src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg"
              alt="SBA Logo"
              width={120}
              height={40}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </Group>

          <Group gap="md">
            <SearchBar />
            
            <Indicator inline label="3" size={16} color="red">
              <Button variant="subtle" color="white" size="sm">
                <IconBell size={20} />
              </Button>
            </Indicator>

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Group style={{ cursor: 'pointer' }} gap="sm">
                  <Avatar
                    src={authStore.user?.avatar}
                    size="md"
                    radius="xl"
                    color="blue"
                  >
                    {authStore.user?.firstName?.[0]}{authStore.user?.lastName?.[0]}
                  </Avatar>
                  <div style={{ color: 'white' }}>
                    <Text size="sm" fw={500} visibleFrom="sm">
                      {authStore.fullName}
                    </Text>
                    <Badge size="xs" variant="light" color="cyan" visibleFrom="sm">
                      {authStore.user?.role?.toUpperCase()}
                    </Badge>
                  </div>
                </Group>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={16} />}>
                  Profile
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size={16} />}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  color="red"
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar onItemClick={() => toggleMobile()} />
      </AppShell.Navbar>

      <AppShell.Main style={{ 
        minHeight: 'calc(100vh - 70px)',
        transition: 'margin-left 0.3s ease',
      }}>
        {children}
        <SupportWidget />
      </AppShell.Main>
    </AppShell>
  );
});