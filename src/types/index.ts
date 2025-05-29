// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  phoneNumber?: string;
  balance?: number;
}

export interface AuthResponse {
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    token: string;
  };
}

export interface BalanceResponse {
  message: string;
  data: {
    balance: number;
  };
}

export interface TopUpData {
  amount: number;
  paymentMethod: string;
}

export interface TopUpResponse {
  message: string;
  data: {
    paymentId: string;
    checkoutUrl: string | null;
  };
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
    recipientEmail: string;
  };
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
}

export interface Transaction {
  id: string;
  userId: string;
  recipientId?: string;
  type: "TOPUP" | "TRANSFER" | "WITHDRAW" | "FEE";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  referenceId?: string;
  description?: string;
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
  };
}

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

export interface WithdrawDetails {
  amount: number;
  fee: number;
  actualAmount: number;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface TransferDetails {
  recipientPhoneNumber: string;
  amount: number;
  fee: number;
  total: number;
  description: string;
}

export interface Bank {
  code: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
} // @/types/index.ts
export interface PaymentMethod {
  id: string;
  name: string;
  requiresRedirect?: boolean;
}
