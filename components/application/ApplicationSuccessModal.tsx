'use client';

// [SAFETY CHECKLIST]
// - [ ] No existing test fails.
// - [ ] No public interface changes unless approved.
// - [ ] No new runtime exceptions possible.

// [WHY] Simplified ApplicationSuccessModal — shows ONLY essential info:
// SUCCESS: confetti + success message + amount applied for + application code
// FAILURE: error icon + failure message
// [WHAT] Removed: fee breakdown, payment method selection, countdown timer, receipt upload
// Those concerns are now handled entirely by the Funding page (PaymentFlowModal)

import {
  Modal, Stack, Text, Button, ThemeIcon, Badge, Paper, Group, Divider,
} from '@mantine/core';
import {
  IconCheck, IconAlertCircle, IconArrowRight,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { motion } from 'framer-motion';

interface ApplicationSuccessModalProps {
  opened: boolean;
  onClose: () => void;
  application: any;
}

export const ApplicationSuccessModal = ({ opened, onClose, application }: ApplicationSuccessModalProps) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  // [WHY] Determine success/failure from application status
  const isSuccess = application?.status !== 'rejected' && application?.status !== 'failed';

  useEffect(() => {
    if (opened && isSuccess) {
      setShowConfetti(true);
    }
    return () => setShowConfetti(false);
  }, [opened, isSuccess]);

  if (!application) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size="md"
      padding="xl"
      withCloseButton
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      {isSuccess ? (
        /* ─── SUCCESS VIEW ─────────────────────────────────── */
        <Stack align="center" py="xl" gap="lg">
          {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} gravity={0.12} />}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          >
            <ThemeIcon size={100} radius={50} color="green" variant="light">
              <IconCheck size={60} />
            </ThemeIcon>
          </motion.div>

          <Stack align="center" gap="xs">
            <Text fw={800} size="xl" ta="center">Application Submitted Successfully!</Text>
            <Text size="sm" c="dimmed" ta="center" maw={380}>
              Your grant application has been received and is now under review by our team.
            </Text>
          </Stack>

          {/* Application Code */}
          <Badge size="xl" variant="light" color="blue" radius="md" py="md" px="lg">
            Application ID: {application?.applicationId || 'N/A'}
          </Badge>

          {/* Amount Applied For */}
          <Paper withBorder p="lg" radius="md" w="100%" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <Group justify="center" gap="md">
              <Text size="sm" c="dimmed" fw={600}>Amount Applied For:</Text>
              <Text size="xl" fw={800} c="green.8">
                ${Number(application?.requestedAmount || 0).toLocaleString()}
              </Text>
            </Group>
          </Paper>

          <Divider w="100%" />

          <Text size="xs" c="dimmed" ta="center" maw={350}>
            You will be notified by email once your application has been reviewed. 
            Please visit the Funding page to complete any required payments.
          </Text>

          <Button
            fullWidth size="lg" variant="light" onClick={onClose}
            style={{ color: '#005ea2' }}
          >
            Return to Dashboard
          </Button>
        </Stack>
      ) : (
        /* ─── FAILURE VIEW ─────────────────────────────────── */
        <Stack align="center" py="xl" gap="lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          >
            <ThemeIcon size={100} radius={50} color="red" variant="light">
              <IconAlertCircle size={60} />
            </ThemeIcon>
          </motion.div>

          <Stack align="center" gap="xs">
            <Text fw={800} size="xl" c="red" ta="center">Application Submission Failed</Text>
            <Text size="sm" c="dimmed" ta="center" maw={380}>
              We encountered an issue while processing your application. Please try again or contact our support team for assistance.
            </Text>
          </Stack>

          {application?.applicationId && (
            <Badge size="lg" variant="light" color="red" radius="md">
              Reference: {application.applicationId}
            </Badge>
          )}

          <Button
            fullWidth size="lg" variant="light" color="red" onClick={onClose}
          >
            Close & Try Again
          </Button>
        </Stack>
      )}
    </Modal>
  );
};
