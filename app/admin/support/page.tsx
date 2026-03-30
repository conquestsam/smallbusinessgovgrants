'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Container, Title, Card, Stack, Text, Group, Button, 
  Badge, Table, Modal, TextInput, Textarea, Select, Grid,
  Divider, ActionIcon, Paper, SimpleGrid, 
  ThemeIcon, Box, ScrollArea, Avatar, Indicator,
  Tabs, Center, RingProgress, Alert
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  IconMessageCircle, IconShield, IconFilter,
  IconCheck, IconX, IconClock, IconTag, IconLink,
  IconCornerDownRight, IconNotes, IconUser, IconSend,
  IconHistory, IconAlertTriangle
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { SBALoader } from '@/components/ui/SBALoader';
import { useRouter } from 'next/navigation';

const AdminSupportQueuePage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // FETCH ADMIN QUEUE
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets', filterStatus],
    queryFn: async () => {
      const response = await fetch(`/api/admin/support/tickets?status=${filterStatus}`);
      return response.json();
    },
  });

  // FETCH MESSAGES
  const { data: messages = [] } = useQuery({
    queryKey: ['ticket-messages', selectedTicketId],
    queryFn: async () => {
      const response = await fetch(`/api/support/tickets/${selectedTicketId}/messages`);
      return response.json();
    },
    enabled: !!selectedTicketId && viewOpened,
  });

  // TICKET ACTIONS
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Status Updated', message: 'Ticket reflects new operational state.', color: 'blue' });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
  });

  // SEND MESSAGE MUTATION
  const sendMessageMutation = useMutation({
    mutationFn: async ({ body, type = 'public' }: any) => {
      const response = await fetch(`/api/support/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, type }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', selectedTicketId] });
      messageForm.reset();
    },
  });

  const messageForm = useForm({
    initialValues: { body: '', type: 'public' },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="filled" color="blue">Pending Response</Badge>;
      case 'in_progress': return <Badge variant="light" color="orange">Active Conversation</Badge>;
      case 'resolved': return <Badge variant="outline" color="green">Resolved</Badge>;
      case 'closed': return <Badge variant="outline" color="gray">Closed</Badge>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency': return <Badge color="red" variant="filled">CRITICAL</Badge>;
      case 'high': return <Badge color="red" variant="light">High</Badge>;
      case 'medium': return <Badge color="yellow" variant="light">Medium</Badge>;
      case 'low': return <Badge color="gray" variant="light">Low</Badge>;
      default: return null;
    }
  };

  const selectedTicket = tickets.find((t: any) => t.id === selectedTicketId);

  // SLA METRICS (Mock/Derived)
  const stats = {
    open: tickets.filter((t:any) => t.status === 'open').length,
    high: tickets.filter((t:any) => t.priority === 'high' || t.priority === 'emergency').length,
    avgResolveTime: '4.2h'
  };

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={1} c="#002e6d" fw={800}>Administrative Command Center</Title>
              <Text c="dimmed">Global support queue management and SLA integrity monitoring.</Text>
            </div>
            <Group>
                <Select 
                    label="Queue Filter" 
                    value={filterStatus} 
                    onChange={(v) => setFilterStatus(v || 'all')} 
                    data={[
                        { value: 'all', label: 'Global View' },
                        { value: 'open', label: 'Unassigned/Open' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'resolved', label: 'Resolved History' }
                    ]}
                />
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              <Paper withBorder p="md" radius="md">
                  <Group justify="space-between">
                      <Text size="xs" c="dimmed" fw={700}>PENDING DISPATCH</Text>
                      <RingProgress size={40} thickness={4} sections={[{ value: (stats.open / (tickets.length || 1)) * 100, color: 'blue' }]} />
                  </Group>
                  <Title order={2} mt={-10}>{stats.open}</Title>
                  <Text size="xs" c="dimmed">Requiring immediate attention</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                  <Group justify="space-between">
                      <Text size="xs" c="dimmed" fw={700}>HIGH PRIORITY NODES</Text>
                      <RingProgress size={40} thickness={4} sections={[{ value: (stats.high / (tickets.length || 1)) * 100, color: 'red' }]} />
                  </Group>
                  <Title order={2} mt={-10}>{stats.high}</Title>
                  <Text size="xs" c="dimmed">Escalated SLA targets</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                  <Group justify="space-between">
                      <Text size="xs" c="dimmed" fw={700}>AVG RESOLUTION CYCLE</Text>
                      <ThemeIcon variant="light" color="teal"><IconCheck size={16} /></ThemeIcon>
                  </Group>
                  <Title order={2} mt={10}>{stats.avgResolveTime}</Title>
                  <Text size="xs" c="dimmed">Efficiency performance index</Text>
              </Paper>
          </SimpleGrid>

          <Card withBorder radius="lg" shadow="sm">
            <Group justify="space-between" mb="xl">
              <Group>
                <IconShield size={24} color="#005ea2" />
                <Title order={3}>Operational Queue</Title>
              </Group>
              <Badge variant="dot" color="blue">Secure Environment</Badge>
            </Group>

            {isLoading ? (
               <Box py="xl"><SBALoader variant="inline" message="Polling central infrastructure..." /></Box>
            ) : (
                <Table verticalSpacing="md" highlightOnHover>
                    <Table.Thead bg="gray.1">
                        <Table.Tr>
                            <Table.Th>SLA Deadline</Table.Th>
                            <Table.Th>User Intelligence</Table.Th>
                            <Table.Th>Subject</Table.Th>
                            <Table.Th>Priority</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {tickets.map((ticket: any) => (
                            <Table.Tr key={ticket.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedTicketId(ticket.id); openView(); }}>
                                <Table.Td>
                                    <Group gap="xs">
                                        <IconClock size={16} color={dayjs().isAfter(dayjs(ticket.slaDeadline)) ? 'red' : 'gray'} />
                                        <Text size="sm" fw={700} c={dayjs().isAfter(dayjs(ticket.slaDeadline)) ? 'red' : 'inherit'}>
                                            {dayjs(ticket.slaDeadline).format('HH:mm (D MMM)')}
                                        </Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="sm">
                                        <Avatar size="sm" radius="xl">{ticket.userName.charAt(0)}</Avatar>
                                        <div>
                                            <Text size="sm" fw={600}>{ticket.userName}</Text>
                                            <Text size="xs" c="dimmed">{ticket.userEmail}</Text>
                                        </div>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" fw={700}>{ticket.subject}</Text>
                                    <Text size="xs" c="dimmed">ID: #{ticket.id.slice(0, 8)}</Text>
                                </Table.Td>
                                <Table.Td>{getPriorityBadge(ticket.priority)}</Table.Td>
                                <Table.Td>{getStatusBadge(ticket.status)}</Table.Td>
                                <Table.Td>
                                    <ActionIcon variant="light" color="blue"><IconCornerDownRight size={18} /></ActionIcon>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
          </Card>
        </Stack>

        {/* MODAL: ADMIN VIEW & TRIAGE */}
        <Modal opened={viewOpened} onClose={closeView} title={`Triage: ${selectedTicket?.subject}`} size="80%" radius="lg" padding="0">
            {selectedTicket && (
                <Grid gutter="0">
                     <Grid.Col span={3} p="xl" bg="gray.0" style={{ borderRight: '1px solid #e5e5e5' }}>
                        <Stack gap="xl">
                            <Stack gap="xs">
                                <Text size="xs" fw={700} c="dimmed">INTERVENTION STATUS</Text>
                                <Select 
                                    value={selectedTicket.status} 
                                    onChange={(v) => updateStatusMutation.mutate({ id: selectedTicket.id, status: v })}
                                    data={[
                                        { value: 'open', label: 'Open / Pending' },
                                        { value: 'in_progress', label: 'Active Investigation' },
                                        { value: 'resolved', label: 'Resolved' },
                                        { value: 'closed', label: 'Archived' }
                                    ]}
                                />
                            </Stack>

                            <Divider />

                            <Stack gap="xs">
                                <Text size="xs" fw={700} c="dimmed">USER ANATOMY</Text>
                                <Group wrap="nowrap">
                                    <Avatar size="md" radius="xl" />
                                    <Box style={{ overflow: 'hidden' }}>
                                        <Text size="sm" fw={700} truncate>{selectedTicket.userName}</Text>
                                        <Text size="xs" c="blue" style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/users/${selectedTicket.userId}`)}>View Full Profile</Text>
                                    </Box>
                                </Group>
                            </Stack>

                            <Divider />

                            <Stack gap="xs">
                                <Text size="xs" fw={700} c="dimmed">ORIGINAL PAYLOAD</Text>
                                <Box p="sm" bg="white" style={{ borderRadius: 8, border: '1px solid #dee2e6' }}>
                                    <Text size="sm" fs="italic">&quot;{selectedTicket.description}&quot;</Text>
                                </Box>
                            </Stack>

                            <Button variant="light" color="red" fullWidth leftSection={<IconAlertTriangle size={16} />}>
                                Escalated Intervention
                            </Button>
                        </Stack>
                     </Grid.Col>

                     <Grid.Col span={9} p={0}>
                        <Stack gap={0} h="100%">
                            <ScrollArea h={500} p="xl" bg="white">
                                <Stack gap="lg">
                                    <Center><Badge variant="outline" color="gray">Conversation Intelligence Thread Started</Badge></Center>
                                    
                                    {messages.map((msg: any) => (
                                        <Paper 
                                            key={msg.id} 
                                            withBorder 
                                            p="md" 
                                            radius="md" 
                                            style={{ 
                                                alignSelf: msg.senderId === selectedTicket.userId ? 'flex-start' : 'flex-end',
                                                maxWidth: '75%',
                                                backgroundColor: msg.type === 'internal_note' ? '#fff9db' : msg.senderId === selectedTicket.adminId ? '#e7f5ff' : '#ffffff',
                                                borderRight: msg.senderId !== selectedTicket.userId ? '4px solid #339af0' : 'none',
                                                borderLeft: msg.senderId === selectedTicket.userId ? '4px solid #dee2e6' : 'none'
                                            }}
                                        >
                                            <Group justify="space-between" mb={4}>
                                                <Group gap="xs">
                                                    {msg.type === 'internal_note' && <IconNotes size={14} color="orange" />}
                                                    <Text size="xs" fw={700}>{msg.senderId === selectedTicket.userId ? 'User Payload' : 'Agent Dispatch'}</Text>
                                                </Group>
                                                <Text size="xs" c="dimmed">{dayjs(msg.createdAt).format('HH:mm')}</Text>
                                            </Group>
                                            <Text size="sm">{msg.body}</Text>
                                        </Paper>
                                    ))}
                                </Stack>
                            </ScrollArea>

                            <Paper p="xl" bg="gray.1" style={{ borderTop: '1px solid #e5e5e5' }}>
                                <form onSubmit={messageForm.onSubmit((v) => sendMessageMutation.mutate(v))}>
                                    <Stack gap="xs">
                                        <Tabs value={messageForm.values.type} onChange={(v) => messageForm.setFieldValue('type', v || 'public')}>
                                            <Tabs.List>
                                                <Tabs.Tab value="public" leftSection={<IconMessageCircle size={14} />}>Public Dispatch</Tabs.Tab>
                                                <Tabs.Tab value="internal_note" leftSection={<IconShield size={14} />}>Internal Workspace Note</Tabs.Tab>
                                            </Tabs.List>
                                        </Tabs>
                                        
                                        <Group align="flex-end" wrap="nowrap">
                                            <Textarea 
                                                placeholder={messageForm.values.type === 'public' ? "Type response to user..." : "Internal notes for other admins..."}
                                                style={{ flex: 1 }}
                                                minRows={3}
                                                {...messageForm.getInputProps('body')}
                                            />
                                            <ActionIcon type="submit" size={60} radius="md" color={messageForm.values.type === 'public' ? "blue" : "yellow"} variant="filled" loading={sendMessageMutation.isPending}>
                                                <IconSend size={28} />
                                            </ActionIcon>
                                        </Group>
                                    </Stack>
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

export default AdminSupportQueuePage;
