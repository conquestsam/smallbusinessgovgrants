'use client';

import { useState } from 'react';
import {
  Container, Card, Title, TextInput, Button, Text, Anchor,
  Group, Alert, Stack, ThemeIcon, Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconMail, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Please enter a valid email'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
          {success ? (
            <Stack align="center" py="xl" gap="lg">
              <ThemeIcon size={80} radius={40} color="green" variant="light">
                <IconCheck size={40} />
              </ThemeIcon>
              <Title order={2} ta="center" c="#002e6d">Check Your Email</Title>
              <Text ta="center" c="dimmed" maw={400}>
                If an account with that email exists, we have sent a password reset link. 
                Please check your inbox and spam folder.
              </Text>
              <Button
                component={Link}
                href="/login"
                variant="light"
                leftSection={<IconArrowLeft size={16} />}
                mt="md"
              >
                Back to Sign In
              </Button>
            </Stack>
          ) : (
            <>
              <Stack align="center" mb="xl">
                <ThemeIcon size={60} radius={30} color="blue" variant="light">
                  <IconMail size={30} />
                </ThemeIcon>
                <Title order={2} c="#002e6d">Forgot Password?</Title>
                <Text c="dimmed" ta="center" maw={400}>
                  Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                </Text>
              </Stack>

              {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} color="red" mb="md">
                  {error}
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                  required
                  label="Email Address"
                  placeholder="your@email.com"
                  size="md"
                  mb="xl"
                  {...form.getInputProps('email')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={isLoading}
                  style={{ backgroundColor: '#005ea2' }}
                >
                  Send Reset Link
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
          )}
        </Card>
      </Container>
    </div>
  );
}
