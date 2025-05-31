// pages/wallet/transfer.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/utils/auth";
import { transferFunds, getBalance } from "@/utils/api";
import { TransferDetails } from "@/types";
import { ApiError } from "@/types/error";

export default function Transfer() {
  const [balance, setBalance] = useState<number>(0);
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [transferDetails, setTransferDetails] =
    useState<TransferDetails | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const {} = useAuth();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await getBalance();
        setBalance(response.data.balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet balance",
          variant: "destructive",
        });
      }
    };

    fetchBalance();
  }, [toast, getBalance]);

  const handleInitiateTransfer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);

    if (!recipientPhone) {
      toast({
        title: "Error",
        description: "Masukkan nomor telepon penerima",
        variant: "destructive",
      });
      return;
    }

    if (!amountValue || amountValue <= 0) {
      toast({
        title: "Error",
        description: "Masukkan jumlah yang valid",
        variant: "destructive",
      });
      return;
    }

    const fee = amountValue * 0.01;
    const totalAmount = amountValue + fee;

    if (totalAmount > balance) {
      toast({
        title: "Saldo Tidak Cukup",
        description: `Kamu butuh Rp ${totalAmount.toLocaleString()} termasuk biaya, saldo kamu Rp ${balance.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    setTransferDetails({
      recipientPhoneNumber: recipientPhone,
      amount: amountValue,
      fee,
      total: totalAmount,
      description: description || "Transfer ke pengguna",
      recipientName: "", // Set as empty string initially
    });

    setConfirmOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferDetails) return;

    setLoading(true);

    try {
      const response = await transferFunds({
        recipientPhoneNumber: transferDetails.recipientPhoneNumber,
        amount: transferDetails.amount,
        description: transferDetails.description,
      });

      toast({
        title: "Transfer Berhasil",
        description: `Berhasil mengirim Rp ${transferDetails.amount.toLocaleString()} ke ${
          response.data.recipientName || "penerima"
        }`,
      });

      setConfirmOpen(false);
      router.push("/");
    } catch (error: unknown) {
      console.error("Transfer error:", error);

      const apiError = error as ApiError;
      toast({
        title: "Transfer Gagal",
        description:
          apiError.response?.data?.error || "Gagal melakukan transfer",
        variant: "destructive",
      });

      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/")}>
          ← Kembali ke Dashboard
        </Button>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Transfer Saldo</CardTitle>
          <CardDescription>
            Kirim uang ke nomor telepon pengguna lain
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleInitiateTransfer}>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 p-4 rounded mb-4">
              <p className="text-sm text-muted-foreground">Saldo Tersedia</p>
              <p className="text-xl font-semibold">
                Rp {balance.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Nomor Telepon Penerima</Label>
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Transfer</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Minimal Rp 1.000"
                min="1000"
                required
              />
              <p className="text-xs text-muted-foreground">
                Biaya administrasi 1% dari jumlah transfer
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Misal: Uang makan"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Lanjutkan
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Transfer</DialogTitle>
            <DialogDescription>
              Pastikan semua detail sudah benar
            </DialogDescription>
          </DialogHeader>

          {transferDetails && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nomor Telepon:</span>
                <span className="font-medium">
                  {transferDetails.recipientPhoneNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah:</span>
                <span className="font-medium">
                  Rp {transferDetails.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya (1%):</span>
                <span className="font-medium">
                  Rp {transferDetails.fee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground font-medium">
                  Total:
                </span>
                <span className="font-bold">
                  Rp {transferDetails.total.toLocaleString()}
                </span>
              </div>
              {transferDetails.description && (
                <div className="pt-2">
                  <span className="text-muted-foreground">Deskripsi:</span>
                  <p className="mt-1">{transferDetails.description}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleTransfer} disabled={loading}>
              {loading ? "Memproses..." : "Konfirmasi Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
