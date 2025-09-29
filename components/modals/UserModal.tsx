// NEW COMPONENT: User management modal for admin
'use client';

import { Modal, TextInput, Select, Button, Stack, Group, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUser, IconMail, IconPhone, IconMapPin } from '@tabler/icons-react';
import { useState } from 'react';

interface UserModalProps {
  opened: boolean;
  onClose: () => void;
  user?: any;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export function UserModal({ opened, onClose, user, mode, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'user',
      phone: user?.phone || '',
      address: user?.address || '',
      password: '', // Only for create mode
    },
    validate: {
      name: (value:string) => !value ? 'Name is required' : null,
      email: (value:string) => !/^\S+@\S+$/.test(value) ? 'Invalid email' : null,
      password: (value:string) => mode === 'create' && !value ? 'Password is required' : null,
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const url = mode === 'create' 
        ? '/api/admin/users'
        : `/api/admin/users/${user.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to save user');
      }

      notifications.show({
        title: 'Success',
        message: `User ${mode === 'create' ? 'created' : 'updated'} successfully`,
        color: 'green',
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to ${mode} user`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${mode === 'create' ? 'Create' : 'Edit'} User`}
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Full Name"
            placeholder="Enter full name"
            leftSection={<IconUser size={16} />}
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Email Address"
            placeholder="Enter email address"
            leftSection={<IconMail size={16} />}
            required
            {...form.getInputProps('email')}
          />

          <Select
            label="Role"
            placeholder="Select role"
            required
            data={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Administrator' },
            ]}
            {...form.getInputProps('role')}
          />

          <TextInput
            label="Phone Number"
            placeholder="Enter phone number"
            leftSection={<IconPhone size={16} />}
            {...form.getInputProps('phone')}
          />

          <TextInput
            label="Address"
            placeholder="Enter address"
            leftSection={<IconMapPin size={16} />}
            {...form.getInputProps('address')}
          />

          {mode === 'create' && (
            <>
              <TextInput
                label="Password"
                placeholder="Enter password"
                type="password"
                required
                {...form.getInputProps('password')}
              />
              <Alert color="blue" variant="light">
                The user will receive an email with their login credentials.
              </Alert>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading}
              style={{ backgroundColor: '#005ea2' }}
            >
              {mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}