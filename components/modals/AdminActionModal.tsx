'use client';

import { Modal, Button, TextInput, Stack, Text, Group, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';

interface AdminActionModalProps {
  opened: boolean;
  onClose: () => void;
  user: any;
  action: 'disable' | 'enable' | 'deactivate' | 'soft_delete' | 'blacklist';
  onSuccess: () => void;
}

export function AdminActionModal({ opened, onClose, user, action, onSuccess }: AdminActionModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      reason: '',
    },
    validate: {
      reason: (value) => (action !== 'enable' && value.length < 5 ? 'Reason must be at least 5 characters' : null),
    },
  });

  const getActionTitle = () => {
    switch (action) {
      case 'disable': return 'Disable Account';
      case 'enable': return 'Enable Account';
      case 'deactivate': return 'Deactivate Account';
      case 'soft_delete': return 'Soft Delete User';
      case 'blacklist': return 'Blacklist User';
      default: return 'Confirm Action';
    }
  };

  const getActionColor = () => {
    if (action === 'enable') return 'green';
    if (action === 'blacklist' || action === 'deactivate') return 'red';
    return 'orange';
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: values.reason,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to perform action');
      }

      notifications.show({
        title: 'Success',
        message: `Account has been ${action}d successfully`,
        color: 'green',
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={getActionTitle()} centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="sm">
            Are you sure you want to <b>{action}</b> the account for <b>{user?.firstName} {user?.lastName}</b> ({user?.email})?
          </Text>

          {action === 'blacklist' && (
            <Alert icon={<IconAlertCircle size={16} />} title="Warning" color="red" variant="filled">
              Blacklisting will prevent this user from accessing the platform entirely and return a silent 404 response.
            </Alert>
          )}

          {action === 'soft_delete' && (
            <Alert icon={<IconAlertCircle size={16} />} title="Soft Delete" color="orange">
              User will be hidden from the platform but preserved in the database for potential restoration.
            </Alert>
          )}

          {action !== 'enable' && (
            <TextInput
              label="Reason"
              placeholder="Provide a reason for this action"
              {...form.getInputProps('reason')}
              required
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
            <Button color={getActionColor()} loading={loading} type="submit">
              Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
