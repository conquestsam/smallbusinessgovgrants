'use client';

import { observer } from 'mobx-react-lite';
import { Container, Title, Card, Button, Group, Text, Select, NumberInput, TextInput, Alert, Grid, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconAlertCircle, IconCreditCard } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { SBALoader } from '@/components/ui/SBALoader';
import { useDisclosure } from '@mantine/hooks';
import { WithdrawalModal } from '@/components/modals/WithdrawalModal';

interface Application {
  id: string;
  applicationId: string;
  businessName: string;
  status: string;
  approvedAmount: number;
  totalWithdrawn: number;
}

interface WithdrawalFormValues {
  applicationId: string;
  amount: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  confirmAccountNumber: string;
}

const WithdrawPage = observer(() => {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Fetch approved applications from database
  const { data: approvedApplications = [], isLoading, error } = useQuery<Application[]>({
    queryKey: ['approved-applications', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/applications?userId=${authStore.user?.id}&status=approved`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const applications = await response.json();
      
      // Filter only approved applications and calculate available amounts
      return applications.filter((app: Application) => app.status === 'approved').map((app: Application) => ({
        ...app,
        // Calculate total withdrawn amount (you might need to fetch this from withdrawals API)
        totalWithdrawn: 0, // This should be calculated from withdrawals data
      }));
    },
    enabled: !!authStore.user?.id && authStore.isAuthenticated,
  });

  // Use useMemo to optimize application options
  const applicationOptions = useMemo(() => 
    approvedApplications.map(app => ({
      value: app.id,
      label: `${app.businessName} - $${(app.approvedAmount - app.totalWithdrawn).toLocaleString()} available`,
      availableAmount: app.approvedAmount - app.totalWithdrawn,
    })),
    [approvedApplications]
  );

  // Removed the local handleSubmit/form initialization entirely since WithdrawalModal handles it natively.

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <Container size="md" py="xl">
          <SBALoader message="Retrieving approved application records..." />
        </Container>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <Container size="md">
          <Alert color="red" title="Error" variant="filled">
            <Text>Failed to load applications: {error.message}</Text>
            <Button mt="md" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  // Show message if no approved applications
  if (!isLoading && approvedApplications.length === 0) {
    return (
      <DashboardLayout>
        <Container size="md">
          <Title order={1} c="#002e6d" mb="xl" ta="center">
            Request Withdrawal
          </Title>

          <Card withBorder radius="md" shadow="sm" p="xl">
            <Alert icon={<IconAlertCircle size="1rem" />} color="yellow" variant="filled">
              <Text fw={600} mb="xs">No Approved Applications</Text>
              <Text size="sm">
                You need to have an approved grant application before you can request a withdrawal.
                Please check your application status or submit a new application.
              </Text>
            </Alert>
            
            <Group justify="center" mt="xl">
              <Button
                variant="default"
                onClick={() => router.push('/dashboard/applications')}
              >
                View Applications
              </Button>
              <Button
                onClick={() => router.push('/dashboard/apply')}
                style={{ backgroundColor: '#005ea2' }}
              >
                Create New Application
              </Button>
            </Group>
          </Card>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container size="md">
        <Title order={1} c="#002e6d" mb="xl" ta="center">
          Request Withdrawal
        </Title>

        <Card withBorder radius="md" shadow="sm" p="xl">
          <Alert icon={<IconAlertCircle size="1rem" />} color="blue" mb="xl">
            <Text fw={600} mb="xs">Important Information:</Text>
            <Text size="sm">
              • Withdrawals are processed within 3-5 business days<br />
              • Maximum withdrawal amount per request: $50,000<br />
              • Bank account must be in the business name<br />
              • All withdrawals are subject to verification<br />
              • NEW: You will receive email notifications for all status updates
            </Text>
          </Alert>

          <Group justify="center" mt="xl" pb="md">
            <Button
              size="lg"
              leftSection={<IconCreditCard size={20} />}
              style={{ backgroundColor: '#005ea2' }}
              onClick={open}
            >
              Initiate New Withdrawal
            </Button>
          </Group>

          <WithdrawalModal 
             opened={opened} 
             onClose={close} 
             applicationOptions={applicationOptions} 
          />
        </Card>
      </Container>
    </DashboardLayout>
  );
});

export default WithdrawPage;