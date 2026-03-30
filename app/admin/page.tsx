'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Grid, Title, Text, Card, Group, Progress, Badge, Table,
  Stack, Paper, Box, Anchor, ThemeIcon, SimpleGrid, Divider,
} from '@mantine/core';
import {
  IconFileText, IconClock, IconCheck, IconCurrencyDollar, IconUsers,
  IconTrendingUp, IconChartBar, IconArrowRight, IconShieldCheck,
  IconAlertCircle, IconEye,
} from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SiteTour } from '@/components/ui/SiteTour';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface Application {
  id: string;
  applicationId: string;
  businessName: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  user: User;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

const AdminDashboard = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ['admin-applications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/applications');
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const { data: withdrawals = [] } = useQuery<Withdrawal[]>({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const response = await fetch('/api/admin/withdrawals');
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const { data: usersResponse = { users: [], total: 0 } } = useQuery<{ users: User[], total: number }>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?limit=100');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const users = usersResponse.users;

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  const totalDisbursed = withdrawals
    .filter((w: Withdrawal) => w.status === 'completed')
    .reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0);

  const totalApproved = applications
    .filter((app: Application) => app.status === 'approved')
    .reduce((sum: number, app: Application) => sum + Number(app.approvedAmount || 0), 0);

  const pendingApps = applications.filter((app: Application) => app.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter((w: Withdrawal) => w.status === 'pending').length;

  const stats = [
    {
      title: 'Total Applications',
      value: applications.length.toString(),
      icon: <IconFileText size={22} color="white" />,
      color: 'blue',
    },
    {
      title: 'Pending Review',
      value: pendingApps.toString(),
      icon: <IconClock size={22} color="white" />,
      color: 'orange',
    },
    {
      title: 'Approved This Month',
      value: applications.filter((app: Application) =>
        app.status === 'approved' &&
        new Date(app.reviewedAt || '').getMonth() === new Date().getMonth()
      ).length.toString(),
      icon: <IconCheck size={22} color="white" />,
      color: 'green',
    },
    {
      title: 'Total Disbursed',
      value: totalDisbursed > 1000000
        ? `$${(totalDisbursed / 1000000).toFixed(1)}M`
        : `$${totalDisbursed.toLocaleString()}`,
      icon: <IconCurrencyDollar size={22} color="white" />,
      color: 'teal',
    },
    {
      title: 'Active Users',
      value: users.filter((user: User) => user.isActive).length.toString(),
      icon: <IconUsers size={22} color="white" />,
      color: 'violet',
    },
    {
      title: 'Success Rate',
      value: applications.length > 0 ?
        `${Math.round((applications.filter((app: Application) => app.status === 'approved').length / applications.length) * 100)}%` : '0%',
      icon: <IconTrendingUp size={22} color="white" />,
      color: 'indigo',
    },
  ];

  const recentApplications = applications
    .sort((a: Application, b: Application) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl">
        <SiteTour page="dashboard" />

        {/* Admin Header */}
        <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            radius="lg" p="xl" mb="xl"
            style={{
              background: 'linear-gradient(135deg, #002e6d 0%, #005ea2 60%, #0076d6 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }}>
              <div>
                <Group gap="sm" mb={4}>
                  <IconShieldCheck size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Text size="sm" fw={500} style={{ color: 'rgba(255,255,255,0.7)' }}>Administrator Panel</Text>
                </Group>
                <Title order={2} c="white" fw={800}>Admin Dashboard</Title>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>SBA Grant Management System Overview</Text>
              </div>
              {(pendingApps > 0 || pendingWithdrawals > 0) && (
                <Paper p="md" radius="md" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                  <Group gap="md">
                    {pendingApps > 0 && (
                      <Group gap={6}>
                        <IconAlertCircle size={16} color="#fbbf24" />
                        <Text size="sm" c="white" fw={600}>{pendingApps} pending apps</Text>
                      </Group>
                    )}
                    {pendingWithdrawals > 0 && (
                      <Group gap={6}>
                        <IconAlertCircle size={16} color="#fbbf24" />
                        <Text size="sm" c="white" fw={600}>{pendingWithdrawals} pending withdrawals</Text>
                      </Group>
                    )}
                  </Group>
                </Paper>
              )}
            </Group>
          </Paper>
        </MotionDiv>

        {/* Stats Grid */}
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="xl">
          {stats.map((stat, index) => (
            <StatsCard key={stat.title} {...stat} index={index} />
          ))}
        </SimpleGrid>

        <Grid gutter="lg">
          {/* Recent Applications Table */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card withBorder radius="md" shadow="sm" p={0}>
                <Group justify="space-between" p="xl" pb="md">
                  <Group gap="sm">
                    <Title order={3} c="#002e6d">Recent Applications</Title>
                    <Badge color="blue" variant="light" size="lg">{applications.length}</Badge>
                  </Group>
                  <Anchor component={Link} href="/admin/applications" size="sm" c="#005ea2" fw={600}>
                    <Group gap={4}>
                      View All <IconArrowRight size={14} />
                    </Group>
                  </Anchor>
                </Group>

                <Divider />

                <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
                  <Table.Thead bg="#f8fafc">
                    <Table.Tr>
                      <Table.Th>Application ID</Table.Th>
                      <Table.Th>Business</Table.Th>
                      <Table.Th>Applicant</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {recentApplications.length > 0 ? recentApplications.map((app: Application) => (
                      <Table.Tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => router.push('/admin/applications')}>
                        <Table.Td>
                          <Text fw={600} size="sm" c="#005ea2">{app.applicationId}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={600} size="sm">{app.businessName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{app.user?.firstName} {app.user?.lastName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={600} size="sm">${Number(app.requestedAmount).toLocaleString()}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(app.status)} variant="light" size="sm">
                            {app.status.toUpperCase()}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{new Date(app.createdAt).toLocaleDateString()}</Text>
                        </Table.Td>
                      </Table.Tr>
                    )) : (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Stack align="center" py="xl" gap="sm">
                            <ThemeIcon size={48} variant="light" color="gray" radius="xl">
                              <IconFileText size={24} />
                            </ThemeIcon>
                            <Text c="dimmed" ta="center">No applications yet.</Text>
                          </Stack>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Card>
            </MotionDiv>
          </Grid.Col>

          {/* Right Sidebar */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="lg">
              {/* Monthly Progress */}
              <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card withBorder radius="md" shadow="sm" p="xl">
                  <Group justify="space-between" mb="lg">
                    <Title order={4} c="#002e6d">Monthly Progress</Title>
                    <ThemeIcon size={28} variant="light" color="blue" radius="md">
                      <IconChartBar size={16} />
                    </ThemeIcon>
                  </Group>

                  <Stack gap="lg">
                    <div>
                      <Group justify="space-between" mb={6}>
                        <Text size="sm" c="dimmed">Applications Processed</Text>
                        <Text size="sm" fw={600}>75%</Text>
                      </Group>
                      <Progress value={75} color="blue" size="sm" radius="xl" />
                    </div>
                    <div>
                      <Group justify="space-between" mb={6}>
                        <Text size="sm" c="dimmed">Funds Disbursed</Text>
                        <Text size="sm" fw={600}>60%</Text>
                      </Group>
                      <Progress value={60} color="green" size="sm" radius="xl" />
                    </div>
                    <div>
                      <Group justify="space-between" mb={6}>
                        <Text size="sm" c="dimmed">User Satisfaction</Text>
                        <Text size="sm" fw={600}>92%</Text>
                      </Group>
                      <Progress value={92} color="teal" size="sm" radius="xl" />
                    </div>
                  </Stack>
                </Card>
              </MotionDiv>

              {/* Quick Actions */}
              <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <Card withBorder radius="md" shadow="sm" p="xl">
                  <Title order={4} c="#002e6d" mb="lg">Quick Actions</Title>
                  <Stack gap="sm">
                    {[
                      { label: 'Review pending applications', href: '/admin/applications', icon: <IconEye size={16} />, badge: pendingApps },
                      { label: 'Process withdrawals', href: '/admin/withdrawals', icon: <IconCurrencyDollar size={16} />, badge: pendingWithdrawals },
                      { label: 'Manage users', href: '/admin/users', icon: <IconUsers size={16} /> },
                      { label: 'System settings', href: '/admin/settings', icon: <IconChartBar size={16} /> },
                    ].map((action) => (
                      <Anchor
                        key={action.label}
                        component={Link}
                        href={action.href}
                        underline="never"
                        className="feature-card-hover"
                        p="sm"
                        style={{ display: 'block', borderRadius: 8 }}
                      >
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon size={28} variant="light" color="blue" radius="md">
                              {action.icon}
                            </ThemeIcon>
                            <Text size="sm" fw={500} c="#1e293b">{action.label}</Text>
                          </Group>
                          <Group gap={4}>
                            {action.badge && action.badge > 0 ? (
                              <Badge size="sm" color="red" variant="filled">{action.badge}</Badge>
                            ) : null}
                            <IconArrowRight size={14} color="var(--mantine-color-dimmed)" />
                          </Group>
                        </Group>
                      </Anchor>
                    ))}
                  </Stack>
                </Card>
              </MotionDiv>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default AdminDashboard;