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
  FileInput,
  Avatar,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconUserPlus, IconUpload } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const router = useRouter();

  interface PasswordFormValues {
    firstName:string;
    lastName:string;
    email:string;
    phone:string;
  password: string;
  confirmPassword: string;
  avatar:File|null; 
}

  const form = useForm<PasswordFormValues>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      avatar: null,
    },
    validate: {
      firstName: (value:string) => (value.length < 2 ? 'First name must be at least 2 characters' : null), // Fixed: changed from 6 to 2
      lastName: (value:string) => (value.length < 2 ? 'Last name must be at least 2 characters' : null),
      email: (value:string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value:string) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords did not match' : null,
    },
  });

  // Handle avatar file selection and preview
  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleRegister = async (values: typeof form.values) => {
    setIsLoading(true);
    setError('');

    try {
      // FIXED: Include confirmPassword in FormData
      const formData = new FormData();
      
      // Append each field individually with proper typing
      formData.append('firstName', values.firstName);
      formData.append('lastName', values.lastName);
      formData.append('email', values.email);
      formData.append('phone', values.phone);
      formData.append('password', values.password);
      formData.append('confirmPassword', values.confirmPassword); // ADDED THIS LINE
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
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
        setError(data.error || data.message || 'Registration failed');
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
            <Center mb="xl">
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  src={avatarPreview}
                  size="xl"
                  radius="xl"
                  color="blue"
                  mb="md"
                >
                  {form.values.firstName?.[0]}{form.values.lastName?.[0]}
                </Avatar>
                <FileInput
                  placeholder="Upload profile picture"
                  leftSection={<IconUpload size={16} />}
                  accept="image/*"
                  value={avatarFile}
                  onChange={handleAvatarChange}
                  size="sm"
                  w={200}
                />
              </div>
            </Center>

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  required
                  label="First Name"
                  placeholder="Moore"
                  size="md"
                  {...form.getInputProps('firstName')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  required
                  label="Last Name"
                  placeholder="Hahn"
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