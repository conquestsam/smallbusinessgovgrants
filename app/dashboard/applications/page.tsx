'use client';

// [SAFETY CHECKLIST]
// - [ ] No existing test fails.
// - [ ] No public interface changes unless approved.
// - [ ] No new runtime exceptions possible.

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Title, Card, Group, Button, Badge, Text, Stack,
  ActionIcon, Menu, Paper, ThemeIcon, SimpleGrid, Box, Divider,
} from '@mantine/core';
import {
  IconPlus, IconEye, IconDots, IconFileText,
  IconCurrencyDollar, IconSparkles,
} from '@tabler/icons-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationDetailsModal } from '@/components/modals/ApplicationDetailsModal';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

// [WHY] Interface for typed application data
interface Application {
  id: string;
  applicationId: string;
  businessName: string;
  businessType: string;
  requestedAmount: string;
  approvedAmount?: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  createdAt: string;
  updatedAt: string;
  taxId?: string;
  employeeCount?: string;
  industry?: string;
  useOfFunds?: string;
  documents?: any[];
}

const ApplicationsPage = observer(() => {
  const router = useRouter();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ['user-applications', authStore.user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/applications?userId=${authStore.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: !!authStore.user?.id,
  });

  // [WHY] Handle opening the application details modal
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setModalOpened(true);
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setSelectedApplication(null);
  };

  if (!authStore.isAuthenticated) {
    return null;
  }

  // [WHY] Map status to color for visual differentiation
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'processing': return 'blue';
      default: return 'gray';
    }
  };

  // [WHY] Map status to a user-friendly label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Under Review';
      case 'rejected': return 'Rejected';
      case 'processing': return 'Processing';
      default: return status;
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        {/* Header */}
        <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            radius="lg" p="xl" mb="xl"
            style={{
              background: 'linear-gradient(135deg, #002e6d 0%, #005ea2 60%, #0076d6 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }}>
              <div>
                <Group gap="sm" mb={4}>
                  <IconSparkles size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Text size="sm" fw={500} style={{ color: 'rgba(255,255,255,0.7)' }}>Grant Applications</Text>
                </Group>
                <Title order={2} c="white" fw={800}>My Applications</Title>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Track your submitted grant applications and their status
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                onClick={() => router.push('/dashboard/apply')}
                size="md"
                radius="md"
              >
                New Application
              </Button>
            </Group>
          </Paper>
        </MotionDiv>

        {/* [WHY] Simplified application cards per user request — show only amount + status */}
        {/* [WHAT] Each card shows: Application ID, amount (requested or approved), status badge */}
        {applications.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {applications.map((app: Application, index: number) => (
              <MotionDiv
                key={app.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card
                  withBorder radius="lg" shadow="sm" p="xl" h="100%"
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => handleViewDetails(app)}
                >
                  <Stack justify="space-between" h="100%" gap="md">
                    {/* Top: Status badge + menu */}
                    <Group justify="space-between">
                      <Badge
                        color={getStatusColor(app.status)}
                        variant="light"
                        size="lg"
                        radius="sm"
                      >
                        {getStatusLabel(app.status)}
                      </Badge>
                      <Menu shadow="md" width={180}>
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(app);
                            }}
                          >
                            View Details
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    {/* Center: Amount display — the primary focus */}
                    <Stack align="center" gap={4} py="md">
                      <ThemeIcon
                        size={48}
                        radius="xl"
                        variant="light"
                        color={app.approvedAmount ? 'green' : 'blue'}
                      >
                        <IconCurrencyDollar size={24} />
                      </ThemeIcon>
                      <Text size="xl" fw={800} c={app.approvedAmount ? 'green' : '#002e6d'}>
                        ${Number(app.approvedAmount || app.requestedAmount || 0).toLocaleString()}
                      </Text>
                      <Text size="xs" c="dimmed" fw={500}>
                        {app.approvedAmount ? 'Approved Amount' : 'Requested Amount'}
                      </Text>
                    </Stack>

                    {/* Bottom: App ID */}
                    <Divider />
                    <Text size="xs" c="dimmed" ta="center" fw={500}>
                      {app.applicationId}
                    </Text>
                  </Stack>
                </Card>
              </MotionDiv>
            ))}
          </SimpleGrid>
        ) : (
          <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card withBorder radius="lg" shadow="sm" p="xl">
              <Stack align="center" py="xl" gap="md">
                <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                  <IconFileText size={32} />
                </ThemeIcon>
                <Text fw={600} size="lg" c="#002e6d">
                  No applications yet
                </Text>
                <Text c="dimmed" ta="center" size="sm" maw={400}>
                  Create your first grant application to get started with SBA funding.
                </Text>
                <Button
                  onClick={() => router.push('/dashboard/apply')}
                  style={{ backgroundColor: '#005ea2' }}
                  leftSection={<IconPlus size={16} />}
                  size="md"
                >
                  Create Application
                </Button>
              </Stack>
            </Card>
          </MotionDiv>
        )}

        {/* Application Details Modal */}
        <ApplicationDetailsModal
          opened={modalOpened}
          onClose={handleCloseModal}
          application={selectedApplication}
        />
      </Container>
    </DashboardLayout>
  );
});

export default ApplicationsPage;