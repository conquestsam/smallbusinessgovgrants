'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Container, Title, Card, Table, Button, Group, Text, 
  TextInput, Stack, ActionIcon, Modal, Select,
  Divider, Badge, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IconBan, IconPlus, IconTrash, IconInfoCircle, IconWorld, IconMail, IconUser } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { SBALoader } from '@/components/ui/SBALoader';

const BlacklistPage = observer(() => {
  const queryClient = useQueryClient();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const { data: blacklist = [], isLoading } = useQuery({
    queryKey: ['admin-blacklist'],
    queryFn: async () => {
      const response = await fetch('/api/admin/blacklist');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Added to blacklist', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-blacklist'] });
      closeModal();
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/admin/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Removed from blacklist', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-blacklist'] });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <Container size="xl" py="xl">
          <SBALoader message="Retrieving global blacklist nodes..." />
        </Container>
      </DashboardLayout>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
        case 'ip': return <IconWorld size={16} />;
        case 'email': return <IconMail size={16} />;
        case 'domain': return <IconWorld size={16} />;
        case 'user': return <IconUser size={16} />;
        default: return <IconBan size={16} />;
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl">
        <Stack mb="xl">
          <Group justify="space-between">
            <div>
              <Title order={1} c="#002e6d">Platform Blacklist</Title>
              <Text c="dimmed">Manage global blacklists for IPs, Emails, and Domains. 404 behavior is enforced at middleware level.</Text>
            </div>
            <Button color="red" leftSection={<IconPlus size={16} />} onClick={openModal}>
              Blacklist Entry
            </Button>
          </Group>
        </Stack>

        <Alert icon={<IconInfoCircle size={16} />} title="Note" color="blue" variant="light" mb="md">
            All blacklisted entities will receive a silent HTTP 404 response instead of 403. This prevents malicious actors from checking for platform existence.
        </Alert>

        <Card withBorder radius="md" shadow="sm">
            <Table highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Value</Table.Th>
                        <Table.Th>Reason</Table.Th>
                        <Table.Th>Blacklisted At</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {blacklist.map((entry: any) => (
                        <Table.Tr key={entry.id}>
                            <Table.Td>
                                <Group gap="xs">
                                    {getTypeIcon(entry.type)}
                                    <Badge color="red" variant="light">{entry.type.toUpperCase()}</Badge>
                                </Group>
                            </Table.Td>
                            <Table.Td>
                                <Text fw={500}>{entry.value}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Text size="xs" c="dimmed">{entry.reason || 'No reason provided'}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">{new Date(entry.createdAt).toLocaleDateString()}</Text>
                            </Table.Td>
                            <Table.Td>
                                <ActionIcon color="red" variant="subtle" onClick={() => removeMutation.mutate(entry.id)}>
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                    {blacklist.length === 0 && (
                        <Table.Tr>
                            <Table.Td colSpan={5}>
                                <Text ta="center" c="dimmed" py="xl">No blacklisted entities found.</Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>
        </Card>

        <Modal opened={modalOpened} onClose={closeModal} title="Blacklist Entry" centered>
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                createMutation.mutate(data);
            }}>
                <Stack>
                    <Select 
                        name="type"
                        label="Blacklist Type"
                        placeholder="Select type"
                        data={[
                            { value: 'ip', label: 'IP Address' },
                            { value: 'email', label: 'Email Address' },
                            { value: 'domain', label: 'Email Domain' },
                            { value: 'user', label: 'User ID' }
                        ]}
                        required
                    />
                    <TextInput 
                        name="value"
                        label="Value"
                        placeholder="e.g. 192.168.1.1 or spammer.com"
                        required
                    />
                    <TextInput 
                        name="reason"
                        label="Reason (Internal)"
                        placeholder="e.g. Repeated spam or fraudulent activity"
                        required
                    />
                    <Button type="submit" color="red" fullWidth mt="md">
                        Enforce Blacklist
                    </Button>
                </Stack>
            </form>
        </Modal>
      </Container>
    </DashboardLayout>
  );
});

export default BlacklistPage;
