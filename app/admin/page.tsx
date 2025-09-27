'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { Container, Grid, Title, Text, Card, Group, Progress, Badge, Table } from '@mantine/core';
import { IconFileText, IconClock, IconCheck, IconCurrencyDollar, IconUsers, IconTrendingUp } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Add these interfaces at the top of your file
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
  }, [authStore.isAuthenticated, authStore.isAdmin, router]);

  // CHANGED: Add proper typing to useQuery hooks
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

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  // CHANGED: Calculate real statistics from database with proper typing
  const totalDisbursed = withdrawals
    .filter((w: Withdrawal) => w.status === 'completed')
    .reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0);

  const totalApproved = applications
    .filter((app: Application) => app.status === 'approved')
    .reduce((sum: number, app: Application) => sum + Number(app.approvedAmount || 0), 0);

  const stats = [
    {
      title: 'Total Applications',
      value: applications.length.toString(),
      icon: <IconFileText size={20} />,
      color: 'blue',
    },
    {
      title: 'Pending Review',
      value: applications.filter((app: Application) => app.status === 'pending').length.toString(),
      icon: <IconClock size={20} />,
      color: 'orange',
    },
    {
      title: 'Approved This Month',
      value: applications.filter((app: Application) => 
        app.status === 'approved' && 
        new Date(app.reviewedAt || '').getMonth() === new Date().getMonth()
      ).length.toString(),
      icon: <IconCheck size={20} />,
      color: 'green',
    },
    {
      title: 'Total Disbursed',
      value: `$${(totalDisbursed / 1000000).toFixed(1)}M`,
      icon: <IconCurrencyDollar size={20} />,
      color: 'teal',
    },
    {
      title: 'Active Users',
      value: users.filter((user: User) => user.isActive).length.toString(),
      icon: <IconUsers size={20} />,
      color: 'violet',
    },
    {
      title: 'Success Rate',
      value: applications.length > 0 ? 
        `${Math.round((applications.filter((app: Application) => app.status === 'approved').length / applications.length) * 100)}%` : '0%',
      icon: <IconTrendingUp size={20} />,
      color: 'indigo',
    },
  ];

  // CHANGED: Use real recent applications with user data and proper typing
  const recentApplications = applications
    .sort((a: Application, b: Application) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
              Admin Dashboard
            </Title>
            <Text c="dimmed" size="lg">
              SBA Grant Management System Overview
            </Text>
          </div>
        </Group>

        <Grid mb="xl">
          {stats.map((stat, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 4 }}>
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
              
              <Table>
                <Table.Thead>
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
                  {recentApplications.map((app: Application) => (
                    <Table.Tr key={app.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{app.applicationId}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>{app.businessName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{app.user?.firstName} {app.user?.lastName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>${Number(app.requestedAmount).toLocaleString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(app.status)} variant="light">
                          {app.status.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(app.createdAt).toLocaleDateString()}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Title order={4} mb="md">
                Monthly Progress
              </Title>
              
              <Text size="sm" c="dimmed" mb="xs">
                Applications Processed
              </Text>
              <Progress value={75} mb="md" color="blue" />
              
              <Text size="sm" c="dimmed" mb="xs">
                Funds Disbursed
              </Text>
              <Progress value={60} mb="md" color="green" />
              
              <Text size="sm" c="dimmed" mb="xs">
                User Satisfaction
              </Text>
              <Progress value={92} color="teal" />
            </Card>

            <Card withBorder radius="md" shadow="sm" p="xl">
              <Title order={4} mb="md">
                Quick Actions
              </Title>
              <Text size="sm" mb="sm">
                • Review pending applications
              </Text>
              <Text size="sm" mb="sm">
                • Process withdrawals
              </Text>
              <Text size="sm" mb="sm">
                • Send system notifications
              </Text>
              <Text size="sm">
                • Generate reports
              </Text>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default AdminDashboard;