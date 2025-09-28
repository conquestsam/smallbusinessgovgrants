// NEW FILE: Admin email center page
'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Card, Grid, TextInput, Button, Group, Textarea, Select, Table, Badge, Modal, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconMail, IconSend, IconUsers, IconHistory } from '@tabler/icons-react';

const AdminEmailsPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState('compose');

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, authStore.isAdmin, router]);

  const { data: emailHistory = [] } = useQuery({
    queryKey: ['admin-email-history'],
    queryFn: async () => {
      const response = await fetch('/api/admin/emails/history');
      if (!response.ok) throw new Error('Failed to fetch email history');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-for-email'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send email');
      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Email sent successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-email-history'] });
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to send email',
        color: 'red',
      });
    },
  });

  const form = useForm({
    initialValues: {
      recipients: 'all',
      subject: '',
      content: '',
      type: 'newsletter',
    },
    validate: {
      subject: (value:string) => (!value ? 'Subject is required' : null),
      content: (value:string) => (!value ? 'Content is required' : null),
    },
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  const handleSendEmail = (values: typeof form.values) => {
    sendEmailMutation.mutate(values);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl">
        <Title order={1} c="#002e6d" mb="xl">
          Email Center
        </Title>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'compose')}>
          <Tabs.List>
            <Tabs.Tab value="compose" leftSection={<IconMail size={16} />}>
              Compose Email
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              Email History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="compose" pt="xl">
            <Card withBorder radius="md" shadow="sm" p="xl">
              <form onSubmit={form.onSubmit(handleSendEmail)}>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Recipients"
                      data={[
                        { value: 'all', label: 'All Users' },
                        { value: 'active', label: 'Active Users Only' },
                        { value: 'admins', label: 'Administrators Only' },
                        { value: 'users', label: 'Regular Users Only' },
                      ]}
                      {...form.getInputProps('recipients')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Email Type"
                      data={[
                        { value: 'newsletter', label: 'Newsletter' },
                        { value: 'announcement', label: 'System Announcement' },
                        { value: 'maintenance', label: 'Maintenance Notice' },
                        { value: 'update', label: 'System Update' },
                      ]}
                      {...form.getInputProps('type')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      required
                      label="Subject"
                      placeholder="Enter email subject"
                      {...form.getInputProps('subject')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Textarea
                      required
                      label="Email Content"
                      placeholder="Enter your email content here..."
                      minRows={10}
                      {...form.getInputProps('content')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="space-between">
                      <Group>
                        <Button variant="outline" onClick={() => form.reset()}>
                          Clear
                        </Button>
                        <Button variant="outline">
                          Save Draft
                        </Button>
                      </Group>
                      <Button
                        type="submit"
                        loading={sendEmailMutation.isPending}
                        leftSection={<IconSend size={16} />}
                        style={{ backgroundColor: '#005ea2' }}
                      >
                        Send Email
                      </Button>
                    </Group>
                  </Grid.Col>
                </Grid>
              </form>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xl">
            <Card withBorder radius="md" shadow="sm">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Subject</Table.Th>
                    <Table.Th>Recipients</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Sent Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {/* Mock data for email history */}
                  <Table.Tr>
                    <Table.Td>Monthly Newsletter - June 2024</Table.Td>
                    <Table.Td>All Users (892)</Table.Td>
                    <Table.Td>Newsletter</Table.Td>
                    <Table.Td>
                      <Badge color="green" variant="light">SENT</Badge>
                    </Table.Td>
                    <Table.Td>June 1, 2024</Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="light">View</Button>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>System Maintenance Notice</Table.Td>
                    <Table.Td>All Users (892)</Table.Td>
                    <Table.Td>Maintenance</Table.Td>
                    <Table.Td>
                      <Badge color="green" variant="light">SENT</Badge>
                    </Table.Td>
                    <Table.Td>May 28, 2024</Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="light">View</Button>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
});

export default AdminEmailsPage;