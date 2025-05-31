// pages/auth/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { login as loginApi } from '@/utils/api'; // Ganti nama import jika 'login' sudah digunakan
import { setAuthToken, setUserData, useGuest } from '@/utils/auth';
import { LoginData } from '@/types';
import { Eye, EyeOff } from 'lucide-react'; // Import ikon mata

export default function LoginPage() { // Ubah nama komponen agar lebih deskriptif
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false); // State untuk visibility password
  const router = useRouter();
  const { toast } = useToast();

  useGuest(); // Redirect jika sudah login

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginApi(formData); // Menggunakan loginApi

      // Periksa apakah response.data ada dan memiliki token
      if (response.data && response.data.token) {
        setAuthToken(response.data.token);
        setUserData({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
          isVerified: response.data.isVerified, // Pastikan isVerified juga disimpan jika ada
        });

        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });

        router.push('/'); // Arahkan ke halaman utama
      } else if (response.needsVerification && response.email) {
        // Backend menandakan user belum terverifikasi
        toast({
          title: 'Account Not Verified',
          description: response.error || 'Please verify your email first. Redirecting to OTP page...',
        });
        router.push(`/auth/verify-otp?email=${encodeURIComponent(response.email)}`);
      }
      else {
        // Handle error lain dari backend jika tidak ada token dan bukan needsVerification
        throw new Error(response.error || 'Invalid login response from server.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Invalid email or password.';

      if (error.response?.data?.needsVerification && error.response?.data?.email) {
          toast({
            title: 'Account Not Verified',
            description: errorMessage + ' Redirecting to OTP page...',
          });
          router.push(`/auth/verify-otp?email=${encodeURIComponent(error.response.data.email)}`);
      } else {
          toast({
            title: 'Login Failed',
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
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your wallet</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* Link Forgot Password */}
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              {/* Input Password dengan Tombol Show/Hide */}
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} // Dinamis tipe input
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pr-10" // Tambahkan padding kanan untuk ikon
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-8">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-sm text-center">
              Don&apos;t have an account?{' '} {/* Menggunakan &apos; untuk apostrof dalam JSX */}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}