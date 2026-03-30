'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import { 
  Container, Title, Card, Table, Badge, Group, Text, 
  Menu, ActionIcon, TextInput, Select, Stack, 
  Pagination, Skeleton, Avatar, ScrollArea, Divider
} from '@mantine/core';
import { 
  IconDots, IconEdit, IconSearch, IconFilter, 
  IconBan, IconUserPause, IconUserCheck, IconUserX, IconTrash 
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminActionModal } from '@/components/modals/AdminActionModal';
import { SBALoader } from '@/components/ui/SBALoader';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUsersPage = observer(() => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionModalOpened, setActionModalOpened] = useState(false);
  const [currentAction, setCurrentAction] = useState<'disable' | 'enable' | 'deactivate' | 'soft_delete' | 'blacklist'>('disable');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', debouncedSearch, statusFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status: statusFilter,
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      return response.json();
    },
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getStatusColor = (user: any) => {
    if (user.isBlacklisted) return 'dark';
    if (user.deletedAt) return 'orange';
    if (user.accountStatus === 'disabled') return 'yellow';
    if (user.accountStatus === 'deactivated') return 'red';
    return user.isActive ? 'green' : 'gray';
  };

  const handleAdminAction = (user: any, action: typeof currentAction) => {
    setSelectedUser(user);
    setCurrentAction(action);
    setActionModalOpened(true);
  };

  return (
    <DashboardLayout>
      <Container size="xl" py="md">
        <Stack gap="lg">
          <Group justify="space-between">
            <Stack gap={0}>
              <Title order={1} c="#002e6d">User Management</Title>
              <Text size="sm" c="dimmed">Manage platform users, lifecycle statuses, and security overrides.</Text>
            </Stack>
          </Group>

          <Card withBorder radius="md" shadow="sm" p={0}>
            <Stack gap={0}>
              {/* Filter Bar */}
              <Group p="md" justify="space-between">
                <Group grow style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Search by name or email..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    radius="md"
                  />
                  <Select
                    placeholder="Filter by Status"
                    leftSection={<IconFilter size={16} />}
                    data={[
                      { value: 'all', label: 'All Users' },
                      { value: 'active', label: 'ActiveOnly' },
                      { value: 'disabled', label: 'Disabled Only' },
                      { value: 'deactivated', label: 'Deactivated Only' },
                    ]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val || 'all')}
                    radius="md"
                  />
                </Group>
                <Select
                  w={120}
                  label="Per page"
                  data={['10', '20', '50']}
                  value={limit.toString()}
                  onChange={(val) => setLimit(parseInt(val || '10'))}
                  radius="md"
                />
              </Group>

              <Divider />

              <ScrollArea>
                <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Role</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Last Login</Table.Th>
                      <Table.Th>Created At</Table.Th>
                      <Table.Th w={80}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {isLoading ? (
                      <Table.Tr>
                        <Table.Td colSpan={7} py="xl">
                          <SBALoader variant="inline" message="Scanning demographic database..." />
                        </Table.Td>
                      </Table.Tr>
                    ) : (data && data.users && data.users.length === 0) ? (
                      <Table.Tr>
                        <Table.Td colSpan={6} py="xl">
                          <Stack align="center" gap="xs">
                            <Text fw={600} c="dimmed">No users found matching filters.</Text>
                          </Stack>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {users.map((user: any) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            layout
                            style={{ cursor: 'default' }}
                          >
                            <Table.Td>
                              <Group gap="sm">
                                <Avatar radius="xl" color="blue">
                                  {user.firstName[0]}{user.lastName[0]}
                                </Avatar>
                                <div>
                                  <Text size="sm" fw={600}>{user.firstName} {user.lastName}</Text>
                                  <Text size="xs" c="dimmed">{user.email}</Text>
                                </div>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color={user.role === 'admin' ? 'red' : 'blue'}>
                                {user.role.toUpperCase()}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={getStatusColor(user)} variant="filled" size="sm">
                                {user.isBlacklisted ? 'BLACKLISTED' : (user.accountStatus || 'ACTIVE').toUpperCase()}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{new Date(user.createdAt).toLocaleDateString()}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Menu position="bottom-end" shadow="md">
                                <Menu.Target>
                                  <ActionIcon variant="subtle" color="gray">
                                    <IconDots size={18} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Label>Security Controls</Menu.Label>
                                  {user.accountStatus !== 'active' ? (
                                    <Menu.Item
                                      leftSection={<IconUserCheck size={14} />}
                                      color="green"
                                      onClick={() => handleAdminAction(user, 'enable')}
                                    >
                                      Re-activate Account
                                    </Menu.Item>
                                  ) : (
                                    <Menu.Item
                                      leftSection={<IconUserPause size={14} />}
                                      color="orange"
                                      onClick={() => handleAdminAction(user, 'disable')}
                                    >
                                      Disable Temporarily
                                    </Menu.Item>
                                  )}
                                  <Menu.Item
                                    leftSection={<IconBan size={14} />}
                                    color="red"
                                    onClick={() => handleAdminAction(user, 'blacklist')}
                                  >
                                    Enforce Blacklist
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconUserX size={14} />}
                                    color="red"
                                    onClick={() => handleAdminAction(user, 'deactivate')}
                                  >
                                    Liquidate Session
                                  </Menu.Item>
                                  <Divider />
                                  <Menu.Item
                                    leftSection={<IconTrash size={14} />}
                                    color="red"
                                    onClick={() => handleAdminAction(user, 'soft_delete')}
                                  >
                                    Soft Delete
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
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

        <AdminActionModal
          opened={actionModalOpened}
          onClose={() => setActionModalOpened(false)}
          user={selectedUser}
          action={currentAction}
          onSuccess={() => {
            refetch();
            setActionModalOpened(false);
          }}
        />
      </Container>
    </DashboardLayout>
  );
});

export default AdminUsersPage;