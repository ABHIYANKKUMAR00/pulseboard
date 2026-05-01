import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pb_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persistUser = (userData) => {
    setUser(userData);
    localStorage.setItem('pb_user', JSON.stringify(userData));
  };

  useEffect(() => {
    const token = localStorage.getItem('pb_token');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => persistUser(data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pb_token', data.token);
    persistUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    const { data } = await api.post('/auth/signup', { name, email, password, role });
    localStorage.setItem('pb_token', data.token);
    persistUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pb_token');
    localStorage.removeItem('pb_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('pb_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
