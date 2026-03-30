'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Container, Title, Card, Table, Switch, Button, Group, Text, 
  TextInput, NumberInput, Stack, ActionIcon, Modal, Select,
  Divider, Badge, Tabs, Box, Paper, Tooltip 
} from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  IconMail, IconPlus, IconTrash, IconDeviceFloppy, IconPlayerPlay, 
  IconSettings, IconEye, IconSend, IconDeviceDesktop, IconCode 
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

const EmailAutomationPage = observer(() => {
  const queryClient = useQueryClient();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [testModalOpened, { open: openTestModal, close: closeTestModal }] = useDisclosure(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');
  const [editTab, setEditTab] = useState('editor');

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: '',
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/emails/templates');
      return response.json();
    },
  });

  useEffect(() => {
    if (selectedTemplate && editor) {
      editor.commands.setContent(selectedTemplate.bodyHtml || '');
    } else if (!selectedTemplate && editor) {
      editor.commands.setContent('');
    }
  }, [selectedTemplate, editor]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await fetch('/api/admin/emails/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Template updated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Template created', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
      closeModal();
    },
  });

  const testSendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/emails/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Test Sent', message: 'Check your inbox for the preview email', color: 'blue' });
      closeTestModal();
    },
  });

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <DashboardLayout>
      <Container size="xl">
        <Stack mb="xl">
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={1} c="#002e6d">Email Automation Engine</Title>
              <Text c="dimmed">Author and manage automated touchpoints along the customer lifecycle.</Text>
            </div>
            <Button 
                variant="filled" 
                color="blue" 
                leftSection={<IconPlus size={16} />} 
                onClick={() => { setSelectedTemplate(null); openModal(); }}
                radius="md"
            >
              New Sequence Template
            </Button>
          </Group>
        </Stack>

        <Card withBorder radius="md" shadow="sm" p={0}>
            <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead bg="gray.0">
                    <Table.Tr>
                        <Table.Th>Template Name</Table.Th>
                        <Table.Th>Event Trigger</Table.Th>
                        <Table.Th>Delay Profile</Table.Th>
                        <Table.Th>Delivery Status</Table.Th>
                        <Table.Th w={120}>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {templates.map((template: any) => (
                        <Table.Tr key={template.id}>
                            <Table.Td>
                                <Group gap="sm">
                                    <IconMail size={20} color="var(--mantine-color-blue-6)" />
                                    <div>
                                        <Text fw={600} size="sm">{template.templateName}</Text>
                                        <Text size="xs" c="dimmed" lineClamp={1}>{template.subject}</Text>
                                    </div>
                                </Group>
                            </Table.Td>
                            <Table.Td>
                                <Badge variant="dot" color="blue" size="sm">{template.triggerEvent.toUpperCase()}</Badge>
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    <IconPlayerPlay size={12} color="var(--mantine-color-gray-6)" />
                                    <Text size="sm">{template.delayInterval}s Delay</Text>
                                </Group>
                            </Table.Td>
                            <Table.Td>
                                <Switch 
                                    checked={template.enabled} 
                                    onChange={(e) => updateMutation.mutate({ 
                                        id: template.id, 
                                        data: { enabled: e.currentTarget.checked } 
                                    })} 
                                    size="sm"
                                />
                            </Table.Td>
                            <Table.Td>
                                <Group gap={0}>
                                    <Tooltip label="Edit Content">
                                        <ActionIcon variant="subtle" color="blue" onClick={() => { setSelectedTemplate(template); openModal(); }}>
                                            <IconSettings size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Test Delivery">
                                        <ActionIcon variant="subtle" color="green" onClick={() => { setSelectedTemplate(template); openTestModal(); }}>
                                            <IconSend size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Card>

        <Modal opened={modalOpened} onClose={closeModal} title={selectedTemplate ? "Template Architect" : "Sequence Composition"} size="70%" centered radius="lg">
            <Stack>
                <Group grow>
                    <TextInput 
                        name="templateName"
                        label="Internal Reference Name"
                        defaultValue={selectedTemplate?.templateName}
                        placeholder="e.g. Onboarding Follow-up"
                        required
                    />
                    <Select 
                        name="triggerEvent"
                        label="System Trigger"
                        defaultValue={selectedTemplate?.triggerEvent}
                        data={[
                            { value: 'registration', label: 'On Registration success' },
                            { value: 'purchase', label: 'On Payment completion' },
                            { value: 'abandoned_checkout', label: 'On Checkout abandonment' }
                        ]}
                        required
                    />
                </Group>

                <TextInput 
                    name="subject"
                    label="Email Subject Line"
                    defaultValue={selectedTemplate?.subject}
                    placeholder="Welcome to the team!"
                    required
                />

                <Tabs value={editTab} onChange={(val) => setEditTab(val || 'editor')}>
                    <Tabs.List mb="md">
                        <Tabs.Tab value="editor" leftSection={<IconCode size={16} />}>Rich Editor</Tabs.Tab>
                        <Tabs.Tab value="preview" leftSection={<IconDeviceDesktop size={16} />}>Live Preview</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="editor">
                        <Paper withBorder radius="md" p={0}>
                            <RichTextEditor editor={editor}>
                                <RichTextEditor.Toolbar sticky stickyOffset={0}>
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Bold />
                                        <RichTextEditor.Italic />
                                        <RichTextEditor.Strikethrough />
                                        <RichTextEditor.ClearFormatting />
                                        <RichTextEditor.Code />
                                    </RichTextEditor.ControlsGroup>
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.H1 />
                                        <RichTextEditor.H2 />
                                        <RichTextEditor.BulletList />
                                        <RichTextEditor.OrderedList />
                                    </RichTextEditor.ControlsGroup>
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Link />
                                        <RichTextEditor.Unlink />
                                    </RichTextEditor.ControlsGroup>
                                </RichTextEditor.Toolbar>
                                <RichTextEditor.Content mih={300} />
                            </RichTextEditor>
                        </Paper>
                    </Tabs.Panel>

                    <Tabs.Panel value="preview">
                        <Box p="xl" bg="gray.0" mih={350} style={{ borderRadius: '8px', overflow: 'auto' }}>
                            <div 
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '600px', 
                                    margin: '0 auto', 
                                    backgroundColor: 'white', 
                                    padding: '40px', 
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                                }}
                                dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
                            />
                        </Box>
                    </Tabs.Panel>
                </Tabs>

                <Group grow>
                    <NumberInput 
                        name="delayInterval"
                        label="Wait Interval (Seconds)"
                        defaultValue={selectedTemplate?.delayInterval || 0}
                        description="Seconds to wait before delivery"
                    />
                    <div style={{ alignSelf: 'flex-end' }}>
                        <Button 
                            fullWidth 
                            size="lg" 
                            leftSection={<IconDeviceFloppy size={20} />}
                            onClick={() => {
                                const data = {
                                    templateName: (document.getElementsByName('templateName')[0] as HTMLInputElement).value,
                                    triggerEvent: (document.getElementsByName('triggerEvent')[0] as HTMLSelectElement).value,
                                    subject: (document.getElementsByName('subject')[0] as HTMLInputElement).value,
                                    bodyHtml: editor?.getHTML(),
                                    delayInterval: parseInt((document.getElementsByName('delayInterval')[0] as HTMLInputElement).value)
                                };
                                if (selectedTemplate) {
                                    updateMutation.mutate({ id: selectedTemplate.id, data });
                                } else {
                                    createMutation.mutate(data);
                                }
                            }}
                        >
                            Commit Template
                        </Button>
                    </div>
                </Group>
            </Stack>
        </Modal>

        <Modal opened={testModalOpened} onClose={closeTestModal} title="Test Delivery Execution" centered radius="lg">
            <Stack>
                <Text size="sm" c="dimmed">Send a test dispatch of <b>{selectedTemplate?.templateName}</b> to verify cross-client rendering.</Text>
                <TextInput 
                    label="Test Recipient Email"
                    placeholder="admin@internal.test"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.currentTarget.value)}
                    required
                />
                <Button 
                    fullWidth 
                    leftSection={<IconSend size={20} />} 
                    disabled={!testEmail}
                    onClick={() => {
                        testSendMutation.mutate({
                            email: testEmail,
                            subject: selectedTemplate.subject,
                            bodyHtml: selectedTemplate.bodyHtml
                        });
                    }}
                >
                    Fire Test Packet
                </Button>
            </Stack>
        </Modal>
      </Container>
    </DashboardLayout>
  );
});

export default EmailAutomationPage;
