'use client';

// [SAFETY CHECKLIST]
// - [ ] No existing test fails.
// - [ ] No public interface changes unless approved.
// - [ ] No new runtime exceptions possible.

// [WHY] Central transaction history page for users — merges deposits, withdrawals, and payments
// [WHAT] Displays a unified table with status badges, type filters, and PDF receipt download

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Title, Card, Group, Text, Badge, Table, ActionIcon,
  Stack, Paper, ThemeIcon, Box, SimpleGrid, Select, ScrollArea,
  Tooltip, Divider,
} from '@mantine/core';
import {
  IconDownload, IconReceipt, IconArrowUpRight, IconArrowDownLeft,
  IconCreditCard, IconSparkles, IconFilter, IconCurrencyDollar,
} from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SBALoader } from '@/components/ui/SBALoader';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { notifications } from '@mantine/notifications';

const MotionDiv = motion.div;

// [WHY] Transaction interface for type safety
interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  referenceId: string;
  amount: number;
  status: string;
  method: string;
  date: string;
  description: string;
}

const TransactionsPage = observer(() => {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string | null>('all');

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // [WHY] Fetch unified transaction data from the aggregated API
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['user-transactions', authStore.user?.id],
    queryFn: async () => {
      if (!authStore.user?.id) return [];
      const response = await fetch(`/api/transactions?userId=${authStore.user.id}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });

  if (!authStore.isAuthenticated) return null;

  // [WHY] Filter transactions by type when user selects a filter
  const filteredTransactions = typeFilter && typeFilter !== 'all'
    ? transactions.filter(t => t.type === typeFilter)
    : transactions;

  // [WHY] Calculate summary stats from all transactions
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && (t.status === 'completed' || t.status === 'processed'))
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = transactions.filter(t =>
    t.status === 'pending' || t.status === 'receipt_uploaded' || t.status === 'processing'
  ).length;

  // [WHY] Color mapping for transaction statuses
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'completed': case 'processed': return 'green';
      case 'pending': case 'receipt_uploaded': case 'processing': return 'yellow';
      case 'rejected': case 'failed': case 'expired': return 'red';
      default: return 'gray';
    }
  };

  // [WHY] Icon and color for transaction type badges
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <IconArrowDownLeft size={14} />;
      case 'withdrawal': return <IconArrowUpRight size={14} />;
      case 'payment': return <IconCreditCard size={14} />;
      default: return <IconReceipt size={14} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'blue';
      case 'withdrawal': return 'violet';
      case 'payment': return 'teal';
      default: return 'gray';
    }
  };

  // [WHY] Handle PDF receipt download for a specific transaction
  const handleDownloadReceipt = async (transaction: Transaction) => {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${transaction.referenceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notifications.show({
          title: 'Receipt Downloaded',
          message: 'Your PDF receipt has been saved.',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Download Failed',
          message: 'Could not generate receipt. Please try again.',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Receipt download error:', error);
      notifications.show({
        title: 'Download Failed',
        message: 'Network error. Please try again.',
        color: 'red',
      });
    }
  };

  // [WHY] Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        {/* Header */}
        <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            radius="lg" p="xl" mb="xl"
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
                  <IconSparkles size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Text size="sm" fw={500} style={{ color: 'rgba(255,255,255,0.7)' }}>Financial Overview</Text>
                </Group>
                <Title order={2} c="white" fw={800}>Transaction History</Title>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  All deposits, withdrawals, and payments in one place
                </Text>
              </div>
            </Group>
          </Paper>
        </MotionDiv>

        {/* Summary Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
          <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card withBorder radius="md" shadow="xs" p="md">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="green">
                  <IconArrowDownLeft size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Total Deposits</Text>
                  <Text size="lg" fw={800} c="green">${totalDeposits.toLocaleString()}</Text>
                </div>
              </Group>
            </Card>
          </MotionDiv>

          <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card withBorder radius="md" shadow="xs" p="md">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="violet">
                  <IconArrowUpRight size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Total Withdrawals</Text>
                  <Text size="lg" fw={800} c="violet">${totalWithdrawals.toLocaleString()}</Text>
                </div>
              </Group>
            </Card>
          </MotionDiv>

          <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card withBorder radius="md" shadow="xs" p="md">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="orange">
                  <IconCurrencyDollar size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Pending</Text>
                  <Text size="lg" fw={800} c="orange">{pendingCount} transaction(s)</Text>
                </div>
              </Group>
            </Card>
          </MotionDiv>
        </SimpleGrid>

        {/* Filter + Table */}
        <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card withBorder radius="lg" shadow="sm" p={0}>
            {/* Filter Bar */}
            <Group justify="space-between" p="md">
              <Group gap="sm">
                <IconFilter size={18} color="#002e6d" />
                <Title order={4} c="#002e6d">All Transactions</Title>
                <Badge circle color="blue" size="lg">{filteredTransactions.length}</Badge>
              </Group>
              <Select
                placeholder="Filter by type"
                w={200}
                size="sm"
                value={typeFilter}
                onChange={setTypeFilter}
                data={[
                  { value: 'all', label: 'All Types' },
                  { value: 'deposit', label: 'Deposits' },
                  { value: 'withdrawal', label: 'Withdrawals' },
                  { value: 'payment', label: 'Payments' },
                ]}
              />
            </Group>

            <Divider />

            {/* Transaction Table */}
            {isLoading ? (
              <Box p="xl">
                <SBALoader variant="inline" message="Loading transactions..." />
              </Box>
            ) : filteredTransactions.length > 0 ? (
              <ScrollArea>
                <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
                  <Table.Thead bg="#f8fafc">
                    <Table.Tr>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Reference</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th w={60}>Receipt</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredTransactions.map((txn) => (
                      <Table.Tr key={txn.id}>
                        <Table.Td>
                          <Badge
                            leftSection={getTypeIcon(txn.type)}
                            color={getTypeColor(txn.type)}
                            variant="light"
                            size="sm"
                            tt="capitalize"
                          >
                            {txn.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" fw={600} style={{ fontFamily: 'monospace' }}>
                            {txn.referenceId}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>{txn.description}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text
                            size="sm"
                            fw={700}
                            c={txn.type === 'withdrawal' ? 'red' : 'green'}
                          >
                            {txn.type === 'withdrawal' ? '-' : '+'}${txn.amount.toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(txn.status)} variant="light" size="sm">
                            {txn.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(txn.date)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Tooltip label="Download PDF Receipt" withArrow>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => handleDownloadReceipt(txn)}
                            >
                              <IconDownload size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Stack align="center" py="xl" gap="sm">
                <ThemeIcon size={48} variant="light" color="gray" radius="xl">
                  <IconReceipt size={24} />
                </ThemeIcon>
                <Text c="dimmed" ta="center" size="sm">
                  No transactions found. Your financial activity will appear here.
                </Text>
              </Stack>
            )}
          </Card>
        </MotionDiv>
      </Container>
    </DashboardLayout>
  );
});

export default TransactionsPage;
