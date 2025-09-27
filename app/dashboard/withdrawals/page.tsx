'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { Container, Title, Card, Group, Button, Badge, Text, Grid, Table, ActionIcon } from '@mantine/core';
import { IconPlus, IconDownload, IconEye } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Add interface for withdrawal data
interface Withdrawal {
  id: string;
  withdrawalId: string;
  userId: string;
  applicationId: string;
  amount: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  processedAt?: string;
  createdAt: string;
}

const WithdrawalsPage = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  // CHANGED: Add proper typing to useQuery hook
  const { data: withdrawals = [] } = useQuery<Withdrawal[]>({
    queryKey: ['user-withdrawals', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/withdrawals?userId=${authStore.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      return response.json();
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

  // CHANGED: Calculate real statistics with proper typing
  const totalWithdrawn = withdrawals
    .filter((w: Withdrawal) => w.status === 'completed')
    .reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0);

  const pendingAmount = withdrawals
    .filter((w: Withdrawal) => w.status === 'pending')
    .reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0);

  // CHANGED: Calculate success rate with proper typing
  const successRate = withdrawals.length > 0 
    ? Math.round((withdrawals.filter((w: Withdrawal) => w.status === 'completed').length / withdrawals.length) * 100)
    : 0;

  // CHANGED: Format date safely
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
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
                {successRate}%
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
              {withdrawals.length > 0 ? withdrawals.map((withdrawal: Withdrawal) => (
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
                      <Text c="dimmed" size="xs">
                        ****{withdrawal.accountNumber.slice(-4)}
                      </Text>
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(withdrawal.status)} variant="light">
                      {withdrawal.status.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {withdrawal.processedAt 
                        ? formatDate(withdrawal.processedAt) 
                        : formatDate(withdrawal.createdAt)
                      }
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="subtle" color="blue">
                        <IconEye size={16} />
                      </ActionIcon>
                      {withdrawal.status === 'completed' && (
                        <ActionIcon variant="subtle" color="green">
                          <IconDownload size={16} />
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
      </Container>
    </DashboardLayout>
  );
});

export default WithdrawalsPage;