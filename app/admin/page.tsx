'use client';

import { observer } from 'mobx-react-lite';
import { Container, Grid, Title, Text, Card, Group, Progress, Badge, Table } from '@mantine/core';
import { IconFileText, IconClock, IconCheck, IconCurrencyDollar, IconUsers, IconTrendingUp } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AdminDashboard = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, authStore.isAdmin, router]);

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  // Mock admin data
  const stats = [
    {
      title: 'Total Applications',
      value: '247',
      change: 12.5,
      icon: <IconFileText size={20} />,
      color: 'blue',
    },
    {
      title: 'Pending Review',
      value: '23',
      icon: <IconClock size={20} />,
      color: 'orange',
    },
    {
      title: 'Approved This Month',
      value: '45',
      change: 8.2,
      icon: <IconCheck size={20} />,
      color: 'green',
    },
    {
      title: 'Total Disbursed',
      value: '$2.4M',
      change: 15.3,
      icon: <IconCurrencyDollar size={20} />,
      color: 'teal',
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: 5.7,
      icon: <IconUsers size={20} />,
      color: 'violet',
    },
    {
      title: 'Success Rate',
      value: '87%',
      change: 2.1,
      icon: <IconTrendingUp size={20} />,
      color: 'indigo',
    },
  ];

  const recentApplications = [
    {
      id: 'APP-2024-045',
      businessName: 'Green Tech Solutions',
      amount: 75000,
      status: 'pending',
      submittedAt: '2024-01-28',
      applicant: 'John Smith',
    },
    {
      id: 'APP-2024-044',
      businessName: 'Local Bakery Co',
      amount: 25000,
      status: 'approved',
      submittedAt: '2024-01-27',
      applicant: 'Sarah Johnson',
    },
    {
      id: 'APP-2024-043',
      businessName: 'Tech Startup Inc',
      amount: 100000,
      status: 'pending',
      submittedAt: '2024-01-26',
      applicant: 'Mike Davis',
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
                  {recentApplications.map((app) => (
                    <Table.Tr key={app.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{app.id}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>{app.businessName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{app.applicant}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>${app.amount.toLocaleString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(app.status)} variant="light">
                          {app.status.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(app.submittedAt).toLocaleDateString()}</Text>
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