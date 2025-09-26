'use client';

import { observer } from 'mobx-react-lite';
import { Container, Title, Card, Group, Button, Badge, Text, Grid, Table, ActionIcon } from '@mantine/core';
import { IconPlus, IconDownload, IconEye } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const WithdrawalsPage = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  if (!authStore.isAuthenticated) {
    return null;
  }

  // Mock data - in real app, this would come from API
  const withdrawals = [
    {
      id: '1',
      withdrawalId: 'WD-2024-001',
      applicationId: 'APP-2024-001',
      amount: 25000,
      status: 'completed',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      processedAt: new Date('2024-01-20'),
      createdAt: new Date('2024-01-18'),
    },
    {
      id: '2',
      withdrawalId: 'WD-2024-002',
      applicationId: 'APP-2024-001',
      amount: 20000,
      status: 'pending',
      bankName: 'Bank of America',
      accountNumber: '****5678',
      createdAt: new Date('2024-01-25'),
    },
  ];

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

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

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
                {withdrawals.length > 0 ? Math.round((withdrawals.filter(w => w.status === 'completed').length / withdrawals.length) * 100) : 0}%
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
              {withdrawals.map((withdrawal) => (
                <Table.Tr key={withdrawal.id}>
                  <Table.Td>
                    <Text fw={500}>{withdrawal.withdrawalId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{withdrawal.applicationId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600}>${withdrawal.amount.toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {withdrawal.bankName}<br />
                      <Text c="dimmed" size="xs">{withdrawal.accountNumber}</Text>
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(withdrawal.status)} variant="light">
                      {withdrawal.status.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {withdrawal.processedAt ? withdrawal.processedAt.toLocaleDateString() : withdrawal.createdAt.toLocaleDateString()}
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
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Container>
    </DashboardLayout>
  );
});

export default WithdrawalsPage;