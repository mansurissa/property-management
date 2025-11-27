import { LoginResponse, User } from '@/types/api';

const SESSION_KEY = 'auth_session';

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
  remember?: boolean;
}

class SessionManager {
  private getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // Check both localStorage and sessionStorage
      let session = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (!session) return null;
      
      const parsed = JSON.parse(session) as AuthSession;
      
      // Check if session is expired
      if (Date.now() > parsed.expiresAt) {
        this.clearSession();
        return null;
      }
      
      return parsed;
    } catch {
      this.clearSession();
      return null;
    }
  }

  setSession(loginResponse: LoginResponse, expirationHours: number = 8, remember: boolean = false): void {
    if (typeof window === 'undefined') return;
    
    const session: AuthSession = {
      token: loginResponse.token,
      user: loginResponse.user,
      expiresAt: Date.now() + (expirationHours * 60 * 60 * 1000), // Default 8 hours
    };
    
    // Use localStorage for persistent sessions, sessionStorage for temporary
    if (remember) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  getUser(): AuthSession['user'] | null {
    const session = this.getSession();
    return session?.user || null;
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  isAgency(): boolean {
    return this.hasRole('agency');
  }

  isOwner(): boolean {
    return this.hasRole('owner');
  }

  isTenant(): boolean {
    return this.hasRole('tenant');
  }

  isMaintenance(): boolean {
    return this.hasRole('maintenance');
  }

  getUserRole(): string | null {
    const user = this.getUser();
    return user?.role || null;
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser();

    // Super Admin always has all permissions
    if (user?.role === 'super_admin') {
      return true;
    }

    // Check if user has the specific permission
    if (!user?.permissions) {
      return false;
    }

    return user.permissions[permission as keyof typeof user.permissions] === true;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  getAccessToken(): string | null {
    return this.getToken();
  }
}

export const sessionManager = new SessionManager();

// Helper functions for easier usage
export const getSession = () => sessionManager.isAuthenticated() ? {
  token: sessionManager.getToken(),
  user: sessionManager.getUser()
} : null;

export const clearSession = () => sessionManager.clearSession();

export const isAuthenticated = () => sessionManager.isAuthenticated();

export const getToken = () => sessionManager.getToken();

export const getUser = () => sessionManager.getUser();
