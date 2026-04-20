// NEW FILE: Admin withdrawals management page
'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Card, Table, Badge, Button, Group, Text, Modal, Textarea, Select, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SBALoader } from '@/components/ui/SBALoader';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AdminWithdrawalsPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [reviewData, setReviewData] = useState({
    status: '',
    adminNotes: '',
  });

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const response = await fetch('/api/admin/withdrawals');
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update withdrawal');
      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Withdrawal updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      close();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to update withdrawal',
        color: 'red',
      });
    },
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  const handleReview = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setReviewData({
      status: withdrawal.status,
      adminNotes: withdrawal.adminNotes || '',
    });
    open();
  };

  const handleSubmitReview = () => {
    if (!selectedWithdrawal) return;

    reviewMutation.mutate({
      withdrawalId: selectedWithdrawal.withdrawalId,
      ...reviewData,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'processing': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl">
        <Title order={1} c="#002e6d" mb="xl">
          Withdrawal Management
        </Title>

        <Card withBorder radius="md" shadow="sm">
          <ScrollArea type="always" offsetScrollbars>
            <Table miw={900}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Withdrawal ID</Table.Th>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Application</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Bank Details</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={8} py="xl">
                      <SBALoader variant="inline" message="Archiving financial dispatches..." />
                    </Table.Td>
                  </Table.Tr>
                ) : withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal: any) => (
                    <Table.Tr key={withdrawal.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{withdrawal.withdrawalId}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{withdrawal.user?.firstName} {withdrawal.user?.lastName}</Text>
                        <Text size="xs" c="dimmed">{withdrawal.user?.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{withdrawal.application?.applicationId}</Text>
                        <Text size="xs" c="dimmed">{withdrawal.application?.businessName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>${Number(withdrawal.amount).toLocaleString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{withdrawal.bankName}</Text>
                        <Text size="xs" c="dimmed">****{withdrawal.accountNumber.slice(-4)}</Text>
                        <Text size="xs" c="dimmed">{withdrawal.accountHolderName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(withdrawal.status)} variant="light">
                          {withdrawal.status.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(withdrawal.createdAt).toLocaleDateString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => handleReview(withdrawal)}
                          disabled={withdrawal.status === 'completed'}
                        >
                          {withdrawal.status === 'completed' ? 'Completed' : 'Process'}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={8} py="xl">
                      <Text ta="center" c="dimmed">No withdrawal requests found.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>

        <Modal opened={opened} onClose={close} title="Process Withdrawal" size="lg">
          {selectedWithdrawal && (
            <div>
              <Text fw={600} mb="md">
                {selectedWithdrawal.withdrawalId} - ${Number(selectedWithdrawal.amount).toLocaleString()}
              </Text>

              <Text size="sm" mb="md">
                <strong>Account Holder:</strong> {selectedWithdrawal.accountHolderName}
              </Text>

              <Text size="sm" mb="md">
                <strong>Bank:</strong> {selectedWithdrawal.bankName}
              </Text>

              <Select
                label="Status"
                value={reviewData.status}
                onChange={(value) => setReviewData({ ...reviewData, status: value || '' })}
                comboboxProps={{ withinPortal: true }}
                data={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                mb="md"
              />

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
                  Update Withdrawal
                </Button>
              </Group>
            </div>
          )}
        </Modal>
      </Container>
    </DashboardLayout>
  );
});

export default AdminWithdrawalsPage;