'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Title, Card, Group, Text, Stack, SimpleGrid,
  Badge, ThemeIcon, Box, Modal,
  Divider, Tooltip, Alert, Paper, Button,
} from '@mantine/core';
import {
  IconCreditCard, IconWallet, IconBrandStripe, IconCurrencyBitcoin,
  IconCheck, IconInfoCircle, IconArrowRight, IconShieldCheck,
  IconBuildingBank, IconCopy, IconClock, IconReceipt, IconLock,
} from '@tabler/icons-react';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaymentFlowModal } from '@/components/payments/PaymentFlowModal';
import { SBALoader } from '@/components/ui/SBALoader';
import { SiteTour } from '@/components/ui/SiteTour';
import { motion, AnimatePresence } from 'framer-motion';

// [WHY] Payment method logo map — uses Clearbit for real brand logos
const PAYMENT_LOGOS: Record<string, string> = {
  chime: 'https://logo.clearbit.com/chime.com',
  paypal: 'https://logo.clearbit.com/paypal.com',
  cashapp: 'https://logo.clearbit.com/cash.app',
  cash_app: 'https://logo.clearbit.com/cash.app',
  zelle: 'https://logo.clearbit.com/zellepay.com',
  venmo: 'https://logo.clearbit.com/venmo.com',
  apple_pay: 'https://logo.clearbit.com/apple.com',
  google_pay: 'https://logo.clearbit.com/pay.google.com',
  wise: 'https://logo.clearbit.com/wise.com',
  revolut: 'https://logo.clearbit.com/revolut.com',
  stripe: 'https://logo.clearbit.com/stripe.com',
  skrill: 'https://logo.clearbit.com/skrill.com',
};

const FundingPage = observer(() => {
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectModalOpened, setSelectModalOpened] = useState(false);
  const [paymentModalOpened, setPaymentModalOpened] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['public-payment-methods'],
    queryFn: async () => {
      const response = await fetch('/api/payments/methods');
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 30_000, // Poll every 30s for admin changes
  });

  const methods = data?.methods || [];
  const wallets = data?.wallets || [];

  // [WHY] Render actual brand logos — uses native <img> with onError fallback
  const getMethodIcon = (methodName: string, iconUrl?: string, size = 36) => {
    const renderLogo = (src: string, alt: string) => (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{ borderRadius: 6, objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );

    if (iconUrl) return renderLogo(iconUrl, methodName);
    const logoKey = methodName.toLowerCase().replace(/\s+/g, '_');
    const logoUrl = PAYMENT_LOGOS[logoKey];
    if (logoUrl) return renderLogo(logoUrl, methodName);

    switch (methodName.toLowerCase()) {
      case 'stripe': return <IconBrandStripe size={size} color="#635bff" />;
      case 'crypto': return <IconCurrencyBitcoin size={size} color="#f7931a" />;
      case 'wire_transfer':
      case 'bank_transfer': return <IconBuildingBank size={size} color="#002e6d" />;
      default: return <IconCreditCard size={size} color="#002e6d" />;
    }
  };

  const getMethodBadge = (methodName: string) => {
    switch (methodName.toLowerCase()) {
      case 'stripe': return <Badge color="green" variant="light">Instant</Badge>;
      case 'crypto': return <Badge color="orange" variant="light">Decentralized</Badge>;
      case 'wire_transfer': return <Badge color="violet" variant="light">Wire</Badge>;
      default: return <Badge color="blue" variant="light">Secure</Badge>;
    }
  };

  const getMethodDescription = (method: any) => {
    switch (method.methodName?.toLowerCase()) {
      case 'stripe':
        return 'Fast, secure card payments via Stripe. Visa, Mastercard, Amex.';
      case 'crypto':
        return 'Blockchain-based funding. BTC, ETH, USDT supported.';
      case 'wire_transfer':
        return 'Direct wire transfer to our banking partner.';
      case 'bank_transfer':
        return 'ACH bank transfer — reliable and fee-free.';
      default:
        return method.instructions || 'Secure funding channel.';
    }
  };

  // [WHY] Handle payment method selection from the select modal
  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method);
    setSelectModalOpened(false);
    setPaymentModalOpened(true);
  };

  // [WHY] Build a combined list of payment options: methods + crypto wallets
  const hasCryptoMethod = methods.some((m: any) => m.methodName?.toLowerCase() === 'crypto');

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        <SiteTour page="funding" />
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <div>
              <Title order={1} c="#002e6d" fw={800}>Fund Your Account</Title>
              <Text c="dimmed" size="lg">Securely deposit funds to your grant account.</Text>
            </div>
            <Group gap="xs" visibleFrom="sm">
              <IconShieldCheck size={20} color="var(--mantine-color-green-6)" />
              <Text size="sm" fw={600} c="green.8">SSL — 256-bit Encrypted</Text>
            </Group>
          </Group>

          {/* Trust & Security Banner */}
          <Paper
            withBorder radius="lg" p="md"
            style={{ background: 'linear-gradient(135deg, #e6f0ff 0%, #f0fdf4 100%)', borderColor: 'var(--mantine-color-blue-2)' }}
          >
            <Group justify="center" gap="xl" wrap="wrap">
              <Group gap={6}>
                <IconShieldCheck size={18} color="var(--mantine-color-green-6)" />
                <Text size="sm" fw={600} c="green.8">PCI-DSS Compliant</Text>
              </Group>
              <Group gap={6}>
                <IconLock size={18} color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={600} c="blue.8">End-to-End Encrypted</Text>
              </Group>
              <Group gap={6}>
                <IconCheck size={18} color="var(--mantine-color-teal-6)" />
                <Text size="sm" fw={600} c="teal.8">FDIC Insured Partners</Text>
              </Group>
              <Group gap={6}>
                <IconReceipt size={18} color="var(--mantine-color-violet-6)" />
                <Text size="sm" fw={600} c="violet.8">Instant Verification</Text>
              </Group>
            </Group>
          </Paper>

          {/* Main CTA — Open Payment Method Selection Modal */}
          <Paper
            withBorder radius="lg" p="xl"
            style={{
              background: 'linear-gradient(135deg, #002e6d 0%, #005ea2 60%, #0076d6 100%)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={() => setSelectModalOpened(true)}
          >
            <Box style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }}>
              <Group gap="lg">
                <ThemeIcon size={60} radius="xl" variant="light" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <IconCreditCard size={30} color="white" />
                </ThemeIcon>
                <div>
                  <Text fw={800} size="xl" c="white">Make a Deposit</Text>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Select a payment method to fund your account securely
                  </Text>
                </div>
              </Group>
              <Button
                size="lg" radius="md"
                rightSection={<IconArrowRight size={18} />}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                Select Method
              </Button>
            </Group>
          </Paper>

          {/* Available Methods Preview */}
          {!isLoading && (methods.length > 0 || wallets.length > 0) && (
            <Paper withBorder radius="lg" p="xl" style={{ background: '#f8fafc' }}>
              <Text fw={700} size="lg" c="#002e6d" mb="md">Available Payment Methods</Text>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="md">
                {methods.map((method: any) => (
                  <Paper
                    key={method.id}
                    withBorder radius="md" p="md" ta="center"
                    className="payment-card"
                    style={{ cursor: 'pointer', background: 'white' }}
                    onClick={() => {
                      setSelectedMethod(method);
                      setSelectModalOpened(false);
                      setPaymentModalOpened(true);
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <ThemeIcon variant="light" size={48} radius="md" color="gray.0" style={{ border: '1px solid #e5e5e5' }}>
                        {getMethodIcon(method.methodName, method.iconUrl, 28)}
                      </ThemeIcon>
                      <Text fw={600} size="sm" lineClamp={1} style={{ textTransform: 'capitalize' }}>
                        {method.displayName || method.methodName}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
                {/* [WHY] Show crypto wallets as individual method cards if no dedicated crypto method exists */}
                {!hasCryptoMethod && wallets.map((wallet: any) => (
                  <Paper
                    key={wallet.id}
                    withBorder radius="md" p="md" ta="center"
                    className="payment-card"
                    style={{ cursor: 'pointer', background: 'white' }}
                    onClick={() => {
                      // Create a synthetic crypto method for the wallet
                      setSelectedMethod({ methodName: 'crypto', displayName: `${wallet.symbol} (${wallet.network})` });
                      setSelectModalOpened(false);
                      setPaymentModalOpened(true);
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <ThemeIcon variant="light" size={48} radius="md" style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff8ee' }}>
                        <IconCurrencyBitcoin size={28} color="#f7931a" />
                      </ThemeIcon>
                      <Text fw={600} size="sm" lineClamp={1}>{wallet.symbol}</Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>
          )}

          {isLoading && (
            <Box py="xl" ta="center">
              <SBALoader message="Retrieving secure payment configuration..." />
            </Box>
          )}

          {/* VIP Support */}
          <Paper withBorder radius="lg" p="xl" bg="#f1f3f5" style={{ borderStyle: 'dashed' }}>
            <Group justify="space-between" wrap="wrap" gap="md">
              <Stack gap={2} style={{ flex: 1 }}>
                <Text fw={700} size="lg">Need custom funding assistance?</Text>
                <Text size="sm" c="dimmed">Our enterprise support team can help with large wire transfers and institutional onboarding.</Text>
              </Stack>
              <Button variant="outline" radius="md" style={{ borderColor: '#005ea2', color: '#005ea2' }}>Contact VIP Desk</Button>
            </Group>
          </Paper>
        </Stack>
      </Container>

      {/* ─── PAYMENT METHOD SELECTION MODAL ───────────────────────── */}
      <Modal
        opened={selectModalOpened}
        onClose={() => setSelectModalOpened(false)}
        title={null}
        centered
        radius="lg"
        size="lg"
        padding="xl"
        overlayProps={{ backgroundOpacity: 0.6, blur: 8 }}
        withCloseButton
      >
        <Stack gap="lg">
          {/* Header */}
          <Stack align="center" gap="xs">
            <ThemeIcon size={60} radius="xl" variant="light" style={{ backgroundColor: 'rgba(0, 94, 162, 0.1)', color: '#005ea2' }}>
              <IconCreditCard size={30} />
            </ThemeIcon>
            <Text fw={800} size="xl" c="#002e6d" ta="center">Select Payment Method</Text>
            <Text size="sm" c="dimmed" ta="center" maw={400}>
              Choose your preferred method to fund your account
            </Text>
          </Stack>

          {/* Payment Session Notice */}
          <Alert icon={<IconClock size={16} />} title="Payment Session Notice" color="orange" variant="light" radius="md">
            After selecting a payment method, you will have <strong>10 minutes</strong> to complete your payment.
            The account details provided are only valid within this window.
          </Alert>

          {/* Payment Methods Grid */}
          {isLoading ? (
            <Box py="xl" ta="center">
              <SBALoader message="Loading payment methods..." />
            </Box>
          ) : (
            <Stack gap="sm">
              {methods.map((method: any) => (
                <Paper
                  key={method.id}
                  withBorder p="lg" radius="md"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white',
                  }}
                  className="payment-card"
                  onClick={() => handleMethodSelect(method)}
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <ThemeIcon variant="light" size={50} radius="md" style={{ border: '1px solid #e5e5e5', backgroundColor: '#f8f9fa' }}>
                        {getMethodIcon(method.methodName, method.iconUrl, 28)}
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="md" style={{ textTransform: 'capitalize' }}>
                          {method.displayName || method.methodName}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>{getMethodDescription(method)}</Text>
                      </div>
                    </Group>
                    <Group gap="sm">
                      {getMethodBadge(method.methodName)}
                      <IconArrowRight size={18} color="#adb5bd" />
                    </Group>
                  </Group>
                </Paper>
              ))}

              {/* [WHY] Show crypto wallets as selectable options even if no "crypto" payment method exists */}
              {wallets.length > 0 && (
                <>
                  <Divider label="Cryptocurrency" labelPosition="center" my="xs" />
                  {wallets.map((wallet: any) => (
                    <Paper
                      key={wallet.id}
                      withBorder p="lg" radius="md"
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease', background: '#fffcf5' }}
                      className="payment-card"
                      onClick={() => {
                        // Use the crypto method if it exists, otherwise create a synthetic one
                        const cryptoMethod = methods.find((m: any) => m.methodName?.toLowerCase() === 'crypto') || {
                          methodName: 'crypto',
                          displayName: 'Cryptocurrency',
                        };
                        handleMethodSelect(cryptoMethod);
                      }}
                    >
                      <Group justify="space-between">
                        <Group gap="md">
                          <ThemeIcon variant="light" size={50} radius="md" style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
                            <IconCurrencyBitcoin size={28} color="#f7931a" />
                          </ThemeIcon>
                          <div>
                            <Text fw={700} size="md">{wallet.symbol} — {wallet.network}</Text>
                            <Text size="xs" c="dimmed">Send {wallet.symbol} to receive instant credit</Text>
                          </div>
                        </Group>
                        <Group gap="sm">
                          <Badge color="orange" variant="light">Crypto</Badge>
                          <IconArrowRight size={18} color="#adb5bd" />
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </>
              )}

              {methods.length === 0 && wallets.length === 0 && (
                <Paper withBorder radius="lg" p="xl" ta="center" bg="gray.0">
                  <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                    <IconCreditCard size={30} />
                  </ThemeIcon>
                  <Title order={3} c="dimmed" mb="xs">No Payment Methods Available</Title>
                  <Text size="sm" c="dimmed">Payment methods have not been configured yet. Please contact support.</Text>
                </Paper>
              )}
            </Stack>
          )}

          {/* Trust Badges */}
          <Group justify="center" gap="lg" mt="xs">
            <Group gap={4}>
              <IconShieldCheck size={14} color="var(--mantine-color-green-6)" />
              <Text size="xs" c="dimmed">Secure Payment</Text>
            </Group>
            <Group gap={4}>
              <IconLock size={14} color="var(--mantine-color-blue-6)" />
              <Text size="xs" c="dimmed">256-bit SSL</Text>
            </Group>
            <Group gap={4}>
              <IconReceipt size={14} color="var(--mantine-color-violet-6)" />
              <Text size="xs" c="dimmed">Instant Receipt</Text>
            </Group>
          </Group>
        </Stack>
      </Modal>

      {/* ─── PAYMENT FLOW MODAL (countdown, details, upload) ──── */}
      <PaymentFlowModal
        opened={paymentModalOpened}
        onClose={() => setPaymentModalOpened(false)}
        method={selectedMethod}
        wallets={wallets}
      />

      <style jsx global>{`
        .payment-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .payment-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px -6px rgba(0, 46, 109, 0.12);
            border-color: #93c5fd;
        }
      `}</style>
    </DashboardLayout>
  );
});

export default FundingPage;
