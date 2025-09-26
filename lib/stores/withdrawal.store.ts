import { makeAutoObservable } from 'mobx';

export interface Withdrawal {
  id: string;
  withdrawalId: string;
  userId: string;
  applicationId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class WithdrawalStore {
  withdrawals: Withdrawal[] = [];
  currentWithdrawal: Withdrawal | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setWithdrawals(withdrawals: Withdrawal[]) {
    this.withdrawals = withdrawals;
  }

  addWithdrawal(withdrawal: Withdrawal) {
    this.withdrawals.unshift(withdrawal);
  }

  updateWithdrawal(id: string, updates: Partial<Withdrawal>) {
    const index = this.withdrawals.findIndex(w => w.id === id);
    if (index !== -1) {
      this.withdrawals[index] = { ...this.withdrawals[index], ...updates };
    }
    
    if (this.currentWithdrawal?.id === id) {
      this.currentWithdrawal = { ...this.currentWithdrawal, ...updates };
    }
  }

  setCurrentWithdrawal(withdrawal: Withdrawal | null) {
    this.currentWithdrawal = withdrawal;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  get pendingWithdrawals() {
    return this.withdrawals.filter(w => w.status === 'pending');
  }

  get approvedWithdrawals() {
    return this.withdrawals.filter(w => w.status === 'approved');
  }

  get rejectedWithdrawals() {
    return this.withdrawals.filter(w => w.status === 'rejected');
  }

  get totalWithdrawalAmount() {
    return this.withdrawals.reduce((sum, w) => sum + w.amount, 0);
  }

  get totalApprovedWithdrawals() {
    return this.approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  }
}

export const withdrawalStore = new WithdrawalStore();