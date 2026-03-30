'use client';

import { observer } from 'mobx-react-lite';
import { Container, Title, Card, Grid, Switch, Button, Group, PasswordInput, Divider, Text, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconLock, IconBell, IconShield } from '@tabler/icons-react';

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsPage = observer(() => {
  const router = useRouter();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const passwordForm = useForm<PasswordFormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value: string) => (!value ? 'Current password is required' : null),
      newPassword: (value: string) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value: string, values: PasswordFormValues) =>
        value !== values.newPassword ? 'Passwords do not match' : null,
    },
  });

  if (!authStore.isAuthenticated) {
    return null;
  }

  const handlePasswordChange = async (values: PasswordFormValues) => {
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Password updated successfully',
          color: 'green',
        });
        passwordForm.reset();
      } else {
        throw new Error('Failed to update password');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update password',
        color: 'red',
      });
    }
  };

  const handleNotificationSettings = async () => {
    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications,
          smsNotifications,
          twoFactorAuth,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Settings updated successfully',
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update settings',
        color: 'red',
      });
    }
  };

  return (
    <DashboardLayout>
      <Container size="md">
        <Title order={1} c="#002e6d" mb="xl">
          Account Settings
        </Title>

        <Grid>
          <Grid.Col span={12}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Group mb="md">
                <IconLock size={20} />
                <Title order={3}>Security Settings</Title>
              </Group>
              
              <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
                <Grid>
                  <Grid.Col span={12}>
                    <PasswordInput
                      required
                      label="Current Password"
                      {...passwordForm.getInputProps('currentPassword')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <PasswordInput
                      required
                      label="New Password"
                      {...passwordForm.getInputProps('newPassword')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <PasswordInput
                      required
                      label="Confirm New Password"
                      {...passwordForm.getInputProps('confirmPassword')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="flex-end">
                      <Button
                        type="submit"
                        leftSection={<IconLock size={16} />}
                        style={{ backgroundColor: '#005ea2' }}
                      >
                        Update Password
                      </Button>
                    </Group>
                  </Grid.Col>
                </Grid>
              </form>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card withBorder radius="md" shadow="sm" p="xl" mb="md">
              <Group mb="md">
                <IconBell size={20} />
                <Title order={3}>Notification Preferences</Title>
              </Group>

              <Grid>
                <Grid.Col span={12}>
                  <Switch
                    label="Email Notifications"
                    description="Receive email updates about your applications and withdrawals"
                    checked={emailNotifications}
                    onChange={(event) => setEmailNotifications(event.currentTarget.checked)}
                    mb="md"
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Switch
                    label="SMS Notifications"
                    description="Receive text messages for important updates"
                    checked={smsNotifications}
                    onChange={(event) => setSmsNotifications(event.currentTarget.checked)}
                    mb="md"
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Switch
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                    checked={twoFactorAuth}
                    onChange={(event) => setTwoFactorAuth(event.currentTarget.checked)}
                    mb="md"
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Group justify="flex-end">
                    <Button
                      onClick={handleNotificationSettings}
                      leftSection={<IconBell size={16} />}
                      style={{ backgroundColor: '#005ea2' }}
                    >
                      Save Preferences
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card withBorder radius="md" shadow="sm" p="xl">
              <Group mb="md">
                <IconShield size={20} />
                <Title order={3}>Account Management</Title>
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                Manage your account preferences and data
              </Text>

              <Group>
                <Button variant="outline" color="orange">
                  Export My Data
                </Button>
                <Button variant="outline" color="red">
                  Delete Account
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </DashboardLayout>
  );
});

export default SettingsPage;