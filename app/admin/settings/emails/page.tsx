'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Title, Card, Grid, TextInput, Button, Group, Textarea, Switch,
  Select, Table, Badge, Tabs, Stack, Text, Divider, Box, Alert
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { AdminSettingsLayout } from '@/components/layout/AdminSettingsLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { 
  IconMail, IconSend, IconHistory, IconTemplate, 
  IconDeviceFloppy, IconInfoCircle 
} from '@tabler/icons-react';
import { useUnsavedChanges } from '@/lib/hooks/useUnsavedChanges';

const EmailSettingsPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/emails/templates');
      return response.json();
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await fetch(`/api/admin/emails/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Template updated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
    },
  });

  if (isLoading) return <Text p="xl">Loading Templates...</Text>;

  return (
    <AdminSettingsLayout>
      <Stack gap="lg">
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v || 'templates')} variant="outline" radius="md">
          <Tabs.List>
            <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>Email Templates</Tabs.Tab>
            <Tabs.Tab value="broadcast" leftSection={<IconSend size={16} />}>Broadcast Center</Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>Dispatch Logs</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="templates" pt="xl">
            <Stack gap="md">
              <Alert icon={<IconInfoCircle size={16} />} title="Dynamic Placeholders" color="blue" variant="light">
                {"Use variables like {{name}}, {{email}}, or {{amount}} within your templates for automatic hydration."}
              </Alert>

              {templates.map((template: any) => (
                <Card key={template.id} withBorder radius="md" p="xl" bg="white">
                  <Group justify="space-between" mb="md">
                    <Stack gap={0}>
                      <Text fw={700} size="lg">{template.templateName}</Text>
                      <Text size="xs" c="dimmed">Trigger: {template.triggerEvent}</Text>
                    </Stack>
                    <Switch 
                      label="Active" 
                      checked={template.enabled} 
                      onChange={(e) => updateTemplateMutation.mutate({ id: template.id, data: { enabled: e.currentTarget.checked } })}
                    />
                  </Group>

                  <Divider my="md" />

                  <Stack gap="md">
                    <TextInput 
                      label="Email Subject" 
                      defaultValue={template.subject}
                      onBlur={(e) => updateTemplateMutation.mutate({ id: template.id, data: { subject: e.currentTarget.value } })}
                    />
                    <Textarea 
                      label="HTML Content" 
                      minRows={6} 
                      defaultValue={template.bodyHtml}
                      onBlur={(e) => updateTemplateMutation.mutate({ id: template.id, data: { bodyHtml: e.currentTarget.value } })}
                    />
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="broadcast" pt="xl">
            <Card withBorder radius="md" p="xl">
               <Title order={3} mb="xl">Global Communications</Title>
               <Text c="dimmed" mb="md">Send real-time alerts or newsletters to your entire user base.</Text>
               <Button variant="outline" leftSection={<IconSend size={16} />}>Open Broadcast Modal</Button>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xl">
            <Card withBorder radius="md" p="0" style={{ overflow: 'hidden' }}>
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Subject</Table.Th>
                    <Table.Th>Recipient</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Dispatched</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                   <Table.Tr>
                      <Table.Td colSpan={4}><Text ta="center" py="xl" c="dimmed">No logs detected for the selected period.</Text></Table.Td>
                   </Table.Tr>
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </AdminSettingsLayout>
  );
});

export default EmailSettingsPage;
