'use client';

import { observer } from 'mobx-react-lite';
import { Container, Grid, Title, Text, Card, Group, Progress, Badge } from '@mantine/core';
import { IconFileText, IconClock, IconCheck, IconCurrencyDollar } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DashboardPage = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  if (!authStore.isAuthenticated) {
    return null;
  }

  // Mock data - in real app, this would come from stores/API
  const stats = [
    {
      title: 'Total Applications',
      value: '3',
      change: 12.5,
      icon: <IconFileText size={20} />,
      color: 'blue',
    },
    {
      title: 'Pending Review',
      value: '1',
      icon: <IconClock size={20} />,
      color: 'orange',
    },
    {
      title: 'Approved',
      value: '2',
      change: 8.2,
      icon: <IconCheck size={20} />,
      color: 'green',
    },
    {
      title: 'Total Approved',
      value: '$125,000',
      change: 15.3,
      icon: <IconCurrencyDollar size={20} />,
      color: 'teal',
    },
  ];

  const recentApplications = [
    {
      id: 'APP-2024-001',
      businessName: 'Tech Innovations LLC',
      amount: 50000,
      status: 'approved',
      date: '2024-01-15',
    },
    {
      id: 'APP-2024-002',
      businessName: 'Green Energy Solutions',
      amount: 75000,
      status: 'pending',
      date: '2024-01-20',
    },
    {
      id: 'APP-2024-003',
      businessName: 'Local Restaurant Chain',
      amount: 30000,
      status: 'approved',
      date: '2024-01-25',
    },
  ];

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
              
              {recentApplications.map((app) => (
                <Card key={app.id} withBorder mb="sm" p="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{app.businessName}</Text>
                      <Text size="sm" c="dimmed">
                        {app.id} • Applied on {new Date(app.date).toLocaleDateString()}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text fw={600} size="lg">
                        ${app.amount.toLocaleString()}
                      </Text>
                      <Badge color={getStatusColor(app.status)} variant="light">
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                  </Group>
                </Card>
              ))}
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