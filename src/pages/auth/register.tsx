// src/pages/auth/register.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
import { useToast } from "@/hooks/use-toast";
import { register as registerApi, resendOtp, ResendOtpData } from "@/utils/api";
import { useGuest } from "@/utils/auth";
import { RegisterData } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [redirectMessage, setRedirectMessage] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  useGuest();

  useEffect(() => {
    // Check for redirect message in URL
    const { message } = router.query;
    if (message) {
      setRedirectMessage(decodeURIComponent(message as string));
      // Clear the message from URL after showing it
      router.replace("/auth/register", undefined, { shallow: true });
    }
  }, [router.query]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (!validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await registerApi(formData);

      toast({
        title: "Registration Submitted",
        description:
          response.message || "Please check your email to verify your account.",
      });
      router.push(
        `/auth/verify-otp?email=${encodeURIComponent(formData.email)}`
      );
    } catch (error: any) {
      console.error("Registration attempt error:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Something went wrong. Please try again.";

      if (errorMessage.toLowerCase().includes("email already exists")) {
        // Email sudah ada, coba kirim ulang OTP dan periksa status verifikasi
        try {
          const resendData: ResendOtpData = {
            email: formData.email,
            type: "VERIFICATION",
          };
          await resendOtp(resendData); // Jika berhasil, user belum terverifikasi, OTP dikirim ulang
          toast({
            title: "Account Exists & OTP Resent",
            description:
              "This email is registered but not verified. A new OTP has been sent. Please check your email.",
          });
          router.push(
            `/auth/verify-otp?email=${encodeURIComponent(formData.email)}`
          );
        } catch (resendError: any) {
          console.error(
            "Error during OTP resend on registration for existing email:",
            resendError
          );
          const resendErrorMessage =
            resendError.response?.data?.error ||
            "Failed to process existing account.";

          if (resendErrorMessage.toLowerCase().includes("already verified")) {
            // User sudah terdaftar DAN sudah terverifikasi
            toast({
              title: "Account Already Verified",
              description:
                "This email is already registered and verified. Please login.",
              variant: "default", // Atau 'info'
            });
            // Tidak redirect ke verify-otp, mungkin redirect ke login atau biarkan di halaman register
            // router.push('/auth/login'); // Opsional: arahkan ke halaman login
          } else {
            // Error lain saat resendOtp, atau user tidak ditemukan oleh resendOtp (seharusnya tidak terjadi)
            // Sebagai fallback, arahkan ke halaman verifikasi karena OTP awal mungkin sudah dikirim
            // atau pengguna bisa mencoba resend manual dari halaman verifikasi.
            toast({
              title: "Account Exists",
              description:
                "This email is registered. Please proceed to OTP verification or try resending OTP from the verification page.",
              variant: "default",
            });
            router.push(
              `/auth/verify-otp?email=${encodeURIComponent(formData.email)}`
            );
          }
        }
      } else {
        // Error registrasi lainnya
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Buat Akun</CardTitle>
          <CardDescription>Masukkan data diri Anda</CardDescription>
        </CardHeader>
        <div className="px-6 ">
          <Alert className="mb-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
              Gunakan email aktif untuk menerima kode OTP verifikasi. untuk mencegah cloning akun.
            </AlertDescription>
          </Alert>
        </div>
        {redirectMessage && (
          <div className="px-6">
            <Alert className="mb-3">
              <Info className="h-4 w-4" />
              <AlertDescription>{redirectMessage}</AlertDescription>
            </Alert>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@anda.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {emailError && (
                <Alert variant="destructive" className="mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Nomor Telepon</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="+62812345678"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 mt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </Button>
            <p className="text-sm text-center">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline"
              >
                Masuk
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
