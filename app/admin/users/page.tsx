// NEW FILE: Admin user management page
'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Card, Table, Badge, Button, Group, Text, Modal, TextInput, Select, Avatar, ActionIcon, Menu, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconDots, IconEdit, IconLock, IconTrash, IconUserPlus, IconPlus } from '@tabler/icons-react';
import { UserModal } from '@/components/modals/UserModal';

const AdminUsersPage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [userModalOpened, setUserModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, authStore.isAdmin, router]);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: authStore.isAdmin,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'User updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      close();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to update user',
        color: 'red',
      });
    },
  });

  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return null;
  }

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setUserModalOpened(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setModalMode('edit');
    setUserModalOpened(true);
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green',
      });

      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete user',
        color: 'red',
      });
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Password reset email sent',
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reset password',
        color: 'red',
      });
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'red' : 'blue';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'red';
  };

  return (
    <DashboardLayout>
      <Container size="xl">
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} c="#002e6d">
              User Management
            </Title>
            <Text c="dimmed" size="lg">
              Manage all system users and their permissions
            </Text>
          </div>
          <Button
            leftSection={<IconUserPlus size={16} />}
            style={{ backgroundColor: '#005ea2' }}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Group>

        <Card withBorder radius="md" shadow="sm">
          <ScrollArea>
            <Table style={{ minWidth: 800 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last Login</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((user: any) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Group>
                      <Avatar
                        src={user.avatar}
                        size="sm"
                        radius="xl"
                        color="blue"
                      >
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Avatar>
                      <div>
                        <Text fw={500}>{user.firstName} {user.lastName}</Text>
                        <Text size="xs" c="dimmed">ID: {user.id.slice(0, 8)}...</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{user.phone || 'Not provided'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getRoleColor(user.role)} variant="light">
                      {user.role.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(user.isActive)} variant="light">
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => handleEditUser(user)}
                        >
                          Edit User
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconLock size={14} />}
                          onClick={() => handleResetPassword(user.id)}
                        >
                          Reset Password
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => handleDeleteUser(user)}
                        >
                          Deactivate
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          </ScrollArea>
        </Card>

        <Modal opened={opened} onClose={close} title={editMode ? "Edit User" : "Add New User"} size="lg">
          {/* User edit/add form would go here */}
          <Text>User management form implementation</Text>
        </Modal>

        <UserModal
          opened={userModalOpened}
          onClose={() => setUserModalOpened(false)}
          user={selectedUser}
          mode={modalMode}
          onSuccess={() => {
            refetch();
            setUserModalOpened(false);
          }}
        />
      </Container>
    </DashboardLayout>
  );
});

export default AdminUsersPage;