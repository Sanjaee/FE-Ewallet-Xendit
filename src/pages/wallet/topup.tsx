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

// Fee calculation function (matches backend)
const calculateTransactionFee = (amount: number): number => {
  const STANDARD_FEE = 2500;
  const HIGH_AMOUNT_THRESHOLD = 250000000; // 250 million
  const HIGH_AMOUNT_FEE = 50000;

  return amount >= HIGH_AMOUNT_THRESHOLD ? HIGH_AMOUNT_FEE : STANDARD_FEE;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function TopUpWithFixedFee() {
  // State Management
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(
    null
  );

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

  // Calculate fee when amount changes
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
  // FEE CALCULATION
  // ===========================================

  const calculateFeeForAmount = async (amount: number): Promise<void> => {
    try {
      setIsCalculatingFee(true);

      // Use local calculation for immediate feedback
      const fee = calculateTransactionFee(amount);
      const total = amount + fee;

      setFeeCalculation({
        amount,
        fee,
        total,
        feeType:
          amount >= 250000000
            ? "High Amount Fee (Rp 50,000)"
            : "Standard Fee (Rp 2,500)",
        breakdown: {
          originalAmount: amount,
          transactionFee: fee,
          totalRequired: total,
        },
      });

      // Optional: Verify with server for additional security
      const response = await fetch(`${API_BASE_URL}/api/wallet/calculate-fee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          amount,
          transactionType: "TOPUP",
        }),
      });

      if (response.ok) {
        const serverFeeData = await response.json();
        if (serverFeeData.success) {
          // Verify local calculation matches server
          if (serverFeeData.data.fee !== fee) {
            console.warn("Fee calculation mismatch detected!");
            setFeeCalculation(serverFeeData.data);
          }
        }
      }
    } catch (error) {
      console.error("Fee calculation error:", error);
      // Keep local calculation as fallback
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
    const response = await fetch(`${API_BASE_URL}/api/wallet/topup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        amount,
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
                  // Check if still polling (component not unmounted)
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

    // Validate user has sufficient balance for fee (if applicable)
    if (feeCalculation && currentBalance < feeCalculation.fee) {
      toast({
        title: "Saldo Tidak Cukup",
        description: `Anda memerlukan minimal ${formatCurrency(
          feeCalculation.fee
        )} untuk biaya transaksi`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setPaymentStatus("processing");

    try {
      console.log("🚀 Submitting topup request:", {
        amount,
        paymentMethod,
        selectedMethod: selectedMethod.name,
        feeCalculation,
      });

      const response = await createTopUpRequest(amount, paymentMethod);
      console.log("📝 TopUp response:", response);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Respons server tidak valid");
      }

      const { data } = response;

      // Handle redirect-based payments
      if (data.isRedirectRequired && data.checkoutUrl) {
        console.log("🔄 Redirect required to:", data.checkoutUrl);

        toast({
          title: "Mengarahkan ke Gateway Pembayaran",
          description: `Anda akan diarahkan ke aplikasi ${selectedMethod.name} untuk menyelesaikan pembayaran`,
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
          description: `Buka aplikasi ${selectedMethod.name} dan scan QR code untuk menyelesaikan pembayaran`,
        });
      } else {
        toast({
          title: "Top Up Dimulai",
          description: `Silakan buka aplikasi ${selectedMethod.name} untuk menyelesaikan pembayaran`,
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
        <CardTitle>Pilih Jumlah Top Up</CardTitle>
        <CardDescription>
          Minimum {formatCurrency(MIN_TOPUP_AMOUNT)} - Maximum{" "}
          {formatCurrency(MAX_TOPUP_AMOUNT)}
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
                  className="cursor-pointer flex-1 p-3 border rounded-lg hover:bg-gray-50"
                >
                  {formatCurrency(amount)}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="amount-custom" />
            <Label htmlFor="amount-custom" className="cursor-pointer">
              Jumlah Lain
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
              <p className="text-sm text-gray-600 mt-1">
                {customAmount && formatCurrency(parseAmount(customAmount))}
              </p>
            </div>
          )}
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderFeeCalculation = () => {
    if (!feeCalculation) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Rincian Biaya
            {isCalculatingFee && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Jumlah Top Up:</span>
              <span className="font-medium">
                {formatCurrency(feeCalculation.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Transaksi:</span>
              <span className="font-medium">
                {formatCurrency(feeCalculation.fee)}
              </span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total yang Diperlukan:</span>
              <span>{formatCurrency(feeCalculation.total)}</span>
            </div>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {feeCalculation.feeType} -{" "}
              {feeCalculation.feeType.includes("High")
                ? "Berlaku untuk top up di atas Rp 250.000.000"
                : "Biaya standar untuk semua transaksi"}
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
          Pilih salah satu metode pembayaran yang tersedia
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
                  className="cursor-pointer flex-1 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-600">
                        {method.description}
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
        description: "Sedang menginisialisasi pembayaran",
        variant: "default" as const,
      },
      waiting: {
        icon: <Clock className="h-6 w-6 text-orange-600" />,
        title: "Menunggu Pembayaran",
        description: `Menunggu konfirmasi pembayaran... (${pollingAttempts}/36)`,
        variant: "default" as const,
      },
      success: {
        icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
        title: "Pembayaran Berhasil!",
        description: "Top up telah berhasil diproses",
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Top Up Saldo</h1>
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
              className="w-full"
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
                  Lanjutkan Pembayaran
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
    </div>
  );
}
