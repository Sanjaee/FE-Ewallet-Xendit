// src/pages/auth/register.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { register as registerApi, resendOtp, ResendOtpData } from '@/utils/api';
import { useGuest } from '@/utils/auth';
import { RegisterData } from '@/types';

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();

  useGuest();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await registerApi(formData);

      toast({
        title: 'Registration Submitted',
        description: response.message || 'Please check your email to verify your account.',
      });
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);

    } catch (error: any) {
      console.error('Registration attempt error:', error);
      const errorMessage = error.response?.data?.error || 'Something went wrong. Please try again.';

      if (errorMessage.toLowerCase().includes('email already exists')) {
        // Email sudah ada, coba kirim ulang OTP dan periksa status verifikasi
        try {
          const resendData: ResendOtpData = { email: formData.email, type: "VERIFICATION" };
          await resendOtp(resendData); // Jika berhasil, user belum terverifikasi, OTP dikirim ulang
          toast({
            title: 'Account Exists & OTP Resent',
            description: 'This email is registered but not verified. A new OTP has been sent. Please check your email.',
          });
          router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
        } catch (resendError: any) {
          console.error('Error during OTP resend on registration for existing email:', resendError);
          const resendErrorMessage = resendError.response?.data?.error || 'Failed to process existing account.';

          if (resendErrorMessage.toLowerCase().includes('already verified')) {
            // User sudah terdaftar DAN sudah terverifikasi
            toast({
              title: 'Account Already Verified',
              description: 'This email is already registered and verified. Please login.',
              variant: 'default', // Atau 'info'
            });
            // Tidak redirect ke verify-otp, mungkin redirect ke login atau biarkan di halaman register
            // router.push('/auth/login'); // Opsional: arahkan ke halaman login
          } else {
            // Error lain saat resendOtp, atau user tidak ditemukan oleh resendOtp (seharusnya tidak terjadi)
            // Sebagai fallback, arahkan ke halaman verifikasi karena OTP awal mungkin sudah dikirim
            // atau pengguna bisa mencoba resend manual dari halaman verifikasi.
            toast({
              title: 'Account Exists',
              description: 'This email is registered. Please proceed to OTP verification or try resending OTP from the verification page.',
              variant: 'default',
            });
            router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
          }
        }
      } else {
        // Error registrasi lainnya
        toast({
          title: 'Registration Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details to register</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
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
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
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
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Register'}
            </Button>
            <p className="text-sm text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}