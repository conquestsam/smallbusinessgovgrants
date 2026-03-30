'use client';

import { observer } from 'mobx-react-lite';
import { useQuery } from '@tanstack/react-query';
import {
  Container, Title, Card, Group, Text, Stack, SimpleGrid,
  Badge, Image, ThemeIcon, Box, UnstyledButton,
  Divider, Tooltip, Alert, Paper, Button, CopyButton, ActionIcon,
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

// Reusable copy-to-clipboard row for payment details
const QuickCopyField = ({ label, value }: { label: string; value: string }) => (
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

const FundingPage = observer(() => {
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['public-payment-methods'],
    queryFn: async () => {
      const response = await fetch('/api/payments/methods');
      return response.json();
    },
  });

  const methods = data?.methods || [];
  const wallets = data?.wallets || [];

  const getMethodIcon = (methodName: string, iconUrl?: string) => {
    if (iconUrl) return <Image src={iconUrl} w={40} h={40} fit="contain" alt="Payment method" />;
    switch (methodName.toLowerCase()) {
      case 'stripe': return <IconBrandStripe size={40} color="#635bff" />;
      case 'crypto': return <IconCurrencyBitcoin size={40} color="#f7931a" />;
      case 'wire_transfer':
      case 'bank_transfer': return <IconBuildingBank size={40} color="#002e6d" />;
      default: return <IconCreditCard size={40} color="#002e6d" />;
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
        return 'Fast, secure card payments via Stripe global network. Visa, Mastercard, Amex accepted.';
      case 'crypto':
        return 'Private and secure blockchain-based funding. BTC, ETH, USDT supported.';
      case 'wire_transfer':
        return 'Direct wire transfer to our institutional banking partner.';
      case 'bank_transfer':
        return 'ACH bank transfer — reliable and fee-free domestic transfers.';
      default:
        return method.instructions || 'Complete your funding through this secure channel.';
    }
  };

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        <SiteTour page="funding" />
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={1} c="#002e6d" fw={800}>Fund Your Account</Title>
              <Text c="dimmed" size="lg">Select a secure provider to complete your platform contribution.</Text>
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

          <Alert icon={<IconInfoCircle size={16} />} title="Important Note" color="blue" variant="light" radius="md">
            Funding your account is a one-way transaction. Please verify your funding amount and method before proceeding.
            Automated gateways like Stripe clear instantly, while Crypto and Manual methods require administrative review.
          </Alert>

          {/* Payment Method Cards */}
          {isLoading ? (
            <Box py="xl" ta="center">
              <SBALoader message="Retrieving secure payment configuration..." />
            </Box>
          ) : methods.length === 0 ? (
            <Paper withBorder radius="lg" p="xl" ta="center">
              <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                <IconCreditCard size={30} />
              </ThemeIcon>
              <Title order={3} c="dimmed" mb="xs">No Payment Methods Available</Title>
              <Text size="sm" c="dimmed">Payment methods have not been configured yet. Please contact support.</Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              <AnimatePresence mode="wait">
                {methods.map((method: any, index: number) => (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      withBorder
                      radius="lg"
                      shadow="sm"
                      p="xl"
                      className="payment-card"
                      style={{ overflow: 'hidden', height: '100%', position: 'relative' }}
                    >
                      <Stack justify="space-between" h="100%">
                        <Stack gap="lg">
                          {/* Card Header */}
                          <Group justify="space-between">
                            <ThemeIcon variant="light" size={60} radius="md" color="gray.0">
                              {getMethodIcon(method.methodName, method.iconUrl)}
                            </ThemeIcon>
                            {getMethodBadge(method.methodName)}
                          </Group>

                          {/* Name & Description */}
                          <Stack gap={4}>
                            <Text fw={800} size="xl" style={{ textTransform: 'capitalize' }}>
                              {method.displayName || method.methodName}
                            </Text>
                            <Text size="sm" c="dimmed" lineClamp={2}>
                              {getMethodDescription(method)}
                            </Text>
                          </Stack>

                          {/* Quick Details (bank info preview on card) */}
                          {method.accountNumber && method.methodName !== 'stripe' && (
                            <Paper withBorder p="sm" radius="md" bg="gray.0">
                              <Stack gap={4}>
                                {method.bankName && (
                                  <Group gap="xs">
                                    <IconBuildingBank size={14} color="var(--mantine-color-dimmed)" />
                                    <Text size="xs" c="dimmed">{method.bankName}</Text>
                                  </Group>
                                )}
                                {method.accountNumber && (
                                  <QuickCopyField label="Account" value={method.accountNumber} />
                                )}
                                {method.routingNumber && (
                                  <QuickCopyField label="Routing" value={method.routingNumber} />
                                )}
                              </Stack>
                            </Paper>
                          )}

                          {/* Processing Info */}
                          <Group gap="xl">
                            {method.processingTime && (
                              <Group gap={4}>
                                <IconClock size={14} color="var(--mantine-color-dimmed)" />
                                <Text size="xs" c="dimmed">{method.processingTime}</Text>
                              </Group>
                            )}
                            {method.fee && (
                              <Group gap={4}>
                                <IconReceipt size={14} color="var(--mantine-color-dimmed)" />
                                <Text size="xs" c="dimmed">Fee: {method.fee}</Text>
                              </Group>
                            )}
                          </Group>
                        </Stack>

                        {/* CTA Button */}
                        <Button
                          mt="xl"
                          fullWidth
                          size="md"
                          radius="md"
                          color="primary"
                          rightSection={<IconArrowRight size={18} />}
                          onClick={() => {
                            setSelectedMethod(method);
                            setModalOpened(true);
                          }}
                        >
                          Select {method.displayName || method.methodName}
                        </Button>
                      </Stack>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </SimpleGrid>
          )}

          {/* VIP Support */}
          <Paper withBorder radius="lg" p="xl" bg="#f1f3f5" style={{ borderStyle: 'dashed' }}>
            <Group justify="space-between">
              <Stack gap={2}>
                <Text fw={700} size="lg">Need custom funding assistance?</Text>
                <Text size="sm" c="dimmed">Our enterprise support team can help with large wire transfers and institutional onboarding.</Text>
              </Stack>
              <Button variant="outline" color="primary" radius="md">Contact VIP Desk</Button>
            </Group>
          </Paper>
        </Stack>
      </Container>

      <PaymentFlowModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        method={selectedMethod}
        wallets={wallets}
      />

      <style jsx global>{`
        .payment-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .payment-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px -8px rgba(0, 46, 109, 0.15);
            border-color: var(--mantine-color-blue-3);
        }
      `}</style>
    </DashboardLayout>
  );
});

export default FundingPage;
