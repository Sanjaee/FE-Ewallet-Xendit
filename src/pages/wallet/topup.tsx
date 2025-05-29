import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calculator,
  Info,
  DollarSign,
  ArrowRight,
  Gift,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ===========================================
// INTERFACES & TYPES
// ===========================================

interface PaymentMethod {
  id: string;
  name: string;
  requiresRedirect: boolean;
  description?: string;
}

interface FeeCalculation {
  amount: number;
  fee: number;
  total: number;
  feeType: string;
  breakdown: {
    originalAmount: number;
    transactionFee: number;
    totalRequired: number;
  };
}

interface TopUpResponse {
  success: boolean;
  data: {
    referenceId: string;
    status: string;
    paymentId: string;
    checkoutUrl?: string;
    isRedirectRequired: boolean;
    qrString?: string;
    amount: number;
    fee: number;
    totalAmount: number;
    message?: string;
  };
  error?: string;
}

interface PaymentStatus {
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  amount: number;
  referenceId: string;
  currentBalance: number;
  createdAt: string;
}

interface BalanceResponse {
  message: string;
  data: {
    balance: number;
  };
}

// ===========================================
// CONFIGURATION
// ===========================================

const PRESET_AMOUNTS: number[] = [50000, 100000, 200000, 500000, 1000000];
const MIN_TOPUP_AMOUNT = 10000;
const MAX_TOPUP_AMOUNT = 10000000;

// PERBAIKAN: Fee calculation function - NO FEE for topup
const calculateTransactionFee = (amount: number): number => {
  // TOPUP GRATIS - tidak ada biaya tambahan
  return 0;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "ID_OVO",
    name: "OVO",
    requiresRedirect: false,
    description: "Scan QR atau buka app OVO",
  },
  {
    id: "ID_DANA",
    name: "DANA",
    requiresRedirect: true,
    description: "Redirect ke app DANA",
  },
  {
    id: "ID_LINKAJA",
    name: "LinkAja",
    requiresRedirect: false,
    description: "Scan QR atau buka app LinkAja",
  },
  {
    id: "ID_SHOPEEPAY",
    name: "ShopeePay",
    requiresRedirect: true,
    description: "Redirect ke app ShopeePay",
  },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function TopUpNoFee() {
  // State Management
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState<boolean>(false);
  const [isCalculatingFee, setIsCalculatingFee] = useState<boolean>(false);

  // Status States
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "waiting" | "success" | "failed"
  >("idle");
  const [currentReferenceId, setCurrentReferenceId] = useState<string>("");
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);

  // Hooks
  const router = useRouter();
  const { toast } = useToast();
  const { getAuthToken } = useAuth();

  // ===========================================
  // EFFECTS
  // ===========================================

  useEffect(() => {
    fetchCurrentBalance();
  }, []);

  // Calculate fee when amount changes (now always 0)
  useEffect(() => {
    const amount = getFinalAmount();
    if (amount > 0) {
      calculateFeeForAmount(amount);
    } else {
      setFeeCalculation(null);
    }
  }, [selectedAmount, customAmount]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (isPolling) {
        setIsPolling(false);
      }
    };
  }, []);

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const parseAmount = (value: string): number => {
    return parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
  };

  const validateAmount = (amount: number): string | null => {
    if (!amount || amount <= 0) {
      return "Jumlah harus lebih dari 0";
    }
    if (amount < MIN_TOPUP_AMOUNT) {
      return `Minimum top up ${formatCurrency(MIN_TOPUP_AMOUNT)}`;
    }
    if (amount > MAX_TOPUP_AMOUNT) {
      return `Maximum top up ${formatCurrency(MAX_TOPUP_AMOUNT)}`;
    }
    return null;
  };

  const getSelectedPaymentMethod = (): PaymentMethod | null => {
    return (
      PAYMENT_METHODS.find((method) => method.id === paymentMethod) || null
    );
  };

  const getFinalAmount = (): number => {
    if (selectedAmount === "custom") {
      return parseAmount(customAmount);
    }
    return parseAmount(selectedAmount);
  };

  // ===========================================
  // FEE CALCULATION (NOW ALWAYS 0)
  // ===========================================

  const calculateFeeForAmount = async (amount: number): Promise<void> => {
    try {
      setIsCalculatingFee(true);

      // PERBAIKAN: No fee calculation - always 0
      const fee = 0; // Always free
      const total = amount; // No additional cost

      setFeeCalculation({
        amount,
        fee,
        total,
        feeType: "Gratis - Tanpa Biaya Tambahan",
        breakdown: {
          originalAmount: amount,
          transactionFee: 0,
          totalRequired: amount,
        },
      });

      console.log("💰 Fee calculation (FREE):", {
        amount,
        fee: 0,
        total: amount,
        message: "Top up gratis tanpa biaya"
      });

    } catch (error) {
      console.error("Fee calculation error:", error);
    } finally {
      setIsCalculatingFee(false);
    }
  };

  // ===========================================
  // API FUNCTIONS
  // ===========================================

  const fetchCurrentBalance = async (): Promise<void> => {
    try {
      setIsFetchingBalance(true);
      console.log("🔄 Fetching current balance...");

      const response = await fetch(`${API_BASE_URL}/api/users/balance`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BalanceResponse = await response.json();
      console.log("💰 Balance response:", data);

      if (data.data && typeof data.data.balance === "number") {
        setCurrentBalance(data.data.balance);
        console.log("✅ Balance updated:", data.data.balance);
      } else {
        throw new Error("Invalid balance data format");
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch balance:", error);
      toast({
        title: "Gagal Memuat Saldo",
        description:
          "Tidak dapat mengambil saldo terkini. Silakan refresh halaman.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const createTopUpRequest = async (
    amount: number,
    method: string
  ): Promise<TopUpResponse> => {
    console.log("🚀 Creating topup request (NO FEE):", { amount, method });
    
    const response = await fetch(`${API_BASE_URL}/api/wallet/topup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        amount, // Exact amount, no additional fee
        paymentMethod: method,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  };

  const checkPaymentStatus = async (
    referenceId: string
  ): Promise<PaymentStatus> => {
    const response = await fetch(
      `${API_BASE_URL}/api/wallet/topup/status/${referenceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP ${response.status}: Status check failed`
      );
    }

    return response.json();
  };

  // ===========================================
  // PAYMENT POLLING LOGIC
  // ===========================================

  const startPaymentPolling = async (referenceId: string): Promise<void> => {
    const MAX_ATTEMPTS = 36; // 3 minutes with 5 second intervals
    const POLLING_INTERVAL = 5000; // 5 seconds

    setIsPolling(true);
    setPollingAttempts(0);
    setPaymentStatus("waiting");
    setCurrentReferenceId(referenceId);

    console.log(`🔄 Starting payment polling for reference: ${referenceId}`);

    const pollStatus = async (attemptNumber: number): Promise<void> => {
      try {
        console.log(
          `📡 Polling attempt ${
            attemptNumber + 1
          }/${MAX_ATTEMPTS} for ${referenceId}`
        );
        setPollingAttempts(attemptNumber + 1);

        const statusData = await checkPaymentStatus(referenceId);
        console.log("📊 Payment status:", statusData);

        switch (statusData.status) {
          case "COMPLETED":
            console.log("✅ Payment completed successfully!");
            setIsPolling(false);
            setPaymentStatus("success");

            // Update balance immediately
            setCurrentBalance(statusData.currentBalance);

            toast({
              title: "Pembayaran Berhasil! 🎉",
              description: `Top up ${formatCurrency(
                statusData.amount
              )} berhasil. Saldo baru: ${formatCurrency(
                statusData.currentBalance
              )}`,
            });

            // Reset form after success
            setTimeout(() => {
              resetForm();
            }, 3000);
            return;

          case "FAILED":
          case "CANCELLED":
            console.log("❌ Payment failed or cancelled");
            setIsPolling(false);
            setPaymentStatus("failed");

            toast({
              title: "Pembayaran Gagal ❌",
              description: "Pembayaran tidak berhasil. Silakan coba lagi.",
              variant: "destructive",
            });
            return;

          case "PENDING":
            // Continue polling if not reached max attempts
            if (attemptNumber < MAX_ATTEMPTS - 1) {
              setTimeout(() => {
                if (isPolling) {
                  pollStatus(attemptNumber + 1);
                }
              }, POLLING_INTERVAL);
            } else {
              // Max attempts reached
              console.log("⏰ Polling timeout reached");
              setIsPolling(false);
              setPaymentStatus("failed");

              toast({
                title: "Timeout Pembayaran",
                description:
                  "Pembayaran membutuhkan waktu lebih lama. Silakan cek riwayat transaksi atau hubungi customer service.",
                variant: "destructive",
              });
            }
            break;

          default:
            console.warn("⚠️ Unknown payment status:", statusData.status);
            break;
        }
      } catch (error: any) {
        console.error(
          `❌ Polling error (attempt ${attemptNumber + 1}):`,
          error
        );

        // Retry on error if not reached max attempts
        if (attemptNumber < MAX_ATTEMPTS - 1) {
          setTimeout(() => {
            if (isPolling) {
              pollStatus(attemptNumber + 1);
            }
          }, POLLING_INTERVAL);
        } else {
          setIsPolling(false);
          setPaymentStatus("failed");

          toast({
            title: "Error Cek Status",
            description:
              "Tidak dapat mengecek status pembayaran. Silakan refresh halaman atau cek riwayat transaksi.",
            variant: "destructive",
          });
        }
      }
    };

    // Start polling after initial delay
    setTimeout(() => {
      if (isPolling) {
        pollStatus(0);
      }
    }, 2000);
  };

  // ===========================================
  // EVENT HANDLERS
  // ===========================================

  const handleAmountSelect = (value: string): void => {
    setSelectedAmount(value);
    if (value !== "custom") {
      setCustomAmount("");
    }
  };

  const handleCustomAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    // Only allow numbers
    const numericValue = value.replace(/[^\d]/g, "");
    setCustomAmount(numericValue);
    setSelectedAmount("custom");
  };

  const handlePaymentMethodChange = (value: string): void => {
    setPaymentMethod(value);
  };

  const resetForm = (): void => {
    setSelectedAmount("");
    setCustomAmount("");
    setPaymentMethod("");
    setPaymentStatus("idle");
    setCurrentReferenceId("");
    setPollingAttempts(0);
    setFeeCalculation(null);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    // Validation
    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Pilih metode pembayaran terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const amount = getFinalAmount();
    const amountError = validateAmount(amount);

    if (amountError) {
      toast({
        title: "Error",
        description: amountError,
        variant: "destructive",
      });
      return;
    }

    const selectedMethod = getSelectedPaymentMethod();
    if (!selectedMethod) {
      toast({
        title: "Error",
        description: "Metode pembayaran tidak valid",
        variant: "destructive",
      });
      return;
    }

    // PERBAIKAN: Hapus validasi fee karena tidak ada biaya
    // No need to check balance for fee since topup is free

    setIsSubmitting(true);
    setPaymentStatus("processing");

    try {
      console.log("🚀 Submitting topup request (NO FEE):", {
        amount,
        paymentMethod,
        selectedMethod: selectedMethod.name,
        feeCalculation: { ...feeCalculation, fee: 0 },
      });

      const response = await createTopUpRequest(amount, paymentMethod);
      console.log("📝 TopUp response (NO FEE):", response);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Respons server tidak valid");
      }

      const { data } = response;

      // Handle redirect-based payments
      if (data.isRedirectRequired && data.checkoutUrl) {
        console.log("🔄 Redirect required to:", data.checkoutUrl);

        toast({
          title: "Mengarahkan ke Gateway Pembayaran",
          description: `Anda akan diarahkan ke aplikasi ${selectedMethod.name} untuk menyelesaikan pembayaran GRATIS (tanpa biaya tambahan)`,
        });

        // Start polling before redirect
        if (data.referenceId) {
          startPaymentPolling(data.referenceId);
        }

        // Redirect after short delay
        setTimeout(() => {
          window.location.href = data.checkoutUrl!;
        }, 2000);

        return;
      }

      // Handle QR-based payments
      if (data.qrString) {
        toast({
          title: "Scan QR Code",
          description: `Buka aplikasi ${selectedMethod.name} dan scan QR code untuk menyelesaikan pembayaran GRATIS`,
        });
      } else {
        toast({
          title: "Top Up Dimulai",
          description: `Silakan buka aplikasi ${selectedMethod.name} untuk menyelesaikan pembayaran GRATIS (${formatCurrency(amount)})`,
        });
      }

      // Start polling for payment status
      if (data.referenceId) {
        startPaymentPolling(data.referenceId);
      } else {
        throw new Error("Reference ID tidak tersedia");
      }
    } catch (error: any) {
      console.error("❌ TopUp submission error:", error);
      setPaymentStatus("failed");

      toast({
        title: "Error Top Up",
        description:
          error.message ||
          "Terjadi kesalahan saat memproses top up. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopPolling = (): void => {
    setIsPolling(false);
    setPaymentStatus("idle");
    setCurrentReferenceId("");
    setPollingAttempts(0);
  };

  // ===========================================
  // RENDER HELPERS
  // ===========================================

  const renderCurrentBalance = () => (
    <Card className="mb-6">
      <CardHeader className="pb-1">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Saldo Saat Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {isFetchingBalance ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat...
            </div>
          ) : (
            formatCurrency(currentBalance)
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCurrentBalance}
          disabled={isFetchingBalance}
          className="mt-2"
        >
          {isFetchingBalance ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Refresh Saldo
        </Button>
      </CardContent>
    </Card>
  );

  const renderAmountSelection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Pilih Jumlah Top Up
        </CardTitle>
        <CardDescription className="text-green-600 font-medium">
          Minimum {formatCurrency(MIN_TOPUP_AMOUNT)} - Maximum{" "}
          {formatCurrency(MAX_TOPUP_AMOUNT)} • 🎉 GRATIS tanpa biaya tambahan!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedAmount} onValueChange={handleAmountSelect}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PRESET_AMOUNTS.map((amount) => (
              <div key={amount} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={amount.toString()}
                  id={`amount-${amount}`}
                />
                <Label
                  htmlFor={`amount-${amount}`}
                  className="cursor-pointer flex-1 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{formatCurrency(amount)}</div>
                  <div className="text-xs text-green-600">Gratis</div>
                </Label>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="amount-custom" />
            <Label htmlFor="amount-custom" className="cursor-pointer">
              Jumlah Lain (Tetap Gratis)
            </Label>
          </div>

          {selectedAmount === "custom" && (
            <div className="mt-3">
              <Input
                type="text"
                placeholder="Masukkan jumlah"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="text-lg"
              />
              {customAmount && (
                <div className="mt-2">
                  <p className="text-lg font-medium text-gray-900">
                    {formatCurrency(parseAmount(customAmount))}
                  </p>
                  <p className="text-sm text-green-600">
                    ✨ tanpa biaya tambahan
                  </p>
                </div>
              )}
            </div>
          )}
        </RadioGroup>
      </CardContent>
    </Card>
  );

  // PERBAIKAN: renderFeeCalculation untuk menampilkan "GRATIS"
  const renderFeeCalculation = () => {
    if (!feeCalculation) return null;

    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Gift className="h-5 w-5" />
            Rincian Pembayaran
            {isCalculatingFee && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Jumlah Top Up:</span>
              <span className="font-medium text-lg">
                {formatCurrency(feeCalculation.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Biaya Transaksi:</span>
              <span className="font-bold text-green-600 text-lg">
                GRATIS! 🎉
              </span>
            </div>
            <hr className="border-green-200" />
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-gray-900">Total Pembayaran:</span>
              <span className="text-green-600">
                {formatCurrency(feeCalculation.amount)}
              </span>
            </div>
          </div>

          <Alert className="mt-4 bg-green-100 border-green-300">
            <Gift className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 <strong>Top up GRATIS tanpa biaya tambahan!</strong> Yang Anda bayar = Yang Anda terima di saldo.
              Tidak ada potongan atau biaya tersembunyi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  const renderPaymentMethods = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Pilih Metode Pembayaran</CardTitle>
        <CardDescription>
          Pilih salah satu metode pembayaran yang tersedia • Semua gratis tanpa biaya
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={paymentMethod}
          onValueChange={handlePaymentMethodChange}
        >
          <div className="grid gap-3">
            {PAYMENT_METHODS.map((method) => (
              <div key={method.id} className="flex items-center space-x-2">
                <RadioGroupItem value={method.id} id={`payment-${method.id}`} />
                <Label
                  htmlFor={`payment-${method.id}`}
                  className="cursor-pointer flex-1 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-600">
                        {method.description}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        ✨ Gratis tanpa biaya
                      </div>
                    </div>
                    {method.requiresRedirect && (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderPaymentStatus = () => {
    if (paymentStatus === "idle") return null;

    const statusConfig = {
      processing: {
        icon: <Loader2 className="h-6 w-6 animate-spin text-blue-600" />,
        title: "Memproses Pembayaran...",
        description: "Sedang menginisialisasi pembayaran gratis",
        variant: "default" as const,
      },
      waiting: {
        icon: <Clock className="h-6 w-6 text-orange-600" />,
        title: "Menunggu Pembayaran",
        description: `Menunggu konfirmasi pembayaran gratis... (${pollingAttempts}/36)`,
        variant: "default" as const,
      },
      success: {
        icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
        title: "Pembayaran Berhasil! 🎉",
        description: "Top up gratis telah berhasil diproses",
        variant: "default" as const,
      },
      failed: {
        icon: <AlertCircle className="h-6 w-6 text-red-600" />,
        title: "Pembayaran Gagal",
        description: "Terjadi kesalahan dalam pembayaran",
        variant: "destructive" as const,
      },
    };

    const config = statusConfig[paymentStatus];

    return (
      <Alert className="mb-6" variant={config.variant}>
        <div className="flex items-center gap-3">
          {config.icon}
          <div className="flex-1">
            <div className="font-medium">{config.title}</div>
            <div className="text-sm">{config.description}</div>
            {currentReferenceId && (
              <div className="text-xs text-gray-500 mt-1">
                Ref ID: {currentReferenceId}
              </div>
            )}
          </div>
          {isPolling && (
            <Button variant="outline" size="sm" onClick={stopPolling}>
              Batal
            </Button>
          )}
        </div>
      </Alert>
    );
  };

  const canSubmit = () => {
    const amount = getFinalAmount();
    return (
      amount > 0 &&
      paymentMethod &&
      !validateAmount(amount) &&
      !isSubmitting &&
      paymentStatus === "idle"
    );
  };

  // ===========================================
  // MAIN RENDER
  // ===========================================

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Up Saldo</h1>
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
          <Gift className="h-4 w-4" />
          <span className="font-medium">100% GRATIS - Tanpa Biaya Tambahan!</span>
        </div>
        <p className="text-gray-600 mt-2">
          Isi saldo Anda dengan mudah menggunakan e-wallet favorit
        </p>
      </div>

      {renderCurrentBalance()}

      <form onSubmit={handleSubmit}>
        {renderAmountSelection()}
        {renderFeeCalculation()}
        {renderPaymentMethods()}
        {renderPaymentStatus()}

        <Card>
          <CardFooter className="pt-6">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={!canSubmit()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Lanjutkan Pembayaran GRATIS
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {paymentStatus !== "idle" && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={resetForm} disabled={isPolling}>
            Buat Transaksi Baru
          </Button>
        </div>
      )}

      {/* Info Panel */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-2">Informasi Penting:</h4>
              <ul className="space-y-1 text-xs">
                <li>✅ Top up 100% GRATIS tanpa biaya tambahan apapun</li>
                <li>✅ Yang Anda bayar = Yang Anda terima di saldo</li>
                <li>✅ Tidak ada biaya tersembunyi atau potongan</li>
                <li>✅ Proses otomatis dan langsung masuk ke saldo Anda</li>
                <li>⚡ Pembayaran akan diproses melalui gateway Xendit yang aman</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}