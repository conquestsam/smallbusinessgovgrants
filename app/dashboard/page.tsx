'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Grid, Title, Text, Card, Group, Badge, Avatar,
  Stack, Divider, UnstyledButton, ThemeIcon, Table, Menu, ActionIcon, Box, Anchor,
  Paper, SimpleGrid, Progress, Tooltip,
} from '@mantine/core';
import {
  IconFileText, IconCurrencyDollar, IconChevronDown, IconCreditCard,
  IconUser, IconMail, IconPhone, IconEdit,
  IconMessageCircle, IconEye, IconChartBar, IconReceipt,
  IconArrowRight, IconBell, IconTrendingUp, IconWallet,
  IconShieldCheck, IconSparkles,
} from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SBALoader } from '@/components/ui/SBALoader';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { SiteTour } from '@/components/ui/SiteTour';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

const DashboardPage = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['user-applications', authStore.user?.id],
    queryFn: async () => {
      if (!authStore.user?.id) throw new Error('User not authenticated');
      const response = await fetch(`/api/applications?userId=${authStore.user.id}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['user-withdrawals', authStore.user?.id],
    queryFn: async () => {
      if (!authStore.user?.id) throw new Error('User not authenticated');
      const response = await fetch(`/api/withdrawals?userId=${authStore.user.id}`);
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', authStore.user?.id],
    queryFn: async () => {
      if (!authStore.user?.id) return [];
      const response = await fetch(`/api/notifications?userId=${authStore.user.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });

  if (!authStore.isAuthenticated) return null;

  const totalApproved = applications
    .filter((app: any) => app.status === 'approved')
    .reduce((sum: number, app: any) => sum + Number(app.approvedAmount || 0), 0);

  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === 'completed' || w.status === 'processed')
    .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

  const availableBalance = totalApproved - totalWithdrawn;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'green', pending: 'yellow', rejected: 'red',
      under_review: 'blue', completed: 'green', processing: 'blue',
    };
    return (
      <Badge color={colors[status] || 'gray'} variant="light" size="sm">
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const recentNotifications = (Array.isArray(notifications) ? notifications : []).slice(0, 3);

  // Quick action feature cards
  const featureCards = [
    {
      icon: <IconChartBar size={24} />,
      color: '#002e6d',
      title: 'Check Your Balance',
      desc: 'Get an up-to-date summary of your grants, including balance and payment due date.',
      href: '/dashboard/applications',
    },
    {
      icon: <IconCreditCard size={24} />,
      color: '#005ea2',
      title: 'Make Payments',
      desc: 'Make one-time payments on your grant account.',
      href: '/dashboard/funding',
    },
    {
      icon: <IconReceipt size={24} />,
      color: '#0076d6',
      title: 'Access Statements',
      desc: 'Access grant account statements and tax-related forms when you need them.',
      href: '/dashboard/withdrawals',
    },
  ];

  // Quick stats for the top stat strip
  const quickStats = [
    {
      label: 'Total Approved',
      value: `$${totalApproved.toLocaleString()}`,
      icon: <IconTrendingUp size={18} />,
      color: '#16a34a',
      bg: '#f0fdf4',
    },
    {
      label: 'Available Balance',
      value: `$${availableBalance.toLocaleString()}`,
      icon: <IconWallet size={18} />,
      color: '#005ea2',
      bg: '#e6f0ff',
    },
    {
      label: 'Applications',
      value: applications.length.toString(),
      icon: <IconFileText size={18} />,
      color: '#7c3aed',
      bg: '#f5f3ff',
    },
    {
      label: 'Withdrawals',
      value: withdrawals.length.toString(),
      icon: <IconCurrencyDollar size={18} />,
      color: '#0d9488',
      bg: '#f0fdfa',
    },
  ];

  return (
    <DashboardLayout>
      <Container size="xl" py="md">
        <SiteTour page="dashboard" />

        {/* Welcome Header */}
        <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Paper
            radius="lg" p="xl" mb="lg"
            style={{
              background: 'linear-gradient(135deg, #002e6d 0%, #005ea2 60%, #0076d6 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative circles */}
            <Box style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <Box style={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <Group justify="space-between" align="flex-start" style={{ position: 'relative', zIndex: 1 }}>
              <div>
                <Group gap="sm" mb={8}>
                  <IconSparkles size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Text size="sm" fw={500} style={{ color: 'rgba(255,255,255,0.7)' }}>Welcome back</Text>
                </Group>
                <Title order={2} c="white" fw={800} mb={4}>
                  {authStore.fullName}
                </Title>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {authStore.user?.email} · <Badge size="xs" variant="light" color="cyan">{authStore.user?.role?.toUpperCase()}</Badge>
                </Text>
              </div>
              <Group gap="md" visibleFrom="sm">
                <Group gap={4}>
                  <IconShieldCheck size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                  <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Account Secured</Text>
                </Group>
              </Group>
            </Group>
          </Paper>
        </MotionDiv>

        {/* Quick Stats Strip */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="lg">
          {quickStats.map((stat, i) => (
            <MotionDiv key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card withBorder radius="md" shadow="xs" p="md">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon size={40} radius="md" variant="light" style={{ backgroundColor: stat.bg, color: stat.color }}>
                    {stat.icon}
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">{stat.label}</Text>
                    <Text size="lg" fw={800} c="#1e293b" lh={1.2}>{stat.value}</Text>
                  </div>
                </Group>
              </Card>
            </MotionDiv>
          ))}
        </SimpleGrid>

        <Grid gutter="lg">
          {/* ── LEFT COLUMN: Profile Sidebar ── */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card withBorder radius="md" shadow="sm" p={0}>
                {/* Profile Header */}
                <Box bg="#002e6d" p="lg" style={{ borderRadius: '8px 8px 0 0' }}>
                  <Stack align="center" gap="sm">
                    <Avatar size={80} radius={40} color="white" variant="filled">
                      {authStore.user?.firstName?.[0]}{authStore.user?.lastName?.[0]}
                    </Avatar>
                    <Text fw={700} c="white" ta="center">
                      {authStore.fullName}
                    </Text>
                    <Badge color="cyan" variant="light" size="xs">
                      {authStore.user?.role?.toUpperCase()}
                    </Badge>
                  </Stack>
                </Box>

                {/* Profile Info Block */}
                <Stack p="md" gap={0}>
                  <Group justify="space-between" mb="sm">
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Contact Information</Text>
                    <Anchor component={Link} href="/dashboard/profile" size="xs" c="#005ea2">
                      <Group gap={4}>
                        <IconEdit size={12} />
                        Edit
                      </Group>
                    </Anchor>
                  </Group>

                  <Divider mb="sm" />

                  {[
                    { icon: <IconMail size={14} />, label: 'Email', value: authStore.user?.email },
                    { icon: <IconPhone size={14} />, label: 'Phone', value: authStore.user?.phone || '—' },
                  ].map((item, i) => (
                    <Group key={i} gap="sm" py={8} style={{ borderBottom: '1px solid #f1f3f5' }}>
                      <ThemeIcon size={24} variant="light" color="gray" radius="sm">
                        {item.icon}
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text size="xs" c="dimmed">{item.label}</Text>
                        <Text size="sm" fw={500} lineClamp={1}>{item.value}</Text>
                      </div>
                    </Group>
                  ))}
                </Stack>
              </Card>
            </MotionDiv>
          </Grid.Col>

          {/* ── CENTER COLUMN: Messages + Grants Table ── */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              {/* Messages / Notifications Section */}
              <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card withBorder radius="md" shadow="sm">
                  <Group justify="space-between" mb="md">
                    <Group gap="sm">
                      <Title order={4} c="#002e6d">Messages</Title>
                      {recentNotifications.length > 0 && (
                        <Badge circle color="red" size="lg" className="badge-pulse">{recentNotifications.length}</Badge>
                      )}
                    </Group>
                    <Anchor component={Link} href="/dashboard/applications" size="sm" c="#005ea2">
                      View All Messages
                    </Anchor>
                  </Group>

                  <Divider mb="md" />

                  {recentNotifications.length > 0 ? recentNotifications.map((notif: any) => (
                    <UnstyledButton key={notif.id} w="100%" py="sm" px="xs" style={{ borderBottom: '1px solid #f1f3f5' }}>
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon size={32} variant="light" color="blue" radius="md">
                          <IconBell size={16} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={600} lineClamp={1}>{notif.title}</Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>{notif.message}</Text>
                        </div>
                      </Group>
                    </UnstyledButton>
                  )) : (
                    <Group gap="sm" py="md">
                      <ThemeIcon size={32} variant="light" color="blue" radius="md">
                        <IconMessageCircle size={16} />
                      </ThemeIcon>
                      <div>
                        <Text size="sm" fw={600}>Welcome to MySBA Grant Portal</Text>
                        <Text size="xs" c="dimmed">Your notifications will appear here.</Text>
                      </div>
                    </Group>
                  )}
                </Card>
              </MotionDiv>

              {/* Grants / Applications Table */}
              <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card withBorder radius="md" shadow="sm" p={0}>
                  <Group justify="space-between" p="md">
                    <Group gap="sm">
                      <Title order={4} c="#002e6d">Grants</Title>
                      <Badge circle color="blue" size="lg">{applications.length}</Badge>
                    </Group>
                    <Anchor component={Link} href="/dashboard/applications" size="sm" c="#005ea2">
                      View All
                    </Anchor>
                  </Group>

                  <Divider />

                  {appsLoading ? (
                    <SBALoader variant="inline" message="Loading your applications..." />
                  ) : applications.length > 0 ? (
                    <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
                      <Table.Thead bg="#f8fafc">
                        <Table.Tr>
                          <Table.Th>Grant Type</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                          <Table.Th w={80}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {applications.map((app: any) => (
                          <Table.Tr key={app.id}>
                            <Table.Td>
                              <div>
                                <Text size="sm" fw={600} c="#005ea2">{app.purpose || 'SBA Grant'}</Text>
                                <Text size="xs" c="dimmed">{app.applicationId}</Text>
                              </div>
                            </Table.Td>
                            <Table.Td>{getStatusBadge(app.status)}</Table.Td>
                            <Table.Td style={{ textAlign: 'right' }}>
                              <Text size="sm" fw={600}>
                                ${Number(app.approvedAmount || app.requestedAmount || 0).toLocaleString()}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Menu shadow="md" position="bottom-end">
                                <Menu.Target>
                                  <ActionIcon variant="light" color="primary" radius="xl" size="sm">
                                    <IconChevronDown size={14} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item leftSection={<IconEye size={14} />} onClick={() => router.push('/dashboard/applications')}>
                                    View Details
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  ) : (
                    <Stack align="center" py="xl" px="md" gap="sm">
                      <ThemeIcon size={48} variant="light" color="gray" radius="xl">
                        <IconFileText size={24} />
                      </ThemeIcon>
                      <Text c="dimmed" ta="center" size="sm">
                        No grant applications yet. Create your first application to get started.
                      </Text>
                    </Stack>
                  )}
                </Card>
              </MotionDiv>
            </Stack>
          </Grid.Col>

          {/* ── RIGHT COLUMN: How MySBA can work for you + Balance ── */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card withBorder radius="md" shadow="sm" p="xl">
                <Title order={4} c="#002e6d" mb="lg">How MySBA can work for you</Title>

                <Stack gap="md">
                  {featureCards.map((card, i) => (
                    <UnstyledButton
                      key={i}
                      component={Link}
                      href={card.href}
                      className="feature-card-hover"
                      p="sm"
                      style={{ display: 'block', borderRadius: 8 }}
                    >
                      <Group gap="md" wrap="nowrap" align="flex-start">
                        <ThemeIcon size={44} radius="md" variant="light" color="blue" style={{ flexShrink: 0 }}>
                          {card.icon}
                        </ThemeIcon>
                        <div>
                          <Text fw={700} size="sm" c="#002e6d" mb={4}>{card.title}</Text>
                          <Text size="xs" c="dimmed" lh={1.5}>{card.desc}</Text>
                        </div>
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              </Card>
            </MotionDiv>

            {/* Balance Summary Card */}
            <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card
                withBorder radius="md" shadow="sm" p="xl" mt="lg"
                className="stats-card-gradient"
                style={{
                  background: 'linear-gradient(135deg, #002e6d 0%, #005ea2 100%)',
                  color: 'white',
                  border: 'none',
                }}
              >
                <Group justify="space-between" mb="md">
                  <Text size="xs" fw={600} tt="uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Total Approved Funding
                  </Text>
                  <ThemeIcon size={32} radius="md" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <IconCurrencyDollar size={18} color="white" />
                  </ThemeIcon>
                </Group>
                <Title order={2} c="white" mb="sm">
                  ${totalApproved.toLocaleString()}
                </Title>
                <Divider my="sm" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                <Group justify="space-between">
                  <div>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Withdrawn</Text>
                    <Text size="sm" fw={600} c="white">${totalWithdrawn.toLocaleString()}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Available</Text>
                    <Text size="sm" fw={600} c="white">${availableBalance.toLocaleString()}</Text>
                  </div>
                </Group>
                {totalApproved > 0 && (
                  <Tooltip label={`${Math.round((totalWithdrawn / totalApproved) * 100)}% utilized`}>
                    <Progress
                      value={(totalWithdrawn / totalApproved) * 100}
                      mt="md"
                      size="sm"
                      radius="xl"
                      color="cyan"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    />
                  </Tooltip>
                )}
                <Text size="xs" mt="sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Across {applications.filter((a: any) => a.status === 'approved').length} approved application(s)
                </Text>
              </Card>
            </MotionDiv>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default DashboardPage;