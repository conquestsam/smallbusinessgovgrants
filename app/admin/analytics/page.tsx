// NEW FILE: Admin analytics dashboard
'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { Container, Title, Card, Grid, Text, Group, Progress, Table, Select } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconTrendingUp, IconUsers, IconCurrencyDollar, IconFileText } from '@tabler/icons-react';

const AdminAnalyticsPage = observer(() => {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, authStore.isAdmin, router]);

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  // Mock data for charts
  const applicationTrends = [
    { month: 'Jan', applications: 45, approved: 32, rejected: 8 },
    { month: 'Feb', applications: 52, approved: 38, rejected: 10 },
    { month: 'Mar', applications: 48, approved: 35, rejected: 9 },
    { month: 'Apr', applications: 61, approved: 44, rejected: 12 },
    { month: 'May', applications: 55, approved: 40, rejected: 11 },
    { month: 'Jun', applications: 67, approved: 48, rejected: 14 },
  ];

  const fundingData = [
    { name: 'Technology', value: 35, amount: 2500000 },
    { name: 'Manufacturing', value: 25, amount: 1800000 },
    { name: 'Healthcare', value: 20, amount: 1400000 },
    { name: 'Retail', value: 12, amount: 850000 },
    { name: 'Other', value: 8, amount: 600000 },
  ];

  const COLORS = ['#005ea2', '#002e6d', '#0066cc', '#4d94ff', '#99c2ff'];

  return (
    <DashboardLayout>
      <Container size="xl">
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} c="#002e6d">
              Analytics Dashboard
            </Title>
            <Text c="dimmed" size="lg">
              Comprehensive system analytics and insights
            </Text>
          </div>
          <Select
            value={timeRange}
            onChange={(value) => setTimeRange(value || '30')}
            data={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' },
            ]}
            w={150}
          />
        </Group>

        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Group justify="apart">
                <div>
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Total Applications
                  </Text>
                  <Text fw={700} size="xl" mt="xs">
                    1,247
                  </Text>
                  <Text size="xs" c="green" mt="xs">
                    +12% from last month
                  </Text>
                </div>
                <IconFileText size={32} color="#005ea2" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Group justify="apart">
                <div>
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Active Users
                  </Text>
                  <Text fw={700} size="xl" mt="xs">
                    892
                  </Text>
                  <Text size="xs" c="green" mt="xs">
                    +8% from last month
                  </Text>
                </div>
                <IconUsers size={32} color="#005ea2" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Group justify="apart">
                <div>
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Total Disbursed
                  </Text>
                  <Text fw={700} size="xl" mt="xs">
                    $12.4M
                  </Text>
                  <Text size="xs" c="green" mt="xs">
                    +15% from last month
                  </Text>
                </div>
                <IconCurrencyDollar size={32} color="#005ea2" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Group justify="apart">
                <div>
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Success Rate
                  </Text>
                  <Text fw={700} size="xl" mt="xs">
                    78%
                  </Text>
                  <Text size="xs" c="green" mt="xs">
                    +3% from last month
                  </Text>
                </div>
                <IconTrendingUp size={32} color="#005ea2" />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Title order={3} mb="md">Application Trends</Title>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="applications" stroke="#005ea2" strokeWidth={2} />
                  <Line type="monotone" dataKey="approved" stroke="#28a745" strokeWidth={2} />
                  <Line type="monotone" dataKey="rejected" stroke="#dc3545" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card withBorder radius="md" shadow="sm" p="xl">
              <Title order={3} mb="md">Monthly Funding Distribution</Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="approved" fill="#005ea2" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Title order={3} mb="md">Funding by Industry</Title>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={fundingData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {fundingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card withBorder radius="md" shadow="sm" p="xl">
              <Title order={4} mb="md">Performance Metrics</Title>
              
              <Text size="sm" c="dimmed" mb="xs">Application Processing Time</Text>
              <Progress value={85} mb="md" color="blue" />
              
              <Text size="sm" c="dimmed" mb="xs">User Satisfaction</Text>
              <Progress value={92} mb="md" color="green" />
              
              <Text size="sm" c="dimmed" mb="xs">System Uptime</Text>
              <Progress value={99.8} mb="md" color="teal" />
              
              <Text size="sm" c="dimmed" mb="xs">Response Time</Text>
              <Progress value={78} color="orange" />
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default AdminAnalyticsPage;