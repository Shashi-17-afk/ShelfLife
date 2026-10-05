import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Librarian, LoginResponse } from '../types';

interface AuthContextType {
  token: string | null;
  librarian: Librarian | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shelflife_token'));
  const [librarian, setLibrarian] = useState<Librarian | null>(() => {
    const stored = localStorage.getItem('shelflife_librarian');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state on initial mount & listen to 401 events
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setLibrarian(null);
    };

    window.addEventListener('shelflife:unauthorized', handleUnauthorized);
    setIsLoading(false);

    return () => {
      window.removeEventListener('shelflife:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    const { token: receivedToken, librarian: receivedLibrarian } = response.data;

    setToken(receivedToken);
    setLibrarian(receivedLibrarian);

    localStorage.setItem('shelflife_token', receivedToken);
    localStorage.setItem('shelflife_librarian', JSON.stringify(receivedLibrarian));
  };

  const logout = () => {
    setToken(null);
    setLibrarian(null);
    localStorage.removeItem('shelflife_token');
    localStorage.removeItem('shelflife_librarian');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        librarian,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
