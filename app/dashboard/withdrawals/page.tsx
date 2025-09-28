'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { Container, Title, Card, Group, Button, Badge, Text, Grid, Table, ActionIcon, Modal } from '@mantine/core';
import { IconPlus, IconDownload, IconEye, IconMessageCircle } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const WithdrawalsPage = observer(() => {
  const router = useRouter();
  const [receiptOpened, { open: openReceipt, close: closeReceipt }] = useDisclosure(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  // Fetch real withdrawal data from API
  const { data: withdrawals = [] } = useQuery({
    queryKey: ['user-withdrawals', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/withdrawals?userId=${authStore.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      const data = await response.json();
      
      // Ensure dates are properly converted to Date objects
      return data.map((withdrawal: any) => ({
        ...withdrawal,
        createdAt: new Date(withdrawal.createdAt),
        processedAt: withdrawal.processedAt ? new Date(withdrawal.processedAt) : null
      }));
    },
    enabled: !!authStore.user?.id,
  });

  if (!authStore.isAuthenticated) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
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

  // Calculate real statistics from database data
  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === 'completed')
    .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

  const pendingAmount = withdrawals
    .filter((w: any) => w.status === 'pending')
    .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

  // Add receipt download and support contact functionality
  const handleDownloadReceipt = async (withdrawal: any) => {
    try {
      const response = await fetch(`/api/withdrawals/${withdrawal.id}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${withdrawal.withdrawalId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      // You can add a toast notification here if needed
    }
  };

  const handleViewReceipt = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    openReceipt();
  };

  const handleContactSupport = () => {
    // WhatsApp support link
    window.open('https://wa.me/1234567890?text=Hello, I need help with my withdrawal request', '_blank');
  };

  // Format date safely
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <Container size="xl">
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} c="#002e6d">
              Withdrawal History
            </Title>
            <Text c="dimmed" size="lg">
              Track your withdrawal requests and payments
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            style={{ backgroundColor: '#005ea2' }}
            onClick={() => router.push('/dashboard/withdraw')}
          >
            Request Withdrawal
          </Button>
        </Group>

        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                Total Withdrawn
              </Text>
              <Text fw={700} size="xl" mt="xs" c="green">
                ${totalWithdrawn.toLocaleString()}
              </Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                Pending Amount
              </Text>
              <Text fw={700} size="xl" mt="xs" c="orange">
                ${pendingAmount.toLocaleString()}
              </Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                Total Requests
              </Text>
              <Text fw={700} size="xl" mt="xs">
                {withdrawals.length}
              </Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                Success Rate
              </Text>
              <Text fw={700} size="xl" mt="xs" c="blue">
                {withdrawals.length > 0 ? Math.round((withdrawals.filter((w: any) => w.status === 'completed').length / withdrawals.length) * 100) : 0}%
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        <Card withBorder radius="md" shadow="sm">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Withdrawal ID</Table.Th>
                <Table.Th>Application</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Bank Account</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {withdrawals.length > 0 ? withdrawals.map((withdrawal: any) => (
                <Table.Tr key={withdrawal.id}>
                  <Table.Td>
                    <Text fw={500}>{withdrawal.withdrawalId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">Application #{withdrawal.applicationId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600}>${Number(withdrawal.amount).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {withdrawal.bankName}<br />
                      <Text c="dimmed" size="xs">****{withdrawal.accountNumber?.slice(-4)}</Text>
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(withdrawal.status)} variant="light">
                      {withdrawal.status.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {formatDate(withdrawal.processedAt || withdrawal.createdAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => handleViewReceipt(withdrawal)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      {withdrawal.status === 'completed' && (
                        <ActionIcon 
                          variant="subtle" 
                          color="green"
                          onClick={() => handleDownloadReceipt(withdrawal)}
                        >
                          <IconDownload size={16} />
                        </ActionIcon>
                      )}
                      {withdrawal.status === 'rejected' && (
                        <ActionIcon 
                          variant="subtle" 
                          color="red"
                          onClick={handleContactSupport}
                        >
                          <IconMessageCircle size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )) : (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" ta="center" py="xl">
                      No withdrawal requests yet. Create your first withdrawal request to get started.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        {/* Add receipt modal */}
        <Modal 
          opened={receiptOpened} 
          onClose={closeReceipt} 
          title="Withdrawal Receipt" 
          size="lg"
        >
          {selectedWithdrawal && (
            <div>
              <Card bg="gray.0" p="md" mb="md">
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Receipt Details</Text>
                  <Badge color={getStatusColor(selectedWithdrawal.status)} variant="light">
                    {selectedWithdrawal.status.toUpperCase()}
                  </Badge>
                </Group>
                
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Withdrawal ID</Text>
                    <Text fw={500}>{selectedWithdrawal.withdrawalId}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Amount</Text>
                    <Text fw={600} size="lg" c="green">
                      ${Number(selectedWithdrawal.amount).toLocaleString()}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Bank</Text>
                    <Text fw={500}>{selectedWithdrawal.bankName}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Account</Text>
                    <Text fw={500}>****{selectedWithdrawal.accountNumber?.slice(-4)}</Text>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">Date Processed</Text>
                    <Text fw={500}>
                      {selectedWithdrawal.processedAt ? 
                        formatDate(selectedWithdrawal.processedAt) : 
                        'Pending'
                      }
                    </Text>
                  </Grid.Col>
                </Grid>
              </Card>
              
              <Group justify="space-between">
                {selectedWithdrawal.status === 'rejected' && (
                  <Button 
                    color="red" 
                    leftSection={<IconMessageCircle size={16} />}
                    onClick={handleContactSupport}
                  >
                    Contact SBA Support
                  </Button>
                )}
                {selectedWithdrawal.status === 'completed' && (
                  <Button 
                    color="green" 
                    leftSection={<IconDownload size={16} />}
                    onClick={() => handleDownloadReceipt(selectedWithdrawal)}
                  >
                    Download Receipt
                  </Button>
                )}
                <Button variant="default" onClick={closeReceipt}>
                  Close
                </Button>
              </Group>
            </div>
          )}
        </Modal>
      </Container>
    </DashboardLayout>
  );
});

export default WithdrawalsPage;