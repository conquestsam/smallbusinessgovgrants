'use client';

import { observer } from 'mobx-react-lite';
import { NavLink, Stack, Text, Badge } from '@mantine/core';
import { 
  IconDashboard, 
  IconFileText, 
  IconHistory, 
  IconPlus,
  IconUser,
  IconSettings,
  IconUsers,
  IconChartBar,
  IconCreditCard,
  IconMail
} from '@tabler/icons-react';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { IconProps } from '@tabler/icons-react';

interface SidebarProps {
  onItemClick?: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<IconProps>;
  href: string;
  badge?: string;
}

const userMenuItems: MenuItem[] = [
  { label: 'Dashboard', icon: IconDashboard, href: '/dashboard' },
  { label: 'Application Status', icon: IconFileText, href: '/dashboard/applications' },
  { label: 'Create Application', icon: IconPlus, href: '/dashboard/apply' },
  { label: 'Withdrawal History', icon: IconHistory, href: '/dashboard/withdrawals' },
  { label: 'Profile', icon: IconUser, href: '/dashboard/profile' },
  { label: 'Settings', icon: IconSettings, href: '/dashboard/settings' },
];

const adminMenuItems: MenuItem[] = [
  { label: 'Admin Dashboard', icon: IconDashboard, href: '/admin' },
  { label: 'Applications', icon: IconFileText, href: '/admin/applications', badge: '12' },
  { label: 'Withdrawals', icon: IconCreditCard, href: '/admin/withdrawals', badge: '5' },
  { label: 'Users Management', icon: IconUsers, href: '/admin/users' },
  { label: 'Analytics', icon: IconChartBar, href: '/admin/analytics' },
  { label: 'System Settings', icon: IconSettings, href: '/admin/settings' },
  { label: 'Email Center', icon: IconMail, href: '/admin/emails' },
];

export const Sidebar = observer(({ onItemClick }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const menuItems = authStore.isAdmin ? adminMenuItems : userMenuItems;

  const handleItemClick = (href: string) => {
    router.push(href);
    // Close mobile sidebar when item is clicked
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <Stack gap="sm" p="sm">
      <Text 
        size="sm" 
        c="dimmed" 
        fw={700} 
        tt="uppercase" 
        mb="md" 
        ta="center"
        style={{ letterSpacing: '0.5px' }}
      >
        {authStore.isAdmin ? 'Admin Panel' : 'My Dashboard'}
      </Text>
      
      {menuItems.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={
            <Text size="md" fw={500}>
              {item.label}
            </Text>
          }
          leftSection={<item.icon size={22} stroke={1.5} />}
          rightSection={
            item.badge ? (
              <Badge size="sm" variant="filled" color="red" circle>
                {item.badge}
              </Badge>
            ) : null
          }
          active={pathname === item.href}
          onClick={(event) => {
            event.preventDefault();
            handleItemClick(item.href);
          }}
          styles={{
            root: {
              borderRadius: '12px',
              marginBottom: '8px',
              padding: '12px 16px',
              minHeight: '52px',
              transition: 'all 0.2s ease',
              '&[data-active]': {
                backgroundColor: '#002e6d',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#005ea2',
                },
              },
              '&:hover': {
                backgroundColor: '#f1f5f9',
                transform: 'translateX(4px)',
              },
            },
            label: {
              fontSize: '15px',
              fontWeight: 600,
            },
            body: {
              gap: '12px',
            },
            section: {
              marginRight: '12px',
            }
          }}
        />
      ))}
    </Stack>
  );
});