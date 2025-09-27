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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  // CHANGED: Fetch approved applications from database
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

  // FIXED: Use useMemo to avoid circular references in form validation
  const form = useForm<WithdrawalFormValues>({
    initialValues: {
      applicationId: '',
      amount: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
      confirmAccountNumber: '',
    },
    
    // FIXED: Move validation functions outside to avoid circular references
    validate: (values) => {
      const errors: Record<string, string | null> = {};
      
      // Application ID validation
      if (!values.applicationId) {
        errors.applicationId = 'Please select an application';
      }
      
      // Amount validation
      if (!values.amount) {
        errors.amount = 'Amount is required';
      } else {
        const numValue = Number(values.amount);
        if (numValue <= 0) {
          errors.amount = 'Amount must be greater than 0';
        } else if (numValue > 50000) {
          errors.amount = 'Maximum withdrawal amount is $50,000';
        } else {
          // Validate against available amount
          const selectedApp = approvedApplications.find(app => app.id === values.applicationId);
          if (selectedApp && numValue > (selectedApp.approvedAmount - selectedApp.totalWithdrawn)) {
            errors.amount = `Amount exceeds available balance of $${(selectedApp.approvedAmount - selectedApp.totalWithdrawn).toLocaleString()}`;
          }
        }
      }
      
      // Bank name validation
      if (!values.bankName) {
        errors.bankName = 'Bank name is required';
      }
      
      // Account number validation
      if (!values.accountNumber) {
        errors.accountNumber = 'Account number is required';
      }
      
      // Routing number validation
      if (!values.routingNumber) {
        errors.routingNumber = 'Routing number is required';
      } else if (!/^\d{9}$/.test(values.routingNumber)) {
        errors.routingNumber = 'Routing number must be 9 digits';
      }
      
      // Account holder name validation
      if (!values.accountHolderName) {
        errors.accountHolderName = 'Account holder name is required';
      }
      
      // Confirm account number validation
      if (values.confirmAccountNumber !== values.accountNumber) {
        errors.confirmAccountNumber = 'Account numbers do not match';
      }
      
      return errors;
    },
  });

  if (!authStore.isAuthenticated) {
    return null;
  }

  // FIXED: Use useMemo to optimize application options
  const applicationOptions = useMemo(() => 
    approvedApplications.map(app => ({
      value: app.id,
      label: `${app.businessName} - $${(app.approvedAmount - app.totalWithdrawn).toLocaleString()} available`,
      availableAmount: app.approvedAmount - app.totalWithdrawn,
    })),
    [approvedApplications]
  );

  // FIXED: Explicitly type selectedApp
  const selectedApp: Application | undefined = useMemo(() => 
    approvedApplications.find(app => app.id === form.values.applicationId),
    [approvedApplications, form.values.applicationId]
  );

  const availableAmount = selectedApp ? selectedApp.approvedAmount - selectedApp.totalWithdrawn : 0;

  const handleSubmit = async (values: WithdrawalFormValues) => {
    setIsSubmitting(true);
    
    try {
      const withdrawalId = `WD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const withdrawalData = {
        ...values,
        withdrawalId,
        userId: authStore.user?.id,
        status: 'pending',
      };

      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawalData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Withdrawal Request Submitted',
          message: `Your withdrawal request ${withdrawalId} has been submitted for review.`,
          color: 'green',
        });
        router.push('/dashboard/withdrawals');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      notifications.show({
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'There was an error submitting your withdrawal request. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <Container size="md">
          <Group justify="center" py="xl">
            <Loader size="lg" />
            <Text>Loading your approved applications...</Text>
          </Group>
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
              • All withdrawals are subject to verification
            </Text>
          </Alert>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid>
              <Grid.Col span={12}>
                <Select
                  required
                  label="Select Approved Application"
                  placeholder="Choose an application to withdraw from"
                  data={applicationOptions}
                  {...form.getInputProps('applicationId')}
                />
                {selectedApp && (
                  <Text size="sm" c="green" mt="xs">
                    Available for withdrawal: ${availableAmount.toLocaleString()}
                  </Text>
                )}
              </Grid.Col>

              <Grid.Col span={12}>
                <NumberInput
                  required
                  label="Withdrawal Amount"
                  placeholder="Enter amount"
                  prefix="$"
                  thousandSeparator=","
                  min={1}
                  max={availableAmount}
                  {...form.getInputProps('amount')}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Text fw={600} size="lg" mb="md" c="#002e6d">
                  Bank Account Information
                </Text>
              </Grid.Col>

              <Grid.Col span={12}>
                <TextInput
                  required
                  label="Bank Name"
                  placeholder="Enter your bank name"
                  {...form.getInputProps('bankName')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  required
                  label="Account Number"
                  placeholder="Enter account number"
                  {...form.getInputProps('accountNumber')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  required
                  label="Confirm Account Number"
                  placeholder="Re-enter account number"
                  {...form.getInputProps('confirmAccountNumber')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  required
                  label="Routing Number"
                  placeholder="9-digit routing number"
                  maxLength={9}
                  {...form.getInputProps('routingNumber')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  required
                  label="Account Holder Name"
                  placeholder="Name on the account"
                  {...form.getInputProps('accountHolderName')}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Group justify="center" mt="xl">
                  <Button
                    variant="default"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    leftSection={<IconCreditCard size={16} />}
                    style={{ backgroundColor: '#005ea2' }}
                    disabled={!selectedApp || availableAmount <= 0}
                  >
                    Submit Withdrawal Request
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>
          </form>
        </Card>
      </Container>
    </DashboardLayout>
  );
});

export default WithdrawPage;