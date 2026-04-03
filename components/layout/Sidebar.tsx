'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Stack, Text, Badge } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconFileText,
  IconHistory,
  IconPlus,
  IconUser,
  IconSettings,
  IconUsers,
  IconChartBar,
  IconCreditCard,
  IconMail,
  // [WHY] Added IconReceipt for the new Transaction History nav item
  IconReceipt,
} from '@tabler/icons-react';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';

// Define interface for menu items
interface MenuItem {
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: string;
}

// Add interface for Sidebar props
interface SidebarProps {
  onItemClick?: () => void;
}

const userMenuItems: MenuItem[] = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/dashboard' },
  { label: 'Application Status', icon: IconFileText, href: '/dashboard/applications' },
  { label: 'Create Application', icon: IconPlus, href: '/dashboard/apply' },
  { label: 'Funding & Deposits', icon: IconCreditCard, href: '/dashboard/funding' },
  // [WHY] New Transaction History page — unified view of all financial activity
  { label: 'Transaction History', icon: IconReceipt, href: '/dashboard/transactions' },
  { label: 'Withdrawal History', icon: IconHistory, href: '/dashboard/withdrawals' },
  { label: 'Profile', icon: IconUser, href: '/dashboard/profile' },
  { label: 'Settings', icon: IconSettings, href: '/dashboard/settings' },
];

const adminMenuItems: MenuItem[] = [
  { label: 'Admin Dashboard', icon: IconLayoutDashboard, href: '/admin' },
  { label: 'Applications', icon: IconFileText, href: '/admin/applications' },
  { label: 'Withdrawals', icon: IconCreditCard, href: '/admin/withdrawals' },
  { label: 'Users Management', icon: IconUsers, href: '/admin/users' },
  { label: 'Analytics', icon: IconChartBar, href: '/admin/analytics' },
  { label: 'System Settings', icon: IconSettings, href: '/admin/settings' },
  { label: 'Email Center', icon: IconMail, href: '/admin/emails' },
];

// CHANGED: Add real-time badge counts using React Query
export const Sidebar = observer(({ onItemClick }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // NEW: Fetch pending counts for admin badges
  const { data: pendingCounts } = useQuery({
    queryKey: ['pending-counts'],
    queryFn: async () => {
      if (!authStore.isAdmin) return { applications: 0, withdrawals: 0 };
      
      const [appsRes, withdrawalsRes] = await Promise.all([
        fetch('/api/admin/applications'),
        fetch('/api/admin/withdrawals')
      ]);
      
      const apps = await appsRes.json();
      const withdrawals = await withdrawalsRes.json();
      
      return {
        applications: apps.filter((app: any) => app.status === 'pending').length,
        withdrawals: withdrawals.filter((w: any) => w.status === 'pending').length,
      };
    },
    enabled: authStore.isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // CHANGED: Add dynamic badges to admin menu items with proper typing
  const menuItems: MenuItem[] = authStore.isAdmin 
    ? adminMenuItems.map(item => ({
        ...item,
        badge: item.href === '/admin/applications' ? pendingCounts?.applications?.toString() :
               item.href === '/admin/withdrawals' ? pendingCounts?.withdrawals?.toString() :
               undefined
      })) 
    : userMenuItems;

  const handleItemClick = (href: string) => {
    router.push(href);
    // Call the onItemClick callback if provided (for mobile menu closing)
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <Stack gap="md" mt="lg">
      <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb="md">
        {authStore.isAdmin ? 'Admin Panel' : 'My Dashboard'}
      </Text>
      
      {menuItems.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          leftSection={<item.icon size={24} />}
          rightSection={
            item.badge ? (
              <Badge size="xs" variant="filled" color="red">
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
              borderRadius: 8,
              marginBottom: 8,
              padding: '12px 16px',
              minHeight: '52px',
            },
            label: {
              fontSize: '16px',
              fontWeight: 500,
            },
            // FIXED: Use correct style properties for leftSection
            section: {
              marginRight: '12px', // Increased space between icon and text
              display: 'flex',
              alignItems: 'center',
            },
            body: {
              alignItems: 'center',
            }
          }}
        />
      ))}
    </Stack>
  );
});