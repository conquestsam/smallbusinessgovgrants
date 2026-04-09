'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container, Title, Card, Table, Button, Group, Text, Stack,
  Badge, Paper, ThemeIcon, Modal, Textarea, Select, Alert,
  ActionIcon, Tooltip, Box, Image, Divider, ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  IconCheck, IconX, IconEye, IconClock, IconCurrencyDollar,
  IconShieldCheck, IconAlertCircle, IconReceipt, IconFilter,
  IconRefresh, IconExternalLink,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { SBALoader } from '@/components/ui/SBALoader';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

const AdminDepositsPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [actionModalOpened, { open: openActionModal, close: closeActionModal }] = useDisclosure(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
  }, [router]);

  // [WHY] Fetch all deposits for admin view — uses admin endpoint that returns deposits with user info
  const { data: deposits = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-deposits', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const response = await fetch(`/api/admin/deposits?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch deposits');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  // [WHY] Mutation for approving/rejecting a deposit
  const actionMutation = useMutation({
    mutationFn: async ({ depositId, action, adminNotes }: { depositId: string; action: string; adminNotes: string }) => {
      const response = await fetch('/api/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId,
          action,
          adminId: authStore.user?.id,
          adminNotes,
        }),
      });
      if (!response.ok) throw new Error('Failed to update deposit');
      return response.json();
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Deposit Updated',
        message: data.message || 'Deposit status updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      closeActionModal();
      setAdminNotes('');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update deposit',
        color: 'red',
      });
    },
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'yellow';
      case 'receipt_uploaded': return 'blue';
      case 'expired': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <IconCheck size={14} />;
      case 'rejected': return <IconX size={14} />;
      case 'pending': return <IconClock size={14} />;
      case 'receipt_uploaded': return <IconReceipt size={14} />;
      default: return <IconAlertCircle size={14} />;
    }
  };

  const pendingCount = deposits.filter((d: any) => d.status === 'pending' || d.status === 'receipt_uploaded').length;

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Paper
              radius="lg" p="xl"
              style={{
                background: 'linear-gradient(135deg, #002e6d 0%, #005ea2 60%, #0076d6 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }}>
                <div>
                  <Group gap="sm" mb={4}>
                    <IconShieldCheck size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
                    <Text size="sm" fw={500} style={{ color: 'rgba(255,255,255,0.7)' }}>Financial Operations</Text>
                  </Group>
                  <Title order={2} c="white" fw={800}>Deposit Management</Title>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Review and manage all user deposit submissions</Text>
                </div>
                {pendingCount > 0 && (
                  <Paper p="md" radius="md" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                    <Group gap={6}>
                      <IconAlertCircle size={16} color="#fbbf24" />
                      <Text size="sm" c="white" fw={600}>{pendingCount} pending review</Text>
                    </Group>
                  </Paper>
                )}
              </Group>
            </Paper>
          </MotionDiv>

          {/* Filters */}
          <Group justify="space-between">
            <Group gap="sm">
              <Select
                placeholder="Filter by status"
                leftSection={<IconFilter size={16} />}
                data={[
                  { value: 'all', label: 'All Deposits' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'receipt_uploaded', label: 'Receipt Uploaded' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'expired', label: 'Expired' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 200 }}
              />
              <Badge size="lg" variant="light" color="blue">{deposits.length} deposits</Badge>
            </Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => refetch()}
              style={{ color: '#005ea2', borderColor: '#005ea2' }}
            >
              Refresh
            </Button>
          </Group>

          {/* Deposits Table */}
          {isLoading ? (
            <SBALoader message="Loading deposits..." />
          ) : deposits.length === 0 ? (
            <Paper withBorder radius="lg" p="xl" ta="center">
              <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                <IconCurrencyDollar size={30} />
              </ThemeIcon>
              <Title order={3} c="dimmed" mb="xs">No Deposits Found</Title>
              <Text size="sm" c="dimmed">No deposits match the current filter criteria.</Text>
            </Paper>
          ) : (
            <Card withBorder radius="md" shadow="sm" p={0}>
              <ScrollArea>
                <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover striped>
                  <Table.Thead style={{ background: '#f8fafc' }}>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Method</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Receipt</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th style={{ width: 180 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {deposits.map((deposit: any) => (
                      <Table.Tr key={deposit.id}>
                        <Table.Td>
                          <div>
                            <Text fw={600} size="sm">{deposit.userName || deposit.userEmail || 'Unknown'}</Text>
                            <Text size="xs" c="dimmed">{deposit.userEmail}</Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={700} size="sm" c="green.8">
                            ${Number(deposit.amount).toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="blue" size="sm" tt="uppercase">
                            {deposit.paymentMethod}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor(deposit.status)}
                            variant="light"
                            leftSection={getStatusIcon(deposit.status)}
                          >
                            {deposit.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {deposit.receiptUrl ? (
                            <Tooltip label="View receipt" withArrow>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                component="a"
                                href={deposit.receiptUrl}
                                target="_blank"
                                style={{ backgroundColor: 'rgba(0, 94, 162, 0.1)' }}
                              >
                                <IconExternalLink size={16} />
                              </ActionIcon>
                            </Tooltip>
                          ) : (
                            <Text size="xs" c="dimmed">None</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {new Date(deposit.createdAt).toLocaleDateString()}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {new Date(deposit.createdAt).toLocaleTimeString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="View Details" withArrow>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => { setSelectedDeposit(deposit); openDetailModal(); }}
                                style={{ backgroundColor: 'rgba(0, 94, 162, 0.1)' }}
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            {(deposit.status === 'pending' || deposit.status === 'receipt_uploaded') && (
                              <>
                                <Tooltip label="Approve" withArrow>
                                  <ActionIcon
                                    variant="filled"
                                    color="green"
                                    onClick={() => {
                                      setSelectedDeposit(deposit);
                                      setActionType('approve');
                                      setAdminNotes('');
                                      openActionModal();
                                    }}
                                    style={{ backgroundColor: '#16a34a' }}
                                  >
                                    <IconCheck size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Reject" withArrow>
                                  <ActionIcon
                                    variant="filled"
                                    color="red"
                                    onClick={() => {
                                      setSelectedDeposit(deposit);
                                      setActionType('reject');
                                      setAdminNotes('');
                                      openActionModal();
                                    }}
                                    style={{ backgroundColor: '#dc2626' }}
                                  >
                                    <IconX size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card>
          )}
        </Stack>
      </Container>

      {/* Deposit Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title="Deposit Details"
        centered
        radius="lg"
        size="lg"
        padding="xl"
      >
        {selectedDeposit && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={700} size="lg">Deposit #{selectedDeposit.id?.slice(0, 8)}</Text>
              <Badge color={getStatusColor(selectedDeposit.status)} size="lg" variant="light">
                {selectedDeposit.status?.replace('_', ' ').toUpperCase()}
              </Badge>
            </Group>

            <Divider />

            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">User</Text>
                  <Text size="sm" fw={600}>{selectedDeposit.userName || 'Unknown'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Email</Text>
                  <Text size="sm" fw={600}>{selectedDeposit.userEmail}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Amount</Text>
                  <Text size="sm" fw={700} c="green.8">${Number(selectedDeposit.amount).toLocaleString()}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Payment Method</Text>
                  <Badge variant="light" color="blue" tt="uppercase">{selectedDeposit.paymentMethod}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Submitted</Text>
                  <Text size="sm">{new Date(selectedDeposit.createdAt).toLocaleString()}</Text>
                </Group>
                {selectedDeposit.expiresAt && (
                  <Group justify="space-between">
                    <Text size="sm" fw={600} c="dimmed">Expires At</Text>
                    <Text size="sm" c={new Date(selectedDeposit.expiresAt) < new Date() ? 'red' : 'green'}>
                      {new Date(selectedDeposit.expiresAt).toLocaleString()}
                    </Text>
                  </Group>
                )}
                {selectedDeposit.processedBy && (
                  <Group justify="space-between">
                    <Text size="sm" fw={600} c="dimmed">Processed At</Text>
                    <Text size="sm">{new Date(selectedDeposit.processedAt).toLocaleString()}</Text>
                  </Group>
                )}
                {selectedDeposit.adminNotes && (
                  <div>
                    <Text size="sm" fw={600} c="dimmed" mb={4}>Admin Notes</Text>
                    <Paper withBorder p="sm" radius="sm" bg="white">
                      <Text size="sm">{selectedDeposit.adminNotes}</Text>
                    </Paper>
                  </div>
                )}
              </Stack>
            </Paper>

            {selectedDeposit.receiptUrl && (
              <div>
                <Text size="sm" fw={600} mb="xs">Receipt</Text>
                <Paper withBorder p="md" radius="md" ta="center">
                  <Image
                    src={selectedDeposit.receiptUrl}
                    alt="Deposit receipt"
                    maw={400}
                    mx="auto"
                    radius="md"
                    fallbackSrc="https://placehold.co/400x300?text=Receipt"
                  />
                  <Button
                    variant="light"
                    size="sm"
                    mt="md"
                    component="a"
                    href={selectedDeposit.receiptUrl}
                    target="_blank"
                    leftSection={<IconExternalLink size={14} />}
                    style={{ color: '#005ea2' }}
                  >
                    Open Full Size
                  </Button>
                </Paper>
              </div>
            )}

            {/* Action buttons for pending deposits */}
            {(selectedDeposit.status === 'pending' || selectedDeposit.status === 'receipt_uploaded') && (
              <Group grow mt="md">
                <Button
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => {
                    setActionType('approve');
                    setAdminNotes('');
                    closeDetailModal();
                    openActionModal();
                  }}
                  style={{ backgroundColor: '#16a34a' }}
                >
                  Approve Deposit
                </Button>
                <Button
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={() => {
                    setActionType('reject');
                    setAdminNotes('');
                    closeDetailModal();
                    openActionModal();
                  }}
                  style={{ backgroundColor: '#dc2626' }}
                >
                  Reject Deposit
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        opened={actionModalOpened}
        onClose={closeActionModal}
        title={actionType === 'approve' ? '✅ Approve Deposit' : '❌ Reject Deposit'}
        centered
        radius="lg"
        size="md"
        padding="xl"
      >
        {selectedDeposit && (
          <Stack gap="md">
            <Alert
              icon={actionType === 'approve' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
              title={actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              color={actionType === 'approve' ? 'green' : 'red'}
              variant="light"
              radius="md"
            >
              <Text size="sm">
                You are about to <strong>{actionType}</strong> a deposit of{' '}
                <strong>${Number(selectedDeposit.amount).toLocaleString()}</strong>{' '}
                via <strong>{selectedDeposit.paymentMethod?.toUpperCase()}</strong>{' '}
                from <strong>{selectedDeposit.userName || selectedDeposit.userEmail}</strong>.
              </Text>
            </Alert>

            <Textarea
              label="Admin Notes (optional)"
              placeholder={actionType === 'approve' ? 'Payment verified via bank statement...' : 'Reason for rejection...'}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.currentTarget.value)}
              minRows={3}
            />

            <Group grow mt="md">
              <Button
                variant="light"
                color="gray"
                onClick={closeActionModal}
              >
                Cancel
              </Button>
              <Button
                color={actionType === 'approve' ? 'green' : 'red'}
                loading={actionMutation.isPending}
                onClick={() => {
                  actionMutation.mutate({
                    depositId: selectedDeposit.id,
                    action: actionType,
                    adminNotes,
                  });
                }}
                leftSection={actionType === 'approve' ? <IconCheck size={16} /> : <IconX size={16} />}
                style={{ backgroundColor: actionType === 'approve' ? '#16a34a' : '#dc2626' }}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'} Deposit
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </DashboardLayout>
  );
});

export default AdminDepositsPage;
