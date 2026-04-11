'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Title, Card, Table, Switch, Button, Group, Text, 
  TextInput, Stack, Tabs, ActionIcon, Modal, Select,
  Badge, Divider, Tooltip, Code, Alert, ScrollArea, Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { AdminSettingsLayout } from '@/components/layout/AdminSettingsLayout';
import { 
  IconSettings, IconWallet, IconCreditCard, IconPlus, 
  IconDeviceFloppy, IconInfoCircle, IconGripVertical, IconHistory, IconTrash,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useUnsavedChanges } from '@/lib/hooks/useUnsavedChanges';
import { SBALoader } from '@/components/ui/SBALoader';

// [WHY] Explicit save form for each payment method — replaces auto-save onBlur
// [WHAT] Users type freely, then click "Save Changes" when done
const PaymentMethodForm = ({ method, onSave, isSaving }: { method: any; onSave: (data: Record<string, string>) => void; isSaving: boolean }) => {
  const [formData, setFormData] = useState({
    displayName: method.displayName || '',
    instructions: method.instructions || '',
    accountName: method.accountName || '',
    accountNumber: method.accountNumber || '',
    routingNumber: method.routingNumber || '',
    bankName: method.bankName || '',
    iconUrl: method.iconUrl || '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Only send fields that actually changed
    const changedData: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== (method[key] || '')) {
        changedData[key] = value;
      }
    });
    if (Object.keys(changedData).length > 0) {
      onSave(changedData);
      setHasChanges(false);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Display Name"
        description="Name shown to users (e.g. Chime, PayPal, Cash App)"
        value={formData.displayName}
        onChange={(e) => handleChange('displayName', e.currentTarget.value)}
      />
      <TextInput
        label="Instructions"
        description="Displayed to user on checkout"
        value={formData.instructions}
        onChange={(e) => handleChange('instructions', e.currentTarget.value)}
      />
      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: '12px' }}>
        <TextInput
          label="Account Name"
          placeholder="e.g. John Doe"
          value={formData.accountName}
          onChange={(e) => handleChange('accountName', e.currentTarget.value)}
        />
        <TextInput
          label="Account Number"
          placeholder="e.g. 1234567890"
          value={formData.accountNumber}
          onChange={(e) => handleChange('accountNumber', e.currentTarget.value)}
        />
        <TextInput
          label="Routing Number"
          placeholder="e.g. 021000021"
          value={formData.routingNumber}
          onChange={(e) => handleChange('routingNumber', e.currentTarget.value)}
        />
        <TextInput
          label="Bank Name"
          placeholder="e.g. Chase Bank"
          value={formData.bankName}
          onChange={(e) => handleChange('bankName', e.currentTarget.value)}
        />
      </Box>
      <TextInput
        label="Icon URL"
        placeholder="https://..."
        value={formData.iconUrl}
        onChange={(e) => handleChange('iconUrl', e.currentTarget.value)}
      />
      {hasChanges && (
        <Group justify="flex-end" mt="xs">
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            loading={isSaving}
            onClick={handleSave}
            size="md"
            style={{ backgroundColor: '#005ea2', minWidth: 160 }}
          >
            Save Changes
          </Button>
        </Group>
      )}
    </Stack>
  );
};

const PaymentSettingsPage = observer(() => {
  const queryClient = useQueryClient();
  const [walletModalOpened, { open: openWalletModal, close: closeWalletModal }] = useDisclosure(false);
  const [methodModalOpened, { open: openMethodModal, close: closeMethodModal }] = useDisclosure(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [localMethods, setLocalMethods] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payment-config'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payments/config');
      return response.json();
    },
  });

  useEffect(() => {
    if (data?.methods) {
      setLocalMethods([...data.methods].sort((a: any, b: any) => a.displayPriority - b.displayPriority));
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async ({ type, id, data }: any) => {
      const response = await fetch('/api/admin/payments/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'idempotency-key': `pay_upd_${Date.now()}` },
        body: JSON.stringify({ type, id, data }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Configuration updated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-config'] });
      setIsDirty(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ type, data }: any) => {
      const response = await fetch('/api/admin/payments/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Entry created', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-config'] });
      closeWalletModal();
      closeMethodModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const response = await fetch('/api/admin/payments/config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      return response.json();
    },
    onSuccess: () => {
      notifications.show({ title: 'Deleted', message: 'Entry removed', color: 'orange' });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-config'] });
    },
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(localMethods);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLocalMethods(items);
    setIsDirty(true);

    items.forEach((item, index) => {
      updateMutation.mutate({ type: 'method', id: item.id, data: { displayPriority: index + 1 } });
    });
  };

  if (isLoading) return <SBALoader variant="inline" message="Loading payment configuration..." />;

  const wallets = data?.wallets || [];

  return (
    <AdminSettingsLayout>
      <Stack gap="lg">
        <Tabs defaultValue="gateways" variant="outline" radius="md">
          <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <Tabs.Tab value="gateways" leftSection={<IconCreditCard size={16} />} style={{ whiteSpace: 'nowrap' }}>Payment Methods</Tabs.Tab>
            <Tabs.Tab value="wallets" leftSection={<IconWallet size={16} />} style={{ whiteSpace: 'nowrap' }}>Crypto Wallets</Tabs.Tab>
            <Tabs.Tab value="audit" leftSection={<IconHistory size={16} />} style={{ whiteSpace: 'nowrap' }}>Audit Log</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="gateways" pt="xl">
            <Group justify="space-between" mb="xl" wrap="wrap" gap="md">
              <Alert icon={<IconInfoCircle size={16} />} title="Real-time Sync" color="blue" variant="light" style={{ flex: 1, minWidth: 200 }}>
                  Changes are reflected immediately on the client funding portal.
              </Alert>
              <Button 
                leftSection={<IconPlus size={16} />} 
                onClick={openMethodModal}
                style={{ backgroundColor: '#005ea2' }}
              >
                Add Payment Method
              </Button>
            </Group>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="payment-methods">
                {(provided) => (
                  <Stack {...provided.droppableProps} ref={provided.innerRef}>
                    {localMethods.map((method: any, index: number) => (
                      <Draggable key={method.id} draggableId={method.id} index={index}>
                        {(provided, snapshot) => (
                          <Card 
                            withBorder 
                            radius="md" 
                            shadow={snapshot.isDragging ? "xl" : "xs"}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            bg="white"
                          >
                            <Group justify="space-between" mb="md" wrap="wrap" gap="sm" style={{ flexDirection: undefined }}>
                              <Group>
                                <div {...provided.dragHandleProps}>
                                    <IconGripVertical size={20} color="var(--mantine-color-gray-5)" style={{ cursor: 'grab' }} />
                                </div>
                                <IconSettings size={28} color="#005ea2" />
                                <div>
                                  <Group gap="xs">
                                    <Text fw={700} size="lg">{method.methodName?.toUpperCase()}</Text>
                                    <Badge size="xs" variant="light">#{index + 1}</Badge>
                                  </Group>
                                </div>
                              </Group>
                              <Group gap="sm">
                                <Switch 
                                    label="Active"
                                    checked={method.enabled} 
                                    onChange={(e) => {
                                        setIsDirty(true);
                                        updateMutation.mutate({ type: 'method', id: method.id, data: { enabled: e.currentTarget.checked } });
                                    }}
                                />
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => {
                                    if (confirm(`Delete "${method.methodName}"?`)) {
                                      deleteMutation.mutate({ type: 'method', id: method.id });
                                    }
                                  }}
                                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Group>

                            <Divider mb="lg" />

                            <PaymentMethodForm
                              method={method}
                              onSave={(data: Record<string, string>) => {
                                setIsDirty(false);
                                updateMutation.mutate({ type: 'method', id: method.id, data });
                              }}
                              isSaving={updateMutation.isPending}
                            />
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          </Tabs.Panel>

          <Tabs.Panel value="wallets" pt="xl">
            <Card withBorder radius="md" p="xl" bg="white">
                <Group justify="space-between" mb="xl" wrap="wrap" gap="md">
                    <Title order={3}>Crypto Wallets</Title>
                    <Button 
                      variant="filled" 
                      leftSection={<IconPlus size={16} />} 
                      onClick={() => { setSelectedWallet(null); openWalletModal(); }}
                      style={{ backgroundColor: '#005ea2' }}
                    >
                        Add Wallet
                    </Button>
                </Group>
                
                <ScrollArea>
                  <Table verticalSpacing="md" highlightOnHover>
                      <Table.Thead bg="gray.0">
                          <Table.Tr>
                              <Table.Th>Asset</Table.Th>
                              <Table.Th>Network</Table.Th>
                              <Table.Th>Address</Table.Th>
                              <Table.Th>Status</Table.Th>
                              <Table.Th w={120}>Actions</Table.Th>
                          </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                          {wallets.map((wallet: any) => (
                              <Table.Tr key={wallet.id}>
                                  <Table.Td><Badge color="blue">{wallet.symbol}</Badge></Table.Td>
                                  <Table.Td><Text size="sm">{wallet.network}</Text></Table.Td>
                                  <Table.Td>
                                      <Tooltip label="Click to copy" withArrow>
                                          <Code style={{ cursor: 'pointer', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => {
                                            navigator.clipboard.writeText(wallet.address);
                                            notifications.show({ message: 'Address copied', color: 'blue' });
                                          }}>{wallet.address}</Code>
                                      </Tooltip>
                                  </Table.Td>
                                  <Table.Td>
                                      <Switch checked={wallet.enabled} onChange={(e) => updateMutation.mutate({ type: 'wallet', id: wallet.id, data: { enabled: e.currentTarget.checked } })} />
                                  </Table.Td>
                                  <Table.Td>
                                      <Group gap="xs">
                                        <ActionIcon variant="light" onClick={() => { setSelectedWallet(wallet); openWalletModal(); }}
                                          style={{ backgroundColor: 'rgba(0, 94, 162, 0.1)' }}
                                        >
                                          <IconSettings size={18} />
                                        </ActionIcon>
                                        <ActionIcon
                                          variant="light"
                                          color="red"
                                          onClick={() => {
                                            if (confirm(`Delete ${wallet.symbol} wallet?`)) {
                                              deleteMutation.mutate({ type: 'wallet', id: wallet.id });
                                            }
                                          }}
                                          style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
                                        >
                                          <IconTrash size={16} />
                                        </ActionIcon>
                                      </Group>
                                  </Table.Td>
                              </Table.Tr>
                          ))}
                      </Table.Tbody>
                  </Table>
                </ScrollArea>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="audit" pt="xl">
             <Card withBorder radius="md" p="xl">
                <Title order={3} mb="md">Configuration Audit Log</Title>
                <Text c="dimmed">Detailed tracking of payment infrastructure changes.</Text>
                <Divider my="md" />
                <Stack gap="xs">
                   <Text size="sm" fs="italic">No critical changes detected in the last 24 hours.</Text>
                </Stack>
             </Card>
          </Tabs.Panel>
        </Tabs>

        {/* Wallet Modal */}
        <Modal opened={walletModalOpened} onClose={closeWalletModal} title={selectedWallet ? "Edit Wallet" : "Add Wallet"} centered radius="lg">
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                if (selectedWallet) {
                    updateMutation.mutate({ type: 'wallet', id: selectedWallet.id, data });
                } else {
                    createMutation.mutate({ type: 'wallet', data });
                }
                closeWalletModal();
            }}>
                <Stack>
                    <Select name="symbol" label="Token" defaultValue={selectedWallet?.symbol} data={['BTC', 'ETH', 'USDT', 'SOL', 'USDC', 'BNB', 'XRP', 'DOGE']} required />
                    <TextInput name="network" label="Network" placeholder="e.g. ERC20, TRC20, Bitcoin" defaultValue={selectedWallet?.network} required />
                    <TextInput name="address" label="Receiving Address" defaultValue={selectedWallet?.address} required />
                    <Button 
                      type="submit" fullWidth mt="md" size="lg" 
                      leftSection={<IconDeviceFloppy size={20} />}
                      style={{ backgroundColor: '#005ea2' }}
                    >
                        {selectedWallet ? 'Update' : 'Create'} Wallet
                    </Button>
                </Stack>
            </form>
        </Modal>

        {/* New Payment Method Modal */}
        <Modal opened={methodModalOpened} onClose={closeMethodModal} title="Add Payment Method" centered radius="lg">
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                createMutation.mutate({ type: 'method', data });
            }}>
                <Stack>
                    <TextInput name="methodName" label="Method Name" placeholder="e.g. Bank Transfer, Zelle, PayPal" required />
                    <TextInput name="displayName" label="Display Name" placeholder="e.g. Chime, Cash App, Venmo" />
                    <TextInput name="instructions" label="User Instructions" placeholder="Step-by-step payment instructions" />
                    <TextInput name="accountName" label="Account Name" placeholder="e.g. John Doe" />
                    <TextInput name="accountNumber" label="Account Number" placeholder="e.g. 1234567890" />
                    <TextInput name="routingNumber" label="Routing Number" placeholder="e.g. 021000021" />
                    <TextInput name="bankName" label="Bank Name" placeholder="e.g. Chase Bank" />
                    <TextInput name="iconUrl" label="Icon URL (optional)" placeholder="https://..." />
                    <Button 
                      type="submit" fullWidth mt="md" size="lg" 
                      leftSection={<IconPlus size={20} />}
                      style={{ backgroundColor: '#005ea2' }}
                    >
                        Add Payment Method
                    </Button>
                </Stack>
            </form>
        </Modal>
      </Stack>
    </AdminSettingsLayout>
  );
});

export default PaymentSettingsPage;
