import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Auth, getToken, setToken, clearToken } from '@/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (username, password) => {
    const data = await Auth.login(username, password);
    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    try {
      await Auth.logout();
    } finally {
      clearToken();
      setUser(null);
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
  }, []);

  const register = useCallback(async (username, password, role) => {
    return Auth.register(username, password, role);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, username: payload.username, role: payload.role });
      } catch {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}