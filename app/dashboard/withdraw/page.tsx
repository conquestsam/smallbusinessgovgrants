'use client';

import { observer } from 'mobx-react-lite';
import { Container, Title, Card, Button, Group, Text, Select, NumberInput, TextInput, Alert, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconAlertCircle, IconCreditCard } from '@tabler/icons-react';

const WithdrawPage = observer(() => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  // Mock approved applications
  const approvedApplications = [
    {
      value: 'APP-2024-001',
      label: 'Tech Innovations LLC - $45,000 available',
      availableAmount: 45000,
      withdrawnAmount: 25000,
    },
  ];

  interface WithdrawalFormValues {
  applicationId: string;
  amount: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  confirmAccountNumber: string;
}

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
  validate: {
    applicationId: (value) => (!value ? 'Please select an application' : null),
    amount: (value) => {
      if (!value) return 'Amount is required';
      const numValue = Number(value);
      if (numValue <= 0) return 'Amount must be greater than 0';
      if (numValue > 20000) return 'Maximum withdrawal amount is $20,000';
      return null;
    },
    bankName: (value) => (!value ? 'Bank name is required' : null),
    accountNumber: (value) => (!value ? 'Account number is required' : null),
    routingNumber: (value) => {
      if (!value) return 'Routing number is required';
      if (!/^\d{9}$/.test(value)) return 'Routing number must be 9 digits';
      return null;
    },
    accountHolderName: (value) => (!value ? 'Account holder name is required' : null),
    confirmAccountNumber: (value, values) =>
      value !== values.accountNumber ? 'Account numbers do not match' : null,
  },
});

  if (!authStore.isAuthenticated) {
    return null;
  }

  const selectedApp = approvedApplications.find(app => app.value === form.values.applicationId);
  const availableAmount = selectedApp ? selectedApp.availableAmount - selectedApp.withdrawnAmount : 0;

  const handleSubmit = async (values: typeof form.values) => {
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
        throw new Error('Failed to submit withdrawal request');
      }
    } catch (error) {
      notifications.show({
        title: 'Submission Failed',
        message: 'There was an error submitting your withdrawal request. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  data={approvedApplications}
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