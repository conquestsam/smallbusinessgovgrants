'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { Container, Grid, Title, Text, Card, Group, Progress, Badge } from '@mantine/core';
import { IconFileText, IconClock, IconCheck, IconCurrencyDollar } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { authStore } from '@/lib/stores/auth.store';
import { applicationStore } from '@/lib/stores/application.store';
import { withdrawalStore } from '@/lib/stores/withdrawal.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DashboardPage = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  // CHANGED: Fetch real data from API instead of mock data
  const { data: applications = [] } = useQuery({
    queryKey: ['user-applications', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/applications?userId=${authStore.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['user-withdrawals', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/withdrawals?userId=${authStore.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });
  if (!authStore.isAuthenticated) {
    return null;
  }

  // CHANGED: Calculate real statistics from database data
  const totalApproved = applications
    .filter((app: any) => app.status === 'approved')
    .reduce((sum: number, app: any) => sum + Number(app.approvedAmount || 0), 0);

  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === 'completed')
    .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

  const stats = [
    {
      title: 'Total Applications',
      value: applications.length.toString(),
      icon: <IconFileText size={20} />,
      color: 'blue',
    },
    {
      title: 'Pending Review',
      value: applications.filter((app: any) => app.status === 'pending').length.toString(),
      icon: <IconClock size={20} />,
      color: 'orange',
    },
    {
      title: 'Approved',
      value: applications.filter((app: any) => app.status === 'approved').length.toString(),
      icon: <IconCheck size={20} />,
      color: 'green',
    },
    {
      title: 'Total Approved',
      value: `$${totalApproved.toLocaleString()}`,
      icon: <IconCurrencyDollar size={20} />,
      color: 'teal',
    },
  ];

  // CHANGED: Use real applications data
  const recentApplications = applications.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl">
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} c="#002e6d">
              Welcome back, {authStore.user?.firstName}!
            </Title>
            <Text c="dimmed" size="lg">
              Here's an overview of your grant applications
            </Text>
          </div>
        </Group>

        <Grid mb="xl">
          {stats.map((stat, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
              <StatsCard {...stat} />
            </Grid.Col>
          ))}
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Title order={3} mb="md">
                Recent Applications
              </Title>
              
              {recentApplications.length > 0 ? recentApplications.map((app: any) => (
                <Card key={app.id} withBorder mb="sm" p="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{app.businessName}</Text>
                      <Text size="sm" c="dimmed">
                        {app.applicationId} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text fw={600} size="lg">
                        ${Number(app.requestedAmount).toLocaleString()}
                      </Text>
                      <Badge color={getStatusColor(app.status)} variant="light">
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                  </Group>
                </Card>
              )) : (
                <Text c="dimmed" ta="center" py="xl">
                  No applications yet. Create your first application to get started.
                </Text>
              )}
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Title order={4} mb="md">
                Application Progress
              </Title>
              
              <Text size="sm" c="dimmed" mb="xs">
                Profile Completion
              </Text>
              <Progress value={85} mb="md" color="blue" />
              
              <Text size="sm" c="dimmed" mb="xs">
                Document Upload
              </Text>
              <Progress value={100} mb="md" color="green" />
              
              <Text size="sm" c="dimmed" mb="xs">
                Business Plan
              </Text>
              <Progress value={60} color="orange" />
            </Card>

            <Card withBorder radius="md" shadow="sm" p="xl">
              <Title order={4} mb="md">
                Quick Actions
              </Title>
              <Text size="sm" mb="sm">
                • Create new application
              </Text>
              <Text size="sm" mb="sm">
                • Upload documents
              </Text>
              <Text size="sm" mb="sm">
                • Request withdrawal
              </Text>
              <Text size="sm">
                • Contact support
              </Text>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default DashboardPage;