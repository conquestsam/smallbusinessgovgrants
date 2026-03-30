// app/admin/settings/page.tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Title, Card, Grid, TextInput, Button, Group, Switch, 
  Textarea, NumberInput, Divider, Text, Stack, Tabs, Box 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AdminSettingsLayout } from '@/components/layout/AdminSettingsLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconSettings, IconMail, IconDatabase, IconClock } from '@tabler/icons-react';
import { useUnsavedChanges } from '@/lib/hooks/useUnsavedChanges';

const GeneralSettingsPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>('general');

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    enabled: authStore.isAdmin,
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

  // Sync data with forms when fetched
  useEffect(() => {
    if (settings) {
      if (settings.system) systemForm.setValues(settings.system);
      if (settings.email) emailForm.setValues(settings.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Unsaved changes guards
  useUnsavedChanges(systemForm.isDirty() || emailForm.isDirty());

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'idempotency-key': `set_${Date.now()}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Configuration updated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      systemForm.resetDirty();
      emailForm.resetDirty();
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    },
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) return null;

  return (
    <AdminSettingsLayout>
      <Stack gap="lg">
        <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
          <Tabs.List>
            <Tabs.Tab value="general" leftSection={<IconSettings size={16} />}>General Config</Tabs.Tab>
            <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>Infrastructure Emails</Tabs.Tab>
            <Tabs.Tab value="security" leftSection={<IconClock size={16} />}>Security & Logs</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="xl">
            <form onSubmit={systemForm.onSubmit((v) => updateSettingsMutation.mutate({ type: 'system', ...v }))}>
              <Card withBorder radius="md" p="xl" bg="white">
                <Title order={3} mb="xl">Platform Parameters</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Site Name" {...systemForm.getInputProps('siteName')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Session Timeout (min)" {...systemForm.getInputProps('sessionTimeout')} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Textarea label="Site Description" minRows={2} {...systemForm.getInputProps('siteDescription')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Min Application Amount" prefix="$" thousandSeparator="," {...systemForm.getInputProps('minApplicationAmount')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput label="Max Application Amount" prefix="$" thousandSeparator="," {...systemForm.getInputProps('maxApplicationAmount')} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Group>
                      <Switch label="Maintenance Mode" {...systemForm.getInputProps('maintenanceMode', { type: 'checkbox' })} />
                      <Switch label="Registration Enabled" {...systemForm.getInputProps('registrationEnabled', { type: 'checkbox' })} />
                    </Group>
                  </Grid.Col>
                </Grid>
                <Group justify="flex-end" mt="xl">
                  <Button type="submit" loading={updateSettingsMutation.isPending} disabled={!systemForm.isDirty()}>
                    Save Changes
                  </Button>
                </Group>
              </Card>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="email" pt="xl">
            <form onSubmit={emailForm.onSubmit((v) => updateSettingsMutation.mutate({ type: 'email', ...v }))}>
              <Card withBorder radius="md" p="xl" bg="white">
                <Title order={3} mb="xl">SMTP Infrastructure</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Host" {...emailForm.getInputProps('smtpHost')} /></Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}><NumberInput label="Port" {...emailForm.getInputProps('smtpPort')} /></Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="User" {...emailForm.getInputProps('smtpUser')} /></Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Password" type="password" {...emailForm.getInputProps('smtpPassword')} /></Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="From Email" {...emailForm.getInputProps('fromEmail')} /></Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="From Name" {...emailForm.getInputProps('fromName')} /></Grid.Col>
                </Grid>
                <Group justify="flex-end" mt="xl">
                  <Button type="submit" variant="filled" loading={updateSettingsMutation.isPending} disabled={!emailForm.isDirty()}>
                    Apply Email Protocol
                  </Button>
                </Group>
              </Card>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="security" pt="xl">
             <Stack gap="md">
                <Card withBorder radius="md" p="xl">
                   <Title order={3} mb="md">System Health</Title>
                   <Grid>
                     <Grid.Col span={{ base: 12, md: 6 }}>
                       <Card bg="gray.0" p="md">
                         <Text fw={600} mb="xs">Database Persistence</Text>
                         <Text size="sm" c="green">Serverless Optimized</Text>
                       </Card>
                     </Grid.Col>
                     <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card bg="gray.0" p="md">
                          <Text fw={600} mb="xs">Resilience Manager</Text>
                          <Text size="sm" c="teal">Active (Retries: 3)</Text>
                        </Card>
                     </Grid.Col>
                   </Grid>
                </Card>

                <Card withBorder radius="md" p="xl">
                   <Title order={4} mb="md">Recent Config Audit</Title>
                   <Text size="sm" c="dimmed">No changes detected in current session.</Text>
                </Card>
             </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </AdminSettingsLayout>
  );
});

export default GeneralSettingsPage;