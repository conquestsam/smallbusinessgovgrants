// NEW FILE: Admin system settings page
'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Card, Grid, TextInput, Button, Group, Switch, Textarea, NumberInput, Select, Divider, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconSettings, IconMail, IconDatabase, IconShield } from '@tabler/icons-react';

const AdminSettingsPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, authStore.isAdmin, router]);

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Settings updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to update settings',
        color: 'red',
      });
    },
  });

  const systemForm = useForm({
    initialValues: {
      siteName: 'SBA Grant Management System',
      siteDescription: 'Small Business Administration Grant Management Platform',
      maintenanceMode: false,
      registrationEnabled: true,
      maxApplicationAmount: 500000,
      minApplicationAmount: 5000,
      sessionTimeout: 30,
    },
  });

  const emailForm = useForm({
    initialValues: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@sba.gov',
      fromName: 'SBA Grant System',
    },
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  const handleSystemUpdate = (values: typeof systemForm.values) => {
    updateSettingsMutation.mutate({ type: 'system', ...values });
  };

  const handleEmailUpdate = (values: typeof emailForm.values) => {
    updateSettingsMutation.mutate({ type: 'email', ...values });
  };

  return (
    <DashboardLayout>
      <Container size="lg">
        <Title order={1} c="#002e6d" mb="xl">
          System Settings
        </Title>

        <Grid>
          <Grid.Col span={12}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Group mb="md">
                <IconSettings size={20} />
                <Title order={3}>General Settings</Title>
              </Group>
              
              <form onSubmit={systemForm.onSubmit(handleSystemUpdate)}>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Site Name"
                      {...systemForm.getInputProps('siteName')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Session Timeout (minutes)"
                      min={5}
                      max={120}
                      {...systemForm.getInputProps('sessionTimeout')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Textarea
                      label="Site Description"
                      minRows={2}
                      {...systemForm.getInputProps('siteDescription')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Minimum Application Amount"
                      prefix="$"
                      thousandSeparator=","
                      {...systemForm.getInputProps('minApplicationAmount')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Maximum Application Amount"
                      prefix="$"
                      thousandSeparator=","
                      {...systemForm.getInputProps('maxApplicationAmount')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group>
                      <Switch
                        label="Maintenance Mode"
                        description="Temporarily disable the system for maintenance"
                        {...systemForm.getInputProps('maintenanceMode', { type: 'checkbox' })}
                      />
                      <Switch
                        label="Registration Enabled"
                        description="Allow new user registrations"
                        {...systemForm.getInputProps('registrationEnabled', { type: 'checkbox' })}
                      />
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="flex-end">
                      <Button
                        type="submit"
                        loading={updateSettingsMutation.isPending}
                        style={{ backgroundColor: '#005ea2' }}
                      >
                        Update System Settings
                      </Button>
                    </Group>
                  </Grid.Col>
                </Grid>
              </form>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Group mb="md">
                <IconMail size={20} />
                <Title order={3}>Email Configuration</Title>
              </Group>
              
              <form onSubmit={emailForm.onSubmit(handleEmailUpdate)}>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="SMTP Host"
                      {...emailForm.getInputProps('smtpHost')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="SMTP Port"
                      {...emailForm.getInputProps('smtpPort')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="SMTP Username"
                      {...emailForm.getInputProps('smtpUser')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="SMTP Password"
                      type="password"
                      {...emailForm.getInputProps('smtpPassword')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="From Email"
                      {...emailForm.getInputProps('fromEmail')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="From Name"
                      {...emailForm.getInputProps('fromName')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="flex-end">
                      <Button
                        type="submit"
                        loading={updateSettingsMutation.isPending}
                        style={{ backgroundColor: '#005ea2' }}
                      >
                        Update Email Settings
                      </Button>
                    </Group>
                  </Grid.Col>
                </Grid>
              </form>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Group mb="md">
                <IconDatabase size={20} />
                <Title order={3}>Database & Security</Title>
              </Group>
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card bg="gray.0" p="md">
                    <Text fw={600} mb="xs">Database Status</Text>
                    <Text size="sm" c="green">Connected</Text>
                    <Text size="xs" c="dimmed">Last backup: 2 hours ago</Text>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card bg="gray.0" p="md">
                    <Text fw={600} mb="xs">Redis Cache</Text>
                    <Text size="sm" c="green">Active</Text>
                    <Text size="xs" c="dimmed">Memory usage: 45%</Text>
                  </Card>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Group>
                    <Button variant="outline" color="blue">
                      Backup Database
                    </Button>
                    <Button variant="outline" color="orange">
                      Clear Cache
                    </Button>
                    <Button variant="outline" color="red">
                      Reset System
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default AdminSettingsPage;