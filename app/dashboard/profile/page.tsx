'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Card, Grid, TextInput, Button, Group, Avatar, FileInput, Alert, Divider, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconUser, IconUpload, IconAlertCircle } from '@tabler/icons-react';

// Define the User type to include the phone property
interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // Make it optional if it might not exist
  avatar?: string;
}

const ProfilePage = observer(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

  const form = useForm({
    initialValues: {
      firstName: authStore.user?.firstName || '',
      lastName: authStore.user?.lastName || '',
      email: authStore.user?.email || '',
      phone: authStore.user?.phone || '',
    },
    validate: {
      firstName: (value) => (value.length < 2 ? 'First name must be at least 2 characters' : null),
      lastName: (value) => (value.length < 2 ? 'Last name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: (data) => {
      authStore.login(data.user);
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile',
        color: 'red',
      });
    },
  });

  if (!authStore.isAuthenticated) {
    return null;
  }

  const handleSubmit = (values: typeof form.values) => {
    updateProfileMutation.mutate(values);
  };

  return (
    <DashboardLayout>
      <Container size="md">
        <Title order={1} c="#002e6d" mb="xl">
          Profile Settings
        </Title>

        <Grid>
          <Grid.Col span={12}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Group mb="xl">
                <Avatar
                  src={authStore.user?.avatar}
                  size="xl"
                  radius="xl"
                  color="blue"
                >
                  {authStore.user?.firstName?.[0]}{authStore.user?.lastName?.[0]}
                </Avatar>
                <div>
                  <Title order={3}>{authStore.fullName}</Title>
                  <Text c="dimmed">{authStore.user?.email}</Text>
                </div>
              </Group>

              <Divider mb="xl" />

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Grid>
                  <Grid.Col span={12}>
                    <FileInput
                      label="Profile Picture"
                      placeholder="Upload new avatar"
                      leftSection={<IconUpload size={16} />}
                      accept="image/*"
                      value={avatarFile}
                      onChange={setAvatarFile}
                      mb="md"
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      required
                      label="First Name"
                      {...form.getInputProps('firstName')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      required
                      label="Last Name"
                      {...form.getInputProps('lastName')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      required
                      label="Email"
                      {...form.getInputProps('email')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      label="Phone"
                      {...form.getInputProps('phone')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="flex-end" mt="xl">
                      <Button
                        variant="default"
                        onClick={() => form.reset()}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        loading={updateProfileMutation.isPending}
                        leftSection={<IconUser size={16} />}
                        style={{ backgroundColor: '#005ea2' }}
                      >
                        Update Profile
                      </Button>
                    </Group>
                  </Grid.Col>
                </Grid>
              </form>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default ProfilePage;