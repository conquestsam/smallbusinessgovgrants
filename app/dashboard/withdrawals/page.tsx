'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { 
  Container, Title, Card, Group, Button, Badge, Text, Grid, Table, 
  ActionIcon, Modal, ScrollArea, Box, LoadingOverlay, SimpleGrid
} from '@mantine/core';
import { IconPlus, IconDownload, IconEye, IconX, IconPrinter } from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PDFService } from '@/lib/services/pdf.service';
import { useMediaQuery } from '@mantine/hooks';

// Add interface for withdrawal data
interface Withdrawal {
  id: string;
  withdrawalId: string;
  userId: string;
  applicationId: string;
  amount: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  processedAt?: string;
  createdAt: string;
}

const WithdrawalsPage = observer(() => {
  const router = useRouter();
  const [receiptModalOpened, setReceiptModalOpened] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [receiptHtml, setReceiptHtml] = useState<string>('');
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  
  // For responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

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

  // Function to view receipt in modal
  const handleViewReceipt = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setIsGeneratingReceipt(true);
    
    try {
      // Generate receipt HTML
      const html = PDFService.generateWithdrawalReceipt(withdrawal, authStore.user);
      setReceiptHtml(html);
      setReceiptModalOpened(true);
    } catch (error) {
      console.error('Error generating receipt:', error);
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  // Function to download receipt
  const handleDownloadReceipt = (withdrawal: Withdrawal) => {
    try {
      PDFService.downloadReceipt(withdrawal, authStore.user, 'sba-withdrawal-receipt');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      // Fallback: open in new tab
      PDFService.printReceipt(withdrawal, authStore.user);
    }
  };

  // Function to print receipt
  const handlePrintReceipt = (withdrawal: Withdrawal) => {
    try {
      PDFService.printReceipt(withdrawal, authStore.user);
    } catch (error) {
      console.error('Error printing receipt:', error);
    }
  };

  const totalWithdrawn = withdrawals
    .filter((w: Withdrawal) => w.status === 'completed')
    .reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0);

  const pendingAmount = withdrawals
    .filter((w: Withdrawal) => w.status === 'pending')
    .reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0);

  const successRate = withdrawals.length > 0 
    ? Math.round((withdrawals.filter((w: Withdrawal) => w.status === 'completed').length / withdrawals.length) * 100)
    : 0;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl" px={isSmallMobile ? 'xs' : 'md'}>
        <Group justify="space-between" mb="xl" wrap="wrap" gap="md">
          <div>
            <Title order={1} c="#002e6d" size={isMobile ? 'h2' : 'h1'}>
              Withdrawal History
            </Title>
            <Text c="dimmed" size={isMobile ? 'sm' : 'lg'}>
              Track your withdrawal requests and payments
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            style={{ backgroundColor: '#005ea2' }}
            onClick={() => router.push('/dashboard/withdraw')}
            size={isMobile ? 'sm' : 'md'}
          >
            Request Withdrawal
          </Button>
        </Group>

        {/* CHANGED: Use SimpleGrid for better mobile responsiveness */}
        <SimpleGrid 
          cols={{ base: 1, sm: 2, lg: 4 }} 
          spacing="md" 
          mb="xl"
          verticalSpacing="md"
        >
          <Card withBorder radius="md" shadow="sm" p="xl">
            <Text c="dimmed" tt="uppercase" fw={700} size="xs">
              Total Withdrawn
            </Text>
            <Text fw={700} size={isMobile ? 'lg' : 'xl'} mt="xs" c="green">
              ${totalWithdrawn.toLocaleString()}
            </Text>
          </Card>
          
          <Card withBorder radius="md" shadow="sm" p="xl">
            <Text c="dimmed" tt="uppercase" fw={700} size="xs">
              Pending Amount
            </Text>
            <Text fw={700} size={isMobile ? 'lg' : 'xl'} mt="xs" c="orange">
              ${pendingAmount.toLocaleString()}
            </Text>
          </Card>
          
          <Card withBorder radius="md" shadow="sm" p="xl">
            <Text c="dimmed" tt="uppercase" fw={700} size="xs">
              Total Requests
            </Text>
            <Text fw={700} size={isMobile ? 'lg' : 'xl'} mt="xs">
              {withdrawals.length}
            </Text>
          </Card>
          
          <Card withBorder radius="md" shadow="sm" p="xl">
            <Text c="dimmed" tt="uppercase" fw={700} size="xs">
              Success Rate
            </Text>
            <Text fw={700} size={isMobile ? 'lg' : 'xl'} mt="xs" c="blue">
              {successRate}%
            </Text>
          </Card>
        </SimpleGrid>

        {/* CHANGED: Improved mobile responsive table */}
        <Card withBorder radius="md" shadow="sm" p={isMobile ? 'sm' : 'md'}>
          <ScrollArea type="auto">
            <Table
              striped
              highlightOnHover
              withTableBorder
              withColumnBorders={!isMobile}
              layout={isMobile ? 'auto' : 'fixed'}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={isMobile ? 120 : 150}>Withdrawal ID</Table.Th>
                  {!isMobile && <Table.Th w={120}>Application</Table.Th>}
                  <Table.Th w={isMobile ? 100 : 120}>Amount</Table.Th>
                  {!isMobile && <Table.Th w={150}>Bank Account</Table.Th>}
                  <Table.Th w={isMobile ? 100 : 120}>Status</Table.Th>
                  {!isMobile && <Table.Th w={120}>Date</Table.Th>}
                  <Table.Th w={isMobile ? 80 : 100}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {withdrawals.length > 0 ? withdrawals.map((withdrawal: Withdrawal) => (
                  <Table.Tr key={withdrawal.id}>
                    <Table.Td>
                      <Text fw={500} size={isMobile ? 'xs' : 'sm'}>
                        {isMobile ? withdrawal.withdrawalId.slice(-8) : withdrawal.withdrawalId}
                      </Text>
                    </Table.Td>
                    {!isMobile && (
                      <Table.Td>
                        <Text size="sm">App #{withdrawal.applicationId.slice(-6)}</Text>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Text fw={600} size={isMobile ? 'xs' : 'sm'}>
                        ${Number(withdrawal.amount).toLocaleString()}
                      </Text>
                    </Table.Td>
                    {!isMobile && (
                      <Table.Td>
                        <Text size="sm">
                          {withdrawal.bankName}<br />
                          <Text c="dimmed" size="xs">
                            ****{withdrawal.accountNumber.slice(-4)}
                          </Text>
                        </Text>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Badge 
                        color={getStatusColor(withdrawal.status)} 
                        variant="light"
                        size={isMobile ? 'xs' : 'sm'}
                      >
                        {isMobile ? withdrawal.status.charAt(0).toUpperCase() : withdrawal.status.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    {!isMobile && (
                      <Table.Td>
                        <Text size="sm">
                          {withdrawal.processedAt 
                            ? formatDate(withdrawal.processedAt) 
                            : formatDate(withdrawal.createdAt)
                          }
                        </Text>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <ActionIcon 
                          variant="subtle" 
                          color="blue"
                          onClick={() => handleViewReceipt(withdrawal)}
                          title="View Receipt"
                          size={isMobile ? 'sm' : 'md'}
                        >
                          <IconEye size={isMobile ? 14 : 16} />
                        </ActionIcon>
                        {withdrawal.status === 'completed' && (
                          <>
                            <ActionIcon 
                              variant="subtle" 
                              color="green"
                              onClick={() => handleDownloadReceipt(withdrawal)}
                              title="Download Receipt"
                              size={isMobile ? 'sm' : 'md'}
                            >
                              <IconDownload size={isMobile ? 14 : 16} />
                            </ActionIcon>
                            {!isMobile && (
                              <ActionIcon 
                                variant="subtle" 
                                color="orange"
                                onClick={() => handlePrintReceipt(withdrawal)}
                                title="Print Receipt"
                                size="md"
                              >
                                <IconPrinter size={16} />
                              </ActionIcon>
                            )}
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )) : (
                  <Table.Tr>
                    <Table.Td colSpan={isMobile ? 4 : 7}>
                      <Text c="dimmed" ta="center" py="xl" size={isMobile ? 'sm' : 'md'}>
                        No withdrawal requests yet. Create your first withdrawal request to get started.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Receipt Modal */}
        <Modal
          opened={receiptModalOpened}
          onClose={() => setReceiptModalOpened(false)}
          title={<Text fw={600}>Withdrawal Receipt</Text>}
          size="lg"
          fullScreen={isMobile}
          closeButtonProps={{ icon: <IconX size={16} /> }}
        >
          <LoadingOverlay visible={isGeneratingReceipt} />
          <ScrollArea h={isMobile ? 'calc(100vh - 180px)' : 500}>
            <Box 
              dangerouslySetInnerHTML={{ __html: receiptHtml }}
              p="md"
            />
          </ScrollArea>
          <Group justify="center" mt="md" gap="sm">
            <Button
              onClick={() => selectedWithdrawal && handleDownloadReceipt(selectedWithdrawal)}
              leftSection={<IconDownload size={16} />}
              style={{ backgroundColor: '#005ea2' }}
              size={isMobile ? 'sm' : 'md'}
            >
              Download
            </Button>
            <Button
              onClick={() => selectedWithdrawal && handlePrintReceipt(selectedWithdrawal)}
              leftSection={<IconPrinter size={16} />}
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
            >
              Print
            </Button>
            <Button
              variant="subtle"
              onClick={() => setReceiptModalOpened(false)}
              size={isMobile ? 'sm' : 'md'}
            >
              Close
            </Button>
          </Group>
        </Modal>
      </Container>
    </DashboardLayout>
  );
});

export default WithdrawalsPage;