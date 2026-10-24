import { createContext, useContext, useState } from 'react';
import { LOCAL_STORAGE_KEYS } from '../constants/localStorage/keys';
import type { ReactNode } from 'react';

export interface IUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: IUser | null;
  login: (userData: IUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData: IUser) => {
    setUser(userData);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};