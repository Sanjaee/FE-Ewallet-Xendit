// src/pages/auth/verify-otp.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { verifyOtp, resendOtp } from '@/utils/api';
import { setAuthToken, setUserData, useGuest } from '@/utils/auth';
import { VerifyOtpData, ResendOtpData } from '@/types';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [otp, setOtp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0); // Untuk cooldown resend OTP

  useGuest(); // Jika sudah login, redirect

  useEffect(() => {
    if (router.isReady) {
      const queryEmail = router.query.email as string;
      if (queryEmail) {
        setEmail(decodeURIComponent(queryEmail));
      } else {
        // Jika tidak ada email di query, mungkin redirect ke login atau register
        toast({
          title: 'Error',
          description: 'Email not provided for OTP verification.',
          variant: 'destructive',
        });
        router.push('/auth/login');
      }
    }
  }, [router.isReady, router.query, toast, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Hanya angka
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || otp.length !== 6) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid 6-digit OTP.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const otpData: VerifyOtpData = { email, otp };

    try {
      const response = await verifyOtp(otpData);
      if (response.data && response.data.token) {
        setAuthToken(response.data.token);
        setUserData({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
          isVerified: response.data.isVerified,
        });
        toast({
          title: 'Verification Successful',
          description: response.message || 'Your account has been verified.',
        });
        router.push('/'); // Arahkan ke halaman utama
      } else {
         throw new Error(response.error || 'Verification failed.');
      }
    } catch (error: any) {
      console.error('OTP Verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.error || error.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || countdown > 0) return;

    setResendLoading(true);
    const resendData: ResendOtpData = { email, type: "VERIFICATION" };

    try {
      const response = await resendOtp(resendData);
      toast({
        title: 'OTP Resent',
        description: response.message || 'A new OTP has been sent to your email.',
      });
      setCountdown(60); // Cooldown 60 detik
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast({
        title: 'Failed to Resend OTP',
        description: error.response?.data?.error || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>; // Atau UI skeleton
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            An OTP has been sent to <strong>{email}</strong>. Please enter it below.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password (OTP)</Label>
              <Input
                id="otp"
                name="otp"
                type="text" // Biarkan text agar bisa lihat, atau "tel" untuk numeric keyboard
                inputMode="numeric" // Membantu di mobile
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={handleResendOtp}
              disabled={resendLoading || countdown > 0}
              className="w-full"
            >
              {resendLoading
                ? 'Sending...'
                : countdown > 0
                ? `Resend OTP in ${countdown}s`
                : 'Resend OTP'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}