'use client';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Container,
  Card,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Anchor,
  Group,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconLogin } from '@tabler/icons-react';
import { authStore } from '@/lib/stores/auth.store';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const LoginPage = observer(() => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value:string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value:string) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const handleLogin = async (values: typeof form.values) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        authStore.login(data.user);
        notifications.show({
          title: 'Login Successful',
          message: 'Welcome back!',
          color: 'green',
        });
        
        // Redirect based on role
        const redirectPath = data.user.role === 'admin' ? '/admin' : '/dashboard';
        router.push(redirectPath);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Login error:', error);
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
          <Title c="#002e6d">Sign In to Your Account</Title>
          <Text c="dimmed" mt="sm">
            Access your SBA Grant Management dashboard
          </Text>
        </div>

        <Card shadow="lg" p="xl" radius="md" withBorder>
          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleLogin)}>
            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              size="md"
              mb="md"
              {...form.getInputProps('email')}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              size="md"
              mb="xl"
              {...form.getInputProps('password')}
            />

            <Button
              type="submit"
              fullWidth
              size="md"
              loading={isLoading}
              leftSection={<IconLogin size="1rem" />}
              style={{ backgroundColor: '#005ea2' }}
            >
              Sign In
            </Button>
          </form>

          <Group justify="center" mt="xl">
            <Text size="sm" c="dimmed">
              Don't have an account?{' '}
              <Anchor component={Link} href="/register" c="#005ea2" fw={500}>
                Register here
              </Anchor>
            </Text>
          </Group>

          {/* Demo Credentials */}
          {/* <Card mt="xl" bg="gray.0" p="md"> */}
            {/* <Text size="sm" fw={500} mb="xs" c="#002e6d">
              Demo Credentials:
            </Text>
            <Text size="xs" c="dimmed">
              <strong>Admin:</strong> admin@sba.gov / password123
            </Text>
            <Text size="xs" c="dimmed">
              <strong>User:</strong> user@example.com / password123
            </Text> */}
          {/* </Card> */}
        </Card>
      </Container>
    </div>
  );
});

export default LoginPage;