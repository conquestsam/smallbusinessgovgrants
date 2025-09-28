import { makeAutoObservable } from 'mobx';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  phone?: string; 
  avatar?: string;
  isActive: boolean;
}

class AuthStore {
  user: User | null = null;
  isAuthenticated = false;
  isLoading = false;
  sessionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initializeAuth();
  }

  initializeAuth() {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('sba_user');
      const sessionExpiry = localStorage.getItem('sba_session_expiry');
      
      if (storedUser && sessionExpiry) {
        const expiryTime = new Date(sessionExpiry).getTime();
        const now = new Date().getTime();
        
        if (now < expiryTime) {
          this.user = JSON.parse(storedUser);
          this.isAuthenticated = true;
          this.startSessionTimer();
        } else {
          this.logout();
        }
      }
    }
  }

  login(user: User) {
    this.user = user;
    this.isAuthenticated = true;
    
    // Set session expiry to 30 minutes
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('sba_user', JSON.stringify(user));
      localStorage.setItem('sba_session_expiry', expiryTime.toISOString());
    }
    
    this.startSessionTimer();
  }

  logout() {
    this.user = null;
    this.isAuthenticated = false;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sba_user');
      localStorage.removeItem('sba_session_expiry');
    }
    
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  refreshSession() {
    if (this.isAuthenticated && this.user) {
      const expiryTime = new Date(Date.now() + 30 * 60 * 1000);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('sba_session_expiry', expiryTime.toISOString());
      }
      
      this.startSessionTimer();
    }
  }

  private startSessionTimer() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Auto logout after 30 minutes of inactivity
    this.sessionTimeout = setTimeout(() => {
      this.logout();
      window.location.href = '/login';
    }, 30 * 60 * 1000);
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  get isAdmin() {
    return this.user?.role === 'admin';
  }

  get fullName() {
    return this.user ? `${this.user.firstName} ${this.user.lastName}` : '';
  }
}

export const authStore = new AuthStore();