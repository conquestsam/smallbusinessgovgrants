'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { Container, Title, Card, Group, Button, Badge, Text, Grid, ActionIcon, Menu } from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash, IconDots } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationDetailsModal } from '@/components/modals/ApplicationDetailsModal'; // Adjust import path as needed

// Add interface for application data
interface Application {
  id: string;
  applicationId: string;
  businessName: string;
  businessType: string;
  requestedAmount: string;
  approvedAmount?: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  createdAt: string;
  updatedAt: string;
  // Add additional fields that might be needed for the modal
  taxId?: string;
  employeeCount?: string;
  industry?: string;
  useOfFunds?: string;
  documents?: any[];
}

const ApplicationsPage = observer(() => {
  const router = useRouter();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ['user-applications', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/applications?userId=${authStore.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });

  // Function to handle view details click
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setModalOpened(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setModalOpened(false);
    setSelectedApplication(null);
  };

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
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
          {applications.length > 0 ? applications.map((app: Application) => (
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
                      <Menu.Item 
                        leftSection={<IconEye size={14} />}
                        onClick={() => handleViewDetails(app)}
                      >
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
                  Applied: {formatDate(app.createdAt)}
                </Text>

                <Text size="sm" mb="md" lineClamp={2}>
                  {app.purpose}
                </Text>

                <Button
                  variant="light"
                  fullWidth
                  onClick={() => handleViewDetails(app)}
                >
                  View Details
                </Button>
              </Card>
            </Grid.Col>
          )) : (
            <Grid.Col span={12}>
              <Card withBorder radius="md" shadow="sm" p="xl">
                <Text c="dimmed" ta="center" size="lg" mb="sm">
                  No applications yet.
                </Text>
                <Text c="dimmed" ta="center" size="sm" mb="md">
                  Create your first application to get started.
                </Text>
                <Group justify="center" mt="md">
                  <Button
                    onClick={() => router.push('/dashboard/apply')}
                    style={{ backgroundColor: '#005ea2' }}
                    leftSection={<IconPlus size={16} />}
                  >
                    Create Application
                  </Button>
                </Group>
              </Card>
            </Grid.Col>
          )}
        </Grid>

        {/* Application Details Modal */}
        <ApplicationDetailsModal
          opened={modalOpened}
          onClose={handleCloseModal}
          application={selectedApplication}
        />
      </Container>
    </DashboardLayout>
  );
});

export default ApplicationsPage;