'use client';

import { Text, Card, Group, Button, List, Alert } from '@mantine/core';
import { IconUpload, IconFile, IconAlertCircle } from '@tabler/icons-react';
import { Dropzone } from '@mantine/dropzone';

interface DocumentsStepProps {
  form: any;
}

export function DocumentsStep({ form }: DocumentsStepProps) {
  const requiredDocuments = [
    'Business License',
    'Tax Returns (Last 2 years)',
    'Financial Statements',
    'Bank Statements (Last 3 months)',
    'Business Plan (if available)',
  ];

  return (
    <div>
      <Alert icon={<IconAlertCircle size="1rem" />} color="blue" mb="md">
        Please upload the required documents. All files should be in PDF, JPG, or PNG format and not exceed 10MB each.
      </Alert>

      <Card withBorder p="md" mb="md">
        <Text fw={600} mb="sm">Required Documents:</Text>
        <List size="sm">
          {requiredDocuments.map((doc, index) => (
            <List.Item key={index}>{doc}</List.Item>
          ))}
        </List>
      </Card>

      <Dropzone
        onDrop={(files) => {
          // Handle file upload logic here
          console.log('Accepted files:', files);
        }}
        onReject={(files) => {
          console.log('Rejected files:', files);
        }}
        maxSize={10 * 1024 ** 2} // 10MB
        accept={['application/pdf', 'image/jpeg', 'image/png']}
        multiple
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload size="3.2rem" stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconFile size="3.2rem" stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload size="3.2rem" stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag documents here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach up to 10 files, each file should not exceed 10MB
            </Text>
          </div>
        </Group>
      </Dropzone>

      <Text size="sm" c="dimmed" mt="md">
        Supported formats: PDF, JPG, PNG • Maximum file size: 10MB
      </Text>
    </div>
  );
}