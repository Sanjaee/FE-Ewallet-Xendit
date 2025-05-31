// pages/index.tsx
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getUserData, removeAuthToken } from "@/utils/auth";
import { getBalance, getTransactions } from "@/utils/api"; // Asumsikan getTransactions(page, limit)
import { Transaction, User } from "@/types";
import { FiCopy, FiSmartphone } from "react-icons/fi";
import { IoLogoAndroid, IoLogoApple } from "react-icons/io5";

const RECENT_TRANSACTIONS_COUNT = 3;
const VIEW_ALL_TRANSACTIONS_COUNT = 20; // Jumlah transaksi yang ditampilkan saat "View All"

export default function HomePage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [userData, setUserDataState] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isShowingAll, setIsShowingAll] = useState<boolean>(false); // State baru
  const router = useRouter();
  const { toast } = useToast();
  const { getAuthToken } = useAuth();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const currentUserData = getUserData();
    setUserDataState(currentUserData);

    const initialFetchData = async () => {
      setLoading(true);
      try {
        const balanceResponse = await getBalance();
        setBalance(balanceResponse.data.balance);

        // Fetch initial recent transactions
        const transactionsResponse = await getTransactions(
          1,
          RECENT_TRANSACTIONS_COUNT
        );
        setTransactions(transactionsResponse.data.transactions || []);
        setIsShowingAll(false); // Pastikan kembali ke tampilan ringkasan saat data awal dimuat
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          title: "Error",
          description:
            "Failed to fetch initial wallet data. Please try again later.",
          variant: "destructive",
        });
        setBalance(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    initialFetchData();
  }, [router, toast, getAuthToken]); // getAuthToken mungkin tidak diperlukan jika hanya untuk inisialisasi

  const handleFetchTransactions = async (showAll: boolean) => {
    setLoading(true); // Gunakan loading state utama untuk indikasi
    try {
      const limit = showAll
        ? VIEW_ALL_TRANSACTIONS_COUNT
        : RECENT_TRANSACTIONS_COUNT;
      const response = await getTransactions(1, limit); // Ambil halaman pertama dengan limit yang sesuai
      setTransactions(response.data.transactions || []);
      setIsShowingAll(showAll);
    } catch (error) {
      console.error(
        `Error fetching ${showAll ? "all" : "recent"} transactions:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to fetch ${
          showAll ? "all" : "recent"
        } transactions.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push("/auth/login");
  };

  const formatTransactionType = (type: string): string => {
    const types: Record<string, string> = {
      TOPUP: "Top Up",
      TRANSFER: "Transfer",
      WITHDRAW: "Withdrawal",
      FEE: "Fee",
    };
    return (
      types[type] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
    );
  };

  const copyPhoneNumber = () => {
    if (userData?.phoneNumber) {
      navigator.clipboard.writeText(userData.phoneNumber);
      toast({
        title: "Copied!",
        description: "Phone number copied to clipboard.",
      });
    }
  };

  const WelcomeCardSkeleton = () => (
    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-6 w-full" />
      </CardHeader>
      <CardContent>
        <div className="bg-primary/10 p-6 rounded-lg">
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );

  const DownloadAppCard = () => {
    const handleDownloadAndroid = () => {
      toast({
        title: "Download Android App",
        description: "Android app download will start shortly. (Placeholder)",
      });
      window.open(
        "https://drive.google.com/file/d/1gk5ffm6brjlU-WJpXvh8XNncosZx2cOS/view?usp=drive_link",
        "_blank"
      );
    };

    const handleDownloadIOS = () => {
      toast({
        title: "Download iOS App",
        description: "iOS app download will start shortly. (Placeholder)",
      });
      window.open(
        "https://drive.google.com/file/d/1gk5ffm6brjlU-WJpXvh8XNncosZx2cOS/view?usp=drive_link",
        "_blank"
      );
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FiSmartphone className="h-6 w-6 text-primary" />
            <CardTitle>Get Our Mobile App</CardTitle>
          </div>
          <CardDescription>
            Access your e-wallet anytime, anywhere. Download the app for a
            seamless mobile experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={handleDownloadAndroid}
          >
            <IoLogoAndroid className="mr-2 h-5 w-5" />
            Download for Android
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={handleDownloadIOS}
          >
            <IoLogoApple className="mr-2 h-5 w-5" />
            Download for iOS
          </Button>
        </CardContent>
      </Card>
    );
  };

  const DownloadAppCardSkeleton = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-7 w-2/5" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5 mt-1" />
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );

  const TransactionsCardSkeleton = () => (
    // Skeleton ini akan tetap menampilkan 3 item karena ini untuk loading awal page
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-1/2 mb-2" />
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(RECENT_TRANSACTIONS_COUNT)].map(
            (
              _,
              index // Sesuaikan dengan jumlah awal
            ) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            )
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        {loading && !transactions ? ( // Hanya tampilkan skeleton judul jika data utama belum ada
          <Skeleton className="h-9 w-1/2" />
        ) : (
          <h1 className="text-3xl font-bold">E-Wallet Dashboard</h1>
        )}
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loading && !transactions}
        >
          Logout
        </Button>
      </div>

      {loading && !transactions ? ( // Skeleton utama hanya saat data awal belum ada
        <>
          <WelcomeCardSkeleton />
          <DownloadAppCardSkeleton />
          <TransactionsCardSkeleton />
        </>
      ) : (
        <>
          {/* Welcome Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {userData?.name || "User"}</CardTitle>
              <CardDescription className="flex items-center">
                Manage your e-wallet
                {userData?.phoneNumber && (
                  <div
                    className="inline-flex items-center space-x-1.5 cursor-pointer select-none ml-2 group"
                    onClick={copyPhoneNumber}
                    title="Click to copy phone number"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && copyPhoneNumber()}
                  >
                    <span className="text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded break-all group-hover:bg-primary/20 transition-colors">
                      {userData.phoneNumber}
                    </span>
                    <FiCopy className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" />
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/10 p-6 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <h2 className="text-4xl font-bold">
                  Rp {balance !== null ? balance.toLocaleString() : "0"}
                </h2>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
              <Button
                className="w-full sm:w-auto"
                onClick={() => router.push("/wallet/topup")}
              >
                Top Up
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => router.push("/wallet/transfer")}
              >
                Transfer
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => router.push("/wallet/withdraw")}
              >
                Withdraw
              </Button>
            </CardFooter>
          </Card>

          <DownloadAppCard />

          {/* Recent Transactions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                {isShowingAll
                  ? `Showing last ${VIEW_ALL_TRANSACTIONS_COUNT} transactions`
                  : `Your latest ${RECENT_TRANSACTIONS_COUNT} wallet activities`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && transactions ? ( // Indikator loading inline saat memuat lebih banyak/sedikit transaksi
                <div className="text-center py-4 text-muted-foreground">
                  Loading transactions...
                </div>
              ) : transactions === null || transactions.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  {transactions === null
                    ? "Loading transactions..."
                    : "No transactions yet"}
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">
                          {formatTransactionType(transaction.type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={`font-semibold ${
                          ["TOPUP", "TRANSFER_IN"].includes(transaction.type)
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        }`}
                      >
                        {["TOPUP", "TRANSFER_IN"].includes(transaction.type)
                          ? `+Rp ${transaction.amount.toLocaleString()}`
                          : `-Rp ${transaction.amount.toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!isShowingAll ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleFetchTransactions(true)}
                  disabled={loading}
                >
                  View More Transactions
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleFetchTransactions(false)}
                  disabled={loading}
                >
                  Show Less Transactions
                </Button>
              )}
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
