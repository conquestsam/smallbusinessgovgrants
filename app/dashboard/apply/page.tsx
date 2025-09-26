'use client';

import { observer } from 'mobx-react-lite';
import { Container, Title, Card, Stepper, Button, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BusinessInfoStep } from '@/components/application/BusinessInfoStep';
import { FinancialInfoStep } from '@/components/application/FinancialInfoStep';
import { DocumentsStep } from '@/components/application/DocumentsStep';
import { ReviewStep } from '@/components/application/ReviewStep';

const ApplyPage = observer(() => {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
    }
  }, [authStore.isAuthenticated, router]);

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

  if (!authStore.isAuthenticated) {
    return null;
  }

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
      // Generate application ID
      const applicationId = `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const applicationData = {
        ...form.values,
        applicationId,
        userId: authStore.user?.id,
        status: 'pending',
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Application Submitted',
          message: `Your application ${applicationId} has been submitted successfully!`,
          color: 'green',
        });
        router.push('/dashboard/applications');
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      notifications.show({
        title: 'Submission Failed',
        message: 'There was an error submitting your application. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Container size="lg">
        <Title order={1} c="#002e6d" mb="xl" ta="center">
          Grant Application
        </Title>

        <Card withBorder radius="md" shadow="sm" p="xl">
          <Stepper active={active} onStepClick={setActive} mb="xl">
            <Stepper.Step label="Business Information" description="Basic business details">
              <BusinessInfoStep form={form} />
            </Stepper.Step>
            
            <Stepper.Step label="Financial Information" description="Grant details and funding">
              <FinancialInfoStep form={form} />
            </Stepper.Step>
            
            <Stepper.Step label="Documents" description="Upload required documents">
              <DocumentsStep form={form} />
            </Stepper.Step>
            
            <Stepper.Step label="Review & Submit" description="Review your application">
              <ReviewStep form={form} />
            </Stepper.Step>
          </Stepper>

          <Group justify="center" mt="xl">
            {active > 0 && (
              <Button variant="default" onClick={prevStep}>
                Back
              </Button>
            )}
            
            {active < 3 ? (
              <Button onClick={nextStep} style={{ backgroundColor: '#005ea2' }}>
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                style={{ backgroundColor: '#005ea2' }}
              >
                Submit Application
              </Button>
            )}
          </Group>
        </Card>
      </Container>
    </DashboardLayout>
  );
});

export default ApplyPage;