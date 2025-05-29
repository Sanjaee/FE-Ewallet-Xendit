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
import { useToast } from "@/hooks/use-toast";
import { useAuth, getUserData, removeAuthToken } from "@/utils/auth";
import { getBalance, getTransactions } from "@/utils/api";
import { Transaction } from "@/types";
import { FiCopy } from "react-icons/fi";

interface HomeProps {
  isAuthenticated?: boolean;
}

export default function Home({ isAuthenticated }: HomeProps) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();
  const { getAuthToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();

        if (!token) {
          router.push("/auth/login");
          return;
        }

        const [balanceResponse, transactionsResponse] = await Promise.all([
          getBalance(),
          getTransactions(1, 5),
        ]);

        setBalance(balanceResponse.data.balance);
        setTransactions(transactionsResponse.data.transactions || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, toast]);

  const userData = getUserData();
  console.log("User Data:", userData);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  // Function to format transaction type for display
  const formatTransactionType = (type: string): string => {
    const types: Record<string, string> = {
      TOPUP: "Top Up",
      TRANSFER: "Transfer",
      WITHDRAW: "Withdrawal",
      FEE: "Fee",
    };
    return types[type] || type;
  };

  const copyPhoneNumber = () => {
    if (userData?.phoneNumber) {
      navigator.clipboard.writeText(userData.phoneNumber);
      toast({
        title: "Copied",
        description: "Phone number copied to clipboard",
        variant: "default",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">E-Wallet Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {loading ? (
        <p>Loading your wallet information...</p>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {userData?.name || "User"}</CardTitle>
              <CardDescription className="flex items-center m,ml">
                Manage your e-wallet  <div
                  className="inline-flex items-center space-x-2  cursor-pointer select-none ml-2 "
                  onClick={copyPhoneNumber}
                  title="Click to copy phone number"
                >
                  <span className="text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded break-words">
                    {userData?.phoneNumber}
                  </span>
                  <FiCopy className="w-5 h-5 text-blue-600 hover:text-blue-800 transition" />
                </div>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="bg-primary/10 p-6 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <h2 className="text-4xl font-bold">
                  Rp {balance.toLocaleString()}
                </h2>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => router.push("/wallet/topup")}>
                Top Up
              </Button>
              <Button onClick={() => router.push("/wallet/transfer")}>
                Transfer
              </Button>
              <Button onClick={() => router.push("/wallet/withdraw")}>
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
              {transactions.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">
                          {formatTransactionType(transaction.type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                        {transaction.description && (
                          <p className="text-sm">{transaction.description}</p>
                        )}
                      </div>
                      <div
                        className={`font-semibold ${
                          transaction.type === "TOPUP"
                            ? "text-green-600"
                            : transaction.type === "WITHDRAW" ||
                              transaction.type === "TRANSFER" ||
                              transaction.type === "FEE"
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {transaction.type === "TOPUP"
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
                onClick={() =>
                  toast({
                    title: "Coming Soon",
                    description: "View all transactions feature is coming soon",
                  })
                }
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
