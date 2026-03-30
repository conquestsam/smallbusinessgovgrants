// NEW FILE: Admin applications management page
'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Card, Table, Badge, Button, Group, Text, Modal, Textarea, NumberInput, Select, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SBALoader } from '@/components/ui/SBALoader';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AdminApplicationsPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewData, setReviewData] = useState({
    status: '',
    approvedAmount: '',
    adminNotes: '',
  });

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/applications');
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update application');
      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Application updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      close();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to update application',
        color: 'red',
      });
    },
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  const handleReview = (application: any) => {
    setSelectedApplication(application);
    setReviewData({
      status: application.status,
      approvedAmount: application.approvedAmount || application.requestedAmount,
      adminNotes: application.adminNotes || '',
    });
    open();
  };

  const handleSubmitReview = () => {
    if (!selectedApplication) return;

    reviewMutation.mutate({
      applicationId: selectedApplication.applicationId,
      ...reviewData,
    });
  };

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
        <Title order={1} c="#002e6d" mb="xl">
          Application Management
        </Title>

        <Card withBorder radius="md" shadow="sm">
          <ScrollArea type="always" offsetScrollbars>
            <Table miw={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Application ID</Table.Th>
                  <Table.Th>Business</Table.Th>
                  <Table.Th>Applicant</Table.Th>
                  <Table.Th>Requested</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} py="xl">
                      <SBALoader variant="inline" message="Scanning demographic database..." />
                    </Table.Td>
                  </Table.Tr>
                ) : applications.length > 0 ? (
                  applications.map((app: any) => (
                    <Table.Tr key={app.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{app.applicationId}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>{app.businessName}</Text>
                        <Text size="xs" c="dimmed">{app.businessType}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{app.user?.firstName} {app.user?.lastName}</Text>
                        <Text size="xs" c="dimmed">{app.user?.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>${Number(app.requestedAmount).toLocaleString()}</Text>
                        {app.approvedAmount && (
                          <Text size="xs" c="green">
                            Approved: ${Number(app.approvedAmount).toLocaleString()}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(app.status)} variant="light">
                          {app.status.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(app.createdAt).toLocaleDateString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => handleReview(app)}
                        >
                          Review
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={7} py="xl">
                      <Text ta="center" c="dimmed">No applications found.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>

        <Modal opened={opened} onClose={close} title="Review Application" size="lg">
          {selectedApplication && (
            <div>
              <Text fw={600} mb="md">
                {selectedApplication.businessName} - {selectedApplication.applicationId}
              </Text>
              
              <Text size="sm" mb="md">
                <strong>Purpose:</strong> {selectedApplication.purpose}
              </Text>
              
              <Text size="sm" mb="md">
                <strong>Requested Amount:</strong> ${Number(selectedApplication.requestedAmount).toLocaleString()}
              </Text>

              <Select
                label="Status"
                value={reviewData.status}
                onChange={(value) => setReviewData({ ...reviewData, status: value || '' })}
                data={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                mb="md"
              />

              {reviewData.status === 'approved' && (
                <NumberInput
                  label="Approved Amount"
                  value={reviewData.approvedAmount}
                  onChange={(value) => setReviewData({ ...reviewData, approvedAmount: value?.toString() || '' })}
                  prefix="$"
                  thousandSeparator=","
                  mb="md"
                />
              )}

              <Textarea
                label="Admin Notes"
                value={reviewData.adminNotes}
                onChange={(e) => setReviewData({ ...reviewData, adminNotes: e.target.value })}
                minRows={3}
                mb="md"
              />

              <Group justify="flex-end">
                <Button variant="default" onClick={close}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  loading={reviewMutation.isPending}
                  style={{ backgroundColor: '#005ea2' }}
                >
                  Update Application
                </Button>
              </Group>
            </div>
          )}
        </Modal>
      </Container>
    </DashboardLayout>
  );
});

export default AdminApplicationsPage;