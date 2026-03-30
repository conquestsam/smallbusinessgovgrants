'use client';

import { observer } from 'mobx-react-lite';
import {
  Container, Title, Card, Stepper, Button, Group, Text, Paper, Box,
  Stack, ThemeIcon, Badge, Divider, Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { BusinessInfoStep } from '@/components/application/BusinessInfoStep';
import { FinancialInfoStep } from '@/components/application/FinancialInfoStep';
import { DocumentsStep } from '@/components/application/DocumentsStep';
import { ReviewStep } from '@/components/application/ReviewStep';
import { SiteTour } from '@/components/ui/SiteTour';
import {
  IconFileText, IconCurrencyDollar, IconCloudUpload, IconChecklist,
  IconArrowRight, IconArrowLeft, IconSend, IconShieldCheck,
  IconInfoCircle, IconSparkles,
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const stepMeta = [
  {
    label: 'Business Information',
    description: 'Basic business details',
    icon: <IconFileText size={18} />,
    tip: 'Provide accurate business information as it appears on your tax documents.',
  },
  {
    label: 'Financial Information',
    description: 'Grant details and funding',
    icon: <IconCurrencyDollar size={18} />,
    tip: 'Be as specific as possible about the intended use of grant funds.',
  },
  {
    label: 'Documents',
    description: 'Upload required documents',
    icon: <IconCloudUpload size={18} />,
    tip: 'Upload clear, legible scans. We accept PDF, JPG, and PNG formats.',
  },
  {
    label: 'Review & Submit',
    description: 'Review your application',
    icon: <IconChecklist size={18} />,
    tip: 'Double-check all information before submitting. You cannot edit after submission.',
  },
];

const ApplyPage = observer(() => {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const form = useForm({
    initialValues: {
      businessName: '',
      businessType: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      taxId: '',
      yearsInBusiness: '',
      numberOfEmployees: '',
      requestedAmount: '',
      purpose: '',
      businessPlan: '',
      useOfFunds: '',
      documents: [],
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
    },
    validate: (values) => {
      const errors: any = {};
      if (active === 0) {
        if (!values.businessName) errors.businessName = 'Business name is required';
        if (!values.businessType) errors.businessType = 'Business type is required';
        if (!values.businessAddress) errors.businessAddress = 'Business address is required';
        if (!values.taxId) errors.taxId = 'Tax ID is required';
      }
      if (active === 1) {
        if (!values.requestedAmount) errors.requestedAmount = 'Requested amount is required';
        if (!values.purpose) errors.purpose = 'Purpose is required';
        if (!values.useOfFunds) errors.useOfFunds = 'Use of funds is required';
      }
      return errors;
    },
  });

  if (!authStore.isAuthenticated) return null;

  const nextStep = () => {
    const validation = form.validate();
    if (!validation.hasErrors) {
      setActive((current) => (current < 3 ? current + 1 : current));
    }
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const applicationId = `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const userEmail = authStore.user?.email;
      if (!userEmail) {
        throw new Error('User email not found. Please ensure you are logged in.');
      }

      const applicationData = {
        ...form.values,
        applicationId,
        userId: authStore.user?.id,
        userEmail,
        status: 'pending',
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Application Submitted',
          message: `Your application ${applicationId} has been submitted successfully! Check your email for confirmation.`,
          color: 'green',
        });
        router.push('/dashboard/applications');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      notifications.show({
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'There was an error submitting your application. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercent = Math.round(((active + 1) / 4) * 100);

  return (
    <DashboardLayout>
      <Container size="lg" py="xl">
        <SiteTour page="applications" />

        {/* Header */}
        <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            radius="lg" p="xl" mb="lg"
            style={{
              background: 'linear-gradient(135deg, #002e6d 0%, #005ea2 60%, #0076d6 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <Box style={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }}>
              <div>
                <Group gap="sm" mb={4}>
                  <IconSparkles size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Text size="sm" fw={500} style={{ color: 'rgba(255,255,255,0.7)' }}>SBA Grant Program</Text>
                </Group>
                <Title order={2} c="white" fw={800}>Grant Application</Title>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Complete all steps to submit your Small Business Administration grant application.
                </Text>
              </div>
              <Stack align="center" gap={4} visibleFrom="sm">
                <Badge size="xl" variant="white" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '1.1rem' }}>
                  {completionPercent}%
                </Badge>
                <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Complete</Text>
              </Stack>
            </Group>
          </Paper>
        </MotionDiv>

        {/* Step Tip */}
        <MotionDiv
          key={`tip-${active}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            variant="light"
            radius="md"
            mb="md"
          >
            <Text size="sm"><b>Step {active + 1}:</b> {stepMeta[active].tip}</Text>
          </Alert>
        </MotionDiv>

        {/* Main Application Card */}
        <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card withBorder radius="lg" shadow="sm" p="xl">
            {/* Stepper */}
            <Stepper
              active={active}
              onStepClick={setActive}
              mb="xl"
              color="primary"
              styles={{
                stepIcon: {
                  borderWidth: 2,
                },
                stepLabel: {
                  fontWeight: 600,
                },
                stepDescription: {
                  fontSize: '0.75rem',
                },
                separator: {
                  marginLeft: 4,
                  marginRight: 4,
                },
              }}
            >
              {stepMeta.map((step, i) => (
                <Stepper.Step
                  key={i}
                  label={step.label}
                  description={step.description}
                  icon={step.icon}
                  completedIcon={step.icon}
                >
                  <AnimatePresence mode="wait">
                    <MotionDiv
                      key={`step-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Box pt="lg">
                        {i === 0 && <BusinessInfoStep form={form} />}
                        {i === 1 && <FinancialInfoStep form={form} />}
                        {i === 2 && <DocumentsStep form={form} />}
                        {i === 3 && <ReviewStep form={form} />}
                      </Box>
                    </MotionDiv>
                  </AnimatePresence>
                </Stepper.Step>
              ))}
            </Stepper>

            <Divider my="lg" />

            {/* Navigation Buttons */}
            <Group justify="space-between">
              <div>
                {active > 0 && (
                  <Button
                    variant="light"
                    color="gray"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={prevStep}
                    size="md"
                  >
                    Back
                  </Button>
                )}
              </div>

              <Group gap="md">
                {/* Step indicator */}
                <Text size="sm" c="dimmed" visibleFrom="sm">
                  Step {active + 1} of 4
                </Text>

                {active < 3 ? (
                  <Button
                    color="primary"
                    rightSection={<IconArrowRight size={16} />}
                    onClick={nextStep}
                    size="md"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    color="green"
                    leftSection={<IconSend size={16} />}
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    size="md"
                  >
                    Submit Application
                  </Button>
                )}
              </Group>
            </Group>
          </Card>
        </MotionDiv>

        {/* Security Footer */}
        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Group justify="center" gap="xl" mt="lg" py="md">
            <Group gap={6}>
              <IconShieldCheck size={16} color="var(--mantine-color-green-6)" />
              <Text size="xs" c="dimmed" fw={500}>256-bit SSL Encrypted</Text>
            </Group>
            <Group gap={6}>
              <IconFileText size={16} color="var(--mantine-color-blue-6)" />
              <Text size="xs" c="dimmed" fw={500}>HIPAA Compliant</Text>
            </Group>
            <Group gap={6}>
              <IconShieldCheck size={16} color="var(--mantine-color-teal-6)" />
              <Text size="xs" c="dimmed" fw={500}>Data Protected</Text>
            </Group>
          </Group>
        </MotionDiv>
      </Container>
    </DashboardLayout>
  );
});

export default ApplyPage;