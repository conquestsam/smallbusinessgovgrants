'use client';

import { TextInput, Select, Textarea, Grid, NumberInput } from '@mantine/core';

interface BusinessInfoStepProps {
  form: any;
}

export function BusinessInfoStep({ form }: BusinessInfoStepProps) {
  const businessTypes = [
    'Technology',
    'Manufacturing',
    'Retail',
    'Food Service',
    'Healthcare',
    'Construction',
    'Professional Services',
    'Agriculture',
    'Energy',
    'Transportation',
    'Other',
  ];

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          required
          label="Business Name"
          placeholder="Enter your business name"
          {...form.getInputProps('businessName')}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          required
          label="Business Type"
          placeholder="Select business type"
          data={businessTypes}
          {...form.getInputProps('businessType')}
        />
      </Grid.Col>
      
      <Grid.Col span={12}>
        <Textarea
          required
          label="Business Address"
          placeholder="Enter complete business address"
          minRows={2}
          {...form.getInputProps('businessAddress')}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Business Phone"
          placeholder="+1 (555) 123-4567"
          {...form.getInputProps('businessPhone')}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Business Email"
          placeholder="business@example.com"
          {...form.getInputProps('businessEmail')}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          required
          label="Tax ID / EIN"
          placeholder="XX-XXXXXXX"
          {...form.getInputProps('taxId')}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 6 }}>
        <NumberInput
          label="Years in Business"
          placeholder="5"
          min={0}
          max={100}
          {...form.getInputProps('yearsInBusiness')}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, md: 6 }}>
        <NumberInput
          label="Number of Employees"
          placeholder="10"
          min={1}
          max={10000}
          {...form.getInputProps('numberOfEmployees')}
        />
      </Grid.Col>
    </Grid>
  );
}