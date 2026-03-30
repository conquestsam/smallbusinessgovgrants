'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Container, Title, Card, Stack, Text, Group, Button, 
  Badge, Table, Modal, TextInput, Textarea, Select, 
  Timeline, Divider, ActionIcon, Paper, SimpleGrid, Grid, Alert,
  ThemeIcon, Box, ScrollArea, Avatar, Indicator
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  IconMessageCircle, IconPlus, IconExternalLink, 
  IconHelp, IconBook, IconCalendarEvent, IconShieldCheck,
  IconSend, IconChevronRight, IconClock, IconTag
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { SBALoader } from '@/components/ui/SBALoader';

const SupportPage = observer(() => {
  const queryClient = useQueryClient();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);

  // FETCH TICKETS
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/support/tickets');
      return response.json();
    },
  });

  // FETCH MESSAGES (Conditional)
  const { data: messages = [] } = useQuery({
    queryKey: ['ticket-messages', selectedTicketId],
    queryFn: async () => {
      const response = await fetch(`/api/support/tickets/${selectedTicketId}/messages`);
      return response.json();
    },
    enabled: !!selectedTicketId && viewOpened,
  });

  // CREATE TICKET MUTATION
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Ticket Created', message: 'Support agent will be assigned shortly.', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      closeCreate();
      createForm.reset();
    },
  });

  // SEND MESSAGE MUTATION
  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      const response = await fetch(`/api/support/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', selectedTicketId] });
      messageForm.reset();
    },
  });

  const createForm = useForm({
    initialValues: {
      category: 'general',
      subject: '',
      description: '',
      priority: 'medium',
    },
  });

  const messageForm = useForm({
    initialValues: { body: '' },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="light" color="blue">Open</Badge>;
      case 'in_progress': return <Badge variant="light" color="orange">In Progress</Badge>;
      case 'resolved': return <Badge variant="light" color="green">Resolved</Badge>;
      case 'closed': return <Badge variant="light" color="gray">Closed</Badge>;
      default: return <Badge variant="light">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency': return <Badge variant="filled" color="red">Emergency</Badge>;
      case 'high': return <Badge variant="light" color="red">High</Badge>;
      case 'medium': return <Badge variant="light" color="yellow">Medium</Badge>;
      case 'low': return <Badge variant="light" color="gray">Low</Badge>;
      default: return null;
    }
  };

  const selectedTicket = tickets.find((t: any) => t.id === selectedTicketId);

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* HEADER */}
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={1} c="#002e6d" fw={800}>Enterprise Support Portal</Title>
              <Text c="dimmed" size="lg">Submit tickets, track resolution status, and access the knowledge base.</Text>
            </div>
            <Button 
              size="lg" 
              leftSection={<IconPlus size={20} />} 
              onClick={openCreate}
              style={{ backgroundColor: '#002e6d' }}
            >
              New Support Ticket
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
             <Card withBorder radius="md" p="xl">
                 <ThemeIcon size={40} radius="md" color="blue" variant="light" mb="md">
                    <IconBook size={20} />
                 </ThemeIcon>
                 <Text fw={700}>Knowledge Base</Text>
                 <Text size="sm" c="dimmed" mb="lg">Explore our comprehensive guides and FAQs for instant answers.</Text>
                 <Button variant="subtle" rightSection={<IconChevronRight size={16} />} p={0}>Browse Documentation</Button>
             </Card>

             <Card withBorder radius="md" p="xl">
                 <ThemeIcon size={40} radius="md" color="teal" variant="light" mb="md">
                    <IconShieldCheck size={20} />
                 </ThemeIcon>
                 <Text fw={700}>System Integrity</Text>
                 <Text size="sm" c="dimmed" mb="lg">View real-time status of all platform services and infrastructure nodes.</Text>
                 <Button variant="subtle" rightSection={<IconChevronRight size={16} />} p={0}>Check Connectivity</Button>
             </Card>

             <Card withBorder radius="md" p="xl">
                 <ThemeIcon size={40} radius="md" color="violet" variant="light" mb="md">
                    <IconCalendarEvent size={20} />
                 </ThemeIcon>
                 <Text fw={700}>Response SLA</Text>
                 <Text size="sm" c="dimmed" mb="lg">All &quot;High&quot; priority tickets are resolved within 24 business hours.</Text>
                 <Group gap={4}>
                    <IconClock size={14} color="var(--mantine-color-violet-6)" />
                    <Text size="xs" fw={700} c="violet.9">Active Enterprise Coverage</Text>
                 </Group>
             </Card>
          </SimpleGrid>

          {/* ACTIVE TICKETS */}
          <Card withBorder radius="lg" shadow="sm">
            <Group justify="space-between" mb="xl">
              <Group>
                <IconMessageCircle size={24} color="#002e6d" />
                <Title order={3}>Consolidated Response Queue</Title>
              </Group>
              <Badge variant="dot" size="lg">Live Monitoring</Badge>
            </Group>

            {isLoading ? (
              <Box p="xl" ta="center"><Text>Synchronizing ticket data...</Text></Box>
            ) : tickets.length === 0 ? (
              <Box p="xl" ta="center" bg="gray.0" style={{ borderRadius: 12 }}>
                <Text fw={600} mb={4}>No active support tickets detected.</Text>
                <Text size="sm" c="dimmed">Need assistance? Open a ticket to start a secure communication session.</Text>
              </Box>
            ) : (
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead bg="gray.1">
                  <Table.Tr>
                    <Table.Th>Dispatched</Table.Th>
                    <Table.Th>Subject / Reference</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tickets.map((ticket: any) => (
                    <Table.Tr key={ticket.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedTicketId(ticket.id); openView(); }}>
                      <Table.Td>
                        <Text size="sm" fw={600}>{dayjs(ticket.createdAt).format('MMM D, YYYY')}</Text>
                        <Text size="xs" c="dimmed">{dayjs(ticket.createdAt).format('HH:mm')}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700}>{ticket.subject}</Text>
                        <Text size="xs" c="dimmed">ID: #{ticket.id.slice(0, 8)}</Text>
                      </Table.Td>
                      <Table.Td><Badge variant="outline" color="gray" tt="capitalize">{ticket.category}</Badge></Table.Td>
                      <Table.Td>{getPriorityBadge(ticket.priority)}</Table.Td>
                      <Table.Td>{getStatusBadge(ticket.status)}</Table.Td>
                      <Table.Td>
                        <ActionIcon variant="light" color="blue">
                          <IconExternalLink size={18} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Stack>

        {/* MODAL: CREATE TICKET */}
        <Modal opened={createOpened} onClose={closeCreate} title="Open Enterprise Support Ticket" centered radius="lg" size="lg">
          <form onSubmit={createForm.onSubmit((v) => createTicketMutation.mutate(v))}>
            <Stack>
              <Group grow>
                <Select label="Issue Category" {...createForm.getInputProps('category')} data={[
                  { value: 'payment', label: 'Payment & Billing' },
                  { value: 'technical', label: 'Technical Infrastructure' },
                  { value: 'account', label: 'Account Security' },
                  { value: 'general', label: 'General Inquiry' },
                ]} required />
                <Select label="Request Priority" {...createForm.getInputProps('priority')} data={[
                  { value: 'low', label: 'Low - Informational' },
                  { value: 'medium', label: 'Medium - Functional' },
                  { value: 'high', label: 'High - Operational Block' },
                  { value: 'emergency', label: 'Emergency - Immediate Action' },
                ]} required />
              </Group>
              <TextInput label="Subject Line" placeholder="Short summary of the issue" {...createForm.getInputProps('subject')} required />
              <Textarea label="Detailed Description" placeholder="Please provide as much context as possible..." minRows={5} {...createForm.getInputProps('description')} required />
              
              <Alert icon={<IconHelp size={16} />} color="blue" variant="light">
                Your SLA deadline will be calculated based on priority level.
              </Alert>

              <Button type="submit" fullWidth size="lg" loading={createTicketMutation.isPending} style={{ backgroundColor: '#002e6d' }}>
                 Dispatch Support Ticket
              </Button>
            </Stack>
          </form>
        </Modal>

        {/* MODAL: VIEW TICKET & CONVERSATION */}
        <Modal opened={viewOpened} onClose={closeView} title={selectedTicket?.subject} size="70%" radius="lg" padding="0">
          {selectedTicket && (
            <Grid gutter="0">
              <Grid.Col span={4} style={{ borderRight: '1px solid #e5e5e5' }} p="xl" bg="gray.0">
                 <Stack gap="xl">
                    <Stack gap="xs">
                        <Text size="xs" fw={700} c="dimmed">TICKET PARAMETERS</Text>
                        <Group justify="space-between">
                            <Text size="sm">Status</Text>
                            {getStatusBadge(selectedTicket.status)}
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm">Priority</Text>
                            {getPriorityBadge(selectedTicket.priority)}
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm">Category</Text>
                            <Badge variant="outline" color="gray" tt="capitalize">{selectedTicket.category}</Badge>
                        </Group>
                    </Stack>

                    <Divider />

                    <Stack gap="xs">
                        <Text size="xs" fw={700} c="dimmed">SLA DEADLINE</Text>
                        <Group gap="xs">
                            <IconClock size={16} color="red" />
                            <Text size="sm" fw={700}>{dayjs(selectedTicket.slaDeadline).format('MMM D, HH:mm')}</Text>
                        </Group>
                    </Stack>

                    <Divider />

                    <Stack gap="xs">
                        <Text size="xs" fw={700} c="dimmed">ISSUE CONTEXT</Text>
                        <Text size="sm" lineClamp={8}>{selectedTicket.description}</Text>
                    </Stack>
                 </Stack>
              </Grid.Col>

              <Grid.Col span={8} p={0}>
                  <Stack gap={0} h="100%">
                      <ScrollArea h={450} p="xl" bg="white">
                          <Stack gap="lg">
                              {/* INITIAL DESCRIPTION */}
                              <Paper withBorder p="md" radius="md" style={{ alignSelf: 'flex-start', maxWidth: '85%', backgroundColor: '#f1f3f5' }}>
                                  <Group gap="xs" mb={4}>
                                      <Text size="xs" fw={700}>SYSTEM INITIALIZATION</Text>
                                      <Text size="xs" c="dimmed">{dayjs(selectedTicket.createdAt).format('MMM D, HH:mm')}</Text>
                                  </Group>
                                  <Text size="sm">{selectedTicket.description}</Text>
                              </Paper>

                              {/* MESSAGES */}
                              {messages.map((msg: any) => (
                                  <Paper 
                                      key={msg.id} 
                                      withBorder 
                                      p="md" 
                                      radius="md" 
                                      shadow="xs"
                                      style={{ 
                                          alignSelf: msg.senderId === selectedTicket.userId ? 'flex-start' : 'flex-end',
                                          maxWidth: '85%',
                                          backgroundColor: msg.senderId === selectedTicket.userId ? '#ffffff' : '#e7f5ff',
                                          borderLeft: msg.senderId === selectedTicket.userId ? '4px solid #dee2e6' : '4px solid #339af0'
                                      }}
                                  >
                                      <Group justify="space-between" mb={4}>
                                          <Group gap="xs">
                                              {msg.senderId !== selectedTicket.userId && <Badge size="xs" color="blue">Agent Response</Badge>}
                                              <Text size="xs" fw={700}>{msg.senderId === selectedTicket.userId ? 'Client Payload' : 'Support Intelligence'}</Text>
                                          </Group>
                                          <Text size="xs" c="dimmed">{dayjs(msg.createdAt).format('HH:mm')}</Text>
                                      </Group>
                                      <Text size="sm">{msg.body}</Text>
                                  </Paper>
                              ))}
                          </Stack>
                      </ScrollArea>

                      <Paper p="xl" style={{ borderTop: '1px solid #e5e5e5' }}>
                          <form onSubmit={messageForm.onSubmit((v) => sendMessageMutation.mutate(v.body))}>
                              <Group align="flex-end" wrap="nowrap">
                                  <Textarea 
                                      placeholder="Communication input..." 
                                      style={{ flex: 1 }} 
                                      minRows={2} 
                                      maxRows={5} 
                                      {...messageForm.getInputProps('body')}
                                      onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              messageForm.onSubmit((v) => sendMessageMutation.mutate(v.body))();
                                          }
                                      }}
                                  />
                                  <ActionIcon 
                                      type="submit" 
                                      size={50} 
                                      radius="md" 
                                      color="blue" 
                                      variant="filled" 
                                      loading={sendMessageMutation.isPending}
                                  >
                                      <IconSend size={24} />
                                  </ActionIcon>
                              </Group>
                          </form>
                      </Paper>
                  </Stack>
              </Grid.Col>
            </Grid>
          )}
        </Modal>
      </Container>
    </DashboardLayout>
  );
});

export default SupportPage;
