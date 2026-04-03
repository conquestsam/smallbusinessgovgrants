'use client';

// [SAFETY CHECKLIST]
// - [ ] No existing test fails.
// - [ ] No public interface changes unless approved.
// - [ ] No new runtime exceptions possible.

// [WHY] This modal replaces the simple redirect after application submission
// [WHAT] Shows confetti → fee breakdown ($400) → payment method selection → countdown timer → receipt upload
// [HOW] Uses admin-driven settings via /api/deposits/config endpoint with fallback defaults

import {
  Modal, Stack, Text, Group, Button, Paper, ThemeIcon, Badge,
  FileButton, Box, Alert, Divider, Center, RingProgress
} from '@mantine/core';
import {
  IconCheck, IconConfetti, IconCurrencyBitcoin, IconBrandPaypal,
  IconBuildingBank, IconCloudUpload, IconClock, IconAlertCircle,
  IconArrowRight, IconShieldCheck, IconReceipt,
} from '@tabler/icons-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { motion } from 'framer-motion';
import { authStore } from '@/lib/stores/auth.store';

interface ApplicationSuccessModalProps {
  opened: boolean;
  onClose: () => void;
  application: any;
}

// [WHY] Define payment method options with logos and admin-driven account details
// [WHAT] Each method maps to a display name, icon component, color, and description
const PAYMENT_METHODS = [
  {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    // [WHY] Using Tabler icon for BTC — no external image dependency
    icon: <IconCurrencyBitcoin size={28} />,
    color: '#f7931a',
    bg: '#fff8ee',
    description: 'Pay with Bitcoin cryptocurrency',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    // [WHY] Using a custom SVG-style approach for PayPal since Tabler has IconBrandPaypal
    icon: <IconBrandPaypal size={28} />,
    color: '#003087',
    bg: '#e8f0fe',
    description: 'Pay via PayPal transfer',
  },
  {
    id: 'chime',
    name: 'Chime',
    // [WHY] Chime is a manual reference deposit — uses bank icon
    icon: <IconBuildingBank size={28} />,
    color: '#00d54b',
    bg: '#e8fbe8',
    description: 'Manual deposit via Chime',
  },
];

export const ApplicationSuccessModal = ({ opened, onClose, application }: ApplicationSuccessModalProps) => {
  const { width, height } = useWindowSize();
  // [WHY] Step-based flow: success → payment_select → payment_details → uploading → complete
  const [step, setStep] = useState<'success' | 'payment_select' | 'payment_details' | 'uploading' | 'complete' | 'expired'>('success');
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // [WHY] Admin-configurable countdown duration and fee amount with fallback defaults
  const [countdownSeconds, setCountdownSeconds] = useState(600); // Default 10 minutes
  const [feeAmount, setFeeAmount] = useState(400); // Default $400
  const [depositDetails, setDepositDetails] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [depositId, setDepositId] = useState<string | null>(null);

  // [WHY] Fetch admin-configured fee amount and countdown duration on modal open
  // [WHAT] Falls back to $400 and 10 minutes if admin settings are not found
  useEffect(() => {
    if (opened) {
      setStep('success');
      setShowConfetti(true);
      setSelectedMethod(null);
      setReceiptFile(null);
      setDepositId(null);

      // [WHY] Fetch config from system settings — hybrid approach
      fetch('/api/deposits/config')
        .then(res => res.json())
        .then(data => {
          if (data.feeAmount) setFeeAmount(Number(data.feeAmount));
          if (data.countdownMinutes) setCountdownSeconds(Number(data.countdownMinutes) * 60);
        })
        .catch(() => {
          // [WHY] Fallback to defaults if config endpoint fails
          console.log('Using default fee ($400) and countdown (10 min)');
        });
    }

    return () => {
      // [WHY] Clean up countdown timer on unmount or modal close
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [opened]);

  // [WHY] Start countdown timer when user selects a payment method and gets deposit details
  const startCountdown = useCallback((durationSeconds: number) => {
    setTimeLeft(durationSeconds);
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // [WHY] Timer expired — show deposit fail state
          clearInterval(countdownRef.current!);
          setStep('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // [WHY] Format seconds into MM:SS display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // [WHY] Handle payment method selection — create deposit record and start countdown
  const handleSelectMethod = async (methodId: string) => {
    setSelectedMethod(methodId);

    try {
      // [WHAT] Create a deposit record in the DB and get admin account details for the chosen method
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authStore.user?.id,
          applicationId: application?.id,
          paymentMethod: methodId,
          amount: feeAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDepositId(data.deposit?.id);
        setDepositDetails(data.depositDetails || {});
        setStep('payment_details');
        // [WHY] Start the countdown timer — user has limited time to complete payment
        startCountdown(countdownSeconds);
      } else {
        notifications.show({
          title: 'Error',
          message: data.message || 'Failed to initiate deposit',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Network error. Please try again.',
        color: 'red',
      });
    }
  };

  // [WHY] Handle receipt upload — upload to server and update deposit status
  const handleUploadReceipt = async () => {
    if (!receiptFile || !depositId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('depositId', depositId);

      const response = await fetch('/api/deposits/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // [WHY] Stop countdown — receipt has been submitted
        if (countdownRef.current) clearInterval(countdownRef.current);
        setStep('complete');
        notifications.show({
          title: 'Receipt Submitted',
          message: 'Your deposit receipt has been sent for review. You will be notified once verified.',
          color: 'green',
        });
      } else {
        const data = await response.json();
        notifications.show({
          title: 'Upload Failed',
          message: data.message || 'Failed to upload receipt.',
          color: 'red',
        });
      }
    } catch {
      notifications.show({
        title: 'Upload Failed',
        message: 'Network error uploading receipt.',
        color: 'red',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ─── STEP 1: SUCCESS + CONFETTI ─────────────────────────────
  const renderSuccessStep = () => (
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
        <Text fw={800} size="xl">Application Submitted!</Text>
        <Text size="sm" c="dimmed" ta="center" maw={380}>
          Your grant application <strong>{application?.applicationId}</strong> has been received successfully.
        </Text>
      </Stack>

      <Badge size="lg" variant="light" color="green">Application ID: {application?.applicationId}</Badge>

      {/* [WHY] Fee breakdown card — explains why $400 is needed */}
      <Paper withBorder p="lg" radius="md" w="100%" style={{ background: '#f8fafc' }}>
        <Text fw={700} c="#002e6d" mb="sm">Processing Fee Breakdown</Text>
        <Divider mb="sm" />
        <Stack gap={6}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Professional Review</Text>
            <Text size="sm" fw={600}>Included</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Filing & Documentation</Text>
            <Text size="sm" fw={600}>Included</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Grant Processing</Text>
            <Text size="sm" fw={600}>Included</Text>
          </Group>
          <Divider my={4} />
          <Group justify="space-between">
            <Text fw={700} size="md">Total Processing Fee</Text>
            <Text fw={800} size="lg" c="green">${feeAmount.toLocaleString()}</Text>
          </Group>
        </Stack>
      </Paper>

      <Button
        fullWidth size="lg"
        rightSection={<IconArrowRight size={18} />}
        onClick={() => setStep('payment_select')}
        style={{ backgroundColor: '#005ea2' }}
      >
        Proceed to Payment
      </Button>
    </Stack>
  );

  // ─── STEP 2: PAYMENT METHOD SELECTION ────────────────────────
  const renderPaymentSelectStep = () => (
    <Stack gap="lg">
      <Stack align="center" gap="xs">
        <Text fw={800} size="lg" c="#002e6d">Select Payment Method</Text>
        <Text size="sm" c="dimmed" ta="center">
          Choose your preferred method to pay the ${feeAmount} processing fee
        </Text>
      </Stack>

      <Stack gap="sm">
        {PAYMENT_METHODS.map((method) => (
          <Paper
            key={method.id}
            withBorder
            p="lg"
            radius="md"
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: selectedMethod === method.id ? `2px solid ${method.color}` : undefined,
              background: method.bg,
            }}
            onClick={() => handleSelectMethod(method.id)}
          >
            <Group justify="space-between">
              <Group gap="md">
                {/* [WHY] Display payment method logo/icon with brand color */}
                <ThemeIcon
                  size={50}
                  radius="md"
                  variant="light"
                  style={{ backgroundColor: 'white', color: method.color, border: '1px solid #e5e5e5' }}
                >
                  {method.icon}
                </ThemeIcon>
                <div>
                  <Text fw={700} size="md">{method.name}</Text>
                  <Text size="xs" c="dimmed">{method.description}</Text>
                </div>
              </Group>
              <IconArrowRight size={18} color="gray" />
            </Group>
          </Paper>
        ))}
      </Stack>

      {/* Trust badges */}
      <Group justify="center" gap="lg" mt="sm">
        <Group gap={4}>
          <IconShieldCheck size={14} color="var(--mantine-color-green-6)" />
          <Text size="xs" c="dimmed">Secure Payment</Text>
        </Group>
        <Group gap={4}>
          <IconReceipt size={14} color="var(--mantine-color-blue-6)" />
          <Text size="xs" c="dimmed">Instant Receipt</Text>
        </Group>
      </Group>
    </Stack>
  );

  // ─── STEP 3: PAYMENT DETAILS + COUNTDOWN ─────────────────────
  const renderPaymentDetailsStep = () => {
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);

    // [WHY] Calculate countdown progress for the ring indicator
    const progress = countdownSeconds > 0 ? (timeLeft / countdownSeconds) * 100 : 0;
    const isUrgent = timeLeft < 120; // Less than 2 minutes

    return (
      <Stack gap="lg">
        {/* Countdown Timer */}
        <Paper
          p="lg" radius="md" withBorder
          style={{
            background: isUrgent ? '#fff5f5' : '#f0fdf4',
            borderColor: isUrgent ? '#fc8181' : '#86efac',
          }}
        >
          <Group justify="center" gap="lg">
            <RingProgress
              size={80}
              thickness={6}
              roundCaps
              sections={[{ value: progress, color: isUrgent ? 'red' : 'green' }]}
              label={
                <Center>
                  <IconClock size={24} color={isUrgent ? 'red' : 'green'} />
                </Center>
              }
            />
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">Time Remaining</Text>
              <Text size="xl" fw={800} c={isUrgent ? 'red' : 'green'}>
                {formatTime(timeLeft)}
              </Text>
              <Text size="xs" c="dimmed">
                Complete payment before timer expires
              </Text>
            </div>
          </Group>
        </Paper>

        {/* Payment details from admin config */}
        <Paper withBorder p="lg" radius="md" style={{ background: method?.bg }}>
          <Group gap="md" mb="md">
            <ThemeIcon
              size={40} radius="md" variant="light"
              style={{ backgroundColor: 'white', color: method?.color }}
            >
              {method?.icon}
            </ThemeIcon>
            <div>
              <Text fw={700}>{method?.name} Payment</Text>
              <Text size="xs" c="dimmed">Send exactly ${feeAmount} to the details below</Text>
            </div>
          </Group>

          <Divider mb="md" />

          {/* [WHY] Display admin-provided deposit details for the selected payment method */}
          {depositDetails?.accountDetails ? (
            <Stack gap="xs">
              {Object.entries(depositDetails.accountDetails).map(([key, value]) => (
                <Group key={key} justify="space-between" p="xs"
                  style={{ background: 'white', borderRadius: 6, border: '1px solid #e5e5e5' }}
                >
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Text size="sm" fw={600} style={{ fontFamily: 'monospace' }}>
                    {String(value)}
                  </Text>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Deposit details will be provided by admin. Please check back shortly.
            </Text>
          )}
        </Paper>

        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Important"
          color="orange"
          variant="light"
          radius="md"
        >
          <Text size="sm">
            Send exactly <strong>${feeAmount}</strong> using <strong>{method?.name}</strong>. 
            After payment, upload your receipt below before the timer expires.
          </Text>
        </Alert>

        {/* Receipt Upload */}
        <Paper withBorder p="lg" radius="md" style={{ borderStyle: 'dashed', textAlign: 'center' }}>
          <FileButton onChange={setReceiptFile} accept="image/png,image/jpeg,application/pdf">
            {(props) => (
              <Stack align="center" gap="xs" {...props} style={{ cursor: 'pointer' }}>
                {receiptFile ? (
                  <>
                    <ThemeIcon size={50} radius="xl" color="green" variant="light">
                      <IconCheck size={24} />
                    </ThemeIcon>
                    <Text size="sm" fw={600} c="green">{receiptFile.name}</Text>
                    <Text size="xs" c="dimmed">Click to change file</Text>
                  </>
                ) : (
                  <>
                    <IconCloudUpload size={40} color="#005ea2" />
                    <Text size="sm" fw={600}>Upload Payment Receipt</Text>
                    <Text size="xs" c="dimmed">JPG, PNG, or PDF (Max 5MB)</Text>
                  </>
                )}
              </Stack>
            )}
          </FileButton>
        </Paper>

        {receiptFile && (
          <Button
            fullWidth size="lg" color="green"
            loading={isUploading}
            onClick={handleUploadReceipt}
            leftSection={<IconCheck size={18} />}
          >
            Submit Receipt & Confirm Payment
          </Button>
        )}
      </Stack>
    );
  };

  // ─── STEP 4: COMPLETE ────────────────────────────────────────
  const renderCompleteStep = () => (
    <Stack align="center" py="xl" gap="lg">
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
        <Text fw={800} size="xl">Receipt Submitted!</Text>
        <Text size="sm" c="dimmed" ta="center" maw={380}>
          Your payment receipt is being reviewed by our team. You will receive a notification once your deposit is verified.
        </Text>
      </Stack>

      <Badge size="lg" variant="light" color="blue">Verification in Progress</Badge>

      <Button
        fullWidth size="lg" variant="light"
        onClick={onClose}
        style={{ color: '#005ea2' }}
      >
        Return to Dashboard
      </Button>
    </Stack>
  );

  // ─── STEP 5: EXPIRED ──────────────────────────────────────────
  const renderExpiredStep = () => (
    <Stack align="center" py="xl" gap="lg">
      <ThemeIcon size={100} radius={50} color="red" variant="light">
        <IconAlertCircle size={60} />
      </ThemeIcon>

      <Stack align="center" gap="xs">
        <Text fw={800} size="xl" c="red">Deposit Window Expired</Text>
        <Text size="sm" c="dimmed" ta="center" maw={380}>
          The payment window has expired. Please return to your applications page and proceed to make the deposit for your grant application to be processed.
        </Text>
      </Stack>

      <Badge size="lg" variant="light" color="red">Payment Pending</Badge>

      <Button
        fullWidth size="lg" variant="light" color="red"
        onClick={onClose}
      >
        Return to Applications
      </Button>
    </Stack>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={step === 'success' || step === 'complete' || step === 'expired' ? null : 'Application Processing Fee'}
      centered
      radius="lg"
      size="md"
      padding="xl"
      closeOnClickOutside={false}
      closeOnEscape={false}
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      {step === 'success' && renderSuccessStep()}
      {step === 'payment_select' && renderPaymentSelectStep()}
      {step === 'payment_details' && renderPaymentDetailsStep()}
      {step === 'complete' && renderCompleteStep()}
      {step === 'expired' && renderExpiredStep()}
    </Modal>
  );
};
