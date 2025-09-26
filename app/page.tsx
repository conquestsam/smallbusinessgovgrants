'use client';

import VisitorNotification from '@/components/ui/visitorNotification';
import { Container, Title, Text, Button, Group, Card, Grid, ThemeIcon } from '@mantine/core';
import { IconShieldCheck, IconClock, IconUsers, IconTrendingUp } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: IconShieldCheck,
    title: 'Secure & Trusted',
    description: 'Bank-level security for all your grant applications and financial data.',
  },
  {
    icon: IconClock,
    title: 'Fast Processing',
    description: 'Quick approval process with real-time status updates and notifications.',
  },
  {
    icon: IconUsers,
    title: 'Expert Support',
    description: '24/7 support from SBA experts to guide you through the process.',
  },
  {
    icon: IconTrendingUp,
    title: 'Growth Focused',
    description: 'Designed to help small businesses access funding for growth and expansion.',
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <VisitorNotification/>
      {/* Header */}
      <div style={{ backgroundColor: '#002e6d', color: 'white', padding: '1rem 0' }}>
        
        <Container size="lg">
          <Group justify="space-between">
            <Image
              src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg"
              alt="SBA Logo"
              width={150}
              height={50}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <Group>
              <Button component={Link} href="/login" variant="outline" color="white">
                Login
              </Button>
              <Button component={Link} href="/register" color="rgba(0, 94, 162, 1)">
                Register
              </Button>
            </Group>
          </Group>
        </Container>
      </div>

      {/* Hero Section */}
      <div style={{ backgroundColor: '#f8fafc', padding: '4rem 0' }}>
        <Container size="lg">
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <Title size="3rem" fw={900} mb="lg" c="#002e6d">
              Small Business Administration
              <br />
              <Text component="span" c="#005ea2">Grant Management System</Text>
            </Title>
            <Text size="xl" c="gray.6" mb="xl">
              Access federal grants, manage applications, and grow your small business with our 
              comprehensive grant management platform.
            </Text>
            <Group justify="center">
              <Button
                component={Link}
                href="/register"
                size="lg"
                color="#005ea2"
                leftSection={<IconTrendingUp size={20} />}
              >
                Start Your Application
              </Button>
              <Button
                component={Link}
                href="/login"
                size="lg"
                variant="outline"
                color="#002e6d"
              >
                Access Dashboard
              </Button>
            </Group>
          </div>
        </Container>
      </div>

      {/* Features Section */}
      <Container size="lg" py="4rem">
        <Title ta="center" mb="3rem" c="#002e6d">
          Why Choose SBA Grant System?
        </Title>
        <Grid>
          {features.map((feature, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
              <Card h="100%" p="lg" radius="md" withBorder>
                <ThemeIcon size="xl" color="#005ea2" variant="light" mb="md">
                  <feature.icon size={24} />
                </ThemeIcon>
                <Text fw={600} size="lg" mb="xs">
                  {feature.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {feature.description}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <div style={{ backgroundColor: '#002e6d', color: 'white', padding: '3rem 0' }}>
        <Container size="lg" ta="center">
          <Title mb="lg">Ready to Get Started?</Title>
          <Text size="lg" mb="xl" opacity={0.9}>
            Join thousands of small businesses that have successfully accessed federal grants.
          </Text>
          <Button
            component={Link}
            href="/register"
            size="lg"
            color="#005ea2"
            leftSection={<IconShieldCheck size={20} />}
          >
            Create Your Account Today
          </Button>
        </Container>
        
      </div>
    </div>
    
  );
  
}