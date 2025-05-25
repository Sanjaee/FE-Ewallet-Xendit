// utils/auth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { User } from '@/types';

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

export const setUserData = (userData: Partial<User>): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};

export const getUserData = (): Partial<User> | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

export const useAuth = () => {
  const router = useRouter();
  
  useEffect(() => {
    const token = getAuthToken();
    if (!token && !router.pathname.startsWith('/auth')) {
      router.push('/auth/login');
    }
  }, [router]);
  
  return { getAuthToken, getUserData };
};

export const useGuest = (): void => {
  const router = useRouter();
  
  useEffect(() => {
    const token = getAuthToken();
    if (token && router.pathname.startsWith('/auth')) {
      router.push('/');
    }
  }, [router]);
};