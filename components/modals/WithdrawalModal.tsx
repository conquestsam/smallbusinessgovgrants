'use client';

import { Modal, Text, Button, Group, Stack, NumberInput, Select, TextInput, Alert, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX, IconHeadphones, IconBuildingBank, IconCreditCard, IconWallet } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// NEW: Payment method types and configurations
interface PaymentMethodConfig {
  value: string;
  label: string;
  fields: string[];
  icon: JSX.Element;
  description: string;
}

interface WithdrawalModalProps {
  opened: boolean;
  onClose: () => void;
  availableBalance: number;
  onSubmit: (data: any) => Promise<void>;
  applicationOptions: { value: string; label: string; availableAmount: number }[];
  form: any;
}

export function WithdrawalModal({ opened, onClose, availableBalance, onSubmit, applicationOptions, form }: WithdrawalModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'rejected'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // NEW: Payment method configurations with dynamic fields
  const paymentMethods: PaymentMethodConfig[] = [
    {
      value: 'bank_transfer',
      label: 'Bank Transfer (ACH)',
      fields: ['accountName', 'accountNumber', 'routingNumber', 'bankName'],
      icon: <IconBuildingBank size={18} />,
      description: '2-3 business days processing'
    },
    {
      value: 'wire_transfer',
      label: 'Wire Transfer',
      fields: ['accountName', 'accountNumber', 'routingNumber', 'bankName', 'swiftCode'],
      icon: <IconBuildingBank size={18} />,
      description: '1-2 business days processing • $25 fee'
    },
    {
      value: 'paypal',
      label: 'PayPal',
      fields: ['paypalEmail'],
      icon: <IconCreditCard size={18} />,
      description: 'Instant transfer • 2.9% fee'
    },
    {
      value: 'venmo',
      label: 'Venmo',
      fields: ['venmoUsername', 'venmoPhone'],
      icon: <IconWallet size={18} />,
      description: 'Instant transfer • 1.9% fee'
    },
    {
      value: 'zelle',
      label: 'Zelle',
      fields: ['zelleEmail', 'zellePhone'],
      icon: <IconWallet size={18} />,
      description: 'Instant transfer • No fee'
    },
    {
      value: 'chime',
      label: 'Chime',
      fields: ['chimeEmail', 'chimePhone'],
      icon: <IconWallet size={18} />,
      description: 'Instant transfer • No fee'
    },
    {
      value: 'cashapp',
      label: 'Cash App',
      fields: ['cashappUsername', 'cashappCashtag'],
      icon: <IconWallet size={18} />,
      description: 'Instant transfer • 1.5% fee'
    }
  ];

  // FIXED: Enhanced form initialization with only basic fields
  const withdrawalForm = useForm({
    initialValues: {
      applicationId: '',
      amount: 0,
      paymentMethod: '',
      // Only basic fields that backend expects
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
      // Additional fields for other payment methods
      additionalInfo: {} as Record<string, any>
    },
    validate: {
  amount: (value: number) => {
    if (value <= 0) return 'Amount must be greater than 0';
    if (value > availableBalance) return 'Amount exceeds available balance';
    return null;
  },
  paymentMethod: (value: string) => !value ? 'Please select a payment method' : null,
  // FIXED: Add types for both value and values parameters
  bankName: (value: string, values: any) => 
    (values.paymentMethod === 'bank_transfer' || values.paymentMethod === 'wire_transfer') && !value ? 'Bank name is required' : null,
  accountNumber: (value: string, values: any) => 
    (values.paymentMethod === 'bank_transfer' || values.paymentMethod === 'wire_transfer') && !value ? 'Account number is required' : null,
  accountHolderName: (value: string, values: any) => 
    (values.paymentMethod === 'bank_transfer' || values.paymentMethod === 'wire_transfer') && !value ? 'Account holder name is required' : null,
  routingNumber: (value: string, values: any) => 
    (values.paymentMethod === 'bank_transfer' || values.paymentMethod === 'wire_transfer') && !value ? 'Routing number is required' : 
    (values.paymentMethod === 'bank_transfer' || values.paymentMethod === 'wire_transfer') && !/^\d{9}$/.test(value) ? 'Routing number must be 9 digits' : null,
},
  });

  // FIXED: Handle payment method change - now accepts string | null
  const handlePaymentMethodChange = (method: string | null) => {
    if (method) {
      setSelectedPaymentMethod(method);
      withdrawalForm.setFieldValue('paymentMethod', method);
      withdrawalForm.setFieldValue('additionalInfo', {});
    }
  };

  // FIXED: Get current payment method configuration
  const getCurrentPaymentMethod = () => {
    return paymentMethods.find(method => method.value === selectedPaymentMethod);
  };

  // FIXED: Clean payload to only send relevant data
  const cleanPayload = (values: any) => {
    const basePayload = {
      applicationId: values.applicationId,
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      userId: 'user-id-from-auth', // This should come from your auth context
      withdrawalId: `WD-${Date.now()}`,
    };

    // FIXED: Only include relevant fields based on payment method
    if (values.paymentMethod === 'bank_transfer' || values.paymentMethod === 'wire_transfer') {
      return {
        ...basePayload,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        routingNumber: values.routingNumber,
        accountHolderName: values.accountHolderName,
        ...(values.paymentMethod === 'wire_transfer' && { swiftCode: values.additionalInfo.swiftCode })
      };
    } else {
      // FIXED: For non-bank methods, store additional info separately
      return {
        ...basePayload,
        bankName: `${values.paymentMethod.toUpperCase()} Transfer`,
        accountNumber: 'N/A',
        routingNumber: 'N/A', 
        accountHolderName: 'N/A',
        additionalInfo: values.additionalInfo
      };
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setStatus('processing');
      setErrorMessage('');
      
      // FIXED: Clean the payload before sending
      const cleanData = cleanPayload(values);
      
      console.log('Sending clean payload:', cleanData);

      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Withdrawal request failed');
      }

      const result = await response.json();
      
      // FIXED: Show success immediately since backend will handle real approval
      setStatus('success');
      
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Withdrawal request failed');
      setLoading(false);
    }
  };

  // FIXED: Better support contact without WhatsApp
  const handleContactSupport = () => {
    // Use email or your support system instead of WhatsApp
    window.open('mailto:support@yourcompany.com?subject=Withdrawal%20Support', '_blank');
  };

  const resetModal = () => {
    setStatus('idle');
    setErrorMessage('');
    setSelectedPaymentMethod('');
    withdrawalForm.reset();
    setLoading(false);
  };

  // FIXED: Render dynamic fields based on selected payment method
  const renderPaymentMethodFields = () => {
    const method = getCurrentPaymentMethod();
    if (!method) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
      >
        <Stack gap="md" mt="md">
          {/* Bank Transfer Fields */}
          {(method.value === 'bank_transfer' || method.value === 'wire_transfer') && (
            <>
              <TextInput
                label="Account Holder Name"
                placeholder="Full name on account"
                required
                {...withdrawalForm.getInputProps('accountHolderName')}
              />
              <Group grow>
                <TextInput
                  label="Account Number"
                  placeholder="Account number"
                  required
                  {...withdrawalForm.getInputProps('accountNumber')}
                />
                <TextInput
                  label="Routing Number"
                  placeholder="Routing number"
                  required
                  {...withdrawalForm.getInputProps('routingNumber')}
                />
              </Group>
              <TextInput
                label="Bank Name"
                placeholder="Bank name"
                required
                {...withdrawalForm.getInputProps('bankName')}
              />
              {method.value === 'wire_transfer' && (
                <TextInput
                  label="SWIFT Code"
                  placeholder="SWIFT/BIC code"
                  required
                  value={withdrawalForm.values.additionalInfo.swiftCode || ''}
                  onChange={(event) => withdrawalForm.setFieldValue('additionalInfo', {
                    ...withdrawalForm.values.additionalInfo,
                    swiftCode: event.currentTarget.value
                  })}
                />
              )}
            </>
          )}

          {/* Other Payment Methods */}
          {method.value === 'paypal' && (
            <TextInput
              label="PayPal Email"
              placeholder="your-email@paypal.com"
              required
              value={withdrawalForm.values.additionalInfo.paypalEmail || ''}
              onChange={(event) => withdrawalForm.setFieldValue('additionalInfo', {
                ...withdrawalForm.values.additionalInfo,
                paypalEmail: event.currentTarget.value
              })}
            />
          )}

          {method.value === 'venmo' && (
            <>
              <TextInput
                label="Venmo Username"
                placeholder="@username"
                required
                value={withdrawalForm.values.additionalInfo.venmoUsername || ''}
                onChange={(event) => withdrawalForm.setFieldValue('additionalInfo', {
                  ...withdrawalForm.values.additionalInfo,
                  venmoUsername: event.currentTarget.value
                })}
              />
              <TextInput
                label="Venmo Phone Number"
                placeholder="+1 (555) 123-4567"
                value={withdrawalForm.values.additionalInfo.venmoPhone || ''}
                onChange={(event) => withdrawalForm.setFieldValue('additionalInfo', {
                  ...withdrawalForm.values.additionalInfo,
                  venmoPhone: event.currentTarget.value
                })}
              />
            </>
          )}

          {/* FIXED: Add similar patterns for other payment methods */}
          {method.value === 'cashapp' && (
            <>
              <TextInput
                label="Cash App Username"
                placeholder="@username"
                required
                value={withdrawalForm.values.additionalInfo.cashappUsername || ''}
                onChange={(event) => withdrawalForm.setFieldValue('additionalInfo', {
                  ...withdrawalForm.values.additionalInfo,
                  cashappUsername: event.currentTarget.value
                })}
              />
              <TextInput
                label="Cash App $Cashtag"
                placeholder="$YourCashtag"
                value={withdrawalForm.values.additionalInfo.cashappCashtag || ''}
                onChange={(event) => withdrawalForm.setFieldValue('additionalInfo', {
                  ...withdrawalForm.values.additionalInfo,
                  cashappCashtag: event.currentTarget.value
                })}
              />
            </>
          )}

          {/* Add similar blocks for zelle, chime etc. */}
        </Stack>
      </motion.div>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        resetModal();
      }}
      title="Request Withdrawal"
      size="lg"
      centered
      closeOnClickOutside={status === 'idle'}
      closeOnEscape={status === 'idle'}
    >
      <LoadingOverlay visible={loading && status === 'processing'} />
      
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={withdrawalForm.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* Available Balance Display */}
                <Alert color="blue" variant="light">
                  <Text size="sm">
                    Available Balance: <Text component="span" fw={600} c="blue">
                      ${availableBalance.toLocaleString()}
                    </Text>
                  </Text>
                </Alert>

                {/* Application Selection */}
                <Select
                  label="Select Application"
                  placeholder="Choose approved application"
                  required
                  data={applicationOptions}
                  {...withdrawalForm.getInputProps('applicationId')}
                />

                {/* Amount Input */}
                <NumberInput
                  label="Withdrawal Amount"
                  placeholder="Enter amount"
                  min={1}
                  max={availableBalance}
                  prefix="$"
                  thousandSeparator=","
                  required
                  {...withdrawalForm.getInputProps('amount')}
                />

                {/* Payment Method Selection */}
                <Select
                  label="Payment Method"
                  placeholder="Select payment method"
                  required
                  data={paymentMethods.map(method => ({
                    value: method.value,
                    label: method.label,
                  }))}
                  onChange={handlePaymentMethodChange}
                  value={selectedPaymentMethod}
                />

                {/* Payment Method Description */}
                {getCurrentPaymentMethod() && (
                  <Alert color="blue" variant="light">
                    <Text size="sm">{getCurrentPaymentMethod()?.description}</Text>
                  </Alert>
                )}

                {/* Dynamic Payment Method Fields */}
                {renderPaymentMethodFields()}

                <Group justify="flex-end" mt="md">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    style={{ backgroundColor: '#005ea2' }}
                    disabled={!selectedPaymentMethod}
                  >
                    Submit Request
                  </Button>
                </Group>
              </Stack>
            </form>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Stack align="center" gap="md" py="xl">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  scale: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                }}
              >
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  border: '4px solid #e9ecef', 
                  borderTop: '4px solid #005ea2',
                  borderRight: '4px solid #005ea2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconBuildingBank size={32} color="#005ea2" />
                </div>
              </motion.div>
              <Text size="lg" fw={500}>Processing Withdrawal Request</Text>
              <Text size="sm" c="dimmed" ta="center">
                Your request is being securely processed through our banking partners.
                This may take a few moments...
              </Text>
              
              {/* Step progress indicator */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: "easeInOut" }}
                style={{
                  height: 4,
                  backgroundColor: '#005ea2',
                  borderRadius: 2,
                  marginTop: 20
                }}
              />
            </Stack>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Stack align="center" gap="md" py="xl">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2, 
                  type: "spring", 
                  stiffness: 200,
                  rotate: { duration: 0.8, ease: "easeOut" }
                }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#51cf66',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(81, 207, 102, 0.3)'
                }}>
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <IconCheck size={40} color="white" />
                  </motion.div>
                </div>
              </motion.div>
              
              <Text size="xl" fw={600} c="green">Request Submitted!</Text>
              <Text size="sm" c="dimmed" ta="center">
                Your withdrawal request for ${withdrawalForm.values.amount?.toLocaleString()} has been submitted successfully.
                It is now pending admin approval. You will be notified once processed.
              </Text>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button 
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  style={{ backgroundColor: '#005ea2' }}
                >
                  Done
                </Button>
              </motion.div>
            </Stack>
          </motion.div>
        )}

        {/* FIXED: Rejected state with proper support button */}
        {status === 'rejected' && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Stack align="center" gap="md" py="xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#ff6b6b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
                }}>
                  <IconX size={40} color="white" />
                </div>
              </motion.div>
              
              <Text size="xl" fw={600} c="red">Payment Rejected</Text>
              
              <Alert color="red" variant="light">
                <Text size="sm" fw={500}>Reason for rejection:</Text>
                <Text size="sm" mt="xs">{errorMessage}</Text>
              </Alert>
              
              <Text size="sm" c="dimmed" ta="center">
                Please address the issue above and resubmit your withdrawal request.
              </Text>

              <Group>
                {/* FIXED: Changed to headphone icon instead of WhatsApp */}
                <Button
                  leftSection={<IconHeadphones size={16} />}
                  color="blue"
                  onClick={handleContactSupport}
                >
                  Contact Support
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                >
                  Try Again
                </Button>
              </Group>
            </Stack>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Stack align="center" gap="md" py="xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#ff6b6b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconX size={30} color="white" />
                </div>
              </motion.div>
              <Text size="lg" fw={500} c="red">Withdrawal Failed</Text>
              <Text size="sm" c="dimmed" ta="center">
                {errorMessage}
              </Text>
              {/* FIXED: Also changed error state support button */}
              <Button
                leftSection={<IconHeadphones size={16} />}
                color="blue"
                onClick={handleContactSupport}
              >
                Contact Support
              </Button>
              <Button variant="outline" onClick={resetModal}>
                Try Again
              </Button>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}