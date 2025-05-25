// utils/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  AuthResponse, 
  BalanceResponse, 
  LoginData, 
  RegisterData, 
  TopUpData, 
  TopUpResponse,
  TransactionsResponse,
  TransferData,
  TransferResponse,
  WithdrawData,
  WithdrawResponse
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/users/register', userData);
  return response.data;
};

export const login = async (credentials: LoginData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/users/login', credentials);
  return response.data;
};

export const getBalance = async (): Promise<BalanceResponse> => {
  const response = await api.get<BalanceResponse>('/users/balance');
  return response.data;
};

export const topUpWallet = async (topUpData: TopUpData): Promise<TopUpResponse> => {
  const response = await api.post<TopUpResponse>('/wallet/topup', topUpData);
  return response.data;
};

export const transferFunds = async (transferData: TransferData): Promise<TransferResponse> => {
  const response = await api.post<TransferResponse>('/wallet/transfer', transferData);
  return response.data;
};

export const withdrawFunds = async (withdrawData: WithdrawData): Promise<WithdrawResponse> => {
  const response = await api.post<WithdrawResponse>('/wallet/withdraw', withdrawData);
  return response.data;
};

export const getTransactions = async (page: number = 1, limit: number = 10, type: string | null = null): Promise<TransactionsResponse> => {
  const params: Record<string, string | number> = { page, limit };
  if (type) params.type = type;
  
  const response = await api.get<TransactionsResponse>('/transactions', { params });
  return response.data;
};

export default api;