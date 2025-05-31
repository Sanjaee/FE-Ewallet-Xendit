// src/types/index.ts

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResendOtpData {
  email: string;
  type?: "VERIFICATION" | "PASSWORD_RESET"; // Sesuai backend
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

// Untuk respons umum yang hanya berisi pesan
export interface GenericMessageResponse {
  message: string;
  error?: string; // Opsional jika API mengembalikan error di body
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  token?: string; // Token mungkin ada di sini atau di AuthResponseData
  isVerified?: boolean;
  // tambahkan properti lain jika ada
}

export interface AuthResponseData extends User {
  token: string; // Pastikan token ada di sini
  needsVerification?: boolean;
}

export interface AuthResponse {
  message: string;
  data?: AuthResponseData; // data bisa optional jika ada error
  error?: string;
  needsVerification?: boolean; // Khusus untuk login jika belum terverifikasi
  email?: string; // Khusus untuk login jika belum terverifikasi
}

export interface VerifyOtpResponse {
  message: string;
  data?: AuthResponseData; // Mirip dengan AuthResponse setelah berhasil verify
  error?: string;
}

export interface ResendOtpResponse {
  message: string;
  error?: string;
}

// Tambahkan tipe lain yang sudah ada di file Anda
export interface BalanceResponse {
  message: string;
  data: { balance: number; cached_at: string };
}

export interface TopUpData {
  amount: number;
  paymentMethod: string;
}

export interface TopUpResponse {
  success: boolean;
  data: {
    referenceId: string;
    status: string;
    paymentId: string;
    checkoutUrl: string | null;
    isRedirectRequired: boolean;
    qrString: string | null;
  };
  error?: string;
  details?: string;
}

export interface TransferData {
  recipientPhoneNumber: string;
  amount: number;
  description?: string;
}

export interface TransferResponse {
  message: string;
  data: {
    amount: number;
    fee: number;
    total: number;
    recipientName: string;
    recipientPhoneNumber: string;
  };
  error?: string;
}

export interface WithdrawData {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface WithdrawResponse {
  message: string;
  data: {
    withdrawalId: string;
    amount: number;
    fee: number;
    total: number;
    status: string;
  };
  error?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  recipientId?: string | null;
  type: string; // TOPUP, TRANSFER, WITHDRAW, FEE
  amount: number;
  status: string; // PENDING, COMPLETED, FAILED
  referenceId?: string | null;
  xenditPaymentRequestId?: string | null;
  description?: string | null;
  adminWithdrawn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsResponse {
  message: string;
  data: {
    transactions: Transaction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    cached_at: string;
  };
  error?: string;
}