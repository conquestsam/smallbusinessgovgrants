'use client';

import {
  Modal, Button, Stack, Text, Group, TextInput, ActionIcon,
  Tooltip, Box, Divider, Paper, ThemeIcon, FileButton, Image,
  Alert, Loader, Center, Badge, Select, NumberInput, CopyButton, Tabs
} from '@mantine/core';
import { 
  IconCopy, IconCheck, IconQrcode, IconCloudUpload, 
  IconAlertCircle, IconCreditCard, IconSeeding, IconConfetti,
  IconBuildingBank, IconShieldCheck, IconCurrencyBitcoin,
  IconLock, IconWallet, IconArrowRight
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { notifications } from '@mantine/notifications';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentFlowModalProps {
  opened: boolean;
  onClose: () => void;
  method: any;
  wallets: any[];
}

// Reusable copy-to-clipboard row component
const CopyableField = ({ label, value }: { label: string; value: string }) => (
  <Group justify="space-between" p="sm" style={{ borderRadius: 8, background: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gray-2)' }}>
    <div style={{ overflow: 'hidden', flex: 1 }}>
      <Text size="xs" c="dimmed" fw={600} tt="uppercase">{label}</Text>
      <Text size="sm" fw={600} truncate style={{ fontFamily: 'monospace' }}>{value}</Text>
    </div>
    <CopyButton value={value} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
          <ActionIcon color={copied ? 'teal' : 'primary'} variant="light" onClick={copy} size="lg" radius="md">
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  </Group>
);

export const PaymentFlowModal = ({ opened, onClose, method, wallets }: PaymentFlowModalProps) => {
  const { width, height } = useWindowSize();
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (opened) {
      setStep('details');
      setReceiptFile(null);
      setShowConfetti(false);
      if (method?.methodName === 'crypto' && wallets.length > 0) {
        setSelectedWallet(wallets[0]);
      }
    }
  }, [opened, method, wallets]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({ message: 'Copied to clipboard', color: 'blue' });
  };

  const handleSubmitReceipt = async () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setStep('success');
      setShowConfetti(true);
      notifications.show({ 
        title: 'Payment Proof Submitted', 
        message: 'Your payment will be verified within 15-30 minutes.', 
        color: 'green' 
      });
    }, 2000);
  };

  // ─── CRYPTO FLOW ──────────────────────────────────────────
  const renderCryptoFlow = () => (
    <Stack gap="lg">
      {/* Wallet Selector */}
      {wallets.length > 1 && (
        <Select
          label="Select Cryptocurrency"
          placeholder="Choose wallet"
          leftSection={<IconCurrencyBitcoin size={16} />}
          data={wallets.map((w: any) => ({
            value: w.id,
            label: `${w.symbol} — ${w.network}`,
          }))}
          value={selectedWallet?.id}
          onChange={(val) => {
            const wallet = wallets.find((w: any) => w.id === val);
            setSelectedWallet(wallet);
          }}
        />
      )}

      <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <IconWallet size={18} color="var(--mantine-color-blue-6)" />
            <Text size="sm" fw={700}>{selectedWallet?.symbol} Deposit</Text>
          </Group>
          <Badge color="blue" size="sm" variant="light">{selectedWallet?.network}</Badge>
        </Group>

        {/* QR Code */}
        <Stack align="center" py="lg">
          <Box p={12} bg="white" style={{ borderRadius: 12, border: '2px solid var(--mantine-color-blue-2)', boxShadow: '0 4px 12px rgba(0,94,162,0.1)' }}>
            <QRCodeSVG value={selectedWallet?.address || ''} size={200} level="H" />
          </Box>
          <Text size="xs" c="dimmed" fw={500}>Scan QR code with your wallet app</Text>
        </Stack>

        <Divider label="OR COPY ADDRESS MANUALLY" labelPosition="center" my="sm" />

        {/* Copy Address */}
        <CopyableField label="Wallet Address" value={selectedWallet?.address || ''} />
      </Paper>

      {/* Network Warning */}
      <Alert icon={<IconAlertCircle size={16} />} title="Important" color="orange" variant="light" radius="md">
        <Text size="sm">
          Only send <b>{selectedWallet?.symbol}</b> over the <b>{selectedWallet?.network}</b> network. 
          Sending on the wrong network will result in <b>permanent loss of funds</b>.
        </Text>
      </Alert>

      {/* Processing Info */}
      <Paper withBorder p="sm" radius="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Processing Time</Text>
          <Text size="xs" fw={600}>10-30 minutes</Text>
        </Group>
        <Group justify="space-between" mt={4}>
          <Text size="xs" c="dimmed">Network Fee</Text>
          <Text size="xs" fw={600}>Varies by network</Text>
        </Group>
        <Group justify="space-between" mt={4}>
          <Text size="xs" c="dimmed">Minimum Deposit</Text>
          <Text size="xs" fw={600}>$10.00 equivalent</Text>
        </Group>
      </Paper>

      <Button fullWidth size="lg" rightSection={<IconArrowRight size={18} />} onClick={() => setStep('confirm')}>
        I Have Completed This Payment
      </Button>
    </Stack>
  );

  // ─── STRIPE FLOW ──────────────────────────────────────────
  const [stripeAmount, setStripeAmount] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);

  const handleStripeCheckout = async () => {
    if (!stripeAmount || Number(stripeAmount) < 1) {
      notifications.show({ message: 'Please enter a valid amount (min $1)', color: 'red' });
      return;
    }
    setStripeLoading(true);
    try {
      const response = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(stripeAmount) }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        notifications.show({ message: data.message || 'Checkout failed', color: 'red' });
      }
    } catch {
      notifications.show({ message: 'Network error', color: 'red' });
    } finally {
      setStripeLoading(false);
    }
  };

  const renderStripeFlow = () => (
    <Stack gap="xl" py="md">
      {/* Header */}
      <Stack align="center" gap="xs">
        <Box
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #635bff 0%, #0a2540 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconCreditCard size={40} color="white" />
        </Box>
        <Text fw={700} size="xl">Secure Card Payment</Text>
        <Text size="sm" c="dimmed" ta="center">
          Powered by Stripe — PCI-DSS Level 1 compliant
        </Text>
      </Stack>

      {/* Amount Input */}
      <TextInput
        label="Deposit Amount (USD)"
        placeholder="Enter amount"
        type="number"
        min={1}
        size="lg"
        value={stripeAmount}
        onChange={(e) => setStripeAmount(e.currentTarget.value)}
        leftSection={<Text fw={700} size="lg">$</Text>}
        styles={{ input: { fontSize: '1.25rem', fontWeight: 600 } }}
      />

      {/* Trust Badges */}
      <Group justify="center" gap="lg">
        <Group gap={4}>
          <IconShieldCheck size={16} color="var(--mantine-color-green-6)" />
          <Text size="xs" c="dimmed">256-bit SSL</Text>
        </Group>
        <Group gap={4}>
          <IconLock size={16} color="var(--mantine-color-green-6)" />
          <Text size="xs" c="dimmed">PCI Certified</Text>
        </Group>
        <Group gap={4}>
          <IconCheck size={16} color="var(--mantine-color-green-6)" />
          <Text size="xs" c="dimmed">Instant</Text>
        </Group>
      </Group>

      {/* Checkout Button */}
      <Button 
        fullWidth size="lg"
        leftSection={<IconCreditCard size={20} />}
        loading={stripeLoading}
        onClick={handleStripeCheckout}
        style={{ background: 'linear-gradient(135deg, #635bff 0%, #0a2540 100%)' }}
      >
        Proceed to Secure Checkout
      </Button>

      {/* Info */}
      <Paper withBorder p="sm" radius="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Processing Time</Text>
          <Text size="xs" fw={600} c="green">Instant</Text>
        </Group>
        <Group justify="space-between" mt={4}>
          <Text size="xs" c="dimmed">Payment Methods</Text>
          <Text size="xs" fw={600}>Visa, Mastercard, Amex</Text>
        </Group>
        <Group justify="space-between" mt={4}>
          <Text size="xs" c="dimmed">Transaction Fee</Text>
          <Text size="xs" fw={600}>2.9% + $0.30</Text>
        </Group>
      </Paper>
    </Stack>
  );

  // ─── MANUAL / BANK TRANSFER FLOW ──────────────────────────
  const renderManualFlow = () => (
    <Stack gap="lg">
      {/* Header */}
      <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #e6f0ff 0%, #f8f9fa 100%)' }}>
        <Group gap="sm" mb="md">
          <ThemeIcon size={40} radius="md" color="primary" variant="light">
            <IconBuildingBank size={22} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="lg">{method?.displayName || 'Bank Transfer'}</Text>
            <Text size="xs" c="dimmed">Follow the instructions below to complete your payment</Text>
          </div>
        </Group>

        {/* Bank Details from method config */}
        {method?.accountName && <CopyableField label="Account Name" value={method.accountName} />}
        {method?.accountNumber && (
          <Box mt="xs">
            <CopyableField label="Account Number" value={method.accountNumber} />
          </Box>
        )}
        {method?.routingNumber && (
          <Box mt="xs">
            <CopyableField label="Routing Number" value={method.routingNumber} />
          </Box>
        )}
        {method?.bankName && (
          <Box mt="xs">
            <CopyableField label="Bank Name" value={method.bankName} />
          </Box>
        )}
        {method?.swiftCode && (
          <Box mt="xs">
            <CopyableField label="SWIFT/BIC Code" value={method.swiftCode} />
          </Box>
        )}
      </Paper>

      {/* Instructions */}
      {method?.instructions && (
        <Paper withBorder p="md" radius="md">
          <Text size="sm" fw={700} mb="xs">Payment Instructions</Text>
          <div 
            dangerouslySetInnerHTML={{ __html: method.instructions }} 
            style={{ fontSize: '14px', color: '#495057', lineHeight: '1.6' }} 
          />
        </Paper>
      )}

      {/* Processing Details */}
      <Paper withBorder p="sm" radius="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Processing Time</Text>
          <Text size="xs" fw={600}>{method?.processingTime || '1-3 business days'}</Text>
        </Group>
        <Group justify="space-between" mt={4}>
          <Text size="xs" c="dimmed">Minimum Deposit</Text>
          <Text size="xs" fw={600}>{method?.minimumAmount ? `$${method.minimumAmount}` : '$50.00'}</Text>
        </Group>
        <Group justify="space-between" mt={4}>
          <Text size="xs" c="dimmed">Fee</Text>
          <Text size="xs" fw={600} c="green">{method?.fee || 'Free'}</Text>
        </Group>
      </Paper>

      <Button fullWidth size="lg" rightSection={<IconArrowRight size={18} />} onClick={() => setStep('confirm')}>
        I Have Made This Payment
      </Button>
    </Stack>
  );

  // ─── CONFIRM STEP ─────────────────────────────────────────
  const renderConfirmStep = () => (
    <Stack gap="md">
      <Stack align="center" py="md">
        <ThemeIcon size={60} radius="md" color="primary" variant="light">
          <IconSeeding size={30} />
        </ThemeIcon>
        <Text fw={700} size="lg">Submit Proof of Payment</Text>
        <Text size="xs" c="dimmed" ta="center">
          Upload your transaction receipt or screenshot to fast-track verification.
        </Text>
      </Stack>

      <Paper withBorder p="xl" radius="md" style={{ borderStyle: 'dashed', textAlign: 'center', borderColor: receiptFile ? 'var(--mantine-color-green-5)' : undefined }}>
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
                  <IconCloudUpload size={40} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={600}>Select Receipt Image</Text>
                  <Text size="xs" c="dimmed">JPG, PNG, PDF (Max 5MB)</Text>
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
          onClick={handleSubmitReceipt}
          leftSection={<IconCheck size={18} />}
        >
          Confirm & Submit Payment
        </Button>
      )}
      
      <Button variant="subtle" color="gray" onClick={() => setStep('details')}>← Back to Payment Details</Button>
    </Stack>
  );

  // ─── SUCCESS STEP ─────────────────────────────────────────
  const renderSuccessStep = () => (
    <Stack align="center" py={40} gap="xl">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} gravity={0.15} />}
      
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
        <Text fw={800} size="xl">Payment Recorded!</Text>
        <Text size="sm" c="dimmed" ta="center" maw={350}>
          Our accounting department is now verifying your transaction. 
          You will receive an email notification once approved.
        </Text>
      </Stack>

      <Badge size="lg" variant="light" color="green">Verification in Progress</Badge>

      <Button fullWidth size="lg" variant="light" onClick={onClose}>
        Return to Dashboard
      </Button>
    </Stack>
  );

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={step === 'success' ? null : `Pay with ${method?.displayName || method?.methodName?.toUpperCase()}`}
      centered 
      radius="lg"
      size="md"
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'details' && (
            method?.methodName === 'crypto' ? renderCryptoFlow() :
            method?.methodName === 'stripe' ? renderStripeFlow() :
            renderManualFlow()
          )}

          {step === 'confirm' && renderConfirmStep()}

          {step === 'success' && renderSuccessStep()}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};
