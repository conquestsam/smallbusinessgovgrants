'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { Container, Title, Card, Group, Button, Badge, Text, Grid, ActionIcon, Menu } from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash, IconDots } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ApplicationsPage = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  // CHANGED: Fetch real application data from API
  const { data: applications = [] } = useQuery({
    queryKey: ['user-applications', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/applications?userId=${authStore.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });
  if (!authStore.isAuthenticated) {
    return null;
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      case 'processing':
        return 'blue';
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
              My Applications
            </Title>
            <Text c="dimmed" size="lg">
              Track and manage your grant applications
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            style={{ backgroundColor: '#005ea2' }}
            onClick={() => router.push('/dashboard/apply')}
          >
            New Application
          </Button>
        </Group>

        <Grid>
          {applications.length > 0 ? applications.map((app: any) => (
            <Grid.Col key={app.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card withBorder radius="md" shadow="sm" p="lg" h="100%">
                <Group justify="space-between" mb="md">
                  <Badge color={getStatusColor(app.status)} variant="light">
                    {app.status.toUpperCase()}
                  </Badge>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEye size={14} />}>
                        View Details
                      </Menu.Item>
                      {app.status === 'pending' && (
                        <Menu.Item leftSection={<IconEdit size={14} />}>
                          Edit Application
                        </Menu.Item>
                      )}
                      <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>

                <Text fw={600} size="lg" mb="xs">
                  {app.businessName}
                </Text>
                <Text size="sm" c="dimmed" mb="xs">
                  {app.applicationId}
                </Text>
                <Text size="sm" c="dimmed" mb="md">
                  {app.businessType}
                </Text>

                <Text size="sm" mb="xs">
                  <strong>Requested:</strong> ${Number(app.requestedAmount).toLocaleString()}
                </Text>
                {app.approvedAmount && (
                  <Text size="sm" mb="xs" c="green">
                    <strong>Approved:</strong> ${Number(app.approvedAmount).toLocaleString()}
                  </Text>
                )}

                <Text size="xs" c="dimmed" mb="md">
                  Applied: {app.createdAt.toLocaleDateString()}
                </Text>

                <Text size="sm" mb="md" lineClamp={2}>
                  {app.purpose}
                </Text>

                <Button
                  variant="light"
                  fullWidth
                  onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                >
                  View Details
                </Button>
              </Card>
            </Grid.Col>
          )) : (
            <Grid.Col span={12}>
              <Card withBorder radius="md" shadow="sm" p="xl">
                <Text c="dimmed" ta="center">
                  No applications yet. Create your first application to get started.
                </Text>
                <Group justify="center" mt="md">
                  <Button
                    onClick={() => router.push('/dashboard/apply')}
                    style={{ backgroundColor: '#005ea2' }}
                  >
                    Create Application
                  </Button>
                </Group>
              </Card>
            </Grid.Col>
          )}
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default ApplicationsPage;