// src/utils/api.ts
import axios, { AxiosInstance } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
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
  WithdrawResponse,
} from "@/types"; // Tipe-tipe ini tetap diimpor dari @/types

// Definisikan dan ekspor tipe yang digunakan langsung oleh fungsi di file ini
export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  data?: AuthResponse["data"]; // Menggunakan tipe data dari AuthResponse untuk konsistensi
  error?: string;
}

export interface ResendOtpData {
  email: string;
  type?: "VERIFICATION" | "PASSWORD_RESET";
}

export interface ResendOtpResponse {
  message: string;
  error?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}


export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface GenericMessageResponse {
  message: string;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  }
);

export const register = async (
  userData: RegisterData // Tipe dari @/types
): Promise<AuthResponse> => {
  // Tipe dari @/types
  const response = await api.post<AuthResponse>(
    "/api/users/register",
    userData
  );
  return response.data;
};

export const login = async (credentials: LoginData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/api/users/login",
    credentials
  );
  return response.data;
};

export const verifyOtp = async (
  otpData: VerifyOtpData // Tipe didefinisikan & diekspor di file ini
): Promise<VerifyOtpResponse> => {
  // Tipe didefinisikan & diekspor di file ini
  const response = await api.post<VerifyOtpResponse>(
    "/api/users/verify-otp",
    otpData
  );
  return response.data;
};

export const resendOtp = async (
  resendOtpData: ResendOtpData // Tipe didefinisikan & diekspor di file ini
): Promise<ResendOtpResponse> => {
  // Tipe didefinisikan & diekspor di file ini
  const response = await api.post<ResendOtpResponse>(
    "/api/users/resend-otp",
    resendOtpData
  );
  return response.data;
};

export const forgotPassword = async (
  data: ForgotPasswordData // Tipe didefinisikan & diekspor di file ini
): Promise<GenericMessageResponse> => {
  // Tipe didefinisikan & diekspor di file ini
  const response = await api.post<GenericMessageResponse>(
    "/api/users/forgot-password",
    data
  );
  return response.data;
};

export const resetPassword = async (
  data: ResetPasswordData // Tipe didefinisikan & diekspor di file ini
): Promise<GenericMessageResponse> => {
  // Tipe didefinisikan & diekspor di file ini
  const response = await api.post<GenericMessageResponse>(
    "/api/users/reset-password",
    data
  );
  return response.data;
};

export const changePassword = async (
  data: ChangePasswordData // Tipe didefinisikan & diekspor di file ini
): Promise<GenericMessageResponse> => {
  // Tipe didefinisikan & diekspor di file ini
  const response = await api.post<GenericMessageResponse>(
    "/api/users/change-password",
    data
  );
  return response.data;
};

export const getBalance = async (): Promise<BalanceResponse> => {
  // Tipe dari @/types
  const response = await api.get<BalanceResponse>("/api/users/balance");
  return response.data;
};

export const topUpWallet = async (
  topUpData: TopUpData // Tipe dari @/types
): Promise<TopUpResponse> => {
  // Tipe dari @/types
  const response = await api.post<TopUpResponse>(
    "/api/wallet/topup",
    topUpData
  );
  return response.data;
};

export const transferFunds = async (
  transferData: TransferData // Tipe dari @/types
): Promise<TransferResponse> => {
  // Tipe dari @/types
  const response = await api.post<TransferResponse>(
    "/api/wallet/transfer",
    transferData
  );
  return response.data;
};

export const withdrawFunds = async (
  withdrawData: WithdrawData // Tipe dari @/types
): Promise<WithdrawResponse> => {
  // Tipe dari @/types
  const response = await api.post<WithdrawResponse>(
    "/api/wallet/withdraw",
    withdrawData
  );
  return response.data;
};

export const getTransactions = async (
  page: number = 1,
  limit: number = 10,
  type: string | null = null
): Promise<TransactionsResponse> => {
  // Tipe dari @/types
  const params: Record<string, string | number | null> = { page, limit };
  if (type) params.type = type;

  const response = await api.get<TransactionsResponse>("/api/transactions", {
    params,
  });
  return response.data;
};

export default api;
