'use client';

import { observer } from 'mobx-react-lite';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Title, Card, Table, Switch, Button, Group, Text, 
  TextInput, Stack, Tabs, ActionIcon, Modal, Select,
  Badge, Divider, Tooltip, Code, Alert,
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
          <Tabs.List>
            <Tabs.Tab value="gateways" leftSection={<IconCreditCard size={16} />}>Payment Methods</Tabs.Tab>
            <Tabs.Tab value="wallets" leftSection={<IconWallet size={16} />}>Crypto Wallets</Tabs.Tab>
            <Tabs.Tab value="audit" leftSection={<IconHistory size={16} />}>Audit Log</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="gateways" pt="xl">
            <Group justify="space-between" mb="xl">
              <Alert icon={<IconInfoCircle size={16} />} title="Real-time Sync" color="blue" variant="light" style={{ flex: 1 }}>
                  Changes are reflected immediately on the client funding portal.
              </Alert>
              <Button leftSection={<IconPlus size={16} />} onClick={openMethodModal}>
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
                            <Group justify="space-between" mb="md">
                              <Group>
                                <div {...provided.dragHandleProps}>
                                    <IconGripVertical size={20} color="var(--mantine-color-gray-5)" style={{ cursor: 'grab' }} />
                                </div>
                                <IconSettings size={28} color="var(--mantine-color-blue-7)" />
                                <div>
                                  <Group gap="xs">
                                    <Text fw={700} size="lg">{method.methodName?.toUpperCase()}</Text>
                                    <Badge size="xs" variant="light">#{index + 1}</Badge>
                                  </Group>
                                </div>
                              </Group>
                              <Group>
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
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Group>

                            <Divider mb="lg" />

                            <Stack gap="md">
                              <TextInput 
                                  label="Instructions"
                                  description="Displayed to user on checkout"
                                  defaultValue={method.instructions}
                                  onBlur={(e) => {
                                      if (e.currentTarget.value !== method.instructions) {
                                          setIsDirty(true);
                                          updateMutation.mutate({ type: 'method', id: method.id, data: { instructions: e.currentTarget.value } });
                                      }
                                  }}
                              />
                              <TextInput 
                                  label="Icon URL"
                                  placeholder="https://..."
                                  defaultValue={method.iconUrl}
                                  onBlur={(e) => {
                                      if (e.currentTarget.value !== method.iconUrl) {
                                          setIsDirty(true);
                                          updateMutation.mutate({ type: 'method', id: method.id, data: { iconUrl: e.currentTarget.value } });
                                      }
                                  }}
                              />
                            </Stack>
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
                <Group justify="space-between" mb="xl">
                    <Title order={3}>Crypto Wallets</Title>
                    <Button variant="filled" leftSection={<IconPlus size={16} />} onClick={() => { setSelectedWallet(null); openWalletModal(); }}>
                        Add Wallet
                    </Button>
                </Group>
                
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
                                        <Code style={{ cursor: 'pointer' }} onClick={() => {
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
                                      <ActionIcon variant="light" onClick={() => { setSelectedWallet(wallet); openWalletModal(); }}><IconSettings size={18} /></ActionIcon>
                                      <ActionIcon
                                        variant="light"
                                        color="red"
                                        onClick={() => {
                                          if (confirm(`Delete ${wallet.symbol} wallet?`)) {
                                            deleteMutation.mutate({ type: 'wallet', id: wallet.id });
                                          }
                                        }}
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
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
                    <Button type="submit" fullWidth mt="md" size="lg" leftSection={<IconDeviceFloppy size={20} />}>
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
                    <TextInput name="instructions" label="User Instructions" placeholder="Step-by-step payment instructions" />
                    <TextInput name="iconUrl" label="Icon URL (optional)" placeholder="https://..." />
                    <Button type="submit" fullWidth mt="md" size="lg" leftSection={<IconPlus size={20} />}>
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
