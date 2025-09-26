'use client';

import { NumberInput, Textarea, Grid, Text, Card } from '@mantine/core';

interface FinancialInfoStepProps {
  form: any;
}

export function FinancialInfoStep({ form }: FinancialInfoStepProps) {
  return (
    <Grid>
      <Grid.Col span={12}>
        <Card withBorder p="md" mb="md" bg="blue.0">
          <Text size="sm" c="blue.7">
            <strong>Grant Information:</strong> SBA grants range from $5,000 to $500,000. 
            Please provide detailed information about your funding needs.
          </Text>
        </Card>
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 6 }}>
        <NumberInput
          required
          label="Requested Amount"
          placeholder="50000"
          min={5000}
          max={500000}
          prefix="$"
          thousandSeparator=","
          {...form.getInputProps('requestedAmount')}
        />
      </Grid.Col>
      
      <Grid.Col span={12}>
        <Textarea
          required
          label="Purpose of Grant"
          placeholder="Describe the main purpose of this grant application..."
          minRows={3}
          {...form.getInputProps('purpose')}
        />
      </Grid.Col>
      
      <Grid.Col span={12}>
        <Textarea
          required
          label="Detailed Use of Funds"
          placeholder="Provide a detailed breakdown of how the funds will be used..."
          minRows={4}
          {...form.getInputProps('useOfFunds')}
        />
      </Grid.Col>
      
      <Grid.Col span={12}>
        <Textarea
          label="Business Plan Summary"
          placeholder="Provide a brief summary of your business plan and growth strategy..."
          minRows={4}
          {...form.getInputProps('businessPlan')}
        />
      </Grid.Col>
    </Grid>
  );
}