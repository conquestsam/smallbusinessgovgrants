'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Container, Card, Title, PasswordInput, Button, Text, Anchor,
  Group, Alert, Stack, ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconLock, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    validate: {
      password: (value: string) =>
        value.length < 6 ? 'Password must be at least 6 characters' : null,
      confirmPassword: (value: string, values: any) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...values }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Stack align="center" py="xl" gap="lg">
        <ThemeIcon size={80} radius={40} color="red" variant="light">
          <IconAlertCircle size={40} />
        </ThemeIcon>
        <Title order={2} ta="center" c="#002e6d">Invalid Reset Link</Title>
        <Text ta="center" c="dimmed">This password reset link is invalid or has expired.</Text>
        <Button component={Link} href="/forgot-password" variant="light" mt="md">
          Request a New Link
        </Button>
      </Stack>
    );
  }

  return success ? (
    <Stack align="center" py="xl" gap="lg">
      <ThemeIcon size={80} radius={40} color="green" variant="light">
        <IconCheck size={40} />
      </ThemeIcon>
      <Title order={2} ta="center" c="#002e6d">Password Reset Successfully</Title>
      <Text ta="center" c="dimmed">
        Your password has been updated. You can now sign in with your new password.
      </Text>
      <Button
        component={Link}
        href="/login"
        size="md"
        mt="md"
        style={{ backgroundColor: '#005ea2' }}
      >
        Go to Sign In
      </Button>
    </Stack>
  ) : (
    <>
      <Stack align="center" mb="xl">
        <ThemeIcon size={60} radius={30} color="blue" variant="light">
          <IconLock size={30} />
        </ThemeIcon>
        <Title order={2} c="#002e6d">Reset Your Password</Title>
        <Text c="dimmed" ta="center" maw={400}>
          Enter a new password for your account.
        </Text>
      </Stack>

      {error && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" mb="md">
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <PasswordInput
          required
          label="New Password"
          placeholder="Enter new password"
          size="md"
          mb="md"
          {...form.getInputProps('password')}
        />

        <PasswordInput
          required
          label="Confirm Password"
          placeholder="Re-enter new password"
          size="md"
          mb="xl"
          {...form.getInputProps('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          size="md"
          loading={isLoading}
          style={{ backgroundColor: '#005ea2' }}
        >
          Reset Password
        </Button>
      </form>

      <Group justify="center" mt="xl">
        <Anchor component={Link} href="/login" c="#005ea2" size="sm">
          <Group gap={4}>
            <IconArrowLeft size={14} />
            Back to Sign In
          </Group>
        </Anchor>
      </Group>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingTop: '2rem' }}>
      <Container size="sm">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Image
            src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg"
            alt="SBA Logo"
            width={200}
            height={67}
            style={{ marginBottom: '1rem' }}
          />
        </div>

        <Card shadow="lg" p="xl" radius="md" withBorder>
          <Suspense fallback={<Text ta="center" py="xl" c="dimmed">Loading...</Text>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </Container>
    </div>
  );
}
