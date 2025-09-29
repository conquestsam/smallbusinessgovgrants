'use client';

import { Modal, Text, Badge, Group, Stack, Divider, ScrollArea, Button } from '@mantine/core';
import { IconCalendar, IconUser, IconBuilding, IconCurrencyDollar, IconFileText } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface ApplicationDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  application: any;
}

export function ApplicationDetailsModal({ opened, onClose, application }: ApplicationDetailsModalProps) {
  if (!application) return null;

  // NEW COMPONENT: Fully responsive modal for application details
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Application Details"
      size="lg"
      centered
      styles={{
        content: {
          maxHeight: '90vh',
        },
        body: {
          padding: 0,
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ScrollArea h={600} p="md">
          <Stack gap="md">
            {/* Header Section */}
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xl" fw={600} c="#002e6d">
                  {application.businessName}
                </Text>
                <Text size="sm" c="dimmed">
                  Application ID: {application.applicationId}
                </Text>
              </div>
              <Badge 
                color={getStatusColor(application.status)} 
                size="lg"
                variant="light"
              >
                {application.status?.toUpperCase()}
              </Badge>
            </Group>

            <Divider />

            {/* Business Information */}
            <div>
              <Text size="lg" fw={500} mb="sm" c="#002e6d">
                <IconBuilding size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Business Information
              </Text>
              <Stack gap="xs" pl="md">
                <Group>
                  <Text fw={500} w={120}>Business Type:</Text>
                  <Text>{application.businessType}</Text>
                </Group>
                <Group>
                  <Text fw={500} w={120}>Tax ID:</Text>
                  <Text>{application.taxId}</Text>
                </Group>
                <Group>
                  <Text fw={500} w={120}>Employees:</Text>
                  <Text>{application.employeeCount}</Text>
                </Group>
                <Group>
                  <Text fw={500} w={120}>Industry:</Text>
                  <Text>{application.industry}</Text>
                </Group>
              </Stack>
            </div>

            <Divider />

            {/* Financial Information */}
            <div>
              <Text size="lg" fw={500} mb="sm" c="#002e6d">
                <IconCurrencyDollar size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Financial Information
              </Text>
              <Stack gap="xs" pl="md">
                <Group>
                  <Text fw={500} w={120}>Requested:</Text>
                  <Text size="lg" fw={600} c="green">
                    ${application.requestedAmount?.toLocaleString()}
                  </Text>
                </Group>
                {application.approvedAmount && (
                  <Group>
                    <Text fw={500} w={120}>Approved:</Text>
                    <Text size="lg" fw={600} c="blue">
                      ${application.approvedAmount?.toLocaleString()}
                    </Text>
                  </Group>
                )}
                <Group>
                  <Text fw={500} w={120}>Purpose:</Text>
                  <Text>{application.purpose}</Text>
                </Group>
              </Stack>
            </div>

            <Divider />

            {/* Use of Funds */}
            <div>
              <Text size="lg" fw={500} mb="sm" c="#002e6d">
                <IconFileText size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Use of Funds
              </Text>
              <Text pl="md">{application.useOfFunds}</Text>
            </div>

            <Divider />

            {/* Timeline */}
            <div>
              <Text size="lg" fw={500} mb="sm" c="#002e6d">
                <IconCalendar size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Timeline
              </Text>
              <Stack gap="xs" pl="md">
                <Group>
                  <Text fw={500} w={120}>Submitted:</Text>
                  <Text>{new Date(application.createdAt).toLocaleDateString()}</Text>
                </Group>
                {application.updatedAt && (
                  <Group>
                    <Text fw={500} w={120}>Last Updated:</Text>
                    <Text>{new Date(application.updatedAt).toLocaleDateString()}</Text>
                  </Group>
                )}
              </Stack>
            </div>

            {/* Documents Section - ENHANCED: Show attached documents */}
            {application.documents && application.documents.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text size="lg" fw={500} mb="sm" c="#002e6d">
                    Attached Documents
                  </Text>
                  <Stack gap="xs" pl="md">
                    {application.documents.map((doc: any, index: number) => (
                      <Group key={index}>
                        <Text fw={500}>{doc.name}</Text>
                        <Badge size="sm" variant="light">
                          {doc.type}
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                </div>
              </>
            )}
          </Stack>
        </ScrollArea>
      </motion.div>
    </Modal>
  );
}