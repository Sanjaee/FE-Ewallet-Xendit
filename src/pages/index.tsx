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
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useToast } from "@/hooks/use-toast";
import { useAuth, getUserData, removeAuthToken } from "@/utils/auth";
import { getBalance, getTransactions } from "@/utils/api";
import { Transaction, User } from "@/types"; // Asumsikan User type juga ada di @/types
import { FiCopy } from "react-icons/fi";

// Interface HomeProps tidak lagi diperlukan jika tidak ada props khusus server-side
// interface HomeProps {
//   isAuthenticated?: boolean;
// }

export default function HomePage() { // Mengganti nama 'Home' menjadi 'HomePage' untuk kejelasan
  const [balance, setBalance] = useState<number | null>(null); // Ubah ke null untuk loading state
  const [transactions, setTransactions] = useState<Transaction[] | null>(null); // Ubah ke null
  const [userData, setUserDataState] = useState<Partial<User> | null>(null); // State untuk user data
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();
  const { getAuthToken } = useAuth(); // useAuth akan menangani redirect jika tidak terotentikasi

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      // useAuth hook seharusnya sudah menangani ini, tapi sebagai fallback
      router.push("/auth/login");
      return;
    }

    const currentUserData = getUserData(); // Ambil data user dari localStorage
    setUserDataState(currentUserData);

    const fetchData = async () => {
      setLoading(true); // Pastikan loading true di awal fetch
      try {
        const [balanceResponse, transactionsResponse] = await Promise.all([
          getBalance(),
          getTransactions(1, 3), // Mengambil 3 transaksi terbaru untuk demo skeleton
        ]);

        setBalance(balanceResponse.data.balance);
        setTransactions(transactionsResponse.data.transactions || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet data. Please try again later.",
          variant: "destructive",
        });
        // Jika error, set data ke nilai default agar tidak null terus
        setBalance(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, toast, getAuthToken]); // getAuthToken sebagai dependency


  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user");
    toast({title: "Logged Out", description: "You have been successfully logged out."});
    router.push("/auth/login");
  };

  const formatTransactionType = (type: string): string => {
    const types: Record<string, string> = {
      TOPUP: "Top Up",
      TRANSFER: "Transfer",
      WITHDRAW: "Withdrawal",
      FEE: "Fee",
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
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

  // Komponen Skeleton untuk Welcome Card
  const WelcomeCardSkeleton = () => (
    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" /> {/* Skeleton untuk CardTitle */}
        <Skeleton className="h-6 w-full" /> {/* Skeleton untuk CardDescription */}
      </CardHeader>
      <CardContent>
        <div className="bg-primary/10 p-6 rounded-lg">
          <Skeleton className="h-4 w-1/4 mb-2" /> {/* Skeleton untuk "Current Balance" */}
          <Skeleton className="h-10 w-1/2" /> {/* Skeleton untuk jumlah balance */}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-24" /> {/* Skeleton untuk tombol */}
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );

  // Komponen Skeleton untuk Recent Transactions
  const TransactionsCardSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-1/2 mb-2" /> {/* Skeleton untuk CardTitle */}
        <Skeleton className="h-5 w-3/4" /> {/* Skeleton untuk CardDescription */}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => ( // Membuat 3 item skeleton transaksi
            <div key={index} className="flex justify-between items-center border-b pb-2">
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" /> {/* Skeleton untuk tipe transaksi */}
                <Skeleton className="h-4 w-32" /> {/* Skeleton untuk tanggal */}
              </div>
              <Skeleton className="h-6 w-20" /> {/* Skeleton untuk jumlah transaksi */}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" /> {/* Skeleton untuk tombol View All */}
      </CardFooter>
    </Card>
  );


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        {loading ? (
            <Skeleton className="h-9 w-1/2" />
        ) : (
            <h1 className="text-3xl font-bold">E-Wallet Dashboard</h1>
        )}
        <Button variant="outline" onClick={handleLogout} disabled={loading}>
          Logout
        </Button>
      </div>

      {loading ? (
        <>
          <WelcomeCardSkeleton />
          <TransactionsCardSkeleton />
        </>
      ) : (
        <>
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
                    onKeyDown={(e) => e.key === 'Enter' && copyPhoneNumber()}
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
              <Button className="w-full sm:w-auto" onClick={() => router.push("/wallet/topup")}>
                Top Up
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => router.push("/wallet/transfer")}>
                Transfer
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => router.push("/wallet/withdraw")}>
                Withdraw
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest wallet activities</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions === null || transactions.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  {transactions === null ? 'Loading transactions...' : 'No transactions yet'}
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
                          <p className="text-xs text-gray-500 mt-0.5">{transaction.description}</p>
                        )}
                      </div>
                      <div
                        className={`font-semibold ${
                          ["TOPUP", "TRANSFER_IN"].includes(transaction.type) // Asumsi ada TRANSFER_IN
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/transactions')} // Arahkan ke halaman semua transaksi
              >
                View All Transactions
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}