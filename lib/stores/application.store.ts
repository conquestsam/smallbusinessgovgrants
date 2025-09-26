import { makeAutoObservable } from 'mobx';

export interface GrantApplication {
  id: string;
  applicationId: string;
  userId: string;
  businessName: string;
  businessType: string;
  requestedAmount: number;
  approvedAmount?: number;
  purpose: string;
  businessPlan?: string;
  documents?: any[];
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class ApplicationStore {
  applications: GrantApplication[] = [];
  currentApplication: GrantApplication | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setApplications(applications: GrantApplication[]) {
    this.applications = applications;
  }

  addApplication(application: GrantApplication) {
    this.applications.unshift(application);
  }

  updateApplication(id: string, updates: Partial<GrantApplication>) {
    const index = this.applications.findIndex(app => app.id === id);
    if (index !== -1) {
      this.applications[index] = { ...this.applications[index], ...updates };
    }
    
    if (this.currentApplication?.id === id) {
      this.currentApplication = { ...this.currentApplication, ...updates };
    }
  }

  setCurrentApplication(application: GrantApplication | null) {
    this.currentApplication = application;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  get pendingApplications() {
    return this.applications.filter(app => app.status === 'pending');
  }

  get approvedApplications() {
    return this.applications.filter(app => app.status === 'approved');
  }

  get rejectedApplications() {
    return this.applications.filter(app => app.status === 'rejected');
  }

  get totalRequestedAmount() {
    return this.applications.reduce((sum, app) => sum + app.requestedAmount, 0);
  }

  get totalApprovedAmount() {
    return this.approvedApplications.reduce((sum, app) => sum + (app.approvedAmount || 0), 0);
  }
}

export const applicationStore = new ApplicationStore();