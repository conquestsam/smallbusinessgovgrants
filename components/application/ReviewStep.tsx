'use client';

import { Text, Card, Grid, Divider, Group, Badge } from '@mantine/core';

interface ReviewStepProps {
  form: any;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const { values } = form;

  return (
    <div>
      <Text size="lg" fw={600} mb="md" c="#002e6d">
        Review Your Application
      </Text>
      <Text size="sm" c="dimmed" mb="xl">
        Please review all information before submitting your application.
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder p="md">
            <Text fw={600} mb="sm">Business Information</Text>
            <Divider mb="sm" />
            
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Business Name:</Text>
              <Text size="sm" fw={500}>{values.businessName || 'Not provided'}</Text>
            </Group>
            
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Business Type:</Text>
              <Text size="sm" fw={500}>{values.businessType || 'Not provided'}</Text>
            </Group>
            
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Tax ID:</Text>
              <Text size="sm" fw={500}>{values.taxId || 'Not provided'}</Text>
            </Group>
            
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Years in Business:</Text>
              <Text size="sm" fw={500}>{values.yearsInBusiness || 'Not provided'}</Text>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Employees:</Text>
              <Text size="sm" fw={500}>{values.numberOfEmployees || 'Not provided'}</Text>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder p="md">
            <Text fw={600} mb="sm">Financial Information</Text>
            <Divider mb="sm" />
            
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Requested Amount:</Text>
              <Badge color="blue" variant="light" size="lg">
                ${values.requestedAmount ? Number(values.requestedAmount).toLocaleString() : '0'}
              </Badge>
            </Group>
            
            <Text size="sm" c="dimmed" mb="xs">Purpose:</Text>
            <Text size="sm" mb="md">{values.purpose || 'Not provided'}</Text>
            
            <Text size="sm" c="dimmed" mb="xs">Use of Funds:</Text>
            <Text size="sm" lineClamp={3}>{values.useOfFunds || 'Not provided'}</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card withBorder p="md">
            <Text fw={600} mb="sm">Business Address</Text>
            <Divider mb="sm" />
            <Text size="sm">{values.businessAddress || 'Not provided'}</Text>
          </Card>
        </Grid.Col>

        {values.businessPlan && (
          <Grid.Col span={12}>
            <Card withBorder p="md">
              <Text fw={600} mb="sm">Business Plan Summary</Text>
              <Divider mb="sm" />
              <Text size="sm">{values.businessPlan}</Text>
            </Card>
          </Grid.Col>
        )}
      </Grid>
    </div>
  );
}