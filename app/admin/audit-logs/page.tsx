'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { 
  Container, Title, Card, Table, Badge, Group, Text, 
  ActionIcon, TextInput, Select, Stack, Modal, Paper,
  Pagination, Skeleton, ScrollArea, Divider, Tooltip, Code
} from '@mantine/core';
import { IconSearch, IconFilter, IconHistory, IconEye, IconUserCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SBALoader } from '@/components/ui/SBALoader';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisclosure } from '@mantine/hooks';

const AuditLogsPage = observer(() => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [metadataModalOpened, { open: openMetadata, close: closeMetadata }] = useDisclosure(false);
  const [viewingLog, setViewingLog] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', debouncedSearch, actionFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        actionType: actionFilter,
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      return response.json();
    },
  });

  const logs = data?.logs || [];
  const actionTypes = data?.actionTypes || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getActionColor = (type: string) => {
    if (type.includes('delete')) return 'red';
    if (type.includes('disable') || type.includes('blacklist')) return 'orange';
    if (type.includes('enable')) return 'green';
    return 'blue';
  };

  return (
    <DashboardLayout>
      <Container size="xl" py="md">
        <Stack gap="lg">
          <Group justify="space-between">
            <Stack gap={0}>
              <Title order={1} c="#002e6d">Audit Log Explorer</Title>
              <Text size="sm" c="dimmed">Complete historical record of administrative actions and platform security events.</Text>
            </Stack>
          </Group>

          <Card withBorder radius="md" shadow="sm" p={0}>
            <Stack gap={0}>
              {/* Filter Bar */}
              <Group p="md" justify="space-between">
                <Group grow style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Search by Target ID or Action..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    radius="md"
                  />
                  <Select
                    placeholder="Filter by Action Type"
                    leftSection={<IconFilter size={16} />}
                    data={[
                      { value: 'all', label: 'All Actions' },
                      ...actionTypes.map((t: string) => ({ value: t, label: t.replace(/_/g, ' ').toUpperCase() }))
                    ]}
                    value={actionFilter}
                    onChange={(val) => setActionFilter(val || 'all')}
                    radius="md"
                    clearable
                  />
                </Group>
              </Group>

              <Divider />

              <ScrollArea>
                <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th>Administrator</Table.Th>
                      <Table.Th>Action Type</Table.Th>
                      <Table.Th>Target Identifier</Table.Th>
                      <Table.Th>Metadata</Table.Th>
                      <Table.Th>Timestamp</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {isLoading ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} py="xl">
                          <SBALoader variant="inline" message="Processing audit sequence..." />
                        </Table.Td>
                      </Table.Tr>
                    ) : logs.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} py="xl">
                          <Stack align="center" gap="xs">
                            <Text fw={600} c="dimmed">No audit logs found.</Text>
                          </Stack>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {logs.map((log: any) => (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            layout
                          >
                            <Table.Td>
                              <Group gap="xs">
                                <IconUserCircle size={18} color="var(--mantine-color-blue-6)" />
                                <div>
                                  <Text size="sm" fw={600}>{log.adminName}</Text>
                                  <Text size="xs" c="dimmed">{log.adminEmail}</Text>
                                </div>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={getActionColor(log.actionType)} variant="light" size="sm">
                                {log.actionType.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                                <Tooltip label={log.targetId} withArrow>
                                    <Text size="xs" style={{ fontFamily: 'monospace' }}>
                                        {log.targetId.slice(0, 12)}...
                                    </Text>
                                </Tooltip>
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs" wrap="nowrap">
                                    {log.metadata?.reason ? (
                                        <Text size="xs" lineClamp={1} c="dimmed" fs="italic">
                                            &quot;{log.metadata.reason}&quot;
                                        </Text>
                                    ) : (
                                        <Text size="xs" c="dimmed">-</Text>
                                    )}
                                    {log.metadata && (
                                        <ActionIcon variant="subtle" size="xs" onClick={() => { setViewingLog(log); openMetadata(); }}>
                                            <IconEye size={12} />
                                        </ActionIcon>
                                    )}
                                </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs">{new Date(log.timestamp).toLocaleString()}</Text>
                            </Table.Td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              <Divider />

              {/* Pagination */}
              <Group p="md" justify="space-between">
                <Text size="sm" c="dimmed">
                  Displaying {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} audit records
                </Text>
                <Pagination 
                  total={totalPages} 
                  value={page} 
                  onChange={setPage} 
                  radius="md"
                  color="blue"
                />
              </Group>
            </Stack>
          </Card>
        </Stack>
      </Container>

      <Modal opened={metadataModalOpened} onClose={closeMetadata} title="Payload Forensic Inspection" centered radius="lg">
        <Stack gap="md">
            <Group justify="space-between">
                <div>
                    <Text size="sm" fw={700}>Action Identifier</Text>
                    <Badge color="blue" size="sm" variant="light">{viewingLog?.actionType.toUpperCase()}</Badge>
                </div>
                <div>
                    <Text size="sm" fw={700} ta="right">Originator</Text>
                    <Text size="xs" c="dimmed">{viewingLog?.adminName}</Text>
                </div>
            </Group>
            <Divider />
            <Text size="sm" fw={700}>Raw Metadata Packet</Text>
            <Paper p="md" bg="gray.9" radius="md">
                <Code block color="gray.0" bg="transparent" h={200} style={{ overflow: 'auto' }}>
                    {JSON.stringify(viewingLog?.metadata, null, 2)}
                </Code>
            </Paper>
            <Text size="xs" c="dimmed">Timestamp: {new Date(viewingLog?.timestamp).toLocaleString()}</Text>
        </Stack>
      </Modal>
    </DashboardLayout>
  );
});

export default AuditLogsPage;
