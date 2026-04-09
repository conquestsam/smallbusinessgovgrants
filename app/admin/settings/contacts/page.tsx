'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Title, Card, Switch, Button, Group, Text,
  TextInput, Stack, ActionIcon, Modal, Select,
  Divider, Textarea, Badge, Tooltip, Box, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { AdminSettingsLayout } from '@/components/layout/AdminSettingsLayout';
import {
  IconMessageCircle, IconPlus, IconExternalLink,
  IconDeviceFloppy, IconBrandWhatsapp, IconBrandTelegram,
  IconMail, IconLink, IconGripVertical, IconBrandMessenger, IconHistory, IconInfoCircle,
  IconSettings, IconTrash
} from '@tabler/icons-react';
import { SBALoader } from '@/components/ui/SBALoader';
import { useDisclosure } from '@mantine/hooks';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useUnsavedChanges } from '@/lib/hooks/useUnsavedChanges';

const ContactSettingsPage = observer(() => {
  const queryClient = useQueryClient();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [localContacts, setLocalContacts] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin-contact-config'],
    queryFn: async () => {
      const response = await fetch('/api/admin/contacts/config');
      return response.json();
    },
  });

  useEffect(() => {
    if (contacts) {
      setLocalContacts([...contacts].sort((a, b) => a.displayOrder - b.displayOrder));
    }
  }, [contacts]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await fetch('/api/admin/contacts/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'idempotency-key': `cnt_upd_${Date.now()}` },
        body: JSON.stringify({ id, data }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Support channel protocol updated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-contact-config'] });
      setIsDirty(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/contacts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'New channel provisioned', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-contact-config'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/admin/contacts/config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Deleted', message: 'Support channel removed', color: 'orange' });
      queryClient.invalidateQueries({ queryKey: ['admin-contact-config'] });
    },
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(localContacts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLocalContacts(items);
    setIsDirty(true);

    items.forEach((item, index) => {
      updateMutation.mutate({ id: item.id, data: { displayOrder: index + 1 } });
    });
  };

  if (isLoading) return <SBALoader variant="inline" message="Loading support channels..." />;

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp': return <IconBrandWhatsapp size={24} color="#25D366" />;
      case 'telegram': return <IconBrandTelegram size={24} color="#0088cc" />;
      case 'email': return <IconMail size={24} color="#EA4335" />;
      case 'signal': return <IconBrandMessenger size={24} color="#3a76f0" />;
      default: return <IconLink size={24} />;
    }
  };

  return (
    <AdminSettingsLayout>
      <Stack gap="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <div>
            <Title order={3}>Support Channels</Title>
            <Text c="dimmed" size="sm">Manage external communication endpoints and deep-linking.</Text>
          </div>
          <Button
            variant="filled"
            leftSection={<IconPlus size={16} />}
            onClick={() => { setSelectedMethod(null); openModal(); }}
            style={{ backgroundColor: '#005ea2' }}
          >
            Provision Channel
          </Button>
        </Group>

        <Alert icon={<IconInfoCircle size={16} />} title="Channel Routing" color="teal" variant="light">
          These channels appear in the floating support widget globally across the platform.
        </Alert>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="contact-methods">
            {(provided) => (
              <Stack {...provided.droppableProps} ref={provided.innerRef} gap="md">
                {localContacts.map((contact: any, index: number) => (
                  <Draggable key={contact.id} draggableId={contact.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        withBorder
                        radius="md"
                        shadow={snapshot.isDragging ? "xl" : "xs"}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        bg="white"
                      >
                        <Group justify="space-between" wrap="wrap" gap="sm">
                          <Group>
                            <div {...provided.dragHandleProps}>
                              <IconGripVertical size={20} color="var(--mantine-color-gray-5)" style={{ cursor: 'grab' }} />
                            </div>
                            {getPlatformIcon(contact.platform)}
                            <div>
                              <Group gap="xs">
                                <Text fw={700} size="lg">{contact.platform.toUpperCase()}</Text>
                                <Badge size="xs" variant="light">Route #{index + 1}</Badge>
                              </Group>
                            </div>
                          </Group>
                          <Group gap="sm" wrap="wrap">
                            <Switch
                              checked={contact.enabled}
                              onChange={(e) => {
                                setIsDirty(true);
                                updateMutation.mutate({ id: contact.id, data: { enabled: e.currentTarget.checked } });
                              }}
                              label="Online"
                            />
                            <ActionIcon variant="light" onClick={() => { setSelectedMethod(contact); openModal(); }} size="lg"
                              style={{ backgroundColor: 'rgba(0, 94, 162, 0.1)', color: '#005ea2' }}
                            >
                              <IconSettings size={20} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              size="lg"
                              onClick={() => {
                                if (confirm(`Remove this ${contact.platform} channel?`)) {
                                  deleteMutation.mutate(contact.id);
                                }
                              }}
                              style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        <Divider my="md" />

                        <Group grow align="flex-start" wrap="wrap" gap="md">
                          <Stack gap={4}>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Destination Link</Text>
                            <Text size="sm" c="blue" component="a" href={contact.link} target="_blank" style={{ textDecoration: 'underline' }}>
                              {contact.link}
                            </Text>
                          </Stack>
                          <Stack gap={4}>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Context Payload</Text>
                            <Text size="sm" lineClamp={1} fs="italic">
                              {contact.defaultMessage || 'No pre-filled message.'}
                            </Text>
                          </Stack>
                        </Group>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
        </DragDropContext>

        <Card withBorder radius="md" p="xl">
          <Group mb="md">
            <IconHistory size={20} color="var(--mantine-color-gray-6)" />
            <Title order={4}>Communication Audit</Title>
          </Group>
          <Text size="sm" c="dimmed">Audit trail for global support routing changes.</Text>
          <Divider my="md" />
          <Text size="sm" fs="italic">Communications infrastructure is operating within normal parameters.</Text>
        </Card>

        <Modal opened={modalOpened} onClose={closeModal} title={selectedMethod ? "Update Routing Rules" : "Provision Support Endpoint"} centered radius="lg">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data: any = Object.fromEntries(formData.entries());
            if (selectedMethod) {
              updateMutation.mutate({ id: selectedMethod.id, data });
            } else {
              data.displayOrder = localContacts.length + 1;
              createMutation.mutate(data);
            }
            closeModal();
          }}>
            <Stack>
              <Select name="platform" label="Platform Protocol" defaultValue={selectedMethod?.platform} data={['WhatsApp', 'Telegram', 'Signal', 'Email', 'Custom']} required />
              <TextInput name="link" label="Endpoint Identifier" placeholder="e.g. https://t.me/username" defaultValue={selectedMethod?.link} required />
              <Textarea name="defaultMessage" label="Pre-filled Communication Context" placeholder="Hello, I need assistance with..." defaultValue={selectedMethod?.defaultMessage} rows={4} />
              <Button type="submit" fullWidth mt="md" size="lg" leftSection={<IconDeviceFloppy size={20} />}
                style={{ backgroundColor: '#005ea2' }}
              >
                Deploy Configuration
              </Button>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </AdminSettingsLayout>
  );
});

export default ContactSettingsPage;
