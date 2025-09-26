'use client';

import { useState } from 'react';
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
  Grid,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconUserPlus } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      firstName: (value) => (value.length < 2 ? 'First name must be at least 2 characters' : null),
      lastName: (value) => (value.length < 2 ? 'Last name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords did not match' : null,
    },
  });

  const handleRegister = async (values: typeof form.values) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        notifications.show({
          title: 'Registration Successful',
          message: 'Please login with your credentials',
          color: 'green',
        });
        router.push('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingTop: '2rem' }}>
      <Container size="md">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Image
            src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg"
            alt="SBA Logo"
            width={200}
            height={67}
            style={{ marginBottom: '1rem' }}
          />
          <Title c="#002e6d">Create Your Account</Title>
          <Text c="dimmed" mt="sm">
            Join the SBA Grant Management System
          </Text>
        </div>

        <Card shadow="lg" p="xl" radius="md" withBorder>
          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleRegister)}>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  required
                  label="First Name"
                  placeholder="John"
                  size="md"
                  {...form.getInputProps('firstName')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  required
                  label="Last Name"
                  placeholder="Doe"
                  size="md"
                  {...form.getInputProps('lastName')}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              size="md"
              mt="md"
              {...form.getInputProps('email')}
            />

            <TextInput
              label="Phone (Optional)"
              placeholder="+1 (555) 123-4567"
              size="md"
              mt="md"
              {...form.getInputProps('phone')}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Create a strong password"
              size="md"
              mt="md"
              {...form.getInputProps('password')}
            />

            <PasswordInput
              required
              label="Confirm Password"
              placeholder="Confirm your password"
              size="md"
              mt="md"
              mb="xl"
              {...form.getInputProps('confirmPassword')}
            />

            <Button
              type="submit"
              fullWidth
              size="md"
              loading={isLoading}
              leftSection={<IconUserPlus size="1rem" />}
              style={{ backgroundColor: '#005ea2' }}
            >
              Create Account
            </Button>
          </form>

          <Group justify="center" mt="xl">
            <Text size="sm" c="dimmed">
              Already have an account?{' '}
              <Anchor component={Link} href="/login" c="#005ea2" fw={500}>
                Sign in here
              </Anchor>
            </Text>
          </Group>
        </Card>
      </Container>
    </div>
  );
}