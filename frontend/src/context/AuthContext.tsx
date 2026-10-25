import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api';
import { getToken, setToken } from '../api/client';
import type { User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  initialising: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (displayName: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!getToken()) {
        setInitialising(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setInitialising(false);
      }
    };

    void bootstrap();

    const onUnauthorized = () => setUser(null);
    window.addEventListener('ws:unauthorized', onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('ws:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(
    async (displayName: string, email: string, password: string, phone?: string) => {
      const response = await authApi.register(displayName, email, password, phone);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // A revoked or expired token is just as good as a successful logout.
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    const me = await authApi.me();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initialising, login, register, logout, refresh, setUser }),
    [user, initialising, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
